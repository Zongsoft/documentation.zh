---
description: Convert 类型转换和十六进制转换工具。
icon: code
---

# Convert

`Zongsoft.Common.Convert` 是框架内的增强转换工具，覆盖常规类型转换、可空类型、枚举别名、`TimeSpan` 简写格式、十六进制文本和自定义转换器。

## 转换值

`ConvertValue` 支持常规类型转换、枚举别名转换、`TimeSpan` 简写格式转换、自定义 `TypeConverter`。

{% code title="ConvertValue.cs" %}
```csharp
using Zongsoft.Common;

var number = Convert.ConvertValue<int>("123");
var duration = Convert.ConvertValue<TimeSpan>("15s");
var nullable = Convert.ConvertValue<int?>("", default(int?));
```
{% endcode %}

`TryConvertValue` 适合不希望转换失败抛异常的场景。

{% code title="TryConvertValue.cs" %}
```csharp
if(Convert.TryConvertValue<int>("100", out var value))
	Console.WriteLine(value);
```
{% endcode %}

二进制和十六进制文本可以互转。

{% code title="HexConvert.cs" %}
```csharp
var bytes = new byte[] { 0, 1, 2, 3 };

var text = Convert.ToHexString(bytes, '-');
var result = Convert.FromHexString(text, '-');
```
{% endcode %}

{% content-ref url="enum-utility.md" %}
[enum-utility.md](enum-utility.md)
{% endcontent-ref %}

## 相关资源

* [Convert.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Convert.cs)
* [ConvertTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ConvertTest.cs)
