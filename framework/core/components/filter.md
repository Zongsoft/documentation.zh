---
description: 从 Discussions 查询后正文处理理解过滤器时机、生命周期与权限。
icon: filter
---

# 过滤器


过滤器在既有操作前后加入横切逻辑。Discussions 的 PostFilter 属于数据访问过滤器，使用查询上下文处理正文；它不同于通用执行器过滤接口，但展示了同样重要的时机与生命周期约束。

## 查询前与查询后

来源：[src/Data/PostFilter.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/PostFilter.cs#L43)（节选；上下文见源文件）。

{% code title="PostFilter.cs" %}
```csharp
public void OnFiltering(DataSelectContextBase context) { }
public void OnFiltered(DataSelectContextBase context)
{
	if(context.Result == null)
		return;

	var identity = context.Principal?.Identity;
	context.Result = FilteredResult.Create(context, item => Filter(item, identity));
}
#endregion
```
{% endcode %}

查询前不包装结果，因为底层操作尚未产生最终集合。查询后以 [FilteredResult](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/FilteredResult.cs) 包装，处理仍在枚举阶段发生。这个薄适配层同时满足查询上下文的非泛型集合要求和调用方的泛型异步枚举要求，并转发分页通知；实际枚举、过滤、取消与释放交给 Core 的 [集合扩展](../collections/extensions.md) 和 [Pageable](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/Pageable.cs)。

{% hint style="warning" %}
🚨 Discussions 的这一实现要求 Core 7.59.0 中的分页过滤修复。该版本发布前需按[准备环境](../../../get-started/prerequisites.md)使用本地 framework 引用；Core 7.58.0 的分页过滤会传入错误的当前元素，不能仅凭编译通过判断兼容。
{% endhint %}

## 处理正文而不改变记录数量

来源：[src/Data/PostFilter.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/PostFilter.cs#L55)（节选；上下文见源文件）。

{% code title="PostFilter.cs" %}
```csharp
private static bool Filter(object item, System.Security.Principal.IIdentity identity)
{
	var dictionary = DataDictionary.GetDictionary<Models.Post>(item);
	if(!dictionary.TryGetValue(p => p.Content, out var content))
		return true;

	if(!(dictionary.TryGetValue(p => p.Approved, out var approved) && approved) &&
	   !(identity?.IsAuthenticated == true && dictionary.TryGetValue(p => p.CreatorId, out var creatorId) && identity.GetIdentifier<uint>() == creatorId))
	{
		dictionary.TrySetValue(p => p.Content, string.Empty);
		if(dictionary.TryGetValue(p => p.ContentType, out var hiddenType))
			dictionary.TrySetValue(p => p.ContentType, Utility.GetContentType(hiddenType, true));
	}
	else if(dictionary.TryGetValue(p => p.ContentType, out var contentType) && !Utility.IsContentEmbedded(contentType))
	{
		dictionary.SetValue(p => p.Content, string.IsNullOrEmpty(content) ? string.Empty : Utility.ReadTextFile(content));
		dictionary.SetValue(p => p.ContentType, Utility.GetContentType(contentType, true));
	}

	return true;
}
```
{% endcode %}

未审核且非作者的正文被置空，记录仍保留。缺少判定字段时也不能当作已审核。外置文件读出后同步调整内容类型，避免后续服务把正文再次当成文件路径读取。

主题详情还有一个读取顺序问题：ThreadFilter 先脱敏，ThreadService 随后才检查当前用户是否为版主。现在过滤器把原正文与当前模型实例关联保存在内部弱引用表中；同步和异步详情读取只有在版主授权成功后才恢复正文。它不会修改 Approved，也不会让普通列表查询绕过脱敏。外置正文同样在授权完成后读取，相关实现见 [ThreadFilter](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Data/ThreadFilter.cs) 与 [ThreadService](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs)。

## 不把过滤器当成全部授权

它处理返回内容，不自动授权编辑、审核、删除或跨站点访问。SiteId 由验证器约束，动作权限由服务与安全机制控制；这些规则需要一起核对。

通用过滤契约和执行器实现参考[组件源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)，数据访问流程见[数据服务](../../data/services.md)。
