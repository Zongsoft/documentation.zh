---
description: 周期异步回调的启动、取消、停止通知和资源所有权。
icon: clock
---

# Timer

`Zongsoft.Common.Timer` 串行执行周期异步回调，适合宿主内的轻量轮询、采集和定期刷新。它管理每次运行的取消与资源，不记录日志、不决定重试策略。跨进程持久化调度见[任务调度](../scheduling.md)。

## 创建与启动

构造函数接受周期、必需的回调和可选的 `System.TimeProvider`，构造时不启动。`Start()` 或 `Start(state)` 开始周期调度，首次回调在一个周期后发生；同一次运行的回调不重叠，多个错过的周期合并为一次通知。

下面是方法片段，需引入 System、System.Threading 和 System.Threading.Tasks。方法接收业务保存回调和由调用方管理的结束信号。结束信号完成后，异步释放会请求取消并等待在途回调结束。

{% code title="RunPeriodicTask.cs" %}
```csharp
static async Task RunAsync(Func<CancellationToken, ValueTask> save, Task finished)
{
	await using var timer = new Zongsoft.Common.Timer(
		TimeSpan.FromSeconds(5),
		(_, cancellation) => save(cancellation));

	timer.Start();
	await finished;
}
```
{% endcode %}

`save` 必须把收到的取消令牌传递给内部可取消的异步操作。`Start` 不接受取消令牌，运行的取消源由计时器持有；传给 `Start(state)` 的对象只是业务状态。

`Period` 可在空闲或运行时调整，限制在 1～4,294,967,294 毫秒之间；越界取最近边界，范围内保留小数毫秒。重复启动正在运行的计时器不会更换状态。停止收尾期间不能重启，应先等待 `StopAsync()` 完成。

## 停止与释放

| 方法 | 行为 |
| --- | --- |
| `Stop()` | 请求取消后续调度及在途回调，不等待结束。 |
| `StopAsync()` | 请求取消，并等待回调、取消通知、资源清理及事件通知结束。 |
| `Dispose()` | 永久关闭并请求取消，不等待清理结束。 |
| `DisposeAsync()` | 永久关闭并等待同一次运行的清理及通知结束。 |

上述方法均无取消参数。取消是协作请求，不强制中断业务代码；异步停止和释放须等待回调实际退出。需要限制等待时，调用方可对 `StopAsync()` 返回任务使用 `WaitAsync`，结束等待不撤销停止请求。

停止完成后可以重新启动，每次运行使用独立取消源。释放后不得再启动或访问 `Period`，仍可读取 `IsRunning`、`IsDisposed`；重复释放不重复清理，先同步释放后仍可通过 `DisposeAsync()` 等待清理完成。`IsDisposed` 表示已请求永久关闭，`IsRunning` 直到运行收尾完成才变为 false。

{% hint style="warning" %}
回调、取消通知、事件通知及其依赖工作不得等待所属计时器的异步停止或释放，否则会形成自等待。需要请求结束时调用 `Stop()` 或 `Dispose()`，由回调外的所有者等待完成。计时器不检测违规调用；所有者须在回调结束前保持其依赖资源有效。
{% endhint %}

## 停止与故障通知

`Stopped` 在每次实际运行的回调和资源清理结束后通知一次，通知本身仍属于收尾阶段。未启动或重复停止不会额外触发。故障终止时先通知 `Failed`，再通知 `Stopped`；停止和异步释放任务等待通知返回。

`Failed` 使用 `Zongsoft.Diagnostics.FailureEventArgs`，包含异常和启动状态。由使用者决定记录日志、告警或恢复。计时器独立保留运行和通知异常，修改通知参数不改变停止、释放操作的失败结果。`Failed` 独立调用各订阅者；`Stopped` 使用普通事件调用，一个订阅者抛错会中断后续订阅者。

通知应保持简短。需要重启时，先通知所有者，由事件调用链外的任务等待 `StopAsync()` 完成后再启动。计时器内部观察后台异常，调用方通过异步停止或释放取得运行结果。

## 所有权与参考

计时器拥有每次运行的底层时钟和取消源，不释放传入的状态、时钟提供者或回调对象。自定义 `System.TimeProvider.CreateTimer` 必须成功返回支持同步释放的有效计时器；底层 `System.Threading.PeriodicTimer` 的构造失败限制见[完整计时器契约](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/docs/timers.zh-Hans.md)。

实现见 [Timer.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Timer.cs)，时序与故障用例见 [TimerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimerTest.cs)。
