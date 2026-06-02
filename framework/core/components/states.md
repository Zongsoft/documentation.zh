---
description: Zongsoft.Components.States 命名空间的职责、状态机模型和典型用法。
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

## 状态流转模型

一次状态迁移可以按下面的路径理解：

1. 业务入口创建目标 `State<TKey, TValue>`，其中包含对象键、目标状态值和所属状态图。
2. 调用 `StateMachine.Run(...)`，传入目标状态、描述和可选参数。
3. 状态机从状态图读取当前状态，得到源状态，并检查源状态到目标状态的 `StateVector<TValue>` 是否允许迁移。
4. 状态机创建 `StateContext<TKey, TValue>`，并查找匹配的 `IStateHandler<TKey, TValue>` 处理器。
5. 状态图依次执行迁移处理，处理器可以在上下文中读取参数、执行业务副作用。
6. 状态机释放时会完成已入栈的迁移上下文，默认处理器完成逻辑会调用 `context.SetState()` 写入目标状态。

{% hint style="info" %}
`StateMachine` 会避免同一个对象在同一轮迁移栈中重复处理相同状态，适合处理迁移过程中又触发其他状态迁移的场景。处理器仍应保持短小，复杂业务动作建议委托给命令、处理器或领域服务。
{% endhint %}

{% hint style="warning" %}
默认流程中，状态写入发生在处理器完成阶段，该阶段会在状态机释放时触发。迁移类型至少需要注册一个对应的 `IStateHandler<TKey, TValue>`，并确保手动创建的状态机实例被释放；或者由自定义状态图、状态机覆写相关流程，否则 `Run(...)` 只会完成迁移判定而不会写入目标状态。
{% endhint %}

## 定义状态向量

状态向量是状态图中最小的规则单元。设计状态图时，先列出所有允许发生的迁移，再把它们映射到 `StateVector<T>` 数组中。

{% code title="OrderStateVectors.cs" %}
```csharp
using Zongsoft.Components.States;

enum OrderStatus
{
	Pending,
	Approved,
	Rejected,
	Cancelled,
}

var approve = new StateVector<OrderStatus>(
	OrderStatus.Pending,
	OrderStatus.Approved);

Console.WriteLine(approve.Contains(OrderStatus.Pending));
```
{% endcode %}

## 实现状态图

状态图需要回答两个问题：对象当前是什么状态，以及当迁移完成时如何写入新状态。下面示例省略了仓储实现，只保留状态图的形状。

{% code title="OrderStateDiagram.cs" %}
```csharp
using System;
using System.Collections.Generic;
using Zongsoft.Components.States;

sealed class OrderStateDiagram : StateDiagramBase<long, OrderStatus>
{
	private readonly IOrderRepository _orders;

	public OrderStateDiagram(IServiceProvider serviceProvider, IOrderRepository orders) : base(serviceProvider)
	{
		_orders = orders;
		this.Vectors =
		[
			new(OrderStatus.Pending, OrderStatus.Approved),
			new(OrderStatus.Pending, OrderStatus.Rejected),
			new(OrderStatus.Pending, OrderStatus.Cancelled),
		];
	}

	protected override State<long, OrderStatus> GetState(long key)
	{
		var order = _orders.Get(key);
		return order == null ? null : new OrderState(this, order.Id, order.Status);
	}

	protected override bool SetState(long key, OrderStatus value, string description, IDictionary<object, object> parameters)
	{
		return _orders.SetStatus(key, value, description);
	}
}
```
{% endcode %}

`CanTransfer(...)` 默认会检查 `Vectors` 中是否存在匹配的源状态和目标状态。如果迁移规则不只是静态向量，例如还需要结合租户、库存、审批额度或外部配置，可以重写 `CanTransfer(...)`，但要避免把副作用放进判定逻辑。

## 实现状态对象

`State<TKey, TValue>` 是抽象类，通常为某类业务对象提供一个很薄的派生类型即可。

{% code title="OrderState.cs" %}
```csharp
using Zongsoft.Components.States;

sealed class OrderState : State<long, OrderStatus>
{
	public OrderState(IStateDiagram<long, OrderStatus> diagram, long key, OrderStatus value) : base(diagram, key, value)
	{
	}
}
```
{% endcode %}

## 实现处理器

处理器用于承载迁移副作用。`OnHandle(...)` 适合记录日志、校验附加参数、发送通知或触发后续任务；最终状态写入通常交给 `StateHandlerBase<TKey, TValue>` 的默认完成逻辑处理。

{% code title="OrderStateHandler.cs" %}
```csharp
using System;
using Zongsoft.Components.States;

sealed class OrderStateHandler : StateHandlerBase<long, OrderStatus>
{
	private readonly IAuditLog _logs;

	public OrderStateHandler(IServiceProvider serviceProvider, IAuditLog logs) : base(serviceProvider)
	{
		_logs = logs;
	}

	protected override void OnHandle(StateContext<long, OrderStatus> context)
	{
		_logs.Append(
			context.Key,
			context.State.Source,
			context.State.Destination,
			context.Description);
	}
}
```
{% endcode %}

## 运行迁移

运行迁移时，调用方只需要表达目标状态。状态机负责读取源状态、验证迁移向量并调度处理器。

{% code title="ApproveOrder.cs" %}
```csharp
using System.Collections.Generic;
using Zongsoft.Components.States;

var target = new OrderState(diagram, orderId, OrderStatus.Approved);

stateMachine.Run(
	target,
	"审核通过",
	[
		KeyValuePair.Create<object, object>("operator", userId),
	]);
```
{% endcode %}

## 适用边界

状态机适合状态迁移规则明确、迁移副作用需要集中调度的场景，例如工作流片段、任务状态、设备状态、订单状态或业务状态迁移。它尤其适合把复杂流程拆成状态节点和局部迁移条件，避免在业务对象或应用服务中堆叠大量互相牵制的条件分支。

它不是完整工作流引擎，不负责长事务编排、人工任务、持久化流程实例、图形化流程设计或跨服务补偿。遇到这些需求时，建议将状态机作为局部状态迁移组件使用，而不是把整个流程编排都塞进状态处理器。

{% hint style="warning" %}
状态类型泛型约束要求键和值通常是结构类型。设计业务状态时，建议使用稳定的枚举或可比较值作为状态值，避免使用会随显示文案、外部配置或本地化变化而变化的值。
{% endhint %}

## 相关资源

* [代码失控与状态机（上）](https://blog.zongsoft.com/dai-ma-shi-kong-yu-zhuang-tai-ji-shang)
* [代码失控与状态机（下）](https://blog.zongsoft.com/dai-ma-shi-kong-yu-zhuang-tai-ji-xia)
* [States 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/States)
* [State.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/State.cs)
* [StateMachine.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateMachine.cs)
* [StateDiagramBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateDiagramBase.cs)
* [StateHandlerBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateHandlerBase.cs)
* [StateVector.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateVector.cs)
