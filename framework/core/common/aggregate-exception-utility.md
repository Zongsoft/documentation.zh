---
description: AggregateExceptionUtility 聚合异常处理工具。
icon: circle-info
---

# AggregateExceptionUtility

`AggregateExceptionUtility` 提供 `Handle<TException>` 扩展方法，用于从 `AggregateException` 中查找指定异常类型并调用处理函数。

{% code title="AggregateExceptionUtility.cs" %}
```csharp
try
{
	await Task.WhenAll(tasks);
}
catch(AggregateException exception)
{
	var handled = exception.Handle<InvalidOperationException>(error =>
	{
		Console.WriteLine(error.Message);
		return true;
	});
}
```
{% endcode %}

它适合并行任务、批处理和多路异步调用合并异常后的定向处理。

## 相关资源

* [AggregateExceptionUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/AggregateExceptionUtility.cs)
