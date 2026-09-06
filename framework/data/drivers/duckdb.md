---
description: DuckDB 数据驱动的部署、连接配置与专项验证。
icon: database
---

# DuckDB

通过 DuckDB.NET 在应用进程内执行分析查询和导入，适合围绕本地数据组织分析任务。应用通过[数据访问接口](../data-access.md)或[数据服务](../services.md)使用它，公共的映射、条件和数据模式仍沿用数据引擎的组织方式。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `Zongsoft.Data/drivers/duckdb` |
| NuGet 包 | `Zongsoft.Data.DuckDB` |
| 连接及脚本驱动键 | `DuckDB` |

## 部署与连接

把下面的片段追加到已有宿主的部署清单。如果已经部署 Data，不必再次声明相同包；驱动的清单、程序集及运行依赖应一起交付，参见[部署工具](../../../tools/deployer.md)。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft data duckdb]
nuget:Zongsoft.Data.DuckDB
```
{% endcode %}

## 可追溯的接入范例

Discussions 当前没有此驱动的数据库脚本，接入范例采用框架本驱动的测试项目。测试模型、映射和初始化脚本应作为一组使用，不能直接把其它方言的 Discussions 建表脚本视为兼容。

来源：[framework/Zongsoft.Data/drivers/duckdb/test/DatabaseFixture.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/duckdb/test/DatabaseFixture.cs#L13)（节选；上下文见源文件）。

{% code title="DatabaseFixture.cs" %}
```csharp
private static readonly string DATABASE_FILE = Path.Combine(AppContext.BaseDirectory, "test.db");
private static readonly string CONNECTION_STRING = $"DataSource={DATABASE_FILE}";
```
{% endcode %}

来源：[framework/Zongsoft.Data/drivers/duckdb/test/DatabaseFixture.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/duckdb/test/DatabaseFixture.cs#L34)（节选；上下文见源文件）。

{% code title="DatabaseFixture.cs" %}
```csharp
this.ConnectionSettings = Configuration.DuckDBConnectionSettingsDriver.Instance.GetSettings(CONNECTION_STRING);
this.Accessor = DataAccessProvider.Instance.GetAccessor("Test", new DataAccessOptions([this.ConnectionSettings]));
```
{% endcode %}

这里的 Test 是测试访问器名称，CONNECTION_STRING 和 DATABASE_FILE 来自同一夹具。该夹具会删除测试文件并执行初始化脚本，只能在测试输出目录中运行。SQLite 的 WAL 参数和 DuckDB 的文件路径都是现有测试的一部分，不意味着 Discussions 已经适配这两种数据库。

插件宿主的连接项仍放在 /Data/ConnectionSettings，驱动键使用本页索引中的规范名称。业务取得的访问器名称必须与部署配置对应；Discussions 按模块名取得访问器，测试夹具则在代码中显式传入连接设置。两条入口的区别见[连接与数据源](../connections.md)。命名 SQL 仍由其 script 的 driver 决定，切换连接不会翻译手写 SQL。

## 此驱动需要注意什么

{% hint style="info" %}
💡 常规导入先写入连接内临时表，再通过 INSERT ... SELECT 写入目标表，以支持字段子集及目标列默认值。自定义类型可能转为参数化逐行插入，不能假定所有导入具有相同性能。
{% endhint %}

## 接入后如何验证

先检查原生运行库和文件路径，再验证实际字段子集、默认值、忽略冲突与失败批次回滚。文件库的并发及访问方式需要按应用进程模型设计，不能把它直接当作独立事务数据库服务器。

验证应覆盖一条查询、一组实际写入数据及失败恢复，再扩展到生产负载。可对照[驱动选择与验收](../drivers.md)、[连接配置](../connections.md)和[事务与一致性](../transactions.md)检查共同约束。

## 项目资源

[源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/duckdb) · [插件清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/duckdb/src/Zongsoft.Data.DuckDB.plugin) · [中文项目说明](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/duckdb/README.zh-Hans.md)
