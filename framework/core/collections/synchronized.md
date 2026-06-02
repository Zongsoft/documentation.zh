---
description: SynchronizedList 和 SynchronizedDictionary 同步集合。
icon: shield
---

# 同步集合

同步集合用于包装常规列表或字典，并通过读写锁保护并发访问。它们适合框架内部少量共享状态、缓存索引、注册表、描述符集合等场景。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `SynchronizedList<T>` | 线程安全列表，实现 `IList<T>`、`ICollection<T>` 和非泛型 `ICollection`。 |
| `SynchronizedDictionary<TKey, TValue>` | 线程安全字典，实现 `IDictionary<TKey, TValue>`，并提供并发风格的增改方法。 |
| `ListUtility` | 提供 `IList<T>.Synchronize()` 包装方法。 |
| `DictionaryExtension` | 提供 `IDictionary<TKey, TValue>.Synchronize()` 包装方法。 |

## SynchronizedList

`SynchronizedList<T>` 使用读写锁保护读取和写入。读操作进入读锁，写操作进入写锁，枚举期间也保持读锁。

{% code title="SynchronizedListSample.cs" %}
```csharp
using Zongsoft.Collections;

var list = new SynchronizedList<int>();

Parallel.For(0, 10_000, index =>
{
	list.Add(index);

	if(index % 100 == 0)
	{
		foreach(var item in list)
			Console.WriteLine(item);
	}
});
```
{% endcode %}

也可以用扩展方法包装已有列表。

{% code title="SynchronizeList.cs" %}
```csharp
IList<string> raw = new List<string>();
var list = raw.Synchronize();

list.Add("A");
list.Add("B");
```
{% endcode %}

{% hint style="warning" %}
枚举 `SynchronizedList<T>` 时会持有读锁。不要在枚举循环内部执行可能长时间阻塞的操作，也不要在同一枚举过程中写入该列表。
{% endhint %}

## SynchronizedDictionary

`SynchronizedDictionary<TKey, TValue>` 除了常规字典操作，还提供类似并发字典的 `TryAdd`、`GetOrAdd`、`AddOrUpdate`、`TryUpdate` 方法。

{% code title="SynchronizedDictionarySample.cs" %}
```csharp
using Zongsoft.Collections;

var dictionary = new SynchronizedDictionary<int, string>();

Parallel.For(0, 10_000, index =>
{
	var value = dictionary.GetOrAdd(index, key => $"Value#{key}");
	dictionary.AddOrUpdate(index, value, (_, oldValue) => $"{oldValue}:updated");
});
```
{% endcode %}

`GetOrAdd` 和 `AddOrUpdate` 使用可升级读锁减少写锁范围。`Keys` 和 `Values` 返回的是快照集合，避免调用方拿到内部集合视图。

## 选择建议

| 场景 | 建议 |
| --- | --- |
| 需要完整 `IList<T>` 语义并控制并发访问 | 使用 `SynchronizedList<T>`。 |
| 需要完整 `IDictionary<TKey, TValue>` 语义和条件更新 | 使用 `SynchronizedDictionary<TKey, TValue>`。 |
| 高吞吐无锁或细粒度并发字典场景 | 优先评估 .NET 官方并发集合。 |

## 相关资源

* [SynchronizedList.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/SynchronizedList.cs)
* [SynchronizedDictionary.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/SynchronizedDictionary.cs)
* [SynchronizedListTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/SynchronizedListTest.cs)
* [SynchronizedDictionaryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/SynchronizedDictionaryTest.cs)
