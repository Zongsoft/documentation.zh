---
description: 以插件组织 ASP.NET Core 应用，连接控制器、数据服务、请求管线和协议扩展。
icon: globe
---

# Web 基础

[Zongsoft.Web](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Web) 提供通用控制器、绑定、格式化、路由、凭据认证及文件访问等能力；[Zongsoft.Plugins.Web](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins.Web) 把这些能力接入插件宿主，负责 Web 部件发现和应用生命周期。业务控制器放在插件中，宿主负责承载与装配。

{% hint style="info" %}
设计和实现业务 HTTP 接口时，应遵守 [REST API 设计规范](https://github.com/Zongsoft/Guidelines/blob/main/zongsoft.rest-api.guidelines.md)。C# 编码规范及开发前的统一要求见[准备环境：开发规范](../get-started/prerequisites.md#开发规范)。
{% endhint %}

## 先理解请求经过什么

一个请求先由宿主中间件处理，再匹配控制器与操作；模型绑定把路径、查询、请求头和请求体转换为参数，控制器调用业务服务，格式化器输出响应。认证建立调用者身份，授权决定是否允许操作，二者各自承担职责。

插件 Web 入口会初始化应用上下文和应用[初始化器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IApplicationInitializer.cs)，再依次加入 CORS、本地化、方法覆盖、路由、认证、授权、响应压缩与静态文件，最后映射控制器及 Hub。扩展中间件时要检查相对顺序，而不是重复安装整条管线。

## 选择使用方式

只需要框架的 MVC 辅助能力时引用 [Zongsoft.Web](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Web)；需要通过清单发现业务控制器时使用 Plugins.Web 宿主。现成启动器见[Web 宿主](../hosting/web.md)。

来源：[hosting/web/default/Program.cs](https://github.com/Zongsoft/hosting/blob/main/web/default/Program.cs#L12)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
static void Main(string[] args)
{
	var app = Zongsoft.Web.Application.Web([..args, "host=web", "site=default", "daemon=zongsoft.web"]);

	//如果要启用私有部署模式则打开下行代码注释
	//app.Configuration["Deployment"] = "private";

	app.Map("/", ctx => { ctx.Response.Redirect("/Application"); return Task.CompletedTask; });
	app.Run();
}
```
{% endcode %}

项目需要引用 [`Zongsoft.Plugins.Web`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins.Web)，运行目录还需要基础插件清单与业务插件。这个入口本身不会生成业务 API 或数据库结构。

## 学习路径

- [部署控制器插件](web/controllers.md)：从类库、清单到一次 HTTP 请求。
- [请求与数据服务接口](web/data-services.md)：将数据服务接到 CRUD 接口，理解绑定、分页与能力开关。
- [OpenAPI 与 gRPC](web/protocols.md)：查看接口文档、注册协议服务与核对端点。
- [安全](security.md)：配置凭据、授权和验证码。

## 请求状态与共享服务

Web 应用上下文可以桥接当前请求主体及会话。请求结束后，不能继续依赖该请求中的对象；后台任务应显式接收需要的业务数据，而不是保留请求上下文。通过服务特性注册的普通插件服务默认是共享实例，详见[服务所有权](core/services/locating.md)。

{% hint style="warning" %}
🚨 当前插件宿主包含宽松的默认 CORS 策略。业务上线前应按实际来源和凭据方式调整；存在认证和授权中间件不等于所有端点自动受到保护。插件、模块、文件和诊断等管理端点也应纳入访问策略。
{% endhint %}

## 排查思路

先确认宿主监听及网络可达，再确认插件被加载、程序集作为 Web 部件加入、路由模板匹配，最后检查服务解析与业务依赖。404 通常应从路由与发现排查；认证失败和业务拒绝则沿安全与服务链路排查。

实现依据：[Web 入口](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins.Web/src/Application.cs)、[Web 构建器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins.Web/src/WebApplicationBuilder.cs)、[Web 基础源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Web/src)。
