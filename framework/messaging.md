---
description: Zongsoft 消息队列插件的选型、配置、实现差异和使用范例。
icon: message
---

# 消息队列

Zongsoft 的消息队列体系由 [Zongsoft.Messaging](core/messaging.md) 核心抽象和四个具体插件组成。核心抽象负责统一生产、订阅、消息确认和队列发现；插件负责把这些抽象落到具体消息系统上。

本页说明四个实现的设计差异、配置方式、使用范例和注意事项。业务代码通常只需要依赖 `Zongsoft.Core` 的消息抽象；应用启动、部署和连接参数才需要关心具体插件。

## 插件一览

| 插件 | 底层库 | 适合场景 | 主要特点 |
| --- | --- | --- | --- |
| `Zongsoft.Messaging.Kafka` | `Confluent.Kafka` | 高吞吐日志流、事件流、消费组处理。 | 发布到 Kafka topic，订阅后轮询消费，确认时提交 offset。 |
| `Zongsoft.Messaging.RabbitMQ` | `RabbitMQ.Client` | 传统消息队列、路由、工作队列和可靠投递。 | 使用 topic exchange，支持消息过期、优先级、headers 和手动 ACK。 |
| `Zongsoft.Messaging.Mqtt` | `MQTTnet` | 设备消息、轻量发布订阅、网络不稳定环境。 | 使用 managed client 入队发布，支持自动重连、重新订阅和 QoS 映射。 |
| `Zongsoft.Messaging.ZeroMQ` | `NetMQ` | 进程间或局域网内轻量消息转发、内部事件通道。 | 自带 `ZeroQueueServer` 转发器，支持实例过滤、分组主题和事件/请求应答适配。 |

{% hint style="info" %}
这些插件共享 `IMessageQueue` 接口，但底层协议并不等价。主题、标签、确认、重试、事务、顺序性和持久化都要按具体实现理解。
{% endhint %}

## 部署结构

每个消息队列插件都包含三类部署文件：

* `.plugin`：注册插件程序集和连接设置驱动。
* `.option`：提供默认连接配置示例。
* `.deploy`：声明插件文件和第三方 NuGet 依赖。

插件会向 `/Workbench/Configuration/ConnectionSettings/Drivers` 挂载连接设置驱动，例如 `Kafka`、`RabbitMQ`、`Mqtt`、`ZeroMQ`。应用的消息队列连接项则放在 `/Messaging/ConnectionSettings`。

## 连接配置

下面是四个插件的典型连接配置。`connectionSetting.name` 是应用中访问队列的名称，`driver` 决定由哪个插件解析连接字符串。

{% tabs %}
{% tab title="Kafka" %}
{% code title="Zongsoft.Messaging.Kafka.option" %}
```xml
<configuration>
	<option path="/Messaging">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Orders"
			                   driver="Kafka"
			                   value="server=127.0.0.1:9092;client=orders-app;group=orders-workers;topic=Orders.Created" />
		</connectionSettings>
	</option>
</configuration>
```
{% endcode %}
{% endtab %}

{% tab title="RabbitMQ" %}
{% code title="Zongsoft.Messaging.RabbitMQ.option" %}
```xml
<configuration>
	<option path="/Messaging">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Orders"
			                   driver="RabbitMQ"
			                   value="server=127.0.0.1;username=program;password=secret;client=orders-app;group=orders.exchange;queue=orders.queue" />
		</connectionSettings>
	</option>
</configuration>
```
{% endcode %}
{% endtab %}

{% tab title="MQTT" %}
{% code title="Zongsoft.Messaging.Mqtt.option" %}
```xml
<configuration>
	<option path="/Messaging">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Telemetry"
			                   driver="Mqtt"
			                   value="server=127.0.0.1:1883;username=program;password=secret;client=telemetry-app;topic=devices/+/events" />
		</connectionSettings>
	</option>
</configuration>
```
{% endcode %}
{% endtab %}

