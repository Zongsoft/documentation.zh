---
description: 从 Discussions 选项读取出发，理解配置源、对象绑定、连接设置、Profile、Models 和 Options。
icon: sliders
---

# Zongsoft.Configuration

Zongsoft.Configuration 在标准 .NET 配置系统上增加插件选项、对象绑定、连接设置和 Profile 支持。配置先由不同来源形成键值树，再被绑定为业务需要的类型；读取配置和执行配置描述的动作是两个阶段。连接字符串被解析成功，不表示数据库已经连通；存储路径存在于选项中，也不表示对应文件系统插件已经部署。

标准配置入口是 [Microsoft.Extensions.Configuration.IConfiguration](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.configuration.iconfiguration) _[源码](https://source.dot.net/#Microsoft.Extensions.Configuration.Abstractions/IConfiguration.cs)_。Discussions.Configuration.IConfiguration 是论坛自己声明的选项模型，两者用途不同。

## 设计定位

| 部分 | 解决的问题 | 典型来源 |
| --- | --- | --- |
| 配置源 | 配置值从哪里来，如何覆盖与更新 | 宿主配置、环境参数、插件 option 文件 |
| 对象绑定 | 字符串和节点怎样变成属性、集合与模型 | ConfigurationBinder |
| 连接设置 | 名称、驱动和连接参数怎样组合 | 数据驱动及外部服务 |
| XML 选项 | XML 结构怎样映射为配置树 | *.option |
| Profile | 有层级的 INI 条目及导入 | *.deploy |
| Models | 模型记录怎样成为配置源 | 框架模型配置测试 |
| Options | 如何把选项绑定接入依赖注入与变更监视 | 安全服务和调度服务 |

同一应用可以叠加多种配置源。判断最终值时需要沿宿主加载顺序检查覆盖关系，而不是只看某一个文件。文件选择、环境与站点组合见[选项文件参考](../../references/option-files.md)。

## Discussions 的实际读取

来源：[src/Zongsoft.Discussions.option](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.option#L3)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.option" %}
```xml
<options>
	<option path="/Discussions">
		<general siteId="1" basePath="zfs.s3:/zongsoft-discussions/" />
	</option>
</options>
```
{% endcode %}

General 保存默认站点号和文件基路径。这里的 zfs.s3 是 Discussions 当前选项使用的文件系统方案，依赖相应存储扩展和环境配置；本地调试需要替换为自己可访问的存储位置。

Utility.GetFilePath 直接读取路径值：

来源：[src/Utility.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Utility.cs#L283)（节选；上下文见源文件）。

{% code title="Utility.cs" %}
```csharp
var basePath = ApplicationContext.Current.Configuration.GetOptionValue<string>("/Discussions/General.BasePath");

if(string.IsNullOrWhiteSpace(basePath))
	return string.Empty;
```
{% endcode %}

/Discussions 定位模块配置，General.BasePath 对应 general 元素上的 basePath 属性。取值为空时路径计算返回空字符串，不能继续把这个结果当成可写位置。后续按站点和用户分层的过程见[文件与内容存储](io.md)。

## 基础绑定

读取单个值适合少量独立设置；配置项较多且一起使用时，GetOption 或 Bind 可把一段配置绑定为模型。Zongsoft 绑定器支持属性别名、集合、未识别属性容器和动态模型，具体转换仍受目标类型约束。

来源：[src/Configuration/IConfiguration.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Configuration/IConfiguration.cs#L35)（节选；上下文见源文件）。

{% code title="IConfiguration.cs" %}
```csharp
public interface IConfiguration
{
	/// <summary>获取或设置默认的站点编号。</summary>
	uint SiteId { get; set; }

	/// <summary>获取或设置文件存储的基路径。</summary>
	string BasePath { get; set; }
}
```
{% endcode %}

这个接口给出 Discussions 已定义的选项形状。当前 Utility 的实际路径是单值读取，不应把接口的存在解释为所有消费方都已经通过依赖注入取得该模型。

框架测试中的 QueueOptions 展示未识别属性与集合命名：

来源：[framework/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest.cs#L186)（节选；上下文见源文件）。

{% code title="OptionConfigurationTest.cs" %}
```csharp
[Configuration(nameof(Properties))]
public class QueueOptions
{
	public string Name { get; set; }
	public SubscriptionOptions Subscription { get; set; }
	public IDictionary<string, string> Properties { get; set; }

	public class SubscriptionOptions
	{
		public Messaging.MessageReliability Reliability { get; set; }

		[ConfigurationProperty]
		public TopicOptionsCollection Topics { get; set; }
	}

	public class TopicOptions
	{
		public string Name { get; set; }

		[ConfigurationProperty("tag")]
		public IList<string> Tags { get; set; }

		public override string ToString() => this.Name;
	}

	public class TopicOptionsCollection() : KeyedCollection<string, TopicOptions>(StringComparer.OrdinalIgnoreCase)
	{
		protected override string GetKeyForItem(TopicOptions topic) => topic.Name;
	}
}

```
{% endcode %}

上面的 QueueOptions 属于 XML 配置测试。Configuration 指定 Properties 接收未识别项，ConfigurationProperty 为嵌套集合和 tag 属性提供绑定约定。复制某一属性声明时还需要对应的元素类型和集合键规则，不能只复制属性名。

ConfigurationBinderOptions 的 BindNonPublicProperties 控制非公共成员绑定，UnrecognizedError 控制未识别配置是否报错。给已有集合重复绑定可能追加元素；重载配置时应明确重建还是更新对象，避免无意累积。

## 连接设置

连接设置把连接名、驱动名和参数值分开。连接名用于应用查找，驱动名决定参数模型，Value 再由该模型解析为端口、超时、端点、集合等类型。

来源：[framework/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest-1.option](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest-1.option#L30)（节选；上下文见源文件）。

{% code title="OptionConfigurationTest-1.option" %}
```xml
<option path="/Data">
	<connectionSettings default="db1">
		<connectionSetting connectionSetting.name="db1" driver="mysql" mode="all" value="server=localhost" />
	</connectionSettings>
</option>
```
{% endcode %}

这是框架 XML 测试中的 db1 配置，仅使用 localhost 验证键值绑定。Discussions 按模块名请求访问器，实际部署还需要相应名称或默认连接；完整流程见[连接与数据源](../data/connections.md)，驱动差异见[按数据驱动阅读](../data/drivers.md)。

### 复合属性

来源：[framework/Zongsoft.Core/test/Configuration/ConnectionSettingsTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/ConnectionSettingsTest.cs#L178)（节选；上下文见源文件）。

{% code title="ConnectionSettingsTest.cs" %}
```csharp
public void TestConnectionSettingsCompositeProperty()
{
	var settings = MyDriver.Instance.GetSettings("a.b.c=none;cluster.address=192.168.0.100;nothing.property=none;cluster.heartbeat=30s");
	Assert.NotNull(settings);

	Assert.False(settings.Cluster.IsEmpty);
	Assert.Equal("192.168.0.100", settings.Cluster.Address);
	Assert.Equal(TimeSpan.FromSeconds(30), settings.Cluster.Heartbeat);
	Assert.Equal("none", settings.Properties["a.b.c"]);
	Assert.Equal("none", settings.Properties["nothing.property"]);
}
```
{% endcode %}

MyDriver、ClusterSettings 和 MyConnectionSettings 都是同一测试文件中的夹具。cluster.address 与 cluster.heartbeat 被绑定为 Cluster 的成员，其它未识别键留在 Properties。只有驱动设置模型定义了相应复合属性时，这种语法才会产生结构化对象。集合元素的专用转换见[转换器](components/converters.md)。

## XML 选项文件

来源：[framework/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest.cs#L14)（节选；上下文见源文件）。

{% code title="OptionConfigurationTest.cs" %}
```csharp
public static IConfigurationRoot GetConfiguration1()
{
	return new ConfigurationBuilder()
		.AddOptionFile("Configuration/Xml/OptionConfigurationTest-1.option")
		.Build();
}
```
{% endcode %}

测试从自己的输出目录载入 option 文件，再读取配置节点。在插件宿主中通常由选项加载流程完成这一步，不需要每个业务服务再次创建配置根。

option 的 path 指定挂载位置；元素形成子节点，属性形成配置值。重复元素需要稳定的键，例如 connectionSetting.name；不能仅靠文档中的排列顺序推断配置集合索引。详细规则和 Discussions 清单的配合见[选项文件参考](../../references/option-files.md)。

## Profile 与 .deploy

Profile 保留 INI 的条目、节和注释，同时支持以空格或 Tab 分隔的层级节。下面是框架现有 Profile 测试输入：

来源：[framework/Zongsoft.Core/test/Configuration/Profiles/Profile-1.ini](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Profiles/Profile-1.ini#L1)（节选；上下文见源文件）。

{% code title="Profile-1.ini" %}
```ini
﻿[plugins zongsoft data]
nuget:Zongsoft.Data
```
{% endcode %}

它会得到 plugins / zongsoft / data 三层节，nuget:Zongsoft.Data 是该节下没有值的条目。Profile 只负责解析这个结构，NuGet 定位、复制和版本选择由部署工具解释。

Discussions 的包内清单使用相对产物路径和 Framework 变量：

来源：[src/Zongsoft.Discussions.deploy](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.deploy#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.deploy" %}
```ini
artifacts/Zongsoft.Discussions.plugin
artifacts/Zongsoft.Discussions.option
artifacts/Zongsoft.Discussions.mapping
lib/$(Framework)/Zongsoft.Discussions.*
```
{% endcode %}

这些路径相对于包的文件布局。Framework 变量由部署上下文提供，用来选择目标程序集。段落目标目录、来源路径、重命名、条件表达式、导入及变量作用域都由[部署清单参考](../../references/deploy-files.md)统一说明。

内置 ImportDirective 处理导入，指令以注释形式出现。导入文件中的相对路径、重复文件和循环引用都应按当前 Profile.Load 与部署工具行为核对；不要根据普通 INI 解析器推断它们的语义。

## Models 配置源

Models 把一组带键值的模型记录提供为配置树。Discussions 没有完整的模型配置持久化流程，因此这里采用 ModelConfigurationTest：

来源：[framework/Zongsoft.Core/test/Configuration/Models/ModelConfigurationTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Models/ModelConfigurationTest.cs#L163)（节选；上下文见源文件）。

{% code title="ModelConfigurationTest.cs" %}
```csharp
public abstract class ConfigurationEntity
{
	public abstract int TenantId { get; set; }
	public abstract int BranchId { get; set; }
	public abstract string Module { get; set; }
	public abstract string Key { get; set; }
	public abstract string Value { get; set; }
}

public static class ConfigurationEntityExtension
{
	public static string GetInfo(this ConfigurationEntity entity)
	{
		if(entity == null)
			return string.Empty;

		return $"[{entity.TenantId}-{entity.BranchId}:{entity.Module}]" + Environment.NewLine + $"{entity.Key}={entity.Value}";
	}
}
```
{% endcode %}

来源：[framework/Zongsoft.Core/test/Configuration/Models/ModelConfigurationTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Models/ModelConfigurationTest.cs#L71)（节选；上下文见源文件）。

{% code title="ModelConfigurationTest.cs" %}
```csharp
var models = GetModels(dictionary);

return new ConfigurationBuilder()
	.AddModels(models, source =>
	{
		source.OnChange(model => System.Diagnostics.Debug.WriteLine(model.GetInfo()));

		if(persistent != null)
			source.OnChange(persistent);
	})
	.Build();
```
{% endcode %}

GetModels 在同一测试里用内存字典构造 ConfigurationEntity，并填充租户、分支和模块字段。OnChange 收到被更新或新建的模型；示例回调只记录或检查变更，没有真实数据库事务。需要持久化时，调用方必须实现回调并承担写入失败、权限、并发和重载策略。

配置源可读取动态模型、数据字典及普通对象。默认键值成员是 Key / Value，字段名不同则通过 Mapping 指定。与[数据服务](../data/services.md)配合时，应先确定配置读取所处身份与租户范围，不能把配置表天然视为全局可见数据。

## Options 集成

OptionsConfigurationExtension 把 Zongsoft 绑定器接入服务集合，并提供命名选项和配置变更令牌。安全凭证提供者中已有实际的 Options 属性注入：

来源：[framework/Zongsoft.Security/src/CredentialProvider.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/CredentialProvider.cs#L65)（节选；上下文见源文件）。

{% code title="CredentialProvider.cs" %}
```csharp
[Options("Security/Authority")]
public Configuration.AuthenticationOptions Options { get; set; }
```
{% endcode %}

框架扫描和注入流程识别该属性，从指定配置路径取得 AuthenticationOptions。标记属性本身不会启动配置源，也不会让用 new 手工创建的任意对象自动完成注入；应通过支持该注入约定的服务构建流程取得对象，参阅[服务注册与注入](services.md)。

| 对象 | 作用 |
| --- | --- |
| OptionsConfigurator | 按选项名称选取配置并调用绑定器 |
| OptionsConfigurationChangeTokenSource | 把配置源变更通知交给 Options 监视机制 |
| OptionsFactory | 创建选项实例，支持框架动态模型 |

配置变化能否被当前消费者观察到，还取决于消费方式和对象生命周期。一次取值、缓存一个选项对象、使用 [IOptionsMonitor](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.options.ioptionsmonitor-1) _[源码](https://source.dot.net/#Microsoft.Extensions.Options/IOptionsMonitor.cs)_ 监听更新，不是相同语义。

## 实践建议

从 Discussions 开始时，先确认选项文件进入宿主，再核对最终键和值、驱动与服务注册，最后执行受影响业务。独立解析测试只能说明格式和绑定正确；数据库连接、文件写入、消息订阅仍需各自验证。

保持配置键稳定，把敏感连接值放在环境配置中。无法识别的键应显式报错或进入明确的扩展容器，不能因为解析器没有抛异常就认为设置已经生效。框架测试入口见 [Configuration 测试目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/test/Configuration)。
