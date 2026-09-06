---
description: Buffer 内存租赁、编码解码和二进制读取工具。
icon: code
---

# Buffer

`Buffer` 提供围绕 [`IMemoryOwner<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.buffers.imemoryowner-1) _[源码](https://source.dot.net/#System.Private.CoreLib/IMemoryOwner.cs)_、数组租赁、文本编码解码和 [`ReadOnlySequence<byte>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.buffers.readonlysequence-1) _[源码](https://source.dot.net/#System.Memory/ReadOnlySequence.cs)_ 数值读取的工具方法。

## 内存租赁

来源：[framework/Zongsoft.Core/test/Common/BufferTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/BufferTest.cs#L10)（节选；上下文见源文件）。

{% code title="BufferTest.cs" %}
```csharp
public void Lease_Array_CopiesValidPrefixAndDoesNotObserveCallerMutation()
{
	var source = new[] { 1, 2, 3, 4 };
	using var owner = source.Lease(3);

	source[0] = 10;
	source[3] = 40;

	Assert.Equal(3, owner.Memory.Length);
	Assert.Equal([1, 2, 3], owner.Memory.ToArray());
}
```
{% endcode %}

上述框架回归用例验证 Lease 复制有效前缀，不会随着原数组随后修改而变化；不能把它当成原数组的共享视图。释放时会归还内部数组池。

## 释放与所有权

来源：[framework/Zongsoft.Core/test/Common/BufferTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/BufferTest.cs#L35)（节选；上下文见源文件）。

{% code title="BufferTest.cs" %}
```csharp
public void Lease_Array_DisposeIsIdempotentAndMakesOwnerInaccessible()
{
	var source = new byte[] { 1, 2, 3 };
	var owner = source.Lease();

	owner.Dispose();
	owner.Dispose();

	Assert.Equal([1, 2, 3], source);
	Assert.Throws<ObjectDisposedException>(() => _ = owner.Memory);
}
```
{% endcode %}

测试验证释放可重复调用，释放后不能继续读取租赁内存。编码和解码方法同样返回需要释放的拥有者；它们的默认文本编码是 UTF-8。

## 二进制读取

`Buffer` 提供大端和小端读取方法，例如 `TryGetInt32BigEndian`、`TryGetUInt64LittleEndian`、`TryGetDoubleBigEndian`。

这些方法适合网络协议、二进制文件和跨平台数据包解析。

## 相关资源

* [Buffer.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Buffer.cs)
