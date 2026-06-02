---
description: Zongsoft.Components Filter 过滤器与可过滤对象。
icon: filter
---

# Filter

`Filter` 是围绕执行上下文进行前后处理的轻量扩展点。它通常不独立承担业务逻辑，而是在命令、事件、执行器或管理器执行前后完成校验、审计、短路、上下文补全等横切工作。

过滤器由承载者决定何时调用。一般会在主逻辑执行前调用 `OnFiltering(...)`，在主逻辑执行后调用 `OnFiltered(...)`。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IFilter<TContext>` | 过滤器接口，基于指定上下文参与执行流程。 |
| `IFilterable<TContext>` | 可挂载过滤器的对象接口。 |

{% code title="审计过滤器" %}
```csharp
public sealed class AuditFilter : IFilter<IExecutorContext>
{
	public ValueTask OnFiltering(
		IExecutorContext context,
		CancellationToken cancellation)
	{
		return WriteBeginAsync(context, cancellation);
	}

	public ValueTask OnFiltered(
		IExecutorContext context,
		CancellationToken cancellation)
	{
		return WriteEndAsync(context, cancellation);
	}
}
```
{% endcode %}

## 常见承载者

`EventRegistryBase`、`EventManager`、`ExecutorBase<TArgument>` 等类型都围绕上下文提供过滤能力。它们的共同点是：主流程由承载者控制，过滤器只在关键节点插入逻辑。

## 适用场景

* 在事件处理前检查事件参数是否满足条件。
* 在执行器调用前注入租户、操作者或追踪信息。
* 在命令执行后记录审计日志。
* 在处理器执行前按权限、状态或特性开关进行短路。

{% hint style="info" %}
过滤器适合横切逻辑；如果逻辑本身是一个明确业务动作，通常应优先实现为命令、处理器或事件处理器。
{% endhint %}

过滤器尽量不要承担主要业务动作，避免让主流程难以追踪。它是否能短路执行取决于承载者实现；核心接口本身只定义前后通知。同一承载者上多个过滤器的执行顺序，也应以该承载者的集合顺序和实现为准。

## 参考实现

* [IFilter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IFilter.cs)
* [IFilterable.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IFilterable.cs)
