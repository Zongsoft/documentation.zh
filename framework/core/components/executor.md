---
description: Zongsoft.Components Executor 执行器、上下文和 Feature 管线。
icon: bolt-lightning
---

# Executor

`Executor` 把一段处理逻辑包装成统一的执行单元，并通过上下文和 Feature 管线扩展重试、熔断、限流、超时等能力。它适合把“调用某个处理器”这件事抽象成可组合、可配置、可测试的运行时对象。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IExecutor` | 执行器接口，定义基于上下文的执行入口。 |
| `IExecutorContext` | 执行上下文接口，承载输入、输出、服务和执行状态。 |
| `Executor` | 执行器静态工厂，提供 `Build(...)` 和全局 `Features`、`Pipelines` 扩展点。 |
| `ExecutorContext` | 默认执行上下文实现。 |
| `ExecutorBase<TContext>` | 执行器基类，支持过滤器和模板方法。 |

## 与 Feature 的关系

`Executor.Build(...)` 可以把委托、处理器或上下文处理逻辑包装成 `IExecutor`。如果指定了 Feature，则会通过 `Executor.Pipelines` 构建特性管线，再把原始执行逻辑包在管线中执行。

{% code title="带 Feature 的执行器" %}
```csharp
var executor = Executor
	.Features
	.Fallback(TimeSpan.FromSeconds(1))
	.Retry(3)
	.Build(async (context, cancellation) =>
	{
		await SendAsync(context.Argument, cancellation);
		return true;
	});

await executor.ExecuteAsync(new ExecutorContext(message), cancellation);
```
{% endcode %}

在这种结构里，业务代码仍然是一个普通委托；重试、回退、熔断、限流等策略由 Feature 管线提供，不需要散落在业务代码中。

## 使用场景

* 调用外部接口时给处理逻辑增加重试和超时。
* 把消息处理器包装成统一执行器，便于统一记录日志和异常。
* 在设备采集、事件处理、调度任务中复用同一套执行上下文。
* 为插件加载出来的处理器增加一致的执行策略。

{% content-ref url="feature.md" %}
[feature.md](feature.md)
{% endcontent-ref %}

## 参考实现

* [Executor.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Executor.cs)
* [Zongsoft.Externals.Polly](https://github.com/Zongsoft/framework/tree/main/externals/polly)
