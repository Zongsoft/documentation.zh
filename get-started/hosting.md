---
description: 根据调试、服务运行和 Web API 场景选择合适的 Zongsoft 宿主程序。
icon: server
---

# 选择宿主程序

Zongsoft 的宿主程序位于 [`Zongsoft/hosting`](https://github.com/Zongsoft/hosting) 仓库。宿主程序只负责启动运行时和承载插件，不应该直接写入业务代码。

## 宿主类型

### 终端宿主

终端宿主通过控制台运行，适合交互式调试、命令行复现和观察插件式应用行为。

源码目录：

```text
hosting/terminal
```

### 后台服务宿主

后台服务宿主适合部署为 Windows Service 或 Linux systemd 服务，面向长期运行的后台应用。

源码目录：

```text
hosting/daemon
```

### Web 宿主

Web 宿主基于 ASP.NET，适合 Web API、认证授权、HTTP 管线、站点配置和接口调测。

源码目录：

```text
hosting/web/default
```

## 如何选择

开发和调试插件时，优先使用终端宿主；需要验证 HTTP 接口时，使用 Web 宿主；准备部署为后台服务时，使用后台服务宿主。

## 下一步

选择宿主后，继续阅读 [部署第一个插件](deploy-first-plugin.md)，了解如何把插件部署到宿主的 `plugins/` 目录。

## 复用条件

共享业务契约可以在不同宿主中复用，控制器、中间件和交互命令则需要相应宿主能力。建立业务服务时尽量把协议适配放在边缘，让终端命令与 HTTP 控制器调用同一服务。

现有 hosting 默认组合了多种基础设施，首次学习可先使用教程中的独立最小宿主。需要现成运行方案时，分别阅读[终端](../hosting/terminal.md)、[后台服务](../hosting/daemon.md)和[Web](../hosting/web.md)的构建及部署说明。
