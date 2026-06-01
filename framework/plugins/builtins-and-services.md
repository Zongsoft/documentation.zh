---
description: 理解插件树中的构件、构建器、解析器和服务发现。
icon: cubes
---

# 构件与服务

构件是插件树中的声明式对象。它们让插件可以把命令、驱动、服务、事件处理器、工作器或任意对象挂载到约定路径，而不必在宿主中写硬编码注册逻辑。

## 构件

在插件文件中，`object`、`lazy`、`expose` 等元素会被解析为构件。构件有名称、构建器、类型或取值表达式，并最终挂载到插件树节点。

```xml
<extension path="/Workbench/Data/Drivers">
	<object name="MySql" value="{static:Zongsoft.Data.MySql.MySqlDriver.Instance, Zongsoft.Data.MySql}" />
</extension>
```

这个声明会把 MySQL 数据驱动挂载到 `/Workbench/Data/Drivers/MySql`。后续数据访问执行时，就可以通过驱动集合找到对应数据库方言和执行器。

## 构建器

构建器负责把构件声明转换为运行时对象。基础插件中默认注册了常用构建器：

- `object`：创建或解析普通对象，是最常用的构建器。
- `lazy`：延迟构建，适合成本较高或可能不被使用的对象。
- `expose`：暴露已有对象的成员，通常用于把集合、属性或子对象挂到插件树。

构建器按名称查找。查找顺序会考虑当前插件、依赖插件、从属插件和父插件，因此基础插件提供的构建器可以被业务插件复用。

## 解析器

解析器负责处理 `{scheme:...}` 形式的值表达式。基础插件内置了常用解析器：

- `{path:/...}`：从插件树路径获取节点值或成员。
- `{type:...}`：解析类型。
- `{static:...}`：读取静态字段或属性。
- `{option:...}`：读取配置项。
- `{service:...}`：从服务容器解析服务。
- `{command:...}`：解析命令。
- `{resource:...}`：解析资源。
- `{predicate:...}`：解析谓词条件。

解析器让插件声明能引用运行时对象，而不是把所有对象都写成构造器参数。

## 服务发现

服务可以通过三种方式进入应用：

- 程序集服务扫描：插件清单中的程序集会参与服务注册。
- 插件树挂载：把对象挂载到固定路径，其他插件通过 `{path:...}` 获取。
- 服务解析表达式：使用 `{service:...}` 从应用或模块服务容器解析对象。

当构件需要 `IApplicationContext`、`IApplicationModule`、`PluginTree`、`Plugin` 或 `PluginTreeNode` 等上下文对象时，构建过程会尝试自动注入这些参数。

## 路径约定

框架内置了一些稳定路径：

- `/Workspace/Environment/ApplicationContext`：当前应用上下文。
- `/Workbench`：运行时工作台根节点。
- `/Workbench/Services`：应用服务容器。
- `/Workbench/Events`：全局事件管理器。
- `/Workbench/Startup`：启动工作器集合。
- `/Workbench/Data/Drivers`：数据驱动集合。
- `/Workbench/Configuration/ConnectionSettings/Drivers`：连接设置驱动集合。

业务插件应优先复用已有路径约定。只有当能力确实属于新领域时，再建立新的一级或二级扩展点。
