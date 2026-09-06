---
description: ClickHouse 数据驱动的部署、连接配置与专项验证。
icon: database
---

# ClickHouse

通过 ClickHouse.Client 访问 ClickHouse，连接列式分析数据库并适配数据引擎的表达式与导入操作。应用通过[数据访问接口](../data-access.md)或[数据服务](../services.md)使用它，公共的映射、条件和数据模式仍沿用数据引擎的组织方式。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `Zongsoft.Data/drivers/clickhouse` |
| NuGet 包 | `Zongsoft.Data.ClickHouse` |
| 连接及脚本驱动键 | `ClickHouse` |

## 部署与连接

把下面的片段追加到已有宿主的部署清单。如果已经部署 Data，不必再次声明相同包；驱动的清单、程序集及运行依赖应一起交付，参见[部署工具](../../../tools/deployer.md)。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft data clickhouse]
nuget:Zongsoft.Data.ClickHouse
```
{% endcode %}

## 可追溯的接入范例

Discussions 提供了对应的 [数据库脚本](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/database/Zongsoft.Discussions-clickhouse.sql)。沿用真实的 Feedback、Forum、Thread、Post 等模型和 [Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping)，查询与写入见[数据服务](../services.md)。脚本存在并不表示所有表和所有驱动组合都已完成端到端验证；尤其要核对模型成员、列长度、默认值、关系与当前业务使用的表。

来源：[framework/Zongsoft.Data/drivers/clickhouse/test/DatabaseFixture.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/clickhouse/test/DatabaseFixture.cs#L23)（节选；上下文见源文件）。

{% code title="DatabaseFixture.cs" %}
```csharp
this.ConnectionSettings = Configuration.ClickHouseConnectionSettingsDriver.Instance.GetSettings(CONNECTION_STRING);
this.Accessor = DataAccessProvider.Instance.GetAccessor("Test", new DataAccessOptions([this.ConnectionSettings]));
```
{% endcode %}

CONNECTION_STRING 来自测试环境；此处只摘录设置解析与访问器创建，不复制测试服务器地址和凭据。运行测试前检查同目录夹具、映射和初始化条件。下列离线测试说明扩展设置保留在 Properties 中，保留文本不等于底层驱动一定使用这些设置。

来源：[framework/Zongsoft.Data/drivers/clickhouse/test/ConnectionSettingsPropertiesTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/clickhouse/test/ConnectionSettingsPropertiesTest.cs#L8)（节选；上下文见源文件）。

{% code title="ConnectionSettingsPropertiesTest.cs" %}
```csharp
public void UnknownPropertiesArePreserved()
{
	var settings = Configuration.ClickHouseConnectionSettingsDriver.Instance.GetSettings(
		"CircuitBreaker.Duration=00:01:00;CircuitBreaker.MaximumDuration=00:02:00");

	Assert.Equal("00:01:00", settings.Properties["CircuitBreaker.Duration"]);
	Assert.Equal("00:02:00", settings.Properties["CircuitBreaker.MaximumDuration"]);
}
```
{% endcode %}

插件宿主的连接项仍放在 /Data/ConnectionSettings，驱动键使用本页索引中的规范名称。业务取得的访问器名称必须与部署配置对应；Discussions 按模块名取得访问器，测试夹具则在代码中显式传入连接设置。两条入口的区别见[连接与数据源](../connections.md)。命名 SQL 仍由其 script 的 driver 决定，切换连接不会翻译手写 SQL。

## 此驱动需要注意什么

{% hint style="info" %}
💡 示例使用 HTTP 连接端口，应与服务端启用的协议对应。分析型存储的更新、删除及事务预期需要单独确认，不能把传统事务数据服务的全部假设直接迁移过来。
{% endhint %}

## 接入后如何验证

用真实查询形状验证聚合、分页、时间和数值类型，再验证批量写入及后续可见性。需要频繁逐条更新的模型，应先核对目标表引擎、驱动实现和服务器行为。

验证应覆盖一条查询、一组实际写入数据及失败恢复，再扩展到生产负载。可对照[驱动选择与验收](../drivers.md)、[连接配置](../connections.md)和[事务与一致性](../transactions.md)检查共同约束。

## 项目资源

[源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/clickhouse) · [插件清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/clickhouse/src/Zongsoft.Data.ClickHouse.plugin) · [中文项目说明](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/clickhouse/README.zh-Hans.md)
