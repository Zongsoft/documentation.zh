---
description: Zongsoft.Components Handler 处理器抽象、定位和选择。
icon: hand-pointer
---

# Handler

`Handler` 用于表达“能够处理某类上下文或请求的对象”。它比具体服务接口更松散，适合在插件树、消息系统、事件通道和调度器中挂载可扩展处理器集合。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IHandler`、`IHandler<TContext>` | 处理器接口。 |
| `IHandleable`、`IHandleable<TContext>` | 可处理对象接口，用于暴露处理能力。 |
| `IHandlerLocator` | 处理器定位器。 |
| `HandlerBase<TContext>`、`HandlerBase<TContext, TResult>` | 处理器基类。 |
| `HandlerSelector` | 根据 URL 或上下文选择处理器。 |
| `HandlerUtility` | 处理器 URL、名称和元数据辅助方法。 |
| `Handler` | 静态工厂，可把委托包装成处理器代理。 |

## 插件化处理器集合

消息、事件和调度场景经常需要让其他业务模块“往集合里挂一个处理器”。`Zongsoft.Messaging.ZeroMQ.plugin` 就暴露了请求器和应答器的处理器集合，其他模块可以把自己的处理器挂载到对应路径下。

{% code title="Zongsoft.Messaging.ZeroMQ.plugin" %}
```xml
<extension path="/Workbench/Messaging/Zero">
	<object name="Requester" type="Zongsoft.Messaging.ZeroMQ.ZeroRequester, Zongsoft.Messaging.ZeroMQ">
		<expose name="Handlers" value="{path:../@Handlers}" />
	</object>

	<object name="Responder" type="Zongsoft.Messaging.ZeroMQ.ZeroResponder, Zongsoft.Messaging.ZeroMQ">
		<expose name="Handlers" value="{path:../@Handlers}" />
	</object>
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

## 参考实现

* [Handler 相关源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
* [Zongsoft.Messaging.ZeroMQ.plugin](https://github.com/Zongsoft/framework/blob/main/messaging/zero/src/Zongsoft.Messaging.ZeroMQ.plugin)
