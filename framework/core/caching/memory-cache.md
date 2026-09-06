---
description: MemoryCache 进程内缓存、过期策略、依赖令牌和淘汰事件。
icon: database
---

# MemoryCache

`MemoryCache` 是 `Zongsoft.Caching` 命名空间中的进程内缓存实现。它包装 [`Microsoft.Extensions.Caching.Memory.MemoryCache`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.caching.memory.memorycache) _[源码](https://source.dot.net/#Microsoft.Extensions.Caching.Memory/MemoryCache.cs)_，并在此基础上增加 Zongsoft 风格的过期描述、依赖令牌、优先级、淘汰事件和数量限制提醒。

{% hint style="info" %}
`MemoryCache` 适合缓存进程内可重建的数据，例如元数据、描述符、解析结果或轻量对象。跨进程共享、分布式一致性和服务间缓存同步应使用 `IDistributedCache` 的具体实现。
{% endhint %}

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `MemoryCache` | 进程内缓存容器，提供读取、写入、删除、获取或创建、清理和事件通知。 |
| `MemoryCacheOptions` | 配置扫描频率和数量限制；`MemoryCache.Shared` 使用不可变选项。 |
| `MemoryCacheScanner` | 周期性调用 `Compact(0)`，触发过期项扫描。 |
| `MemoryCache.Expiration` | 描述滑动过期、绝对过期，或二者组合。 |
| `CachePriority` | 映射到底层缓存项优先级：`Low`、`Normal`、`High`、`NeverRemove`。 |
| `CacheEvictedEventArgs` | `Evicted` 事件参数，包含键、值、淘汰原因和状态对象。 |
| `CacheLimitedEventArgs` | `Limited` 事件参数，包含超出的数量和当前数量。 |

## 创建缓存

Discussions 通过数据访问器间接使用框架的缓存复用机制。缓存本身的独立演示来自 Core 的 memorycache 交互程序：频率一秒、滑动过期三十秒、数量提醒阈值五项。可以直接创建独立缓存实例，也可以使用共享实例。

来源：[framework/Zongsoft.Core/samples/memorycache/Program.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/samples/memorycache/Program.cs#L13)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
const int FREQUENCY  = 1;
const int EXPIRATION = 30;
const int LIMIT      = 5;

using var cache = new MemoryCache(TimeSpan.FromSeconds(FREQUENCY), LIMIT);
using var scanner = new MemoryCacheScanner(cache);

cache.Limited += Cache_Limited;
cache.Evicted += Cache_Evicted;
```
{% endcode %}

`MemoryCache.Shared` 是全局共享实例，它的 `Options` 是不可变的，不能在运行时修改。

## 读取与写入

`SetValue` 用于直接写入缓存项，`GetValue` 和 `TryGetValue` 用于读取缓存项，`Remove` 用于删除缓存项。

来源：[framework/Zongsoft.Core/test/Caching/MemoryCacheTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/MemoryCacheTest.cs#L14)（节选；上下文见源文件）。

{% code title="MemoryCacheTest.cs" %}
```csharp
public void Test()
{
	object value;

	var cache = new MemoryCache();
	Assert.Equal(0, cache.Count);
	Assert.False(cache.Contains("KEY"));
	Assert.False(cache.Remove("KEY", out _));
	Assert.False(cache.TryGetValue("KEY", out _));

	value = cache.GetOrCreate("K1", () => "V1");
	Assert.NotNull(value);
	Assert.True(cache.Contains("K1"));
	Assert.Equal("V1", value);
	Assert.True(cache.Remove("K1", out value));
	Assert.Equal("V1", value);
	Assert.Equal(0, cache.Count);

	const int COUNT = 10000;
	Parallel.For(0, COUNT, index => cache.SetValue($"KEY#{index}", $"Value#{index}@{Environment.CurrentManagedThreadId}"));
	Assert.Equal(COUNT, cache.Count);
}
```
{% endcode %}

当需要“没有就创建”的语义时，使用 `GetOrCreate` 或 `GetOrCreateAsync`。这些方法在读取未命中时调用工厂；并发未命中不等于工厂一定只执行一次，不应依赖它完成业务上的唯一写入。下面是数据访问器提供者的真实用途：缓存创建出的访问器，并把其 Disposed 通知作为缓存失效依赖。

来源：[framework/Zongsoft.Core/src/Data/DataAccessProviderBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/DataAccessProviderBase.cs#L52)（节选；上下文见源文件）。

{% code title="DataAccessProviderBase.cs" %}
```csharp
public TDataAccess GetAccessor(string name, IDataAccessOptions options = null)
{
	if(string.IsNullOrEmpty(name) || options == null || options.Settings == null || !options.Settings.Any())
		name = GetName(name);

	return _accesses.GetOrCreate(name, key =>
	{
		var accessor = this.CreateAccessor(name, options);
		return (accessor, accessor.Disposed);
	});
}
```
{% endcode %}

## 过期策略

`MemoryCache.Expiration` 可以表达滑动过期、绝对过期，或同时表达二者。下表是参数形式参考；其后的实际范例把终端输入 text 写入 Key#序号，使用 EXPIRATION 常量和同一类的 Now 属性记录状态。

| 写法 | 说明 |
| --- | --- |
| `TimeSpan.FromMinutes(10)` | 滑动过期，缓存项在指定时长内未被访问才过期。 |
| `DateTimeOffset.UtcNow.AddHours(1)` | 绝对过期，缓存项到指定时间点后过期。 |
| `(TimeSpan.FromMinutes(10), DateTimeOffset.UtcNow.AddHours(1))` | 同时设置滑动过期和绝对过期。 |

来源：[framework/Zongsoft.Core/samples/memorycache/Program.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/samples/memorycache/Program.cs#L72)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
cache.SetValue($"Key#{++count}", text, TimeSpan.FromSeconds(EXPIRATION), Now);
```
{% endcode %}

## 依赖令牌

缓存项可以依赖 [`IChangeToken`](https://source.dot.net/#Microsoft.Extensions.Primitives/IChangeToken.cs)。当令牌变更时，缓存项会被标记为失效，并触发淘汰回调。

来源：[framework/Zongsoft.Core/test/Caching/MemoryCacheTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/MemoryCacheTest.cs#L38)（节选；上下文见源文件）。

{% code title="MemoryCacheTest.cs" %}
```csharp
public void TestDependency()
{
	var cache = new MemoryCache();
	cache.Evicted += this.Cache_Evicted;

	var cancellation = new CancellationTokenSource();
	var value = cache.GetOrCreate("KEY", key =>
	{
		return ("Value1", new CancellationChangeToken(cancellation.Token));
	});

	Assert.NotNull(value);
	Assert.Equal("Value1", value);
	Assert.Equal(1, cache.Count);

	//通知缓存项过期
	cancellation.Cancel();
	Assert.False(cache.Contains("KEY"));
	Assert.Equal(0, cache.Count);

	//清理缓存
	cache.Compact();

	//等待缓存项过期事件的触发
	Assert.True(SpinWait.SpinUntil(() => Volatile.Read(ref _reason) >= 0, 10_000), "等待缓存项过期事件回调超时。");

	//确认缓存过期的原因
	Assert.Equal(CacheEvictedReason.Depended, (CacheEvictedReason)Volatile.Read(ref _reason));

	//创建一个已经过期的缓存项
	value = cache.GetOrCreate("KEY", key =>
	{
		return ("Value2", new CancellationChangeToken(cancellation.Token));
	});

	Assert.NotNull(value);
	Assert.Equal("Value2", value);
	Assert.False(cache.Contains("KEY"));
	Assert.Equal(0, cache.Count);

	//创建一个依赖失效的缓存项
	value = cache.GetOrCreate("KEY", key =>
	{
		return ("Value3", Common.Notification.GetToken());
	});

	Assert.NotNull(value);
	Assert.Equal("Value3", value);
	Assert.False(cache.Contains("KEY"));
	Assert.Equal(0, cache.Count);
}
```
{% endcode %}

示例中的 [`CancellationChangeToken`](https://source.dot.net/#Microsoft.Extensions.Primitives/CancellationChangeToken.cs) 会把取消令牌转换为缓存依赖令牌。

依赖失效对应的淘汰原因是 `CacheEvictedReason.Depended`。

## 事件

`MemoryCache` 提供两个事件。上面的 TestDependency 依赖同一测试类的 Cache_Evicted 回调记录原因，并等待异步通知；复用测试时应保留整个夹具。交互范例则在 Limited 回调中主动 Clear：这是范例选择的清理策略，并非缓存内部自动执行。

事件含义如下：

| 事件 | 触发时机 |
| --- | --- |
| `Evicted` | 缓存项因为过期、依赖失效、删除、替换或容量压力被淘汰。 |
| `Limited` | 设置或创建缓存项后，当前数量超过 `MemoryCacheOptions.CountLimit`。 |

来源：[framework/Zongsoft.Core/samples/memorycache/Program.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/samples/memorycache/Program.cs#L96)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
private static void Cache_Limited(object sender, CacheLimitedEventArgs e)
{
	var content = CommandOutletContent.Create(CommandOutletColor.Magenta, "** Limited **\t")
		.Append(CommandOutletColor.DarkYellow, e.Limit.ToString())
		.Append(CommandOutletColor.DarkGray, "/")
		.Append(CommandOutletColor.DarkYellow, e.Count.ToString());

	Terminal.WriteLine(content);

	//清空缓存
	((MemoryCache)sender).Clear();
}
```
{% endcode %}

{% hint style="warning" %}
`CountLimit` 是 Zongsoft 层面的提醒阈值。超过阈值时会触发 `Limited` 事件，但不会自动删除缓存项；需要应用根据场景调用 `Compact`、`Clear` 或调整缓存写入策略。
{% endhint %}

## 清理与扫描

`Compact` 用于触发底层缓存清理。因为缓存项过期或依赖失效后不一定立即从底层容器中移除，主动调用 `Compact(0)` 可以促使缓存执行扫描。

`MemoryCacheScanner` 封装了一个定时器，按 `MemoryCacheOptions.ScanFrequency` 周期调用 `Compact(0)`。

来源：[framework/Zongsoft.Core/src/Caching/MemoryCacheScanner.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCacheScanner.cs#L52)（节选；上下文见源文件）。

{% code title="MemoryCacheScanner.cs" %}
```csharp
public void Start() => _timer.Change(TimeSpan.Zero, _cache.Options.ScanFrequency);
public void Stop() => _timer.Change(Timeout.Infinite, Timeout.Infinite);
```
{% endcode %}

## 相关资源

* [MemoryCache.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCache.cs)
* [MemoryCacheOptions.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCacheOptions.cs)
* [MemoryCacheScanner.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Caching/MemoryCacheScanner.cs)
* [MemoryCacheTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Caching/MemoryCacheTest.cs)
