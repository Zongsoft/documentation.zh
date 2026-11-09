---
description: Zongsoft.Components Worker 工作器模型与工作器命令。
icon: person-running
---

# Worker

`Worker` 是 Zongsoft 中可被启动、停止、暂停和恢复的运行时组件模型。它适合表达后台服务、事件交换器、调度服务器、消息监听器、设备采集器等具有生命周期的对象。

[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)把生命周期命令和运行状态统一起来。宿主程序、终端命令或插件启动流程可以用同一组方法控制不同运行时组件。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| [`IWorker`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs) | 工作者接口，定义 `StartAsync`、`StopAsync`、`PauseAsync` 和 `ResumeAsync`。 |
| [`WorkerBase`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/WorkerBase.cs) | 工作者基类，负责线程安全的状态切换、启动时的启用判断和状态变化事件，并支持异步释放。 |
| [`WorkerState`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/WorkerState.cs) | 工作者状态枚举，包括停止、运行、暂停等状态。 |
| [`WorkerCommandBase`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Commands/WorkerCommandBase.cs) | 工作者命令基类，用于把工作者生命周期操作暴露成命令。 |
| [`WorkerStartCommand`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Commands/WorkerStartCommand.cs)、[`WorkerStopCommand`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Commands/WorkerStopCommand.cs) | 启动和停止工作者。 |
| [`WorkerPauseCommand`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Commands/WorkerPauseCommand.cs)、[`WorkerResumeCommand`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Commands/WorkerResumeCommand.cs) | 暂停和恢复工作者。 |
| [`WorkerInfoCommand`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Commands/WorkerInfoCommand.cs) | 查看工作者状态和基本信息。 |

## 生命周期

{% stepper %}
{% step %}
## StartAsync

[`WorkerBase.StartAsync(...)`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/WorkerBase.cs) 检查启用状态和当前状态，进入 `Starting`，然后调用派生类的启动逻辑，成功后进入 `Running`。
{% endstep %}

{% step %}
## PauseAsync / ResumeAsync

CanPauseAndContinue 表示是否支持暂停和恢复。不支持时对应方法抛出 System.NotSupportedException。暂停保留资源和内部进度，恢复使用原有资源继续工作；不能用停止后重启代替。
{% endstep %}

{% step %}
## StopAsync

停止过程进入 `Stopping`，释放运行中的资源，例如关闭事件通道、停止调度服务器、注销订阅或释放外部连接，最终回到 `Stopped`。
{% endstep %}
{% endstepper %}

## 并发、故障与释放

Enabled 仅决定能否启动，启动后改变它只影响下一次启动，不停止当前运行，也不影响暂停、恢复、停止和释放。

相同的在途动作共享结果；停止等待当前动作结束，启动、暂停和恢复遇到其它在途动作直接返回。例如停止中调用 StartAsync 不会排队重启，需要先等待 StopAsync 完成再启动。

启动失败会调用 OnStopAsync 清理部分初始化资源，清理失败保留 Stopping；停止失败可显式重试停止或释放。暂停和恢复失败时，派生实现撤销部分动作，基类恢复原运行状态。通知异常不回滚已确定的状态。停止调用者取消只结束自己的等待，不中断已经开始的清理。

WorkerBase 仅实现 System.IAsyncDisposable。所有者使用 await using 或等待 DisposeAsync；全部自有资源在 OnStopAsync 释放，包括未启动或部分初始化的情形。停止成功后可以重启，释放开始后普通生命周期入口永久禁用。并发释放共享当前尝试，清理失败可再次 DisposeAsync 重试，成功后重复释放不再清理；IsDisposed 表示清理成功，诊断属性与 ToString 仍可读取。

生命周期回调和状态通知不得反向等待所属工作器的生命周期或释放操作，由回调外的所有者协调后续动作。调用方负责避免循环等待。

工作器命令等待相应异步方法。--timeout 只限制命令等待，不取消已开始的生命周期操作；start --force 仅跳过命令层的 Enabled 检查，WorkerBase 仍按 Enabled 决定能否启动。

## Hangfire 示例

`Zongsoft.Externals.Hangfire` 中的 `Server` 继承自 [`WorkerBase`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/WorkerBase.cs)，启动时创建 `BackgroundJobServer`，停止时释放服务器实例。它还暴露 `Handlers` 集合，让插件把调度处理器挂载到 `/Workbench/Scheduler/Handlers`。

来源：[framework/externals/hangfire/src/Zongsoft.Externals.Hangfire-daemon.plugin](https://github.com/Zongsoft/framework/blob/main/externals/hangfire/src/Zongsoft.Externals.Hangfire-daemon.plugin#L19)（节选；上下文见源文件）。

{% code title="Zongsoft.Externals.Hangfire-daemon.plugin" %}
```xml
	<extension path="/Workspace/Externals/Hangfire">
		<object name="Server" type="Zongsoft.Externals.Hangfire.Server, Zongsoft.Externals.Hangfire">
			<expose name="Handlers" value="{path:../@Handlers}" />
		</object>
	</extension>

	<extension path="/Workbench/Scheduler">
		<object name="Handlers" value="{path:/Workspace/Externals/Hangfire/Server/Handlers}" />
	</extension>

	<extension path="/Workbench/Startup">
		<object name="Hangfire" value="{path:/Workspace/Externals/Hangfire/Server}" />
	</extension>
```
{% endcode %}

这种设计让服务器自身只关心生命周期，而处理器和启动方式由插件文件组合。命令系统还能把 `start`、`stop`、`pause`、`resume` 等操作暴露给终端或管理程序。

[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)适合生命周期明确、可能由宿主统一启动和停止的组件。一次性任务、普通业务服务或没有持续状态的对象，通常不需要实现 `IWorker`。暂停和恢复能力由 `CanPauseAndContinue` 约束；不支持暂停的工作器不应强行暴露暂停语义。

## 参考实现

* [WorkerBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/WorkerBase.cs)
* [Components/Commands 工作者命令](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Commands)
* [Hangfire Server.cs](https://github.com/Zongsoft/framework/blob/main/externals/hangfire/src/Server.cs)
