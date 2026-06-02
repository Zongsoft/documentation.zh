---
description: EnumUtility 和 EnumEntry 枚举元数据工具。
icon: list-check
---

# EnumUtility

`EnumUtility` 用于读取枚举项的名称、别名、描述和值，并以 `EnumEntry` 结构返回。

## EnumEntry

`EnumEntry` 包含枚举项的元数据：

| 字段 | 说明 |
| --- | --- |
| `Type` | 枚举类型。 |
| `Name` | 枚举项名称。 |
| `Value` | 枚举项值；可选择枚举值或基础数值。 |
| `Aliases` | 枚举项别名。 |
| `Description` | 枚举项说明。 |

## 读取枚举项

{% code title="EnumUtility.cs" %}
```csharp
var entry = EnumUtility.GetEnumEntry(Gender.Male, underlyingType: true);

Console.WriteLine(entry.Name);
Console.WriteLine(entry.Value);
Console.WriteLine(entry.Description);
Console.WriteLine(entry.HasAlias("M"));
```
{% endcode %}

`GetEnumEntries` 可以读取整个枚举类型，也可以为可空枚举追加空值项。

{% code title="EnumEntries.cs" %}
```csharp
var entries = EnumUtility.GetEnumEntries(
	typeof(Gender?),
	underlyingType: true,
	nullValue: null,
	nullText: "<Unknown>");
```
{% endcode %}

## 相关资源

* [EnumUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/EnumUtility.cs)
* [EnumEntry.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/EnumEntry.cs)
* [EnumUtilityTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/EnumUtilityTest.cs)
