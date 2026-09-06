---
description: EnumUtility 和 EnumEntry 枚举元数据工具。
icon: list-check
---

# EnumUtility

`EnumUtility` 用于读取枚举项的名称、别名、描述和值，并以 `EnumEntry` 结构返回。

下列代码来自框架测试，Gender 是 Zongsoft.Tests 中的测试枚举，不是 Discussions.Models.Gender。前者的别名和描述必须与测试定义一起阅读。

## EnumEntry

`EnumEntry` 包含枚举项的元数据：

| 字段 | 说明 |
| --- | --- |
| [`Type`](https://learn.microsoft.com/zh-cn/dotnet/api/system.type) _[源码](https://source.dot.net/#System.Private.CoreLib/Type.cs)_ | 枚举类型。 |
| `Name` | 枚举项名称。 |
| `Value` | 枚举项值；可选择枚举值或基础数值。 |
| `Aliases` | 枚举项别名。 |
| `Description` | 枚举项说明。 |

## 读取枚举项

来源：[framework/Zongsoft.Core/test/Common/EnumUtilityTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/EnumUtilityTest.cs#L12)（节选；上下文见源文件）。

{% code title="EnumUtilityTest.cs" %}
```csharp
public void TestGetEnumEntry()
{
	var entry = EnumUtility.GetEnumEntry(Gender.Female);

	Assert.Equal("Female", entry.Name);
	Assert.Equal(Gender.Female, entry.Value); //注意：entry.Value 为枚举类型
	Assert.True(entry.HasAlias("F"));
	Assert.Equal("女士", entry.Description);
	Assert.Equal("女士", EnumUtility.GetEnumDescription(Gender.Female));

	entry = EnumUtility.GetEnumEntry(Gender.Male, true);

	Assert.Equal("Male", entry.Name);
	Assert.Equal((byte)1, entry.Value); //注意：entry.Value 为枚举项的基元类型
	Assert.True(entry.HasAlias("M"));
	Assert.Equal("男士", entry.Description);
	Assert.Equal("男士", EnumUtility.GetEnumDescription(Gender.Male));
}
```
{% endcode %}

`GetEnumEntries` 可以读取整个枚举类型，也可以为可空枚举追加空值项。

来源：[framework/Zongsoft.Core/test/Common/EnumUtilityTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/EnumUtilityTest.cs#L32)（节选；上下文见源文件）。

{% code title="EnumUtilityTest.cs" %}
```csharp
public void TestGetEnumEntries()
{
	var entries = EnumUtility.GetEnumEntries(typeof(Gender), true);

	Assert.Equal(2, entries.Length);
	Assert.Contains(entries, entry => entry.Name == "Male");
	Assert.Contains(entries, entry => entry.Name == "Female");

	entries = EnumUtility.GetEnumEntries(typeof(Nullable<Gender>), true, null, "<Unknown>");

	Assert.Equal(3, entries.Length);
	Assert.Equal("", entries[0].Name);
	Assert.Null(entries[0].Value);
	Assert.Equal("<Unknown>", entries[0].Description);

	Assert.Contains(entries, entry => entry.Name == "Male");
	Assert.Contains(entries, entry => entry.Name == "Female");
}
```
{% endcode %}

## 相关资源

* [EnumUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/EnumUtility.cs)
* [EnumEntry.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/EnumEntry.cs)
* [EnumUtilityTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/EnumUtilityTest.cs)
