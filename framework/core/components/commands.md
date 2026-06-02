---
description: Zongsoft.Components 命令模型、命令行解析和命令执行器。
icon: greater-than
---

# 命令

命令模式把一次操作抽象为“命令表达式 + 命令节点 + 执行上下文”。调用方提交一段文本表达式，`CommandExecutor` 解析表达式、在命令树中定位 `CommandNode`、创建 `CommandContext`，再调用节点上的 `ICommand` 实例。

这个模型只依赖 `Zongsoft.Components` 的基础抽象，不绑定特定依赖注入容器、Web 框架或终端环境。因此，同一组命令可以运行在后台服务、Web 程序、部署工具和终端程序中；在终端宿主中，还可以进入交互式响应模式。

## 适用场景

命令模式特别适合跨领域、低耦合的调用。调用方知道要触发什么动作，却不希望引用某个具体业务接口或供应商实现时，就可以提交一段命令表达式。

例如短信发送能力可以挂载为 `phone.send` 命令，业务代码只依赖命令执行器：

{% code title="通过命令发送短信" %}
```csharp
await CommandExecutor.Default.ExecuteAsync(
	"phone.send 13812345678 --template:authentication",
	cancellation: cancellation);
```
{% endcode %}

上面的表达式可以由后台服务、Web 管理端、部署脚本或终端程序触发。短信命令本身可以来自插件、配置或供应商适配器，调用方不需要引用短信发送接口，也不需要知道当前使用哪家短信服务商。

{% hint style="info" %}
`Zongsoft.Externals.Aliyun` 中的 `PhoneSendCommand` 以手机号作为命令参数，并通过 `--template`、`--parameters`、`--scheme`、`--extra` 等选项传递发送配置。
{% endhint %}

## 核心对象

| 类型 | 说明 |
| --- | --- |
| `ICommand`、`ICommand<TContext>` | 命令接口，定义命令名称、启用状态、可执行判断和异步执行入口。 |
| `CommandBase`、`CommandBase<TContext>` | 命令基类，封装名称推导、启用判断、执行前后事件、异常处理和模板方法。 |
| `CommandContext`、`CommandContextBase` | 命令执行上下文，承载参数、选项、输入值、执行结果、共享参数集、输出器和当前命令节点。 |
| `CommandContextUtility` | 基于当前 `CommandNode` 查找相邻命令、父级命令或指定类型命令的扩展方法。 |
| `CommandCompletionContext`、`ICommandCompletion` | 命令完成通知上下文与扩展点，用于在命令管线结束后执行清理、审计或状态同步。 |
| `CommandDescriptor` | 从命令类型和注解提取的描述信息，供帮助、选项绑定、提示、补全和 UI 展示使用。 |
| `CommandAttribute` | 命令类型上的声明式元数据，可用于控制命令描述和选项解析行为。 |
| `CommandNode`、`CommandNodeCollection` | 命令树节点和子节点集合，支持根路径、相对路径、父级路径和别名查找。 |
| `CommandLoaderBase`、`ICommandLoader` | 延迟加载命令节点的扩展点，用于从插件、配置或外部来源装载命令树。 |
| `CommandLine` | 命令行表达式解析和反向格式化工具，解析结果由 `CommandLine.Cmdlet` 与 `CommandLine.CmdletOption` 表示。 |
| `CommandOptionAttribute`、`CommandOptionDescriptor` | 声明式选项元数据和选项描述，支持类型转换、默认值、必填检查和帮助展示。 |
| `CommandArgumentCollection` | 命令参数集合，提供参数访问和集合语义。 |
| `CommandException`、`CommandNotFoundException`、`CommandOptionException` | 命令执行、节点查找和选项绑定过程中的专用异常。 |
| `CommandAliaser`、`ICommandAliaser` | 命令别名登记接口；别名最终挂载到 `CommandNode.Aliases`，查找节点时可按别名命中。 |
| `CommandExecutor`、`ICommandExecutor` | 命令执行器，负责解析表达式、定位节点、建立上下文、串联管线、输出错误和触发执行事件。 |
| `CommandExecutorContext` | 一次命令表达式执行会话的上下文，保存原始 `Cmdlet` 列表、输入值、结果和会话级参数。 |
| `ICommandInvoker`、`ICommandOutlet`、`ICommandOutletDumper` | 命令调用、标准输出和复杂对象输出格式化的扩展点。 |

<details>
<summary>关于 `Command*` 与 `ICommand*`</summary>

`Command*` 类型大多是命令模型的默认实现、上下文、描述、异常和事件参数；`ICommand*` 类型大多是扩展点。实现业务命令时通常继承 `CommandBase<CommandContext>` 就够了，只有在定制执行器、输出器、命令加载器、对象输出格式或完成通知时，才需要实现 `ICommandExecutor`、`ICommandOutlet`、`ICommandLoader`、`ICommandOutletDumper`、`ICommandCompletion` 等接口。
</details>

{% hint style="warning" %}
当前核心库没有独立的顶层 `CommandOption` 类。命令行解析出来的选项是 `CommandLine.CmdletOption`，命令类型上的声明式选项是 `CommandOptionAttribute`，描述信息是 `CommandOptionDescriptor`。
{% endhint %}

## 命令行格式

`CommandLine.Parse(...)` 把一段文本解析为一个或多个 `Cmdlet`。每个 `Cmdlet` 由命令名、参数集和选项集组成；`|` 会把表达式拆分成多个 `Cmdlet`，执行器会把前一个命令的结果作为后一个命令的输入值。

