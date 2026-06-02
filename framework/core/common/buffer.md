---
description: Buffer 内存租赁、编码解码和二进制读取工具。
icon: code
---

# Buffer

`Buffer` 提供围绕 `IMemoryOwner<T>`、数组租赁、文本编码解码和 `ReadOnlySequence<byte>` 数值读取的工具方法。

## 内存租赁

{% code title="LeaseBuffer.cs" %}
```csharp
var source = new byte[] { 1, 2, 3, 4 };

using var owner = source.Lease();
ReadOnlyMemory<byte> memory = owner.Memory;
```
{% endcode %}

`Lease` 会按指定长度从数组创建可释放的内存拥有者。释放租赁数组时会归还内部数组池。

## 编码和解码

{% code title="EncodeBuffer.cs" %}
```csharp
using var bytes = "hello".Encode();
using var chars = bytes.Memory.Decode();
```
{% endcode %}

默认编码为 UTF-8，也可以显式传入其它 `Encoding`。

## 二进制读取

`Buffer` 提供大端和小端读取方法，例如 `TryGetInt32BigEndian`、`TryGetUInt64LittleEndian`、`TryGetDoubleBigEndian`。

这些方法适合网络协议、二进制文件和跨平台数据包解析。

## 相关资源

* [Buffer.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Buffer.cs)
