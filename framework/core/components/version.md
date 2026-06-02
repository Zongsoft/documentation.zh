---
description: Zongsoft.Components Version 四段式版本值、比较和整数持久化。
icon: code-commit
---

# 版本

`Zongsoft.Components.Version` 是一个四段式版本值结构，包含 `Major`、`Minor`、`Patch`、`Revision` 四个 `ushort` 字段。它支持解析、比较、类型转换和 JSON 转换，并可隐式转换为 `ulong` 或 `long`。

## 为什么不用字符串

版本经常需要做范围查询和排序，例如查找 `2.3.0` 到 `2.5.0` 之间的配置、协议或功能开关。字符串适合显示，但不适合稳定排序；`Version` 把四段版本压缩到 64 位整数中，适合保存到数据库或持久化容器里。

{% code title="版本保存为整数" %}
```csharp
Zongsoft.Components.Version version = new(2, 3, 1);

ulong stored = version;
Zongsoft.Components.Version restored = stored;

var baseline = Zongsoft.Components.Version.Parse("2.3.0");

var enabled = restored >= baseline;
var unchanged = restored == version;
```
{% endcode %}

整数形式按四个 `ushort` 依次打包，因此同一个版本值在排序、比较和持久化之间可以保持一致。比较时既可以调用 `CompareTo(...)`，也可以直接使用 `==`、`!=`、`>`、`>=`、`<`、`<=` 运算符。页面或配置里需要展示给用户时，仍建议使用 `1.2.3` 这样的文本形式。

## 类型能力

| 能力 | 说明 |
| --- | --- |
| `IComparable<Version>` | 支持按主版本、次版本、补丁、修订号逐级比较。 |
| `==`、`!=` | 支持直接判断两个版本值是否相等。 |
| `>`、`>=`、`<`、`<=` | 支持直接用比较运算符判断版本大小。 |
| `IParsable<Version>` | 支持从 `1.2`、`1.2.3`、`1.2.3.4` 解析，不支持单段版本。 |
| `TypeConverter` | 支持配置绑定和类型转换。 |
| `JsonConverter` | 支持 JSON 序列化和反序列化。 |
| 与 `System.Version` 互转 | 便于与 .NET 标准版本类型协作。 |

{% hint style="info" %}
文档中提到 `Version` 时，如果语境容易和 `System.Version` 混淆，请写完整命名空间 `Zongsoft.Components.Version`。
{% endhint %}

它适合协议版本、插件版本、配置版本、数据结构版本等需要比较的值。它不是语义化版本完整模型，不表达预发布标签、构建元数据或版本约束表达式；每段最大值也取决于 `ushort`。如果版本段可能超过该范围，或需要完整的语义化版本能力，建议改用文本或专门的版本模型。

## 参考实现

* [Version.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Version.cs)
* [Version.Converters.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Version.Converters.cs)
