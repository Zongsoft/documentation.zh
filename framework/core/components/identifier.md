---
description: Zongsoft.Components 标识抽象与 Identifier 值对象。
icon: fingerprint
---

# 标识

标识模型用于把对象的身份抽象出来。对象只要表达“我是谁”，调用方就不必依赖具体用户类、角色类、机构类或业务实体类型，从而降低安全、权限、审计和展示逻辑之间的耦合。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IIdentifiable` | 可标识对象接口。 |
| `Identifier` | 通用标识值，包含类型、值、标签和描述。 |
| `Identifier<T>` | 强类型标识值。 |

## Identifier 结构

`Identifier` 不只是一个 ID 字符串。它同时包含标识类型和值，还可以携带面向显示的标签和描述，因此很适合跨模块传递“对象身份”。

{% code title="构造标识" %}
```csharp
var user = new Identifier("User", "10001")
{
	Label = "admin",
	Description = "系统管理员",
};
```
{% endcode %}

在安全模型中，`IUser`、`IRole` 等权限主体可以通过统一标识参与权限判断、审计记录和授权上下文传递。业务代码无需知道权限主体的具体实现类，只要读取其标识即可。

## 使用建议

* 标识只表达身份，不承载完整业务状态。
* 需要跨模块传递用户、角色、机构、租户等引用时，优先传递 `Identifier`。
* 持久化审计日志时，可同时保存 `Type`、`Value` 和 `Label`，便于后续查询和显示。

## 参考实现

* [Identifier.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Identifier.cs)
* [IIdentifiable.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IIdentifiable.cs)
* [IUser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IUser.cs)
* [IRole.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IRole.cs)
