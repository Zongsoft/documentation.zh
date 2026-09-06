---
description: 以 Discussions 用户归档提供者和 user-list.xlsx 解释模板数据装配。
icon: table
---

# 表格与模板扩展


Discussions 提供真实的用户列表模板 docs/templates/user-list.xlsx，以及 UserDataTemplateModelProvider。这个案例说明业务如何准备归档数据，表格引擎如何消费模板则由宿主部署的实现决定。

## 模板模型提供者

来源：[src/Features/Archiving/UserDataTemplateModelProvider.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Features/Archiving/UserDataTemplateModelProvider.cs#L41)（节选；上下文见源文件）。

{% code title="UserDataTemplateModelProvider.cs" %}
```csharp
[Service(typeof(IDataTemplateModelProvider))]
public class UserDataTemplateModelProvider : DataTemplateModelProviderBase
{
	#region 构造函数
	public UserDataTemplateModelProvider(IServiceProvider services) : base("User-List", services) { }
```
{% endcode %}

提供者名是 User-List。它通过服务注册参与模板模型匹配，不能只复制 xlsx 而漏掉程序集扫描和归档引擎部署。

## 从筛选条件到 Users

来源：[src/Features/Archiving/UserDataTemplateModelProvider.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Features/Archiving/UserDataTemplateModelProvider.cs#L54)（节选；上下文见源文件）。

{% code title="UserDataTemplateModelProvider.cs" %}
```csharp
public override IDataTemplateModel GetModel(IDataTemplate template, object argument)
{
	var schema = $"*, {nameof(UserProfile.Site)}" + "{*}";

	if(argument is Stream stream)
		argument = Serializer.Json.Deserialize<UserProfileCriteria>(stream);

	var data = argument switch
	{
		string key => this.Services.ResolveRequired<UserService>().Get(key, schema),
		IModel model => this.Services.ResolveRequired<UserService>().Select(Criteria.Transform(model), schema),
		_ => this.Services.ResolveRequired<UserService>().Select(null, schema),
	};

	return new DataTemplateModel(new { Users = data });
}
```
{% endcode %}

输入是流时先反序列化为 UserProfileCriteria；字符串按键查询，条件模型转换为数据条件，其他情况执行普通选择。模式额外展开 Site，最终交给模板的是包含 Users 成员的模型。这里没有自行创建演示用户列表。

## 模板跟随 Web 包交付

来源：[src/api/Zongsoft.Discussions.Web.deploy](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Zongsoft.Discussions.Web.deploy#L4)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.Web.deploy" %}
```ini
[templates]
artifacts/templates/*.xlsx
```
{% endcode %}

模板路径、提供者名称、返回模型成员和工作簿内引用需要一起维护。修改 Users 或 Site 结构时，除检查 C# 编译外，还要验证实际工作簿能否渲染。

## 引擎与案例的区别

Discussions 实现数据准备，未在其清单中固定 ClosedXml 或 OpenXml。部署者选择引擎时可参考框架 [ClosedXml 模板测试](https://github.com/Zongsoft/framework/blob/main/externals/closedxml/test/SpreadsheetTemplateTest.cs) 和 [OpenXml 测试](https://github.com/Zongsoft/framework/blob/main/externals/openxml/test/SpreadsheetDocumentTest.cs)。这属于框架补充案例，不能据此声称论坛已经启用两种实现。

## 导出和导入的业务边界

导出必须保留用户和站点权限，不能允许任意筛选扩大数据范围。导入还需要行列校验、重复记录策略和事务设计；用户列表导出模板不等于已经实现完整的论坛导入工作流。

继续阅读：[ClosedXml](projects/closedxml.md)、[OpenXml](projects/openxml.md)、[报表](../reporting.md)。
