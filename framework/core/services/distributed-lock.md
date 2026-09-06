---
description: 通过 Redis 多进程范例理解锁竞争、租约、续期、栅栏令牌与失去所有权后的处理。
icon: lock
---

# 分布式锁

Zongsoft.Services.Distributing 用来协调多个进程对同一资源的短时访问。Discussions 当前主要通过[数据库事务](../../data/transactions.md)维护主题、帖子和统计的一致性，没有直接使用分布式锁；本页采用 framework 中已有的 Redis 多进程范例和测试。

## 先区分三个概念

* **互斥**：同一锁键在有效期内只有一个持有者。锁键必须对应真实共享资源，不同进程使用不同键就无法互斥。
* **租约**：锁在服务端的有效时长。进程退出后服务端可以让锁自动过期，但租约结束不会中断旧进程里已经运行的代码。
* **栅栏令牌**：每次成功获取锁产生的递增编号。受保护的存储记录已经接受的最大编号，拒绝编号更小的迟到写入，从而限制失去锁的旧进程继续修改资源。

💡 锁协调执行者，事务保护数据库内的一组写入。需要同时保证多个表更新成功时，仍应使用事务；需要避免重复提交时，仍需幂等约束。

## 核心类型

| 类型 | 使用时关心的内容 |
| --- | --- |
| [IDistributedLockManager](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/IDistributedLockManager.cs) | AcquireAsync 获取句柄、GetExpiryAsync 查询剩余租约、ReleaseAsync 按所有权令牌释放。 |
| [IDistributedLock](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/IDistributedLock.cs) | EnterAsync 等待进入、RenewAsync 手动续期，释放句柄结束使用。 |
| [DistributedLockOptions](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/DistributedLockOptions.cs) | Expiry 必须为正；RenewalInterval 指定自动续期间隔。 |
| [DistributedLockBase](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/DistributedLockBase.cs) | 封装等待、持有时间、续期与释放；具体原子操作由实现负责。 |
| [IDistributedLockTokenizer](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/Distributing/IDistributedLockTokenizer.cs) | 生成字节所有权令牌 Token；这个随机令牌与递增的 FencingToken 用途不同。 |

## 锁对象状态

| 属性 | 含义 |
| --- | --- |
| Key / Token | 被保护的资源键，以及本次获取的所有权令牌。 |
| IsHeld / IsUnheld | 句柄是否记录为持有状态；IsHeld 本身不检查是否超过租约。 |
| IsExpired | 根据本地记录的持有时间判断是否过期。 |
| IsLocked / IsUnlocked | 是否持有且未过期，以及相反状态。 |
| FencingToken | 本次成功获取的栅栏令牌；Redis 获取失败为零，不支持该能力的其他实现也可以返回零。 |

这些状态不是对服务端所有权的实时强一致查询。进程暂停、网络延迟或服务端状态变化之后，本地判断不能替代受保护存储的校验。

## 基本用法

Redis 的 slaver 范例循环竞争同一锁，按配置选择普通租约或自动续期，并把命令取消与总超时合并。下面是循环内取得锁和等待进入的原始片段：

