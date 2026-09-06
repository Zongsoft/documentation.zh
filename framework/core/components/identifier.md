---
description: 从 Discussions 用户身份理解类型和值共同组成的标识。
icon: fingerprint
---

# 标识


Identifier 将标识类别与标识值放在一起，使通用安全组件不必依赖具体的论坛用户类。Discussions 的 UserIdentity 实现用户契约，将 UserId 转换为通用标识。

来源：[src/Security/UserIdentity.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserIdentity.cs#L102)（节选；上下文见源文件）。

{% code title="UserIdentity.cs" %}
```csharp
Identifier IIdentifiable.Identifier
{
	get => new(typeof(IUser), this.UserId);
	set => this.UserId = value.Validate<uint>(out var id) ? id : this.UserId;
}
#endregion
```
{% endcode %}

这里的类型是 IUser，而不是 UserIdentity。设置标识时先验证值能否作为 uint，再更新 UserId；不符合要求时保持原编号。标识用于回答对象是谁，不会自动加载用户资料或授予权限。

## 相关契约

| 类型 | 责任 |
| --- | --- |
| IIdentifiable | 提供统一标识属性 |
| Identifier | 保存类型、值及可选标签、描述 |
| Identifier&lt;T&gt; | 值类型已确定的标识 |

UserIdentity 还包含 SiteId。用户编号和站点范围承担不同责任，跨模块传递 Identifier 后，业务操作仍需恢复或验证当前站点和资源权限。参见[认证与授权](../../security/authentication.md)。

框架定义：[Identifier](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Identifier.cs)、[IIdentifiable](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IIdentifiable.cs)。
