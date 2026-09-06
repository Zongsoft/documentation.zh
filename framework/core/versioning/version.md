---
description: Zongsoft.Versioning 命名空间中的语义化版本与数值版本号。
icon: code-commit
---

# Zongsoft.Versioning

`Zongsoft.Versioning` 提供 [Zongsoft.Core](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 中的版本表达模型。它把“用于发布、展示和兼容性判断的语义化版本”和“用于排序、范围查询和持久化的数值版本号”分开，避免同一个类型同时承担文本语义和整数编码两种职责。

## 何时使用

`Version` 表示语义化版本，格式为 `major.minor.patch-label+extra`。它适合描述应用、模块、协议或包的公开版本，例如 `1.2.3`、`1.2.3-alpha.1`、`1.2.3-alpha.1+build.5`。

`Version.Number` 表示四段式数值版本号，包含 `Major`、`Minor`、`Patch`、`Revision` 四个 `ushort` 字段。它适合保存到数据库、配置项或需要稳定排序的持久化字段中，也可以与旧的整数版本值协作。

Discussions 没有直接操作此版本类型；下面采用 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的 VersionTest 和 VersionNumberTest，保留测试输入及输出断言。它们验证版本规则，不表示 Discussions 当前包版本。

## 语义化版本

`Version` 是引用类型，构造时必须提供非负的 `Major`、`Minor` 和 `Patch`。`Label` 和 `Extra` 会去掉首尾空白；空白值会视为没有标签或额外信息。

来源：[framework/Zongsoft.Core/test/Versioning/VersionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Versioning/VersionTest.cs#L94)（节选；上下文见源文件）。

{% code title="VersionTest.cs" %}
```csharp
public void TestFormat()
{
	var version = new Version(1, 2, 3, "alpha.1", "build.5");

	Assert.Equal("1.2.3-alpha.1", version.ToString());
	Assert.Equal("1.2.3-alpha.1", version.ToString("N"));
	Assert.Equal("1.2.3-alpha.1+build.5", version.ToString("F"));
	Assert.Equal("1.2.3", version.ToString("V"));
	Assert.Equal("alpha.1", version.ToString("R"));
	Assert.Equal("build.5", version.ToString("M"));
	Assert.Equal("1.2.3.0", version.ToString("x.y.z.r"));
}
```
{% endcode %}

解析要求数字部分正好三段，并遵循语义化版本的基本约束：数字段不能带前导零；标签和额外信息由点分隔的标识符组成，标识符只能包含字母、数字和连字符；标签中的纯数字标识符不能带前导零。额外信息允许类似 `build.01` 这样的内容。

比较时先比较 `Major`、`Minor`、`Patch`。数字相同时，没有 `Label` 的稳定版本高于有 `Label` 的预发布版本；标签按点分段比较，数字标识符按数值比较，数字标识符低于非数字标识符，文本比较忽略大小写。`Extra` 只作为构建或附加信息输出，不参与相等性和大小比较。

| 成员 | 说明 |
| --- | --- |
| `Major`、`Minor`、`Patch` | 语义化版本的三段数字。 |
| `Label` | 预发布标签，对应语义化版本中的 `-alpha.1`。 |
| `Extra` | 额外信息，对应语义化版本中的 `+build.5`。 |
| `HasLabel()` / `HasExtra()` | 判断并读取可选的标签或额外信息。 |
| `Parse(...)` / `TryParse(...)` | 从文本解析 `Version`。 |
| `CompareTo(...)` | 按语义化版本优先级比较。 |
| `ToString(format)` | 按格式字符输出不同形态的版本文本。 |

### 格式化

`Version.ToString()` 默认等同于 `ToString("N")`，会输出数字版本和预发布标签，但不输出 `Extra`。如果需要保留构建信息，应使用 `ToString("F")`。

| 格式 | 输出 |
| --- | --- |
| `N` | 规范化版本：`1.2.3` 或 `1.2.3-alpha.1`。 |
| `V` | 仅数字版本：`1.2.3`。 |
| `F` | 完整版本：`1.2.3-alpha.1+build.5`。 |
| `R` / `L` | 仅标签。 |
| `M` / `E` | 仅额外信息。 |
| `x`、`y`、`z` | 分别输出主版本、次版本和修订号。 |
| `r` | 保留的第四段，当前恒为 `0`。 |

{% hint style="warning" %}
`Version` 的 JSON 转换器会写出 `ToString("F")`，因此会保留 `Extra`；类型转换器转换为字符串时使用默认 `ToString()`，不会输出 `Extra`。
{% endhint %}

## 数值版本号

`Version.Number` 是值类型，保留旧四段式版本值的使用场景。它可以从 `1.2`、`1.2.3`、`1.2.3.4` 解析；缺失的 `Patch` 或 `Revision` 会补为 `0`，但不支持单段版本和超过 `ushort` 范围的版本段。

来源：[framework/Zongsoft.Core/test/Versioning/VersionNumberTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Versioning/VersionNumberTest.cs#L172)（节选；上下文见源文件）。

{% code title="VersionNumberTest.cs" %}
```csharp
public void TestNumericConversion()
{
	var version = new Version.Number(1, 2, 3, 4);
	const ulong Packed = 0x0001_0002_0003_0004UL;

	Assert.Equal(Packed, (ulong)version);
	Assert.Equal((long)Packed, (long)version);
	Assert.Equal(version, (Version.Number)Packed);
	Assert.Equal(version, (Version.Number)(long)Packed);

	version = new Version.Number(ushort.MaxValue, ushort.MaxValue, ushort.MaxValue, ushort.MaxValue);
	Assert.Equal(ulong.MaxValue, (ulong)version);
	Assert.Equal(-1L, (long)version);
	Assert.Equal(version, (Version.Number)(-1L));
}
```
{% endcode %}

整数形式按 `Major`、`Minor`、`Patch`、`Revision` 四个 `ushort` 依次打包到 64 位无符号整数中，因此数值排序、版本比较和持久化结果可以保持一致。`Version.Number` 也支持与 `long`、`ulong`、`System.Version` 隐式转换，便于兼容旧数据和 .NET 标准版本类型。

| 能力 | 说明 |
| --- | --- |
| `IsZero` | 判断是否为 `0.0.0.0`。 |
| `Parse(...)` / `TryParse(...)` | 从二段、三段或四段数字文本解析。 |
| 比较运算符 | 支持 `==`、`!=`、`>`、`>=`、`<`、`<=`。 |
| 整数转换 | 可隐式转换为 `ulong`、`long`，也可从这两种整数恢复。 |
| `System.Version` 转换 | 可与 `System.Version` 互转；没有修订号时输出三段 `System.Version`。 |
| JSON 转换 | 写出字符串形式；读取时支持字符串版本号，也支持 64 位整数。 |

{% hint style="warning" %}
`Version.Number` 每段最大值为 `65535`。如果版本需要预发布标签、构建元数据或超过该范围的数字段，应使用 `Version` 或专门的版本模型，而不是把这些信息塞进四段数字中。
{% endhint %}

## 迁移建议

旧代码如果只是比较 `1.2.3.4` 这类四段数字，或者依赖整数持久化，通常只需要把命名空间和类型改为 `Zongsoft.Versioning.Version.Number`。

上面的 TestNumericConversion 就是整数往返兼容用例；跨旧版本迁移时，使用现有持久化值验证每一段恢复结果，再决定是否调整字段类型。

如果旧字段原本保存的是面向用户的发布版本，且需要表达 `alpha`、`beta`, `preview`、`rc` 或构建信息，建议改用 `Version`，并明确是否需要把 `Extra` 写入序列化结果。

## 参考实现

* [Version.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Versioning/Version.cs)
* [Version.Number.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Versioning/Version.Number.cs)
* [VersionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Versioning/VersionTest.cs)
* [VersionNumberTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Versioning/VersionNumberTest.cs)
