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
| `HashSetExtension` | 将 [`HashSet<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.hashset-1) _[源码](https://source.dot.net/#System.Private.CoreLib/HashSet.cs)_ 复制为数组。 |
| `ListUtility` | 将 [`IList<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.ilist-1) _[源码](https://source.dot.net/#System.Private.CoreLib/IList.cs)_ 包装为 `SynchronizedList<T>`。 |

## Enumerable

`Enumerable` 主要处理“对象可能是一个值，也可能是同步枚举，也可能是异步枚举”的场景。

来源：[framework/Zongsoft.Core/test/Collections/EnumerableTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/EnumerableTest.cs#L241)（节选；上下文见源文件）。

{% code title="EnumerableTest.cs" %}
```csharp
public async Task EnumerateAdapters_PrioritizeCollectionsAndConvertScalarValues()
{
	var items = new List<int>([1, 2]);
	var syncObjects = Enumerable.Enumerate<object>(items);
	var asyncObjects = Enumerable.EnumerateAsync<object>(items);
	var syncDecimals = Enumerable.Enumerate<decimal>(10);
	var asyncDecimals = Enumerable.EnumerateAsync<decimal>(10);

	Assert.Collection(syncObjects,
		item => Assert.Equal(1, item),
		item => Assert.Equal(2, item));
	Assert.Collection(await CollectAsync(asyncObjects),
		item => Assert.Equal(1, item),
		item => Assert.Equal(2, item));
	Assert.Equal([10m], syncDecimals);
	Assert.Equal([10m], await CollectAsync(asyncDecimals));
}
```
{% endcode %}

常用能力包括：

* `Empty(Type)`：按运行时类型创建空枚举。
* `Empty<T>()`：创建空异步枚举。
* `First<T>()`、`FirstOrDefault<T>()`：异步取得首元素，并传递取消和释放枚举器；空序列时前者抛出异常，后者返回该元素类型的默认值。Discussions 的真实用法见[异步查询](../../data/querying.md)。
* `Asynchronize<T>()`：把同步枚举包装为异步枚举。
* `Synchronize<T>()`：把异步枚举转为阻塞同步枚举。
* `Enumerate<T>(object)`：把对象转换为 [`IEnumerable<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.ienumerable-1) _[源码](https://source.dot.net/#System.Private.CoreLib/IEnumerable.cs)_。
* `EnumerateAsync<T>(object)`：把对象转换为 [`IAsyncEnumerable<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.iasyncenumerable-1) _[源码](https://source.dot.net/#System.Private.CoreLib/IAsyncEnumerable.cs)_。

这些方法优先把同步或异步集合识别为序列，只有非集合对象才按单值进行类型转换；单值枚举器只借用该对象，释放枚举器不会释放元素本身。

`Asynchronize<T>` 和 `EnumerateAsync<T>` 只进行枚举形态适配，不会把同步枚举安排到后台线程。异步枚举器收到取消标记后会抛出 [`OperationCanceledException`](https://learn.microsoft.com/zh-cn/dotnet/api/system.operationcanceledexception) _[源码](https://source.dot.net/#System.Private.CoreLib/OperationCanceledException.cs)_；`EnumerateAsync<T>` 同时收到方法级和枚举器级取消标记时，两者任一取消都会终止枚举。`Synchronize<T>` 会阻塞当前线程等待异步枚举，异步调用链中应优先直接使用 `await foreach`。

当源序列实现 `IPageable` 时，`Asynchronize<T>`、`EnumerateAsync<T>` 和 `Synchronize<T>` 的适配结果继续实现 `IPageable`，并转发动态的 `Suppressed` 状态和 `Paginated` 事件；事件 sender 为调用方持有的外层结果对象。

## CollectionUtility

`CollectionUtility` 用于目标对象类型不确定，但可能实现了 [`ICollection<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.icollection-1) _[源码](https://source.dot.net/#System.Private.CoreLib/ICollection.cs)_ 或非泛型 [`IList`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.ilist) _[源码](https://source.dot.net/#System.Private.CoreLib/IList.cs)_ 的场景。

来源：[framework/Zongsoft.Core/test/Collections/CollectionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/CollectionTest.cs#L12)（节选；上下文见源文件）。

{% code title="CollectionTest.cs" %}
```csharp
public void TestGenericCollection()
{
	object list = new List<int>();

	Assert.True(CollectionUtility.TryAdd(list, 1));
	Assert.NotEmpty((ICollection<int>)list);
	Assert.Equal(1, ((IList<int>)list)[0]);

	Assert.True(CollectionUtility.TryAdd(list, 2));
	Assert.Equal(2, ((IList<int>)list).Count);
	Assert.Equal(1, ((IList<int>)list)[0]);
	Assert.Equal(2, ((IList<int>)list)[1]);

	Assert.True(CollectionUtility.TryRemove(list, 1));
	Assert.Single((IList<int>)list);
	Assert.True(CollectionUtility.TryRemove(list, 2));
	Assert.Empty((IList<int>)list);
}
```
{% endcode %}

它会尝试把传入值转换成集合元素类型，再调用对应的 `Add` 或 `Remove`。

## DictionaryUtility

`DictionaryUtility` 用于目标对象类型不确定，但可能实现了 [`IDictionary<TKey, TValue>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.idictionary-2) _[源码](https://source.dot.net/#System.Private.CoreLib/IDictionary.cs)_ 或非泛型 [`IDictionary`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.idictionary) _[源码](https://source.dot.net/#System.Private.CoreLib/IDictionary.cs)_ 的场景。

来源：[framework/Zongsoft.Core/test/Collections/DictionaryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/DictionaryTest.cs#L12)（节选；上下文见源文件）。

{% code title="DictionaryTest.cs" %}
```csharp
public void TestGenericDictionary()
{
	object dictionary = new Dictionary<string, int>();

	Assert.True(DictionaryUtility.TryAdd(dictionary, "K1", 1));
	Assert.NotEmpty((IDictionary<string, int>)dictionary);
	Assert.Equal(1, ((IDictionary<string, int>)dictionary)["K1"]);

	Assert.True(DictionaryUtility.TryAdd(dictionary, "K2", 2));
	Assert.Equal(2, ((IDictionary<string, int>)dictionary).Count);
	Assert.Equal(1, ((IDictionary<string, int>)dictionary)["K1"]);
	Assert.Equal(2, ((IDictionary<string, int>)dictionary)["K2"]);

	Assert.True(DictionaryUtility.TryRemove(dictionary, "K1"));
	Assert.Single((IDictionary<string, int>)dictionary);
	Assert.True(DictionaryUtility.TryRemove(dictionary, "K2"));
	Assert.Empty((IDictionary<string, int>)dictionary);
}
```
{% endcode %}

`TryGetEntry` 可以从 [`DictionaryEntry`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.dictionaryentry) _[源码](https://source.dot.net/#System.Private.CoreLib/DictionaryEntry.cs)_ 或 [`KeyValuePair<TKey, TValue>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.keyvaluepair-2) _[源码](https://source.dot.net/#System.Private.CoreLib/KeyValuePair.cs)_ 中提取键和值。

## 字典扩展

`DictionaryExtension` 提供非泛型字典的 `TryGetValue`、字典类型转换和同步包装。

数据服务、配置绑定等反射调用方可使用这些扩展。具体转换规则见 [DictionaryExtension 源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/DictionaryExtension.cs)。

泛型字典可以通过 `Synchronize` 包装为 `SynchronizedDictionary<TKey, TValue>`。

## 键值对与哈希集扩展

`KeyValuePairExtension.CreatePairs` 可以按键名数组和值数组创建键值对数组。

需要构造键值对时，键数组与值数组必须按同一顺序组织；其长度检查及组合方式见 [KeyValuePairExtension 源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/KeyValuePairExtension.cs)。

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
