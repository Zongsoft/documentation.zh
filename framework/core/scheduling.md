---
description: Zongsoft.Scheduling 调度抽象、触发器选项和 Hangfire 适配用法。
icon: clock
---

# Zongsoft.Scheduling

`Zongsoft.Scheduling` 是核心库中的调度抽象命名空间，用来描述“把哪个处理器安排到什么时候执行”。它不在核心库里内置具体调度引擎，而是提供 `IScheduler`、`ITriggerOptions`、`TriggerOptions` 等协议类型，让 Hangfire 这类外部调度器可以被插件化接入。

调度模型分成三层：业务代码只关心处理器名称、参数和触发选项；调度器负责把这些信息登记到后端引擎；后台服务器在触发时找到对应处理器并执行。这样业务模块可以依赖 Zongsoft 抽象，而不是直接把 Hangfire SDK 写进业务逻辑。

## 主要职责

* 定义作业调度入口：登记、立即触发、取消调度。
* 定义触发选项：标识、Cron 表达式、延迟时长和时区。
* 定义触发器接口：计算下一次触发时间，供需要本地触发计算的实现使用。
* 为 [处理器](components/handler.md)、[工作器](components/worker.md)、宿主程序和外部调度插件提供统一协作方式。

## 核心类型

| 类型 | 说明 |
| --- | --- |
| `IScheduler` | 调度器接口，提供 `ScheduleAsync(...)`、`RescheduleAsync(...)`、`UnscheduleAsync(...)`。 |
| `IScheduler<TOptions>` | 面向某类触发选项的强类型调度器，例如 Cron 调度器或延迟调度器。 |
| `ITriggerOptions` | 触发选项接口，只定义 `Identifier`，用于保存调度后的作业标识。 |
| `TriggerOptions` | 基础触发选项实现，保存通用标识。 |
| `TriggerOptions.Cron` | Cron 触发选项，保存表达式和 `System.TimeZoneInfo`；未指定时区时默认使用 UTC。 |
| `TriggerOptions.Latency` | 延迟触发选项，保存 `System.TimeSpan` 延迟时长。 |
| `Trigger.Options` | 链式构建入口。它本身返回 `null`，由扩展方法按需创建具体选项实例。 |
| `TriggerOptionsExtension` | 提供 `Identifier(...)`、`Cron(...)`、`Delay(...)` 扩展方法。 |
| `ITrigger`、`ITrigger<TOptions>` | 触发器接口，用于根据起始时间计算下一次触发时间。 |
| `ITriggerBuilder` | 触发器构建器接口，用于把选项转换为触发器实例。 |

{% hint style="info" %}
核心库只定义调度协议。是否持久化、是否跨进程执行、是否支持仪表盘、Cron 表达式具体语法，都取决于接入的调度实现。当前 Hangfire 适配位于 `externals/hangfire` 项目集。
{% endhint %}

## 触发选项

触发选项用来告诉调度器“什么时候触发”。`Trigger.Options` 是一个语法入口，配合扩展方法可以从通用标识逐步变成具体选项。

{% code title="BuildTriggerOptions.cs" %}
```csharp
using Zongsoft.Scheduling;

var cron = Trigger.Options
	.Identifier("nightly-report")
	.Cron("0 2 * * *", System.TimeZoneInfo.Local);

var delay = Trigger.Options
	.Delay(System.TimeSpan.FromMinutes(10));
```
{% endcode %}

`Identifier(...)` 用于指定作业标识。对周期性 Cron 作业而言，标识通常也是后续重新触发或取消调度的稳定键；对一次性延迟作业而言，具体实现可能会返回后端调度引擎生成的作业标识。

`Cron(...)` 会创建或更新 `TriggerOptions.Cron`，表达式文本会原样交给调度实现。`Delay(...)` 会创建或更新 `TriggerOptions.Latency`，用于表达“从现在开始延迟一段时间后执行一次”。

## 调度器接口

`IScheduler` 把调度行为压缩成三类操作。

| 方法 | 用途 |
| --- | --- |
| `ScheduleAsync(string name, ITriggerOptions options, ...)` | 调度无显式参数的处理器。 |
| `ScheduleAsync<TArgument>(string name, TArgument argument, ITriggerOptions options, ...)` | 调度带参数的处理器。 |
| `RescheduleAsync(string identifier, ...)` | 对已登记作业发起一次重新触发。具体语义由实现决定。 |
| `UnscheduleAsync(string identifier, ...)` | 取消已登记作业。 |

`name` 是任务名称，也是处理器标识。调度实现通常在触发时根据该名称到处理器集合中查找 `IHandler` 或 `IHandler<TArgument>`。

