---
description: 以 Discussions 模块访问器和真实服务调用解释访问器、结果生命周期与业务边界。
icon: book-open
---

# 数据访问接口


IDataAccess 是数据引擎公共契约。Discussions 在模块中取得具名访问器，让模型、映射、验证器和过滤器使用一致的业务模块范围。

## 从模块取得访问器

来源：[src/Module.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Module.cs#L52)（节选；上下文见源文件）。

{% code title="Module.cs" %}
```csharp
public IDataAccess Accessor => _accessor ??= this.Services.ResolveRequired<IDataAccessProvider>().GetAccessor(this.Name);
#endregion
```
{% endcode %}

这里的名称是 Discussions。提供者管理访问器，业务方法不应在每次查询后将共享访问器释放。程序集只引用 Core 契约；数据引擎和驱动由宿主部署，见[首次查询](quickstart.md)。

## 在服务内使用访问器

来源：[src/Services/UserService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/UserService.cs#L83)（节选；上下文见源文件）。

{% code title="UserService.cs" %}
```csharp
public int GetMessageUnreadCount(uint userId = 0)
{
	if(userId == 0)
		userId = this.Principal.Identity.GetIdentifier<uint>();

	return this.DataAccess.Count<UserMessage>(Condition.Equal(nameof(UserMessage.UserId), userId) & Condition.Equal(nameof(UserMessage.IsRead), false));
}
```
{% endcode %}

UserMessage 保存收件人与已读状态。当前用户编号为默认参数提供业务含义，Count 则只返回匹配记录数。公开接口还必须检查调用方能否访问传入的用户编号，默认值本身不提供授权。

## 查询结果的生命周期

Select 通常返回可枚举结果，真正读取可能发生在枚举阶段。SelectAsync 返回异步序列，调用方应传播取消令牌，并按序消费或提前释放。不要把查询方法返回当作数据库读取已经全部完成。

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

后置过滤和事件可能在异步准备或枚举时抛出异常；异常处理需要覆盖消费过程。分页通知也依赖结果包装器保留 IPageable。

## 哪一层适合直接调用

认证质询器需要在 Discussions 身份尚未建立时读取用户资料，因而直接使用 Module.Current.Accessor；普通业务请求优先调用 UserService 或 ThreadService。两者的身份前提不同，不能照搬认证初始化代码作为匿名查询接口。

参考：[查询](querying.md)、[写入](writing.md)、[数据服务](services.md)。
