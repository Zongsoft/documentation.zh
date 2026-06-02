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

{% code title="BitVectorSample.cs" %}
```csharp
using Zongsoft.Common;

BitVector32 vector = 1;

Console.WriteLine(vector[1]); // true
Console.WriteLine(vector[2]); // false

vector[4] = true;
Console.WriteLine(vector.Data); // 5
```
{% endcode %}

`BitVector64` 可从 `BitVector32` 隐式转换，适合需要更多标志位的场景。

{% hint style="info" %}
`BitVector32` 和 `BitVector64` 更关注紧凑存储；如果要表达固定层级编码，请使用 [HierarchyVector32](hierarchy-vector32.md)。
{% endhint %}

## 相关资源

* [BitVector32.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/BitVector32.cs)
* [BitVector64.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/BitVector64.cs)
