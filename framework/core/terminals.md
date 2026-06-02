---
description: Zongsoft.Terminals 命名空间及其子命名空间的职责。
icon: terminal
---

# Zongsoft.Terminals

`Zongsoft.Terminals` 提供终端应用抽象、终端执行器、终端样式和常用终端命令，用于快速构建交互式控制台程序。

## 主要职责

* 定义 `ITerminal`、`ITerminalExecutor` 等终端抽象。
* 提供 `Terminal` 及其控制台执行能力。
* 支持退出事件、终端样式和命令执行。
* 提供清屏、退出、Shell 等常用终端命令。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Terminals.Commands` | 终端内置命令。 |

## 相关资源

* [Terminals 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Terminals)
