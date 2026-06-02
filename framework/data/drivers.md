---
description: 选择、部署和扩展 Zongsoft.Data 数据库驱动。
icon: hard-drive
---

# 驱动

驱动负责把统一的数据表达式转换为具体数据库语法，并执行命令。一个完整驱动通常包含两个部分：连接设置驱动和数据驱动。

## 已有驱动

框架仓库中包含多个驱动项目：

- `Zongsoft.Data.MySql`
- `Zongsoft.Data.MsSql`
- `Zongsoft.Data.PostgreSql`
- `Zongsoft.Data.SQLite`
- `Zongsoft.Data.DuckDB`
- `Zongsoft.Data.TDengine`
- `Zongsoft.Data.ClickHouse`
- `Zongsoft.Data.Influx`

具体可用状态以对应项目和 NuGet 包为准。

## 插件注册

驱动以插件方式部署。以 MySQL 为例，插件会依赖 `Zongsoft.Data`，并向两个扩展点注册对象：

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

连接配置中的 `driver="MySql"` 必须与这里的对象名称一致。

## 部署检查

使用某个数据库前，检查三件事：

- 插件目录中有对应驱动的 `.plugin` 和 `.dll`。
- 驱动插件声明了对 `Zongsoft.Data` 的依赖。
- 连接配置的 `driver` 名称与插件注册名称一致。

如果访问器无法创建，优先检查连接配置路径、默认连接名和驱动插件是否加载。

## 驱动职责

驱动通常需要实现：

- 连接字符串解析。
- 数据源创建。
- SQL 或类 SQL 表达式生成。
- 查询、插入、更新、删除、增改和聚合执行。
- 数据导入。
- 数据库方言中的函数、分页、返回值和参数处理。

业务代码不应直接依赖具体驱动类型。通过连接配置和数据访问接口选择驱动，才能保持模块可替换。
