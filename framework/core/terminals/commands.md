---
description: Zongsoft.Terminals.Commands 终端内置命令。
icon: keyboard
---

# Commands

`Zongsoft.Terminals.Commands` 提供控制台终端默认装载的内置命令。`ConsoleExecutor` 构造时会把这些命令加入根命令节点，因此终端程序启动后即可使用。

这些命令都是围绕终端环境设计的。`Exit` 和 `Shell` 需要从命令上下文取得当前终端；如果在普通命令执行器中直接运行，通常会抛出不支持异常或没有实际效果。

## 命令列表

| 命令 | 类型 | 说明 |
| --- | --- | --- |
| `Clear` | `ClearCommand` | 调用当前终端的 `Clear()` 清屏。 |
| `Exit` | `ExitCommand` | 退出终端命令循环，支持 `--yes` 或 `-y` 跳过确认。 |
| `Shell` | `ShellCommand` | 在 Windows 上通过 `cmd.exe /C` 执行外部命令，并把标准输出写回终端。 |

## ClearCommand

`ClearCommand` 会尝试使用当前终端的清屏能力清理控制台输出。控制台终端会先写入 ANSI 清屏序列，再调用 `System.Console.Clear()`。

{% code title="清屏" %}
```bash
Clear
```
{% endcode %}

如果命令不是在终端执行器中运行，`ClearCommand` 取不到终端时不会清屏，也不会输出额外结果。

## ExitCommand

`ExitCommand` 只支持在终端执行器中运行。未指定 `--yes` 时会向终端输出确认提示，用户输入 `yes` 后抛出终端退出异常，由 `ConsoleExecutor` 捕获并触发退出事件。

{% code title="退出终端" %}
```bash
Exit --yes
```
{% endcode %}

也可以使用短选项：

{% code title="使用短选项退出" %}
```bash
Exit -y
```
{% endcode %}

如果没有指定 `--yes`，命令会读取终端输入；只有输入 `yes` 才会退出。其它输入会返回命令循环。

## ShellCommand

`ShellCommand` 用于在终端内临时执行系统命令。它支持 `timeout` 选项，默认值为 `1s`。当前实现面向 Windows 控制台，会通过 `cmd.exe /C` 执行第一个命令参数；非 Windows 平台会抛出不支持异常。

{% code title="执行 Shell 命令" %}
```bash
Shell "dotnet --info" --timeout:10s
```
{% endcode %}

如果进程在超时时间内没有退出，命令返回 `-1`；否则返回外部进程退出码。`timeout` 小于或等于零时，当前实现会使用 30 秒等待时间。

{% hint style="warning" %}
`ShellCommand` 会执行外部系统命令，生产环境或多用户终端中应谨慎开放该命令。更稳妥的做法是只挂载明确的业务命令，而不是把任意 Shell 能力暴露给终端用户。
{% endhint %}

## 命令资源

内置命令的显示名称、描述和选项说明来自资源文件，例如 `ExitCommand.Name`、`ExitCommand.Description`、`ShellCommand.Options.Timeout`。如果终端程序需要多语言展示，建议优先维护资源，而不是在命令逻辑里硬编码展示文本。

## 使用建议

内置命令适合本地终端和开发工具。发布给生产环境或远程用户的终端，应根据权限和运维策略决定是否保留 `Shell`，也可以在启动时调整命令树，只暴露业务允许的命令集合。

## 参考实现

* [ClearCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Terminals/Commands/ClearCommand.cs)
* [ExitCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Terminals/Commands/ExitCommand.cs)
* [ShellCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Terminals/Commands/ShellCommand.cs)
