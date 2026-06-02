---
description: Spooler<T> 异步缓冲器的用途、刷新机制和并发行为。
icon: rotate
---

# Spooler&lt;T&gt;

`Spooler<T>` 是一个面向高频写入场景的异步缓冲器。它底层使用 [`System.Threading.Channels`](https://learn.microsoft.com/zh-cn/dotnet/core/extensions/channels) _[源码](https://source.dot.net/#System.Threading.Channels)_ 保存待处理数据，并按周期或数量阈值把一批数据交给刷新回调处理。

典型场景包括日志写入、遥测上报、采集数据入库、批量推送等。它的目标不是长期缓存数据，而是把高频小写入合并为较低频率的批量处理。

## 基本原理

`Spooler<T>` 可以理解为一个“生产者写入、消费者批量刷新”的小型缓冲管线：

1. 调用方通过 `PutAsync` 把数据写入内部通道。
2. 周期定时器按 `period` 调用 `FlushAsync`。
3. 如果通道达到 `limit` 限制，`PutAsync` 会主动触发一次刷新。
4. `FlushAsync` 把当前可读取的数据包装成 `IEnumerable<T>`，交给刷新回调处理。
5. 刷新回调枚举数据时，数据会从内部通道中被读取并移出。

这意味着 `Spooler<T>` 不会为每条数据立即执行 I/O，而是把瞬时高频写入转换成批量处理。它适合“允许短暂延迟，但希望降低写入频率”的场景。

{% hint style="warning" %}
`Spooler<T>` 不是持久化队列。进程退出、对象释放或调用 `Clear` 都可能让尚未刷新的数据丢失。对于不能丢失的数据，应在刷新回调里尽快落到可靠介质，或使用具备持久化能力的消息队列。
{% endhint %}

## 代码架构

源码主体围绕四个字段展开：

| 成员 | 作用 |
| --- | --- |
| `_channel` | 保存待刷新的数据。`limit > 0` 时创建有界通道，否则创建无界通道。 |
| `_timer` | 周期触发 `OnTickAsync`，再调用 `FlushAsync`。 |
| `_flushing` | 刷新互斥标记，保证同一时间只有一个刷新回调运行。 |
| `_flusher` | 用户提供的刷新回调，真正执行批量写入或批量上报。 |

核心流程可以按下面的源码骨架理解：

{% code title="SpoolerArchitecture.cs" %}
```csharp
public class Spooler<T> : IEnumerable<T>, IDisposable
{
	private readonly int _limit;

	private int _flushing;
	private Common.Timer _timer;
	private Channel<T> _channel;
	private Func<IEnumerable<T>, CancellationToken, ValueTask> _flusher;

	public async ValueTask PutAsync(T value, CancellationToken cancellation = default)
	{
		if(this.GetChannel(out var channel) && channel.Writer.TryWrite(value))
			return;

		await this.FlushAsync(cancellation);
		await channel.Writer.WaitToWriteAsync(cancellation);
		await channel.Writer.WriteAsync(value, cancellation);
	}

	public async ValueTask FlushAsync(CancellationToken cancellation = default)
	{
		while(!this.IsEmpty)
		{
			if(Interlocked.CompareExchange(ref _flushing, 1, 0) == 0)
			{
				try
				{
					await this.OnFlushAsync(
						new Iterable(this.GetChannel().Reader, _limit),
						cancellation);
				}
				finally
				{
					Volatile.Write(ref _flushing, 0);
				}

				return;
			}

			await Task.Yield();
		}
	}
}
```
{% endcode %}

这里最关键的是 `PutAsync` 和 `FlushAsync` 的配合：

* 写入成功时，`PutAsync` 很快返回。
* 写入失败通常意味着有界通道已满，此时先刷新，再等待通道恢复可写。
* `FlushAsync` 使用 `Interlocked.CompareExchange` 抢占刷新权，避免并发刷新。
* 内部 `Iterable` 每次最多读取 `limit` 条数据；如果 `limit` 为 `0`，则读取当前可读的全部数据。

## 构造函数

{% code title="CreateSpooler.cs" %}
```csharp
using Zongsoft.Caching;

var spooler = new Spooler<string>(
	flusher: async (items, cancellation) =>
	{
		foreach(var item in items)
			await WriteLineAsync(item, cancellation);
	},
	period: TimeSpan.FromSeconds(5),
	limit: 1_000);
```
{% endcode %}

| 参数 | 说明 |
| --- | --- |
| `flusher` | 刷新回调，接收本批次要处理的数据。 |
| `period` | 周期刷新间隔。 |
| `limit` | 缓冲数量上限；为 `0` 表示不启用数量限制。 |

当 `limit` 大于零时，内部使用有界 `Channel<T>`；否则使用无界 `Channel<T>`。

## 写入与刷新

`PutAsync` 将数据写入缓冲区。如果缓冲区已满，它会先触发 `FlushAsync`，等待可写入后再写入当前数据。

{% code title="PutAndFlushSpooler.cs" %}
```csharp
await spooler.PutAsync("A");
await spooler.PutAsync("B");
await spooler.PutAsync("C");

await spooler.FlushAsync();
```
{% endcode %}

`FlushAsync` 会把当前缓冲区中的数据作为一个可枚举批次传给刷新回调。刷新回调枚举 `items` 时，元素会从内部通道中被读取并移出。

{% hint style="warning" %}
传入刷新回调的 `IEnumerable<T>` 是流式读取视图，不是已经复制好的快照。刷新回调应在方法内部完成枚举，不要把它保存到方法外延迟使用。
{% endhint %}

如果刷新逻辑需要多次遍历数据，请在回调内部先复制为数组或列表。

{% code title="SnapshotSpoolerItems.cs" %}
```csharp
var spooler = new Spooler<int>(
	flusher: async (items, cancellation) =>
	{
		var batch = items.ToArray();

		await SaveBatchAsync(batch, cancellation);
		await WriteAuditAsync(batch.Length, cancellation);
	},
	period: TimeSpan.FromSeconds(5),
	limit: 500);
```
{% endcode %}

## 周期刷新

构造 `Spooler<T>` 后，内部定时器会自动启动，并按 `period` 周期调用 `FlushAsync`。

在 .NET 8 及以上目标框架中，可以通过 `Period` 属性动态调整刷新周期。

{% code title="SpoolerPeriod.cs" %}
```csharp
#if NET8_0_OR_GREATER
spooler.Period = TimeSpan.FromMilliseconds(500);
#endif
```
{% endcode %}

## 数量阈值

`Limit` 用于控制单批最多读取多少个元素，也用于有界通道容量。当写入速度超过缓冲容量时，`PutAsync` 会触发刷新，释放通道空间。

{% code title="SpoolerLimit.cs" %}
```csharp
using var spooler = new Spooler<int>(
	flusher: async (items, cancellation) =>
	{
		await SaveBatchAsync(items.ToArray(), cancellation);
	},
	period: TimeSpan.FromSeconds(10),
	limit: 100);
```
{% endcode %}

数量阈值适合控制单批处理规模，例如限制每次数据库批量写入的行数，或限制每次网络推送的数据量。

## 并发刷新

`Spooler<T>` 使用内部标记保证同一时间只有一个刷新回调运行。多个调用方同时触发 `FlushAsync` 时，只有一个调用方会真正执行刷新，其它调用方会等待刷新状态变化。

这让 `PutAsync`、周期刷新和显式 `FlushAsync` 可以同时存在，而不会让同一批数据被多个刷新回调重复处理。

并发写入时，多个生产者可以同时调用 `PutAsync`；并发刷新时，刷新回调仍会串行运行。这个设计适合“写入入口很多，但后端落地动作需要控制并发”的场景。

## 场景范例

### 批量写日志

当日志量很高时，可以先把日志行写入 `Spooler<string>`，再按批次落盘或写入日志服务。

{% code title="LogSpooler.cs" %}
```csharp
using Zongsoft.Caching;

using var logs = new Spooler<string>(
	flusher: async (items, cancellation) =>
	{
		var lines = items.ToArray();

		if(lines.Length == 0)
			return;

		await File.AppendAllLinesAsync(
			"application.log",
			lines,
			cancellation);
	},
	period: TimeSpan.FromSeconds(2),
	limit: 1_000);

await logs.PutAsync($"[{DateTimeOffset.Now:O}] worker started");
await logs.PutAsync($"[{DateTimeOffset.Now:O}] job accepted");
```
{% endcode %}

这个例子把多次小文件写入合并成批量追加，能减少文件系统调用次数。关闭服务前应主动调用 `FlushAsync`，确保缓冲日志已经落盘。

### 批量上报遥测

遥测、指标、埋点这类数据通常允许短暂延迟，但不希望每条都发一次网络请求。

{% code title="TelemetrySpooler.cs" %}
```csharp
public sealed record MetricPoint(
	string Name,
	double Value,
	DateTimeOffset Timestamp);

using var metrics = new Spooler<MetricPoint>(
	flusher: async (items, cancellation) =>
	{
		var batch = items.ToArray();

		if(batch.Length > 0)
			await telemetryClient.PushAsync(batch, cancellation);
	},
	period: TimeSpan.FromSeconds(10),
	limit: 200);

await metrics.PutAsync(new MetricPoint(
	"orders.created",
	1,
	DateTimeOffset.UtcNow));
```
{% endcode %}

如果遥测服务临时变慢，`limit` 可以限制单批数量，避免一次请求携带过大的负载。

### 批量写入数据库

采集数据、审计记录或后台任务日志可以先进入缓冲器，再批量写入数据库。

{% code title="DatabaseSpooler.cs" %}
```csharp
public sealed record AuditEntry(
	string Action,
	string User,
	DateTimeOffset CreatedTime);

using var audits = new Spooler<AuditEntry>(
	flusher: async (items, cancellation) =>
	{
		var batch = items.ToArray();

		if(batch.Length == 0)
			return;

		await auditRepository.InsertManyAsync(batch, cancellation);
	},
	period: TimeSpan.FromSeconds(5),
	limit: 500);

await audits.PutAsync(new AuditEntry(
	"Order.Submit",
	"alice",
	DateTimeOffset.UtcNow));
```
{% endcode %}

在这种场景中，`limit` 通常对应数据库批量写入的最大行数，`period` 则对应最长可接受写入延迟。

## 参数选择

| 场景 | `period` 建议 | `limit` 建议 |
| --- | --- | --- |
| 日志落盘 | 1 到 5 秒 | 500 到 5,000 |
| 遥测上报 | 5 到 30 秒 | 100 到 1,000 |
| 数据库批量写入 | 1 到 10 秒 | 100 到 1,000 |
| 低频事件 | 10 秒以上 | 可设为 `0` 或较小值 |

这些数值不是固定规则，应结合后端吞吐、单批处理耗时、允许延迟和内存占用来调整。

## 清空与释放

`Clear` 会尽可能读取并丢弃当前缓冲区中的数据，不会调用刷新回调。

`Dispose` 会停止内部定时器并完成通道写入。释放后再访问 `Count`、`IsEmpty`、`PutAsync` 或 `FlushAsync` 会抛出对象已释放异常。

{% code title="DisposeSpooler.cs" %}
```csharp
await spooler.FlushAsync();
spooler.Dispose();
```
{% endcode %}

## 相关资源

* [Spooler.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/Spooler.cs)
* [SpoolerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/SpoolerTest.cs)
