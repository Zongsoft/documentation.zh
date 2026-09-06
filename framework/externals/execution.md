---
description: 使用 Hangfire 执行持久后台作业，用 Polly 为当前调用配置重试、超时和熔断。
icon: clock
---

# 任务调度与弹性执行

后台调度决定“什么时候由哪个工作进程执行”，弹性策略决定“一次调用遇到暂时故障时怎样处理”。Hangfire 和 Polly 可以配合使用，但持久任务、调用重试和业务幂等是三个独立问题。

## Hangfire 的部署角色

| 产物 | 负责什么 |
| --- | --- |
| `Zongsoft.Externals.Hangfire` | 周期/延迟调度器及后台服务器集成 |
| `Zongsoft.Externals.Hangfire-daemon.plugin` | 启动后台 Server，挂载处理器集合 |
| `Zongsoft.Externals.Hangfire.Storages.Redis` | 可选的 Redis 作业存储，使用 `Hangfire` 连接 |
| `Zongsoft.Externals.Hangfire.Web` | Web Dashboard 接入 |

先配置作业存储，再启动调度器和工作器。Dashboard 展示和管理任务，不代表已有进程负责执行任务。部署附加清单时，应核对 `site` 对应的 daemon 变体是否进入运行目录。

## 注册稳定的处理器名称

实现 Core 的处理器契约，并在业务插件中挂载到 `/Workbench/Scheduler/Handlers`。下面的 `Report` 是任务持久化时使用的名称，应保持稳定；更名时要考虑存储中的旧任务。

{% code title="ReportHandler.cs" %}
```csharp
using Zongsoft.Components;
using Zongsoft.Collections;

namespace Acme.Jobs;

public sealed class ReportHandler : HandlerBase<int>
{
	protected override ValueTask OnHandleAsync(int reportId,
		Parameters parameters, CancellationToken cancellation)
	{
		cancellation.ThrowIfCancellationRequested();
		Console.WriteLine($"Report #{reportId}");
		return ValueTask.CompletedTask;
	}
}
```
{% endcode %}

{% code title="Acme.Jobs.plugin（扩展片段）" %}
```xml
<extension path="/Workbench/Scheduler/Handlers">
	<object name="Report" type="Acme.Jobs.ReportHandler, Acme.Jobs" />
</extension>
```
{% endcode %}

完整清单还需声明程序集和相应插件依赖。任务参数必须可序列化，应传业务标识而不是请求上下文或打开的连接；执行时再查询所需数据。

## 调度一次或周期任务

以下片段假设宿主已经注册 Hangfire 的延迟调度器和上面的处理器。

{% code title="ScheduleReport.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Scheduling;

var scheduler = ApplicationContext.Current.Services
	.ResolveRequired<IScheduler<TriggerOptions.Latency>>();
var identifier = await scheduler.ScheduleAsync("Report", 42,
	new TriggerOptions.Latency(TimeSpan.FromMinutes(5)));
Console.WriteLine(identifier);
```
{% endcode %}

周期任务使用 `IScheduler<TriggerOptions.Cron>`，例如 `new TriggerOptions.Cron("daily-report", "0 2 * * *", TimeZoneInfo.Utc)`。这表示按指定时区每天 02:00 触发；应显式选择时区，并验证夏令时或停机后的实际调度结果。

返回标识是任务标识，不是任务完成结果。可用 `RescheduleAsync` 再次触发、`UnscheduleAsync` 删除调度；已经开始的业务工作是否终止，需要结合取消与处理器实现判断。

## 并发、重试与停机

`workerCount` 控制工作线程规模，`scheduleInterval` 控制计划任务轮询。增大并发前先确认数据库及外部接口承载能力。处理器必须容忍重试和重复执行，关键副作用以业务唯一键去重。

停机时应停止接收新任务并给在途任务合理时间。若任务调用链还配置 Polly 重试，总尝试次数可能叠加，应统一计算超时预算，避免一次作业在多个层次反复重试。

## Polly 的执行策略

Polly 插件将 Core 的[执行管线](../core/components/executor.md)接入具体弹性策略，通过插件树把管线构建器绑定到执行器。

| 特性 | 用途 | 应用需要决定的边界 |
| --- | --- | --- |
| `RetryFeature` | 暂时失败后重试 | 哪些异常可重试，操作是否可安全重放 |
| `TimeoutFeature` | 限制调用等待 | 被调用代码是否响应取消 |
| `BreakerFeature` | 故障集中时暂时拒绝新请求 | 恢复探测与业务降级 |
| `ThrottleFeature` | 控制并发或进入速率 | 被拒绝请求如何应答 |
| `FallbackFeature` | 使用替代结果或操作 | 不能把失败伪装成真实成功 |

策略顺序会影响总耗时和重试范围。回调泛型签名还必须与执行模式匹配；当前熔断开闭回调不能保证取得原始执行参数，而自定义限流与回退实现提供了相应参数路径。限流拒绝回调返回 `true` 表示已处理，会影响异常传播。

先用确定的短操作验证重试次数、超时、取消和最终异常，再接入业务。不能仅部署插件就认为全部数据访问或 HTTP 调用自动带有这些策略。

源码入口：[Hangfire](https://github.com/Zongsoft/framework/tree/main/externals/hangfire)、[Polly 策略与示例](https://github.com/Zongsoft/framework/tree/main/externals/polly)。
