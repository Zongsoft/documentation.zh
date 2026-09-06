---
description: Zongsoft.Data.Transaction 类与 Zongsoft.Data.Transactions 命名空间的职责和主要类型。
icon: rotate
---

# Zongsoft.Data.Transaction

`Zongsoft.Data.Transaction` 提供[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)中的轻量环境事务对象，事务状态、事务信息、事务阶段和事务参与登记类型位于 `Zongsoft.Data.Transactions` 命名空间。它用于在数据服务、批处理或跨组件操作中表达一段可提交或回滚的应用层事务。

## 主要职责

* 通过 `Transaction.Current` 维护当前异步上下文中的环境事务。
* 支持以 `ReadCommitted()`、`RepeatableRead()`、`Serializable()` 等工厂方法创建常用隔离级别的事务。
* 提供同步与异步提交/回滚，并在释放未提交事务时回滚。
* 通过 `IEnlistment`、`EnlistmentContext` 和 `EnlistmentPhase` 支持事务参与者登记与阶段通知。
* 为数据服务、批处理和跨组件操作提供统一事务抽象。

## 典型用法

Discussions 创建主题时把主记录、主题内容贴和作者统计放入事务。同步与异步完整用例见[事务与一致性](../../data/transactions.md)。

如果需要让组件感知事务提交或回滚，可实现 `Zongsoft.Data.Transactions.IEnlistment` 并登记到当前事务。登记对象会在事务完成时收到 `Commit` 或 `Rollback` 阶段通知。

## 相关资源

* [Zongsoft.Data](../data.md)
* [数据引擎](../../data/README.md)
* [Transaction 源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/Transaction.cs)
* [Transactions 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Data/Transactions)

## 异步完成与环境作用域

下面是 Discussions 的真实异步插入钩子；Posting、Utility 和统计方法都来自模块本身。正文文件由 MutateContentAsync 在数据库操作失败时清理，它不是数据库事务自动回滚的资源。

异步数据操作可用 `await using` 管理事务，再等待 `CommitAsync`，让调用方观察真实完成或失败：

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L336)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
protected override async ValueTask<int> OnInsertAsync(IDataDictionary<Models.Thread> data, ISchema schema, DataInsertOptions options, CancellationToken cancellation)
{
	cancellation.ThrowIfCancellationRequested();
	if(!data.TryGetValue(p => p.Post, out var post) || post == null || string.IsNullOrEmpty(post.Content))
		throw new InvalidOperationException("Missing content of the thread.");

	//确保数据模式含有“主题内容贴”复合属性
	schema.Include("Post{*}");

	//更新主题内容贴的相关属性
	post.Visible = false;
	post.Approved = await this.ServiceProvider.ResolveRequired<ForumService>().CanPublishAsync(data, cancellation);
	data.SetValue(p => p.Approved, post.Approved);
	schema.Include(nameof(Models.Thread.Approved));

	var content = DataDictionary.GetDictionary<Post>(post);
	return await Utility.MutateContentAsync(content, () => this.Posting.GetContentFilePath(content), async () =>
	{
		await using(var transaction = new Transaction())
		{
			//调用基类同名方法，插入主题数据
			var count = await base.OnInsertAsync(data, schema, options, cancellation);

			if(count < 1)
				return count;

			//更新发帖人关联的主题统计信息
			await this.SetMostRecentThreadAsync(data, cancellation: cancellation);

			//提交事务
			await transaction.CommitAsync(cancellation);

			return count;
		}
	}, cancellation);
}
```
{% endcode %}

异步参与者通过 `IEnlistment.OnEnlistAsync` 接收完成通知。事务开始终结后，后续取消不会中止已经进行的提交/回滚；取消请求不能作为数据库未提交的证明。

`DisposeAsync` 会先退出当前环境事务作用域，再异步回滚未完成事务，防止旧作用域影响后续代码。它不会自动将任意 HTTP 请求、消息确认或外部系统操作纳入原子事务。

数据引擎中的连接、隔离和跨系统边界见[事务与一致性](../../data/transactions.md)。
