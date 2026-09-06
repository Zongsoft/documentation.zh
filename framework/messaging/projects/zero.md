---
description: ZeroMQ 消息项目的部署、连接、协议映射与可靠性边界。
icon: message
---

# ZeroMQ

基于 NetMQ 提供队列、内置 Broker 和事件/请求应答适配，适合由应用掌控协议与部署边界的内部消息通讯。公共概念见[发布订阅与投递](../concepts.md)，跨项目比较和完整调用示例见[消息队列](../../messaging.md)。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `messaging/zero` |
| NuGet 包 | `Zongsoft.Messaging.ZeroMQ` |
| 提供者及连接驱动名 | `ZeroMQ` |

## 部署与连接

把实现包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，保留清单和运行依赖。Broker 是额外的运行角色，需要相应 daemon 清单及服务器选项；仅配置下面的客户端连接不会自动完成 Broker 和存储部署。

{% code title="已有宿主部署清单（追加片段）" %}
```ini
[plugins zongsoft messaging zero]
nuget:Zongsoft.Messaging.ZeroMQ
```
{% endcode %}

来源：[framework/messaging/zero/samples/client/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/zero/samples/client/Program.cs#L17)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
using var queue = new ZeroQueue("ZeroMQ",
	Configuration.ZeroConnectionSettingsDriver.Instance.GetSettings("ZeroMQ", "server=127.0.0.1;client=Zongsoft.Messaging.ZeroMQ.Sample;Group=Demo;"));
```
{% endcode %}

Discussions 当前没有接入此队列的业务流程，因此采用该项目现有交互式客户端。这里直接构造队列，主题由 subscribe / produce 命令传入。运行前需要按隔离环境调整地址、客户端标识和权限配置。

## 示例中的订阅入口

来源：[framework/messaging/zero/samples/client/Program.cs](https://github.com/Zongsoft/framework/blob/main/messaging/zero/samples/client/Program.cs#L41)（节选；上下文见源文件）。

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

同一个逻辑主题可映射到带 Group 前缀的线上主题，订阅采用前缀匹配。默认最多一次路径用于广播；至少一次路径需要 Broker 可靠存储和显式发布、订阅选项。

## 首次接入

1. 先部署并启动 Broker 角色，核对端口，再配置客户端连接。
2. 用独立测试 Group 和主题验证最多一次的发布与订阅。
3. 需要可靠性时，再按存储专题注入工厂并验证至少一次、确认和 Broker 重启恢复。

异步业务处理使用公共处理器契约，不能把异步 lambda 交给同步委托订阅重载。提供者取得的队列可能共享，消费者只释放自己拥有的订阅资源；完整示例见[消息队列](../../messaging.md)。

## 可靠性边界

{% hint style="warning" %}
🚨 LeastOnce 仅在有在线匹配订阅时接纳新消息，先持久化 Pending 再投递；无匹配者返回 null，不保存本次消息。默认广播没有离线补发，ExactlyOnce 不受支持。
{% endhint %}

故障实验需要区分发布结果、Broker 接纳、业务提交和消息确认，参见[可靠投递与消息存储](../reliability.md)。数据库存储另有 [.storages 项目](storages.md)，Redis 存储位于 [Redis 外部项目](../../externals/projects/redis.md)。

## 项目资源

[消息项目索引](README.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/messaging/zero)
