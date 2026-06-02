---
description: Zongsoft.Terminals 终端抽象、控制台终端和交互式命令模式。
icon: terminal
---

# Terminal

`Zongsoft.Terminals` 把控制台程序抽象为终端和终端命令执行器。终端负责输入、输出、样式和中断事件；执行器继承命令执行模型，负责读取命令、执行命令和维护当前命令节点。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ITerminal` | 终端接口，继承 `ICommandOutlet`，提供输入、输出、错误输出、样式、清屏和重置。 |
| `ITerminalExecutor` | 终端命令执行器接口，继承 `ICommandExecutor`，提供 `Run`/`RunAsync` 和退出事件。 |
| `Terminal` | 静态入口，提供 `Default`、`Console`、输出和样式快捷方法。 |
| `ConsoleTerminal` | 控制台终端实现，封装 `System.Console`、ANSI 样式和 Ctrl+C 中断。 |
| `ConsoleExecutor` | 控制台命令执行器，读取终端输入并执行命令。 |
| `TerminalStyles` | 终端样式重置选项。 |

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

输入非空时调用继承自 `CommandExecutor` 的 `ExecuteAsync(...)`。
{% endstep %}

{% step %}
## 处理退出和异常

`ExitCommand` 抛出终端退出异常后触发退出事件；普通异常会以红色错误信息输出到终端。
{% endstep %}
{% endstepper %}

## 交互式响应模式

`Terminal.ReactiveAsync(...)` 让命令进入“运行中等待中断”的模式。它会检查当前执行器是否是终端执行器，挂载终端的 `Aborting` 事件，然后等待 Ctrl+C 释放信号量，最后执行退出回调。

{% code title="响应式命令结构" %}
```csharp
protected override ValueTask<object> OnExecuteAsync(
	CommandContext context,
	CancellationToken cancellation)
{
	return context.ReactiveAsync(
		this.OnEnterAsync,
		this.OnExitAsync,
		cancellation);
}
```
{% endcode %}

`Zongsoft.Commands` 中的消息队列订阅命令就是这种结构：进入时订阅队列并持续输出消息，用户按 Ctrl+C 后退出并注销订阅。

## 输出样式

`ITerminal` 继承 `ICommandOutlet`，因此命令可以使用 `CommandOutletContent` 组合颜色、样式和文本片段。控制台终端会把这些样式转换为 ANSI 转义序列输出。

{% code title="彩色输出" %}
```csharp
Terminal.WriteLine(CommandOutletColor.Green, "服务已启动。");
Terminal.WriteLine(CommandOutletColor.Red, "命令执行失败。");
```
{% endcode %}

## 参考实现

* [Terminals 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Terminals)
* [QueueSubscribeCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Commands/src/Messaging/QueueSubscribeCommand.cs)
