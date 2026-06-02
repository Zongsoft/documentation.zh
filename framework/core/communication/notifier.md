---
description: INotifier 通知激发器接口和实现状态。
icon: bell
---

# Notifier

`INotifier` 是通知激发器接口，用于向指定接收者激发一条命名通知。它比 `ITransmitter` 更泛化：通知内容、接收者、设置对象和返回结果都由具体实现自行定义。

## 接口成员

| 成员 | 说明 |
| --- | --- |
| `Notify` | 同步激发通知。 |
| `NotifyAsync` | 异步激发通知。 |

{% code title="NotifierShape.cs" %}
```csharp
public interface INotifier
{
	object Notify(
		string name,
		object content,
		object destination,
		object settings = null);

	ValueTask<object> NotifyAsync(
		string name,
		object content,
		object destination,
		object settings = null);
}
```
{% endcode %}

## 与 Transmitter 的区别

`INotifier` 和 `ITransmitter` 都可以用于“通知”，但关注点不同：

| 抽象 | 关注点 | 适合场景 |
| --- | --- | --- |
| `INotifier` | 激发一条命名通知，目标、设置和结果由实现定义。 | 站内通知、会话通知、桌面推送、自定义业务提醒。 |
| `ITransmitter` | 按发送器、通道、模板和参数发送模板化信息。 | 模板短信、语音通知、微信模板消息、验证码发送。 |

## 自定义实现示例

{% code title="SessionNotifier.cs" %}
```csharp
using System.Threading.Tasks;
using Zongsoft.Communication;

public sealed class SessionNotifier : INotifier
{
	public object Notify(
		string name,
		object content,
		object destination,
		object settings = null)
	{
		return this.NotifyAsync(name, content, destination, settings)
			.AsTask()
			.GetAwaiter()
			.GetResult();
	}

	public async ValueTask<object> NotifyAsync(
		string name,
		object content,
		object destination,
		object settings = null)
	{
		var sessionId = destination as string;
		if(string.IsNullOrEmpty(sessionId))
			return false;

		await SendToSessionAsync(sessionId, name, content, settings);
		return true;
	}

	private static ValueTask SendToSessionAsync(
		string sessionId,
		string name,
		object content,
		object settings)
	{
		return ValueTask.CompletedTask;
	}
}
```
{% endcode %}

这个实现可以把 `destination` 解释为会话标识，也可以解释为用户编号、设备编号、连接对象或任何业务端点。

## 相关资源

* [INotifier.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/INotifier.cs)
* [Communication 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Communication)