{% code title="ScheduleWithService.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Scheduling;

var scheduler = ApplicationContext.Current.Services.Find<IScheduler>("Cron");
var options = Trigger.Options
	.Identifier("nightly-report")
	.Cron("0 2 * * *", System.TimeZoneInfo.Local);

var identifier = await scheduler.ScheduleAsync(
	"Report",
	new { TenantId = 1 },
	options,
	cancellation);
```
{% endcode %}

如果调用方已经知道触发选项类型，也可以依赖 `IScheduler<TriggerOptions.Cron>` 或 `IScheduler<TriggerOptions.Latency>`，让编译器约束选项类型。通过非泛型 `IScheduler` 调用时，如果把 Cron 选项传给只支持延迟的实现，适配器会把选项转换失败并抛出参数异常。

## Hangfire 适配

`Zongsoft.Externals.Hangfire` 把 Hangfire 接入 `Zongsoft.Scheduling`，并通过服务匹配提供两个调度器。

| 服务匹配名 | 选项类型 | Hangfire 行为 |
| --- | --- | --- |
| `Cron` | `TriggerOptions.Cron` | 使用 Hangfire 周期作业登记或更新作业。 |
| `Latency` | `TriggerOptions.Latency` | 使用 Hangfire 后台作业客户端创建延迟作业。 |

调度器的存储来自 Zongsoft 服务容器解析到的 Hangfire [`JobStorage`](https://api.hangfire.io/html/T_Hangfire_JobStorage.htm)；如果没有解析到服务则回退到 [`JobStorage.Current`](https://api.hangfire.io/html/P_Hangfire_JobStorage_Current.htm)。因此在实际宿主中应先配置 Hangfire 存储，再启动调度服务器。

### Cron 调度

Cron 调度器会检查表达式是否为空；如果没有提供标识，会生成一个以 `X` 开头的随机标识。登记作业时，它使用触发选项里的 Cron 表达式和时区。

`RescheduleAsync(identifier)` 对 Cron 作业的语义是立即触发一次已登记的周期作业；`UnscheduleAsync(identifier)` 会移除同名周期作业。Cron 作业适合定时报表、定期同步、每日清理等需要稳定标识和可重复触发的任务。

{% code title="ScheduleCronJob.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Scheduling;

var scheduler = ApplicationContext.Current.Services.Find<IScheduler>("Cron");

await scheduler.ScheduleAsync(
	"Report",
	Trigger.Options
		.Identifier("report.daily")
		.Cron("0 2 * * *", System.TimeZoneInfo.Local),
	cancellation);

await scheduler.RescheduleAsync("report.daily", cancellation);
```
{% endcode %}

### 延迟调度

延迟调度器会创建一次性延迟作业。作业标识以 Hangfire 创建后返回的标识为准，即使调用方在选项里预先设置了 `Identifier`，返回值也会被后端生成的标识覆盖。

`RescheduleAsync(identifier)` 对延迟作业的语义是重新入队；`UnscheduleAsync(identifier)` 会删除对应后台作业。延迟作业适合超时补偿、稍后重试、延迟通知等一次性任务。

{% code title="ScheduleDelayJob.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Scheduling;

var scheduler = ApplicationContext.Current.Services.Find<IScheduler>("Latency");

var identifier = await scheduler.ScheduleAsync(
	"SendMail",
	new { MessageId = 1001 },
	Trigger.Options.Delay(System.TimeSpan.FromMinutes(10)),
	cancellation);
```
{% endcode %}

## 配置驱动调度

业务系统通常不会把 Cron 表达式和处理器名称写死在代码里，而是把它们保存成一条调度配置。例如：

| 配置项 | 建议含义 |
| --- | --- |
| `Scheduler` | 调度器服务匹配名，例如 `Cron` 或 `Latency`。 |
| `SchedulerSettings` | 调度器参数。对 Cron 调度而言通常是 Cron 表达式。 |
| `Handler` | 处理器标识，应与 `/Workbench/Scheduler/Handlers` 下的对象名一致。 |
| `HandlerSettings` | 传给处理器的业务参数，可按业务约定保存为字符串、JSON 或其他可序列化内容。 |
| 业务记录编号 | 可作为 Cron 作业的稳定 `Identifier`，方便启停和重新触发。 |

启用配置时，业务服务根据 `Scheduler` 找到对应调度器，把 `HandlerSettings` 作为参数传给处理器，并用业务记录编号构造稳定的 Cron 作业标识；停用配置时，用同一个标识取消调度。

{% code title="ToggleSchedule.cs" %}
```csharp
using System;
using System.Threading;
using System.Threading.Tasks;

using Zongsoft.Scheduling;
using Zongsoft.Services;

var scheduler = serviceProvider.Find<IScheduler>(schedule.Scheduler);
var identifier = schedule.SchedulingId.ToString();

if(schedule.Status)
{
	await scheduler.ScheduleAsync(
		schedule.Handler,
		schedule.HandlerSettings,
		new TriggerOptions.Cron(identifier, schedule.SchedulerSettings, TimeZoneInfo.Local),
		cancellation);
}
else
{
	await scheduler.UnscheduleAsync(identifier, cancellation);
}
```
{% endcode %}

{% hint style="warning" %}
配置驱动调度应先确认配置记录仍然可用，并且 `Scheduler` 能解析到对应调度器。启停状态、调度登记和取消调度如果分属不同存储，业务服务还应考虑失败补偿，避免出现“数据库显示已启用，但后端作业没有登记”这类状态不一致。
{% endhint %}

## 处理器与服务器

Hangfire 触发作业时不会直接调用业务服务，而是进入 `Scheduler.HandlerFactory`：它会遍历当前应用中的 Hangfire `Server` 工作者，在每个服务器的 `Handlers` 集合里按任务名称查找处理器。找到后，如果处理器实现了泛型处理器接口，则优先按强类型参数调用；否则按普通处理器调用。

`Zongsoft.Externals.Hangfire.Daemon` 插件会创建一个 Hangfire `Server`，并把服务器的 `Handlers` 暴露到 `/Workbench/Scheduler/Handlers`。业务插件可以把自己的处理器挂到这个路径下。

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

{% code title="MyHandler.cs" %}
```csharp
using System.Threading;
using System.Threading.Tasks;

using Zongsoft.Components;

public class MyHandler : HandlerBase<object>
{
	protected override ValueTask OnHandleAsync(
		object argument,
		Zongsoft.Collections.Parameters parameters,
		CancellationToken cancellation)
	{
		return DoWorkAsync(argument, cancellation);
	}
}
```
{% endcode %}

{% code title="MyPlugin.plugin" %}
```xml
<extension path="/Workbench/Scheduler/Handlers">
	<object name="SendMail" type="MyCompany.Scheduling.SendMailHandler, MyCompany.Scheduling" />
	<object name="Report" type="MyCompany.Scheduling.ReportHandler, MyCompany.Scheduling" />
</extension>
```
{% endcode %}

{% hint style="warning" %}
如果触发时没有任何运行中的 Hangfire `Server` 暴露匹配名称的处理器，适配器只会记录“未找到处理器”的警告，作业本身不会自动补上业务处理逻辑。生产环境应确认服务器已随宿主启动，并且处理器名称与 `ScheduleAsync(...)` 的 `name` 参数一致。
{% endhint %}

## 命令入口

`Zongsoft.Externals.Hangfire` 还把调度操作挂到命令树 `/Workbench/Executor/Commands/Scheduler` 下，包含 `Schedule`、`Reschedule`、`Unschedule` 三个子命令。命令执行时先选择调度器，再对一个或多个处理器名称执行操作。

{% code title="SchedulerCommands.txt" %}
```text
Scheduler Cron Schedule Report --id report.daily --cron "0 2 * * *"
Scheduler Latency Schedule SendMail --delay "00:10:00"
Scheduler Cron Reschedule report.daily
Scheduler Cron Unschedule report.daily
```
{% endcode %}

命令里的 `--cron` 会构建 `TriggerOptions.Cron`，`--delay` 会构建 `TriggerOptions.Latency`。如果没有显式指定 `--id`，命令会用当前毫秒时间戳生成一个临时标识。

## 存储与 Web 仪表盘

Hangfire 适配项目还包含两个配套扩展：

| 扩展包 | 用途 |
| --- | --- |
| `Zongsoft.Externals.Hangfire.Storages.Redis` | 注册 Hangfire [`JobStorage`](https://api.hangfire.io/html/T_Hangfire_JobStorage.htm)，从 `/Externals/Redis/ConnectionSettings` 中选择名为 `Hangfire` 且驱动为 `Redis` 的连接配置；找不到时按默认 Redis 配置或首个 Redis 配置回退。 |
| `Zongsoft.Externals.Hangfire.Web` | 在 Web 宿主中注册 Hangfire 服务，并启用 Hangfire Dashboard。 |

如果应用需要跨进程执行、重启后保留作业或查看调度状态，应配置持久化存储。Redis 存储扩展依赖 Redis 连接配置，具体连接项格式可参考 [连接配置](../data/connections.md) 和 [选项配置文件](../../references/option-files.md)。

## 使用建议

* 周期性、需要稳定标识和人工触发的任务，优先使用 `Cron` 调度。
* 一次性延迟执行、稍后重试或超时补偿，优先使用 `Latency` 调度。
* 业务代码优先依赖 `IScheduler` 或 `IScheduler<TOptions>`，不要直接依赖 Hangfire 类型，除非正在编写 Hangfire 适配或诊断工具。
* 处理器名称应当稳定、可读，并与插件中挂载到 `/Workbench/Scheduler/Handlers` 的对象名保持一致。
* Cron 表达式和时区由调度实现解释；涉及本地时间、夏令时或多时区租户时，应显式传入时区并在业务上约定清楚。
* 调度方法返回的标识应保存起来，后续重新触发或取消调度都依赖这个标识。延迟作业尤其应使用返回值，而不是假定调用前设置的 `Identifier` 会被保留。

## 相关资源

* [Scheduling 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Scheduling)
* [Zongsoft.Externals.Hangfire 源码目录](https://github.com/Zongsoft/framework/tree/main/externals/hangfire)
* [Hangfire 周期作业文档](https://docs.hangfire.io/en/latest/background-methods/performing-recurrent-tasks.html)
