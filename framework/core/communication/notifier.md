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

来源：[framework/Zongsoft.Core/src/Communication/INotifier.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/INotifier.cs#L38)（节选；上下文见源文件）。

{% code title="INotifier.cs" %}
```csharp
public interface INotifier
{
	/// <summary>激发一个通知给指定的接受者。</summary>
	/// <param name="name">指定要激发的通知名。</param>
	/// <param name="content">指定的通知内容。</param>
	/// <param name="destination">指定通知的接受者，由具体实现者定义支持的接受者类型。</param>
	/// <param name="settings">指定的通知设置。</param>
	/// <returns>返回通知结果对象，由具体实现者定义。</returns>
	object Notify(string name, object content, object destination, object settings = null);

	/// <summary>异步激发一个通知给指定的接受者。</summary>
	/// <param name="name">指定要激发的通知名。</param>
	/// <param name="content">指定的通知内容。</param>
	/// <param name="destination">指定通知的接受者，由具体实现者定义支持的接受者类型。</param>
	/// <param name="settings">指定的通知设置。</param>
	/// <returns>返回通知结果对象，由具体实现者定义。</returns>
	ValueTask<object> NotifyAsync(string name, object content, object destination, object settings = null);
}
```
{% endcode %}

## 与 Transmitter 的区别

`INotifier` 和 `ITransmitter` 都可以用于“通知”，但关注点不同：

| 抽象 | 关注点 | 适合场景 |
| --- | --- | --- |
| `INotifier` | 激发一条命名通知，目标、设置和结果由实现定义。 | 站内通知、会话通知、桌面推送、自定义业务提醒。 |
| `ITransmitter` | 按发送器、通道、模板和参数发送模板化信息。 | 模板短信、语音通知、微信模板消息、验证码发送。 |

## Discussions 的站内消息路径

当前 Discussions 和 framework 中没有可供复用的 INotifier 完整实现。Discussions 使用 MessageService 保存站内消息与接收者关系；它不是 INotifier 的实现，也不负责把消息实时推送到在线会话。

来源：[src/Services/MessageService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/MessageService.cs#L49)（节选；上下文见源文件）。

{% code title="MessageService.cs" %}
```csharp
public int Send(Message message, IEnumerable<uint> users)
{
	if(message == null)
		throw new ArgumentNullException(nameof(message));

	if(users == null || !users.Any())
		return 0;

	using(var transaction = new Transaction())
	{
		//插入消息
		if(this.Insert(message) < 1)
			return 0;

		//插入用户消息
		var count = this.DataAccess.InsertMany(users.Select(uid => new UserMessage(uid, message.MessageId)));

		//提交事务
		transaction.Commit();

		return count;
	}
}
```
{% endcode %}

Send 接收消息对象及用户编号集合，在事务中写入消息和 UserMessage。读取状态由 MessageService 的查询钩子更新。若需要理解通用模板短信的真实发送过程，请继续阅读 [Transmitter](transmitter.md)。

## 相关资源

* [INotifier.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/INotifier.cs)
* [Communication 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Communication)
