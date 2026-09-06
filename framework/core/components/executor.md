---
description: Zongsoft.Components Executor 执行器、上下文、Feature 特性和执行管线。
icon: bolt-lightning
---

# 执行管线

执行管线把一段处理逻辑包装成统一的执行单元，并通过上下文和 Feature 特性扩展重试、回退、熔断、限流、超时等横切能力。它适合把“调用某个处理器”这件事抽象成可组合、可配置、可测试的运行时对象。

`Executor` 负责把委托、处理器或上下文处理逻辑包装成 `IExecutor`；`Feature` 负责声明执行时需要的策略能力；`IFeaturePipelineBuilder` 负责把这些特性构建成实际管线。业务逻辑仍然保持为普通委托或处理器，策略逻辑由管线统一承担。

这个模型适合需要把横切策略放到统一入口的场景。调用方面对的是 `IExecutor<TArgument>` 或 `IExecutor<TArgument, TResult>`，不需要知道背后是委托、处理器还是插件加载出来的对象。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IExecutor` | 执行器接口，定义基于上下文的执行入口。 |
| `IExecutor<TArgument>` | 带参数类型的执行器接口。 |
| `IExecutor<TArgument, TResult>` | 带参数和返回值类型的执行器接口。 |
| `IExecutorContext` | 执行上下文接口，承载输入、输出、服务和执行状态。 |
| `Executor` | 执行器静态工厂，提供 `Build(...)` 和全局 `Features`、`Pipelines` 扩展点。 |
| `ExecutorContext<TArgument>`、`ExecutorContext<TArgument, TResult>` | 默认执行上下文实现。 |
| `ExecutorBase<TArgument>`、`ExecutorBase<TArgument, TResult>` | 执行器基类，支持过滤器和模板方法。 |
| `IFeature` | 执行特性的标记接口。 |
| `IFeatureBuilder` | 特性构建器接口，用于链式组合多个执行策略。 |
| `IFeaturePipeline` | 执行特性管线接口。 |
| `IFeaturePipelineBuilder` | 特性管线构建器接口。 |
| `FeatureBuilder` | 默认特性构建器，提供链式组合入口。 |
| `Features.BreakerFeature` | 熔断特性。 |
| `Features.FallbackFeature` | 回退特性。 |
| `Features.RetryFeature` | 重试特性。 |
| `Features.ThrottleFeature` | 限流特性。 |
| `Features.TimeoutFeature` | 超时特性。 |

## 执行模型

`Executor.Build(...)` 可以把委托、处理器或上下文处理逻辑包装成 `IExecutor`。如果指定了 Feature，则会通过 `Executor.Pipelines` 构建特性管线，再把原始执行逻辑包在管线中执行。

来源：[framework/externals/polly/samples/Program.cs](https://github.com/Zongsoft/framework/blob/main/externals/polly/samples/Program.cs#L207)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
var executor = _features.Build<int>(OnExecuteAsync);
```
{% endcode %}

这是 framework 的 Polly 交互样例：retry、timeout 等命令修改 _features，执行命令再据此构建处理整数输入的执行器；OnExecuteAsync 在同一文件中定义。完整样例及其策略配置见[任务调度与弹性执行](../../externals/execution.md)。Discussions 当前没有在帖子写入外层配置自动重试，不能直接重放包含文件与统计更新的写入流程。

在这种结构里，业务代码只表达“要执行什么”，重试、回退、熔断、限流等策略由 Feature 管线提供，不需要散落在业务代码中。

## 与 Polly 的配合

核心框架只定义 Feature 特性模型和管线构建扩展点，不直接绑定某个弹性处理库。`Zongsoft.Externals.Polly` 会把核心框架中的 Feature 转换为 Polly 策略管线，让应用在保留统一抽象的同时获得具体的重试、超时、熔断等执行能力。

{% hint style="info" %}
如果没有注册对应的 `IFeaturePipelineBuilder` 实现，Feature 只是一组策略描述，不能自动产生重试、限流或熔断行为。实际效果取决于宿主程序加载的扩展和配置。
{% endhint %}

## 使用场景

* 调用外部接口时给处理逻辑增加超时、重试和熔断。
* 把消息处理器包装成统一执行器，便于统一记录日志和异常。
* 在设备采集、事件处理、调度任务中复用同一套执行上下文。
* 为插件加载出来的处理器增加一致的执行策略。
* 把策略配置和业务逻辑分开，让调用方只关心执行入口。

如果只是一次本地方法调用，没有复用策略或统一上下文需求，直接调用业务方法通常更简单。Feature 的执行顺序和具体行为取决于管线构建器实现，应在实际样例中观察每项策略对执行次数、返回值和异常的影响。

## 参考实现

* [Executor.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Executor.cs)
* [Features 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Features)
* [Zongsoft.Externals.Polly](https://github.com/Zongsoft/framework/tree/main/externals/polly)
