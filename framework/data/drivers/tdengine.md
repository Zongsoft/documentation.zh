---
description: TDengine 数据驱动的部署、连接配置与专项验证。
icon: database
---

# TDengine

通过 TDengine.Connector 接入时序数据库。超级表、标签和时间精度属于建模约束，应与设备数据和采样方式一起设计。应用通过[数据访问接口](../data-access.md)或[数据服务](../services.md)使用它，公共的映射、条件和数据模式仍沿用数据引擎的组织方式。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `Zongsoft.Data/drivers/tdengine` |
| NuGet 包 | `Zongsoft.Data.TDengine` |
| 连接及脚本驱动键 | `TDengine` |

## 部署与连接

把下面的片段追加到已有宿主的部署清单。如果已经部署 Data，不必再次声明相同包；驱动的清单、程序集及运行依赖应一起交付，参见[部署工具](../../../tools/deployer.md)。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft data tdengine]
nuget:Zongsoft.Data.TDengine
```
{% endcode %}

## 可追溯的接入范例

Discussions 当前没有此驱动的数据库脚本，接入范例采用框架本驱动的测试项目。测试模型、映射和初始化脚本应作为一组使用，不能直接把其它方言的 Discussions 建表脚本视为兼容。

来源：[framework/Zongsoft.Data/drivers/tdengine/test/DatabaseFixture.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/tdengine/test/DatabaseFixture.cs#L23)（节选；上下文见源文件）。

{% code title="DatabaseFixture.cs" %}
```csharp
this.ConnectionSettings = Configuration.TDengineConnectionSettingsDriver.Instance.GetSettings(CONNECTION_STRING);
this.ConnectionSettings.Protocol = Configuration.TDengineConnectionProtocol.Native;
this.Accessor = DataAccessProvider.Instance.GetAccessor("Zongsoft.Data.TDengine.Tests", new DataAccessOptions([this.ConnectionSettings]));
```
{% endcode %}

CONNECTION_STRING 来自测试环境；此处只摘录设置解析与访问器创建，不复制测试服务器地址和凭据。运行测试前检查同目录夹具、映射和初始化条件。下列离线测试说明扩展设置保留在 Properties 中，保留文本不等于底层驱动一定使用这些设置。

来源：[framework/Zongsoft.Data/drivers/tdengine/test/ConnectionSettingsPropertiesTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/tdengine/test/ConnectionSettingsPropertiesTest.cs#L8)（节选；上下文见源文件）。

{% code title="ConnectionSettingsPropertiesTest.cs" %}
```csharp
public void UnknownPropertiesArePreserved()
{
	var settings = Configuration.TDengineConnectionSettingsDriver.Instance.GetSettings(
		"CircuitBreaker.Duration=00:01:00;CircuitBreaker.MaximumDuration=00:02:00");

	Assert.Equal("00:01:00", settings.Properties["CircuitBreaker.Duration"]);
	Assert.Equal("00:02:00", settings.Properties["CircuitBreaker.MaximumDuration"]);
}
```
{% endcode %}

插件宿主的连接项仍放在 /Data/ConnectionSettings，驱动键使用本页索引中的规范名称。业务取得的访问器名称必须与部署配置对应；Discussions 按模块名取得访问器，测试夹具则在代码中显式传入连接设置。两条入口的区别见[连接与数据源](../connections.md)。命名 SQL 仍由其 script 的 driver 决定，切换连接不会翻译手写 SQL。

## 此驱动需要注意什么

{% hint style="info" %}
💡 本例选择 Native 协议。改用 WebSocket 时，应同时核对连接器支持的设置、服务端适配服务与端口，不能只替换地址。原生客户端及服务器版本也需要匹配。
{% endhint %}

## 接入后如何验证

先验证端点和客户端依赖，再对照数据库结构检查时间列、超级表、子表和标签。使用同一采样时刻的重复写入、不同时间精度和缺失数据验证业务预期。

验证应覆盖一条查询、一组实际写入数据及失败恢复，再扩展到生产负载。可对照[驱动选择与验收](../drivers.md)、[连接配置](../connections.md)和[事务与一致性](../transactions.md)检查共同约束。

## 项目资源

[源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data/drivers/tdengine) · [插件清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/tdengine/src/Zongsoft.Data.TDengine.plugin) · [中文项目说明](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/drivers/tdengine/README.zh-Hans.md)
