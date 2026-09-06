---
description: 理解插件树中的构件、构建器、解析器和服务发现。
icon: cubes
---

# 构件与服务

构件是插件树中的声明式对象。它们让插件可以把命令、驱动、服务、事件处理器、工作器或任意对象挂载到约定路径，而不必在宿主中写硬编码注册逻辑。

## 构件

在插件文件中，`object`、`lazy`、`expose` 等元素会被解析为构件。构件有名称、构建器、类型或取值表达式，并最终挂载到插件树节点。

{% code title="Zongsoft.Data.MySql.plugin" %}
```xml
<extension path="/Workbench/Data/Drivers">
	<object name="MySql" value="{static:Zongsoft.Data.MySql.MySqlDriver.Instance, Zongsoft.Data.MySql}" />
</extension>
```
{% endcode %}

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

对象可以通过以下机制被应用使用，其中只有程序集注册与特定服务节点注册会进入 DI；路径引用和服务表达式用于取得对象：

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

## 按成员类型装配依赖

假设业务命令拥有公共可写属性 `IExpressionEvaluator Evaluator`，并已部署 Scriban，可以在构件属性中声明：

{% code title="Acme.Rules.plugin（属性注入片段）" %}
```xml
<extension path="/Workbench/Executor/Commands">
	<object name="Evaluate" type="Acme.Rules.EvaluateCommand, Acme.Rules"
		Evaluator="{service:Scriban@}" />
</extension>
```
{% endcode %}

这里末尾的 `@` 指定应用容器；成员类型为解析器提供契约信息。代码中必须存在该属性，清单不能为类型凭空添加成员。前面的[入门命令](../../get-started/first-business-plugin.md)采用代码查找，这里展示的是另一种装配方式。

| 表达式 | 用途 |
| --- | --- |
| `{service:@}` | 获取应用服务容器 |
| `{service:@Rules}` | 获取 Rules 模块容器 |
| `{service:~@}` | 从应用容器按目标成员类型取得单个服务 |
| `{service:*@}` | 从应用容器按目标成员类型取得集合 |
| `{service:Scriban@}` | 从应用容器选择指定名称的求值器 |
| `{path:/Workbench/Modules}` | 取得插件树指定节点对象 |

未指定容器时，解析器结合当前节点和模块上下文选择服务域。表达式中的模块限定名与 Core 的具名提供者限定名不同，见[服务定位](../core/services/locating.md)。

## 扩展点设计

扩展点拥有者应说明接受的对象契约、集合的键与重复规则、构建时机和生命周期。贡献者提供满足这些条件的对象，不应依赖其它插件尚未公开的内部节点。

例如数据驱动同时贡献连接设置驱动与数据执行驱动：前者负责解析参数，后者负责生成和执行数据库操作。仅挂载其中一个，可能让配置存在但数据操作失败，参见[驱动](../data/drivers.md)。

{% hint style="info" %}
💡 排查装配时先检查最终插件树的路径和值类型，再检查成员表达式和服务解析。节点存在不一定表示对象已成功构建。
{% endhint %}

源码定位：[对象构建器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Builders/ObjectBuilder.cs)、[服务解析器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Services/ServicesParser.cs)、[基础构建器和解析器注册](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/plugins/Main.plugin)。
