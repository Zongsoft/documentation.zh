---
description: 从 Discussions 的身份质询、声明转换和 SiteId 验证理解认证边界。
icon: shield-halved
---

# 认证与授权


Discussions 在基础认证后补充论坛身份。用户编号回答“是谁”，SiteId 表达论坛业务范围，版主和可见性规则进一步约束“能做什么”。这些问题需要分层处理。

## 插件挂载身份扩展

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L41)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<extension path="/Workbench/Security/Authentication/Challengers">
	<object value="{static:Zongsoft.Discussions.Security.UserChallenger.Instance, Zongsoft.Discussions}" />
</extension>
```
{% endcode %}
来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L46)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<extension path="/Workbench/Security/Authentication/Transformers">
	<object value="{static:Zongsoft.Discussions.Security.UserIdentity+Transformer.Instance, Zongsoft.Discussions}" />
</extension>
```
{% endcode %}

质询器读取或创建论坛用户资料，再向主体加入 Discussions 方案的身份；转换器把声明恢复为 UserIdentity。两者不是重复认证，承担不同阶段的工作。

## 用户资料成为声明

来源：[src/Security/UserChallenger.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserChallenger.cs#L126)（节选；上下文见源文件）。

{% code title="UserChallenger.cs" %}
```csharp
private ClaimsIdentity Identity(UserProfile user)
{
	var identity = user.Identity(UserIdentity.Scheme, "Zongsoft");

	identity.SetClaim(nameof(UserProfile.SiteId), user.SiteId);
	identity.SetClaim(nameof(UserProfile.Gender), user.Gender);
	identity.SetClaim(nameof(UserProfile.Avatar), user.Avatar);
	identity.SetClaim(nameof(UserProfile.Grade), user.Grade);
	identity.SetClaim(nameof(UserProfile.TotalPosts), user.TotalPosts);
	identity.SetClaim(nameof(UserProfile.TotalThreads), user.TotalThreads);

	//进行其他声明定义
	this.OnClaims(identity, user);

	//返回新构建的身份
	return identity;
}
```
{% endcode %}

SiteId、Gender、Avatar、Grade 与统计信息都来自用户资料。身份快照不应视为永久实时业务数据；字段变更后何时刷新凭证，仍由安全宿主的有效期与更新策略决定。

## 当前论坛身份

来源：[src/Security/UserIdentity.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserIdentity.cs#L110)（节选；上下文见源文件）。

{% code title="UserIdentity.cs" %}
```csharp
public static UserIdentity Current => ClaimsIdentityModeling.GetModel<UserIdentity>(Scheme);
```
{% endcode %}

Scheme 是 [Zongsoft.Discussions](https://github.com/Zongsoft/discussions/tree/main/src)。只有建立该方案并注册转换器，当前模型才可用；普通 ClaimsPrincipal 或匿名访问并不自动带有这份身份。

## 站点范围与资源权限

DataValidator 对含 SiteId 的查询与写入约束当前站点，创建时还填写站点、创建人和时间。即使请求指定另一个 SiteId，也不能替代当前身份范围。认证初始化期间尚无论坛身份，因此相关查询必须由受控的认证流程调用。

站点隔离不等于版主权限，也不等于审核可见性。ThreadService 的业务动作、ForumService 的可见性条件、查询结果过滤器共同参与判断，见[数据服务](../data/services.md)。

{% hint style="warning" %}
🚨 不能把“验证器会补 SiteId”推广为所有匿名查询、所有关联实体和所有自定义接口都自动安全。每个入口仍要核对身份建立时机、映射关系和资源权限。
{% endhint %}
