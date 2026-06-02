---
description: Zongsoft.Terminals.Commands 终端内置命令。
icon: keyboard
---

# commands

`Zongsoft.Terminals.Commands` 提供控制台终端默认装载的内置命令。`ConsoleExecutor` 构造时会把这些命令加入根命令节点，因此终端程序启动后即可使用。

## 命令列表

| 命令 | 类型 | 说明 |
| --- | --- | --- |
| `Clear` | `ClearCommand` | 调用当前终端的 `Clear()` 清屏。 |
| `Exit` | `ExitCommand` | 退出终端命令循环，支持 `--yes` 或 `-y` 跳过确认。 |
| `Shell` | `ShellCommand` | 在 Windows 上通过 `cmd.exe /C` 执行外部命令，并把标准输出写回终端。 |

## ExitCommand

`ExitCommand` 只支持在终端执行器中运行。未指定 `--yes` 时会向终端输出确认提示，用户输入 `yes` 后抛出终端退出异常，由 `ConsoleExecutor` 捕获并触发退出事件。

{% code title="退出终端" %}
```bash
Exit --yes
```
{% endcode %}

## ShellCommand

`ShellCommand` 用于在终端内临时执行系统命令。它支持 `timeout` 选项，默认值为 `1s`。当前实现面向 Windows 控制台，非 Windows 平台会抛出不支持异常。

{% code title="执行 Shell 命令" %}
```bash
Shell "dotnet --info" --timeout:10s
```
{% endcode %}

{% hint style="warning" %}
`ShellCommand` 会执行外部系统命令，生产环境或多用户终端中应谨慎开放该命令。
{% endhint %}

## ClearCommand

`ClearCommand` 会尝试使用终端的清屏能力清理当前控制台输出。控制台终端会同时使用 ANSI 清屏序列和 `System.Console.Clear()`。

## 参考实现

* [ClearCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Terminals/Commands/ClearCommand.cs)
* [ExitCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Terminals/Commands/ExitCommand.cs)
* [ShellCommand.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Terminals/Commands/ShellCommand.cs)
