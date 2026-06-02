---
description: Zongsoft.Reflection 的反射访问、动态访问器和成员表达式求值能力。
icon: magnifying-glass
---

# Zongsoft.Reflection

`Zongsoft.Reflection` 为运行时对象访问提供一组轻量反射工具。它把常见的字段、属性、索引器和成员路径访问封装成可复用的动态访问器模型，适合配置绑定、数据映射、模板求值、命令参数解析、插件扩展和其他“成员名称在运行时才确定”的场景。

反射访问本身不应替代普通的强类型代码：当成员在编译期已经确定时，直接调用仍然是最清晰的写法；当字段名、属性名或访问路径来自配置、脚本、用户输入或元数据时，再使用本命名空间提供的能力。

## 主要职责

* 通过 `Reflector` 统一读取和写入字段、属性以及索引器。
* 通过 [`System.Reflection.Emit`](https://learn.microsoft.com/zh-cn/dotnet/api/system.reflection.emit) 为 System.Reflection.FieldInfo 和 System.Reflection.PropertyInfo 动态编译并缓存 getter、setter 访问器，减少重复反射调用的成本。
* 支持按字符串成员名读取或写入对象成员，名称查找忽略大小写，并可访问默认成员。
* 解析成员表达式，将 `Address.City`、`Items[0].Name`、`Get("key")` 这类路径转换为表达式节点链。
* 通过 `MemberExpressionEvaluator` 对表达式进行求值或设置最终成员。
* 为模型映射、数据绑定、配置绑定、序列化、报表字段选择等模块提供底层成员访问能力。

## 核心类型

| 类型 | 作用 | 常见用法 |
| --- | --- | --- |
| `Reflector` | 高层反射访问入口。 | 按 System.Reflection.MemberInfo 或字符串成员名读取、写入字段和属性。 |
| `FieldInfoExtension` | 字段访问器扩展。 | 从 System.Reflection.FieldInfo 获取缓存的 getter、setter。 |
| `PropertyInfoExtension` | 属性访问器扩展。 | 从 System.Reflection.PropertyInfo 获取缓存的 getter、setter，并支持索引器参数。 |
| `MemberExpression` | 成员表达式基类和解析入口。 | 解析或手动构造成员路径表达式。 |
| `IMemberExpression` | 表达式节点接口。 | 表示表达式链中的一个节点，并通过 `Previous`、`Next` 串联。 |
| `IdentifierExpression` | 标识符节点。 | 表示普通字段或属性名。 |
| `IndexerExpression` | 索引器节点。 | 表示 `[]` 访问，并携带索引参数。 |
| `MethodExpression` | 方法节点。 | 表示方法调用和参数列表。 |
| `ConstantExpression` | 常量节点。 | 表示字符串、数字和空值等参数值。 |
| `MemberExpressionEvaluator` | 表达式求值器。 | 对目标对象读取路径值，或写入路径末端成员。 |

## 成员访问

`Reflector` 是最常用的入口。它既可以接收已经解析好的 System.Reflection.MemberInfo，也可以直接按成员名称查找对象的公开字段或属性。

{% code title="MemberAccess.cs" %}
```csharp
using Zongsoft.Reflection;

object user = new User
{
	Name = "Alice",
	Age = 18,
};

var name = Reflector.GetValue(ref user, "Name");

Reflector.SetValue(ref user, "Age", 20);

if(Reflector.TryGetValue(ref user, "Name", out var value))
	Console.WriteLine(value);
```
{% endcode %}

`GetValue`、`SetValue` 会在目标为空、成员不存在、属性不可读等情况下抛出异常；写入只会对可写属性和非只读字段生效，遇到只读字段或不可写属性时会返回 `false`。`TryGetValue`、`TrySetValue` 更适合处理外部输入、可选字段或兼容旧模型的场景。

如果调用方已经持有 System.Reflection.FieldInfo、System.Reflection.PropertyInfo 或 System.Reflection.MemberInfo，可以直接使用扩展方法。访问器会被缓存，后续访问同一个成员时不需要重复生成。

{% code title="CachedAccessor.cs" %}
```csharp
using Zongsoft.Reflection;

var property = typeof(User).GetProperty(nameof(User.Name));
var user = new User { Name = "Alice" };

var name = property.GetValue(ref user);
property.SetValue(ref user, "Bob");
```
{% endcode %}

## 动态访问器与性能

字段和属性扩展方法内部会基于 [`System.Reflection.Emit`](https://learn.microsoft.com/zh-cn/dotnet/api/system.reflection.emit) 生成动态方法，再把动态方法编译成 getter 或 setter 委托。第一次访问某个成员时需要完成动态方法生成、IL 发射和委托创建；生成完成后，访问器会缓存在成员信息对应的缓存项中，后续读取或写入同一成员时直接调用委托，避免反复走传统反射的 `GetValue`、`SetValue` 路径。

这种设计适合高频、重复的运行时成员访问：例如数据映射持续填充模型、配置绑定反复写入属性、模板或报表按字段名读取对象。它不会让一次性的成员查找变成强类型调用，也不能消除按名称查找成员、解析表达式和参数转换的成本；因此在循环或批处理场景中，应尽量复用已经取得的 System.Reflection.FieldInfo、System.Reflection.PropertyInfo 或解析后的表达式对象。

源码仓库的 `Zongsoft.Core/benchmark/Reflection` 目录提供了属性读写的 BenchmarkDotNet 基准测试。测试以普通反射的 `PropertyInfo.GetValue`、`PropertyInfo.SetValue` 为基线，分别比较 `Reflector` 封装访问和直接复用 `GetGetter<T>`、`GetSetter<T>` 委托的路径；在重复访问同一批属性时，动态访问器相对普通反射会有更好的吞吐表现。

{% hint style="info" %}
动态访问器的收益来自“生成一次，多次调用”。如果某个成员只访问一次，生成访问器本身也会产生少量开销；如果成员会被反复访问，缓存委托通常比每次使用反射调用更稳定。
{% endhint %}

{% hint style="info" %}
字符串成员名查找默认面向公开实例成员和公开静态成员，并忽略大小写。若成员名称为空，则尝试访问目标类型的默认成员，常用于索引器访问。
{% endhint %}

## 索引器访问

属性访问器支持索引参数，因此既可以通过具体的 System.Reflection.PropertyInfo 调用，也可以通过默认成员访问索引器。

{% code title="IndexerAccess.cs" %}
```csharp
using System.Collections.Generic;
using Zongsoft.Reflection;

object items = new List<string> { "A", "B", "C" };

var first = Reflector.GetValue(ref items, string.Empty, 0);

Reflector.SetValue(ref items, string.Empty, "Z", 1);
```
{% endcode %}

这类写法适合处理集合、字典、动态模型或带默认成员的对象。对于字典、集合这样的强类型代码路径，如果键和索引在编译期已知，直接访问集合通常更直观。

## 成员表达式

`Zongsoft.Reflection.Expressions` 子命名空间提供成员路径解析和求值能力。表达式会被解析为一条双向节点链，每个节点代表一次成员、方法或索引器访问。

{% code title="MemberExpressionAccess.cs" %}
```csharp
using Zongsoft.Reflection.Expressions;

var expression = MemberExpression.Parse("Address.City");

var city = MemberExpressionEvaluator.Default.GetValue(expression, user);

MemberExpressionEvaluator.Default.SetValue(expression, user, "Shanghai");
```
{% endcode %}

常见表达式形态如下：

| 表达式 | 含义 |
| --- | --- |
| `Name` | 读取目标对象的 `Name` 字段或属性。 |
| `Address.City` | 逐级读取嵌套成员。 |
| `Items[0]` | 访问默认索引器的第一个元素。 |
| `Items[0].Name` | 先取集合元素，再读取元素成员。 |
| `Options["theme"]` | 使用字符串常量作为索引器参数。 |
| `GetValue("name")` | 调用公开方法，并传入字符串常量参数。 |
| `GetItem(Index).Name` | 方法或索引器参数也可以是另一个成员表达式。 |

表达式参数支持单引号或双引号字符串、数字常量和成员表达式。数字常量从数字开始，可使用 `L`、`F`、`M` 后缀表示长整型、单精度或十进制数；包含小数点的数字会按双精度解析。

{% hint style="warning" %}
成员表达式不是空值传播表达式。求值过程中如果中间对象为 `null`，后续成员查找通常会失败；需要容错时，应在调用前准备默认对象，或通过 `MemberExpressionEvaluator` 的求值回调接管某些节点的值。
{% endhint %}

## 自定义求值

`MemberExpressionEvaluator` 的读取和写入方法都接受求值回调。回调会在每个节点解析到成员后执行，调用方可以检查当前节点、目标对象、成员信息和参数，也可以提前设置节点值，从而覆盖默认反射求值逻辑。

{% code title="CustomEvaluate.cs" %}
```csharp
using Zongsoft.Reflection.Expressions;

var expression = MemberExpression.Parse("Profile.DisplayName");

var value = MemberExpressionEvaluator.Default.GetValue(
	expression,
	user,
	context =>
	{
		if(context.Expression is IdentifierExpression identifier &&
		   identifier.Name == "Profile" &&
		   context.Owner is User owner &&
		   owner.Profile == null)
			context.Value = UserProfile.Empty;
	});
```
{% endcode %}

这适合实现默认值补齐、权限过滤、外部字典取值、惰性加载或对某些路径节点进行特殊映射。回调只应处理确实需要介入的节点；普通成员访问交给默认求值器即可。

## 使用建议

优先把反射访问限制在系统边界，例如配置、插件、映射、绑定、序列化、报表字段和命令参数处理。业务核心流程如果可以用接口、泛型或普通属性访问表达，就不必引入成员名字符串。

重复执行的路径建议先解析并缓存 `IMemberExpression`，不要在循环中反复调用 `MemberExpression.Parse`。同样地，已经拿到 System.Reflection.FieldInfo 或 System.Reflection.PropertyInfo 时，优先复用它们的动态访问器，而不是每次都按字符串名称查找。

来自用户输入或外部配置的成员路径应先做白名单校验。反射工具可以降低调用成本，但不会自动判断某个成员是否适合暴露给外部使用；暴露字段路径、方法调用或索引器访问时，应由调用方定义清晰的可访问范围。

{% hint style="warning" %}
按名称查找的成员访问只覆盖公开字段、公开属性和公开方法。若需要访问非公开成员，应由调用方显式取得对应的 System.Reflection.MemberInfo，并确认这不会破坏封装或安全边界。
{% endhint %}

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Reflection.Expressions` | 成员路径表达式解析、表达式节点模型和表达式求值器。 |

## 相关资源

* [Reflection 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Reflection)
* [Expressions 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Reflection/Expressions)
* [属性读取性能基准](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/benchmark/Reflection/PropertyGetterBenchmark.cs)
* [属性写入性能基准](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/benchmark/Reflection/PropertySetterBenchmark.cs)