{% tab title="ZeroMQ" %}
{% code title="Zongsoft.Messaging.ZeroMQ.option" %}
```xml
<configuration>
	<option path="/Messaging">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Local"
			                   driver="ZeroMQ"
			                   value="server=127.0.0.1;client=local-app;group=Demo" />
		</connectionSettings>
	</option>

	<option path="/Messaging/ZeroMQ">
		<servers port="32101,32102">
			<server server.name="unnamed" port="*" />
		</servers>
	</option>
</configuration>
```
{% endcode %}
{% endtab %}
{% endtabs %}

`server`、`client`、`group`、`topic`、`timeout` 是通用连接属性，但含义会随实现变化：Kafka 的 `group` 是消费组；RabbitMQ 的 `group` 是 exchange；ZeroMQ 的 `group` 会成为主题前缀；MQTT 当前连接设置中保留 `group`，但队列实现没有使用它做过滤或分组。

## 获取队列

通过核心提供器解析队列时，框架会从 `/Messaging/ConnectionSettings` 中查找名称匹配的连接项：

{% code title="ResolveQueue.cs" %}
```csharp
using Zongsoft.Messaging;

var queue = MessageQueueUtility.Queue("Orders");

await queue.ProduceAsync("Orders.Created", """{"id":1001}""".AsMemory());
```
{% endcode %}

需要绕过配置、直接用某个插件构造队列时，可以使用对应连接设置驱动：

{% code title="CreateKafkaQueue.cs" %}
```csharp
using Zongsoft.Messaging.Kafka;
using Zongsoft.Messaging.Kafka.Configuration;

var settings = KafkaConnectionSettingsDriver.Instance.GetSettings(
	"Server=127.0.0.1:9092;Client=orders-sample;Group=orders-workers;");

var queue = new KafkaQueue("Kafka", settings);
```
{% endcode %}

## 通用范例

四个实现都遵循同一个核心用法：创建或解析队列，订阅主题，发送消息，在处理成功后确认。

