---
description: Zongsoft.Components 事件描述、事件交换与插件化事件处理器。
icon: bolt
---

# 事件

`Zongsoft.Components` 的事件模型用于把领域事件从具体模块中抽象出来，再通过插件树挂载事件描述和事件处理器。它的核心价值是解耦：事件发布方不需要知道处理器来自哪个模块，处理器也可以通过插件部署在不同运行环境中。

事件模型关注“发生了什么”。事件发布方声明事件名、参数和上下文，事件通道再把上下文投递给挂载在事件节点下的处理器。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `EventBinder` | 把实际事件源与事件描述绑定起来。 |
| `EventContext` | 事件执行上下文，承载事件名、参数、事件描述和处理状态。 |
| `EventDescriptor`、`EventDescriptorCollection` | 事件元数据和描述集合。 |
| `EventLocator` | 从插件路径或注册表中定位事件描述。 |
| `EventManager` | 管理事件描述、过滤器和处理流程。 |
| `EventExchanger` | 事件交换器，也是 `WorkerBase` 派生类，负责打开事件通道并交换事件上下文。 |
| `EventRegistryBase` | 事件注册表基类，适合模块集中声明事件。 |
| `IEventChannel` | 事件通道接口，负责承接事件上下文并投递到处理器。 |
| `Events.Channel(IMessageQueue)` | 把消息队列包装成事件通道的扩展方法。 |

## 插件化事件总线

事件总线的典型结构是：模块先定义事件描述，插件文件把事件暴露到 Workbench 路径下，其他模块再把处理器挂载到这些事件节点。这样新增处理器时通常只需要增加插件声明和处理器实现，不需要修改事件发布方。

{% code title="Zongsoft.Security.plugin" %}
```xml
<extension path="/Workbench/Modules">
	<object name="Security" value="{static:Zongsoft.Security.Module.Current, Zongsoft.Security}">
		<expose name="Events" value="{path:../@Events}" />
		<expose name="Properties" value="{path:../@Properties}" />
	</object>
</extension>

<!-- 事件声明 -->
<extension path="/Workbench/Modules/Security/Events">
	<expose name="Authentication" value="{path:../@Authentication}">
		<expose name="Authenticated" value="{path:../@Authenticated}" />
		<expose name="Authenticating" value="{path:../@Authenticating}" />
	</expose>
</extension>
```
{% endcode %}

`Zongsoft.Security` 的 `Module.Events.cs` 使用 `EventRegistryBase` 声明认证相关事件，并把事件描述绑定到认证模块的实际事件上。业务模块可以参照同样方式，把采集、测量、状态变化等事件发布出来，再通过 daemon 插件挂载处理器集合。

## 执行过程

{% stepper %}
{% step %}
## 注册事件

模块通过 `EventRegistryBase` 创建 `EventDescriptor`，并把事件描述放入插件树或事件注册表。
{% endstep %}

{% step %}
## 触发事件

业务代码构造 `EventContext`，或调用 `EventExchanger.RaiseAsync(...)` 以名称和参数触发事件。
{% endstep %}

{% step %}
## 定位处理器

`EventLocator` 根据事件名找到事件描述和插件节点，事件通道再取得挂载在该节点下的处理器集合。
{% endstep %}

{% step %}
## 交换与投递

`EventExchanger` 作为工作者打开通道，把上下文交给 `IEventChannel`，由通道完成处理器投递。
{% endstep %}
{% endstepper %}

{% hint style="info" %}
`EventExchanger.ExchangeAsync(...)` 只会在交换器处于 `Running` 状态时投递事件。宿主程序需要先启动事件交换器并打开对应事件通道。
{% endhint %}

## 消息队列事件通道

`Events.Channel(...)` 可以把一个 `IMessageQueue` 包装成 `IEventChannel`，让事件交换器通过消息队列转发事件。它适合多个进程、多个宿主或多个插件部署单元之间复用同一套事件模型：本地模块仍然只触发 Zongsoft 事件，跨进程投递由消息队列完成。

{% code title="MessageQueueEventChannel.cs" %}
```csharp
using Zongsoft.Components;
using Zongsoft.Messaging;

var queue = MessageQueueUtility.Queue("Events");

EventExchanger.Instance.Channels.Add(
	Events.Channel(
		queue,
		new MessageEnqueueOptions(MessageReliability.LeastOnce)));

EventExchanger.Instance.Start();
```
{% endcode %}

通道打开时会订阅固定主题 `Events`；发送事件时，会把事件上下文序列化为 UTF-8 JSON，并发布到 `Events/{事件完整名}` 主题。例如 `Security:Authentication.Authenticated` 会被发布到 `Events/Security:Authentication.Authenticated`。接收端从消息主题中还原事件完整名，再通过 `EventExchanger.RaiseAsync(...)` 在当前应用上下文中重放事件。

事件参数由 `Events.Marshaler` 负责序列化和反序列化。反序列化时会根据事件描述中的参数类型还原 `Argument`，并保留 `Parameters` 中的附加参数。因此跨进程使用事件通道时，事件参数类型必须在接收端可用，并且能被 JSON 序列化器正确处理。

{% hint style="warning" %}
消息队列事件通道约定“订阅 `Events`，发布 `Events/{事件完整名}`”。不同消息队列对主题前缀、通配符和路由键的支持不同；使用 Kafka、RabbitMQ、MQTT、ZeroMQ 或其它实现时，应先确认订阅 `Events` 是否能接收到 `Events/...` 形式的消息，或由具体队列实现提供等价的主题匹配规则。如果底层队列只支持严格主题匹配，通常需要自定义事件通道或在队列实现中显式处理该映射。
{% endhint %}

发送端可以通过 `MessageEnqueueOptions` 指定可靠性、过期时间、优先级和扩展属性；这些选项是否生效仍取决于底层消息队列实现。接收端的确认、重试和失败处理也不会因为包装成事件通道而自动获得更强语义，需要按所选消息队列和业务幂等策略设计。

<details>
<summary>如何限制哪些事件进入消息队列？</summary>

事件通道内部带有 `EventFiltering`。过滤项使用 `注册表名.事件名` 匹配，前缀 `!` 表示排除，`*` 表示全部。它适合在通道层控制跨进程广播范围，例如只转发 `Security.*`，或排除高频本地事件。通过插件或对象构建器挂载通道时，可以把过滤规则作为通道对象的 `Filtering` 属性配置；如果事件名本身包含点号，应按当前解析规则验证过滤项是否能准确命中。
</details>

<details>
<summary>适合使用事件总线的场景</summary>

认证成功后写审计日志、设备状态变化后推送告警、订单支付后触发积分和通知、数据采集完成后进行聚合计算，这些都适合使用事件总线。事件发布方只负责“发生了什么”，扩展模块通过插件挂载处理器来决定“接下来做什么”。
</details>

事件适合一对多扩展和跨模块后续动作，不适合替代必须立即返回结果的业务调用。事件名和参数应保持稳定；处理器能否收到事件取决于事件描述、插件挂载和通道实现。如果处理顺序、事务一致性或返回值是核心需求，通常应优先考虑命令、处理器或显式服务接口。

## 参考实现

* [Module.Events.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Module.Events.cs)
* [Zongsoft.Security.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.plugin)
* [Events.Channel.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Events.Channel.cs)
* [Components 事件源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
