---
description: 配置 Redis 缓存、etcd 序号与租约锁，并理解 Garnet 服务器和可靠消息存储。
icon: database
---

# 缓存与分布式协作

缓存、序号和锁都可能使用键值存储，但目的不同。缓存允许按业务策略失效或重建；序号需要原子分配；锁通过所有权限制并发。不能把“能读写一个键”当作这三类能力都具有相同的一致性保证。

## 组件选择

| 扩展 | 当前职责 | 使用入口 |
| --- | --- | --- |
| Redis | 缓存、序号、锁、消息流、配置和消息存储 | 注册的 `Redis` 提供者及相关插件树节点 |
| etcd | 基础 KV、序号、租约锁 | 序号/锁提供者；不是公共分布式缓存实现 |
| Garnet | 随宿主启动的 Redis 协议服务器 | 工作器及服务器设置；客户端仍需相应适配器 |

## Redis 缓存闭环

Discussions 没有直接调用 Redis 缓存的业务用例；framework 的 distributedcache 是可运行的交互客户端。它创建名为 Redis 的独立实例，并使用 DistributedCache 键前缀。启动前按 [范例说明](https://github.com/Zongsoft/framework/blob/main/externals/redis/samples/distributedcache/README.zh-Hans.md) 准备测试 Redis，替换本地连接中的占位密码。

set 命令从用户输入读取键、值、过期时间和写入条件，最终调用：

来源：[framework/externals/redis/samples/distributedcache/Program.cs](https://github.com/Zongsoft/framework/blob/main/externals/redis/samples/distributedcache/Program.cs#L40)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
var succeeded = expiry.HasValue ?
	await cache.SetValueAsync(key, value, expiry.Value, requisite, cancellation) :
	await cache.SetValueAsync(key, value, requisite, cancellation);
```
{% endcode %}

get 命令同时取回值和剩余有效期：

来源：[framework/externals/redis/samples/distributedcache/Program.cs](https://github.com/Zongsoft/framework/blob/main/externals/redis/samples/distributedcache/Program.cs#L65)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
var (value, expiry) = await cache.GetValueExpiryAsync<string>(key, cancellation);
```
{% endcode %}

完整程序提供 set、get、exists、expiry、remove 与 subscribe 命令，便于在同一前缀下观察跨进程读写和通知。独立程序负责释放自己创建的 RedisService；通过宿主提供者取得的共享缓存则由宿主管理，消费方不应逐次释放。具名服务的解析与回退规则见[服务定位](../core/services/locating.md)。

普通 Redis 服务找不到具名连接时可能回退默认连接，连接名拼错并不总会立即失败。启动检查应核对实际选定配置，并用业务键前缀隔离数据。

## 作用域与通知

Redis 服务可通过 `WithDatabase()` 和 `WithNamespace()` 创建不可变作用域。旧的 `Use()` 或可变 `Namespace` 只能在首次使用前设置，不适合每次请求修改共享实例。

缓存变化通知要求服务端启用相应键空间通知。通知采用 Pub/Sub 语义，断线不重放；本地订阅队列也有容量及溢出策略，因此不能把通知用作必须完整保存的业务事件日志。配置提供程序基于本地快照重新加载，同样需要考虑失联期间的状态。

## etcd 序号与锁

etcd 的设置位于 `/Externals/Etcd/ConnectionSettings`，驱动为 `etcd`。序号通过公共 `ISequence` 提供者取得；多个提供者同时存在时，由应用组合层明确注入所选实现。

{% hint style="info" %}
💡 当前 etcd 提供者没有注册 `Etcd` 别名，不能仅替换具名服务表达式中的提供者名字来取得 etcd 服务。连接名也不会自动成为 etcd 的键命名空间。
{% endhint %}

序号递增使用比较并交换事务，首次返回 `seed + interval`，不是 `seed`。过期设置用于创建缺失序号；递增保留已有租约。序号原子分配不意味着无间断业务编号，也不会与业务数据提交自动形成同一个事务。

Redis 和 etcd 的锁都需要理解**租约**与**栅栏令牌**：租约失效后旧进程仍可能继续执行，资源端应拒绝过期持有者的写入。自动续期需显式配置，续期失败或结果不确定时应停止依赖该锁的工作。完整调用示例见[分布式锁](../core/services/distributed-lock.md)。

## Garnet 服务器

`Zongsoft.Externals.Garnet` 通过工作器托管 Garnet 服务器。配置路径为 `/Externals/Garnet`，具名 `server` 的 `value` 转换为服务器选项。插件工作器启动可能打开监听端口，所以应在启用前明确绑定地址、认证和持久化目录。

相对目录通常从适配器程序集位置解析，`~/` 从应用根目录解析。启用 AOF 或检查点后，应测试停止、重启和恢复；进程内服务器与宿主共享资源及故障边界。Redis 协议兼容不等于全部 Redis 命令和持久化行为相同。

## 可靠消息存储与排障

Redis 的消息存储工厂挂载于 `/Workspace/Messaging/Storages/Redis`，要求连接名与 Broker 严格一致，不使用普通服务的默认回退。稳定存储身份和恢复要求见[可靠投递与消息存储](../messaging/reliability.md)。

首次调用出现缺少方法等异常时，应先检查最终部署目录中的第三方 DLL 版本，而非只检查项目引用。当前 Redis 部署链存在传递依赖覆盖版本的风险；修复时以实际项目依赖为准，停止测试宿主后重新部署兼容版本，再验证首次连接。

源码入口：[Redis](https://github.com/Zongsoft/framework/tree/main/externals/redis)、[etcd](https://github.com/Zongsoft/framework/tree/main/externals/etcd)、[Garnet](https://github.com/Zongsoft/framework/tree/main/externals/garnet)。

## 按项目继续阅读

[Etcd](projects/etcd.md) · [Garnet](projects/garnet.md) · [Redis](projects/redis.md)
