---
description: 了解插件文件、附属文件和插件加载目录。
icon: file-code
---

# 插件文件与加载

插件文件是插件式应用的入口元数据。宿主程序启动后，插件框架会扫描 `plugins/` 目录，读取 `*.plugin` 文件，解析清单、依赖和扩展点，然后把构件挂载到插件树。

## 目录结构

```text
plugins/
	Zongsoft.Data/
		Zongsoft.Data.plugin
		Zongsoft.Data.dll
		Zongsoft.Data.option
		Zongsoft.Data.mapping
	Zongsoft.Data.MySql/
		Zongsoft.Data.MySql.plugin
		Zongsoft.Data.MySql.dll
```

默认插件根目录来自 `PluginOptions.PluginsPath`，通常是应用目录下的 `plugins` 文件夹。

## 最小插件文件

{% code title="Zongsoft.Data.plugin" %}
```xml
<?xml version="1.0" encoding="utf-8" ?>

<plugin name="Zongsoft.Data"
        title="Zongsoft.Data Plugin">
	<manifest>
		<assemblies>
			<assembly name="Zongsoft.Data" />
		</assemblies>
	</manifest>
</plugin>
```
{% endcode %}

`manifest` 中的 `assemblies` 用于声明插件程序集。宿主启动时会注册这些程序集中的服务类型，并把它们作为插件类型解析的来源。

## 依赖

从插件通过 `dependencies` 声明依赖。数据驱动插件就是典型例子：驱动插件必须依赖 `Zongsoft.Data`，因为它要把驱动对象挂载到数据引擎提供的扩展点。

{% code title="Zongsoft.Data.MySql.plugin" %}
```xml
<manifest>
	<assemblies>
		<assembly name="Zongsoft.Data.MySql" />
	</assemblies>
	<dependencies>
		<dependency name="Zongsoft.Data" />
	</dependencies>
</manifest>
```
{% endcode %}

加载器会先处理主插件，再按依赖关系加载从插件。如果从插件依赖缺失或出现循环依赖，该从插件会加载失败并从插件集合中移除。

## 扩展点

`extension` 用于把对象挂载到插件树指定路径。下面的例子来自 MySQL 驱动插件的模式：连接设置驱动挂载到配置节点，数据驱动挂载到数据节点。

{% code title="Zongsoft.Data.MySql.plugin" %}
```xml
<extension path="/Workbench/Configuration/ConnectionSettings/Drivers">
	<object name="MySql" value="{static:Zongsoft.Data.MySql.Configuration.MySqlConnectionSettingsDriver.Instance, Zongsoft.Data.MySql}" />
</extension>

<extension path="/Workbench/Data/Drivers">
	<object name="MySql" value="{static:Zongsoft.Data.MySql.MySqlDriver.Instance, Zongsoft.Data.MySql}" />
</extension>
```
{% endcode %}

`object` 是最常见的构件声明。它可以通过 `type` 创建对象，也可以通过 `value` 引用已有对象、静态成员、配置值、服务或插件树路径。

## 附属文件

插件目录中常见附属文件包括：

- `*.option`：选项配置。
- `*.mapping`：数据映射。
- `*.pdb`：调试符号。
- `zh-Hans`、`zh-CN`：本地化资源。
- 证书、模板或静态资源。

这些文件通常与插件程序集同目录部署，随插件一起被宿主读取。

## 加载策略

插件加载器按目录和依赖关系确定插件关系：

- 包含 `*.plugin` 文件的目录是插件目录。
- 父子插件关系来自目录层级，上级插件目录中的主插件会成为下级插件目录中插件的父插件。
- 没有依赖项的插件是主插件；声明依赖项的插件是从插件。
- 目录中名为 `.plugin` 的文件是隐藏式插件，不能成为主插件，也不能声明依赖项。

这种策略让基础能力可以先加载，业务插件再在稳定的扩展点上追加功能。

<details>

<summary>主插件、从插件和隐藏插件的区别</summary>

主插件是不声明依赖项的插件，通常先加载并提供基础扩展点。从插件通过 `dependencies` 声明依赖，通常在主插件之后加载，并向已有扩展点追加能力。名为 `.plugin` 的隐藏式插件不能成为主插件，也不能声明依赖项，适合放置目录级的轻量扩展声明。

</details>

## 部署来源

插件可以来自本地构建输出，也可以来自 NuGet 包。Zongsoft 的 NuGet 包通常会在包内包含 `.deploy` 文件，用来描述插件内容如何部署到宿主目录。

更多部署规则见 [部署工具 dotnet-deploy](../../tools/deployer.md)。

{% content-ref url="../../tools/deployer.md" %}
[deployer.md](../../tools/deployer.md)
{% endcontent-ref %}

## 相关资源

* [Zongsoft.Plugins 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins)
* [Zongsoft.Plugins README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/README.md)
* [Zongsoft.Plugins NuGet 包](https://www.nuget.org/packages/Zongsoft.Plugins)
