---
description: Enumerable、CollectionUtility、DictionaryUtility 以及集合扩展方法。
icon: wrench
---

# 集合扩展

集合扩展类型提供一组偏底层的工具方法，用于处理同步/异步枚举、反射式集合操作、字典转换、键值对构建和同步包装。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `Enumerable` | 同步/异步枚举适配、空枚举、单值枚举和类型化枚举。 |
| `CollectionUtility` | 对未知集合对象执行反射式 `Add` 和 `Remove`。 |
| `DictionaryUtility` | 对未知字典对象执行反射式 `Add`、`Remove` 和键值提取。 |
| `KeyValuePairExtension` | 创建键值对数组，并在键值对数组和对象数组之间转换。 |
| `DictionaryExtension` | 字典读取、转换、同步包装和枚举转字典项。 |
| `HashSetExtension` | 将 `HashSet<T>` 复制为数组。 |
| `ListUtility` | 将 `IList<T>` 包装为 `SynchronizedList<T>`。 |

## Enumerable

`Enumerable` 主要处理“对象可能是一个值，也可能是同步枚举，也可能是异步枚举”的场景。

{% code title="EnumerateObjects.cs" %}
```csharp
using Zongsoft.Collections;

foreach(var value in Enumerable.Enumerate<int>(100))
	Console.WriteLine(value);

foreach(var value in Enumerable.Enumerate<int>(new[] { 1, 2, 3 }))
	Console.WriteLine(value);
```
{% endcode %}

常用能力包括：

* `Empty(Type)`：按运行时类型创建空枚举。
* `Empty<T>()`：创建空异步枚举。
* `Asynchronize<T>()`：把同步枚举包装为异步枚举。
* `Synchronize<T>()`：把异步枚举转为阻塞同步枚举。
* `Enumerate<T>(object)`：把对象转换为 `IEnumerable<T>`。
* `EnumerateAsync<T>(object)`：把对象转换为 `IAsyncEnumerable<T>`。

这些方法优先把同步或异步集合识别为序列，只有非集合对象才按单值进行类型转换；单值枚举器只借用该对象，释放枚举器不会释放元素本身。

`Asynchronize<T>` 和 `EnumerateAsync<T>` 只进行枚举形态适配，不会把同步枚举安排到后台线程。异步枚举器收到取消标记后会抛出 `OperationCanceledException`；`EnumerateAsync<T>` 同时收到方法级和枚举器级取消标记时，两者任一取消都会终止枚举。`Synchronize<T>` 会阻塞当前线程等待异步枚举，异步调用链中应优先直接使用 `await foreach`。

当源序列实现 `IPageable` 时，`Asynchronize<T>`、`EnumerateAsync<T>` 和 `Synchronize<T>` 的适配结果继续实现 `IPageable`，并转发动态的 `Suppressed` 状态和 `Paginated` 事件；事件 sender 为调用方持有的外层结果对象。

## CollectionUtility

`CollectionUtility` 用于目标对象类型不确定，但可能实现了 `ICollection<T>` 或非泛型 `IList` 的场景。

{% code title="CollectionUtilitySample.cs" %}
```csharp
object target = new List<int>();

CollectionUtility.TryAdd(target, "100");
CollectionUtility.TryRemove(target, 100);
```
{% endcode %}

它会尝试把传入值转换成集合元素类型，再调用对应的 `Add` 或 `Remove`。

## DictionaryUtility

`DictionaryUtility` 用于目标对象类型不确定，但可能实现了 `IDictionary<TKey, TValue>` 或非泛型 `IDictionary` 的场景。

{% code title="DictionaryUtilitySample.cs" %}
```csharp
object target = new Dictionary<string, int>();

DictionaryUtility.TryAdd(target, "K1", "100");
DictionaryUtility.TryRemove(target, "K1");
```
{% endcode %}

`TryGetEntry` 可以从 `DictionaryEntry` 或 `KeyValuePair<TKey, TValue>` 中提取键和值。

## 字典扩展

`DictionaryExtension` 提供非泛型字典的 `TryGetValue`、字典类型转换和同步包装。

{% code title="DictionaryExtensionSample.cs" %}
```csharp
IDictionary source = new Hashtable
{
	["A"] = "100",
};

if(source.TryGetValue<int>("A", out var value))
	Console.WriteLine(value);

var typed = source.ToDictionary<string, int>();
```
{% endcode %}

泛型字典可以通过 `Synchronize` 包装为 `SynchronizedDictionary<TKey, TValue>`。

## 键值对与哈希集扩展

`KeyValuePairExtension.CreatePairs` 可以按键名数组和值数组创建键值对数组。

{% code title="CreateKeyValuePairs.cs" %}
```csharp
var pairs = KeyValuePairExtension.CreatePairs(
	["name", "age"],
	"Alice",
	30);
```
{% endcode %}

`HashSetExtension.ToArray` 会创建一个新数组并调用 `HashSet<T>.CopyTo`，适合需要数组快照的场景。

## 相关资源

* [Enumerable.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/Enumerable.cs)
* [CollectionUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/CollectionUtility.cs)
* [DictionaryUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/DictionaryUtility.cs)
* [KeyValuePairExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/KeyValuePairExtension.cs)
* [DictionaryExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/DictionaryExtension.cs)
* [HashSetExtension.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HashSetExtension.cs)
* [ListUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/ListUtility.cs)
* [EnumerableTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/EnumerableTest.cs)
* [DictionaryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/DictionaryTest.cs)
