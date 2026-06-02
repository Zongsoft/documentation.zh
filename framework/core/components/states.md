---
description: Zongsoft.Components.States 命名空间的职责和主要类型。
icon: code-branch
---

# Zongsoft.Components.States

`Zongsoft.Components.States` 提供轻量状态机和状态图模型，用于表达状态、状态向量、状态上下文、状态处理器和状态流转。

{% hint style="info" %}
该命名空间原位于 `Zongsoft.Flowing`，现已迁移到 `Zongsoft.Components.States`，源码位置为 `Zongsoft.Core/src/Components/States`。
{% endhint %}

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

## 相关资源

* [States 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/States)
* [State.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/State.cs)
* [StateMachine.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateMachine.cs)
* [StateDiagramBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateDiagramBase.cs)
* [StateHandlerBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateHandlerBase.cs)
* [StateVector.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/States/StateVector.cs)