{% code title="PublishSubscribe.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging;

var queue = MessageQueueUtility.Queue("Orders");

var consumer = await queue.SubscribeAsync("Orders.Created", async message =>
{
	var text = Encoding.UTF8.GetString(message.Data);
	Console.WriteLine($"Received: [{message.Topic}] {text}");

	await message.AcknowledgeAsync();
});

var identifier = await queue.ProduceAsync(
	"Orders.Created",
	Encoding.UTF8.GetBytes("""{"id":1001}"""),
	MessageEnqueueOptions.Default);

Console.WriteLine($"Sent: {identifier}");
```
{% endcode %}

{% hint style="warning" %}
示例中的 `AcknowledgeAsync()` 是有意放在处理逻辑之后。生产环境应先完成业务处理、落库或幂等记录，再确认消息。
{% endhint %}

## Kafka 实现

`KafkaQueue` 使用 `ProducerBuilder<Null, byte[]>` 发布消息，使用 `ConsumerBuilder<string, byte[]>` 创建消费者。订阅成功后，`KafkaSubscriber` 启动一个 `MessagePollerBase` 轮询器，调用 Kafka consumer 的 `Consume(...)` 获取消息。

关键行为：

* 发布必须指定非空主题；默认主题来自连接设置的 `topic`。
* 发布返回 Kafka 的 `TopicPartition` 字符串，不是业务消息 ID。
* 收到消息后构造 `Message`，确认回调会执行 `_consumer.Commit(result)`。
* `group` 映射为 Kafka `GroupId`；未指定时会生成随机消费组。
* `client` 映射为 Kafka `ClientId`；未指定时会生成随机客户端 ID。
* `heartbeat`、`timeout`、`transactionId`、`transactionTimeout` 等连接属性会映射到 Kafka 配置。
* 当前实现没有把 `tags`、`Delay`、`Expiration`、`Priority` 映射到 Kafka 消息。

{% code title="KafkaSample.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging;
using Zongsoft.Messaging.Kafka;
using Zongsoft.Messaging.Kafka.Configuration;

var settings = KafkaConnectionSettingsDriver.Instance.GetSettings(
	"Server=127.0.0.1:9092;Client=orders-sample;Group=orders-workers;");

var queue = new KafkaQueue("Kafka", settings);

await queue.SubscribeAsync("Orders.Created", async message =>
{
	Console.WriteLine(Encoding.UTF8.GetString(message.Data));
	await message.AcknowledgeAsync();
});

await queue.ProduceAsync("Orders.Created", Encoding.UTF8.GetBytes("Order #1001"));
```
{% endcode %}

## RabbitMQ 实现

`RabbitQueue` 使用 RabbitMQ topic exchange。`group` 为空时 exchange 名称为 `/`，否则使用 `group`；`queue` 为空时声明临时队列，否则声明持久队列。订阅时会把主题中的 `/` 转成 `.`，空主题会订阅 `#`。

关键行为：

* 发布前会初始化连接、通道、exchange 和队列。
* 主题路由键会把 `/` 转成 `.`，适合把应用层路径主题映射为 RabbitMQ topic routing key。
* `MessageEnqueueOptions.Priority` 写入消息优先级。
* `MessageEnqueueOptions.Expiration` 写入消息过期时间。
* `MessageEnqueueOptions.Properties` 写入 RabbitMQ headers。
* 每条消息生成 `MessageId`，发布后返回该标识。
* 消费时关闭自动确认，`Message.AcknowledgeAsync()` 会执行 `BasicAckAsync(...)`。
* `tags` 当前作为 consumer tag 传入，不作为 RabbitMQ binding filter。

{% code title="RabbitMQSample.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging;
using Zongsoft.Messaging.RabbitMQ;
using Zongsoft.Messaging.RabbitMQ.Configuration;

var settings = RabbitConnectionSettingsDriver.Instance.GetSettings(
	"server=127.0.0.1;username=program;password=secret;client=orders-sample;group=orders.exchange;queue=orders.queue;");

var queue = new RabbitQueue("RabbitMQ", settings);

await queue.SubscribeAsync("Orders.Created", async message =>
{
	Console.WriteLine(Encoding.UTF8.GetString(message.Data));
	await message.AcknowledgeAsync();
});

await queue.ProduceAsync(
	"Orders/Created",
	Encoding.UTF8.GetBytes("Order #1001"),
	new MessageEnqueueOptions
	{
		Expiration = TimeSpan.FromMinutes(5),
		Priority = 5,
	});
```
{% endcode %}

## MQTT 实现

`MqttQueue` 使用 MQTTnet 的普通客户端接收消息，同时使用 `ManagedMqttClient` 发布消息。构造队列后会启动 managed client；订阅和发布前会调用连接确保逻辑。断线后会串行重连，并对已有订阅重新订阅。

关键行为：

* `server` 可写成 `host:port` 或包含协议的连接 URI。
* 未指定 `client` 时会生成随机客户端 ID。
* 发布使用 `ManagedMqttClient.EnqueueAsync(...)`，返回值为空。
* `MessageReliability` 会映射到 MQTT QoS。
* `MessageEnqueueOptions.Properties` 会映射到 MQTT user properties。
* 订阅使用 `NoLocal = true`，避免收到本客户端发布的同主题消息。
* 收到消息时关闭自动确认，处理器调用 `AcknowledgeAsync()` 后才确认。
* `tags` 当前不参与 MQTT topic filter。

{% code title="MqttSample.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging;
using Zongsoft.Messaging.Mqtt;
using Zongsoft.Messaging.Mqtt.Configuration;

var settings = MqttConnectionSettingsDriver.Instance.GetSettings(
	"Mqtt",
	"server=127.0.0.1:1883;username=program;password=secret;client=telemetry-sample;");

var queue = new MqttQueue("MQTT", settings);

await queue.SubscribeAsync("devices/+/events", async message =>
{
	Console.WriteLine($"[{message.Topic}] {Encoding.UTF8.GetString(message.Data)}");
	await message.AcknowledgeAsync();
});

await queue.ProduceAsync(
	"devices/device-001/events",
	Encoding.UTF8.GetBytes("""{"temperature":23.5}"""),
	new MessageEnqueueOptions(MessageReliability.LeastOnce));
```
{% endcode %}

## ZeroMQ 实现

`ZeroQueue` 是基于 NetMQ 的轻量消息转发实现。它不是连接外部消息中间件，而是需要运行 `ZeroQueueServer` 作为转发器。客户端启动时先连接服务器默认端口 `7969` 获取发布端口和订阅端口，然后通过 `PublisherSocket` 和 `SubscriberSocket` 进行消息收发。

关键行为：

* `server` 必填；`port` 未指定时默认为 `7969`。
* `ZeroQueueServer` 默认随机绑定内部发布/订阅端口，也可以通过 `/Messaging/ZeroMQ/Servers` 固定端口。
* `group` 不为空时，主题会变成 `group:topic`，用于简单隔离同一服务器上的不同消息域。
* 主题为 `*` 时会转为空主题；发布空主题时会向当前队列实例的所有订阅主题发送。
* 队列实例有 `Instance` 标识；默认过滤掉自己发布的消息，避免本实例收到自己的消息。
* `filter` 可控制接收哪些实例的消息：`*` 表示接收全部，`.` 或 `~` 表示只接收自身，`!id` 表示排除指定实例。
* 发布选项中的扩展属性可通过内部 packetizer 携带，压缩选项会在收发时执行压缩和解压。
* 当前 ZeroMQ 消息没有确认回调，`AcknowledgeAsync()` 通常不会产生底层效果。

{% code title="ZeroQueueServerSample.cs" %}
```csharp
using Zongsoft.Messaging.ZeroMQ;

using var server = new ZeroQueueServer();
await server.StartAsync(args);
```
{% endcode %}

{% code title="ZeroQueueClientSample.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging.ZeroMQ;
using Zongsoft.Messaging.ZeroMQ.Configuration;

using var queue = new ZeroQueue(
	"ZeroMQ",
	ZeroConnectionSettingsDriver.Instance.GetSettings(
		"ZeroMQ",
		"server=127.0.0.1;client=zero-sample;group=Demo;"));

await queue.SubscribeAsync("Orders.Created", message =>
{
	Console.WriteLine(Encoding.UTF8.GetString(message.Data));
});

await queue.ProduceAsync("Orders.Created", Encoding.UTF8.GetBytes("Order #1001"));
```
{% endcode %}

ZeroMQ 插件还注册了 `ZeroRequester` 和 `ZeroResponder`，并通过 `ZeroQueue.EventChannel` 适配事件通道。它适合框架内部通信、开发环境或轻量部署场景；如果需要跨机房持久化、消费进度和成熟的消息治理，应优先考虑 Kafka 或 RabbitMQ。

## 示例项目

源码目录 `framework/messaging` 下每个实现都有 sample：

| 实现 | 示例 | 说明 |
| --- | --- | --- |
| Kafka | `messaging/kafka/samples/Program.cs` | 创建 Kafka 队列，订阅 `TopicX`，并并行发布 200 条消息。 |
| RabbitMQ | `messaging/rabbit/samples/Program.cs` | 创建 RabbitMQ 队列，订阅默认队列，并按多个主题发布消息。 |
| MQTT | `messaging/mqtt/samples/Program.cs` | 创建 MQTT 队列并发布消息；当前示例主要演示发布。 |
| ZeroMQ | `messaging/zero/samples/server/Program.cs`、`messaging/zero/samples/client/Program.cs` | 服务端启动转发器；客户端通过终端命令订阅、取消订阅和发布消息。 |

## 使用建议

* 需要高吞吐、消费组和事件流处理时，优先使用 Kafka。
* 需要传统队列、路由键、消息过期、优先级和手动确认时，优先使用 RabbitMQ。
* 需要设备消息、轻量连接、QoS 和自动重连时，优先使用 MQTT。
* 需要框架内部轻量转发、事件通道或本地/局域网通信时，可以使用 ZeroMQ。
* 业务处理器应按“可能重复投递”设计，使用业务唯一键或消息标识做幂等。
* 不要依赖所有插件都支持标签、延迟、过期、优先级或精确一次；使用前先确认对应实现的映射。

## 相关资源

* [Zongsoft.Messaging 核心抽象](core/messaging.md)
* [连接配置](data/connections.md)
* [插件文件与加载](plugins/plugin-file.md)
* [消息队列源码目录](https://github.com/Zongsoft/framework/tree/main/messaging)
