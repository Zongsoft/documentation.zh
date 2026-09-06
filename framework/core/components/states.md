---
description: 结合 Discussions 的状态动作与框架状态机实现理解迁移、处理器和完成阶段。
icon: code-branch
---

# Zongsoft.Components.States

`Zongsoft.Components.States` 提供轻量状态机和状态图模型，用于表达状态、状态向量、状态上下文、状态处理器和状态流转。它关注的是“一个对象能否从当前状态迁移到目标状态，以及迁移过程中需要触发哪些处理”，适合把业务对象上的状态判断、副作用和持久化动作拆开管理。

如果你还不熟悉有限状态机（**FSM**）的设计动机，建议先读这两篇文章：

* [代码失控与状态机（上）](https://blog.zongsoft.com/dai-ma-shi-kong-yu-zhuang-tai-ji-shang)：解释状态、状态驱动、迁移判定和状态图为什么能降低复杂流程的认知负担。
* [代码失控与状态机（下）](https://blog.zongsoft.com/dai-ma-shi-kong-yu-zhuang-tai-ji-xia)：通过表达式解析器示例演示如何从语法规则推导状态图并落到代码实现。

## 设计意图

复杂业务流程容易失控，通常不是因为每个分支本身很难，而是因为状态、条件、副作用和持久化更新混在一起后，局部修改会牵动很多隐藏路径。状态机模型把问题拆成几个相对独立的部分：

* **状态** 表示对象当前处于哪个业务阶段，例如订单待审、已审核、已取消。
* **状态向量** 表示一次迁移方向，即从源状态到目标状态。
* **状态图** 描述允许哪些状态向量发生，并负责读取、写入对象当前状态。
* **状态上下文** 保存本次迁移的键、源状态、目标状态、描述和参数。
* **状态处理器** 承载迁移过程中的副作用，例如记录审计日志、发送通知、更新关联数据。
* **状态机** 负责创建迁移上下文、查找处理器并驱动状态图执行迁移。

这种分层让状态规则保持在状态图中，让副作用集中到处理器中，让业务入口只表达“我要把某个对象迁移到某个目标状态”。它不是为了替代所有流程代码，而是让状态迁移的“地图”先清晰起来。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `State<TKey, TValue>` | 表示某个对象键对应的状态值，持有所属状态图、对象键和值。 |
| `StateVector<T>` | 表示从源状态到目标状态的迁移向量。 |
| `IStateMachine` / `StateMachine` | 状态机入口，负责运行状态迁移并调度处理器。 |
| `IStateDiagram<TKey, TValue>` / `StateDiagramBase<TKey, TValue>` | 状态图，负责判断状态是否可迁移，并提供当前状态读取和状态写入能力。 |
| `IStateContext<TKey, TValue>` / `StateContext<TKey, TValue>` | 状态迁移上下文，保存对象键、迁移向量、描述和参数。 |
| `IStateHandler<TKey, TValue>` / `StateHandlerBase<TKey, TValue>` | 状态迁移处理器，负责处理迁移副作用；默认完成阶段会调用上下文写入目标状态。 |
| `IStateHandlerProvider` | 状态处理器提供器，通常从依赖注入容器中获取处理器集合。 |


## Discussions 目前怎样处理状态

Discussions 定义了 ThreadStatus，但主题审核、锁定、置顶等操作主要由独立布尔字段与服务方法表达。当前没有实现 StateDiagramBase 派生类，不能把论坛描述成已经接入这套状态机。

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L103)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
public bool SetLocked(ulong threadId, bool value)
{
	return this.DataAccess.Update<Models.Thread>(new
	{
		IsLocked = value,
	}, Condition.Equal(nameof(Models.Thread.ThreadId), threadId) & GetIsModeratorCriteria()) > 0;
}
```
{% endcode %}

这个动作依赖主题编号和版主资格。对于这样的单字段操作，明确的服务方法很直观；当状态之间出现复杂迁移关系、多个协作处理器和统一完成阶段时，再评估状态图抽象。

## 框架实际怎样驱动迁移

下面来自框架状态机本身，是实现参考，并非另建的业务范例：

来源：[framework/Zongsoft.Core/src/Components/States/StateMachine.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateMachine.cs#L87)（节选；上下文见源文件）。

{% code title="StateMachine.cs" %}
```csharp
public void Run<TKey, TValue>(State<TKey, TValue> state, string description, IEnumerable<KeyValuePair<object, object>> parameters = null) where TKey : struct, IEquatable<TKey> where TValue : struct
{
	ArgumentNullException.ThrowIfNull(state);
	var context = this.GetContext(state, description);

	if(context == null)
		return;

	if(parameters != null)
	{
		foreach(var parameter in parameters)
			context.Parameters.TryAdd(parameter.Key, parameter.Value);
	}

	var count = 0;
	var handlers = this.GetHandlers<TKey, TValue>();

	foreach(var handler in handlers)
	{
		if(count++ == 0)
			_stack.Push(context);

		state.Diagram.Transfer(context, handler);
	}
}
```
{% endcode %}

Run 取得迁移上下文，把参数合入上下文，查找处理器，再调用状态图执行迁移。上下文只在找到首个处理器时入栈，因此没有处理器时不能假定仍会完整执行后续持久化。

## 完成阶段与事务

来源：[framework/Zongsoft.Core/src/Components/States/StateMachine.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateMachine.cs#L115)（节选；上下文见源文件）。

{% code title="StateMachine.cs" %}
```csharp
private void Stop()
{
	if(_stack.Count == 0)
		return;

	var frames = _stack.Reverse().ToArray();

	using(var transaction = new Data.Transaction())
	{
		for(int i = 0; i < frames.Length; i++)
		{
			this.OnStop(frames[i]);
		}

		//提交事务
		transaction.Commit();
	}
}
```
{% endcode %}

完成阶段遍历已保存的上下文，在环境事务中调用处理器完成逻辑并提交。状态图负责表达允许的迁移和状态读写，处理器负责迁移中的业务动作。调用者必须管理状态机生命周期，不能只调用 Run 后丢弃实例。

## 选择前要回答的问题

- 状态是互斥枚举，还是相互独立的属性？锁定与置顶可以同时成立，未必适合硬塞到同一枚举。
- 哪些迁移允许发生，谁有权限发起，数据库并发变更怎样检查？
- 副作用发生在迁移阶段还是完成阶段，失败时如何回滚或补偿？
- 状态机实例的生命周期由谁控制，是否需要跨请求持久化？

这套状态机不是持久化工作流引擎，也不会自动提供分布式事务、审批历史或所有资源的权限验证。有关业务事务见[Discussions 发帖事务](../../data/transactions.md)。

## 参考实现

[状态机目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/States)包含状态、向量、上下文、状态图和处理器契约。本文不再保留仓库中不存在的资产仓储、资产状态图和资产服务。
