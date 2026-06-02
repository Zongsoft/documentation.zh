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

{% code title="OperationException.cs" %}
```csharp
throw OperationException.Unsupported(
	"The current provider does not support batch import.");
```
{% endcode %}

调用方可以通过 `IsArgument`、`IsUnknown`、`IsUnfound`、`IsUnsupported` 等属性判断异常原因。

## 相关资源

* [OperationException.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/OperationException.cs)
