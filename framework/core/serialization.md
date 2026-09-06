---
description: 从 Discussions 用户归档筛选与模型属性理解序列化边界。
icon: brackets-curly
---

# Zongsoft.Serialization


Serializer.Json 在 System.Text.Json 基础上支持 Zongsoft 模型与数据字典等框架类型。Discussions 的用户归档提供者使用它将输入流还原为条件模型，然后交给数据服务。

## 真实输入不是任意对象图

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

流输入明确指定 UserProfileCriteria，随后通过 Criteria.Transform 转为数据条件。字符串输入则按用户键查询；这两条路径不同，不应随意把输入反序列化成 Dictionary 再拼接 SQL。

## 模型字段与输出范围

来源：[src/Models/Post.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Models/Post.cs#L110)（节选；上下文见源文件）。

{% code title="Post.cs" %}
```csharp
[Serialization.SerializationMember(Ignored = true)]
public IEnumerable<PostVoting> Upvotes => this.Votes == null ? Array.Empty<PostVoting>() : this.Votes.Where(vote => vote.Value > 0);

/// <summary>获取帖子的被踩记录集。</summary>
[Serialization.SerializationMember(Ignored = true)]
public IEnumerable<PostVoting> Downvotes => this.Votes == null ? Array.Empty<PostVoting>() : this.Votes.Where(vote => vote.Value < 0);
#endregion
```
{% endcode %}

忽略成员特性控制序列化可见性，不代表这些成员不存在于数据库，也不替代 schema 或授权。模型返回正文之前，还会经过审核过滤和外置内容读取。

## 框架选项参考

| 选项 | 用途 |
| --- | --- |
| Indented | 可读缩进输出 |
| NamingConvention | 成员命名约定 |
| IgnoreNull、IgnoreZero | 控制空值或默认值输出 |
| IncludeFields | 是否包含字段 |
| MaximumDepth | 对象图深度限制 |
| Typified | 为松散值保留类型信息 |

Discussions 当前未使用 Typified 或自定义 JSON 转换器作为归档入口。相关真实测试可查阅 [JsonSerializerTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Serialization/JsonSerializerTest.cs) 和 [TextSerializationOptionsTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Serialization/TextSerializationOptionsTest.cs)。

## 安全与生命周期

反序列化成功只说明输入能被解析，不说明调用者有权查询或导出相应用户。应限制输入大小与对象深度，传播取消信号，并让服务层继续验证业务范围。归档输出的工作簿结构见[表格与模板](../externals/documents.md)。
