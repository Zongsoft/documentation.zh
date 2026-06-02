---
description: Zongsoft.Components 命令模型、命令行解析和命令执行器。
icon: greater-than
---

# 命令

`Zongsoft.Components` 的命令模型把一次业务调用表示为一段命令表达式、一个命令节点和一个执行上下文。它不绑定特定容器或宿主，因此同一个命令可以运行在后台服务、Web 程序、部署脚本或终端程序中；在终端环境中，还可以进入交互式响应模式。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ICommand`、`ICommand<TContext>` | 命令接口，定义命令名称、是否启用以及异步执行入口。 |
| `CommandBase`、`CommandBase<TContext>` | 命令基类，封装命令名称、显示名、描述、选项描述和执行模板方法。 |
| `CommandContext`、`CommandContextUtility` | 命令执行上下文及辅助方法，承载参数、选项、结果、输出和当前命令节点。 |
| `CommandCompletionContext` | 命令完成通知上下文，用于命令执行后的完成处理。 |
| `CommandAliaser`、`ICommandAliaser` | 命令别名解析器，可把输入别名翻译为真实命令路径。 |
| `CommandDescriptor` | 命令描述信息，供帮助、提示、补全和 UI 呈现使用。 |
| `CommandNode`、`CommandNodeCollection` | 命令树节点和子节点集合，形成可按路径查找的命令目录。 |
| `CommandLoaderBase`、`ICommandLoader` | 命令加载器基类，用于从外部来源装载命令节点。 |
| `CommandLine` | 命令行表达式解析与反向格式化工具。 |
| `CommandOption`、`CommandOptionAttribute`、`CommandOptionDescriptor` | 命令选项对象、声明式选项元数据和选项描述集合。 |
| `CommandExecutor`、`ICommandExecutor` | 命令执行器，负责解析表达式、定位命令节点、建立上下文并执行命令管线。 |
| `ICommandInvoker`、`ICommandOutlet`、`ICommandCompletion` | 命令调用、输出和完成通知扩展点。 |

<details>
<summary>命令相关接口速览</summary>

名称以 `ICommand*` 开头的接口大多是命令模型的扩展点，例如 `ICommandOutletDumper` 负责把复杂对象输出为命令出口内容，`ICommandCompletion` 负责命令完成后的通知，`ICommandLoader` 负责命令节点加载。实现命令时通常只需要继承 `CommandBase<TContext>`，只有在接入特殊执行器、终端或帮助系统时才需要实现这些扩展接口。
</details>

## 命令行格式

`CommandLine.Parse(...)` 把一段文本解析为一个或多个 `Cmdlet`。命令名支持字母、数字、下划线、点号和路径斜线；选项既支持短选项，也支持完整选项；选项值可以用 `:` 或 `=` 指定，并支持单引号、双引号和反斜杠转义。

{% code title="命令表达式" %}
```bash
phone.send --destination:13812345678 --template:authentication
```
{% endcode %}

{% code title="带参数、短选项和管线的表达式" %}
```bash
queue.subscribe orders.created -v:true | log.write --level:information
```
{% endcode %}

`|` 会把表达式分隔成多个 `Cmdlet`，由执行器依次定位和执行。带空格的参数或选项值需要加引号；`CommandLine.Get(...)` 会按同一套规则把参数数组格式化回命令文本。

## 执行模型

{% stepper %}
{% step %}
## 解析表达式

`CommandExecutor.ExecuteAsync(...)` 先调用命令行解析器得到 `Cmdlet` 列表，并通过 `CommandAliaser` 处理别名。
{% endstep %}

{% step %}
## 定位命令节点

执行器从 `Root` 命令树查找命令节点。终端执行器还会把当前节点作为查找锚点，让用户能在命令树中进入某个子目录后执行相对命令。
{% endstep %}

{% step %}
## 建立上下文

执行器把参数、选项、输入值、输出出口和命令节点写入 `CommandContext`，然后调用命令实例。
{% endstep %}

{% step %}
## 完成通知

命令执行完成后，执行器通过 `ICommandCompletion` 栈进行完成通知，便于做审计、状态同步或后续处理。
{% endstep %}
{% endstepper %}

## 跨领域调用

命令模式特别适合“调用方知道要做什么，但不想依赖具体服务接口”的场景。比如发送短信，业务代码可以提交一条命令表达式，而不需要引用短信发送接口、短信供应商实现或终端实现。

{% code title="通过命令发送短信" %}
```csharp
await CommandExecutor.Default.ExecuteAsync(
	"phone.send --destination:13812345678 --template:authentication",
	cancellation: cancellation);
```
{% endcode %}

这个命令可以被部署到后台服务、Web 管理端或终端程序中。调用方只依赖命令表达式和命令执行器，短信命令本身可以再通过插件、配置或供应商适配器切换实现。

## 终端交互

终端是命令模式的一个具体落地方式。`Zongsoft.Terminals` 的 `ConsoleExecutor` 继承自 `CommandExecutor`，并在控制台循环中读取用户输入、执行命令和输出结果。

对于订阅消息队列、监听事件、临时观察数据流这类“进入后需要等待 Ctrl+C 退出”的命令，可以使用 `Terminal.ReactiveAsync(...)` 进入交互式响应模式。`Zongsoft.Commands` 项目中的 `QueueSubscribeCommand` 就是这种模式：进入时订阅队列，退出时注销订阅。

{% content-ref url="../terminals/terminal.md" %}
[terminal.md](../terminals/terminal.md)
{% endcontent-ref %}

## 参考实现

* [Zongsoft.Commands 源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Commands/src)
* [QueueSubscribeCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Commands/src/Messaging/QueueSubscribeCommand.cs)
* [Components/Commands 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Commands)
