---
description: 通过 ThreadService、DataValidator 和查询过滤器理解业务服务边界。
icon: book-open
---

# 数据服务


Discussions 的服务继承 DataServiceBase，将数据访问组织为业务动作。它们共同依赖映射、当前身份和插件装配，因此不是拿到一个数据库连接就能独立运行的 CRUD 包装。

## 模型、条件模型与服务注册

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L41)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
[Service(nameof(ThreadService))]
[DataService(typeof(ThreadCriteria))]
public class ThreadService : DataServiceBase<Models.Thread>
{
	#region 成员字段
	private PostService _posting;
	#endregion

	#region 构造函数
	public ThreadService(IServiceProvider serviceProvider) : base(serviceProvider) { }
```
{% endcode %}

Thread 是业务数据模型，ThreadCriteria 描述查询条件，Service 特性让模块容器发现服务。通用查询和写入由基类提供，审核、置顶等动作由派生服务实现。

## 服务依赖另一个服务

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L54)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
public PostService Posting
{
	get
	{
		if(_posting == null)
			_posting = this.ServiceProvider.ResolveRequired<PostService>();

		return _posting;
	}
}
#endregion
```
{% endcode %}

Posting 在使用时从所属服务容器取得 PostService。容器管理的服务不由这里逐次释放，也不应该在静态字段中保存请求用户。

## 三种规则放在不同位置

| 规则 | Discussions 入口 | 作用 |
| --- | --- | --- |
| 业务动作 | ThreadService.Approve、PostService.Upvote | 组织条件、写入和统计 |
| 站点及审计字段 | DataValidator | 为含 SiteId 的操作限制站点，填写创建人和时间 |
| 查询结果内容 | ThreadFilter、PostFilter | 屏蔽未批准正文，读取外置内容 |

过滤器处理返回内容，不能替代请求授权和查询范围。验证器也不能替代业务层对锁定、版主、作者等规则的判断。

## 查询结束后再处理结果

来源：[src/Data/PostFilter.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/PostFilter.cs#L44)（节选；上下文见源文件）。

{% code title="PostFilter.cs" %}
```csharp
public void OnFiltered(DataSelectContextBase context)
{
	if(context.Result == null)
		return;

	var identity = context.Principal?.Identity;
	context.Result = FilteredResult.Create(context, item => Filter(item, identity));
}
```
{% endcode %}

OnFiltering 发生在查询前；此时尚无可供包装的最终结果。OnFiltered 才对结果建立延迟过滤，[FilteredResult](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/FilteredResult.cs) 只适配同步/异步接口并转发分页通知，枚举和过滤直接使用 Core 的实现。其版本要求与生命周期见[过滤器](../core/components/filter.md)。不能在 Current 属性中重复读文件，否则多次读取同一元素可能把正文误当路径。

## 接入 HTTP

控制器通过泛型参数绑定服务，额外动作调用同一业务方法。详见[请求与数据服务接口](../web/data-services.md)。审核失败、不存在和无权限需要保持清晰的响应语义；不要在接口层重新拼一套可绕过服务条件的更新。


## 创建时的审核规则

Discussions 的 Forum.Approvable 表示发帖是否需要审核。ThreadService 创建主题时，正文 Post 通过数据引擎级联写入；这个过程不会自动调用 PostService.OnInsert。因此，主题入口与普通回复入口都必须显式取得论坛规则，不能依赖映射里 Approved 的缺省值，也不能相信请求传入的审核标志。

来源：[src/Services/ForumService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ForumService.cs#L132)（节选；上下文见源文件）。

{% code title="ForumService.cs" %}
```csharp
internal async ValueTask<bool> CanPublishAsync(IDataDictionary<Models.Thread> thread, CancellationToken cancellation)
{
	cancellation.ThrowIfCancellationRequested();
	var forum = await this.DataAccess.SelectAsync<Forum>(GetForumCriteria(thread), nameof(Forum.Approvable), cancellation: cancellation).FirstOrDefault(cancellation);
	if(forum == null)
		throw new InvalidOperationException("The specified forum does not exist.");

	return !forum.Approvable || this.Principal?.Identity?.IsAuthenticated == true && await this.IsModeratorAsync(thread.GetValue(p => p.ForumId), cancellation: cancellation);
}
```
{% endcode %}

CanPublishAsync 与同步 CanPublish 使用同一规则：论坛不存在则失败；无需审核的论坛可以直接发布，需要审核时只允许该论坛的版主直接通过。GetForumCriteria 保留明确指定的 SiteId 和 ForumId，数据验证器另外附加当前站点约束。

主题入口将结果同时写入 Thread.Approved 与 Post.Approved，普通回复先按 ThreadId 查找所属论坛；二者都会把 Approved 纳入实际写入模式，避免自定义字段列表跳过服务端决定的值。审核通过动作仍使用 ThreadService.Approve，它与“创建时依据论坛规则决定初始状态”是两个业务步骤。

这一规则已用隔离的数据访问替身覆盖同步/异步、主题/回复、需要审核/无需审核、版主/普通用户等组合。真实数据库的级联写入、事务回滚和权限配置仍需在部署环境中验收；回归用例见 [Discussions 检查程序](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/test/Program.cs)。
