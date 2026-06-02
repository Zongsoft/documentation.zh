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

## 范例：设施状态迁移

下面的范例抽象自业务系统中的设施、工单和问题反馈状态流转代码。它展示了一个更接近实际项目的组织方式：状态图负责状态向量、当前状态读取和最终状态写入；处理器负责联动迁移、附加参数和历史记录；服务入口只暴露一个 `SetStatus(...)` 方法。

### 定义状态值

状态值通常使用稳定的枚举来表达。枚举成员的顺序和取值会进入持久化数据或历史记录时，应明确每个值的业务含义，避免后续调整时破坏已有状态。

{% code title="AssetStatus.cs" %}
```csharp
/// <summary>表示资产(设施)状态的枚举。</summary>
public enum AssetStatus : byte
{
	/// <summary>正常</summary>
	Normal,
	/// <summary>故障</summary>
	Fault,
	/// <summary>废弃</summary>
	Disabled,
	/// <summary>已停用</summary>
	Suspended,
	/// <summary>未启用</summary>
	Inactived,
	/// <summary>未知</summary>
	Unknown = 99,
}
```
{% endcode %}

### 定义状态图

状态图需要先声明允许迁移的状态向量，然后实现 `GetState(...)` 和 `SetState(...)`。如果写入状态时还要同步其他字段，可以约定一组参数前缀，由处理器把附加值写入 `context.Parameters`，再由状态图统一落库。示例中的仓储、模型和关联任务查询是业务侧抽象，只用于说明状态机类型之间的协作方式。

{% code title="AssetStateDiagram.cs" %}
```csharp
using System;
using System.Collections.Generic;
using Zongsoft.Components.States;

[Zongsoft.Services.Service]
public sealed partial class AssetStateDiagram : StateDiagramBase<ulong, AssetStatus>
{
	private readonly IAssetRepository _repository;

	public AssetStateDiagram(IServiceProvider serviceProvider, IAssetRepository repository) : base(serviceProvider)
	{
		_repository = repository;

		//状态向量定义了“允许发生”的迁移方向，未定义的方向会被默认拒绝。
		this.Vectors =
		[
			new(AssetStatus.Normal, AssetStatus.Fault),
			new(AssetStatus.Normal, AssetStatus.Suspended),
			new(AssetStatus.Normal, AssetStatus.Disabled),
			new(AssetStatus.Fault, AssetStatus.Normal),
			new(AssetStatus.Fault, AssetStatus.Disabled),
			new(AssetStatus.Suspended, AssetStatus.Normal),
			new(AssetStatus.Suspended, AssetStatus.Disabled),
		];
	}

	//构建一个设施状态对象
	public AssetState State(ulong assetId, AssetStatus value)
	{
		return new AssetState(this, assetId, value);
	}

	//状态机运行时会先读取当前状态，用它和目标状态组成迁移向量。
	protected override State<ulong, AssetStatus> GetState(ulong key)
	{
		var asset = _repository.Get(key);
		return asset == null ? null : new AssetState(this, asset);
	}

	protected override bool SetState(ulong key, AssetStatus value, string description, IDictionary<object, object> parameters)
	{
		const string PREFIX = "asset:";

		var values = new Dictionary<string, object>
		{
			//状态图统一负责最终落库，因此状态字段和状态说明在这里写入。
			{ "Status", value },
			{ "StatusTimestamp", DateTime.Now },
			{ "StatusDescription", description },
		};

		if(parameters != null)
		{
			//处理器可以通过约定前缀传入额外字段，例如 asset:PlateNo。
			foreach(var parameter in parameters)
			{
				if(parameter.Key is string name && name.StartsWith(PREFIX, StringComparison.OrdinalIgnoreCase))
					values[name.Substring(PREFIX.Length)] = parameter.Value;
			}
		}

		//持久化状态
		return _repository.Update(key, values);
	}
}
```
{% endcode %}

### 定义状态对象

状态对象通常作为状态图的内部模型存在。对外提供 `State(...)` 工厂方法后，调用方不需要知道状态对象如何构造，只需要传入对象编号和目标状态。

