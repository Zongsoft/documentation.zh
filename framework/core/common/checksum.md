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

本页使用框架 ChecksumTest 的现有测试；共享字段 _data 由该测试类生成 1024 字节数据，断言用于明确预期结果。Discussions 当前没有直接使用 Checksum。

## 计算校验和

来源：[framework/Zongsoft.Core/test/Common/ChecksumTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ChecksumTest.cs#L71)（节选；上下文见源文件）。

{% code title="ChecksumTest.cs" %}
```csharp
public void Compute()
{
	var checksum1 = Checksum.Compute("SHA256", _data);
	Assert.False(checksum1.IsEmpty);
	Assert.False(checksum1.Value.IsEmpty);
	Assert.Equal("SHA256", checksum1.Name, true);
	Assert.Equal(SHA256.HashSizeInBytes, checksum1.Value.Length);
	Assert.NotEmpty(checksum1.ToString());
	Assert.StartsWith("SHA256:", checksum1.ToString());

	var checksum2 = new Checksum(SHA256.HashData(_data));
	Assert.False(checksum2.IsEmpty);
	Assert.False(checksum2.Value.IsEmpty);
	Assert.Equal("SHA256", checksum2.Name, true);
	Assert.Equal(SHA256.HashSizeInBytes, checksum2.Value.Length);
	Assert.NotEmpty(checksum2.ToString());
	Assert.StartsWith("SHA256:", checksum2.ToString());

	Assert.Equal(checksum1.Name, checksum2.Name, true);
	Assert.True(checksum1.Value.Span.SequenceEqual(checksum2.Value.Span));
	Assert.Equal(checksum1, checksum2);
}
```
{% endcode %}

`Compute` 会根据名称创建哈希算法，并计算对应的校验值。

## 验证数据

来源：[framework/Zongsoft.Core/test/Common/ChecksumTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ChecksumTest.cs#L111)（节选；上下文见源文件）。

{% code title="ChecksumTest.cs" %}
```csharp
public void Verify()
{
	var checksum = Checksum.Compute("SHA3-512", _data);
	Assert.False(checksum.IsEmpty);
	Assert.False(checksum.Value.IsEmpty);

	var data = new byte[_data.Length];
	Array.Copy(_data, data, data.Length);

	Assert.True(checksum.Verify(data));
	Assert.True(checksum.Verify(_data));
	Assert.False(checksum.Verify(Randomizer.Generate(512)));
	Assert.False(checksum.Verify(Randomizer.Generate(data.Length)));
}
```
{% endcode %}

流数据可以使用 `Verify(Stream)` 或 `VerifyAsync(Stream)`。

## 解析和转换

`Checksum.ToString()` 输出 `Name:Hex` 格式，`Parse` 可以还原该格式。

来源：[framework/Zongsoft.Core/test/Common/ChecksumTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ChecksumTest.cs#L95)（节选；上下文见源文件）。

{% code title="ChecksumTest.cs" %}
```csharp
public void Parse()
{
	var checksum = Checksum.Compute("SHA512", _data);
	Assert.False(checksum.IsEmpty);
	Assert.False(checksum.Value.IsEmpty);
	Assert.Equal("SHA512", checksum.Name, true);
	Assert.Equal(SHA512.HashSizeInBytes, checksum.Value.Length);
	Assert.NotEmpty(checksum.ToString());
	Assert.StartsWith("SHA512:", checksum.ToString());

	var result = Checksum.Parse(checksum.ToString());
	Assert.False(result.IsEmpty);
	Assert.Equal(checksum, result);
}
```
{% endcode %}

`Checksum` 内置类型转换器和 JSON 转换器，因此可以与 `Convert` 和 `Serializer.Json` 协同使用。

## 相关资源

* [Checksum.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Checksum.cs)
* [ChecksumTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ChecksumTest.cs)
