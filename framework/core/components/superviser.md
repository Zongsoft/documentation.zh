---
description: Zongsoft.Components Superviser 监管模型、观察者模式和失效恢复。
icon: eye
---

# Superviser

`Superviser` 是面向可监管对象的观察和恢复模型。它把观察者模式用于对象生命周期管理：被监管对象持续汇报状态，监管器订阅这些状态变化，并在对象超时、失败、完成或被手动移除时触发恢复或清理逻辑。

监管模型适合管理一批会随时间失效的对象，例如设备连接、长连接会话、临时订阅或需要健康观察的运行时资源。

## 观察者模式

观察者模式把“状态产生者”和“状态消费者”解耦。状态产生者只负责发布通知，不需要知道谁在接收；观察者只负责处理通知，不需要主动轮询状态。典型流程是：观察者向被观察对象订阅，被观察对象在状态变化时推送数据、错误或完成信号，订阅凭证用于取消订阅。

在 .NET 中，这个协议由 [`System.IObservable<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.iobservable-1) _[源码](https://source.dot.net/#System.Private.CoreLib/src/libraries/System.Private.CoreLib/src/System/IObservable.cs)_ 和 [`System.IObserver<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.iobserver-1) _[源码](https://source.dot.net/#System.Private.CoreLib/src/libraries/System.Private.CoreLib/src/System/IObserver.cs)_ 表达：

| 角色 | 职责 |
| --- | --- |
| `System.IObservable<T>` | 被观察对象，提供 `Subscribe(System.IObserver<T>)` 方法，允许观察者订阅通知。 |
| `System.IObserver<T>` | 观察者，接收 `OnNext(T)`、`OnError(System.Exception)` 和 `OnCompleted()` 三类通知。 |
| `System.IDisposable` | 订阅凭证，通常由 `Subscribe` 返回，用于释放订阅关系。 |

{% hint style="info" %}
观察者模式更适合“状态由被观察对象主动产生”的场景。如果只是偶尔读取一次状态，直接调用方法或查询属性通常更简单。
{% endhint %}

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ISuperviser<T>` | 监管器接口，定义监管、取消监管和生命周期事件。 |
| `Superviser<T>` | 默认监管器实现，维护被监管对象集合、订阅关系和失效判定。 |
| `ISupervisable<T>` | 可被监管对象接口，继承 `System.IObservable<T>` 并暴露监管选项。 |
| `Supervisable<T>` | 可监管对象基类，保存当前观察者并提供订阅、取消监管回调。 |
| `SupervisableOptions` | 可监管对象选项，包含生命周期和错误次数限制。 |
| `SupervisableReason` | 取消监管原因，例如失活、失败或手动移除。 |

## 在监管模型中的映射

`Superviser<T>` 面向 `System.IObservable<T>` 工作，因此它可以监管任何遵循 .NET 观察者协议的对象。内部的观察器实现了 `System.IObserver<T>`，并把三个通知信号映射为监管语义：

| 通知 | 监管语义 |
| --- | --- |
| `OnNext(T value)` | 对象仍然活跃，监管器刷新最近访问时间，避免生命周期过期。 |
| `OnError(System.Exception exception)` | 对象报告异常，监管器累计错误次数；超过 `SupervisableOptions.ErrorLimit` 后触发失败驱逐。 |
| `OnCompleted()` | 对象主动结束，监管器将其取消监管。 |

`Supervisable<T>` 是对 `System.IObservable<T>` 的常用封装。派生类可以通过受保护的 `Observer` 属性向监管器发送通知，而不需要直接保存订阅对象：

{% code title="MeterConnection.cs" %}
```csharp
public readonly record struct MeterSignal(string MeterId, DateTime Timestamp);

public sealed class MeterConnection(string id) : Supervisable<MeterSignal>
{
	public void Heartbeat()
	{
		this.Observer?.OnNext(new MeterSignal(id, DateTime.UtcNow));
	}

	public void Fail(Exception exception)
	{
		this.Observer?.OnError(exception);
	}

	public void Close()
	{
		this.Observer?.OnCompleted();
	}
}
```
{% endcode %}

## 应用方案

监管器通常有两种接入方式：

* 对已有 `System.IObservable<T>` 数据源，直接调用 `Supervise(key, observable)`。这种方式适合已经有通知协议的连接、订阅、消息源或外部适配器。
* 对自定义运行时对象，继承 `Supervisable<T>`。这种方式适合设备连接、会话、临时任务等需要同时表达状态汇报、失效原因和取消监管回调的对象。

{% code title="监管设备连接" %}
```csharp
var options = new SupervisableOptions(
	lifecycle: TimeSpan.FromSeconds(30),
	errorLimit: 3);

var superviser = new Superviser<MeterSignal>(options);
var meter = new MeterConnection("A-001");

using var subscription = superviser.Supervise("A-001", meter);
```
{% endcode %}

{% hint style="warning" %}
`Supervise` 返回的是订阅凭证，释放它会取消观察关系；如果对象需要表达“我已经结束”，优先由被监管对象调用 `OnCompleted()`，让监管器按完成语义移除它。
{% endhint %}

## 处理逻辑

{% stepper %}
{% step %}
## 进入监管

对象被加入监管器，监管器记录对象并调用 `Subscribe` 建立观察关系。
{% endstep %}

{% step %}
## 状态变化

被监管对象通过 `OnNext` 汇报活跃状态，通过 `OnError` 汇报异常；监管器也会根据生命周期选项判断对象是否失活。
{% endstep %}

{% step %}
## 取消监管

当对象完成、失活、失败或被手动停止时，监管器触发 `Unsupervised`，对象可根据原因执行恢复、释放或重连逻辑。
{% endstep %}

{% step %}
## 恢复或清理

派生类可以在 `OnUnsupervised` 或监管器事件中添加重试、回退和超时策略，然后重新加入监管或彻底释放对象。
{% endstep %}
{% endstepper %}

## 现实场景

设备采集器是监管模型的典型用例。采集器监管多个仪表或设备连接：连接正常时持续上报心跳；连接断开、错误次数超过限制或长时间无响应时，监管器取消监管并触发恢复流程；恢复流程可尝试重新打开设备，成功后再把设备放回监管集合。

{% code title="失效后恢复的结构示意" %}
```csharp
protected override void OnUnsupervised(
	ISuperviser<MeterSignal> superviser,
	SupervisableReason reason)
{
	if(reason is SupervisableReason.Failed or SupervisableReason.Inactived)
		this.ScheduleReconnect();
}
```
{% endcode %}

这个模式能把“对象失效了怎么办”收敛在可监管对象内部，而不是让采集循环、重连逻辑和错误处理互相缠在一起。

{% hint style="info" %}
上面的代码是恢复流程结构示意。实际项目中恢复调度、是否重新加入监管集合、以及是否释放原对象，应以具体可监管对象的实现为准。
{% endhint %}

监管器适合对象生命周期、失效通知和恢复策略相对独立的场景。如果只是普通集合管理，没有超时、失效或恢复逻辑，使用集合或缓存通常更简单。当前监管器内部使用内存缓存和观察订阅，不提供跨进程一致的监管状态。

## 参考实现

* [Superviser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Superviser.cs)
* [Supervisable.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Supervisable.cs)
