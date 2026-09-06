---
description: 通过框架 Hangfire 样例说明处理器注册、作业执行和重试边界。
icon: calendar-check
---

# 任务调度与弹性执行

Discussions 当前没有定时清理、消息重试或日报处理器。因此本页采用框架 externals/hangfire/samples 中的 MyHandler。

## 已存在的任务处理器

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

处理器记录参数和执行次数；它不发送邮件、不修改论坛数据，也不持久化计数。它适合先确认调度器能够找到并调用处理器。

## 清单注册

来源：[framework/externals/hangfire/samples/Zongsoft.Externals.Hangfire.Samples.plugin](https://github.com/Zongsoft/framework/blob/main/externals/hangfire/samples/Zongsoft.Externals.Hangfire.Samples.plugin#L19)（节选；上下文见源文件）。

{% code title="Zongsoft.Externals.Hangfire.Samples.plugin" %}
```xml
<extension path="/Workbench/Scheduler/Handlers">
	<object name="MyHandler" type="Zongsoft.Externals.Hangfire.Samples.MyHandler, Zongsoft.Externals.Hangfire.Samples" />
</extension>
```
{% endcode %}

稳定处理器名称是 MyHandler。程序集和清单还依赖 Hangfire 主插件。完整运行需要配置存储并启动服务器，只有加载样例 DLL 不会自动产生作业。

## 调度与执行分开理解

调度器决定什么时候执行以及传入什么数据；处理器实现执行内容。周期、延迟和重试都有各自配置，不能把一种执行结果当作所有策略的保证。现有接入方式见[Hangfire 项目](projects/hangfire.md)。

## 弹性策略

Polly 提供重试、超时等执行策略的集成，和任务持久化是不同层次。一次操作超时可能已经产生副作用；重试会再次调用它。因此业务动作应明确幂等键、成功判据和补偿，不要对所有异常机械重试。

若以后为 Discussions 增加后台任务，应先选定真实业务入口并保留 SiteId 与权限上下文，再评估事务、重复执行和存储故障。相关阅读：[调度](../core/scheduling.md)、[Polly](projects/polly.md)、[业务事务](../data/transactions.md)。
