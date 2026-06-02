---
description: MemoryCache 进程内缓存、过期策略、依赖令牌和淘汰事件。
icon: database
---

# MemoryCache

`MemoryCache` 是 `Zongsoft.Caching` 命名空间中的进程内缓存实现。它包装 `Microsoft.Extensions.Caching.Memory.MemoryCache`，并在此基础上增加 Zongsoft 风格的过期描述、依赖令牌、优先级、淘汰事件和数量限制提醒。

{% hint style="info" %}
`MemoryCache` 适合缓存进程内可重建的数据，例如元数据、描述符、解析结果或轻量对象。跨进程共享、分布式一致性和服务间缓存同步应使用 `IDistributedCache` 的具体实现。
{% endhint %}

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `MemoryCache` | 进程内缓存容器，提供读取、写入、删除、获取或创建、清理和事件通知。 |
| `MemoryCacheOptions` | 配置扫描频率和数量限制；`MemoryCache.Shared` 使用不可变选项。 |
| `MemoryCacheScanner` | 周期性调用 `Compact(0)`，触发过期项扫描。 |
| `MemoryCache.Expiration` | 描述滑动过期、绝对过期，或二者组合。 |
| `CachePriority` | 映射到底层缓存项优先级：`Low`、`Normal`、`High`、`NeverRemove`。 |
| `CacheEvictedEventArgs` | `Evicted` 事件参数，包含键、值、淘汰原因和状态对象。 |
| `CacheLimitedEventArgs` | `Limited` 事件参数，包含超出的数量和当前数量。 |

## 创建缓存

可以直接创建独立缓存实例，也可以使用共享实例。

{% code title="CreateMemoryCache.cs" %}
```csharp
using Zongsoft.Caching;

var cache = new MemoryCache(
	new MemoryCacheOptions(
		frequency: TimeSpan.FromMinutes(1),
		limit: 10_000));

var shared = MemoryCache.Shared;
```
{% endcode %}

`MemoryCache.Shared` 是全局共享实例，它的 `Options` 是不可变的，不能在运行时修改。

## 读取与写入

`SetValue` 用于直接写入缓存项，`GetValue` 和 `TryGetValue` 用于读取缓存项，`Remove` 用于删除缓存项。

{% code title="ReadWriteMemoryCache.cs" %}
```csharp
cache.SetValue("user:42", new UserProfile(42, "Alice"));

if(cache.TryGetValue<UserProfile>("user:42", out var profile))
	Console.WriteLine(profile.Name);

if(cache.Remove("user:42", out var removed))
	Console.WriteLine(removed);
```
{% endcode %}

当需要“没有就创建”的语义时，使用 `GetOrCreate` 或 `GetOrCreateAsync`。这些方法只有在键不存在时才调用工厂方法。

{% code title="GetOrCreateMemoryCache.cs" %}
```csharp
var profile = cache.GetOrCreate("user:42", key =>
{
	return (
		Value: LoadUserProfile((string)key),
		Expiration: TimeSpan.FromMinutes(10));
});
```
{% endcode %}

## 过期策略

`MemoryCache.Expiration` 可以表达滑动过期、绝对过期，或同时表达二者。

| 写法 | 说明 |
| --- | --- |
| `TimeSpan.FromMinutes(10)` | 滑动过期，缓存项在指定时长内未被访问才过期。 |
| `DateTimeOffset.UtcNow.AddHours(1)` | 绝对过期，缓存项到指定时间点后过期。 |
| `(TimeSpan.FromMinutes(10), DateTimeOffset.UtcNow.AddHours(1))` | 同时设置滑动过期和绝对过期。 |

{% code title="MemoryCacheExpiration.cs" %}
```csharp
cache.SetValue(
	"metadata:models",
	LoadModels(),
	new MemoryCache.Expiration(
		sliding: TimeSpan.FromMinutes(30),
		absolute: DateTimeOffset.UtcNow.AddHours(4)));
```
{% endcode %}

## 依赖令牌

缓存项可以依赖 `IChangeToken`。当令牌变更时，缓存项会被标记为失效，并触发淘汰回调。

{% code title="MemoryCacheDependency.cs" %}
```csharp
using Microsoft.Extensions.Primitives;
using Zongsoft.Caching;

using var cancellation = new CancellationTokenSource();
var token = new CancellationChangeToken(cancellation.Token);

cache.SetValue("settings", LoadSettings(), token);

cancellation.Cancel();
cache.Compact();
```
{% endcode %}

依赖失效对应的淘汰原因是 `CacheEvictedReason.Depended`。

## 事件

`MemoryCache` 提供两个事件：

| 事件 | 触发时机 |
| --- | --- |
| `Evicted` | 缓存项因为过期、依赖失效、删除、替换或容量压力被淘汰。 |
| `Limited` | 设置或创建缓存项后，当前数量超过 `MemoryCacheOptions.CountLimit`。 |

{% code title="MemoryCacheEvents.cs" %}
```csharp
cache.Evicted += (_, args) =>
{
	Console.WriteLine($"{args.Key} removed by {args.Reason}");
};

cache.Limited += (_, args) =>
{
	Console.WriteLine($"cache count: {args.Count}, overflow: {args.Limit}");
};
```
{% endcode %}

{% hint style="warning" %}
`CountLimit` 是 Zongsoft 层面的提醒阈值。超过阈值时会触发 `Limited` 事件，但不会自动删除缓存项；需要应用根据场景调用 `Compact`、`Clear` 或调整缓存写入策略。
{% endhint %}

## 清理与扫描

`Compact` 用于触发底层缓存清理。因为缓存项过期或依赖失效后不一定立即从底层容器中移除，主动调用 `Compact(0)` 可以促使缓存执行扫描。

`MemoryCacheScanner` 封装了一个定时器，按 `MemoryCacheOptions.ScanFrequency` 周期调用 `Compact(0)`。

{% code title="MemoryCacheScanner.cs" %}
```csharp
using var scanner = new MemoryCacheScanner(cache);

scanner.Start();

// ...

scanner.Stop();
```
{% endcode %}

## 相关资源

* [MemoryCache.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCache.cs)
* [MemoryCacheOptions.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCacheOptions.cs)
* [MemoryCacheScanner.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCacheScanner.cs)
* [MemoryCacheTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/MemoryCacheTest.cs)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
