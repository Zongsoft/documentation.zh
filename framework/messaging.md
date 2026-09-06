---
description: Zongsoft 消息队列插件的选型、配置、实现差异和使用范例。
icon: message
---

# 消息队列

Zongsoft 的消息队列体系由 [Zongsoft.Messaging](core/messaging.md) 核心抽象和四个具体插件组成。核心抽象负责统一生产、订阅、消息确认和队列发现；插件负责把这些抽象落到具体消息系统上。

首次使用请先阅读[发布订阅与投递概念](messaging/concepts.md)，需要故障恢复时继续阅读[可靠投递与消息存储](messaging/reliability.md)。本页说明四个实现的设计差异、配置方式、使用范例和注意事项。业务代码通常只需要依赖 `Zongsoft.Core` 的消息抽象；应用启动、部署和连接参数才需要关心具体插件。

## 插件一览

| 插件 | 底层库 | 适合场景 | 主要特点 |
| --- | --- | --- | --- |
| `Zongsoft.Messaging.Kafka` | `Confluent.Kafka` | 高吞吐日志流、事件流、消费组处理。 | 发布到 Kafka topic，订阅后轮询消费，确认时提交 offset。 |
| `Zongsoft.Messaging.RabbitMQ` | `RabbitMQ.Client` | 传统消息队列、路由、工作队列和可靠投递。 | 使用 topic exchange，支持消息过期、优先级、headers 和手动 ACK。 |
| `Zongsoft.Messaging.Mqtt` | `MQTTnet` | 设备消息、轻量发布订阅、网络不稳定环境。 | 通过连接管理器直接发布，支持重连、重新订阅和 QoS 映射。 |
| `Zongsoft.Messaging.ZeroMQ` | `NetMQ` | 进程间或局域网内轻量消息转发、内部事件通道。 | 自带 Broker，支持最多一次广播、至少一次持久接纳和事件/请求应答适配。 |

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

四个实现都遵循同一个核心用法：创建或解析队列，订阅主题，发送消息，在处理成功后确认。以下片段运行在持续存活的宿主中；独立控制台程序必须等待接收完成再退出。MQTT 和 ZeroMQ 默认过滤自身发布，验证时使用两个客户端或按实现配置自接收。

