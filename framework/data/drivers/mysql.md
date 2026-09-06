---
description: MySQL 数据驱动的部署、连接配置与专项验证。
icon: database
---

# MySQL

通过 MySqlConnector 连接 MySQL，将模型查询和写入转换为 MySQL 方言。应用通过[数据访问接口](../data-access.md)或[数据服务](../services.md)使用它，公共的映射、条件和数据模式仍沿用数据引擎的组织方式。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `Zongsoft.Data/drivers/mysql` |
| NuGet 包 | `Zongsoft.Data.MySql` |
| 连接及脚本驱动键 | `MySql` |

## 部署与连接

把下面的片段追加到已有宿主的部署清单。如果已经部署 Data，不必再次声明相同包；驱动的清单、程序集及运行依赖应一起交付，参见[部署工具](../../../tools/deployer.md)。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft data mysql]
nuget:Zongsoft.Data.MySql
```
{% endcode %}

## 可追溯的接入范例

Discussions 提供了对应的 [数据库脚本](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/database/Zongsoft.Discussions-mysql.sql)。沿用真实的 Feedback、Forum、Thread、Post 等模型和 [Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping)，查询与写入见[数据服务](../services.md)。脚本存在并不表示所有表和所有驱动组合都已完成端到端验证；尤其要核对模型成员、列长度、默认值、关系与当前业务使用的表。

来源：[framework/Zongsoft.Data/drivers/mysql/test/ConnectionSettingsTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/mysql/test/ConnectionSettingsTest.cs#L10)（节选；上下文见源文件）。

{% code title="ConnectionSettingsTest.cs" %}
```csharp
public void MaximumPoolSizeMatchesProviderDefault()
{
	var settings = Configuration.MySqlConnectionSettingsDriver.Instance.GetSettings("Server=localhost");
	var builder = new MySqlConnectionStringBuilder();

	Assert.Equal(builder.MaximumPoolSize, settings.MaximumPoolSize);
}
```
{% endcode %}

这个离线测试只验证连接设置与提供程序的默认连接池上限一致；Server=localhost 不会在这里建立数据库连接。完整连接还需数据库名、身份凭据及运行环境相关设置。

插件宿主的连接项仍放在 /Data/ConnectionSettings，驱动键使用本页索引中的规范名称。业务取得的访问器名称必须与部署配置对应；Discussions 按模块名取得访问器，测试夹具则在代码中显式传入连接设置。两条入口的区别见[连接与数据源](../connections.md)。命名 SQL 仍由其 script 的 driver 决定，切换连接不会翻译手写 SQL。

## 此驱动需要注意什么

{% hint style="info" %}
💡 字符集、排序规则与 SQL 模式都可能影响结果。中文和表情的保存、字符串比较、空值及默认值应在目标数据库上验证。
{% endhint %}

## 接入后如何验证

核对账户是否能访问目标库、连接字符集是否与表和列一致，再检查映射中的表名大小写、生成标识和批量导入结果。读写分离需要另外配置数据库复制；驱动不会创建复制拓扑。

验证应覆盖一条查询、一组实际写入数据及失败恢复，再扩展到生产负载。可对照[驱动选择与验收](../drivers.md)、[连接配置](../connections.md)和[事务与一致性](../transactions.md)检查共同约束。

## 项目资源

[源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/mysql) · [插件清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/mysql/src/Zongsoft.Data.MySql.plugin) · [中文项目说明](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/mysql/README.zh-Hans.md)
