---
description: ArrayExtension、StringExtension、DateTimeExtension、TimeSpanUtility、TypeExtension、UriExtension 常用扩展。
icon: wrench
---

# 常用扩展

`Zongsoft.Common` 提供一组常用扩展方法，用于数组、字符串、时间、类型和 URI 的日常处理。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `ArrayExtension` | 数组空值判断和按运行时类型创建空数组。 |
| `StringExtension` | 字符移除、字符串修剪、数字检测、脱敏、分片解析。 |
| `DateTimeExtension` | 时间重置、耗时计算。 |
| `TimeSpanUtility` | 时间间隔解析、限制到指定范围。 |
| `TypeExtension` | 类型兼容性、泛型定义、集合类型、标量类型、默认值等判断。 |
| `UriExtension` | 从 URL 查询字符串读取指定键。 |

## 字符串扩展

{% code title="StringExtensionSample.cs" %}
```csharp
using Zongsoft.Common;

var file = "Read^me??.txt".RemoveAny('?', '^');
var text = "PrefixContentSuffix".Trim("Prefix", "Suffix");

if(" 123 ".IsDigits(out var digits))
	Console.WriteLine(digits);

foreach(var part in "a - b -- c".Slice('-'))
	Console.WriteLine(part);
```
{% endcode %}

`Slice` 会忽略空白分片，适合解析简单分隔文本。

## 时间扩展

`TimeSpanUtility` 支持 `ms`、`s`、`m`、`h`、`d` 等简写格式，也支持标准时间格式。

{% code title="TimeSpanUtilitySample.cs" %}
```csharp
var delay = TimeSpanUtility.Parse("500ms");
var timeout = TimeSpanUtility.Parse("1.5h");

var clamped = timeout.Clamp(
	TimeSpan.FromMinutes(1),
	TimeSpan.FromHours(2));
```
{% endcode %}

`DateTimeExtension.GetElapsed` 可以计算从某个时间点到现在的耗时。

{% code title="DateTimeElapsed.cs" %}
```csharp
var start = DateTime.UtcNow;

// ...

var elapsed = start.GetElapsed();
```
{% endcode %}

## 类型扩展

`TypeExtension` 提供比 `Type.IsAssignableFrom` 更灵活的泛型判断能力。

{% code title="TypeExtensionSample.cs" %}
```csharp
var matched = typeof(ICollection<>).IsAssignableFrom(
	typeof(Collection<string>),
	out var genericTypes);

var elementType = typeof(List<int>).GetElementType();
var defaultValue = typeof(int).GetDefaultValue();
```
{% endcode %}

它还可以判断集合、列表、字典、哈希集、数值类型、可空类型和标量类型。

## URI 扩展

{% code title="UriExtensionSample.cs" %}
```csharp
var url = new Uri("https://example.com/search?q=zongsoft&page=1");

if(url.TryGetQueryString("q", out var keyword))
	Console.WriteLine(keyword);
```
{% endcode %}

## 相关资源

* [ArrayExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/ArrayExtension.cs)
* [StringExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/StringExtension.cs)
* [DateTimeExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/DateTimeExtension.cs)
* [TimeSpanUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TimeSpanUtility.cs)
* [TypeExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TypeExtension.cs)
* [UriExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/UriExtension.cs)
* [StringExtensionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/StringExtensionTest.cs)
* [TimeSpanTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimeSpanTest.cs)
* [TypeExtensionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeExtensionTest.cs)
