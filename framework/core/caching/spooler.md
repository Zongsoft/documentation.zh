---
description: 从框架日志实现和现有测试理解批量缓冲、触发条件、并发刷新与数据消费。
icon: layer-group
---

# Spooler

Spooler 把连续到达的条目暂存起来，再交给批量回调处理。框架的文件日志器使用它减少逐条写文件的开销。它是进程内缓冲，条目尚未交给持久化系统时，进程退出仍可能造成丢失。

## 真实使用位置：文件日志

来源：[framework/Zongsoft.Core/src/Diagnostics/FileLogger.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Diagnostics/FileLogger.cs#L57)（节选；上下文见源文件）。

{% code title="FileLogger.cs" %}
```csharp
protected FileLogger(TimeSpan period, int capacity, string filePath, int fileLimit = FILE_LIMIT)
{
	this.FilePath = filePath?.Trim();
	this.FileLimit = Math.Max(fileLimit, 0);
	this.Logging = period > TimeSpan.Zero || capacity > 1 ? new(this.OnFlushAsync, period, capacity) : null;
}
```
{% endcode %}

构造函数根据 period 和 capacity 决定是否启用 Logging 缓冲。真正的写入和文件大小管理由日志器的 OnFlushAsync 实现；Spooler 本身只组织条目的暂存和交付。日志业务范例见[诊断日志](../diagnostics.md)。

## 从放入到显式刷新

Discussions 没有直接使用 Spooler，下面采用框架测试。Flusher 是同一文件中的测试接收器，它消费收到的条目并累加数量；TestContext 提供测试取消令牌。

来源：[framework/Zongsoft.Core/test/Caching/SpoolerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/SpoolerTest.cs#L30)（节选；上下文见源文件）。

{% code title="SpoolerTest.cs" %}
```csharp
public async Task TestFlushAsync()
{
	const int COUNT = 1000;

	var flusher = new Flusher<string>();
	using var spooler = new Spooler<string>(flusher.OnFlushAsync, TimeSpan.FromHours(1));
	Assert.True(spooler.IsEmpty);
	Assert.Equal(0, flusher.Count);

	await spooler.FlushAsync(TestContext.Current.CancellationToken);
	Assert.True(spooler.IsEmpty);
	Assert.Equal(0, flusher.Count);

	#if NET8_0_OR_GREATER
	await Parallel.ForAsync(0, COUNT, TestContext.Current.CancellationToken, async (index, cancellation) => await spooler.PutAsync($"Value#{index}", cancellation));
	#else
	for(int i = 0; i < COUNT; i++)
		await spooler.PutAsync($"Value#${i}", TestContext.Current.CancellationToken);
	#endif

	Assert.Equal(COUNT, spooler.Count);

	await spooler.FlushAsync(TestContext.Current.CancellationToken);
	Assert.True(spooler.IsEmpty);
	Assert.Equal(COUNT, flusher.Count);
}
```
{% endcode %}

PutAsync 完成说明条目已被接收，或者写入容量触发了刷新；它不统一代表外部持久化完成。FlushAsync 则等待本次刷新的回调结束。回调必须真正消费收到的序列，才能把条目从缓冲中取走。

## 容量与周期分别怎样触发

来源：[framework/Zongsoft.Core/test/Caching/SpoolerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/SpoolerTest.cs#L58)（节选；上下文见源文件）。

{% code title="SpoolerTest.cs" %}
```csharp
public async Task TestLimitAsync()
{
	var flusher = new Flusher<string>();
	using var spooler = new Spooler<string>(flusher.OnFlushAsync, TimeSpan.FromHours(1), 3);
	Assert.True(spooler.IsEmpty);
	Assert.Equal(0, flusher.Count);

	await spooler.PutAsync("A", TestContext.Current.CancellationToken);
	await spooler.PutAsync("B", TestContext.Current.CancellationToken);
	await spooler.PutAsync("C", TestContext.Current.CancellationToken);
	Assert.Equal(3, spooler.Count);
	Assert.Equal(0, flusher.Count);

	//触发数量限制
	await spooler.PutAsync("D", TestContext.Current.CancellationToken);

	Assert.False(spooler.IsEmpty);
	Assert.Equal(1, spooler.Count);
	Assert.Equal(3, flusher.Count);
}
```
{% endcode %}

这个测试把容量设为 3。前三条进入缓冲，第 4 条放入时触发前三条的刷新，随后第 4 条留在缓冲中。不要把容量理解为“第 3 条加入后立即全部落盘”。容量为零时使用无界缓冲，应结合消费速度观察内存增长。

周期触发由内部计时器调用 FlushAsync。在支持修改 Period 的目标框架上，现有 [TestPeriodAsync](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/SpoolerTest.cs) 把一小时周期调整为 1 毫秒，并等待回调完成。这里的时间用于测试，不是推荐部署参数。

## 并发刷新与回调责任

来源：[framework/Zongsoft.Core/test/Caching/SpoolerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/SpoolerTest.cs#L105)（节选；上下文见源文件）。

{% code title="SpoolerTest.cs" %}
```csharp
public async Task TestConcurrentFlushAsync()
{
	const int COUNT = 256;
	const int CONCURRENCY = 16;

	var flusher = new RecordingFlusher<int>(TimeSpan.FromMilliseconds(10));
	using var spooler = new Spooler<int>(flusher.OnFlushAsync, TimeSpan.FromHours(1));

	for(int i = 0; i < COUNT; i++)
		await spooler.PutAsync(i, TestContext.Current.CancellationToken);

	var tasks = Enumerable.Range(0, CONCURRENCY).Select(_ => spooler.FlushAsync(TestContext.Current.CancellationToken).AsTask()).ToArray();
	await Task.WhenAll(tasks);

	Assert.True(spooler.IsEmpty);
	Assert.Equal(1, flusher.Calls);
	Assert.Equal(1, flusher.MaximumConcurrency);
	Assert.Equal(COUNT, flusher.Count);
	Assert.Equal(Enumerable.Range(0, COUNT), flusher.Values.OrderBy(value => value));
}
```
{% endcode %}

RecordingFlusher 在同一个测试文件中记录并发数、调用次数和条目集合。测试验证多个 FlushAsync 请求不会并发进入回调，且这一批条目只被消费一次。这不等于外部系统具有恰好一次交付语义；超时重试和幂等仍由实际接收端负责。

{% hint style="warning" %}
🚨 Spooler 的枚举会消费缓冲中的条目，刷新回调拿到的序列也按读取取走条目。不要为“查看当前内容”遍历它，也不要在同一回调里先 Count 再第二次遍历进行写入。需要多次使用一批数据时，应在回调内一次性物化，再操作这份本地集合。
{% endhint %}

回调抛异常不会自动把已经读出的条目放回缓冲。需要可靠投递时应使用持久化消息或事务机制，并阅读[消息可靠性](../../messaging/reliability.md)。

## 清空、停机与释放

Clear 取出并丢弃当前条目，不调用刷新回调。Dispose 停止计时器并结束通道，不替代业务要求的最终刷新。停机时先停止生产者，再等待需要的刷新结束，最后释放拥有的实例；无法接受丢失的数据应先持久化。

period 应根据允许延迟确定，limit 应结合单批耗时与内存占用确定。框架 [Spooler.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/Spooler.cs) 给出具体边界，命令行交互用例在 [samples/spooler](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/samples/spooler)。
