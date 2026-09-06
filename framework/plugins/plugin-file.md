---
description: 以 Discussions 清单解释程序集、依赖、扩展路径与构件。
icon: puzzle-piece
---

# 插件文件与加载


Discussions 通过 .plugin 清单声明模块如何接入宿主。清单负责装配，NuGet 或 .deploy 负责交付，二者不能互相替代。

## 先加载程序集和依赖

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L9)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<manifest>
	<assemblies>
		<assembly name="Zongsoft.Discussions" />
	</assemblies>

	<dependencies>
		<dependency name="Zongsoft.Data" />
		<dependency name="Zongsoft.Security" />
	</dependencies>
</manifest>
```
{% endcode %}

程序集包含模型、服务与模块入口；依赖项要求先装配数据引擎与安全模块。依赖名称是插件名称，不等同于自动下载对应 NuGet 包；宿主部署必须使它们实际存在。

## 暴露共享模块实例

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

static 表达式引用 Module.Current。expose 把已有对象的成员接入插件树；这里的相对 path 从构件上下文解析，便于后续继续挂载过滤器、事件和属性。

## 向访问器挂载查询过滤器

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L35)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<extension path="/Workbench/Modules/Discussions/Accessor/Filters">
	<object name="PostFilter" type="Zongsoft.Discussions.Data.PostFilter, Zongsoft.Discussions" />
	<object name="ThreadFilter" type="Zongsoft.Discussions.Data.ThreadFilter, Zongsoft.Discussions" />
</extension>
```
{% endcode %}

过滤器运行时还受模型匹配特性控制；挂载成功不意味着任何查询都会执行同一过滤器。PostFilter 处理帖子，ThreadFilter 处理主题及其正文，见[数据服务](../data/services.md)。

## 验证器与安全扩展

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L31)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<extension path="/Workbench/Data/Validators">
	<object name="Discussions" type="Zongsoft.Discussions.Data.DataValidator, Zongsoft.Discussions" />
</extension>
```
{% endcode %}

验证器以 Discussions 命名，与模块访问器和映射容器的业务范围对应。身份质询器、转换器使用另外两个扩展路径，见[认证](../security/authentication.md)。

## 排查加载失败

按文件是否部署、XML 是否有效、依赖是否存在、程序集是否可加载、类型和表达式是否可解析、目标扩展点是否存在的顺序检查。特别要区分插件清单文件名、插件 name 和模块名：它们在 Discussions 中相关联，但分别参与配置匹配、依赖排序和模块服务范围。
