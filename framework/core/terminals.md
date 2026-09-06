---
description: Zongsoft.Terminals 终端抽象、命令执行器和交互式控制台程序。
icon: terminal
---

# Zongsoft.Terminals

`Zongsoft.Terminals` 提供终端抽象、控制台终端实现和终端命令执行器，用于把 `Zongsoft.Components` 的命令模型运行在交互式控制台中。它让一个程序既可以像普通后台服务一样启动组件，也可以在控制台里输入命令、查看状态、执行维护动作和进入持续监听模式。

终端模型的核心关系是：`ITerminal` 负责输入、输出、样式、清屏和 Ctrl+C 中断事件；`ITerminalExecutor` 继承命令执行器，负责读取命令文本、解析命令表达式、维护当前命令节点并触发退出事件。

## 主要职责

* 定义 `ITerminal`、`ITerminalExecutor` 等终端抽象。
* 提供 `Terminal.Console` 控制台终端和 `Terminal.Default` 默认终端入口。
* 把命令树、命令表达式和终端输入循环组合成可交互的命令行程序。
* 支持彩色输出、ANSI 样式、清屏、重置和 Ctrl+C 中断处理。
* 提供 `Clear`、`Exit`、`Shell` 等控制台内置命令。
* 支持插件宿主把默认命令执行器替换为终端执行器，让插件命令可以在终端里运行。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ITerminal` | 终端接口，提供输入输出、错误输出、样式、清屏、重置和中断事件。 |
| `ITerminalExecutor` | 终端命令执行器接口，继承命令执行器并提供 `Run(...)` / `RunAsync(...)`。 |
| `Terminal` | 静态入口，暴露 `Console`、`Default`、`Write(...)`、`WriteLine(...)`、`Clear(...)` 等快捷方法。 |
| `TerminalStyles` | 终端样式重置选项，例如前景色、背景色和字体样式。 |
| `Terminal.ExitException` | 用于终止终端命令循环的专用异常。 |
| `Terminal.ExitEventArgs` | 终端退出事件参数，包含退出码。 |

## 适用场景

* 为本地调试、运维工具、示例程序提供交互式命令入口。
* 在后台服务旁边提供 `start`、`stop`、`info`、`subscribe` 等维护命令。
* 把插件树中的命令挂到终端，形成可扩展的管理控制台。
* 为消息订阅、事件监听、设备采集观察等场景提供“运行直到 Ctrl+C 退出”的响应模式。

## 快速启动

Discussions 的实际命令是 MessageSendCommand：从命令选项构建站内信，解析收件人后交给 MessageService。它不创建自己的控制台循环，宿主通过命令树和插件装配提供执行入口。

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

终端执行器默认带有 `Exit`、`Clear` 和 `Shell` 命令。业务命令可以通过命令树、插件加载器或 `CommandExecutorUtility.Command(...)` 这类辅助方法挂载。完整命令模型见：

{% content-ref url="components/commands.md" %}
[commands.md](components/commands.md)
{% endcontent-ref %}

## 插件宿主集成

在插件宿主中，终端插件会把 `/Workbench/Executor` 指向 `Terminal.Console.Executor`，并把它设为 `CommandExecutor.Default`。这样其它插件挂载到命令树上的命令，可以直接在终端宿主里输入执行。

来源：[framework/Zongsoft.Plugins/plugins/Terminal.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/plugins/Terminal.plugin#L15)（节选；上下文见源文件）。

{% code title="Terminal.plugin" %}
```xml
<extension path="/Workbench">
	<!-- 将默认的命令执行器替换成控制台终端命令执行器 -->
	<object name="Executor" value="{static:Zongsoft.Terminals.Terminal.Console.Executor, Zongsoft.Core}">
		<object.property name="Default" target="{type:Zongsoft.Components.CommandExecutor, Zongsoft.Core}" value="{path:.}" />
	</object>
</extension>
```
{% endcode %}

这种方式适合把插件应用变成可交互的管理控制台。应用启动后，终端[工作台](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/IWorkbenchBase.cs)会运行执行器；终端退出后，工作台随之关闭。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Terminals.Commands` | 终端内置命令。 |

## 类型

<table data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th data-card-target data-type="content-ref"></th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>Terminal：终端抽象、控制台终端、终端执行器、输出样式和响应式命令。</td>
			<td><a href="terminals/terminal.md">terminal.md</a></td>
		</tr>
		<tr>
			<td>Commands：清屏、退出和 Shell 命令。</td>
			<td><a href="terminals/commands.md">commands.md</a></td>
		</tr>
	</tbody>
</table>

## 相关资源

* [Terminals 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Terminals)
* [Terminal 插件](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/plugins/Terminal.plugin)
