---
description: MQTT 消息项目的部署、连接、协议映射与可靠性边界。
icon: message
---

# MQTT

通过 MQTTnet 接入 MQTT 发布订阅，适合设备遥测和轻量消息交换。主题过滤器和协议级 QoS 是主要配置语义。公共概念见[发布订阅与投递](../concepts.md)，跨项目比较和完整调用示例见[消息队列](../../messaging.md)。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `messaging/mqtt` |
| NuGet 包 | `Zongsoft.Messaging.Mqtt` |
| 提供者及连接驱动名 | `Mqtt` |

## 部署与连接

把实现包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，保留清单和运行依赖。Broker 地址、账号与主题权限由运行环境提供。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft messaging mqtt]
nuget:Zongsoft.Messaging.Mqtt
```
{% endcode %}

来源：[framework/messaging/mqtt/samples/client/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/mqtt/samples/client/Program.cs#L17)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
using var queue = new MqttQueue("MQTT",
	Configuration.MqttConnectionSettingsDriver.Instance.GetSettings("Mqtt", $"server=127.0.0.1:1883;client=Zongsoft.Messaging.Mqtt.Sample-{Guid.NewGuid():N};"));
```
{% endcode %}

Discussions 当前没有接入此队列的业务流程，因此采用该项目现有交互式客户端。这里直接构造队列，主题由 subscribe / produce 命令传入。运行前需要按隔离环境调整地址、客户端标识和权限配置。

## 示例中的订阅入口

来源：[framework/messaging/mqtt/samples/client/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/mqtt/samples/client/Program.cs#L38)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
executor.Command("subscribe", async (context, cancellation) =>
{
	if(context.Arguments.IsEmpty)
		throw new CommandException("Missing the topics for subscribe.");

	for(int i = 0; i < context.Arguments.Count; i++)
	{
		var subscriber = await queue.SubscribeAsync(context.Arguments[i], Handler.Instance, cancellation);

		if(subscriber == null)
			context.Output.WriteLine(CommandOutletColor.DarkRed, $"Failed to subscribe topic: {context.Arguments[i]}");
		else
			context.Output.WriteLine(CommandOutletColor.DarkGreen, $"The subscription to the '{subscriber.Topic}' topic was successful.");
	}
});
```
{% endcode %}

executor 和 Handler.Instance 来自同一 Program.cs。客户端保持交互循环，close 命令释放它直接创建的队列。若改为从应用提供者取得共享队列，所有权需要按提供者约定处理。

## 协议映射

订阅可使用 MQTT 主题过滤器，发布应指定具体主题，不把通配符作为实际发布主题。当前通过连接管理器直接发布，并处理重连与重新订阅。

## 首次接入

1. 为测试客户端设置明确且不冲突的 Client 标识，核对 Broker 允许的主题。
2. 使用 Mqtt 提供者订阅过滤器，再从另一个客户端向具体主题发布。
3. 验证所需 QoS、断线恢复、显式确认，以及订阅恢复后的重复消息。

异步业务处理使用公共处理器契约，不能把异步 lambda 交给同步委托订阅重载。提供者取得的队列可能共享，消费者只释放自己拥有的订阅资源；完整示例见[消息队列](../../messaging.md)。

## 可靠性边界

{% hint style="warning" %}
🚨 当前订阅设置 NoLocal，应使用两个客户端验证发布和接收，不能依靠同一客户端收回自身消息。协议级 QoS 不代表业务副作用恰好一次；应用仍需幂等处理。
{% endhint %}

故障实验需要区分发布结果、Broker 接纳、业务提交和消息确认，参见[可靠投递与消息存储](../reliability.md)。

## 项目资源

[消息项目索引](README.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/messaging/mqtt)
