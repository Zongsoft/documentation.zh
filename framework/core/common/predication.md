---
description: Predication 条件断言接口、基类和组合集合。
icon: circle-check
---

# Predication

`Predication` 用于表达可异步执行的条件判断。它把“某个对象是否满足条件”抽象为 `IPredication` / `IPredication<T>`，再通过基类、工厂方法和集合组合支持复用、命名匹配和短路执行。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `IPredication` | 非泛型断言接口，接收 `object` 参数和可选 `Parameters`。 |
| `IPredication<T>` | 泛型断言接口，提供强类型参数入口。 |
| `PredicationBase<T>` | 带名称、参数转换和服务匹配能力的抽象基类。 |
| `Predication` | 从委托快速创建断言对象的静态工厂。 |
| `PredicationCollection` | 非泛型断言集合。 |
| `PredicationCollection<T>` | 泛型断言集合。 |
| `PredicationCombination` | 集合内断言的 `And` / `Or` 组合方式。 |

## 快速创建断言

`Predication.Predicate` 可以把同步或异步委托包装成 `IPredication`。这种写法适合临时规则、测试规则或不需要独立类型承载的轻量规则。

{% code title="CreatePredication.cs" %}
```csharp
using Zongsoft.Common;

var adult = Predication.Predicate<int>(age => age >= 18);

if(await adult.PredicateAsync(20))
	Console.WriteLine("Allowed");
```
{% endcode %}

需要附加参数时，可以使用带 `Parameters` 参数的重载。

{% code title="PredicationWithParameters.cs" %}
```csharp
using Zongsoft.Collections;
using Zongsoft.Common;

var rule = Predication.Predicate<int>((value, parameters) =>
{
	parameters.TryGetValue<int>("minimum", out var minimum);
	return value >= minimum;
});

var parameters = new Parameters();
parameters.SetValue("minimum", 10);

var passed = await rule.PredicateAsync(12, parameters);
```
{% endcode %}

## 实现命名断言

继承 `PredicationBase<T>` 可以得到名称、服务匹配和对象参数转换能力。它适合注册到服务集合后按名称查找，例如策略、过滤器、权限规则或业务前置条件。

{% code title="NamedPredication.cs" %}
```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
using Zongsoft.Collections;
using Zongsoft.Common;

public sealed class TenantPredication : PredicationBase<string>
{
	public TenantPredication() : base("tenant") { }

	public override ValueTask<bool> PredicateAsync(
		string argument,
		Parameters parameters,
		CancellationToken cancellation = default)
	{
		return ValueTask.FromResult(
			parameters != null &&
			parameters.TryGetValue<string>("tenant", out var expected) &&
			string.Equals(argument, expected, StringComparison.OrdinalIgnoreCase));
	}
}
```
{% endcode %}

默认的 `OnConvert` 会调用 `Convert.ConvertValue<T>` 把 `object` 参数转换为强类型参数。如果断言需要更严格或更宽松的转换规则，可以重写 `OnConvert`。

## 组合多个断言

`PredicationCollection` 和 `PredicationCollection<T>` 可以把多个断言组合成一条断言链。`And` 组合遇到失败时短路返回失败；`Or` 组合遇到成功时短路返回成功。集合为空时返回成功。

{% code title="PredicationCollection.cs" %}
```csharp
using Zongsoft.Common;

var rules = new PredicationCollection<int>(PredicationCombination.And)
{
	Predication.Predicate<int>(value => value > 0),
	Predication.Predicate<int>(value => value < 100),
};

var passed = await rules.PredicateAsync(42);
```
{% endcode %}

{% hint style="info" %}
`Predication` 关注“条件是否成立”；如果要表达数据是否有效并收集失败消息，请使用 [Validator](validator.md)。
{% endhint %}

## 相关资源

* [IPredication.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/IPredication.cs)
* [IPredication&lt;T&gt;.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/IPredication%601.cs)
* [Predication.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Predication.cs)
* [PredicationBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/PredicationBase.cs)
* [PredicationCollection.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/PredicationCollection.cs)
* [PredicationCollection&lt;T&gt;.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/PredicationCollection%601.cs)
* [PredicationCombination.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/PredicationCombination.cs)
