---
description: Zongsoft.Components Superviser 监管模型、观察者模式和失效恢复。
icon: eye
---

# Superviser

`Superviser` 是面向可监管对象的观察和恢复模型。它结合 Observer/Observable 思想：被监管对象暴露状态和失效原因，监管器订阅对象变化，并在对象失效、超时或被手动移除时触发恢复或清理逻辑。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ISuperviser<T>` | 监管器接口，定义监管、取消监管和事件。 |
| `Superviser<T>` | 默认监管器实现，维护被监管对象集合和生命周期事件。 |
| `ISupervisable<T>` | 可被监管对象接口。 |
| `Supervisable<T>` | 可监管对象基类，连接监管器和对象自身的失效逻辑。 |
| `SupervisableOptions` | 可监管对象选项。 |
| `SupervisableReason` | 失效或取消监管原因。 |

## 处理逻辑

{% stepper %}
{% step %}
## 进入监管

对象被加入监管器，监管器记录对象并建立观察关系。
{% endstep %}

{% step %}
## 状态变化

对象通过可观察接口通知状态变化，或由监管器根据时间、健康状态、外部事件判定对象失效。
{% endstep %}

{% step %}
## 取消监管

当对象被移除、失联、失败或手动停止时，监管器触发 `Unsupervised`，对象可根据原因执行恢复、释放或重连逻辑。
{% endstep %}

{% step %}
## 恢复或清理

派生类可以结合 `Executor.Features` 添加重试、回退和超时策略，然后重新加入监管或彻底释放对象。
{% endstep %}
{% endstepper %}

## 现实场景

设备采集器是监管模型的典型用例。采集器监管多个仪表或设备连接：连接正常时持续采集；连接断开或长时间无响应时，监管器取消监管并触发恢复流程；恢复流程可使用 Retry/Fallback 策略尝试重新打开设备，成功后再把设备放回监管集合。

{% code title="失效后恢复的结构示意" %}
```csharp
protected override async ValueTask OnUnsupervisedAsync(
	Meter meter,
	SupervisableReason reason,
	CancellationToken cancellation)
{
	var executor = Executor
		.Features
		.Fallback(TimeSpan.FromSeconds(1))
		.Retry(3)
		.Build(async (_, token) =>
		{
			await this.OpenAsync(meter, token);
			await this.SuperviseAsync(meter, token);
			return true;
		});

	await executor.ExecuteAsync(new ExecutorContext(meter), cancellation);
}
```
{% endcode %}

这个模式能把“对象失效了怎么办”收敛在可监管对象内部，而不是让采集循环、重连逻辑和错误处理互相缠在一起。

## 参考实现

* [Superviser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Superviser.cs)
* [Supervisable.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Supervisable.cs)
