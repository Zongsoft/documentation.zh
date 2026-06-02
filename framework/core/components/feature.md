---
description: Zongsoft.Components Feature 特性模型和执行管线。
icon: layer-group
---

# Feature

`Feature` 是执行过程的策略描述。它不直接完成业务动作，而是声明“执行这段逻辑时应该具备哪些能力”，例如重试、回退、熔断、限流和超时。实际管线由 `IFeaturePipelineBuilder` 构建，`Zongsoft.Externals.Polly` 提供了基于 Polly 的实现。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IFeature` | 特性标记接口。 |
| `IFeatureBuilder` | 特性构建器接口。 |
| `IFeaturePipeline` | 执行特性管线接口。 |
| `IFeaturePipelineBuilder` | 特性管线构建器接口。 |
| `FeatureBuilder` | 默认特性构建器，提供链式组合入口。 |
| `Features.BreakerFeature` | 熔断特性。 |
| `Features.FallbackFeature` | 回退特性。 |
| `Features.RetryFeature` | 重试特性。 |
| `Features.ThrottleFeature` | 限流特性。 |
| `Features.TimeoutFeature` | 超时特性。 |

## 与 Polly 的配合

`Zongsoft.Externals.Polly` 会把核心框架中的 Feature 转换为 Polly 策略管线。这样核心框架只定义抽象策略，具体的弹性处理能力由扩展项目提供。

{% code title="Feature 链式组合" %}
```csharp
var executor = Executor
	.Features
	.Timeout(TimeSpan.FromSeconds(5))
	.Retry(3)
	.Fallback(TimeSpan.FromSeconds(1))
	.Build(async (_, cancellation) =>
	{
		await CallRemoteServiceAsync(cancellation);
		return true;
	});
```
{% endcode %}

## 适用场景

* 外部接口调用：超时、重试和熔断。
* 设备连接恢复：失败后间隔重试，并在无法恢复时回退。
* 消息处理：按处理器或主题限流。
* 后台任务：把策略配置和业务逻辑分开。

{% content-ref url="executor.md" %}
[executor.md](executor.md)
{% endcontent-ref %}

## 参考实现

* [Features 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Features)
* [Zongsoft.Externals.Polly](https://github.com/Zongsoft/framework/tree/main/externals/polly)
