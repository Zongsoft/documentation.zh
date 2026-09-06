---
description: 以 Discussions 的 MessageSendCommand 理解参数、选项、服务依赖和执行。
icon: terminal
---

# 命令


命令把文本入口、参数解析与业务调用组织起来。Discussions 已有 MessageSendCommand，用于构造站内消息并调用 MessageService；它是命令类的真实用例，但当前插件清单尚未将它挂载到终端命令树。

## 选项与服务依赖

来源：[src/Services/Commands/MessageSendCommand.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/Commands/MessageSendCommand.cs#L37)（节选；上下文见源文件）。

{% code title="MessageSendCommand.cs" %}
```csharp
[CommandOption(SUBJECT_OPTION, typeof(string), Required = true)]
[CommandOption(CONTENT_OPTION, typeof(string), Required = true)]
[CommandOption(CONTENTTYPE_OPTION, typeof(string))]
[CommandOption(MESSAGETYPE_OPTION, typeof(string))]
[CommandOption(SOURCE_OPTION, typeof(string))]
public class MessageSendCommand : CommandBase<CommandContext>
```
{% endcode %}
来源：[src/Services/Commands/MessageSendCommand.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/Commands/MessageSendCommand.cs#L58)（节选；上下文见源文件）。

{% code title="MessageSendCommand.cs" %}
```csharp
[ServiceDependency(Provider = Module.NAME)]
public MessageService Service { get; set; }
```
{% endcode %}

主题和正文是必需选项，内容类型、消息类型和来源为可选。服务依赖来自 Discussions 模块，不应在命令里自行创建另一个 MessageService 和访问器。

## 执行时构造业务模型

来源：[src/Services/Commands/MessageSendCommand.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/Commands/MessageSendCommand.cs#L63)（节选；上下文见源文件）。

{% code title="MessageSendCommand.cs" %}
```csharp
protected override ValueTask<object> OnExecuteAsync(CommandContext context, CancellationToken cancellation)
{
	if(context.Arguments == null || context.Arguments.IsEmpty)
		throw new CommandException("Missing arguments of the command.");

	var content = context.Options.GetValue<string>(CONTENT_OPTION);
	var contentType = context.Options.GetValue<string>(CONTENTTYPE_OPTION);

	//根据内容类型解析得到真实内容
	content = GetContent(content, ref contentType);

	var message = Zongsoft.Data.Model.Build<Models.Message>(entity =>
	{
		entity.Content = content;
		entity.ContentType = contentType;
		entity.Referer = context.Options.GetValue<string>(SOURCE_OPTION);
		entity.Subject = context.Options.GetValue<string>(SUBJECT_OPTION);
		entity.MessageType = context.Options.GetValue<string>(MESSAGETYPE_OPTION);
	});

	if(this.Service.Send(message, GetUsers(context.Arguments)) > 0)
		return ValueTask.FromResult<object>(message);

	return ValueTask.FromResult<object>(null);
}
```
{% endcode %}

位置参数解析为收件人编号，选项形成 Message 模型。方法调用的是站内消息服务，不是消息队列发布器。返回模型供上层处理；命令本身不保证终端如何格式化输出。

## 文件正文参数

来源：[src/Services/Commands/MessageSendCommand.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/Commands/MessageSendCommand.cs#L91)（节选；上下文见源文件）。

{% code title="MessageSendCommand.cs" %}
```csharp
private static string GetContent(string content, ref string contentType)
{
	if(string.IsNullOrWhiteSpace(content) || string.IsNullOrWhiteSpace(contentType))
		return content;

	if(contentType.Length > 5 && contentType.EndsWith("+file", StringComparison.OrdinalIgnoreCase))
	{
		contentType = contentType.Substring(0, contentType.Length - 5);

		if(Zongsoft.IO.FileSystem.File.Exists(content))
		{
			using(var stream = Zongsoft.IO.FileSystem.File.Open(content, System.IO.FileMode.Open))
			{
				using(var reader = new System.IO.StreamReader(stream))
				{
					content = reader.ReadToEnd();
				}
			}
		}
	}

	return content;
}
```
{% endcode %}

带 +file 后缀的内容类型表示从给定路径读取正文，并移除这个输入标记。它与持久化内容使用的 +embedded 约定不同，不能互相替代。当前逻辑在文件不存在时保留原值，调用方需要核对输入，不能假定总会读到文件内容。

## 从类到可调用命令

要让命令进入执行器，宿主还需要命令树挂载和相应权限上下文。文档不提供一个仓库中尚不存在的命令名称。现有终端命令的完整装配可参考[终端](../terminals/commands.md)和框架 Main.plugin。
