---
description: 从 Discussions 已有模块理解业务模型、服务注册、插件清单和交付产物。
icon: puzzle-piece
---

# 编写第一个业务插件


本篇直接阅读并构建 Discussions 业务插件。先从已有实现理解框架的分工，再在同一个业务模型上扩展需求。前置条件是[准备环境](prerequisites.md)所需 SDK 与 discussions 源码。

## 1. 构建现有业务库

项目支持 .NET 8、9、10；NuGet 版本来自根目录 Directory.Packages.props。源码目录和 SDK 的准备见[准备环境](prerequisites.md)。下面演示本地引用方式：从 discussions 根目录先构建相邻 framework 的[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)和 Web，再以本地引用构建 Discussions；统一使用默认 Debug 配置和 .NET 10，并关闭构建时打包：

{% code title="构建 Discussions" %}
```powershell
dotnet build ../framework/Zongsoft.Core/src/Zongsoft.Core.csproj -f net10.0 -p:GeneratePackageOnBuild=false
dotnet build ../framework/Zongsoft.Web/src/Zongsoft.Web.csproj -f net10.0 -p:GeneratePackageOnBuild=false
dotnet build src/Zongsoft.Discussions.csproj -f net10.0 -p:ZongsoftFrameworkPathReferenced=true -p:GeneratePackageOnBuild=false
dotnet build src/api/Zongsoft.Discussions.Web.csproj -f net10.0 -p:ZongsoftFrameworkPathReferenced=true -p:GeneratePackageOnBuild=false
```
{% endcode %}

`-p:ZongsoftFrameworkPathReferenced=true` 选择本地程序集，但不会自动构建 framework，目录、配置和目标框架必须与其输出一致。如果所用 NuGet 源已包含项目要求的[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)等依赖版本，可省略本地引用参数并使用默认包引用方式。

## 2. 模块是装配入口

来源：[src/Module.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Module.cs#L31)（节选；上下文见源文件）。

{% code title="Module.cs" %}
```csharp
[assembly: ApplicationModule(Zongsoft.Discussions.Module.NAME)]

namespace Zongsoft.Discussions;

public class Module : ApplicationModule<Module.EventRegistry>
{
	#region 常量定义
	/// <summary>表示论坛模块的名称常量值。</summary>
	public const string NAME = nameof(Discussions);
	#endregion
```
{% endcode %}

程序集声明把服务归到 Discussions 模块。Module.Current 提供共享模块实例；不要为每次请求重新创建它。模块访问器和服务容器的关系见[服务定位](../framework/core/services/locating.md)。

## 3. 服务承载业务动作

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L41)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
[Service(nameof(ThreadService))]
[DataService(typeof(ThreadCriteria))]
public class ThreadService : DataServiceBase<Models.Thread>
{
	#region 成员字段
	private PostService _posting;
	#endregion

	#region 构造函数
	public ThreadService(IServiceProvider serviceProvider) : base(serviceProvider) { }
```
{% endcode %}

ThreadService 的数据模型是 Thread，查询条件模型是 ThreadCriteria。服务还实现审核、锁定、置顶等业务动作，控制器只负责把请求转给服务。先读[数据服务](../framework/data/services.md)，不要把审核规则直接复制到每个控制器。

## 4. 清单把模块接入框架

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L20)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<extension path="/Workbench/Modules">
	<object name="Discussions" value="{static:Zongsoft.Discussions.Module.Current, Zongsoft.Discussions}">
		<expose name="Accessor" value="{path:../@Accessor}">
			<expose name="Filters" value="{path:../@Filters}" />
		</expose>

		<expose name="Events" value="{path:../@Events}" />
		<expose name="Properties" value="{path:../@Properties}" />
	</object>
</extension>
```
{% endcode %}

这里注册的是现有 Module.Current。Accessor.Filters 让插件树能够继续挂载查询过滤器；Events 与 Properties 分别暴露事件注册表和模块属性。清单另有数据验证器、安全质询器与身份转换器，详见[插件文件](../framework/plugins/plugin-file.md)。

## 5. 交付程序集与元数据

来源：[src/Zongsoft.Discussions.deploy](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.deploy#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.deploy" %}
```ini
artifacts/Zongsoft.Discussions.plugin
artifacts/Zongsoft.Discussions.option
artifacts/Zongsoft.Discussions.mapping
lib/$(Framework)/Zongsoft.Discussions.*
```
{% endcode %}

只复制 DLL 不足以运行论坛。映射定义实体关系，选项定义文件存储基础路径，插件清单负责挂载。Web 层还有独立清单和归档模板，按[部署第一个插件](deploy-first-plugin.md)一起交付。

## 扩展时从哪里开始

增加业务字段时同时检查模型、映射、四种 SQL 脚本和查询模式；增加业务动作时先放到服务，再做 HTTP 适配。对于论坛数据，任何扩展都必须保留 SiteId 隔离、审核可见性与作者权限；参见[真实案例](../cases.md)。
