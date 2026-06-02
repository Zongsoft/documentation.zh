---
description: Zongsoft.Components AliasAttribute 别名声明和读取。
icon: tag
---

# AliasAttribute

`AliasAttribute` 用于为程序集、模块、类型、成员或参数声明一个或多个别名。它常用于把外部输入、配置名称、命令名称或插件名称映射到内部成员。

别名的设计重点是“稳定匹配”，不是展示文本。一个组件可以有多个历史名称、缩写或外部配置名，但运行时仍通过同一个类型或成员处理。

## 关键能力

| 能力 | 说明 |
| --- | --- |
| 多重声明 | `AllowMultiple = true`，同一个目标可以拥有多个别名。 |
| 继承读取 | 默认支持继承读取。 |
| 静态读取方法 | `GetAliases(...)` 可从 `MemberInfo`、`Assembly`、`Module`、`ParameterInfo` 或对象读取别名。 |

{% code title="声明和读取别名" %}
```csharp
[Alias("sms")]
[Alias("phone")]
public sealed class PhoneTransmitter
{
}

var aliases = AliasAttribute.GetAliases(typeof(PhoneTransmitter));
```
{% endcode %}

## 使用建议

* 别名适合兼容旧名称、缩写名称或外部配置名称。
* 不要把别名当作本地化标题；它应当是稳定、可匹配的标识。
* 当一个组件需要被命令、配置、插件和 UI 同时引用时，别名可以减少硬编码名称差异。
* 如果别名会参与用户输入解析，建议统一大小写和分隔符约定，避免同一个概念出现多套写法。

{% hint style="info" %}
`AliasAttribute.GetAliases(object)` 会根据目标对象类型分派到程序集、模块、成员、参数或目标类型读取；传入普通对象时读取的是其运行时类型上的别名。
{% endhint %}

## 参考实现

* [AliasAttribute.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/AliasAttribute.cs)
