---
description: Locker 同步和异步互斥锁。
icon: shield
---

# Locker

`Locker` 是一个轻量互斥锁封装，用于把同步代码和异步代码中的临界区串行化。

## 同步临界区

同步代码使用 `Lock()` 获取一个可释放的锁句柄，离开 `using` 作用域时自动释放。

{% code title="LockerSync.cs" %}
```csharp
using Zongsoft.Common;

var count = 0;
var locker = new Locker();

Parallel.For(0, 500, _ =>
{
	using(locker.Lock())
	{
		count++;
	}
});
```
{% endcode %}

## 异步临界区

异步代码使用 `LockAsync()`，并通过 `await using` 释放锁。

{% code title="LockerAsync.cs" %}
```csharp
var locker = new Locker();

await using(await locker.LockAsync())
{
	await SaveAsync();
}
```
{% endcode %}

`LockAsync` 支持 `CancellationToken`，适合需要取消等待锁的后台任务。

{% hint style="info" %}
如果需要创建变更令牌，请参阅 [Notification](notification.md)；如果需要表达操作失败原因，请参阅 [OperationException](operation-exception.md)。
{% endhint %}

## 相关资源

* [Locker.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Locker.cs)
* [LockerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/LockerTest.cs)
