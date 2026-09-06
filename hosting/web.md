---
description: 启动插件化 HTTP 宿主，组织站点配置，并验证控制器与运行环境。
icon: globe
---

# Web 宿主

Web 宿主承载控制器、认证授权及 HTTP 协议扩展。业务接口由插件提供，宿主入口负责建立运行管线和站点上下文。框架能力见[Web 基础](../framework/web.md)。

## 默认站点

当前仓库实际提供 `web/default`。管理端、商家端、客户端、回调网关等是可按业务建立的站点划分示例，并非已经存在的完整产品。

当前入口传入 `host=web`、`site=default`、`daemon=zongsoft.web`，将根路径重定向到 `/Application` 后运行应用：

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

新增站点时，应同时调整入口、构建/部署脚本中的 `site` 和相应选项，不能只复制目录后修改显示标题。

## 构建与部署

项目默认引用相邻 framework 的输出，当前 Web 项目还需核对其 Release 引用路径。插件报 [`Zongsoft.Web`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Web) 程序集版本不匹配时，先核对框架输出和最终 DLL，再重新部署宿主。

运行目录需要宿主自身的依赖文件、`appsettings.json`、插件清单及资源。仅复制业务控制器 DLL 无法代替完整插件部署。一个独立探针控制器的完整示例见[部署控制器插件](../framework/web/controllers.md)。

## 从 HTTP 验证

先从启动日志确认实际监听地址，再请求 `/Application`。`/Modules`、`/Events` 可用于查看相应描述；能否访问仍受实际部署和授权配置影响。

{% code title="ProbeApplication.ps1" %}
```powershell
curl.exe --include http://127.0.0.1:8069/Application
```
{% endcode %}

`8069` 是本地示例端口，应换成实际监听值。连接失败、404、401/403、500 分别优先检查监听网络、路由加载、身份权限和服务端异常，不要对所有情况都重新部署全部插件。

仓库 `web/.http` 包含 HttpYac 请求定义，也可按其方法、路径、头和正文转换为其他 HTTP 客户端调用。凭据应由当前环境获取，不将默认测试账号或秘密复制到正文示例。

## 发布与代理

Linux 打包时，入口名称应为 `Zongsoft.Hosting.Web`，服务名可以为 `zongsoft.web`；不要让生成的服务指向类库 `Zongsoft.Web.dll`。服务文件的生成规则见[打包工具](../tools/packager.md)。

反向代理环境应核对外部 URL、转发头信任、HTTPS、请求大小及超时。启用 OpenAPI 或 Dashboard 后还需检查对应访问控制；CORS 配置不替代认证。

空 `wwwroot` 导致的静态文件目录提示不一定影响纯 API 服务，勿为了消除提示加入无关占位业务。应按应用是否实际提供静态内容判断。

相关专题：[数据服务接口](../framework/web/data-services.md)、[OpenAPI/gRPC](../framework/web/protocols.md)、[认证授权](../framework/security/authentication.md)。

源码入口：[默认 Web 站点](https://github.com/Zongsoft/hosting/tree/main/web/default)。
