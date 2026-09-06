---
description: 以 Discussions 的真实 option 和消费代码说明配置键、文件匹配与覆盖。
icon: sliders
---

# 选项配置文件


.option 提供运行参数；插件清单、程序集部署和配置读取是不同步骤。Discussions 的配置目前只有 General 节，定义站点编号与文件存储基础路径。

## 从文件到配置键

来源：[src/Zongsoft.Discussions.option](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.option#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.option" %}
```xml
<?xml version="1.0" encoding="utf-8" ?>

<options>
	<option path="/Discussions">
		<general siteId="1" basePath="zfs.s3:/zongsoft-discussions/" />
	</option>
</options>
```
{% endcode %}

path 指定配置节，general 的属性生成 Discussions:General:SiteId 和 Discussions:General:BasePath。属性值先按文本加载，再由消费方转换；键名比较忽略大小写。

来源：[src/Utility.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Utility.cs#L283)（节选；上下文见源文件）。

{% code title="Utility.cs" %}
```csharp
var basePath = ApplicationContext.Current.Configuration.GetOptionValue<string>("/Discussions/General.BasePath");
```
{% endcode %}

Utility 实际读取的是 BasePath。配置中出现 SiteId，并不等于所有服务都会用它作为租户回退值；租户身份来自[身份转换与验证器](../framework/security/authentication.md)。这是核对“配置存在”与“业务确实消费”时很重要的区别。

{% hint style="info" %}
💡 源码中的 S3 路径用于说明真实配置，不包含可供文档读者使用的凭据。运行时应由自己的隔离环境提供基础目录和相应文件系统插件。
{% endhint %}

## XML 的标量与集合

标量使用属性；XML 文本节点走集合项处理，不应把属性值改写成同名子元素后假定语义相同。具名集合使用元素名加 .name 或 .key 指定成员名，具体用例见框架[选项解析测试](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Configuration/Xml/OptionConfigurationTest.cs)。

## 清单和选项的主名

Discussions 的 [Zongsoft.Discussions.plugin](https://github.com/Zongsoft/discussions/blob/main/src/Zongsoft.Discussions.plugin) 与 [Zongsoft.Discussions.option](https://github.com/Zongsoft/discussions/blob/main/src/Zongsoft.Discussions.option) 主文件名一致。插件配置提供程序以已加载清单的文件名匹配选项，不是按 plugin 的 name 属性任意搜索。文件未部署或清单未加载时，仅有正确 XML 也不会生效。

环境、host、site 参数还会影响附属文件匹配。宿主级与插件级规则不同，插件级某些环境附属模式包含连字符；需要新增环境文件时，应核对[插件配置提供程序](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Configuration/PluginConfigurationProvider.cs)，不能把文档中的候选规则当成仓库已经存在的文件。

## 覆盖与重新读取

同一插件内，后加入的配置提供程序优先返回同名键；不要依赖通配符枚举顺序或跨插件顺序实现关键覆盖。文件支持变化加载，也不代表消费方一定重新绑定、数据库连接一定重建。

Utility.GetFilePath 在调用时读取 BasePath；其他组件可能缓存设置，必须检查各自实现。排障顺序是：清单加载、选项部署、名称匹配、实际键生成、消费代码读取。

关联阅读：[插件文件](../framework/plugins/plugin-file.md)、[文件系统](../framework/core/io.md)、[部署文件](deploy-files.md)。
