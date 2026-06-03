---
description: Zongsoft.Serialization 的抽象、JSON 序列化器、选项和类型支持。
icon: brackets-curly
---

# Zongsoft.Serialization

`Zongsoft.Serialization` 提供框架级序列化抽象和默认 JSON 实现。它的重点不是替代 `System.Text.Json`，而是在其基础上补齐 Zongsoft 模型、数据字典、混合对象、类型别名和常用时间类型的转换规则，让配置、数据访问、消息、事件和 Web 输出可以共享一套对象转换约定。

当调用者已经知道目标类型时，可以直接使用泛型反序列化；当目标结构比较松散，或者需要在字典、参数包、事件载荷中保存不同类型的值时，应配合 `TextSerializationOptions` 的类型化选项使用。

## 入口与抽象

| 类型 | 说明 |
| --- | --- |
| [`Zongsoft.Serialization.Serializer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Serialization/Serializer.cs) | 序列化静态入口，`Serializer.Json` 是默认 JSON 文本序列化器。 |
| [`Zongsoft.Serialization.ISerializer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Serialization/ISerializer.cs) | 面向流和字节缓冲区的序列化接口，提供同步和异步方法。 |
| [`Zongsoft.Serialization.ITextSerializer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Serialization/ITextSerializer.cs) | 面向文本的序列化接口，扩展了字符串输入输出。 |
| [`Zongsoft.Serialization.SerializationOptions`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Serialization/SerializationOptions.cs) | 基础选项，控制忽略规则、最大深度和字段包含行为。 |
| [`Zongsoft.Serialization.TextSerializationOptions`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Serialization/TextSerializationOptions.cs) | 文本序列化选项，增加缩进、命名风格和类型信息开关。 |
| [`Zongsoft.Serialization.TextSerializationOptionsBuilder`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Serialization/TextSerializationOptionsBuilder.cs) | 常用不可变选项的缓存构建器，例如 `Serializer.Json.Options.Camel()` 和 `Serializer.Json.Options.Typified()`。 |

## 基本用法

最常见的用法是通过 `Serializer.Json` 把对象和 JSON 字符串互转。若没有指定目标类型，默认反序列化结果是字典结构；若指定泛型目标类型，则按该类型创建对象。

{% code title="JsonSerialize.cs" %}
```csharp
using Zongsoft.Serialization;

var json = Serializer.Json.Serialize(credential);
var result = Serializer.Json.Deserialize<Credential>(json);
```
{% endcode %}

`Serializer.Json` 同时提供字符串、流和字节缓冲区版本，并包含异步方法。序列化时可以传入显式类型，适合接口变量、抽象类型或希望按模型类型输出的对象。

{% code title="JsonOptions.cs" %}
```csharp
using Zongsoft.Serialization;

var json = Serializer.Json.Serialize(credential, new TextSerializationOptions()
{
	IgnoreNull = true,
	Indented = true,
	NamingConvention = SerializationNamingConvention.Camel,
});

var compact = Serializer.Json.Serialize(credential, Serializer.Json.Options.Camel());
```
{% endcode %}

上面的选项会忽略 `null` 值、输出缩进文本，并把属性名和字典键转换为 camelCase。测试中的 `Credential` 示例还验证了 JSON 字符串数字可以读入数值属性，例如 `"Count": "69"` 会反序列化为 `int`。

## JSON 选项

JSON 实现会把 `TextSerializationOptions` 转换为 `System.Text.Json.JsonSerializerOptions`，并注册 Zongsoft 的内置转换器。

| 选项 | JSON 行为 |
| --- | --- |
| `Indented` | 控制是否输出缩进格式。 |
| `NamingConvention` | 支持 `None`、`Camel`、`Kebab`、`Snake`、`Pascal`，同时作用于属性名和字典键。 |
| `IgnoreNull` | 写入时忽略 `null` 值。 |
| `IgnoreZero` | 写入时忽略默认值。 |
| `IncludeFields` | 控制是否包含字段，默认包含字段和属性。 |
| `MaximumDepth` | 映射为 JSON 最大深度，默认 `0` 表示不主动限制。 |
| `Typified` | 为 `object` 值写入类型信息，适合异构字典和松散载荷。 |
| `Converters` | 允许向 `Serializer.Json.Options.Converters` 注册全局转换器。 |

默认 JSON 读取对属性名大小写不敏感，并允许从字符串读取数字。枚举默认使用字符串形式读写，这是由 `System.Text.Json.Serialization.JsonStringEnumConverter` 负责的。

{% hint style="info" %}
`Serializer.Json.Options` 返回的是缓存后的不可变常用选项。需要临时组合更多设置时，可以创建新的 `TextSerializationOptions`，或者通过构造函数配置底层 `System.Text.Json.JsonSerializerOptions`。
{% endhint %}

## 类型支持

下面的行为来自默认 JSON 选项和 `Zongsoft.Core` 的序列化单元测试。标准对象属性仍遵循 `System.Text.Json` 的常规规则；表中列出的是 Zongsoft 额外处理或测试重点覆盖的类型。

| 类型或场景 | 序列化与反序列化行为 |
| --- | --- |
| 普通对象 | 按公开属性和字段读写；启用命名风格后属性名随选项转换。 |
| 接口或抽象模型 | 对接口、抽象类等非集合类型，默认模型转换器会通过 `Zongsoft.Data.Model.Build` 构造可写模型。测试覆盖了 `IUser` 的序列化与反序列化。 |
| `Zongsoft.Data.IDataDictionary` | 以 JSON 对象读写，读取后包装为 `DataDictionary`。 |
| `System.Collections.Hashtable` | 以 JSON 对象读写；键会写成属性名，值按实际值转换。 |
| `System.Collections.Generic.Dictionary<TKey,TValue>` | 以 JSON 对象读写；键通过字符串属性名转换，值按 `TValue` 或 `object` 推断。测试覆盖了 `Dictionary<string, object>`、`Dictionary<string, Gender>` 和嵌套字典属性。 |
| `object` 值 | 读取 JSON 时，`null`、布尔、字符串、数字、对象、数组分别落为 `null`、`bool`、`string`、`int`/`double`、字典、`object[]`。 |
| 数字 | 松散读取时优先尝试 `int`，不能用 `int` 表示时读取为 `double`；目标类型明确时按目标类型转换。 |
| 枚举 | 默认以字符串形式读写；目标类型明确时可从字符串或数值恢复枚举。 |
| `System.TimeSpan` | 写为标准时间间隔字符串；读入时支持字符串，也支持数字秒数。 |
| `System.DateOnly` | 写为 `yyyy-MM-dd`；读入时支持字符串，也支持 day number 数值。 |
| `System.TimeOnly` | 写为 `HH:mm:ss.fffffff`；读入时支持字符串，也支持 ticks 数值。 |
| `System.DateTime`、`System.DateTimeOffset`、`System.Guid` | 通过 JSON 读取器的内置方法读入；在明确目标类型或类型化值中可恢复。 |
| `System.Type` | 通过 Zongsoft 类型别名写入和读取。 |
| `Zongsoft.Data.Range<T>` | 可从字符串、数值或包含 `minimum`/`maximum` 的对象读取，写出为字符串。 |
| `Zongsoft.Data.Mixture<T>` | 可从数值、逗号分隔字符串或数值数组读取，写出为字符串。 |
| 字节数组 | 默认遵循 `System.Text.Json` 的字节数组规则；若需要数组数字形式，可注册 `ByteArrayConverter`。 |

## 松散 JSON

当目标类型是 `Dictionary<string, object>` 或非泛型字典时，JSON 对象会变成字典，数组会变成 `object[]`。这适合接收配置片段、事件参数或外部 JSON 载荷。

{% code title="DeserializeDictionary.cs" %}
```csharp
using Zongsoft.Serialization;

var text = """
{
	"integer": 2147483647,
	"double": 1.7976931348623157E+308,
	"enabled": true,
	"tags": ["A", "B"],
	"profile": {
		"name": "Popeye"
	}
}
""";

var data = Serializer.Json.Deserialize<Dictionary<string, object>>(text);

var number = (int)data["integer"];
var tags = (object[])data["tags"];
var profile = (Dictionary<string, object>)data["profile"];
```
{% endcode %}

这类松散读取不会保留所有 CLR 细分类型。例如 `short` 值在没有目标类型时会被读成 `int`，普通数字通常只在 `int` 和 `double` 之间选择。如果业务需要恢复 `byte`、`short`、`decimal`、`TimeSpan` 或模型接口等具体类型，应提供明确目标类型，或启用类型化 JSON。

{% hint style="warning" %}
松散读取空对象时没有属性可用于构造结果，反序列化到 `object` 数组或字典值时可能得到 `null`。如果空对象本身有业务含义，请使用明确的目标模型或字典类型承载。
{% endhint %}

## 类型化 JSON

`Typified` 用于异构对象图，尤其是 `Dictionary<string, object>`、`Hashtable`、参数包或事件载荷。启用后，非空且不是简单字符串/布尔值的 `object` 值会写成包含 `$type` 和 `$value` 的对象；`$type` 使用 Zongsoft 类型别名，读取时再按该类型恢复。

{% code title="TypifiedDictionary.cs" %}
```csharp
using Zongsoft.Serialization;

var values = new Dictionary<string, object>
{
	["identifier"] = 100,
	["expiration"] = TimeSpan.FromHours(4),
	["user"] = user,
};

var json = Serializer.Json.Serialize(values, Serializer.Json.Options.Typified());
var result = Serializer.Json.Deserialize<Dictionary<string, object>>(json);
```
{% endcode %}

单元测试验证了类型化字典可以恢复多种运行时值，包括整数、无符号整数、浮点数、`decimal`、`TimeSpan`、`DateOnly`、`TimeOnly`、`DateTime`、`DateTimeOffset`、`Guid`、`System.Version`、布尔、字符串和模型对象。泛型字典即使启用 `Typified`，也仍会按 `TValue` 约束恢复值，例如 `Dictionary<string, Gender>` 会得到明确的枚举值。

类型化 JSON 依赖类型别名能够被解析。若 `$type` 不是已知别名或可解析类型，当前对象值会读取为 `null`；因此它更适合受信任的内部载荷，不建议把任意外部 JSON 直接按类型化模式还原为对象。

## 模型与字典

Zongsoft 模型对象通常以接口表达业务契约。JSON 序列化时，模型转换器会输出模型中的变更值和可读属性；反序列化到接口或抽象类型时，会构造一个可写模型实例。

{% code title="ModelJson.cs" %}
```csharp
using Zongsoft.Data;
using Zongsoft.Serialization;

var user = Model.Build<IUser>(model =>
{
	model.Identifier = new Zongsoft.Components.Identifier(typeof(IUser), 100);
	model.Name = "Popeye";
	model.Nickname = "钟少";
});

var json = Serializer.Json.Serialize(user);
var result = Serializer.Json.Deserialize<IUser>(json);
```
{% endcode %}

`IDataDictionary` 则更适合在不知道模型接口、只需要读取键值内容时使用。测试中先把模型转换成 `DataDictionary`，再通过 JSON 反序列化为 `IDataDictionary`，读取后的条目数量与原字典一致。

## 扩展转换器

如果某个业务类型需要固定 JSON 形状，可以实现 `System.Text.Json.Serialization.JsonConverter<T>`，并在应用初始化时加入全局转换器列表。新建选项时，默认 JSON 选项会把这些全局转换器复制到底层 `System.Text.Json.JsonSerializerOptions.Converters` 中。

{% code title="RegisterJsonConverter.cs" %}
```csharp
using System.Text.Json;
using System.Text.Json.Serialization;
using Zongsoft.Serialization;

public sealed class VersionConverter : JsonConverter<SemanticVersion>
{
	public override SemanticVersion Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options) =>
		SemanticVersion.Parse(reader.GetString());

	public override void Write(Utf8JsonWriter writer, SemanticVersion value, JsonSerializerOptions options) =>
		writer.WriteStringValue(value.ToFullString());
}

Serializer.Json.Options.Converters.Add(new VersionConverter());
```
{% endcode %}

自定义转换器适合处理稳定、可复用的格式。若格式依赖权限、数据库、租户或外部服务，建议在业务层完成校验和对象装配，再把已经明确的对象交给序列化器。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Serialization.Json` | JSON 读写扩展、命名策略和转换器调用辅助类型。 |
| `Zongsoft.Serialization.Json.Converters` | JSON 转换器集合，覆盖模型、字典、类型、时间、区间和混合值等类型。 |

## 相关资源

* [Serialization 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Serialization)
* [JsonSerializerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Serialization/JsonSerializerTest.cs)
* [TextSerializationOptionsTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Serialization/TextSerializationOptionsTest.cs)
