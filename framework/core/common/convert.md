---
description: Convert 类型转换和十六进制转换工具。
icon: code
---

# Convert

`Zongsoft.Common.Convert` 是框架内的增强转换工具，覆盖常规类型转换、可空类型、枚举别名、[`TimeSpan`](https://learn.microsoft.com/zh-cn/dotnet/api/system.timespan) _[源码](https://source.dot.net/#System.Private.CoreLib/TimeSpan.cs)_ 简写格式、十六进制文本和自定义转换器。

## 转换值

`ConvertValue` 支持常规类型转换、枚举别名转换、[`TimeSpan`](https://learn.microsoft.com/zh-cn/dotnet/api/system.timespan) _[源码](https://source.dot.net/#System.Private.CoreLib/TimeSpan.cs)_ 简写格式转换、自定义 [`TypeConverter`](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.typeconverter) _[源码](https://source.dot.net/#System.ComponentModel.TypeConverter/TypeConverter.cs)_。

来源：[framework/Zongsoft.Core/test/Common/ConvertTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ConvertTest.cs#L15)（节选；上下文见源文件）。

{% code title="ConvertTest.cs" %}
```csharp
Assert.Null(Zongsoft.Common.Convert.ConvertValue<int?>("", default(int?)));
Assert.Null(Zongsoft.Common.Convert.ConvertValue<int?>("x", () => default(int?)));
Assert.NotNull(Zongsoft.Common.Convert.ConvertValue<int?>("123", () => default(int?)));
Assert.Equal(123, Zongsoft.Common.Convert.ConvertValue<int?>("123", () => default(int?)));

object value = 123;
Assert.Equal(123.0f, Zongsoft.Common.Convert.ConvertValue<float>(value));
Assert.Equal(123.0d, Zongsoft.Common.Convert.ConvertValue<double>(value));
Assert.Equal(123.0m, Zongsoft.Common.Convert.ConvertValue<decimal>(value));

value = "123";
Assert.Equal(123, Zongsoft.Common.Convert.ConvertValue<int>(value));
```
{% endcode %}

`TryConvertValue` 适合不希望转换失败抛异常的场景。下面的框架测试还展示了时间跨度简写格式与类型转换的配合。

来源：[framework/Zongsoft.Core/test/Common/ConvertTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ConvertTest.cs#L33)（节选；上下文见源文件）。

{% code title="ConvertTest.cs" %}
```csharp
var duration = TimeSpan.Parse("1:20:30");
Assert.Equal(duration, Zongsoft.Common.Convert.ConvertValue<TimeSpan>("1:20:30"));
Assert.True(TimeSpanUtility.TryParse("15S", out duration));
Assert.Equal(duration, Zongsoft.Common.Convert.ConvertValue<TimeSpan>("15s"));
Assert.True(TimeSpanUtility.TryParse("20m", out duration));
Assert.Equal(duration, Zongsoft.Common.Convert.ConvertValue<TimeSpan>("20M"));
Assert.True(TimeSpanUtility.TryParse("30h", out duration));
Assert.Equal(duration, Zongsoft.Common.Convert.ConvertValue<TimeSpan>("30H"));
Assert.True(TimeSpanUtility.TryParse("40D", out duration));
Assert.Equal(duration, Zongsoft.Common.Convert.ConvertValue<TimeSpan>("40d"));
```
{% endcode %}

二进制和十六进制文本可以互转。

来源：[framework/Zongsoft.Core/test/Common/ConvertTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ConvertTest.cs#L70)（节选；上下文见源文件）。

{% code title="ConvertTest.cs" %}
```csharp
public void TestToHexString()
{
	var source = new byte[16];

	for(int i = 0; i < source.Length; i++)
		source[i] = (byte)i;

	var hexString1 = Zongsoft.Common.Convert.ToHexString(source);
	var hexString2 = Zongsoft.Common.Convert.ToHexString(source, '-');

	Assert.Equal("000102030405060708090A0B0C0D0E0F", hexString1);
	Assert.Equal("00-01-02-03-04-05-06-07-08-09-0A-0B-0C-0D-0E-0F", hexString2);

	var bytes1 = Zongsoft.Common.Convert.FromHexString(hexString1);
	var bytes2 = Zongsoft.Common.Convert.FromHexString(hexString2, '-');

	Assert.Equal(source.Length, bytes1.Length);
	Assert.Equal(source.Length, bytes2.Length);

	Assert.True(BinaryCompare(source, bytes1));
	Assert.True(BinaryCompare(source, bytes2));
}
```
{% endcode %}

{% content-ref url="enum-utility.md" %}
[enum-utility.md](enum-utility.md)
{% endcontent-ref %}

这些片段来自框架 ConvertTest。十六进制测试中的 BinaryCompare 是该测试类的辅助方法；前两个片段是方法内部节选。Discussions 自定义标签转换的实际实现可见 [TagsConverter](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Models/TagsConverter.cs)。

## 相关资源

* [Convert.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Convert.cs)
* [ConvertTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ConvertTest.cs)
