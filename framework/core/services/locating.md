---
description: 从 Discussions 服务之间的依赖解释定位范围与生命周期。
icon: magnifying-glass
---

# 服务定位与所有权


服务定位应先明确由哪个容器提供、按哪个契约查找，以及谁负责释放。Discussions 的服务通常从自身 ServiceProvider 或模板提供者的 Services 解析依赖。

## 解析关联业务服务

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

ThreadService 缓存容器返回的 PostService 引用。这里没有创建新的服务范围，也不在每次业务操作后释放它。若把请求可变状态保存在被共享的服务上，单纯使用容器并不能避免串请求。

## 模板提供者使用同一业务入口

来源：[src/Features/Archiving/UserDataTemplateModelProvider.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Features/Archiving/UserDataTemplateModelProvider.cs#L61)（节选；上下文见源文件）。

{% code title="UserDataTemplateModelProvider.cs" %}
```csharp
var data = argument switch
{
	string key => this.Services.ResolveRequired<UserService>().Get(key, schema),
	IModel model => this.Services.ResolveRequired<UserService>().Select(Criteria.Transform(model), schema),
	_ => this.Services.ResolveRequired<UserService>().Select(null, schema),
};
```
{% endcode %}

按键查询与按条件选择都通过 UserService。模板装配不自行连接数据库，从而能够复用服务层约束。调用者仍应检查用户筛选范围和导出权限。

## 模块依赖与缺失服务

MessageSendCommand 的 ServiceDependency 指定 Provider 为 Discussions；访问器则由模块按名称取得。名称、特性注册、程序集扫描和插件挂载是不同环节，缺少任一步都可能导致定位失败。

框架服务解析还有按名称、匹配参数与标签等形式；Discussions 没有覆盖这些全部形式。完整来源见[服务](../services.md)，不要为展示每个重载额外创建一套论坛服务。
