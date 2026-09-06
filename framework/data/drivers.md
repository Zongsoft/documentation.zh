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

## 选择驱动前先确认什么

驱动统一的是应用调用和映射流程；数据库的查询语义、并发模型和事务能力仍有区别。先明确业务是事务处理、时序采集还是本地分析，再检查目标驱动与数据库的实际支持范围。不要只因为两个系统都接受 SQL，就认定它们可以直接互换。

建议用一个能代表业务的最小模型验证以下项目：

| 检查项 | 为什么会影响业务 |
| --- | --- |
| 字符串、标识符大小写与空值比较 | 相同条件在不同数据库上可能匹配不同记录 |
| 金额精度、时间精度与时区 | 可能影响结算、排序与时间范围筛选 |
| 自增值、返回值及增改操作 | 影响写入后模型是否取得正确标识与最终值 |
| 导航查询和分页 | 要检查实际 SQL、结果数量及执行成本 |
| 事务、并发更新与失败回滚 | 统一事务入口不能创造数据库不支持的事务 |
| 批量导入、默认值和约束 | 跳过字段、忽略冲突与失败批次的行为必须明确 |

开始时可使用[首次查询](quickstart.md)验证宿主链路；接着在独立测试库中验证这些业务语义。连接能打开、常量查询成功，只说明基础连通性。

## 两个需要特别理解的实现

### DuckDB 的导入路径

当前 [DuckDB 导入器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/duckdb/src/DuckDBImporter.cs)为常规类型先建立连接内临时表，按选定字段批量追加数据，再执行一次 `INSERT ... SELECT` 写入目标表。这样既使用批量追加能力，也允许导入字段只是物理表字段的子集，并保留未指定目标列的默认值。

数据库自定义类型被映射为 `System.Data.DbType.Object` 时，导入器改用参数化逐行插入。因此同一批数据的字段类型也可能改变执行路径，不能仅根据“批量导入”名称估算吞吐量。

导入默认加入当前数据事务；未取得外部事务时，独立连接使用内部事务保护当前批次。启用忽略约束选项可能跳过冲突行，导入调用成功不代表每条输入都成为新记录。事务背景见[事务与一致性](transactions.md)。

### InfluxDB 的版本与事务边界

当前 [Influx 驱动](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/influx/src/InfluxDriver.cs)使用 InfluxDB3.Client，面向 InfluxDB 3，并声明 `TransactionSuppressed` 特性。不要把它理解为关系数据库的本地事务参与者，也不要把旧版 InfluxDB 的配置和查询语言直接套入当前驱动。

{% hint style="warning" %}
🚨 依赖“多次写入全部成功或全部撤销”的业务，在选择驱动前必须确认该能力。统一接口有助于复用代码，但不会自动补齐目标数据库缺少的事务、约束或数据模型语义。
{% endhint %}

## 相关资源

| 驱动 | 源码 | README | NuGet |
| --- | --- | --- | --- |
| SQL Server | [mssql](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/mssql) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/mssql/README.md) | [Zongsoft.Data.MsSql](https://www.nuget.org/packages/Zongsoft.Data.MsSql) |
| MySQL | [mysql](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/mysql) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/mysql/README.md) | [Zongsoft.Data.MySql](https://www.nuget.org/packages/Zongsoft.Data.MySql) |
| PostgreSQL | [postgres](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/postgres) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/postgres/README.md) | [Zongsoft.Data.PostgreSql](https://www.nuget.org/packages/Zongsoft.Data.PostgreSql) |
| SQLite | [sqlite](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/sqlite) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/sqlite/README.md) | [Zongsoft.Data.SQLite](https://www.nuget.org/packages/Zongsoft.Data.SQLite) |
| DuckDB | [duckdb](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/duckdb) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/duckdb/README.md) | [Zongsoft.Data.DuckDB](https://www.nuget.org/packages/Zongsoft.Data.DuckDB) |
| ClickHouse | [clickhouse](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/clickhouse) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/clickhouse/README.md) | [Zongsoft.Data.ClickHouse](https://www.nuget.org/packages/Zongsoft.Data.ClickHouse) |
| TDengine | [tdengine](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/tdengine) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/tdengine/README.md) | [Zongsoft.Data.TDengine](https://www.nuget.org/packages/Zongsoft.Data.TDengine) |
| InfluxDB | [influx](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/influx) | [README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/influx/README.md) | [Zongsoft.Data.Influx](https://www.nuget.org/packages/Zongsoft.Data.Influx) |
