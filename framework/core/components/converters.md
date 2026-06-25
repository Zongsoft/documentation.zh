---
description: Zongsoft.Components.Converters 常用类型转换器。
icon: repeat
---

# Converters

`Zongsoft.Components.Converters` 提供组件层常用类型转换器，主要服务于配置绑定、插件构件属性解析、命令选项绑定和序列化协作。

这些转换器的目标不是替代业务解析逻辑，而是让外部文本配置更接近人类书写习惯，同时保持运行时对象仍是明确类型。

## 转换器列表

| 转换器 | 说明 |
| --- | --- |
| `ArchitectureConverter` | 在文本和处理器架构枚举之间转换。 |
| `BooleanConverter` | 布尔值转换，适合兼容多种文本表示。 |
| `CollectionConverter` | 集合转换器，用于把文本或对象转换为目标集合。 |
| `CollectionConverter<TElementConverter>` | 为集合元素指定转换器的集合转换器。 |
| `EncodingConverter` | 字符编码转换器，例如从 `utf-8` 转为 `Encoding.UTF8`。 |
| `EndpointConverter` | 网络端点转换器。 |
| `EnumConverter` | 枚举转换器。 |
| `GuidConverter` | GUID 转换器。 |
| `TimeSpanConverter` | 时间间隔转换器，支持命令选项和配置中的时间表达。 |

## 使用位置

* 插件文件中的构件属性。
* 选项配置文件中的复杂值。
* 命令行选项绑定，例如 `--timeout:5s`。
* JSON、类型描述器或配置绑定需要文本与对象互转的地方。

{% code title="命令选项中的 TimeSpan" %}
```csharp
[CommandOption("timeout", 't', typeof(TimeSpan), "1s")]
public sealed class ShellCommand : CommandBase<CommandContext>
{
}
```
{% endcode %}

`BooleanConverter` 会兼容 `1`、`0`、`on`、`off`、`yes`、`no`、`enable`、`disable` 等常见写法；`TimeSpanConverter` 则委托通用时间间隔解析工具处理文本。具体格式应以对应转换器源码和调用方配置约定为准。

## 集合转换

`CollectionConverter` 适合把连接字符串、插件属性或命令选项中的单个文本值解析成数组或泛型集合。默认分隔符包括 `|`、`;`、`,` 和换行；解析时会去除空白项并裁剪每个元素两端的空白。写回字符串时使用第一个分隔符连接元素。

如果目标类型是数组，转换器会创建对应元素类型的数组；如果目标类型是抽象集合类型，则会创建 `System.Collections.Generic.List<T>`；如果目标类型是具体集合类型，则会创建该集合并逐项添加元素。

{% code title="CollectionConverter.cs" %}
```csharp
using System;
using System.ComponentModel;
using System.Globalization;

using Zongsoft.Components.Converters;

public sealed class MappingOptions
{
	[TypeConverter(typeof(CollectionConverter<MappingEntryConverter>))]
	public MappingEntry[] Mapping { get; set; }
}

public readonly struct MappingEntry(string source, string target = null)
{
	public readonly string Source = source ?? target;
	public readonly string Target = target ?? source;
}

public sealed class MappingEntryConverter : TypeConverter
{
	public override bool CanConvertFrom(ITypeDescriptorContext context, Type sourceType) =>
		sourceType == typeof(string) || base.CanConvertFrom(context, sourceType);

	public override object ConvertFrom(ITypeDescriptorContext context, CultureInfo culture, object value)
	{
		if(value is not string text)
			return base.ConvertFrom(context, culture, value);

		var index = text.IndexOfAny([':', '=']);
		return index < 0 ?
			new MappingEntry(text.Trim()) :
			new MappingEntry(text[..index].Trim(), text[(index + 1)..].Trim());
	}
}
```
{% endcode %}

上面的声明允许把 `mapping=s1:t1,s2=t2,same` 解析成三个 `MappingEntry` 元素：`s1 -> t1`、`s2 -> t2` 和 `same -> same`。普通 `CollectionConverter` 会使用元素类型本身的转换规则；`CollectionConverter<TElementConverter>` 则显式创建 `TElementConverter` 来解析每个元素，适合元素类型本身没有注册全局转换器，或者某个属性需要专属解析格式的场景。

{% hint style="warning" %}
集合转换器按简单分隔符拆分文本，不处理引号转义或嵌套结构。元素值本身可能包含 `|`、`;`、`,` 或换行时，应改用更明确的配置结构，或为外层类型提供专用转换器。
{% endhint %}

转换器适合处理通用、可复用的文本到对象转换。涉及业务语义、权限、外部资源查找或复杂校验时，建议留在命令、处理器或配置加载流程中完成。给命令选项或插件属性增加新格式前，也可以先确认现有转换器是否已经覆盖，避免同一类型出现多套解析规则。

## 参考实现

* [Converters 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Converters)
* [CollectionConverter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Converters/CollectionConverter.cs)
