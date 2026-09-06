---
description: Kafka 消息项目的部署、连接、协议映射与可靠性边界。
icon: message
---

# Kafka

通过 Confluent.Kafka 将框架消息契约接入 Kafka。适合围绕主题、分区和消费组组织事件流的应用。公共概念见[发布订阅与投递](../concepts.md)，跨项目比较和完整调用示例见[消息队列](../../messaging.md)。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `messaging/kafka` |
| NuGet 包 | `Zongsoft.Messaging.Kafka` |
| 提供者及连接驱动名 | `Kafka` |

## 部署与连接

把实现包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，保留清单和运行依赖。Broker 地址、账号与主题权限由运行环境提供。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft messaging kafka]
nuget:Zongsoft.Messaging.Kafka
```
{% endcode %}

来源：[framework/messaging/kafka/samples/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/kafka/samples/Program.cs#L17)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
using var queue = new KafkaQueue("Kafka",
	Configuration.KafkaConnectionSettingsDriver.Instance.GetSettings("Kafka", $"server=127.0.0.1:9092;client=Zongsoft.Messaging.Kafka.Sample-{Guid.NewGuid():N};"));
```
{% endcode %}

Discussions 当前没有接入此队列的业务流程，因此采用该项目现有交互式客户端。这里直接构造队列，主题由 subscribe / produce 命令传入。运行前需要按隔离环境调整地址、客户端标识和权限配置。

## 示例中的订阅入口

来源：[framework/messaging/kafka/samples/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/kafka/samples/Program.cs#L38)（节选；上下文见源文件）。

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

Topic 对应 Kafka 主题，Group 对应消费组，Client 是客户端标识。确认消息时提交相关分区的消费位点；顺序与消费并发需要结合分区设计理解。

## 首次接入

1. 准备独立测试主题及消费组，确认 Broker 地址和客户端权限。
2. 按公共消息示例取得 Kafka 队列，使用异步处理器订阅。
3. 发送带业务标识的消息，观察分区、消费位点、处理结果，再验证重复与重启。

异步业务处理使用公共处理器契约，不能把异步 lambda 交给同步委托订阅重载。提供者取得的队列可能共享，消费者只释放自己拥有的订阅资源；完整示例见[消息队列](../../messaging.md)。

## 可靠性边界

{% hint style="warning" %}
🚨 当前 ConsumerConfig 未关闭 SDK 的自动提交和自动位点记录。显式确认映射到 Commit，并不代表所有未确认消息都必然重新投递；不能仅凭公共确认方法宣称端到端至少一次。
{% endhint %}

故障实验需要区分发布结果、Broker 接纳、业务提交和消息确认，参见[可靠投递与消息存储](../reliability.md)。

## 项目资源

[消息项目索引](README.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/messaging/kafka)
