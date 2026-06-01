---
description: Zongsoft.Web 与插件式 Web 应用的基础能力。
icon: globe
---

# Web 基础

`Zongsoft.Web` 提供 Web 应用开发通用能力，`Zongsoft.Plugins.Web` 提供 Web 应用的插件化支持。

## 主要能力

- ASP.NET 应用启动封装。
- 控制器、路由、绑定、过滤器和格式化相关扩展。
- Web 安全与认证授权集成。
- SignalR 支持。
- OpenAPI 和 gRPC 扩展包。

## 宿主关系

Web 宿主位于：

```text
hosting/web/default
```

它通过 `Zongsoft.Web.Application.Web(...)` 启动 ASP.NET 应用，并传入 `host=web`、`site=default` 等参数。

## 相关扩展

- `Zongsoft.Web.OpenApi`
- `Zongsoft.Web.Grpc`
- `Zongsoft.Plugins.Web`