命令名支持字母、数字、下划线、点号和路径斜线。路径可以是根路径、相对路径或父级路径：

* `/` 表示根节点。
* `.` 表示当前节点。
* `..` 表示上级节点。
* `/queue.subscribe`、`./subscribe`、`../stop` 都是可解析的命令路径。

选项支持短选项和完整选项。选项值可以用 `:` 或 `=` 指定，选项名可包含字母、数字、下划线、短横线、点号、`@`、`#`、`$`；参数和值支持单引号、双引号和反斜杠转义。

{% code title="常规命令表达式" %}
```bash
phone.send 13812345678 --template:authentication
```
{% endcode %}

{% code title="短选项、参数和管线" %}
```bash
queue.subscribe orders.created -a:true --format:text | dump --indent:2
```
{% endcode %}

{% code title="带空格和转义的参数" %}
```bash
file.save 'C:\Temp\hello world.txt' --content:"hello\nworld"
```
{% endcode %}

`CommandLine.Get(...)` 可以按同一套规则把参数数组格式化回命令文本，适合把程序内构造的参数安全地转成命令表达式。

## 执行流程

{% stepper %}
{% step %}
## 解析表达式

`CommandExecutor.ExecuteAsync(...)` 创建 `CommandExecutorContext`，调用 `CommandLine.Parse(...)` 得到 `Cmdlet` 列表，并触发执行器的 `Executing` 事件。
{% endstep %}

{% step %}
## 定位节点

执行器逐个查找 `Cmdlet.Name` 对应的 `CommandNode`。`CommandNode.Find(...)` 支持 `/`、`.`、`..` 路径，并在子节点名未命中时继续检查子节点别名。
{% endstep %}

{% step %}
## 建立上下文

执行器为当前节点创建 `CommandContext`，写入参数、选项、输入值、命令实例、命令节点、输出器和共享参数集。
{% endstep %}

{% step %}
## 调用命令

默认 `ICommandInvoker` 调用 `context.Command.ExecuteAsync(context, cancellation)`。如果命令继承 `CommandBase<CommandContext>`，执行时会先做 `CanExecuteAsync(...)` 判断，再触发命令自身的执行前后事件。
{% endstep %}

{% step %}
## 串联结果

如果表达式包含管线，前一个命令的返回值会成为下一个命令的 `context.Value`。整个表达式最终返回最后一个命令的结果。
{% endstep %}

{% step %}
## 完成通知

实现 `ICommandCompletion` 的命令会被压入完成通知栈。表达式执行结束或发生异常后，执行器会创建 `CommandCompletionContext` 并回调 `OnCompleted(...)`。
{% endstep %}
{% endstepper %}

## 命令树与加载

命令通过 `CommandNode` 组织成树形目录。一个节点可以只作为目录存在，也可以挂载一个 `ICommand` 实例；节点还可以拥有别名集合和延迟加载器。

常见装载方式包括：

* 直接向 `CommandExecutor.Root.Children` 添加命令或子节点。
* 使用 `CommandExecutorUtility.Command(...)` 把委托包装成临时命令。
* 通过 `CommandLoaderBase` / `ICommandLoader` 从插件、配置或外部来源懒加载命令节点。
* 使用 `AliasAttribute` 或 `ICommandAliaser.Set(...)` 为节点登记短别名。

`Zongsoft.Commands` 项目提供了一批通用命令实现，例如配置、文件、目录、JSON、随机数、序列、消息队列、安全密钥等命令。它们都是命令模式在不同领域上的具体落地。

## 终端交互

终端是命令模式的一个宿主实现。`Zongsoft.Terminals` 的内部 `ConsoleExecutor` 继承自 `CommandExecutor`，在控制台循环中读取用户输入、执行命令、输出结果，并维护当前命令节点。用户进入某个命令目录后，可以继续使用相对路径执行子命令。

终端还支持响应式命令。对于消息队列订阅、事件监听、临时观察数据流这类“进入后持续等待，直到用户按 Ctrl+C 退出”的场景，命令可以调用 `Terminal.ReactiveAsync(...)`：

{% code title="响应式命令骨架" %}
```csharp
protected override ValueTask<object> OnExecuteAsync(CommandContext context, CancellationToken cancellation) =>
	context.ReactiveAsync(this.OnEnterAsync, this.OnExitAsync, cancellation);
```
{% endcode %}

`Zongsoft.Commands` 项目中的 `QueueSubscribeCommand` 就采用这种模式：进入时订阅队列并输出收到的消息，退出时注销订阅。

{% content-ref url="../terminals/terminal.md" %}
[terminal.md](../terminals/terminal.md)
{% endcontent-ref %}

命令适合跨模块、脚本化、终端化或插件化的动作调用。如果调用方需要强类型返回模型、复杂事务边界或稳定领域契约，直接使用应用服务接口通常更清晰。命令表达式来自外部输入时，调用方或命令本身仍应完成权限、参数范围和危险操作确认；命令节点名称也应保持稳定，避免部署脚本、终端命令和插件声明同时失效。

## 参考实现

* [Zongsoft.Commands 源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Commands/src)
* [QueueSubscribeCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Commands/src/Messaging/QueueSubscribeCommand.cs)
* [PhoneSendCommand.cs](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/src/Telecom/PhoneSendCommand.cs)
* [Components 命令模型源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
* [Components/Commands 内置命令源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Commands)
