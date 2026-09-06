---
description: PostgreSQL 数据驱动的部署、连接配置与专项验证。
icon: database
---

# PostgreSQL

通过 Npgsql 连接 PostgreSQL，提供标识符、参数、RETURNING 和查询表达式的方言适配。应用通过[数据访问接口](../data-access.md)或[数据服务](../services.md)使用它，公共的映射、条件和数据模式仍沿用数据引擎的组织方式。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `Zongsoft.Data/drivers/postgres` |
| NuGet 包 | `Zongsoft.Data.PostgreSql` |
| 连接及脚本驱动键 | `PostgreSQL` |

## 部署与连接

把下面的片段追加到已有宿主的部署清单。如果已经部署 Data，不必再次声明相同包；驱动的清单、程序集及运行依赖应一起交付，参见[部署工具](../../../tools/deployer.md)。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft data postgres]
nuget:Zongsoft.Data.PostgreSql
```
{% endcode %}

## 可追溯的接入范例

Discussions 提供了对应的 [数据库脚本](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/database/Zongsoft.Discussions-postgres.sql)。沿用真实的 Feedback、Forum、Thread、Post 等模型和 [Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping)，查询与写入见[数据服务](../services.md)。脚本存在并不表示所有表和所有驱动组合都已完成端到端验证；尤其要核对模型成员、列长度、默认值、关系与当前业务使用的表。

来源：[framework/Zongsoft.Data/drivers/postgres/test/ConnectionSettingsTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/postgres/test/ConnectionSettingsTest.cs#L10)（节选；上下文见源文件）。

{% code title="ConnectionSettingsTest.cs" %}
```csharp
public void MaximumPoolSizeMatchesProviderDefault()
{
	var settings = Configuration.PostgreSqlConnectionSettingsDriver.Instance.GetSettings("Server=localhost");
	var builder = new NpgsqlConnectionStringBuilder();

	Assert.Equal((uint)builder.MaxPoolSize, settings.MaximumPoolSize);
}
```
{% endcode %}

这个离线测试只验证连接设置与提供程序的默认连接池上限一致；Server=localhost 不会在这里建立数据库连接。完整连接还需数据库名、身份凭据及运行环境相关设置。

插件宿主的连接项仍放在 /Data/ConnectionSettings，驱动键使用本页索引中的规范名称。业务取得的访问器名称必须与部署配置对应；Discussions 按模块名取得访问器，测试夹具则在代码中显式传入连接设置。两条入口的区别见[连接与数据源](../connections.md)。命名 SQL 仍由其 script 的 driver 决定，切换连接不会翻译手写 SQL。

## 此驱动需要注意什么

{% hint style="info" %}
💡 源码目录名为 postgres，包名为 Zongsoft.Data.PostgreSql，插件注册的驱动键为 PostgreSQL。配置和映射脚本应使用驱动键，不要从目录名推导它。
{% endhint %}

## 接入后如何验证

核对数据库架构和搜索路径，以及映射标识符的大小写。数组、自定义类型、扩展和时间值需要使用实际模型验证；部署此驱动不会自动安装服务器扩展或迁移数据库结构。

验证应覆盖一条查询、一组实际写入数据及失败恢复，再扩展到生产负载。可对照[驱动选择与验收](../drivers.md)、[连接配置](../connections.md)和[事务与一致性](../transactions.md)检查共同约束。

## 项目资源

[源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/postgres) · [插件清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/postgres/src/Zongsoft.Data.PostgreSql.plugin) · [中文项目说明](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/postgres/README.zh-Hans.md)
