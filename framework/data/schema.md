---
description: 从用户归档、浏览记录和主题审核理解 schema 对字段与导航的控制。
icon: brackets-curly
---

# 数据模式


数据模式是传给数据访问或数据服务的 schema 文本，描述本次操作包含哪些成员。关系定义来自[映射](mapping.md)，模式只选择这次使用的形状；它不是另一份数据库结构。

## 用户归档需要站点信息

来源：[src/Features/Archiving/UserDataTemplateModelProvider.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Features/Archiving/UserDataTemplateModelProvider.cs#L56)（节选；上下文见源文件）。

{% code title="UserDataTemplateModelProvider.cs" %}
```csharp
var schema = $"*, {nameof(UserProfile.Site)}" + "{*}";
```
{% endcode %}

这条真实模式选择用户的简单字段，并展开 Site 的简单字段。单独的星号不会自动展开所有导航，也不会自动补齐模型计算属性的依赖字段。归档提供者随后把结果包装为 Users，交给 user-list.xlsx，见[表格与模板](../externals/documents.md)。

## 浏览记录展开主题

来源：[src/Services/UserService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/UserService.cs#L67)（节选；上下文见源文件）。

{% code title="UserService.cs" %}
```csharp
public IEnumerable<History> GetHistories(uint userId, Paging paging = null)
{
	if(userId == 0)
		userId = this.Principal.Identity.GetIdentifier<uint>();

	return this.DataAccess.Select<History>(Condition.Equal(nameof(History.UserId), userId), $"*, {nameof(History.Thread)}" + "{*}", paging);
}
```
{% endcode %}

History.Thread 关系由映射连接。只在列表确实需要主题详情时才展开；集合或深层关系可能增加查询次数与结果体积。

## 写入模式包含关联成员

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L205)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
//确保数据模式含有“主题内容贴”复合属性
schema.Include("Post{*}");
```
{% endcode %}

ThreadService 插入主题时，先确认正文存在，再把 Post 加入写入模式。审核动作则限定 Post 的 Approved 字段，防止一个状态动作顺便更新无关正文。

## 语法参考与框架用例

| 语法 | 含义 |
| --- | --- |
| 逗号分隔成员 | 选择多个字段或导航 |
| 星号 | 当前层可匹配的简单成员 |
| 感叹号加成员 | 从当前选择中排除成员 |
| 点路径或花括号 | 沿映射关系选择成员 |
| 冒号加数量 | 集合导航限量，不是页码 |
| 括号内排序成员 | 指定导航结果排序，负号或波浪号表示倒序 |

Discussions 没有使用导航限量的业务片段，相关边界采用框架 [SchemaTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Data/SchemaTest.cs) 和 [SchemaParserTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/test/SchemaParserTest.cs) 作为参考。根结果集分页使用 Paging，见[查询](querying.md)。

## 权限与计算字段

模式控制读取形状，不是授权规则。让调用者排除 Approved、CreatorId 等审核判定字段时，不能默认正文可见；Discussions 的结果过滤器对此采用屏蔽处理。计算成员也不会自动推导其所需原始字段，应由服务限定模式。

{% hint style="warning" %}
🚨 写入模式不能赋予调用方修改站点、创建人或其他不可变字段的权限。仍需同时检查映射、验证器、服务动作和调用者身份。
{% endhint %}