{% code title="AssetState.cs" %}
```csharp
partial class AssetStateDiagram
{
	sealed class AssetState : State<ulong, AssetStatus>, IEquatable<AssetState>
	{
		internal AssetState(AssetStateDiagram diagram, ulong assetId, AssetStatus value) : base(diagram, assetId, value) { }
		internal AssetState(AssetStateDiagram diagram, Asset asset) : base(diagram, asset.AssetId, asset.Status) => this.Asset = asset;

		public Asset Asset { get; }
	}
}
```
{% endcode %}

`CanTransfer(...)` 默认会检查 `Vectors` 中是否存在匹配的源状态和目标状态。如果迁移规则不只是静态向量，例如还需要结合租户、库存、审批额度或外部配置，可以重写 `CanTransfer(...)`，但要避免把副作用放进判定逻辑。

### 实现处理器

处理器适合承载迁移副作用。下面示例中，当设施被禁用时，处理器通过 `context.Parameters` 附加要同步更新的字段，并通过同一个状态机继续触发关联任务的取消迁移。这样做可以让一组关联状态变化共享同一轮迁移上下文和完成阶段。

{% code title="AssetStateHandler.cs" %}
```csharp
using System;
using System.Collections.Generic;

using Zongsoft.Services;
using Zongsoft.Components.States;

[Service(typeof(IStateHandler<ulong, AssetStatus>))]
sealed class AssetStateHandler : StateHandlerBase<ulong, AssetStatus>
{
	//当状态机发生状态迁移会回调该方法，可以在该方法中进行参数控制或驱动别的状态图流转
	protected override void OnHandle(StateContext<ulong, AssetStatus> context)
	{
		//业务：因为设施状态变为了“废弃”，因此需要将其 AssetNo 字段添加一个特定的前缀，并回收其牌号（即设置 PlateNo 为空）
		if(context.State.Destination == AssetStatus.Disabled)
		{
			context.Parameters["asset:AssetNo"] = "$Discard!" + DateTime.Now.ToString("yyMMddHHmmss");
			context.Parameters["asset:PlateNo"] = null;
		}

		if(context.State.Destination == AssetStatus.Suspended ||
		   context.State.Destination == AssetStatus.Disabled)
		{
			//示例：获取当前设施关联的任务集
			//业务：将处于“废弃”或“停用”状态的设施的关联任务取消掉
			foreach(var task in this.GetUnfinishedTasks(context.Key))
			{
				//使用同一个状态机继续触发关联状态图的状态迁移，方便统一完成和防止状态重入导致的死递归
				context.Machine.Run(
					this.ServiceProvider.ResolveRequired<TaskStateDiagram>().State(task.TaskId, TaskStatus.Cancelled),
					context.Description);
			}
		}
	}

	protected override void OnFinish(StateContext<ulong, AssetStatus> context)
	{
		//更新设施状态
		context.SetState();

		//新增设施状态变更记录
		this.ServiceProvider.ResolveRequired<AssetServiceBase>().SetState(
			context.Key,
			context.State.Source,
			context.State.Destination,
			context.Description);
	}

	//示例：查询并返回指定设施的关联任务。
	private IEnumerable<(ulong TaskId)> GetUnfinishedTasks(ulong assetId) => [];
}
```
{% endcode %}

### 暴露服务入口

业务服务通常不直接暴露状态图和状态处理器，而是提供一个意图明确的方法。注意 `StateMachine` 的释放动作会触发完成阶段，因此用 `using` 包裹状态机是默认流程中的关键步骤。

{% code title="AssetServiceBase.cs" %}
```csharp
using System;
using Zongsoft.Services;
using Zongsoft.Components.States;

abstract class AssetServiceBase
{
	protected IServiceProvider ServiceProvider { get; }
	protected IAssetRepository Repository { get; }

	public bool SetState(ulong assetId, AssetStatus origin, AssetStatus destination, string description)
	{
		//新增一条状态变更历史记录，不直接改变当前状态
		return this.Repository.InsertHistory(assetId, origin, destination, DateTime.Now, description);
	}

	public bool SetStatus(ulong assetId, AssetStatus status, string description = null)
	{
		//释放状态机时(Dispose)会触发 AssetStateHandler 处理器的 OnFinish 回调
		using(var machine = new StateMachine(this.ServiceProvider))
		{
			var diagram = this.ServiceProvider.ResolveRequired<AssetStateDiagram>();
			machine.Run(diagram.State(assetId, status), description);
		}

		return true;
	}
}
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
