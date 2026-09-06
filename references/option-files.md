---
description: 说明 .option 的 XML 键生成、具名集合、宿主与插件文件匹配、覆盖和排障规则。
icon: sliders
---

# 选项配置文件

`.option` 是接入应用配置体系的 XML 文件。它只提供运行参数；不会下载包、部署 DLL 或自动创建缺失的业务模块。文件能否加载、XML 生成什么键、对象如何读取配置是三个独立问题。

## 基本结构与标量

根节点支持 `options` 或 `configuration`，其下通过 `option path` 指定配置节。路径中的 `/` 对应配置键中的 `:`，属性用于表达标量：

{% code title="Acme.Rules.option" %}
```xml
<options>
	<option path="/">
		<rules evaluator="Scriban" enabled="true" />
	</option>
</options>
```
{% endcode %}

这个文件生成 `Rules:Evaluator` 和 `Rules:Enabled` 两个键。键名比较忽略大小写；属性值先以文本进入配置，再由消费方绑定或转换。

{% code title="ReadRuleOptions.cs" %}
```csharp
using Zongsoft.Services;

var configuration = ApplicationContext.Current.Configuration;
var evaluator = configuration["Rules:Evaluator"];
```
{% endcode %}

{% hint style="warning" %}
🚨 不要照搬其它 XML 配置提供程序的规则。这里的 `<evaluator>Scriban</evaluator>` 会进入文本集合项处理，不等价于 `evaluator="Scriban"`。判断配置是否正确，应核对实际消费的键，不能只看 XML 是否有效。
{% endhint %}

## 具名集合

连接等集合通过 `元素名.name` 或 `元素名.key` 指定成员名称，建议将该属性放在首位，延续仓库中的声明方式：

{% code title="Acme.Orders.option" %}
```xml
<options>
	<option path="/Data">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Orders"
				driver="SQLite" value="Data Source=orders.db" />
		</connectionSettings>
	</option>
</options>
```
{% endcode %}

连接成员名称为 `Orders`，其驱动和值分别位于 `Data:ConnectionSettings:Orders:Driver`、`Data:ConnectionSettings:Orders:Value`。业务按连接名取得对应设置；数据访问器还有自己的名称匹配规则，见[连接配置](../framework/data/connections.md)。

具名键不能包含解析器禁止的路径和特殊字符，例如 `:`、`/`、`[`、`]`。将实例名用于路径时，应遵循相应组件的命名约定。

## 宿主级文件

非 Web 通用宿主的应用构建器先按应用名加载，再在应用名与入口程序集名不同时按入口程序集名加载。对于一个名称，其候选顺序为：

1. `名称.option`。
2. `名称.环境.option`。
3. `名称.host值.option`、`名称.host值.环境.option`。
4. `名称.site值.option`、`名称.site值.环境.option`。

环境名和这里的 host/site 后缀转为小写，重复 host/site 会去重，文件是可选的。Web 构建器有自己的入口和配置装配，应用名及站点参数应对照[Web 宿主](../hosting/web.md)，不要仅凭 DLL 文件名推测。

## 插件级文件

插件配置提供程序只关联**已经加载的插件清单**。假定文件为 `Acme.Rules.plugin`，环境为 `Development`，`host=web`、`site=default`，候选组依次为：

| 顺序 | 候选文件 |
| --- | --- |
| 1 | `Acme.Rules.option` |
| 2 | `Acme.Rules.development.option` |
| 3 | `Acme.Rules.development-*.option` |
| 4 | `Acme.Rules.web.option`、`Acme.Rules.web.development-*.option` |
| 5 | `Acme.Rules.default.option`、`Acme.Rules.default.development-*.option` |

主名取清单**文件名**，不取 `<plugin name>` 属性。host 与 site 相同时不重复处理 site。环境后缀转小写，插件级 host/site 使用配置值拼接，因此在大小写敏感文件系统上应保持拼写一致。

{% hint style="info" %}
💡 插件级匹配的环境附属模式含 `-`。例如 `Acme.Rules.web.development-local.option` 能匹配上述模式，而不能按宿主级规则推断 `Acme.Rules.web.development.option` 也会自动加载。
{% endhint %}

## 覆盖与变化

同一插件内，后加入的提供程序优先返回键值；同一通配符组的文件枚举顺序没有作为稳定约定公开，不要用文件名排序实现关键覆盖逻辑。跨插件的配置提供程序通过并发字典枚举，也不承诺同名键的固定覆盖顺序。

因此建议让每个配置节有明确所有者，将环境覆盖集中在确定的文件中。文件提供程序启用变化加载，并不意味着业务单例会重新绑定，也不意味着现有数据库连接或客户端会重建；是否响应变化取决于消费方。

## 诊断配置问题

按“清单已加载 → 文件主名匹配 → 环境/host/site 后缀匹配 → 实际键正确 → 消费方已读取”的顺序排查。读取非敏感键确认结果；连接字符串、口令及令牌只检查是否存在和来源，不要整段输出。

部署时 `--site` 可以参与文件筛选，运行时 `site=...` 可以参与配置选择，两者属于不同进程。部署变量规则见[部署文件格式](deploy-files.md)。

实现依据：[XML 键生成](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Configuration/Xml/XmlStreamConfigurationProvider.cs)、[插件文件匹配](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Configuration/PluginConfigurationProvider.cs)、[同插件覆盖](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Configuration/CompositeConfigurationProvider.cs)、[宿主配置加载](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Hosting/ApplicationBuilder.cs)。
