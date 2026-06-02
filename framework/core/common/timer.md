---
description: Timer 周期任务计时器。
icon: clock
---

# Timer

`Timer` 是一个轻量周期任务计时器。它按指定 `Period` 调用异步 tick 回调，并使用取消令牌控制停止。

## 创建计时器

{% code title="CreateTimer.cs" %}
```csharp
using Zongsoft.Common;

var timer = new Timer(
	TimeSpan.FromSeconds(1),
	async (state, cancellation) =>
	{
		await RefreshAsync(cancellation);
	});
```
{% endcode %}

构造函数中的回调类型是 `Func<object, CancellationToken, ValueTask>`。

## 启动与停止

{% code title="StartStopTimer.cs" %}
```csharp
timer.Start();

Console.WriteLine(timer.IsRunning);

timer.Stop();
timer.Dispose();
```
{% endcode %}

`Start(object state, CancellationToken cancellation)` 可以传入状态对象和外部取消令牌。

## 调整周期

在 .NET 8 或更高目标框架下，`Period` 可以在运行时读取和设置。

{% code title="TimerPeriod.cs" %}
```csharp
timer.Period = TimeSpan.FromMilliseconds(500);
```
{% endcode %}

如果回调里检测到条件满足，可以调用 `Stop()` 停止后续周期。

## 相关资源

* [Timer.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Timer.cs)
* [TimerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimerTest.cs)
