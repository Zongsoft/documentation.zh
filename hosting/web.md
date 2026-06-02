---
description: Web 宿主的站点结构、启动方式和接口调试。
icon: globe
---

# Web 宿主

Web 宿主是基于 ASP.NET 的插件式应用宿主，适合 HTTP 接口、认证授权、站点配置和 Web API 调试。

## 目录结构

```text
hosting/web
  default/
```

当前仓库只定义了 `default` 站点。实际项目可以按需要建立 `administration`、`business`、`customer`、`gateway`、`iot` 等站点目录。

## 启动方式

`web/default/Program.cs` 使用 `Zongsoft.Web.Application.Web(...)` 启动应用，并传入宿主和站点参数：

{% code title="Program.cs" %}
```csharp
var app = Zongsoft.Web.Application.Web([..args, "host=web", "site=default", "daemon=zongsoft.web"]);
```
{% endcode %}

## 调试接口

Web 宿主提供应用描述相关接口：

```text
GET /Application
GET /Modules
GET /Events
```

接口调试可使用 `web/.http` 目录中的 REST Client 或 HttpYac 文件。