来源：[framework/externals/redis/samples/distributedlock/slaver/RunCommand.cs](https://github.com/Zongsoft/framework/blob/main/externals/redis/samples/distributedlock/slaver/RunCommand.cs#L24)（节选；上下文见源文件）。

{% code title="RunCommand.cs" %}
```csharp
await using var locker = settings.RenewalInterval.HasValue ?
	await redis.AcquireAsync(Utility.Keys.Lock, new DistributedLockOptions(settings.Expiry) { RenewalInterval = settings.RenewalInterval }, linked.Token) :
	await redis.AcquireAsync(Utility.Keys.Lock, settings.Expiry, linked.Token);
await locker.EnterAsync(linked.Token);
```
{% endcode %}

settings、redis 和 linked 由同一 OnExecuteAsync 方法建立。await using 的作用域是一轮循环；该轮完成或抛出异常后会释放锁。EnterAsync 在尚未持有时查询剩余租约并等待，再尝试获取；调用方应传入可取消的等待凭证。

如果不准备等待，应检查刚取得的句柄是否 IsLocked，再决定是否开始工作。Redis 当前获取失败会返回未持有句柄；只检查非空不足以证明抢到锁。框架测试明确验证了这个区别：

来源：[framework/externals/redis/test/RedisDistributedLockTests.cs](https://github.com/Zongsoft/framework/blob/main/externals/redis/test/RedisDistributedLockTests.cs#L40)（节选；上下文见源文件）。

{% code title="RedisDistributedLockTests.cs" %}
```csharp
await using var first = await cache.AcquireAsync(key, TimeSpan.FromSeconds(2));
Assert.True(first.IsLocked);
Assert.True(first.FencingToken > 0);

await using var rejected = await cache.AcquireAsync(key, TimeSpan.FromSeconds(2));
Assert.True(rejected.IsUnheld);
Assert.Equal(0, rejected.FencingToken);
```
{% endcode %}

该片段位于 SuccessfulAcquisitions_ReturnStrictlyIncreasingFencingTokens；完整测试还释放 first 后重新获取，并检查编号递增。cache 与 key 来自测试夹具，不是 Discussions 的配置。

## 续期与失去所有权

Redis 默认不自动续期。启用时，RenewalInterval 必须大于零且小于 Expiry；空值或零表示关闭，负值会被拒绝。实际测试以 300 毫秒租约、75 毫秒间隔演示续期：

来源：[framework/externals/redis/test/RedisDistributedLockTests.cs](https://github.com/Zongsoft/framework/blob/main/externals/redis/test/RedisDistributedLockTests.cs#L111)（节选；上下文见源文件）。

{% code title="RedisDistributedLockTests.cs" %}
```csharp
var options = new DistributedLockOptions(TimeSpan.FromMilliseconds(300))
{
	RenewalInterval = TimeSpan.FromMilliseconds(75),
};
await using var renewed = await cache.AcquireAsync("automatic", options);
```
{% endcode %}

这些较短时长用于测试，生产环境应根据调度延迟和网络往返设置。Redis 在首次获取成功或 EnterAsync 竞争成功后启动续期循环；释放句柄时停止并等待循环结束。

手动 RenewAsync 成功会重置本地持有时间；返回 false 时调用者应停止受保护操作。自动续期循环遇到失败或异常会结束，异常路径记录日志并清除持有状态。手动调用抛出异常时，同样应按所有权不确定处理，不能因为本地状态暂时仍为持有就继续写入。

{% hint style="warning" %}
🚨 当前基类的 EnterAsync 仅在 IsUnheld 时尝试获取。一个已经过期、但仍记录为 IsHeld 的旧句柄，不会通过再次 EnterAsync 自动获得新租约。应结束旧作用域，重新获取句柄。续期也不会自动取消已经开始的业务工作。
{% endhint %}

## Redis 实现

[RedisService.DistributedLock.cs](https://github.com/Zongsoft/framework/blob/main/externals/redis/src/RedisService.DistributedLock.cs) 先用带有效期的 SET NX 竞争锁键，成功后递增同一键后缀 :FENCE 对应的计数器。失败者获得零编号；分配编号发生异常时尝试按所有权令牌释放锁。

释放和续期分别执行比较 Token 后删除、比较 Token 后延长 TTL 的 Lua 脚本。因此旧进程不能仅凭相同 Key 删除新进程持有的锁。所有键还经过 RedisService.Namespace 前缀处理。

{% hint style="warning" %}
🚨 栅栏编号依赖对应 Redis 计数器的连续性。不要在仍有执行者工作时清理锁前缀或 :FENCE 计数器，也不要把这个单 Redis 实现理解为跨集群故障下的共识服务。
{% endhint %}

## 栅栏令牌怎样保护存储

多进程范例在进入临界区和模拟工作结束后各提交一次 FencingToken。expiry 场景故意让工作时间超过租约，使读者观察旧持有者的迟到写入；mutex 和 renew 则用于对照。

| 范例场景 | 观察目标 |
| --- | --- |
| mutex | 临界区短于租约，查看是否出现重叠进入。 |
| expiry | 临界区超过租约，观察 Violations 与 Stale 计数。 |
| renew | 较长临界区配合自动续期，观察续期是否维持持有状态。 |

完整操作见 [Redis 分布式锁范例](https://github.com/Zongsoft/framework/blob/main/externals/redis/samples/distributedlock/README.zh-Hans.md)。它包含 master 与 slaver 两个真实项目，使用独立运行标识，并支持专用 Redis 连接。

范例 WriteFenceAsync 使用先读取再写入来演示令牌比较。实际受保护存储必须把“检查最大令牌”和“提交数据、更新最大令牌”做成一个原子操作，例如数据库条件更新或服务端脚本；直接复制分开的读写会留下并发窗口。一次范例结果不能证明任意暂停和网络故障下都安全。

## 获取 Redis 锁管理器

插件通过 RedisServiceProvider 注册具名的锁管理器提供器。真实调用方是微信 CredentialManager，它从应用服务中解析提供器，再按缓存配置名取得服务：

来源：[framework/externals/wechat/src/CredentialManager.cs](https://github.com/Zongsoft/framework/blob/main/externals/wechat/src/CredentialManager.cs#L76)（节选；上下文见源文件）。

{% code title="CredentialManager.cs" %}
```csharp
public static Services.Distributing.IDistributedLockManager Locker
{
	get => _locker ??= ApplicationContext.Current.Services.Resolve<IServiceProvider<Services.Distributing.IDistributedLockManager>>()?.GetService(GetCacheName());
	set => _locker = value;
}
```
{% endcode %}

配置入口是 /Externals/Redis/ConnectionSettings，命名服务的所有权和复用见[服务定位](locating.md)，插件部署见 [Redis](../../externals/projects/redis.md)。Discussions 没有现成的 Redis 锁连接，因此不能直接照抄其数据库名称作为 Redis 连接名。

## 真实场景

CredentialManager.GetCredentialAsync 在本地缓存、共享缓存都没有有效凭证后，为凭证刷新请求取得短租约。其当前实现只判断 locker 非空，没有检查 IsLocked 或调用 EnterAsync。结合 Redis 返回未持有句柄的行为，这段现有业务实现不能作为已经保证互斥的完整范例；接入时应核对并补齐持有状态处理。本文以 Redis slaver 和测试作为获取、等待、续期的主要示例。

## 使用建议

* 临界区尽量短，把用户交互、无界等待和批量任务拆出锁作用域。
* 传入取消凭证，并把等待上限与租约时间分别设置。
* 获取、续期或业务写入发生不确定结果时，按可能重复执行设计补偿和幂等处理。
* 使用作用域释放句柄；异步调用链优先使用 await using。
* 需要拒绝迟到写入时，把栅栏令牌校验落实到最终存储，不能只在应用进程中比较。

## 相关资源

* [服务定位与所有权](locating.md)
* [Redis 项目](../../externals/projects/redis.md)
* [事务与一致性](../../data/transactions.md)
* [Redis 锁集成测试](https://github.com/Zongsoft/framework/blob/main/externals/redis/test/RedisDistributedLockTests.cs)
