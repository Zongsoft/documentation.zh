---
description: Sequence、ISequence、ISequenceBase 的序列号和缓冲增长器。
icon: list-check
---

# Sequence

`Sequence` 相关类型用于生成递增或递减序列号。它不仅定义基础序列接口，还提供 `Variate` 包装器，用于降低远端序列服务调用频率。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `ISequenceBase` | 基础序列接口，支持同步/异步增加、减少和重置。 |
| `ISequence` | 序列服务接口，继承 `ISequenceBase`。 |
| `Sequence` | 序列扩展入口，提供 `Variate`。 |
| `Sequence.VariatorOptions` | 控制本地号段增长策略。 |
| `Sequence.IVariator` | 带本地号段缓存的序列包装器。 |
| `Sequence.IVariatorStatistics` | 提供当前号段、阈值、增长间隔等统计信息。 |

## 基础序列

实现 `ISequenceBase` 后，可以按键生成序列值。

{% code title="UseSequence.cs" %}
```csharp
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Zongsoft.Common;

public sealed class OrderSequence : ISequenceBase
{
	private readonly Dictionary<string, long> _values = new();

	public long Decrease(string key, int interval = 1, int seed = 0) =>
		this.Increase(key, -interval, seed);

	public ValueTask<long> DecreaseAsync(
		string key,
		int interval = 1,
		int seed = 0,
		CancellationToken cancellation = default) =>
		this.IncreaseAsync(key, -interval, seed, cancellation);

	public long Increase(string key, int interval = 1, int seed = 0)
	{
		lock(_values)
		{
			if(_values.TryAdd(key, seed))
				return seed;

			return _values[key] += interval;
		}
	}

	public ValueTask<long> IncreaseAsync(
		string key,
		int interval = 1,
		int seed = 0,
		CancellationToken cancellation = default)
	{
		return ValueTask.FromResult(this.Increase(key, interval, seed));
	}

	public void Reset(string key, int value = 0)
	{
		lock(_values)
		{
			_values[key] = value;
		}
	}

	public ValueTask ResetAsync(
		string key,
		int value = 0,
		CancellationToken cancellation = default)
	{
		this.Reset(key, value);
		return ValueTask.CompletedTask;
	}
}
```
{% endcode %}

实际项目中的 `ISequenceBase` 实现通常会把递增结果持久化到 Redis、Etcd、数据库或其它分布式存储中。

## Variate 包装器

`Variate` 会为远端序列服务创建本地号段缓存。调用方频繁取号时，只有本地号段耗尽才访问底层序列。

{% code title="VariateSequence.cs" %}
```csharp
var remote = new OrderSequence();
var sequence = remote.Variate(new Sequence.VariatorOptions(
	initiate: 0,
	growthLower: 32,
	growthUpper: 512));

var number = sequence.Increase("orders");
var statistics = sequence.GetStatistics("orders");
```
{% endcode %}

这种设计适合底层序列服务存在网络延迟、数据库写入成本或分布式协调成本的场景。

## 相关资源

* [Sequence.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Sequence.cs)
* [ISequence.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/ISequence.cs)
* [ISequenceBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/ISequenceBase.cs)
* [SequenceTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/SequenceTest.cs)
