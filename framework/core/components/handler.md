---
description: Zongsoft.Components Handler 处理器抽象、定位和选择。
icon: hand-pointer
---

# Handler

`Handler` 用于表达“能够处理某类上下文或请求的对象”。它比具体服务接口更松散，适合在插件树、消息系统、事件通道和调度器中挂载可扩展处理器集合。

处理器模型关注“谁能处理这件事”。调用方可以拿到一个处理器集合，再由定位器、选择器或宿主流程挑选合适处理器执行。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IHandler`、`IHandler<TContext>` | 处理器接口。 |
| `IHandler<TArgument, TResult>` | 带返回值的处理器接口。 |
| `IHandleable`、`IHandleable<TContext>` | 可处理对象接口，用于暴露处理能力。 |
| `IHandlerLocator` | 处理器定位器。 |
| `HandlerBase<TContext>`、`HandlerBase<TContext, TResult>` | 处理器基类。 |
| `HandlerSelector` | 根据 URL 或上下文选择处理器。 |
| `HandlerAttribute` | 为处理器声明 URL 模板和顺序。 |
| `HandlerUtility` | 处理器 URL、名称和元数据辅助方法。 |
| `Handler` | 静态工厂，可把委托包装成处理器代理。 |

来源：[framework/Zongsoft.Diagnostics/protocols/server/samples/MetricHandler.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/server/samples/MetricHandler.cs#L12)（节选；上下文见源文件）。

{% code title="MetricHandler.cs" %}
```csharp
public class MetricHandler : HandlerBase<IEnumerable<Zongsoft.Diagnostics.Telemetry.Metrics.Meter>>
{
	protected override ValueTask OnHandleAsync(IEnumerable<Telemetry.Metrics.Meter> meters, Parameters parameters, CancellationToken cancellation)
	{
		foreach(var meter in meters)
			Terminal.WriteLine(CommandOutletDumper.Dump(meter));

		return ValueTask.CompletedTask;
	}
}
```
{% endcode %}

这个处理器来自诊断协议服务端样例：输入是一组已经转换为框架模型的 Meter，处理方法逐项输出到终端。它没有声明 HandlerAttribute；监听器通过插件集合取得它。HandlerUtility 的 URL 模板能力属于另一种按地址选择处理器的机制，不能据此推断所有处理器都需要 URL。

## 插件化处理器集合

诊断样例把 MetricHandler 挂到 Metrics 监听器暴露的集合中。这里的路径、对象名和类型都来自同一个样例插件；启动顺序与监听地址见 [OTLP 接收](../../diagnostics/otlp.md)。

来源：[framework/Zongsoft.Diagnostics/protocols/server/samples/Zongsoft.Diagnostics.Protocols.Server.Samples.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/server/samples/Zongsoft.Diagnostics.Protocols.Server.Samples.plugin#L19)（节选；上下文见源文件）。

{% code title="Zongsoft.Diagnostics.Protocols.Server.Samples.plugin" %}
```xml
<extension path="/Workbench/Diagnostics/Telemetry/Listener/Metrics">
	<object name="MetricHandler" type="Zongsoft.Diagnostics.Protocols.Server.Samples.MetricHandler, Zongsoft.Diagnostics.Protocols.Server.Samples" />
</extension>
```
{% endcode %}

这种模式的重点不是“某个接口有多少方法”，而是“某个扩展点可以接收哪些处理器”。业务模块只要实现处理器并挂载到集合，就能参与消息处理流程。

## 与命令和事件的区别

| 模型 | 关注点 |
| --- | --- |
| 命令 | 调用方提交一段表达式，由命令树解析和执行。 |
| 事件 | 发布方声明“发生了什么”，处理器通过事件节点解耦扩展。 |
| 处理器 | 扩展点维护一个处理器集合，由定位器或选择器挑选合适处理器。 |

处理器适合插件化扩展点、消息响应、事件投递和调度任务。如果调用方明确依赖某个领域服务，并且需要强类型业务契约，直接定义服务接口通常更清楚。`HandlerSelector` 是基于处理器 URL 模板的本地选择器，复杂路由、权限判断或负载均衡通常应交给更专门的机制。

## 参考实现

* [Handler 相关源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
* [Zongsoft.Messaging.ZeroMQ.plugin](https://github.com/Zongsoft/framework/blob/main/messaging/zero/src/Zongsoft.Messaging.ZeroMQ.plugin)