{% code title="PublishSubscribe.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging;

var queue = MessageQueueUtility.Queue("Orders");

var consumer = await queue.SubscribeAsync("Orders.Created", new ConsoleMessageHandler());

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

以下处理器用于本页的订阅片段，应放入示例项目中。异步处理不能直接传给同步 `System.Action<Message>` 重载，否则会形成 `async void`，框架无法等待其完成或正确观察异常。

{% code title="ConsoleMessageHandler.cs" %}
```csharp
using System.Text;
using Zongsoft.Messaging;
using Zongsoft.Components;
using Zongsoft.Collections;

public sealed class ConsoleMessageHandler : HandlerBase<Message>
{
	protected override async ValueTask OnHandleAsync(Message message,
		Parameters parameters, CancellationToken cancellation)
	{
		Console.WriteLine($"[{message.Topic}] {Encoding.UTF8.GetString(message.Data)}");
		await message.AcknowledgeAsync(cancellation);
	}
}
```
{% endcode %}

## Kafka 实现

`KafkaQueue` 使用 `ProducerBuilder<Null, byte[]>` 发布消息，使用 `ConsumerBuilder<string, byte[]>` 创建消费者。订阅成功后，`KafkaSubscriber` 启动一个 `MessagePollerBase` 轮询器，调用 Kafka consumer 的 `Consume(...)` 获取消息。

关键行为：

* 发布必须指定非空主题；默认主题来自连接设置的 `topic`。
* 发布返回 Kafka 的 `TopicPartition` 字符串，不是业务消息 ID。
* 收到消息后构造 `Message`，确认回调会执行 `_consumer.Commit(result)`。当前连接配置没有关闭客户端自动提交/自动记录位点，因此显式确认并不保证“未确认一定重投”；严格业务确认需求必须验证实际消费配置和重启恢复。
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

await queue.SubscribeAsync("Orders.Created", new ConsoleMessageHandler());

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

await queue.SubscribeAsync("Orders.Created", new ConsoleMessageHandler());

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

`MqttQueue` 通过连接管理器取得 MQTTnet 客户端，直接调用发布与订阅方法，并在完成后释放连接使用权。连接管理器负责连接、重连和恢复订阅；消息处理采用有界并发，因此不能假定业务处理完成顺序等同于网络接收顺序。

关键行为：

* `server` 可写成 `host:port` 或包含协议的连接 URI。
* 未指定 `client` 时会生成随机客户端 ID。
* 发布等待 `PublishAsync(...)` 返回；失败结果转换为异常，成功时返回可用的 MQTT 报文标识。该标识不是业务全局唯一 ID，也不代表消费者处理完成。
* `MessageReliability` 会映射到 MQTT QoS。
* MQTT 5 下，`Properties` 映射为 user properties，正 `Expiration` 映射为消息过期间隔；不能假定 MQTT 3 具有这些属性。
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

await queue.SubscribeAsync("devices/+/events", new ConsoleMessageHandler());

await queue.ProduceAsync(
	"devices/device-001/events",
	Encoding.UTF8.GetBytes("""{"temperature":23.5}"""),
	new MessageEnqueueOptions(MessageReliability.LeastOnce));
```
{% endcode %}

## ZeroMQ 实现

`ZeroQueueServer` 现在包含两个投递通道：`MostOnce` 通过 XPUB/XSUB 广播，`LeastOnce` 通过 Control 通道登记消费者、持久接纳消息、竞争投递并处理确认。可靠通道只在 Broker 配置消息存储后启动，发布端不保存待投递消息。

| 模式 | `ProduceAsync` 完成意味着什么 | 没有在线匹配订阅时 |
| --- | --- | --- |
| `MostOnce` | 当前发布端可见匹配订阅，并完成一次本地发送 | 返回 `null`，不会等待未来订阅或补发 |
| `LeastOnce` | Broker 已把 Pending 消息写入存储 | 返回 `null`，不写入存储 |
| `ExactlyOnce` | 不支持 | 请求在建立传输状态前被拒绝 |

两种模式的非空返回值都不是处理器完成通知。至少一次模式下，处理器必须显式调用 `AcknowledgeAsync()`；未确认会沿用同一消息标识重投，也可能交给另一个在线消费者。

### 端口与部署

发现端口默认 `7969`。运行端口通过发现协议取得，配置三个值时依次为 `Control,Incoming,Outgoing`；两个值时为 `Incoming,Outgoing`，启用存储后随机绑定 Control。未指定或指定 `*` 的运行端口可以随机分配。

{% code title="Application.option" %}
```xml
<configuration>
	<option path="/Messaging/ZeroMQ">
		<servers port="32100,32101,32102">
			<server server.name="unnamed" />
		</servers>
	</option>
</configuration>
```
{% endcode %}

主插件注册客户端、事件通道与请求应答适配；守护插件负责启动 Broker。需要可靠通道时，继续配置[消息存储](messaging/reliability.md)，仅填写 Control 端口不会启用持久化。

### 路由与生命周期

* `group` 为物理主题添加 `group:` 前缀，处理器仍取得逻辑主题。订阅使用前缀匹配。
* 默认过滤掉自身实例发布的消息；同进程演示可设置 `filter=*`，正式隔离仍应使用合适的实例及组配置。
* 同一主题、处理器、标签和规范化选项一致时复用订阅；同一主题存在不兼容订阅时会抛出冲突异常，不会替换原处理器。
* 单个订阅的处理器按接收顺序串行执行，有界队列形成该订阅的背压。处理器应及时处理取消，停止时取消自己的订阅。
* 提供者可能复用队列，不要在一次业务操作结束后释放共享队列。直接构造队列的独立程序则负责完整生命周期。

`Compression` 支持 Brotli、GZip、ZLib、Deflate，阈值表示负载字节数，例如 `new MessageCompression("Brotli", 4096)`。正数 `Delay` 不受支持，会由核心能力检查拒绝；选项存在不代表每个驱动都实现了它。

{% hint style="warning" %}
🚨 当前线协议为 `1.0`，不能与旧协议客户端、Broker 或旧 Pending 信封混用。升级时应先停止发布、处理原有待投递消息，并制定存储迁移或切换方案；不要直接清空生产存储。Broker 端点绑定所有网络接口，适配器自身不配置认证和传输加密。
{% endhint %}

需要独立验证时，使用下表的服务器和客户端交互样例，保持进程存活并等待明确接收结果。不要通过固定延迟或不断重复发布来证明首条消息已经可靠送达。

## 示例项目

源码目录 `framework/messaging` 下每个实现都有 sample：

| 实现 | 示例 | 说明 |
| --- | --- | --- |
| Kafka | `messaging/kafka/samples/Program.cs` | 创建 Kafka 队列，订阅 `TopicX`，并并行发布 200 条消息。 |
| RabbitMQ | `messaging/rabbit/samples/Program.cs` | 创建 RabbitMQ 队列，订阅默认队列，并按多个主题发布消息。 |
| MQTT | `messaging/mqtt/samples/server/Program.cs`、`messaging/mqtt/samples/client/Program.cs` | 交互式 Broker 与客户端，可验证发布、订阅、重连和确认。 |
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
