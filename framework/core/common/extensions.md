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

来源：[framework/Zongsoft.Core/test/Common/StringExtensionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/StringExtensionTest.cs#L44)（节选；上下文见源文件）。

{% code title="StringExtensionTest.cs" %}
```csharp
public void TestSlice()
{
	var parts = StringExtension.Slice("a - b --  c  ", '-').ToArray();

	Assert.NotEmpty(parts);
	Assert.Equal(3, parts.Length);
	Assert.Equal("a", parts[0]);
	Assert.Equal("b", parts[1]);
	Assert.Equal("c", parts[2]);

	var hasColon = false;
	parts = StringExtension.Slice("issue-100-park:10001-1", chr => hasColon ? false : !(hasColon = chr == ':') && chr == '-').ToArray();

	Assert.NotEmpty(parts);
	Assert.Equal(3, parts.Length);
	Assert.Equal("issue", parts[0]);
	Assert.Equal("100", parts[1]);
	Assert.Equal("park:10001-1", parts[2]);
}
```
{% endcode %}

上面直接引用 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的分片测试，覆盖空白、连续分隔符和带状态的分隔判断。RemoveAny、Trim、IsDigits 的实际输入与断言也在同一文件。`Slice` 会忽略空白分片，适合解析简单分隔文本。

## 时间扩展

`TimeSpanUtility` 支持 `ms`、`s`、`m`、`h`、`d` 等简写格式，也支持标准时间格式。

来源：[framework/Zongsoft.Core/test/Common/TimeSpanTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TimeSpanTest.cs#L10)（节选；上下文见源文件）。

{% code title="TimeSpanTest.cs" %}
```csharp
public void Clamp()
{
	var minimum = TimeSpan.FromHours(1);
	var maximum = TimeSpan.FromHours(12);

	var duration = TimeSpanUtility.Clamp(new TimeSpan(0, 2, 30, 59), minimum, maximum);
	Assert.Equal(new TimeSpan(0, 2, 30, 59), duration);

	duration = TimeSpanUtility.Clamp(TimeSpan.Zero, minimum, maximum);
	Assert.Equal(minimum, duration);
	duration = TimeSpanUtility.Clamp(TimeSpan.MinValue, minimum, maximum);
	Assert.Equal(minimum, duration);
	duration = TimeSpanUtility.Clamp(new TimeSpan(0, 0, 30, 40), minimum, maximum);
	Assert.Equal(minimum, duration);

	duration = TimeSpanUtility.Clamp(TimeSpan.MaxValue, minimum, maximum);
	Assert.Equal(maximum, duration);
	duration = TimeSpanUtility.Clamp(new TimeSpan(1, 0, 0, 1), minimum, maximum);
	Assert.Equal(maximum, duration);
}
```
{% endcode %}

`DateTimeExtension.GetElapsed` 可以计算从某个时间点到现在的耗时。Discussions 的文件上传控制器以千年纪元至今的天数加随机串生成文件名；下列是 UploadAsync 回调参数片段，完整方法见源码链接。这个日期差使用墙上时钟，测量代码执行耗时应使用专门的计时工具。

来源：[src/api/Controllers/FileController.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Controllers/FileController.cs#L81)（节选；上下文见源文件）。

{% code title="FileController.cs" %}
```csharp
  args => args.FileName = $"{Timestamp.Millennium.Epoch.GetElapsed().Days}-{Randomizer.GenerateString()}", cancellation);
```
{% endcode %}

## 类型扩展

`TypeExtension` 提供比 `Type.IsAssignableFrom` 更灵活的泛型判断能力。

来源：[framework/Zongsoft.Core/test/Common/TypeExtensionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeExtensionTest.cs#L14)（节选；上下文见源文件）。

{% code title="TypeExtensionTest.cs" %}
```csharp
public void TestIsAssignableFrom()
{
	var baseType = typeof(ICollection<Person>);
	var instanceType = typeof(Collection<Person>);

	Assert.True(TypeExtension.IsAssignableFrom(baseType, instanceType));
	Assert.True(baseType.IsAssignableFrom(instanceType));

	baseType = typeof(ICollection<>);

	Assert.True(TypeExtension.IsAssignableFrom(baseType, instanceType));
	Assert.False(baseType.IsAssignableFrom(instanceType));

	Assert.True(TypeExtension.IsAssignableFrom(typeof(IService<>), typeof(EmployeeService)));
	Assert.True(TypeExtension.IsAssignableFrom(typeof(PersonServiceBase<>), typeof(EmployeeService)));

	Assert.True(TypeExtension.IsAssignableFrom(typeof(IService<>), typeof(EmployeeService), out var genericTypes));
	Assert.NotEmpty(genericTypes);
	Assert.Single(genericTypes);
	Assert.Same(genericTypes[0], typeof(IService<Employee>));

	Assert.True(TypeExtension.IsAssignableFrom(typeof(PersonServiceBase<>), typeof(EmployeeService), out genericTypes));
	Assert.NotEmpty(genericTypes);
	Assert.Single(genericTypes);
	Assert.Same(genericTypes[0], typeof(PersonServiceBase<Employee>));
}
```
{% endcode %}

上面来自 TypeExtensionTest，所用集合类型都是测试输入；可复用完整测试来核对泛型匹配行为。它还可以判断集合、列表、字典、哈希集、数值类型、可空类型和标量类型。

## URI 扩展

Discussions 与框架项目中暂未找到该扩展的调用用例。[UriExtension 的实现](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/UriExtension.cs)按 & 和 = 拆分 Query，并忽略键名大小写；它没有完整的 URI 解码流程，也没有主动移除 Query 首部的问号。Web 请求应优先使用框架控制器的请求查询集合，避免将此工具当成完整的 URL 参数解析器。

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
