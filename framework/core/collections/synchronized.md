---
description: SynchronizedList 和 SynchronizedDictionary 同步集合。
icon: shield
---

# 同步集合

同步集合用于包装常规列表或字典，并通过读写锁保护并发访问。它们适合框架内部少量共享状态、缓存索引、注册表、描述符集合等场景。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `SynchronizedList<T>` | 线程安全列表，实现 [`IList<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.ilist-1) _[源码](https://source.dot.net/#System.Private.CoreLib/IList.cs)_、[`ICollection<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.icollection-1) _[源码](https://source.dot.net/#System.Private.CoreLib/ICollection.cs)_ 和非泛型 [`ICollection`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.icollection) _[源码](https://source.dot.net/#System.Private.CoreLib/ICollection.cs)_。 |
| `SynchronizedDictionary<TKey, TValue>` | 线程安全字典，实现 [`IDictionary<TKey, TValue>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.idictionary-2) _[源码](https://source.dot.net/#System.Private.CoreLib/IDictionary.cs)_，并提供并发风格的增改方法。 |
| `ListUtility` | 提供 `IList<T>.Synchronize()` 包装方法。 |
| `DictionaryExtension` | 提供 `IDictionary<TKey, TValue>.Synchronize()` 包装方法。 |

## SynchronizedList

`SynchronizedList<T>` 使用读写锁保护读取和写入。读操作进入读锁，写操作进入写锁，枚举期间也保持读锁。

来源：[framework/Zongsoft.Core/test/Collections/SynchronizedListTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/SynchronizedListTest.cs#L13)（节选；上下文见源文件）。

{% code title="SynchronizedListTest.cs" %}
```csharp
public void Add()
{
	const int COUNT = 1_0000;

	var list = new SynchronizedList<int>(COUNT);

	Parallel.For(0, COUNT, index =>
	{
		list.Add(index);

		if(index % 100 == 0)
		{
			foreach(var item in list)
			{
				Assert.True(item >= 0);
			}

			for(int i = 0; i < list.Count; i++)
			{
				Assert.True(list[i] >= 0);
			}
		}
	});

	Assert.Equal(COUNT, list.Count);
	var hashset = new HashSet<int>(list);
	Assert.Equal(COUNT, hashset.Count);
}
```
{% endcode %}

也可以用扩展方法包装已有列表。

现有列表的包装入口是 ListUtility.Synchronize；包装后应统一经由返回对象访问，共享代码若继续直接修改原列表，就会绕过锁。

{% hint style="warning" %}
枚举 `SynchronizedList<T>` 时会持有读锁。不要在枚举循环内部执行可能长时间阻塞的操作，也不要在同一枚举过程中写入该列表。
{% endhint %}

## SynchronizedDictionary

`SynchronizedDictionary<TKey, TValue>` 除了常规字典操作，还提供类似并发字典的 `TryAdd`、`GetOrAdd`、`AddOrUpdate`、`TryUpdate` 方法。

来源：[framework/Zongsoft.Core/test/Collections/SynchronizedDictionaryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/SynchronizedDictionaryTest.cs#L139)（节选；上下文见源文件）。

{% code title="SynchronizedDictionaryTest.cs" %}
```csharp
public void GetOrAdd()
{
	const int COUNT = 1_0000;

	var keys = System.Linq.Enumerable.Range(0, COUNT).ToArray();
	Random.Shared.Shuffle(keys);

	var dictionary = new SynchronizedDictionary<int, string>(COUNT);
	for(int i = 0; i < COUNT; i++)
	{
		if(i % 2 == 1)
			dictionary[i] = $"Value#{i}";
	}

	Assert.Equal(COUNT / 2, dictionary.Count);

	Parallel.For(0, COUNT, index =>
	{
		var key = keys[index];
		var value = dictionary.GetOrAdd(key, key => $"Added#{key}");

		if(key % 2 == 0)
			Assert.Equal($"Added#{key}", value);
		else
			Assert.Equal($"Value#{key}", value);

		if(index % 100 == 0)
		{
			foreach(var item in dictionary)
			{
				Assert.True(item.Key >= 0);
				Assert.True(dictionary.ContainsKey(item.Key));
			}
		}
	});

	Assert.Equal(COUNT, dictionary.Count);
}
```
{% endcode %}

`GetOrAdd` 和 `AddOrUpdate` 使用可升级读锁减少写锁范围。`Keys` 和 `Values` 返回的是快照集合，避免调用方拿到内部集合视图。

## 选择建议

| 场景 | 建议 |
| --- | --- |
| 需要完整 [`IList<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.ilist-1) _[源码](https://source.dot.net/#System.Private.CoreLib/IList.cs)_ 语义并控制并发访问 | 使用 `SynchronizedList<T>`。 |
| 需要完整 [`IDictionary<TKey, TValue>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.idictionary-2) _[源码](https://source.dot.net/#System.Private.CoreLib/IDictionary.cs)_ 语义和条件更新 | 使用 `SynchronizedDictionary<TKey, TValue>`。 |
| 高吞吐无锁或细粒度并发字典场景 | 优先评估 .NET 官方并发集合。 |

## 相关资源

* [SynchronizedList.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/SynchronizedList.cs)
* [SynchronizedDictionary.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/SynchronizedDictionary.cs)
* [SynchronizedListTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/SynchronizedListTest.cs)
* [SynchronizedDictionaryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/SynchronizedDictionaryTest.cs)
