---
description: 从版主审核与浏览量递增理解条件组合和数据库端表达式。
icon: book-open
---

# 条件与操作元


条件决定哪些记录可操作，操作元决定字段怎样更新。二者都应描述业务约束，避免先读出值再在应用中计算后写回造成并发覆盖。

## 条件组合：只有版主能审核

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L70)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
public bool Approve(ulong threadId)
{
	var criteria = Condition.Equal(nameof(Models.Thread.ThreadId), threadId) &
	               Condition.Equal(nameof(Models.Thread.Approved), false) &
	               GetIsModeratorCriteria();

	return this.DataAccess.Update<Models.Thread>(new
	{
		Approved = true,
		ApprovedTime = DateTime.Now,
		Post = new
		{
			Approved = true,
		}
	}, criteria, "*,Post{Approved}") > 0;
}
```
{% endcode %}

主题编号、尚未批准、版主资格同时成立才更新。Post 的批准标志由数据模式显式包含。不能只在界面上隐藏按钮；服务本身也需要表达动作约束。

## 存在性条件：论坛中的版主记录

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L239)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
private Zongsoft.Data.Condition GetIsModeratorCriteria()
{
	return Condition.Exists("Forum.Users",
	         Condition.Equal(nameof(Forum.ForumUser.UserId), this.Principal.Identity.GetIdentifier<uint>()) &
	         Condition.Equal(nameof(Forum.ForumUser.IsModerator), true));
}
```
{% endcode %}

Exists 以 Forum.Users 关系为范围，内部同时匹配用户编号和版主标志。导航名来自[映射](mapping.md)，不是任意 SQL 表名。关联条件与当前 SiteId 一起构成完整业务范围。

## 操作元：浏览次数在数据库端递增

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L183)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
//递增当前主题的累计阅读量并更新最后查看时间
this.DataAccess.Update<Models.Thread>(new
{
	TotalViews = Operand.Field(nameof(Models.Thread.TotalViews)) + 1,
	ViewedTime = DateTime.Now,
}, Condition.Equal(nameof(Models.Thread.ThreadId), thread.ThreadId));
```
{% endcode %}

Operand.Field 表示数据库当前字段值。加一运算属于写入表达式，可以减少先读取再写入的竞争窗口。随后的内存对象也会增加计数，目的是让本次响应与已经执行的更新一致；它不是第二次数据库写入。

## 租户条件不能由调用方替换

来源：[src/Data/DataValidator.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/DataValidator.cs#L81)（节选；上下文见源文件）。

{% code title="DataValidator.cs" %}
```csharp
public ICondition Validate(IDataAccessContextBase context, ICondition criteria)
{
	if(UserIdentity.Current == null)
		return criteria;

	//调用方提供的站点条件不能替代当前身份的站点约束。
	if(HasProperty(context, Fields.SiteId))
		criteria &= Condition.Equal(Fields.SiteId, UserIdentity.Current.SiteId);

	return criteria;
}
```
{% endcode %}

在存在 Discussions 身份且实体有 SiteId 时，验证器追加当前站点条件。调用方显式传入其他 SiteId，也不能取消这个约束。没有 Discussions 身份的认证初始化路径有不同前提，不能据此声称验证器独自覆盖所有匿名入口。

继续阅读[查询](querying.md)、[写入](writing.md)和[认证](../security/authentication.md)。
