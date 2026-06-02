---
description: Randomizer 随机数据生成工具。
icon: rotate
---

# Randomizer

`Randomizer` 使用加密随机源生成随机字节、整数、密钥字符串和普通随机字符串。

{% code title="Randomizer.cs" %}
```csharp
var bytes = Randomizer.Generate(32);
var number = Randomizer.GenerateInt32();
var secret = Randomizer.GenerateSecret(24);
var digits = Randomizer.GenerateString(6, digitOnly: true);
var text = Randomizer.GenerateString(12);
```
{% endcode %}

## 常用方法

| 方法 | 说明 |
| --- | --- |
| `Generate(length)` | 生成指定长度的随机字节数组。 |
| `GenerateInt16` / `GenerateInt32` / `GenerateInt64` | 生成有符号随机整数。 |
| `GenerateUInt16` / `GenerateUInt32` / `GenerateUInt64` | 生成无符号随机整数。 |
| `GenerateSecret` | 生成密钥风格字符串。 |
| `GenerateString` | 生成普通随机字符串，可限定为数字。 |

`GenerateSecret` 适合令牌、临时密钥和验证码种子；`GenerateString` 更适合测试数据或显示用途。

## 相关资源

* [Randomizer.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Randomizer.cs)
* [RandomizerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/RandomizerTest.cs)
