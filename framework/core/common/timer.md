---
description: 通过框架已有 TimerTest 理解周期回调、取消、停止与释放。
icon: clock
---

# Timer

Timer 用于周期性调用异步回调。它适合宿主内的轻量轮询；跨进程持久化调度和失败重试应阅读[任务调度](../scheduling.md)。Discussions 没有直接使用计时器的业务范例，这里采用框架现有测试。

## 建立回调与完成信号

TimerTest 把周期设为 1 毫秒，并用完成信号等待第 10 次回调。LIMIT、_count、_timer 和 _completion 都是这个测试夹具的成员；该周期是测试参数，实际任务需要依据工作耗时配置。

来源：[framework/Zongsoft.Core/test/Common/TimerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimerTest.cs#L22)（节选；上下文见源文件）。

{% code title="TimerTest.cs" %}
```csharp
public TimerTest()
{
	_timer = new Timer(TimeSpan.FromMilliseconds(1), this.OnTick);
	_completion = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
}
```
{% endcode %}

## 启动并等待结束

来源：[framework/Zongsoft.Core/test/Common/TimerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimerTest.cs#L31)（节选；上下文见源文件）。

{% code title="TimerTest.cs" %}
```csharp
public async Task Test()
{
	Assert.False(_timer.IsRunning);
	_timer.Start(TestContext.Current.CancellationToken);
	Assert.True(_timer.IsRunning);

	await _completion.Task.WaitAsync(TimeSpan.FromSeconds(30), TestContext.Current.CancellationToken);
	Assert.Equal(LIMIT, _count);
	Assert.False(_timer.IsRunning);
}
```
{% endcode %}

测试检查启动前、启动后和结束后的 IsRunning。等待上限 30 秒用于防止失败测试无限悬挂，不代表计时器精度或业务超时承诺。

## 在回调中停止

来源：[framework/Zongsoft.Core/test/Common/TimerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimerTest.cs#L44)（节选；上下文见源文件）。

{% code title="TimerTest.cs" %}
```csharp
private ValueTask OnTick(object state, CancellationToken cancellation)
{
	if(Interlocked.Increment(ref _count) >= LIMIT)
	{
		_timer.Stop();
		_completion.TrySetResult();
	}

	return ValueTask.CompletedTask;
}
```
{% endcode %}

回调达到 LIMIT 后调用 Stop 并通知等待方。停止周期不等于撤销已经产生的业务副作用；回调里的外部操作仍应遵守自己的取消和幂等约定。

{% hint style="info" %}
💡 创建计时器的组件应负责最终释放它。在支持运行时设置 Period 的目标框架上，可以调整后续周期；实际条件编译和释放逻辑见 [Timer.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Timer.cs)。
{% endhint %}
