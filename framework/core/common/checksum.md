---
description: Checksum 校验和结构的计算、解析和验证。
icon: shield
---

# Checksum

`Checksum` 表示命名哈希校验值，由算法名称和字节数组组成。它支持计算、解析、验证、字符串转换、类型转换和 JSON 序列化。

## 核心成员

| 成员 | 说明 |
| --- | --- |
| `Name` | 哈希算法名称，例如 `MD5`、`SHA256`、`SHA512`。 |
| `Value` | 校验值字节数组。 |
| `IsEmpty` | 是否为空校验值。 |
| `Compute` / `ComputeAsync` | 从字节数据或流计算校验值。 |
| `Verify` / `VerifyAsync` | 验证数据是否匹配当前校验值。 |
| `Parse` / `TryParse` | 从 `Name:Hex` 文本解析校验值。 |

## 计算校验和

{% code title="ComputeChecksum.cs" %}
```csharp
using Zongsoft.Common;

var data = Randomizer.Generate(1024);
var checksum = Checksum.Compute("SHA256", data);

Console.WriteLine(checksum); // SHA256:...
```
{% endcode %}

`Compute` 会根据名称创建哈希算法，并计算对应的校验值。

## 验证数据

{% code title="VerifyChecksum.cs" %}
```csharp
var checksum = Checksum.Compute("SHA512", data);

if(checksum.Verify(data))
	Console.WriteLine("matched");
```
{% endcode %}

流数据可以使用 `Verify(Stream)` 或 `VerifyAsync(Stream)`。

## 解析和转换

`Checksum.ToString()` 输出 `Name:Hex` 格式，`Parse` 可以还原该格式。

{% code title="ParseChecksum.cs" %}
```csharp
var text = Checksum.Compute("SHA384", data).ToString();
var checksum = Checksum.Parse(text);
```
{% endcode %}

`Checksum` 内置类型转换器和 JSON 转换器，因此可以与 `Convert` 和 `Serializer.Json` 协同使用。

## 相关资源

* [Checksum.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Checksum.cs)
* [ChecksumTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ChecksumTest.cs)
