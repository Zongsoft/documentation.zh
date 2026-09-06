---
description: 采用 Hangfire 处理器和框架日志测试说明日志入口、上下文与落盘。
icon: stethoscope
---

# Zongsoft.Diagnostics

诊断日志记录发生了什么、发生在哪里以及必要上下文。Discussions 没有独立的日志处理器范例，因此采用框架 Hangfire 的现有处理器与文本日志测试。遥测指标和追踪另见[Telemetry](diagnostics/telemetry.md)。

## 业务处理器怎样写日志

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

Logging.GetLogging(this) 根据当前对象取得日志入口，异步记录消息以及 Count、Argument、Parameters。计数器是进程内状态，不是持久化执行次数；同一任务重试也可能再次计数。

这里的上下文适合排障，但实际任务参数可能包含敏感信息。扩展这个样例时只记录必要字段，不应照搬“把整个参数对象写入日志”的做法处理用户数据。

## 日志入口与输出实现

日志级别表达严重程度，来源用于定位模块，异常对象保留调用链，附加数据承载结构化上下文。Logger 负责输出，Predication 负责筛选，Logging 组织入口与分发；注册成功不意味着目标文件、数据库或远端接收器已经可用。

## 文本日志的真实并发测试

来源：[framework/Zongsoft.Core/test/Diagnostics/TextFileLoggerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Diagnostics/TextFileLoggerTest.cs#L13)（节选；上下文见源文件）。

{% code title="TextFileLoggerTest.cs" %}
```csharp
public async Task TestInfoAsync()
{
	const int COUNT = 512;

	using var context = new LoggerContext();
	using var logger = context.CreateLogger(16);

	await Parallel.ForAsync(0, COUNT, TestContext.Current.CancellationToken, async (index, cancellation) =>
	{
		await logger.LogAsync(new LogEntry(LogLevel.Info, "ConcurrentInfo", GetMessage(index)), cancellation);
	});

	await logger.FlushAsync(TestContext.Current.CancellationToken);

	var content = context.ReadAllText();
	AssertMessages(content, COUNT);
}
```
{% endcode %}

LoggerContext、GetMessage 与 AssertMessages 都来自同一测试文件。测试并发写入后显式 Flush，再检查每条消息恰好出现一次。它验证这个文本日志实现的局部行为，不是分布式日志投递承诺。

## 筛选、刷新与退出

日志过滤应先控制来源和级别，再考虑输出成本。缓冲日志可能在刷新前仍未落盘，进程退出和异常路径需要检查 Flush 与释放时机。错误日志和普通信息日志是否使用同样缓冲策略，应以实现和测试为准。

文件路径、滚动、资源文本和异常序列化也要与实际输出器一起检查。不要为了演示扩展接口凭空定义一个数据库日志类；现有实现可从[诊断源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Diagnostics)与[日志断言](common/predication.md)继续阅读。

相关页面：[缓冲器](caching/spooler.md)、[诊断配置](../diagnostics.md)、[运行排障](../../get-started/run-and-debug.md)。
