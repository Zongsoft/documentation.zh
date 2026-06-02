---
description: Zongsoft.Components Worker 工作器模型与工作器命令。
icon: person-running
---

# Worker

`Worker` 是 Zongsoft 中可被启动、停止、暂停和恢复的运行时组件模型。它适合表达后台服务、事件交换器、调度服务器、消息监听器、设备采集器等具有生命周期的对象。

工作器把生命周期命令和运行状态统一起来。宿主程序、终端命令或插件启动流程可以用同一组方法控制不同运行时组件。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IWorker` | 工作者接口，定义 `Start`、`Stop`、`Pause`、`Resume` 及对应异步方法。 |
| `WorkerBase` | 工作者基类，负责状态切换、重入控制、启用判断和状态变化事件。 |
| `WorkerState` | 工作者状态枚举，包括停止、运行、暂停等状态。 |
| `WorkerCommandBase` | 工作者命令基类，用于把工作者生命周期操作暴露成命令。 |
| `WorkerStartCommand`、`WorkerStopCommand` | 启动和停止工作者。 |
| `WorkerPauseCommand`、`WorkerResumeCommand` | 暂停和恢复工作者。 |
| `WorkerInfoCommand` | 查看工作者状态和基本信息。 |

## 生命周期

{% stepper %}
{% step %}
## Start

`WorkerBase.StartAsync(...)` 检查启用状态和当前状态，进入 `Starting`，然后调用派生类的启动逻辑，成功后进入 `Running`。
{% endstep %}

{% step %}
## Pause / Resume

如果工作者支持暂停和继续，调用暂停或恢复命令会切换状态，并触发对应的模板方法。
{% endstep %}

{% step %}
## Stop

停止过程进入 `Stopping`，释放运行中的资源，例如关闭事件通道、停止调度服务器、注销订阅或释放外部连接，最终回到 `Stopped`。
{% endstep %}
{% endstepper %}

## Hangfire 示例

`Zongsoft.Externals.Hangfire` 中的 `Server` 继承自 `WorkerBase`，启动时创建 `BackgroundJobServer`，停止时释放服务器实例。它还暴露 `Handlers` 集合，让插件把调度处理器挂载到 `/Workbench/Scheduler/Handlers`。

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

工作器适合生命周期明确、可能由宿主统一启动和停止的组件。一次性任务、普通业务服务或没有持续状态的对象，通常不需要实现 `IWorker`。暂停和恢复能力由 `CanPauseAndContinue` 约束；不支持暂停的工作器不应强行暴露暂停语义。

## 参考实现

* [WorkerBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/WorkerBase.cs)
* [Components/Commands 工作者命令](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Commands)
* [Hangfire Server.cs](https://github.com/Zongsoft/framework/blob/main/externals/hangfire/src/Server.cs)
