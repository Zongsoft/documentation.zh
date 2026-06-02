---
description: Zongsoft.Components.States 命名空间的职责和主要类型。
icon: code-branch
---

# Zongsoft.Components.States

`Zongsoft.Components.States` 提供轻量状态机和状态图模型，用于表达状态、状态向量、状态上下文、状态处理器和状态流转。

## 主要职责

* 定义状态机、状态图、状态上下文和状态处理器接口。
* 提供 `StateMachine`、`StateDiagramBase`、`StateHandlerBase` 等基础实现。
* 支持将状态流转逻辑从业务对象中抽离出来。
* 适合用于工作流片段、任务状态、设备状态或业务状态迁移。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `State<TKey, TValue>` | 表示某个对象键对应的状态值。 |
| `StateVector<T>` | 表示从源状态到目标状态的状态向量。 |
| `IStateMachine` / `StateMachine` | 状态机入口，负责运行状态迁移并调度处理器。 |
| `IStateDiagram<TKey, TValue>` / `StateDiagramBase<TKey, TValue>` | 状态图，负责判断状态是否可迁移。 |
| `IStateContext<TKey, TValue>` / `StateContext<TKey, TValue>` | 状态迁移上下文。 |
| `IStateHandler<TKey, TValue>` / `StateHandlerBase<TKey, TValue>` | 状态迁移处理器。 |
| `IStateHandlerProvider` | 状态处理器提供器。 |

## 状态流转模型

状态迁移由状态图判断是否合法，再由状态机创建上下文并调度处理器。处理器适合承载副作用，例如记录日志、更新关联数据、发送通知或触发后续任务。

`StateMachine.Run(...)` 接收一个状态对象、描述和可选参数。状态对象持有状态图，状态图负责判断和执行迁移，状态处理器负责在迁移过程中处理副作用。

{% code title="StateVectorSample.cs" %}
```csharp
using Zongsoft.Components.States;

enum OrderStatus
{
	Pending,
	Approved,
}

var vector = new StateVector<OrderStatus>(
	OrderStatus.Pending,
	OrderStatus.Approved);

Console.WriteLine(vector.Contains(OrderStatus.Pending));
```
{% endcode %}

状态机适合状态迁移规则明确、迁移副作用需要集中调度的场景。它不是完整工作流引擎，不负责长事务编排、人工任务、持久化流程实例或图形化流程设计。状态处理器通常应保持短小，复杂业务动作可以再委托给命令、处理器或领域服务。

{% hint style="info" %}
状态类型泛型约束要求键和值通常是结构类型。设计业务状态时，建议使用稳定的枚举或可比较值作为状态值。
{% endhint %}

## 相关资源

* [States 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/States)
* [State.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/State.cs)
* [StateMachine.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateMachine.cs)
* [StateDiagramBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateDiagramBase.cs)
* [StateHandlerBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateHandlerBase.cs)
* [StateVector.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateVector.cs)
