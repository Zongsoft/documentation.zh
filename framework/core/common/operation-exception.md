---
description: OperationException 操作异常。
icon: circle-info
---

# OperationException

`OperationException` 是框架级操作异常。它通过 `Reason` 表达失败类型，并提供一组静态工厂方法。

| 工厂方法 | 语义 |
| --- | --- |
| `Argument` | 参数不正确。 |
| `Unknown` | 未知错误。 |
| `Unfound` | 目标不存在。 |
| `Unsatisfied` | 条件不满足。 |
| `Unprocessed` | 操作未处理。 |
| `Unsupported` | 不支持该操作。 |

来源：[framework/Zongsoft.Core/test/Messaging/MessageQueueBaseTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Messaging/MessageQueueBaseTest.cs#L59)（节选；上下文见源文件）。

{% code title="MessageQueueBaseTest.cs" %}
```csharp
public async Task UnsupportedDelayFailsBeforeDriverOperation()
{
	using var queue = new TestQueue();
	var options = new MessageEnqueueOptions(TimeSpan.FromSeconds(1));

	var exception = await Assert.ThrowsAsync<OperationException>(() => queue.ProduceAsync("tests/delay", ReadOnlyMemory<byte>.Empty, options).AsTask());

	Assert.Equal(nameof(OperationException.Unsupported), exception.Reason);
	Assert.Contains(MessageQueueFeature.Delay.Name, exception.Message);
	Assert.Equal(0, queue.ProduceCount);
}
```
{% endcode %}

## 实际用例

上面是框架消息抽象的能力测试：不支持延迟的队列拒绝带延迟选项的发送请求。测试检查 Reason 为 Unsupported，同时确认驱动尚未执行。TestQueue 属于测试夹具，不连接实际中间件。Discussions 没有这个队列实现，相关业务异常应以其服务为准。

## 边界与错误响应

Reason 是供程序判断的分类，Message 面向诊断或用户说明；不要通过匹配错误文本决定业务分支。工厂只创建异常，不会自动抛出、重试或转换 HTTP 状态。网关如何转成响应见[聚合异常处理](aggregate-exception-utility.md)。

调用方可以通过 `IsArgument`、`IsUnknown`、`IsUnfound`、`IsUnsupported` 等属性判断异常原因。

## 相关资源

* [OperationException.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/OperationException.cs)
