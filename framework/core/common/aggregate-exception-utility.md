---
description: AggregateExceptionUtility 聚合异常处理工具。
icon: circle-info
---

# AggregateExceptionUtility

`AggregateExceptionUtility` 提供 `Handle<TException>` 扩展方法，用于从 [`AggregateException`](https://learn.microsoft.com/zh-cn/dotnet/api/system.aggregateexception) _[源码](https://source.dot.net/#System.Private.CoreLib/AggregateException.cs)_ 中查找指定异常类型并调用处理函数。

来源：[framework/externals/wechat/gateway/Controllers/FallbackController.cs](https://github.com/Zongsoft/framework/blob/main/externals/wechat/gateway/Controllers/FallbackController.cs#L72)（节选；上下文见源文件）。

{% code title="FallbackController.cs" %}
```csharp
return (IActionResult)ae.Handle<OperationException>(ex => ex.Reason switch
{
	nameof(OperationException.Unfound) => this.NotFound(new { ex.Reason, ex.Message }),
	nameof(OperationException.Unsupported) => this.BadRequest(new { ex.Reason, ex.Message }),
	nameof(OperationException.Unprocessed) => this.UnprocessableEntity(new { ex.Reason, ex.Message }),
	nameof(OperationException.Unsatisfied) => this.StatusCode(StatusCodes.Status412PreconditionFailed, new { ex.Reason, ex.Message }),
	_ => this.StatusCode(StatusCodes.Status500InternalServerError, new { ex.Reason, ex.Message }),
});
```
{% endcode %}

## 实际调用与返回值

Discussions 未直接使用这个工具；上面是微信回调控制器捕获 System.AggregateException 后的真实处理片段。它把内部 OperationException 的 Reason 转为对应 HTTP 结果，返回对象就是扩展方法的返回值。完整控制器还分别处理直接抛出的 OperationException。

## 匹配边界

工具先 Flatten 展开嵌套异常，再寻找第一个匹配类型。找到后立即调用委托并返回，不会继续遍历剩余异常；委托返回 true 也不表示“处理完所有异常”。如果没有任何匹配项，会把未处理项重新组成聚合异常抛出。输入异常为空时返回空；处理委托为空则抛出参数异常。

{% hint style="warning" %}
🚨 这与 System.AggregateException 自带的逐项 Handle 语义不同。需要完整记录批处理的所有失败时，应保留原始异常集合；也不要假设 await 一个失败任务总会抛出聚合异常。本文采用控制器已经捕获聚合异常后的处理分支。
{% endhint %}

## 相关资源

* [AggregateExceptionUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/AggregateExceptionUtility.cs)
