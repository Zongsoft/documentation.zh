---
description: 理解 Zongsoft.Services.Distributing 分布式锁抽象，以及 Redis 插件中的实现和使用方式。
icon: lock
---

# 分布式锁

`Zongsoft.Services.Distributing` 提供分布式锁的核心抽象，用来在多进程、多实例或多节点部署中保护同一份外部资源。它只定义锁管理器、锁对象和令牌生成器；具体存储和竞争策略由外部插件实现，例如 Redis 插件中的 [`RedisService`](https://github.com/Zongsoft/framework/blob/main/externals/redis/src/RedisService.DistributedLock.cs)。

分布式锁适合保护“跨进程只能有一个执行者”的短时临界区，例如刷新外部凭证、重建共享缓存、执行一次性调度任务、迁移状态或写入不支持并发更新的外部资源。它不适合替代数据库事务，也不应包住长时间业务流程。

## 核心类型

| 类型 | 职责 |
| --- | --- |
| [`IDistributedLockManager`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/IDistributedLockManager.cs) | 分布式锁管理器，负责获取锁、查询锁剩余有效期、按令牌释放锁。 |
| [`IDistributedLock`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/IDistributedLock.cs) | 一次锁获取操作的句柄，记录锁键、令牌、持有状态和过期状态，并在释放时通知管理器。 |
| [`IDistributedLockTokenizer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/IDistributedLockTokenizer.cs) | 锁令牌生成器，生成用于标识锁持有者的 token，并把 token 转成可读文本。 |
| [`DistributedLockBase<TManager>`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/DistributedLockBase.cs) | 锁对象基类，封装等待进入、状态判断、同步/异步释放等通用逻辑。 |
| [`DistributedLockTokenizer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/DistributedLockTokenizer.cs) | 内置令牌生成器，提供 `Guid` 和 `Random` 两种 token 方案。 |

`IDistributedLockManager` 的三个操作构成了完整生命周期：

1. `AcquireAsync(key, expiry)`：尝试为指定键创建带过期时间的锁。
2. `GetExpiryAsync(key)`：查询当前锁的剩余有效期，供等待逻辑决定下一次尝试时间。
3. `ReleaseAsync(key, token)`：只有 token 匹配时才释放锁，避免误删其他调用方后来获得的锁。

{% hint style="info" %}
`expiry` 是锁的租约时间，不是业务超时时间。业务代码必须确保临界区通常能在租约内完成；如果执行时间可能超过租约，需要重新设计流程，或实现支持续租的管理器。
{% endhint %}

## 锁对象状态

`IDistributedLock` 暴露了几组状态属性，调用方可以据此决定是否进入、等待或放弃：

| 属性 | 含义 |
| --- | --- |
| `Key` | 锁键，表示被保护的资源。 |
| `Token` | 当前锁句柄持有的令牌，释放时必须带回同一个 token。 |
| `IsHeld` | 当前句柄是否已经持有锁。 |
| `IsUnheld` | 当前句柄是否尚未持有锁。 |
| `IsExpired` | 当前句柄记录的持有时间是否已经超过租约。 |
| `IsLocked` | 已持有且未过期。 |
| `IsUnlocked` | 未持有或已过期。 |

[`DistributedLockBase<TManager>`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/DistributedLockBase.cs) 的 `EnterAsync()` 会在未持有时进入等待循环：先读取锁键的剩余 TTL；如果 TTL 大于零，就等待这段时间；然后再次尝试获取锁。获取成功后记录持有时间。

{% code title="DistributedLockBase.cs" %}
```csharp
while(this.IsUnheld)
{
	var expiry = await manager.GetExpiryAsync(this.Key, cancellation);

	if(expiry.HasValue && expiry.Value > TimeSpan.Zero)
		await Task.Delay(expiry.Value, cancellation);

	if(await this.OnEnterAsync(cancellation))
		_heldTime = DateTime.UtcNow;
}
```
{% endcode %}

释放由 `Dispose()`、`DisposeAsync()` 或 `ExitAsync()` 触发。只有句柄曾经持有锁时，才会调用管理器的 `ReleaseAsync(Key, Token)`。

## 基本用法

最常见的用法是获取锁句柄后调用 `EnterAsync()`，让调用方等待到真正进入临界区，再执行受保护逻辑。

{% code title="RefreshCredential.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Services.Distributing;

public class CredentialRefresher
{
	[ServiceDependency(IsRequired = true)]
	public IDistributedLockManager Locks { get; set; }

	public async ValueTask RefreshAsync(string account, CancellationToken cancellation)
	{
		var key = $"Zongsoft:Credential:{account}:LOCKER";

		var locker = await this.Locks.AcquireAsync(key, TimeSpan.FromSeconds(10), cancellation);
		if(locker == null)
			return;

		await using(locker)
		{
			await locker.EnterAsync(cancellation);

			// 在这里刷新外部凭证、写入分布式缓存或更新共享状态。
		}
	}
}
```
{% endcode %}

如果业务不希望等待，可以只尝试获取一次，然后检查 `IsHeld`。这适合“有人正在做就跳过”的场景。

{% code title="TryRefreshCredential.cs" %}
```csharp
await using var locker = await manager.AcquireAsync(key, TimeSpan.FromSeconds(10), cancellation);

if(locker == null || !locker.IsHeld)
	return;

// 只有当前调用方抢到锁时才执行。
```
{% endcode %}

{% hint style="warning" %}
不同实现对“未立即获得锁”的返回策略可能不同。Redis 实现当前会返回一个未持有的锁句柄，而不是返回空；因此不调用 `EnterAsync()` 时必须检查 `IsHeld`。
{% endhint %}

## Redis 实现

Redis 插件中的 [`RedisService`](https://github.com/Zongsoft/framework/blob/main/externals/redis/src/RedisService.DistributedLock.cs) 实现了 `IDistributedLockManager`。它使用 Redis 字符串键保存锁 token，并给键设置过期时间。

获取锁时，Redis 实现会执行等价于“仅当键不存在时设置值”的操作：

{% code title="RedisService.DistributedLock.cs" %}
```csharp
var tokenizer = this.Tokenizer ??= DistributedLockTokenizer.Random;
var token = tokenizer.Tokenize();

return await _database.StringSetAsync(GetKey(key), token, expiry, When.NotExists, CommandFlags.None) ?
	new DistributedLock(this, key, token, expiry, true) :
	new DistributedLock(this, key, token, expiry, false);
```
{% endcode %}

释放锁时，它使用 Lua 脚本先比较当前键值是否等于调用方 token，匹配才删除：

{% code title="RedisRelease.lua" %}
```lua
if redis.call('get', KEYS[1])==ARGV[1] then
	return redis.call('del', KEYS[1])
else
	return 0
end
```
{% endcode %}

这种 token 校验是分布式锁安全释放的关键。如果锁已经过期并被其他调用方重新获得，旧调用方即使后来执行释放，也不会删除新调用方的锁。

Redis 锁键还会经过 `RedisService.Namespace` 前缀处理：

{% code title="RedisService.cs" %}
```csharp
private string GetKey(string key) =>
	string.IsNullOrEmpty(_namespace) ? key : $"{_namespace}:{key}";
```
{% endcode %}

因此，同一 Redis 连接可以通过不同命名空间隔离不同应用或模块的锁键。

## 获取 Redis 锁管理器

Redis 插件通过 [`RedisServiceProvider`](https://github.com/Zongsoft/framework/blob/main/externals/redis/src/RedisServiceProvider.cs) 注册了多个命名服务提供器，其中包括 `IServiceProvider<IDistributedLockManager>`：

{% code title="RedisServiceProvider.cs" %}
```csharp
[Service(
	typeof(IServiceProvider<ISequence>),
	typeof(IServiceProvider<ISequenceBase>),
	typeof(IServiceProvider<IDistributedCache>),
	typeof(IServiceProvider<IDistributedLockManager>))]
public class RedisServiceProvider :
	IServiceProvider<ISequence>,
	IServiceProvider<ISequenceBase>,
	IServiceProvider<IDistributedCache>,
	IServiceProvider<IDistributedLockManager>
{
	IDistributedLockManager IServiceProvider<IDistributedLockManager>.GetService(string name) => GetRedis(name);
}
```
{% endcode %}

调用方通常先解析 `IServiceProvider<IDistributedLockManager>`，再按 Redis 连接名取得具体管理器：

{% code title="GetRedisLockManager.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Services.Distributing;

var provider = ApplicationContext.Current.Services.Resolve<IServiceProvider<IDistributedLockManager>>();
var manager = provider?.GetService("local");
```
{% endcode %}

如果名称为空或指定名称不存在，`RedisServiceProvider.GetRedis(...)` 会尝试使用 `/Externals/Redis/ConnectionSettings` 下的默认连接设置；缺失时抛出配置异常。

## 配置和插件

Redis 插件文件会声明 `Zongsoft.Externals.Redis` 程序集，并挂载 Redis 服务提供器、连接设置驱动和 Redis 终端命令。

{% code title="Zongsoft.Externals.Redis.plugin" %}
```xml
<extension path="/Workspace/Externals/Redis">
	<object name="RedisProvider" type="Zongsoft.Externals.Redis.RedisServiceProvider, Zongsoft.Externals.Redis" />
</extension>

<extension path="/Workbench/Configuration/ConnectionSettings/Drivers">
	<object name="Redis" value="{static:Zongsoft.Externals.Redis.Configuration.RedisConnectionSettingsDriver.Instance, Zongsoft.Externals.Redis}" />
</extension>
```
{% endcode %}

连接设置位于 `/Externals/Redis/ConnectionSettings`，示例：

{% code title="Zongsoft.Externals.Redis.option" %}
```xml
<options>
	<option path="/Externals/Redis">
		<connectionSettings>
			<connectionSetting connectionSetting.name="local" driver="redis"
			                   value="server=127.0.0.1;port=6379;password=" />
		</connectionSettings>
	</option>
</options>
```
{% endcode %}

部署时需要确保 Redis 插件已随宿主加载，并且对应的 `.option` 配置进入应用配置源。

## 真实场景

[`CredentialManager`](https://github.com/Zongsoft/framework/blob/main/externals/wechat/src/CredentialManager.cs) 使用分布式锁保护微信凭证和票据刷新。它先按缓存名取得 `IDistributedLockManager`，然后用 `key + ":LOCKER"` 作为锁键。

{% code title="CredentialManager.cs" %}
```csharp
public static IDistributedLockManager Locker
{
	get => _locker ??= ApplicationContext.Current.Services
		.Resolve<IServiceProvider<IDistributedLockManager>>()?
		.GetService(GetCacheName());
	set => _locker = value;
}
```
{% endcode %}

刷新凭证时，它用短租约避免多个节点同时请求微信接口：

{% code title="CredentialManager.GetCredentialAsync.cs" %}
```csharp
using var locker = await Locker.AcquireAsync(key + ":LOCKER", TimeSpan.FromSeconds(5), cancellation);

if(locker != null)
{
	token = await AcquireCredentialAsync(account.Code, account.Secret);

	if(cache.SetValue(key, token.Key, token.Expiry.GetPeriod()))
		_localCache[key] = token;

	return token.Key;
}
```
{% endcode %}

这个模式适合“只有一个节点负责刷新，其它节点稍后从缓存读取结果”的场景。调用方也可以在未获得锁时主动等待或重试缓存读取。

{% hint style="warning" %}
上面的真实代码只判断 `locker != null`。阅读 Redis 实现时要注意：Redis 当前会返回未持有的锁句柄，因此新代码如果采用“抢不到就跳过”模式，建议检查 `locker.IsHeld`；如果需要等待锁释放，则调用 `await locker.EnterAsync(cancellation)`。
{% endhint %}

## 使用建议

* 锁键要包含业务域和资源标识，例如 `Zongsoft.Wechat.Credential:{appId}:LOCKER`。
* 租约时间要略大于临界区常见耗时，但不要过长；锁过期是故障恢复手段，不是业务等待机制。
* 进入临界区后尽快完成工作，不要在锁内等待用户输入、长时间网络调用或大批量处理。
* 使用 `await using` 或 `using` 确保释放；异步流程优先使用 `await using`。
* 需要等待锁时调用 `EnterAsync()`；只尝试一次时检查 `IsHeld`。
* 释放锁必须带 token，不要直接删除 Redis 锁键。
* 业务写入的数据本身仍需幂等或可重试，分布式锁只能降低并发冲突，不能替代完整的一致性设计。

## 相关资源

* [Zongsoft.Services](../services.md)
* [构件与服务](../../plugins/builtins-and-services.md)
* [Redis 实现源码](https://github.com/Zongsoft/framework/blob/main/externals/redis/src/RedisService.DistributedLock.cs)
* [Redis 服务提供器源码](https://github.com/Zongsoft/framework/blob/main/externals/redis/src/RedisServiceProvider.cs)
* [分布式锁抽象源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Services/Distributing)
