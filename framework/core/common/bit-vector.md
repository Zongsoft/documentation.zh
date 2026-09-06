---
description: BitVector32 和 BitVector64 位标记结构。
icon: code
---

# BitVector

`BitVector32` 和 `BitVector64` 用于把多个布尔状态压缩到一个整数值中，适合保存标志位、状态位和权限位这类低成本标记。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `BitVector32` | 使用 32 位整数保存一组位标记。 |
| `BitVector64` | 使用 64 位整数保存一组位标记。 |

## BitVector32 和 BitVector64

位向量可以把多个布尔状态压缩到一个整数中。索引器中的 `bit` 参数表示位掩码，不是从零开始的序号。

来源：[framework/Zongsoft.Core/test/Common/ConvertTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/ConvertTest.cs#L94)（节选；上下文见源文件）。

{% code title="ConvertTest.cs" %}
```csharp
public void TestBitVector32()
{
	Zongsoft.Common.BitVector32 vector = 1;

	Assert.Equal(1, vector.Data);
	Assert.True(vector[1]);
	Assert.False(vector[2]);
	Assert.False(vector[3]);
	Assert.False(vector[4]);
	Assert.False(vector[5]);

	vector[5] = true;
	Assert.Equal(5, vector.Data);
	Assert.True(vector[1]);
	Assert.False(vector[2]);
	Assert.False(vector[3]);
	Assert.True(vector[4]);
	Assert.True(vector[5]);
}
```
{% endcode %}

`BitVector64` 可从 `BitVector32` 隐式转换，适合需要更多标志位的场景。

{% hint style="info" %}
`BitVector32` 和 `BitVector64` 更关注紧凑存储；如果要表达固定层级编码，请使用 [HierarchyVector32](hierarchy-vector32.md)。
{% endhint %}

以上是框架 ConvertTest 的原始位向量测试；数值表示位掩码，不能把索引参数直接理解为从零开始的位序号。Discussions 没有直接调用此结构。

## 相关资源

* [BitVector32.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/BitVector32.cs)
* [BitVector64.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/BitVector64.cs)
