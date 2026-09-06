---
description: 用环境事务组织数据操作，理解异步提交、取消、资源释放和跨系统原子性的边界。
icon: arrows-rotate
---

# 事务与一致性

事务用于把一组必须共同成功的数据操作放进明确的提交边界。例如创建订单及明细时，不能只留下订单而没有明细。Zongsoft 使用环境事务让参与组件取得当前事务；实际数据库提交仍由数据会话和驱动参与实现。

## 创建事务范围

以下片段假设两个业务异步方法使用能够参与当前事务的数据访问路径：

{% code title="CreateOrderAsync.cs（事务范围片段）" %}
```csharp
await using var transaction = Zongsoft.Data.Transaction.ReadCommitted();

await CreateOrderRecordAsync(cancellation);
await CreateOrderLinesAsync(cancellation);

await transaction.CommitAsync();
```
{% endcode %}

只有前面的业务操作成功后才提交。未提交离开范围时进行回滚和清理；异常应保留给调用方，不能吞掉后仍返回成功。基本类型与登记机制见[核心事务](../core/data/transactions.md)。

## 异步终结与取消

当前 CommitAsync 等待登记回调及数据会话真实提交完成后返回。它的取消参数为兼容保留，事务终结一旦开始不响应该标记。业务操作可以使用请求取消，但不能据此假定已开始的提交也会被取消。

使用异步数据路径时优先配套异步释放，避免同步等待慢速数据库清理。事务范围应尽量短，不在持有数据库事务期间等待用户输入或执行漫长的外部调用。

## 隔离级别不是性能开关

ReadCommitted、RepeatableRead、Serializable 等工厂表达隔离需求；真实支持和锁定行为取决于数据库。隔离级别更强可能减少部分并发异常，也可能增加等待和冲突，不能只为“更安全”而统一选择最高级别。

读写分离还涉及复制延迟，参见[连接配置](connections.md)。需要一致读写的业务应在目标数据库和实际部署上验证，不能只检查 C# 事务对象是否存在。

## 跨系统的边界

{% hint style="warning" %}
🚨 一个环境事务不自动把数据库、Redis、消息代理和 HTTP 服务变成分布式原子事务。向外部系统发送消息后再回滚数据库，通常不能撤销已经发送的消息。
{% endhint %}

需要协调数据库写入与消息发布时，应设计可重试、幂等和补偿流程，或采用经过验证的事务消息/发件箱方案。框架中的[可靠消息存储](../messaging/reliability.md)也必须按实际投递链路接入，不能仅部署存储插件就宣称解决一致性。

实现依据：[Transaction](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/Transaction.cs)、[数据会话](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Common/DataSession.cs)。
