---
description: Zongsoft.Data.Transaction 类与 Zongsoft.Data.Transactions 命名空间的职责和主要类型。
icon: rotate
---

# Zongsoft.Data.Transaction

`Zongsoft.Data.Transaction` 提供核心类库中的轻量环境事务对象，事务状态、事务信息、事务阶段和事务参与登记类型位于 `Zongsoft.Data.Transactions` 命名空间。它用于在数据服务、批处理或跨组件操作中表达一段可提交或回滚的应用层事务。

{% hint style="warning" %}
核心类库中的 `Zongsoft.Transactions` 命名空间已移除；新代码应改用 `Zongsoft.Data.Transaction` 和 `Zongsoft.Data.Transactions`。
{% endhint %}

## 主要职责

* 通过 `Transaction.Current` 维护当前异步上下文中的环境事务。
* 支持以 `ReadCommitted()`、`RepeatableRead()`、`Serializable()` 等工厂方法创建常用隔离级别的事务。
* 提供同步与异步提交/回滚，并在释放未提交事务时回滚。
* 通过 `IEnlistment`、`EnlistmentContext` 和 `EnlistmentPhase` 支持事务参与者登记与阶段通知。
* 为数据服务、批处理和跨组件操作提供统一事务抽象。

## 典型用法

{% code title="UseTransaction.cs" %}
```csharp
using Zongsoft.Data;

using var transaction = Transaction.ReadCommitted();

// 在当前异步上下文中执行数据服务或其它需要参与事务的操作。

transaction.Commit();
```
{% endcode %}

如果需要让组件感知事务提交或回滚，可实现 `Zongsoft.Data.Transactions.IEnlistment` 并登记到当前事务。登记对象会在事务完成时收到 `Commit` 或 `Rollback` 阶段通知。

## 相关资源

* [Zongsoft.Data](../data.md)
* [数据引擎](../../data/README.md)
* [Transaction 源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/Transaction.cs)
* [Transactions 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Data/Transactions)

## 异步完成与环境作用域

异步数据操作可用 `await using` 管理事务，再等待 `CommitAsync`，让调用方观察真实完成或失败：

{% code title="CompleteTransactionAsync.cs" %}
```csharp
using Zongsoft.Data;

await using var transaction = Transaction.ReadCommitted();
// await 执行参与当前事务的数据操作。
await transaction.CommitAsync();
```
{% endcode %}

异步参与者通过 `IEnlistment.OnEnlistAsync` 接收完成通知。事务开始终结后，后续取消不会中止已经进行的提交/回滚；取消请求不能作为数据库未提交的证明。

`DisposeAsync` 会先退出当前环境事务作用域，再异步回滚未完成事务，防止旧作用域影响后续代码。它不会自动将任意 HTTP 请求、消息确认或外部系统操作纳入原子事务。

数据引擎中的连接、隔离和跨系统边界见[事务与一致性](../../data/transactions.md)。
