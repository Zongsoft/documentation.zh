---
description: 以论坛置顶主题、浏览记录和投票统计说明条件、模式、分页与聚合。
icon: book-open
---

# 查询与导航


Discussions 的查询同时表达四件事：读取哪个模型、筛选哪些记录、返回哪些字段或关系，以及按什么方式排序和分页。可以从 ForumService 读取置顶主题这一条真实路径入手。

## 查询可见的置顶主题

来源：[src/Services/ForumService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ForumService.cs#L83)（节选；上下文见源文件）。

{% code title="ForumService.cs" %}
```csharp
public IEnumerable<Models.Thread> GetPinnedThreads(ushort forumId, string schema, Paging paging = null)
{
	return this.DataAccess.Select<Models.Thread>(
		Condition.Equal(nameof(Models.Thread.ForumId), forumId) &
		Condition.Equal(nameof(Models.Thread.IsPinned), true) &
		Condition.Equal(nameof(Models.Thread.Visible), true),
		schema, paging, Sorting.Descending(nameof(Models.Thread.ThreadId)));
}
```
{% endcode %}

ForumId、IsPinned 和 Visible 使用 AND 组合；schema 由调用方提供，paging 控制根结果集，ThreadId 倒序确定返回顺序。可见标志不等于审核批准，正文的审核处理还会经过[结果过滤器](services.md)。站点条件由当前身份和 DataValidator 约束，不应仅凭一个论坛编号查询跨站数据。

## 首屏的全局与置顶主题

来源：[src/Services/ForumService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ForumService.cs#L92)（节选；上下文见源文件）。

{% code title="ForumService.cs" %}
```csharp
public Models.Thread[] GetTopmosts(ushort forumId, string schema, int count = 10)
{
	count = Math.Max(5, Math.Min(50, count));

	var globals = this.GetGlobalThreads(0, schema, Paging.Page(1, count));
	var pinneds = this.GetPinnedThreads(forumId, schema, Paging.Page(1, count));

	return globals.Union(pinneds).OrderByDescending(t => t.ThreadId).Take(count).ToArray();
}
```
{% endcode %}

这里限制最多取 50 条，分别读取全局主题和当前论坛置顶主题，再组合排序。这是业务层的置顶规则，不是数据引擎自动执行的默认分页行为。常规主题查询还要排除已经出现在首屏顶部的记录，避免重复展示。

## 用模式展开导航

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

History 的 Thread 导航来自映射；模式中的星号读取简单字段，Thread 后的花括号要求展开关联主题。导航会增加读取成本，不应把整个对象图无条件展开。参与审核和权限判断的字段必须保留，具体语法见[数据模式](schema.md)。

## 只取身份初始化所需的一条记录

来源：[src/Security/UserChallenger.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserChallenger.cs#L87)（节选；上下文见源文件）。

{% code title="UserChallenger.cs" %}
```csharp
protected virtual ValueTask<UserProfile> GetUserAsync(uint userId, CancellationToken cancellation) =>
	Module.Current.Accessor.SelectAsync<UserProfile>(
		Condition.Equal(nameof(UserProfile.UserId), userId),
		Paging.Limit(1),
		cancellation).FirstOrDefault(cancellation);
```
{% endcode %}

这是认证质询阶段的查询，取消令牌沿调用链传入。Paging.Limit(1) 限制读取量，FirstOrDefault 消费异步序列。这里使用 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的 [集合扩展](../core/collections/extensions.md)，引入 `Zongsoft.Collections` 后即可调用 `.FirstOrDefault(cancellation)`；它处理空序列并释放枚举器，无需在业务项目中另写首元素辅助方法。不要把这一条身份初始化路径当作对外开放的用户搜索接口。

## 用计数还原投票统计

来源：[src/Services/PostService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/PostService.cs#L229)（节选；上下文见源文件）。

{% code title="PostService.cs" %}
```csharp
private bool SetPostVotes(ulong postId)
{
	//获取当前帖子的点赞总数，即统计帖子投票表中投票数大于零的记录数
	var upvotes = this.DataAccess.Count<Post.PostVoting>(Condition.Equal(nameof(Post.PostVoting.PostId), postId) & Condition.GreaterThan(nameof(Post.PostVoting.Value), 0));

	//获取当前帖子的被踩总数，即统计帖子投票表中投票数小于零的记录数
	var downvotes = this.DataAccess.Count<Post.PostVoting>(Condition.Equal(nameof(Post.PostVoting.PostId), postId) & Condition.LessThan(nameof(Post.PostVoting.Value), 0));

	//更新指定帖子的累计点赞总数和累计被踩总数
	return this.DataAccess.Update(Model.Naming.Get<Post>(), new
	{
		PostId = postId,
		TotalUpvotes = upvotes,
		TotalDownvotes = downvotes,
	}) > 0;
}
```
{% endcode %}

当前实现分别统计正票和负票记录数，然后更新帖子计数；它不是对 Value 求和。理解这个差异才能解释票数与投票权重。投票的事务边界见[写入操作](writing.md)。

## 返回集合之前还要考虑什么

稳定排序、分页、字段范围和身份约束一起决定查询是否适合业务页面。集合通常是延迟枚举，调用方应在有效生命周期内消费，提前结束也应释放枚举器。Discussions 的过滤器使用 [FilteredResult](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/FilteredResult.cs) 保留分页通知并处理正文。Discussions 当前没有原生数据命令调用，命名命令的格式与驱动边界请参见[映射文件](mapping.md)。
