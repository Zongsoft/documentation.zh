---
description: Locker 同步和异步互斥锁。
icon: shield
---

# Locker

`Locker` 是一个轻量互斥锁封装，用于把同步代码和异步代码中的临界区串行化。

两个范例摘自 LockerTest；COUNT 是夹具中定义的循环次数 500。测试通过并发递增最终计数验证互斥效果，而不是用延时猜测执行顺序。

## 同步临界区

同步代码使用 `Lock()` 获取一个可释放的锁句柄，离开 `using` 作用域时自动释放。

来源：[framework/Zongsoft.Core/test/Common/LockerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/LockerTest.cs#L135)（节选；上下文见源文件）。

{% code title="LockerTest.cs" %}
```csharp
public void Lock()
{
	var count = 0;
	var locker = new Locker();

	Parallel.For(0, COUNT, i =>
	{
		using(locker.Lock())
		{
			count++;
		}
	});

	Assert.Equal(COUNT, count);
}
```
{% endcode %}

## 异步临界区

异步代码使用 `LockAsync()`，并通过 `await using` 释放锁。

来源：[framework/Zongsoft.Core/test/Common/LockerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/LockerTest.cs#L189)（节选；上下文见源文件）。

{% code title="LockerTest.cs" %}
```csharp
public async Task LockAsync2()
{
	const int TIMES = 50;

	var count = 0;
	var locker = new Locker();

	await Parallel.ForAsync(0, TIMES, async (_, cancellation) =>
	{
		for(int i = 0; i < COUNT; i++)
		{
			await using(await locker.LockAsync(cancellation))
			{
				count++;
			}
		}
	});

	Assert.Equal(COUNT * TIMES, count);
}
```
{% endcode %}

LockAsync 支持取消令牌，适合需要取消等待锁的后台任务。

{% hint style="info" %}
如果需要创建变更令牌，请参阅 [Notification](notification.md)；如果需要表达操作失败原因，请参阅 [OperationException](operation-exception.md)。
{% endhint %}

## 相关资源

* [Locker.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Locker.cs)
* [LockerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/LockerTest.cs)
