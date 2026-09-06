---
description: RabbitMQ 消息项目的部署、连接、协议映射与可靠性边界。
icon: message
---

# RabbitMQ

通过 RabbitMQ.Client 接入主题交换机与消息队列，适合使用路由和工作队列分发任务的应用。公共概念见[发布订阅与投递](../concepts.md)，跨项目比较和完整调用示例见[消息队列](../../messaging.md)。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `messaging/rabbit` |
| NuGet 包 | `Zongsoft.Messaging.RabbitMQ` |
| 提供者及连接驱动名 | `RabbitMQ` |

## 部署与连接

把实现包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，保留清单和运行依赖。Broker 地址、账号与主题权限由运行环境提供。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft messaging rabbit]
nuget:Zongsoft.Messaging.RabbitMQ
```
{% endcode %}

来源：[framework/messaging/rabbit/samples/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/rabbit/samples/Program.cs#L17)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
using var queue = new RabbitQueue("RabbitMQ",
	Configuration.RabbitConnectionSettingsDriver.Instance.GetSettings("RabbitMQ", $"server=127.0.0.1;port=5672;client=Zongsoft.Messaging.RabbitMQ.Sample-{Guid.NewGuid():N};username=program;password=xxxxxx;"));
```
{% endcode %}

Discussions 当前没有接入此队列的业务流程，因此采用该项目现有交互式客户端。这里直接构造队列，主题由 subscribe / produce 命令传入。RabbitMQ 样例中的 xxxxxx 是本地测试密码占位值，运行前需要按隔离环境调整。

## 示例中的订阅入口

来源：[framework/messaging/rabbit/samples/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/rabbit/samples/Program.cs#L38)（节选；上下文见源文件）。

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

本实现使用 topic exchange；Group 配置交换机，Queue 指定队列。主题和标签参与路由，消费采用手动 ACK。这里的 Group 不能按 Kafka 消费组的语义理解。

## 首次接入

1. 准备测试账号、交换机和队列所需权限，核对连接的虚拟主机。
2. 使用 RabbitMQ 提供者创建具名队列，验证主题路由与消息到达。
3. 在业务提交后确认，再检查处理失败、断线、重连和重复消息。

异步业务处理使用公共处理器契约，不能把异步 lambda 交给同步委托订阅重载。提供者取得的队列可能共享，消费者只释放自己拥有的订阅资源；完整示例见[消息队列](../../messaging.md)。

## 可靠性边界

{% hint style="warning" %}
🚨 手动 ACK 只覆盖消费者确认环节。持久队列、消息持久化、发布确认和 Broker 高可用需要分别验证；不能把一个选项概括为完整的可靠性保证。
{% endhint %}

故障实验需要区分发布结果、Broker 接纳、业务提交和消息确认，参见[可靠投递与消息存储](../reliability.md)。

## 项目资源

[消息项目索引](README.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/messaging/rabbit)
