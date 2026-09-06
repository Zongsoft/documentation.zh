---
description: 将普通 ASP.NET Core 控制器作为插件部署，并核对发现、路由和首次请求。
icon: route
---

# 部署控制器插件

本例在已准备好的[Web 宿主](../../hosting/web.md)中加入一个只返回固定结果的控制器。它不依赖数据库，适合先验证插件发现与 HTTP 路由，再接业务服务。

## 创建控制器类库

创建 `Acme.Probe.Web` 类库，目标框架与宿主一致。项目需要 ASP.NET Core 框架引用；以 .NET 10 为例：

{% code title="Acme.Probe.Web.csproj" %}
```xml
<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<TargetFramework>net10.0</TargetFramework>
		<ImplicitUsings>enable</ImplicitUsings>
		<Nullable>enable</Nullable>
	</PropertyGroup>
	<ItemGroup>
		<FrameworkReference Include="Microsoft.AspNetCore.App" />
	</ItemGroup>
</Project>
```
{% endcode %}

{% code title="ProbeController.cs" %}
```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Acme.Probe.Web;

[ApiController]
[AllowAnonymous]
[Route("probe")]
public sealed class ProbeController : ControllerBase
{
	[HttpGet]
	public IActionResult Get() => this.Ok(new { Value = 42 });
}
```
{% endcode %}

这是无输入、无外部依赖的本地探针。业务控制器应调用应用服务并配置适当授权；需要公共框架契约时再增加对应包引用。

## 声明清单并部署

{% code title="Acme.Probe.Web.plugin" %}
```xml
<plugin name="Acme.Probe.Web">
	<manifest>
		<assemblies>
			<assembly name="Acme.Probe.Web" />
		</assemblies>
		<dependencies>
			<dependency name="Main" />
		</dependencies>
	</manifest>
</plugin>
```
{% endcode %}

构建类库，将 DLL 与清单放入测试宿主的 `plugins/acme/probe/`，保留宿主已有的 Main 等基础清单和依赖。使用部署器时，将这两个本地源文件放入同一目标章节；相对源路径按自己的目录布局填写，详见[部署格式](../../references/deploy-files.md)。

## 发起请求

从测试部署目录启动宿主，下面以现成 Web 启动器及空闲回环端口为例：

{% code title="启动并验证本地探针" %}
```shell
dotnet Zongsoft.Hosting.Web.dll --urls=http://127.0.0.1:51873
```
{% endcode %}

在另一个终端执行：

{% code title="请求探针" %}
```shell
curl -i http://127.0.0.1:51873/probe
```
{% endcode %}

预期状态为 200，JSON 的 Value 对应值为 42；属性大小写可能受当前序列化选项影响。验证后用 Ctrl+C 停止测试宿主。

## 发现与路由是两个阶段

清单声明的程序集被加入 Web 部件集合后，MVC 才能发现控制器。发现成功后仍需要有效路由。默认宿主映射属性路由控制器，只有无模板的 HttpGet 或 Area 元数据并不保证产生可访问 URL。

| 现象 | 检查方向 |
| --- | --- |
| 连接被拒绝 | 监听地址、端口与进程是否启动 |
| 404 | 清单程序集、控制器发现、属性路由、请求路径 |
| 401/403 | 身份验证方案、授权策略与调用者身份 |
| 首次请求抛服务异常 | 依赖注册、插件配置、共享程序集版本 |

{% hint style="warning" %}
🚨 示例的 AllowAnonymous 仅用于固定本地探针。实际业务端点不应复制这一开放策略；有文件访问、用户信息或管理功能时尤其需要明确访问范围。
{% endhint %}

源码定位：[Web 应用上下文](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins.Web/src/WebApplicationContext.cs)、[控制器发现](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/src/ControllerFeatureProvider.cs)。
