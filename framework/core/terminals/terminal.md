---
description: Zongsoft.Terminals 终端抽象、控制台终端和交互式命令模式。
icon: terminal
---

# Terminal

`Zongsoft.Terminals` 把控制台程序抽象为终端和终端命令执行器。终端负责输入、输出、样式和中断事件；执行器继承命令执行模型，负责读取命令、执行命令和维护当前命令节点。

`Terminal.Console` 是核心库提供的默认控制台终端，内部封装 `System.Console`。`Terminal.Default` 默认指向控制台终端，也可以被宿主或测试代码替换成其它实现。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ITerminal` | 终端接口，继承 `ICommandOutlet`，提供输入、输出、错误输出、样式、清屏和重置。 |
| `ITerminalExecutor` | 终端命令执行器接口，继承 `ICommandExecutor`，提供 `Run`/`RunAsync` 和退出事件。 |
| `Terminal` | 静态入口，提供 `Default`、`Console`、输出和样式快捷方法。 |
| `ConsoleTerminal` | 控制台终端实现，封装 `System.Console`、ANSI 样式和 Ctrl+C 中断。 |
| `ConsoleExecutor` | 控制台命令执行器，读取终端输入并执行命令。 |
| `TerminalStyles` | 终端样式重置选项。 |
| `Terminal.ExitException` | 终端命令用于退出命令循环的专用异常。 |

## 启动终端

终端执行器运行时会打印闪屏、进入命令循环并等待用户输入。可以传入纯文本闪屏，也可以传入 `CommandOutletContent` 组合多色输出。

来源：[framework/Zongsoft.Net/samples/server/Program.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Net/samples/server/Program.cs#L46)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
var splash = CommandOutletContent.Create()
	.AppendLine(CommandOutletColor.Yellow, new string('·', 50))
	.AppendLine(CommandOutletColor.Blue, "Welcome to the TCP Server.".Justify(50))
	.AppendLine(CommandOutletColor.Yellow, new string('·', 50));

await executor.RunAsync(splash);
```
{% endcode %}

上面是 framework TCP 服务端样例的启动片段，executor 及 start、stop、info 命令在同一 Program.cs 前部创建；完整入口见[常规通讯](../communication/general.md)。Discussions 自己的站内信命令复用宿主执行器，不重复创建终端。

命令循环会把输出编码设置为 UTF-8。每次读取命令前会重置终端样式，并显示提示符：根节点下显示 `$>`，进入某个命令节点后显示该节点完整路径。

## 命令循环

{% stepper %}
{% step %}
## 初始化终端

`ConsoleExecutor.RunAsync(...)` 设置输出编码，打印默认或自定义闪屏。
{% endstep %}

{% step %}
## 读取输入

终端重置后显示当前命令节点提示符，然后从 `Input.ReadLine()` 读取命令文本。
{% endstep %}

{% step %}
## 执行命令

输入非空时调用继承自 `CommandExecutor` 的 `ExecuteAsync(...)`。如果命令节点还有子节点，终端执行器会把当前节点切换到该命令节点，后续相对路径会以该节点为锚点查找。
{% endstep %}

{% step %}
## 处理退出和异常

`ExitCommand` 抛出终端退出异常后触发退出事件；普通异常会以红色错误信息输出到终端。
{% endstep %}
{% endstepper %}

## 交互式响应模式

`Terminal.ReactiveAsync(...)` 让命令进入“运行中等待中断”的模式。它会检查当前执行器是否是终端执行器，挂载终端的 `Aborting` 事件，然后等待 Ctrl+C 释放信号量，最后执行退出回调。

来源：[framework/Zongsoft.Commands/src/Messaging/QueueSubscribeCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Commands/src/Messaging/QueueSubscribeCommand.cs#L52)（节选；上下文见源文件）。

{% code title="QueueSubscribeCommand.cs" %}
```csharp
protected override ValueTask<object> OnExecuteAsync(CommandContext context, CancellationToken cancellation) =>
	context.ReactiveAsync(this.OnEnterAsync, this.OnExitAsync, cancellation);
```
{% endcode %}

`Zongsoft.Commands` 中的消息队列订阅命令就是这种结构：进入时订阅队列并持续输出消息，用户按 Ctrl+C 后退出并注销订阅。

{% hint style="info" %}
`ReactiveAsync(...)` 只支持终端执行器环境。普通命令执行器没有终端中断事件，调用该方法会抛出不支持异常。
{% endhint %}

## 输出样式

`ITerminal` 继承 `ICommandOutlet`，因此命令可以使用 `CommandOutletContent` 组合颜色、样式和文本片段。控制台终端会把这些样式转换为 ANSI 转义序列输出。

来源：[framework/Zongsoft.Core/samples/memorycache/Program.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/samples/memorycache/Program.cs#L78)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
private static void Cache_Evicted(object sender, CacheEvictedEventArgs e)
{
	var content = CommandOutletContent.Create(CommandOutletColor.Magenta, "** Evicted **\t")
		.Append(CommandOutletColor.DarkGreen, Now + ' ')
		.Append(CommandOutletColor.Blue, $"[{e.Reason}] ")
		.Append(CommandOutletColor.DarkYellow, e.Key.ToString())
		.Append(CommandOutletColor.DarkGray, "=")
		.Append(CommandOutletColor.DarkYellow, e.Value?.ToString());

	if(e.State != null)
		content
			.Append(CommandOutletColor.DarkGray, " (")
			.Append(CommandOutletColor.Cyan, e.State.ToString())
			.Append(CommandOutletColor.DarkGray, ")");

	Terminal.WriteLine(content);
}
```
{% endcode %}

这段输出来自 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的 memorycache 交互样例，Now 是同一类的时间文本属性，e 来自缓存淘汰事件。命令内部通常优先使用 `context.Output`，这样同一命令既可以在终端中输出，也可以被其它命令执行器复用。只有确定输出目标就是当前默认终端时，才直接使用 `Terminal.WriteLine(...)`。

## 终端扩展方法

`Terminal.Utility` 提供了从命令执行器或命令上下文取得终端的扩展方法：

| 方法 | 说明 |
| --- | --- |
| `GetTerminal(this ICommandExecutor executor)` | 如果执行器是终端执行器，返回所属终端。 |
| `GetTerminal(this CommandContextBase context)` | 从命令上下文取得所属终端。 |
| `TryGetTerminal(...)` | 尝试取得终端，适合命令兼容终端和非终端两种环境。 |
| `ReactiveAsync(...)` | 让命令进入 Ctrl+C 退出的响应式模式。 |

## 使用建议

终端程序适合本地调试、插件管理、样例程序和运维工具。面向多用户或远程管理的场景，仍需要额外考虑权限、审计、命令白名单和外部命令限制。

如果命令需要长期运行并等待用户中断，优先使用 `ReactiveAsync(...)` 包住进入和退出逻辑；如果命令只执行一次动作，直接实现普通 `CommandBase<CommandContext>` 即可。

## 参考实现

* [Terminals 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Terminals)
* [QueueSubscribeCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Commands/src/Messaging/QueueSubscribeCommand.cs)
* [ZeroMQ 终端示例](https://github.com/Zongsoft/framework/blob/main/messaging/zero/samples/server/Program.cs)
