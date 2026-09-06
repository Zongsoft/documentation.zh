---
description: 构建并部署 Discussions Web 类库，检查控制器发现和请求前提。
icon: plug
---

# 部署控制器插件


Discussions 的 API 项目是 Web 类库，OutputType 为 Library。它包含控制器但没有可独立启动的入口，必须与[Web 宿主](../../hosting/web.md)及领域插件一起部署。

## 构建真实项目

{% code title="从 discussions 根目录构建 API" %}
```powershell
dotnet build src/api/Zongsoft.Discussions.Web.csproj -f net10.0 -p:GeneratePackageOnBuild=false
```
{% endcode %}

这会同时构建领域库。需要与当前框架联调时，先构建对应 Core/Web 程序集，再添加本地引用开关，见[业务插件](../../get-started/first-business-plugin.md)。

## Web 清单依赖领域插件

来源：[src/api/Zongsoft.Discussions.Web.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Zongsoft.Discussions.Web.plugin#L9)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.Web.plugin" %}
```xml
<manifest>
	<dependencies>
		<dependency name="Zongsoft.Discussions" />
	</dependencies>

	<assemblies>
		<assembly name="Zongsoft.Discussions.Web" />
	</assemblies>
</manifest>
```
{% endcode %}

依赖保证先装配领域模块，程序集声明让宿主发现控制器。只部署 Web DLL 而漏掉领域映射、身份扩展和数据驱动，会导致控制器存在但业务调用失败。

## 随包交付的资源

来源：[src/api/Zongsoft.Discussions.Web.deploy](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Zongsoft.Discussions.Web.deploy#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.Web.deploy" %}
```ini
artifacts/Zongsoft.Discussions.Web.plugin
lib/$(Framework)/Zongsoft.Discussions.Web.*

[templates]
artifacts/templates/*.xlsx
```
{% endcode %}

用户归档模板在 templates 中。项目还把 docs/http 请求文件打入 artifacts/http，供核对接口；请求中的地址与凭证必须由自己的环境提供。

## 验证路径

先确认 Discussions 和 Discussions.Web 清单加载，再确认 Threads、Forums、Users 等控制器进入应用模型。随后检查认证、站点、连接、映射和外部文件配置，最后验证查询与业务动作。

公开动作以控制器当前路由为准。仓库早期 docs/api.md 是历史接口草稿；未经核对，不应将其中的单数路径视为当前可执行范例。主题审核的具体代码见[请求与数据服务接口](data-services.md)。
