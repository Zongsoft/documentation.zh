---
description: TypeAlias 类型别名、泛型类型、可空类型和数组类型解析。
icon: book
---

# TypeAlias

`TypeAlias` 用于在类型和可读字符串之间转换。它支持内置类型别名、可空类型、数组、泛型类型、程序集简写和嵌套类型。

## 常见别名

`TypeAlias` 为常见 CLR 类型提供简短名称，例如：

| 类型 | 别名示例 |
| --- | --- |
| `System.Object` | `object` |
| `System.String` | `string` |
| `System.Int32` | `int32`、`int` |
| `System.Guid` | `guid` |
| `System.DateOnly` | `date`、`dateOnly` |
| `System.TimeOnly` | `time`、`timeOnly` |
| `System.TimeSpan` | `timeSpan` |

## 解析类型

{% code title="ParseTypeAlias.cs" %}
```csharp
using Zongsoft.Common;

var stringType = TypeAlias.Parse("string");
var nullableInt = TypeAlias.Parse("int?");
var dateArray = TypeAlias.Parse("date[]");
```
{% endcode %}

复杂类型支持泛型和程序集简写。

{% code title="ParseGenericTypeAlias.cs" %}
```csharp
var type = TypeAlias.Parse(
	"IDictionary<string, Zongsoft.Tests.Gender@Zongsoft.Core.Tests>");
```
{% endcode %}

`@AssemblyName` 是程序集名简写，等价于常见的逗号程序集限定形式。

## 生成别名

{% code title="GetTypeAlias.cs" %}
```csharp
var alias = typeof(Dictionary<string, int>).GetAlias();
Console.WriteLine(alias);
```
{% endcode %}

`GetAlias(assemblyless: true)` 可以省略程序集信息，适合只在当前上下文内展示类型名。

## 自定义别名

可以通过 `TypeAlias.Aliases.Map` 注册自定义别名。

{% code title="MapTypeAlias.cs" %}
```csharp
TypeAlias.Aliases.Map("user", typeof(User));

var type = TypeAlias.Parse("user");
```
{% endcode %}

自定义别名适合配置文件、脚本、参数包和数据模型映射中的短类型名。

## 相关资源

* [TypeAlias.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TypeAlias.cs)
* [TypeAlias.Parser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TypeAlias.Parser.cs)
* [TypeAliasTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeAliasTest.cs)
