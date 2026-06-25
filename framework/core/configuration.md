---
description: Zongsoft.Configuration 命名空间及其 XML、Profile、Models、Options 子体系的设计与使用。
icon: sliders
---

# Zongsoft.Configuration

`Zongsoft.Configuration` 是 `Zongsoft.Core` 对 [`Microsoft.Extensions.Configuration.IConfiguration`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.configuration.iconfiguration) _[源码](https://source.dot.net/#Microsoft.Extensions.Configuration.Abstractions/IConfiguration.cs)_ 体系的扩展。它没有另起一套配置运行时，而是把标准配置源、配置路径、变更令牌和 Options 模式继续作为底座，再补上 Zongsoft 在插件化、部署、连接设置和模型化配置中需要的约定。

本页介绍的范围包括：

* `Zongsoft.Configuration`：对象绑定、配置识别、连接设置和组合配置提供程序。
* `Zongsoft.Configuration.Xml`：`*.option` XML 配置文件到标准配置键值的转换。
* `Zongsoft.Configuration.Profiles`：扩展 INI Profile 模型，尤其是 `.deploy` 文件依赖的分层 Section 和导入指令。
* `Zongsoft.Configuration.Models`：把数据库记录、模型对象或字典式实体包装成配置源。
* `Zongsoft.Configuration.Options`：把 Zongsoft 绑定器接入 Microsoft Options 模式。

## 设计定位

Zongsoft 的配置系统以“配置源仍然是标准配置源，解释方式由 Zongsoft 约定增强”为核心思路。这样做的直接好处是：JSON 配置提供程序、环境变量、命令行、文件监视、[`Microsoft.Extensions.Options.IOptions<TOptions>`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.options.ioptions-1) _[源码](https://source.dot.net/#Microsoft.Extensions.Options/IOptions.cs)_ 等 .NET 基础能力仍然可用，而框架内部可以用统一的对象模型读取 `.option`、数据库配置、插件配置和连接字符串。

典型读取路径如下：

{% code title="ReadOptions.cs" %}
```csharp
var queues = configuration.GetOption<QueueOptionsCollection>("/Messaging/Queues");
var redis = configuration.GetConnectionSettings("/Externals/Redis", name: null, driver: "Redis");
var timeout = configuration.GetOptionValue<TimeSpan>("/Messaging/Queues/Default/Timeout", TimeSpan.FromSeconds(30));
```
{% endcode %}

路径参数可以写成 `/A/B/C`，`ConfigurationUtility.GetConfigurationPath()` 会把斜杠路径转换为 `A:B:C`。因此文档和 `.option` 文件里通常用斜杠表达配置层级，进入 .NET 配置系统时仍遵守标准的冒号分隔路径。

## 基础绑定

`ConfigurationBinder` 是 Zongsoft 绑定入口，它扩展标准配置对象，提供 `Bind()`、`GetOption<T>()`、`GetOptionValue<T>()` 和 `SetOption()`。和 Microsoft 标准 Binder 的常规绑定相比，它更关注“配置结构到业务对象”的映射：

* 支持 `ConfigurationPropertyAttribute` 给属性指定配置键名，例如把 `IsIntranet` 映射到 `intranet`。
* 支持集合、字典和 `KeyedCollection` 风格的配置项。
* 支持用 `ConfigurationAttribute.UnrecognizedProperty` 收纳未识别配置项。
* 支持抽象类或接口选项对象，通过 `Zongsoft.Data.Model.Build()` 创建动态模型。
* 支持 `FileInfo`、`DirectoryInfo` 从文件配置源相对路径还原物理路径。

{% code title="OptionModel.cs" %}
```csharp
public class MobileOptions
{
	public string Region { get; set; }
	public IDictionary<string, TemplateOptions> Messages { get; set; }

	[ConfigurationProperty("Pushing")]
	public NotificationOptionsCollection Notifications { get; set; }
}
```
{% endcode %}

`ConfigurationAttribute` 可以标在类或接口上，用来更换解析器、识别器，或指定未识别属性容器。未识别属性容器通常是 `IDictionary<string, TValue>`，适合承接扩展属性：

{% code title="ExtensibleOptions.cs" %}
```csharp
[Configuration(nameof(Properties))]
public class QueueOptions
{
	public string Name { get; set; }
	public SubscriptionOptions Subscription { get; set; }

	[ConfigurationProperty("*")]
	public IDictionary<string, string> Properties { get; set; }
}
```
{% endcode %}

`ConfigurationBinderOptions` 只有两个关键开关：

| 选项 | 作用 |
| --- | --- |
| `BindNonPublicProperties` | 是否允许绑定非公共属性。默认只绑定公共属性。 |
| `UnrecognizedError` | 遇到无法识别、也没有未识别容器可接收的配置项时是否抛出异常。 |

{% hint style="warning" %}
对集合或字典对象重复绑定可能会追加已有项。把配置接入依赖注入时，`OptionsConfigurationExtension.Configure<TOptions>()` 会避免同一类型、同一名称、同一配置对象重复注册，以降低重复解析风险。
{% endhint %}

## 连接设置

连接设置是 `Zongsoft.Configuration` 最常被其它模块复用的能力。数据驱动、Redis、MQTT、RabbitMQ、Etcd、OPC、Amazon S3 等外部组件都通过 `IConnectionSettings` 和 `IConnectionSettingsDriver` 描述连接字符串。

一个连接设置通常包含：

* `Name`：配置项名称，用于默认项或命名连接。
* `Driver`：驱动标识，例如 `mysql`、`redis`、`mqtt`。
* `Value`：原始连接字符串。
* 解析后的键值项：如 `server`、`port`、`database`、`username`。

`.option` 中的连接配置通常写成：

{% code title="Zongsoft.Data.option" %}
```xml
<option path="/Data">
	<connectionSettings default="db1">
		<connectionSetting connectionSetting.name="db1" driver="mysql" value="server=localhost;database=demo" />
	</connectionSettings>
</option>
```
{% endcode %}

读取时可以取整个集合，也可以取单项：

{% code title="ReadConnectionSettings.cs" %}
```csharp
var settings = configuration.GetOption<ConnectionSettingsCollection>("/Data/ConnectionSettings");
var current = settings.GetDefault();

var mysql = configuration.GetConnectionSettings("/Data", "db1", "mysql");
var database = mysql.GetValue<string>("database");
```
{% endcode %}

自定义驱动通常继承 `ConnectionSettingsDriver<TSettings>`，自定义设置对象继承 `ConnectionSettingsBase<TDriver>` 或 `ConnectionSettingsBase<TDriver, TOptions>`。属性上的 `ConnectionSettingAttribute`、`DefaultValueAttribute` 和 `AliasAttribute` 会被收集为 `ConnectionSettingDescriptor`，用于描述类型、默认值、别名、依赖、候选值和组装器。

{% code title="MySqlConnectionSettings.cs" %}
```csharp
public sealed class MySqlDriver : ConnectionSettingsDriver<MySqlSettings>
{
	public static readonly MySqlDriver Instance = new();
	private MySqlDriver() : base("MySql") { }
}

public sealed class MySqlSettings : ConnectionSettingsBase<MySqlDriver>
{
	public MySqlSettings(MySqlDriver driver, string settings) : base(driver, settings) { }
	public MySqlSettings(MySqlDriver driver, string name, string settings) : base(driver, name, settings) { }

	[DefaultValue(3306)]
	public ushort Port
	{
		get => this.GetValue<ushort>();
		set => this.SetValue(value);
	}

	public string Server
	{
		get => this.GetValue<string>();
		set => this.SetValue(value);
	}
}
```
{% endcode %}

如果连接设置类继承 `ConnectionSettingsBase<TDriver, TOptions>`，可以调用 `settings.GetOptions()` 把连接项投影到第三方库的 Options 对象。驱动描述符上的别名和组装器会参与这个投影过程，适合把一个连接字符串同时填充为 `ConnectionTimeout`、`ExecutionTimeout` 这类不同目标属性。

### 复合属性

连接设置属性除了可以从同名连接项直接转换，还可以由多个子项组装。规则是：如果某个设置描述符名为 `Cluster`，连接字符串中出现 `cluster.address`、`cluster.heartbeat` 这类以 `Cluster.` 为前缀的键，并且没有可直接转换的 `cluster` 值，`ConnectionSettingsBase` 会创建 `Cluster` 属性类型的实例，再把后缀路径写入对应成员。

{% code title="CompositeConnectionSettings.cs" %}
```csharp
public class MyConnectionSettings : ConnectionSettingsBase<MyDriver>
{
	public MyConnectionSettings(MyDriver driver, string settings) : base(driver, settings) { }

	public ClusterSettings Cluster
	{
		get => this.GetValue<ClusterSettings>();
		set => this.SetValue(value);
	}
}

public struct ClusterSettings
{
	public string Address { get; set; }
	public TimeSpan Heartbeat { get; set; }
}

var settings = MyDriver.Instance.GetSettings(
	"cluster.address=192.168.0.100;cluster.heartbeat=30s");

Console.WriteLine(settings.Cluster.Address);
Console.WriteLine(settings.Cluster.Heartbeat);
```
{% endcode %}

复合键后缀按成员表达式解析，因此可以继续表达嵌套属性或索引器成员。最终叶子成员仍会使用目标成员类型或其 `System.ComponentModel.TypeConverter` 进行值转换；例如上面的 `cluster.heartbeat=30s` 会按 `System.TimeSpan` 规则转换。

{% hint style="info" %}
复合属性适合把连接字符串保持为扁平键值对，同时让驱动设置对象暴露更自然的结构化属性。它要求目标属性类型可以被创建；抽象类、接口或没有可用构造方式的类型不能自动组装。
{% endhint %}

## XML 选项文件

`Zongsoft.Configuration.Xml` 提供 `AddOptionFile()` 和 `AddOptionStream()`，把 `*.option` XML 转成标准配置键值。它接受根节点 `<configuration>` 或 `<options>`，根节点下的一级元素必须是 `<option>`：

{% code title="Program.cs" %}
```csharp
var configuration = new ConfigurationBuilder()
	.AddOptionFile("Zongsoft.Security.option", optional: true, reloadOnChange: true)
	.Build();
```
{% endcode %}

`<option path="/...">` 决定后续元素挂载到哪段配置路径。元素名和属性名会组成配置路径，属性值就是配置值。

{% code title="Messaging.option" %}
```xml
<configuration>
	<option path="/Messaging/Queues">
		<queue queue.name="avm" timeout="30s">
			<subscription reliability="MostOnce">
				<topic topic.name="uplink">
					<tag />
					<tag>ping</tag>
					<tag>synchronize</tag>
				</topic>
			</subscription>
		</queue>
	</option>
</configuration>
```
{% endcode %}

上面的片段会形成类似这些配置键：

| XML 位置 | 配置键 |
| --- | --- |
| `queue.name="avm"` | `Messaging:Queues:avm:name` |
| `timeout="30s"` | `Messaging:Queues:avm:timeout` |
| `subscription reliability="MostOnce"` | `Messaging:Queues:avm:subscription:reliability` |
| `<tag>ping</tag>` | `Messaging:Queues:avm:subscription:uplink:tag:[ping]` |

集合项的关键规则是“首属性可命名当前元素”。如果元素的第一个属性名是 `元素名.name` 或 `元素名.key`，解析器会把该属性值作为当前元素在父集合中的键，再把 `name` 或 `key` 作为子属性写入配置。例如：

{% code title="NamedEntries.option" %}
```xml
<certificates default="main">
	<certificate certificate.name="main" code="C001" secret="xxxx" />
	<certificate certificate.name="test" code="C002" secret="zzzz" />
</certificates>
```
{% endcode %}

它会生成 `certificates:main:name`、`certificates:main:code`、`certificates:test:name` 等键，正好可以绑定到按名称索引的集合。

{% hint style="warning" %}
`*.option` 解析器不支持 XML 命名空间；属性名不能包含点号，除非它是首属性上的 `元素名.name` 或 `元素名.key` 约定。命名键值也不能包含 `:`、`;`、`/`、`\`、`*`、`?`、`[`、`]`、`{`、`}`。
{% endhint %}

空元素和文本元素用于表达单值集合：

{% code title="Tags.option" %}
```xml
<topic topic.name="uplink">
	<tag />
	<tag>ping</tag>
	<tag>synchronize</tag>
</topic>
```
{% endcode %}

绑定到 `IList<string>` 时会得到三个条目：空字符串、`ping`、`synchronize`。这也是测试中 `TopicOptions.Tags` 的行为。

## Profile 与 .deploy

`Zongsoft.Configuration.Profiles` 是对 INI 文件的扩展实现。它保留 INI 的基本形式：一行一个元素，`name=value` 表示条目，`;` 或 `#` 开头表示注释，`[section]` 表示配置节。Zongsoft 在此基础上增加了两个关键能力：

* Section 支持层级：`[plugins zongsoft data mysql]` 会被解析成 `plugins / zongsoft / data / mysql` 四级。
* 注释可以成为指令：`#@import ./packages` 会触发导入逻辑。

### 基本格式

{% code title=".deploy" %}
```ini
../mime

#@import ../packages

[plugins]
nuget:Zongsoft.Plugins/plugins/Main.plugin

[plugins zongsoft data mysql]
nuget:Zongsoft.Data.MySql@7.8.1
```
{% endcode %}

Profile 模型会把文件拆成三类元素：

| 元素 | 类型 | 说明 |
| --- | --- | --- |
| 条目 | `ProfileEntry` | `name=value` 或只有 `name`。同一节内名称唯一。 |
| 节 | `ProfileSection` | 方括号中的名称，支持空格或 Tab 分隔层级。 |
| 注释 | `ProfileComment` / `ProfileDirective` | 普通注释只保留文本；`@` 开头的注释会被识别成指令。 |

`ProfileSection.FullName` 使用空格保存完整层级。`ProfileSectionCollection.Find()` 同时接受空格、Tab 或斜杠路径，所以 `plugins zongsoft data` 和 `plugins/zongsoft/data` 都能定位到同一个 Section。

### 导入指令

内置指令只有 `ImportDirective`，指令名大小写不敏感。它的语法是：

{% code title="Import.ini" %}
```ini
#@import ./common.deploy
#@import ./base.deploy ./database.deploy
#@import ./base.deploy|./database.deploy
```
{% endcode %}

导入参数会按空格、Tab 或 `|` 拆分。每个路径都相对于当前 Profile 文件所在目录解析；不存在的文件会被忽略。导入时会加载目标 Profile，并把它的顶层条目和 Section 合并进当前 Profile：

* 顶层条目同名时，后导入的值覆盖当前已有条目值。
* Section 不存在则创建，存在则递归合并子节和条目。
* 导入进来的 `ProfileEntry` 和 `ProfileSection` 仍保留原始 `Profile.FilePath`、`FileName` 和 `LineNumber`。

这最后一点对 `Zongsoft.Tools.Deployer` 很重要。部署工具遇到变量未定义、解析器不存在或文件缺失时，可以把错误定位到真正声明该条目的文件和行号，而不是只报最外层 `.deploy`。

{% hint style="warning" %}
`ImportDirective.OnRead()` 调用 `Profile.Load(path)` 加载被导入文件，使用默认指令提供程序。因此导入可以继续导入其它文件，但当前实现没有循环导入检测。公共 Profile 建议保持无环、低层只放共享条目。
{% endhint %}

### 自定义指令

指令扩展点是 `IProfileDirective`：

{% code title="IProfileDirective.cs" %}
```csharp
public interface IProfileDirective
{
	string Name { get; }

	void OnRead(ProfileReadingContext context, string argument);
	void OnWrite(ProfileWritingContext context, string argument);
}
```
{% endcode %}

通过 `ProfileOptions.Directives` 可以替换或扩展指令提供程序：

{% code title="LoadProfile.cs" %}
```csharp
var profile = Profile.Load("app.deploy", new ProfileOptions(
	ImportDirective.Instance,
	new MyDirective()));
```
{% endcode %}

指令处理器在读取注释时执行，能访问当前 `ProfileReadingContext`、输入流、当前行号和当前 Section。保存时如果遇到 `ProfileDirective`，会调用 `OnWrite()`，内置导入指令写出时不做额外处理。

### .deploy 如何使用 Profile

`.deploy` 文件本质上就是 Profile。`Zongsoft.Tools.Deployer` 的处理方式是：

1. 加载 `.deploy`：如果命令参数是目录，并且目录下存在 `.deploy` 文件，则使用该文件。
2. 遍历 Profile 顶层元素和 Section。
3. Section 的 `FullName` 把空格替换成目录分隔符，作为目标目录。
4. 条目名解析为源，条目值解析为目标名；条目前缀决定解析器。
5. 条目名或条目值末尾的 `<...>` 会被解析成条件表达式，不满足条件就跳过。

部署解析器目前包括：

| 前缀 | 解析器 | 说明 |
| --- | --- | --- |
| 无前缀 | 默认解析器 | 从当前 `.deploy` 文件目录复制本地文件，支持通配符。 |
| `nuget:` | NuGet 解析器 | 下载包，若包根有 `.deploy` 则递归执行，否则部署匹配框架资产。 |
| `delete:` / `remove:` | 删除解析器 | 从目标目录删除指定文件。 |

目标目录由 Section 决定：

{% code title="TargetDirectories.deploy" %}
```ini
[plugins]
nuget:Zongsoft.Plugins/plugins/Main.plugin

[plugins zongsoft security]
nuget:Zongsoft.Security.Web@7.6.5
```
{% endcode %}

上面的两个 Section 会分别部署到目标根目录下的 `plugins/` 和 `plugins/zongsoft/security/`。

条目值用于改名或指定目标文件名：

{% code title="RenameOptions.deploy" %}
```ini
../.deploy/$(scheme)/options/app.$(environment).option = Zongsoft.Hosting.Terminal.option <!debug:on>
../.deploy/$(scheme)/options/app.$(environment)-debug.option = Zongsoft.Hosting.Terminal.option <debug:on>
```
{% endcode %}

这正是 `hosting/terminal/.deploy` 和 `hosting/daemon/.deploy` 的做法：公共配置文件按 `scheme`、`environment`、`debug` 选择，然后复制为宿主实际读取的应用配置文件名。

### 条件表达式

条件写在尖括号中，可放在源或目标末尾；如果源和目标都有条件，部署工具会用 `&` 合并。条件支持：

| 写法 | 含义 |
| --- | --- |
| `<debug>` | 变量集合中存在 `debug`。 |
| `<!debug>` | 变量集合中不存在 `debug`。 |
| `<debug:on>` | `debug` 的值等于 `on`。 |
| `<!debug:on>` | `debug` 的值不等于 `on`，或变量不存在。 |
| `<platform:win,windows>` | `platform` 是逗号列表之一。 |
| `<framework:net8.0^>` | 目标框架同平台且版本大于等于 `net8.0`。 |
| `<debug:on & platform:windows>` | 两个条件都满足。 |
| `<debug:on \| environment:test>` | 任一条件满足。 |

变量替换支持两种形式：

{% code title="Variables.deploy" %}
```ini
../.deploy/$(scheme)/options/web.$(site).option
%USERPROFILE%/certificates/root.crt = certs/root.crt
```
{% endcode %}

部署工具从命令行选项、宿主脚本传入变量和环境变量字典中取值；未定义变量会通过终端输出定位信息。`hosting/web/default/deploy.cmd` 会传入 `scheme`、`environment`、`debug`、`edition`、`framework`、`platform`、`architecture`，并额外部署 `../../.deploy/%scheme%/$(host).deploy` 与 `../../.deploy/%scheme%/$(site).deploy`。

### hosting 项目的组合技巧

`hosting` 项目展示了 Profile 最典型的分层复用方式：

* `hosting/packages` 是共享包清单，按 `[plugins zongsoft ...]` 分组列出核心插件和外部插件。
* `hosting/terminal/.deploy` 与 `hosting/daemon/.deploy` 通过 `#@import ../packages` 复用共享包清单，再追加各自宿主的配置文件。
* `hosting/web/web.deploy` 先导入 `../packages`，再补 Web 专属插件，如 `Zongsoft.Web.Grpc`、`Zongsoft.Web.OpenApi`。
* `hosting/web/default/.deploy` 通过 `#@import ../web.deploy` 复用 Web 插件组合，同时复制站点配置和 Nginx、systemd 相关资源。
* `hosting/.deploy/default/options` 存放多环境 `*.option` 文件，部署条目用 `$(scheme)`、`$(environment)`、`$(site)` 和 `<debug:on>` 选择实际落地文件。

一个常见技巧是把“插件安装”和“配置覆盖”分离：包清单只关心 NuGet 插件，宿主 `.deploy` 负责把当前环境的 `*.option` 复制到对应插件目录。这样修改配置时不需要改共享包清单，换部署方案时也只需要切换 `scheme`。

{% hint style="info" %}
`.deploy` 是 Profile 的一个使用场景，不是 Profile 的全部。Profile 本身也可以用于其它类 INI 配置：读取后用 `GetOptionValue("/section/name")` 获取条目值，用 `SetOptionValue("/section/", dictionary)` 批量更新某个 Section 的条目。
{% endhint %}

## Models 配置源

`Zongsoft.Configuration.Models` 把一组模型对象包装成 [`Microsoft.Extensions.Configuration.IConfigurationProvider`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.configuration.iconfigurationprovider) _[源码](https://source.dot.net/#Microsoft.Extensions.Configuration.Abstractions/IConfigurationProvider.cs)_。它适合数据库配置表、租户配置表、远程配置记录等“天然就是 Key/Value 行”的场景。

默认映射字段名是 `Key` 和 `Value`：

{% code title="ConfigurationEntity.cs" %}
```csharp
public abstract class ConfigurationEntity
{
	public abstract int TenantId { get; set; }
	public abstract int BranchId { get; set; }
	public abstract string Module { get; set; }
	public abstract string Key { get; set; }
	public abstract string Value { get; set; }
}
```
{% endcode %}

注册配置源：

{% code title="AddModels.cs" %}
```csharp
var configuration = new ConfigurationBuilder()
	.AddModels(records, source =>
	{
		source.Map("Key", "Value");
		source.OnChange(model =>
		{
			// 在这里持久化变更，例如 Upsert 到数据库。
		});
	})
	.Build();
```
{% endcode %}

`ModelConfigurationProvider<TModel>` 读取模型时会按 `Mapping.Key` 建立配置键，按 `Mapping.Value` 返回配置值。写入 `configuration["path"] = value` 时，如果原模型存在就更新模型；不存在则创建新模型并填充 Key/Value。随后调用 `OnChange()` 注册的持久化回调。

它支持三类模型访问方式：

* `Zongsoft.Data.IModel`
* `Zongsoft.Data.IDataDictionary`
* 普通 CLR 对象属性

因此同一套配置源既可以服务数据库实体，也可以服务动态模型或简单 POCO。

## Options 集成

`Zongsoft.Configuration.Options` 把 Zongsoft 绑定器接进 Microsoft Options 模式。扩展方法位于 `Zongsoft.Services.OptionsConfigurationExtension`，可直接对 [`Microsoft.Extensions.DependencyInjection.IServiceCollection`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.dependencyinjection.iservicecollection) _[源码](https://source.dot.net/#Microsoft.Extensions.DependencyInjection.Abstractions/IServiceCollection.cs)_ 调用：

{% code title="ConfigureOptions.cs" %}
```csharp
services.Configure<QueueOptions>(
	"avm",
	configuration.GetSection("Messaging:Queues"));
```
{% endcode %}

它注册的关键对象包括：

| 类型 | 作用 |
| --- | --- |
| `OptionsConfigurator<TOptions>` | 按名称选择配置节，并调用 Zongsoft 的 `Bind()`。 |
| `OptionsConfigurationChangeTokenSource<TOptions>` | 把配置源的变更令牌暴露给 Options 监视器。 |
| `OptionsFactory<TOptions>` | 创建普通选项对象；若选项类型是抽象类则用 `Data.Model.Build<TOptions>()` 创建。 |

`OptionsAttribute` 用在服务成员注入场景，标注某个属性或字段应从哪个配置路径取得选项：

{% code title="OptionsConsumer.cs" %}
```csharp
public class QueueService
{
	[Options("/Messaging/Queues/avm")]
	public QueueOptions Options { get; set; }
}
```
{% endcode %}

在 `ServiceCollectionExtension` 和 `ServiceInjector` 中，框架会识别这个标注，为对应类型注册 Options，并在注入时解析 [`Microsoft.Extensions.Options.IOptions<TOptions>`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.options.ioptions-1) _[源码](https://source.dot.net/#Microsoft.Extensions.Options/IOptions.cs)_ 或选项值。

## 实践建议

* 应用和插件配置优先使用 `*.option`，因为它能表达插件化配置路径和命名集合。
* 需要从数据库或远程存储加载配置时，用 `AddModels()` 把记录转成标准配置源，再复用 `GetOption<T>()`。
* 连接字符串不要散落在业务对象中，优先建 `ConnectionSettingsDriver<TSettings>`，让描述符、默认值、别名和 Options 投影集中维护。
* `.deploy` 中把公共插件清单、宿主专属插件、环境配置文件分开写，再用 `#@import` 组合。
* 条件表达式适合处理小差异，例如 debug 配置或平台差异；如果流程差异很大，建议拆成不同 `.deploy` 或不同 `scheme`。
* 编写可扩展选项对象时，为扩展属性准备 `IDictionary<string, string>` 或 `IDictionary<string, object>`，并用 `ConfigurationAttribute` 指定未识别属性容器。

## 相关页面

{% content-ref url="../../references/option-files.md" %}
[配置文件](../../references/option-files.md)
{% endcontent-ref %}

{% content-ref url="../../references/deploy-files.md" %}
[部署文件](../../references/deploy-files.md)
{% endcontent-ref %}

{% content-ref url="../../tools/deployer.md" %}
[部署工具](../../tools/deployer.md)
{% endcontent-ref %}
