---
description: 以帖子投票、主题审核和浏览记录说明真实写入及其副作用。
icon: book-open
---

# 写入操作


数据写入既改变记录，也可能影响统计、审核状态和文件存储。Discussions 将这些规则放在业务服务中；调用者应优先使用服务动作，而不是从控制器直接修改表。

## 新建模型并写入投票

来源：[src/Services/PostService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/PostService.cs#L50)（节选；上下文见源文件）。

{% code title="PostService.cs" %}
```csharp
public bool Upvote(ulong postId, byte value = 1)
{
	if(value == 0)
		value = 1;

	var userId = this.Principal.Identity.GetIdentifier<uint>();

	using(var transaction = new Transaction())
	{
		this.DataAccess.Delete<Post.PostVoting>(
			Condition.Equal(nameof(Post.PostVoting.PostId), postId) &
			Condition.Equal(nameof(Post.PostVoting.UserId), userId));

		this.DataAccess.Insert(Model.Build<Post.PostVoting>(voting =>
		{
			voting.PostId = postId;
			voting.UserId = userId;
			voting.Value = (sbyte)Math.Min(value, (sbyte)100);
			voting.Timestamp = DateTime.Now;
		}));

		//如果帖子投票统计信息更新成功
		if(this.SetPostVotes(postId))
		{
			//提交事务
			transaction.Commit();

			//返回成功
			return true;
		}
	}

	return false;
}
```
{% endcode %}

实际流程先删除当前用户对该帖的旧投票，再通过 Model.Build 创建新记录，最后重算正负票数。只有统计更新成功才提交事务。Value 被限制在 1 到 100，统计的是记录数而非权重总和。

## 删除也需要业务范围

上面的 Delete 同时指定 PostId 与 UserId：删除的是当前用户对当前帖的旧票。缺少其中一个条件都会扩大影响范围。通用 Delete API 不能替代当前身份与目标资源的授权判断。

## 更新主题状态

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L103)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
public bool SetLocked(ulong threadId, bool value)
{
	return this.DataAccess.Update<Models.Thread>(new
	{
		IsLocked = value,
	}, Condition.Equal(nameof(Models.Thread.ThreadId), threadId) & GetIsModeratorCriteria()) > 0;
}
```
{% endcode %}

锁定是一个明确的业务动作，版主条件和主题编号一起控制更新。字段的意义、回复入口是否检查锁定，以及界面反馈，需要按完整调用链核对；仅设置 IsLocked 不等于所有自定义写入入口都会自动阻止回复。

## 新增或更新浏览记录

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L283)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
private void SetHistory(ulong threadId)
{
	//新增或更新当前用户对指定主题的浏览记录（自动递增浏览次数）
	this.DataAccess.Upsert<History>(new
	{
		UserId = this.Principal.Identity.GetIdentifier<uint>(),
		ThreadId = threadId,
		ViewedCount = Operand.Field(nameof(History.ViewedCount)) + 1,
		MostRecentViewedTime = DateTime.Now,
	});
}
```
{% endcode %}

Upsert 围绕浏览记录键执行新增或更新，同时递增 ViewedCount。是否支持相应写入表达式取决于数据库驱动；不要把一种驱动的 SQL 形式推广到全部数据库。

## 内容文件与数据库不是同一事务

长正文可能先保存到文件，再将路径写入数据库。数据库回滚不会自动删除对象存储文件，因此相关服务使用失败补偿。生产接入还需检查异常、取消、重试和旧文件清理。详见[文件系统](../core/io.md)与[事务](transactions.md)。

Discussions 没有直接调用 IDataAccess.Import 的业务流程；批量导入能力仍需独立验证站点字段、权限和重复数据策略。
