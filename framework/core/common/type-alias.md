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

来源：[framework/Zongsoft.Core/test/Common/TypeAliasTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeAliasTest.cs#L15)（节选；上下文见源文件）。

{% code title="TypeAliasTest.cs" %}
```csharp
Assert.Same(typeof(void), TypeAlias.Parse("void"));
Assert.Same(typeof(object), TypeAlias.Parse(" object"));
Assert.Same(typeof(object[]), TypeAlias.Parse("object []"));
Assert.Same(typeof(object), TypeAlias.Parse("System.object"));
Assert.Same(typeof(object[]), TypeAlias.Parse("System.object []"));

Assert.Same(typeof(string), TypeAlias.Parse(" string "));
Assert.Same(typeof(string[]), TypeAlias.Parse("string[ ]"));
Assert.Same(typeof(string), TypeAlias.Parse("System.string"));
Assert.Same(typeof(string[]), TypeAlias.Parse("System.string [ ]"));

Assert.Same(typeof(int), TypeAlias.Parse(" int "));
Assert.Same(typeof(int), TypeAlias.Parse("int32"));
Assert.Same(typeof(int), TypeAlias.Parse("System.Int32"));
Assert.Same(typeof(int?), TypeAlias.Parse("int? "));
Assert.Same(typeof(int[]), TypeAlias.Parse("int [ ] "));
Assert.Same(typeof(int?[]), TypeAlias.Parse(" int?[]"));
```
{% endcode %}

复杂类型支持泛型和程序集简写。

来源：[framework/Zongsoft.Core/test/Common/TypeAliasTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeAliasTest.cs#L107)（节选；上下文见源文件）。

{% code title="TypeAliasTest.cs" %}
```csharp
public void TestParseNested()
{
	Assert.Same(typeof(NestedClass), TypeAlias.Parse("Zongsoft.Common.Tests.TypeAliasTest+NestedClass@Zongsoft.Core.Tests"));
	Assert.Same(typeof(NestedStruct), TypeAlias.Parse("Zongsoft.Common.Tests.TypeAliasTest+NestedStruct@Zongsoft.Core.Tests"));

	Assert.Same(typeof(NestedClass.DeepenedClass), TypeAlias.Parse("Zongsoft.Common.Tests.TypeAliasTest+NestedClass+DeepenedClass@Zongsoft.Core.Tests"));
	Assert.Same(typeof(NestedClass.DeepenedStruct), TypeAlias.Parse("Zongsoft.Common.Tests.TypeAliasTest+NestedClass+DeepenedStruct@Zongsoft.Core.Tests"));

	Assert.Same(typeof(NestedStruct.DeepenedClass), TypeAlias.Parse("Zongsoft.Common.Tests.TypeAliasTest+NestedStruct+DeepenedClass@Zongsoft.Core.Tests"));
	Assert.Same(typeof(NestedStruct.DeepenedStruct), TypeAlias.Parse("Zongsoft.Common.Tests.TypeAliasTest+NestedStruct+DeepenedStruct@Zongsoft.Core.Tests"));
}
```
{% endcode %}

`@AssemblyName` 是程序集名简写，等价于常见的逗号程序集限定形式。

## 生成别名

来源：[framework/Zongsoft.Core/test/Common/TypeAliasTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeAliasTest.cs#L120)（节选；上下文见源文件）。

{% code title="TypeAliasTest.cs" %}
```csharp
public void TestGetAlias()
{
	Assert.Equal("object", TypeAlias.GetAlias(typeof(object)), true);
	Assert.Equal("object[]", TypeAlias.GetAlias(typeof(object[])), true);
	Assert.Equal("DBNull", TypeAlias.GetAlias(typeof(DBNull)), true);
	Assert.Equal("DBNull[]", TypeAlias.GetAlias(typeof(DBNull[])), true);

	Assert.Equal("void", TypeAlias.GetAlias(typeof(void)), true);
	Assert.Equal("string", TypeAlias.GetAlias(typeof(string)), true);
	Assert.Equal("string[]", TypeAlias.GetAlias(typeof(string[])), true);

	Assert.Equal("int32", TypeAlias.GetAlias(typeof(int)), true);
	Assert.Equal("int32?", TypeAlias.GetAlias(typeof(int?)), true);
	Assert.Equal("int32[]", TypeAlias.GetAlias(typeof(int[])), true);
	Assert.Equal("int32?[]", TypeAlias.GetAlias(typeof(int?[])), true);

	Assert.Equal("Single", TypeAlias.GetAlias(typeof(float)), true);
	Assert.Equal("Single?", TypeAlias.GetAlias(typeof(float?)), true);
	Assert.Equal("Single[]", TypeAlias.GetAlias(typeof(float[])), true);
	Assert.Equal("Single?[]", TypeAlias.GetAlias(typeof(float?[])), true);

	Assert.Equal("Date", TypeAlias.GetAlias(typeof(DateOnly)), true);
	Assert.Equal("Date?", TypeAlias.GetAlias(typeof(DateOnly?)), true);
	Assert.Equal("date[]", TypeAlias.GetAlias(typeof(DateOnly[])), true);
	Assert.Equal("date?[]", TypeAlias.GetAlias(typeof(DateOnly?[])), true);

	Assert.Equal("Range<Timestamp>", TypeAlias.GetAlias(typeof(Zongsoft.Data.Range<DateTimeOffset>)), true);
	Assert.Equal("Range<Timestamp>?", TypeAlias.GetAlias(typeof(Zongsoft.Data.Range<DateTimeOffset>?)), true);
	Assert.Equal("Range<Timestamp>[]", TypeAlias.GetAlias(typeof(Zongsoft.Data.Range<DateTimeOffset>[])), true);
	Assert.Equal("Range<Timestamp>?[]", TypeAlias.GetAlias(typeof(Zongsoft.Data.Range<DateTimeOffset>?[])), true);

	Assert.Equal("Zongsoft.Tests.Gender@Zongsoft.Core.Tests", TypeAlias.GetAlias(typeof(Gender)), true);
	Assert.Equal("Zongsoft.Tests.Gender?@Zongsoft.Core.Tests", TypeAlias.GetAlias(typeof(Gender?)), true);
	Assert.Equal("Zongsoft.Tests.Gender[]@Zongsoft.Core.Tests", TypeAlias.GetAlias(typeof(Gender[])), true);
	Assert.Equal("Zongsoft.Tests.Gender?[]@Zongsoft.Core.Tests", TypeAlias.GetAlias(typeof(Gender?[])), true);

	Assert.Equal("IEnumerable<Zongsoft.Tests.Gender@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IEnumerable<Gender>)), true);
	Assert.Equal("IEnumerable<Zongsoft.Tests.Gender?@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IEnumerable<Gender?>)), true);
	Assert.Equal("IEnumerable<Zongsoft.Tests.Gender[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IEnumerable<Gender[]>)), true);
	Assert.Equal("IEnumerable<Zongsoft.Tests.Gender?[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IEnumerable<Gender?[]>)), true);

	Assert.Equal("List<Zongsoft.Tests.Gender@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(List<Gender>)), true);
	Assert.Equal("List<Zongsoft.Tests.Gender?@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(List<Gender?>)), true);
	Assert.Equal("List<Zongsoft.Tests.Gender[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(List<Gender[]>)), true);
	Assert.Equal("List<Zongsoft.Tests.Gender?[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(List<Gender?[]>)), true);

	Assert.Equal("IDictionary<String, Zongsoft.Tests.Gender@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IDictionary<string, Gender>)), true);
	Assert.Equal("IDictionary<String, Zongsoft.Tests.Gender?@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IDictionary<string, Gender?>)), true);
	Assert.Equal("IDictionary<String, Zongsoft.Tests.Gender[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IDictionary<string, Gender[]>)), true);
	Assert.Equal("IDictionary<String, Zongsoft.Tests.Gender?[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(IDictionary<string, Gender?[]>)), true);

	Assert.Equal("Dictionary<Range<DateTime>, Zongsoft.Tests.Gender@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(Dictionary<Zongsoft.Data.Range<DateTime>, Gender>)), true);
	Assert.Equal("Dictionary<Range<DateTime>?, Zongsoft.Tests.Gender?@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(Dictionary<Zongsoft.Data.Range<DateTime>?, Gender?>)), true);
	Assert.Equal("Dictionary<Range<DateTime>[], Zongsoft.Tests.Gender[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(Dictionary<Zongsoft.Data.Range<DateTime>[], Gender[]>)), true);
	Assert.Equal("Dictionary<Range<DateTime>?[], Zongsoft.Tests.Gender?[]@Zongsoft.Core.Tests>", TypeAlias.GetAlias(typeof(Dictionary<Zongsoft.Data.Range<DateTime>?[], Gender?[]>)), true);

	var tupleType = typeof(Tuple<ValueTuple<Zongsoft.Data.Range<int>>, ValueTuple<Zongsoft.Data.Range<DateTime>?>, ValueTuple<Zongsoft.Data.Range<DateTime>[]>, ValueTuple<Zongsoft.Data.Range<DateTime>?[]>>);
	var tupleAlias = "Tuple<ValueTuple<Range<Int32>>, ValueTuple<Range<DateTime>?>, ValueTuple<Range<DateTime>[]>, ValueTuple<Range<DateTime>?[]>>";
	Assert.Equal(tupleAlias, tupleType.GetAlias());

	tupleType = typeof(ValueTuple<string, DateOnly?, byte[], Guid?[], Zongsoft.Data.Range<DateTime>?[], Zongsoft.Data.ConditionOperator?[]>);
	tupleAlias = "ValueTuple<String, Date?, Byte[], Guid?[], Range<DateTime>?[], Zongsoft.Data.ConditionOperator?[]@Zongsoft.Core>";
	Assert.Equal(tupleAlias, tupleType.GetAlias());

	tupleType = typeof(Nullable<>).MakeGenericType(tupleType);
	tupleAlias += '?';
	Assert.Equal(tupleAlias, tupleType.GetAlias());

	tupleType = tupleType.MakeArrayType();
	tupleAlias += "[]";
	Assert.Equal(tupleAlias, tupleType.GetAlias());
}
```
{% endcode %}

`GetAlias(assemblyless: true)` 可以省略程序集信息，适合只在当前上下文内展示类型名。

## 自定义别名

可以通过 `TypeAlias.Aliases.Map` 注册自定义别名。

自定义映射应通过 TypeAlias.Aliases 的注册契约维护。当前业务案例没有注册自定义类型别名；请结合 [TypeAlias 源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TypeAlias.cs) 核对映射名称与类型解析范围。

自定义别名适合配置文件、脚本、参数包和数据模型映射中的短类型名。

这里采用框架 TypeAliasTest 中的实际断言，Zongsoft.Tests 类型来自测试项目。不要把测试程序集名复制到论坛的业务类型配置中。

## 相关资源

* [TypeAlias.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TypeAlias.cs)
* [TypeAlias.Parser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/TypeAlias.Parser.cs)
* [TypeAliasTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/TypeAliasTest.cs)
