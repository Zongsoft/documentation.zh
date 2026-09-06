---
description: 核对消息接纳与确认的边界，为 ZeroMQ 配置数据库存储并设计业务幂等。
icon: shield-check
---

# 可靠投递与消息存储

可靠投递需要回答“消息现在由谁负责”。一条消息可能已进入本地客户端、已到 Broker、已写入持久存储、已交给消费者，或已经完成业务提交。故障发生在不同阶段，恢复方式也不同。

## 先定义业务完成条件

通常先完成业务处理和幂等记录，再确认消息。若业务提交成功而 ACK 丢失，消息可能再次出现，因此去重记录应与业务更新放入同一个数据库事务。对外部支付、邮件或其他系统调用，还需利用对方的幂等键或建立可恢复的状态流程。

发送消息和写业务数据库同样可能只成功一边。需要保证业务提交后最终发布时，可以由应用实现事务发件箱：在业务事务中保存待发事件，再由后台工作器发送和记录结果。这是一种应用设计，不是安装消息存储插件后自动获得的能力。

## 各实现的关键差异

| 实现 | 当前需要特别核对的边界 |
| --- | --- |
| Kafka | 确认会提交消费位点，但当前配置未关闭 SDK 自动提交/自动记录，未确认不等于必然重投 |
| RabbitMQ | 消费使用手动 ACK；持久队列、消息持久化、发布确认和 Broker 高可用仍需分别核对 |
| MQTT | 发布等待客户端发布结果，QoS 映射为协议级可靠性；不等于业务副作用恰好一次 |
| ZeroMQ `MostOnce` | 即时路由可见性与一次本地发送，无持久接纳或补发 |
| ZeroMQ `LeastOnce` | 有在线匹配者才接纳，先持久化 Pending，再竞争投递和等待显式 ACK |

{% hint style="warning" %}
🚨 超时或取消可能发生在远端已经接受消息之后。此时应记录“结果未知”并通过业务标识恢复，不能把所有异常都解释为“消息肯定没有发送”。
{% endhint %}

## 为 ZeroMQ 准备数据库存储

`Zongsoft.Messaging.Storages.Data` 是独立的存储插件，通过数据引擎的命名命令工作，支持 SQLite、MySQL、PostgreSQL、SQL Server。Redis 另有存储实现，见[缓存与分布式协作](../externals/caching.md)。

准备顺序如下：

1. 部署 ZeroMQ Broker 宿主、`Zongsoft.Data`、所选数据库驱动和 `Zongsoft.Messaging.Storages.Data`。
2. 按[对应数据库的建表说明](https://github.com/Zongsoft/framework/tree/main/messaging/.storages/database)创建 `Messaging_Message`；保留插件的 `.mapping` 和 `scripts` 目录。
3. 配置与 Broker **严格同名**的数据连接。守护插件创建的 Broker 名为 `QueueServer`。
4. 在进程启动前确定稳定存储身份，并把所选存储工厂注入 Broker。

{% code title="Application.option" %}
```xml
<options>
	<option path="/Data">
		<connectionSettings>
			<connectionSetting connectionSetting.name="QueueServer" driver="SQLite"
				value="DataSource=broker.db;PRAGMA:journal_mode=WAL;" />
		</connectionSettings>
	</option>
</options>
```
{% endcode %}

以下片段放入应用自己的插件清单，并声明对实际部署的消息及存储插件的依赖。路径末段可选 `Sqlite`、`MySql`、`PostgreSql`、`MsSql`，按所选驱动匹配。

{% code title="Broker.plugin（扩展片段）" %}
```xml
<extension path="/Workbench/Messaging/Zero">
	<QueueServer.Storages>{path:/Workspace/Messaging/Storages/Sqlite}</QueueServer.Storages>
</extension>
```
{% endcode %}

{% code title="StartBroker.ps1" %}
```powershell
$env:ZONGSOFT_MESSAGING_STORAGE_IDENTIFIER = 'broker-storage-01'
# 随后在此环境中启动实际 Broker 宿主。
```
{% endcode %}

工厂先从 `/Data/ConnectionSettings` 精确查找同名连接，再查找 `/Messaging/Storages/ConnectionSettings`，不会回退到默认业务数据库。找不到连接时，应修正名称，不要为了绕过错误把其他数据库改成默认连接。

## 存储身份与恢复

存储分区由连接名和稳定存储身份组成。身份环境变量在工厂首次使用时冻结，未设置时回退机器名。容器重建、机器改名或改连接名都可能让旧消息留在原分区中而不可见。

从旧 `nodeId` 配置升级时，应在首次使用前把原值迁移到 `ZONGSOFT_MESSAGING_STORAGE_IDENTIFIER`。协议和数据格式兼容性还需单独检查，稳定分区名不能使旧协议载荷自动兼容新协议。

过期消息在读取时被过滤，但数据库过期行不会由该插件自动后台清理。应制定按分区限定的维护策略，避免积累无界数据或清除其他 Broker 的消息。

## 开启至少一次调用

发布和订阅都必须显式使用 `MessageReliability.LeastOnce`。订阅选项是 `new MessageSubscribeOptions(MessageReliability.LeastOnce)`，发布选项是 `new MessageEnqueueOptions(MessageReliability.LeastOnce)`。处理器完成业务操作后调用 `AcknowledgeAsync`。

没有在线匹配订阅时，当前 Broker 返回 `null` 且不保存该条新消息；已有 Pending 则可由后续重新连接或新加入的匹配消费者处理。它不是“任何时候发出都离线排队”的模型。

确认后 Broker 停止投递并异步删除 Pending，重试使用同一消息标识。应用仍须处理确认、存储删除和进程退出之间的故障窗口。

## 验收清单

验证业务成功、处理失败不确认、ACK 前后断线、Broker 重启、存储不可用、无在线消费者、重复消费及过期数据。记录每次实验中的业务标识、消息标识、Broker 接纳结果和存储记录，才能判断是哪一层保证生效。

源码入口：[ZeroMQ 可靠协议](https://github.com/Zongsoft/framework/blob/main/messaging/zero/PROTOCOL.zh-Hans.md)、[数据库消息存储](https://github.com/Zongsoft/framework/tree/main/messaging/.storages)。
