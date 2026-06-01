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
