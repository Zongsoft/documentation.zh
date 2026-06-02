---
description: Parameters 参数包、类型键、字符串键、链式构建和 JSON 序列化。
icon: sliders
---

# Parameters

`Parameters` 是一个轻量参数包，既可以按字符串名称保存参数，也可以按 `Type` 保存参数。它常用于命令调用、服务上下文、数据访问选项、事件参数和跨层传递少量上下文数据。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `Parameters` | 参数容器，实现 `IDictionary<object, object>`。 |
| `Parameters.Json` | `Parameters` 的 JSON 转换器实现。 |
| `ParametersUtility` | 提供链式添加参数的扩展方法。 |

## 字符串键参数

字符串键忽略大小写。`null` 名称会被转换为空字符串。

{% code title="NamedParameters.cs" %}
```csharp
using Zongsoft.Collections;

var parameters = Parameters
	.Parameter("name", "Popeye")
	.Parameter("enabled", true)
	.Parameter("count", 100);

if(parameters.TryGetValue<string>("NAME", out var name))
	Console.WriteLine(name);
```
{% endcode %}

`TryGetValue<TValue>(string name, out TValue value)` 会尝试将原始值转换为目标类型。

## 类型键参数

按类型保存参数时，可以直接通过泛型读取。读取时如果没有找到完全匹配的类型键，`Parameters` 会查找可赋值的类型键。

{% code title="TypedParameters.cs" %}
```csharp
var parameters = Parameters
	.Parameter<IFormatProvider>(CultureInfo.InvariantCulture)
	.Parameter("traceId", Guid.NewGuid());

if(parameters.TryGetValue<IFormatProvider>(out var provider))
	Console.WriteLine(provider);
```
{% endcode %}

按类型设置参数时，值必须能赋给声明类型；如果声明类型是非空值类型，则不能设置为 `null`。

## 链式构建

`ParametersUtility` 让已有参数包可以继续链式追加参数。

{% code title="AppendParameters.cs" %}
```csharp
Parameters parameters = null;

parameters = parameters
	.Parameter("name", "Alice")
	.Parameter(typeof(DateTimeOffset), DateTimeOffset.UtcNow)
	.Parameter<CancellationToken>(CancellationToken.None);
```
{% endcode %}

`Append` 可以把另一个 `Parameters` 中的条目合并到当前实例。

## JSON 序列化

`Parameters.Json` 为 `Parameters` 提供 JSON 转换器。字符串键按属性名输出，类型键会使用 `$` 前缀加类型别名输出。

{% code title="SerializeParameters.cs" %}
```csharp
using Zongsoft.Collections;
using Zongsoft.Serialization;

var parameters = Parameters
	.Parameter("name", "Alice")
	.Parameter(DateTimeOffset.UtcNow);

var json = Serializer.Json.Serialize(parameters);
var result = Serializer.Json.Deserialize<Parameters>(json);
```
{% endcode %}

复杂对象会以包含 `$type` 和 `$value` 的对象形式保存，读取时再按类型别名恢复值。

## 相关资源

* [Parameters.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/Parameters.cs)
* [Parameters.Json.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/Parameters.Json.cs)
* [ParametersUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/ParametersUtility.cs)
* [ParametersTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/ParametersTest.cs)
