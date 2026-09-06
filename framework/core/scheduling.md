---
description: 以框架 Hangfire 样例串联调度契约、处理器和宿主生命周期。
icon: calendar
---

# Zongsoft.Scheduling

调度把“什么时候执行”与“执行什么”分开。[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 提供调度公共契约，具体实现决定延迟、周期、持久化和失败处理方式。Discussions 没有现成调度业务，本页沿用框架的 MyHandler 范例。

## 从处理器开始

来源：[framework/externals/hangfire/samples/MyHandler.cs](https://github.com/Zongsoft/framework/blob/main/externals/hangfire/samples/MyHandler.cs#L11)（节选；上下文见源文件）。

{% code title="MyHandler.cs" %}
```csharp
public class MyHandler : HandlerBase<object>
{
	private long _count = 0;

	protected override ValueTask OnHandleAsync(object argument, Parameters parameters, CancellationToken cancellation) =>
		Logging.GetLogging(this).DebugAsync(
			"MyHandler handles the scheduling of the Hangfire.",
			new
			{
				Count = Interlocked.Increment(ref _count),
				Argument = argument,
				Parameters = parameters,
			},
			cancellation);
}
```
{% endcode %}

处理器接收业务参数、扩展 Parameters 和取消令牌。异步接口不意味着当前工作一定耗时或需要后台线程；这里主要是日志写入。

## 挂到调度器可发现的位置

来源：[framework/externals/hangfire/samples/Zongsoft.Externals.Hangfire.Samples.plugin](https://github.com/Zongsoft/framework/blob/main/externals/hangfire/samples/Zongsoft.Externals.Hangfire.Samples.plugin#L19)（节选；上下文见源文件）。

{% code title="Zongsoft.Externals.Hangfire.Samples.plugin" %}
```xml
<extension path="/Workbench/Scheduler/Handlers">
	<object name="MyHandler" type="Zongsoft.Externals.Hangfire.Samples.MyHandler, Zongsoft.Externals.Hangfire.Samples" />
</extension>
```
{% endcode %}

调度作业通过稳定名称关联处理器。重命名类型、处理器名或移动插件时，要考虑存储中已存在作业的引用，否则部署成功后旧作业仍可能无法执行。

## 调度方式与资源

| 方式 | 应核对的内容 |
| --- | --- |
| 延迟执行 | 时间基准、取消、到期时宿主是否运行 |
| 周期执行 | cron 语法、时区、错过触发时的策略 |
| 持久作业 | 存储可用性、重启恢复、参数兼容性 |
| 多实例执行 | 分配机制、重复执行与幂等 |

具体能力以实现为准。Hangfire 集成及存储插件见[项目说明](../externals/projects/hangfire.md)，不能把 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 契约理解为自动具备全部持久化能力。

## 验证与停止

先构建并部署真实样例，再通过所选调度器注册 MyHandler，确认日志包含 Count、Argument 与 Parameters。这个计数在重启后归零，多 Worker 之间不共享；它不是作业完成的持久凭据。

停止时应停止新调度、处理取消并释放服务资源。失败作业可能重试，样例之外的业务动作需要自己的幂等与补偿策略。有关后台宿主见[daemon](../../hosting/daemon.md)。
