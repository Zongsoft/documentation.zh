---
description: Zongsoft.Components 标识抽象与 Identifier 值对象。
icon: fingerprint
---

# 标识

标识模型用于把对象的身份抽象出来。对象只要表达“我是谁”，调用方就不必依赖具体用户类、角色类、机构类或业务实体类型，从而降低安全、权限、审计和展示逻辑之间的耦合。

`Identifier` 保存的是“类型 + 值”，并可附带标签和描述。类型用于说明身份所属的对象类别，值用于稳定定位对象，标签和描述则用于日志、界面或诊断输出。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IIdentifiable` | 可标识对象接口。 |
| `Identifier` | 通用标识值，包含 `Type`、`Value`、`Label` 和 `Description`。 |
| `Identifier<T>` | 强类型标识值，适合值类型已经确定的场景。 |

## Identifier 结构

`Identifier` 不只是一个 ID 字符串。它同时包含标识类型和值，还可以携带面向显示的标签和描述，因此很适合跨模块传递“对象身份”。

{% code title="构造标识" %}
```csharp
var user = new Identifier(
	typeof(User),
	10001,
	label: "admin",
	description: "系统管理员");

if(user.Validate<User, int>(out var userId))
	await LoadUserAsync(userId, cancellation);
```
{% endcode %}

在安全模型中，`IUser`、`IRole` 等权限主体可以通过统一标识参与权限判断、审计记录和授权上下文传递。业务代码无需知道权限主体的具体实现类，只要读取其标识即可。

`Identifier` 更适合表达跨模块的对象引用，例如用户、角色、机构和租户；它只表达身份，不承载完整业务状态。需要业务字段时仍应加载对应对象。持久化审计日志时，可以同时保存 `Type`、`Value` 和 `Label`，便于后续查询和显示。如果只在单个聚合内部传递主键，直接使用业务主键通常会更清晰。

## 参考实现

* [Identifier.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Identifier.cs)
* [IIdentifiable.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IIdentifiable.cs)
* [IUser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IUser.cs)
* [IRole.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IRole.cs)
