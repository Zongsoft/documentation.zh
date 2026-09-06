---
description: .storages 数据库消息存储项目的部署产物、Broker 连接匹配与恢复条件。
icon: database
---

# .storages：消息存储

`messaging/.storages` 提供可靠消息的数据库存储实现。它保存 Broker 接纳后等待投递与确认的记录；它本身不负责建立 Kafka、RabbitMQ、MQTT 或 ZeroMQ 的网络连接。

## 项目组成

| 组成 | 用途 |
| --- | --- |
| `Zongsoft.Messaging.Storages.Data` | 数据引擎支持的消息存储插件 |
| `database` | SQLite、MySQL、PostgreSQL、SQL Server 建表资源 |
| 映射与 scripts | 通过数据引擎的命名命令存取消息 |
| 存储工厂 | 供 Broker 按名称创建存储，需显式装配 |

Redis 存储位于 [externals/redis](../../externals/projects/redis.md)，不属于此项目的数据库实现。它们的应用接入与恢复规则汇总在[可靠投递与消息存储](../reliability.md)。

## 接入顺序

1. 选择数据库，部署 Data、[相应数据驱动](../../data/drivers.md)和存储插件。
2. 在独立库中使用项目 database 目录的对应建表资源，并保留部署产物中的映射和 scripts。
3. 配置与 Broker 严格同名的连接；默认 ZeroMQ 守护 Broker 名为 QueueServer。
4. 启动前设置稳定存储身份，再把选定工厂注入 Broker。发布和订阅都显式启用 LeastOnce。
5. 验证接纳、处理失败、确认、重启和过期消息，再用于业务。

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft messaging storages]
nuget:Zongsoft.Messaging.Storages.Data
```
{% endcode %}

以上仅追加存储包，完整方案还需要 Data、数据库驱动和 Broker。连接及注入示例统一维护在[可靠投递与消息存储](../reliability.md)。

## 配置和身份

工厂依次在 /Data/ConnectionSettings 和 /Messaging/Storages/ConnectionSettings 查找与 Broker 同名的连接，不回退默认业务连接。工厂节点使用 Sqlite、MySql、PostgreSql、MsSql 名称，不能将数据库连接驱动键机械用作节点名。

环境变量 `ZONGSOFT_MESSAGING_STORAGE_IDENTIFIER` 在首次使用工厂时冻结。它与连接名决定存储分区；未设置时回退机器名。容器重建或机器改名后，需要保证相同逻辑 Broker 仍使用稳定身份。

## 恢复和维护

{% hint style="warning" %}
🚨 安装消息存储不等于自动获得事务发件箱，也不意味着消息在没有在线匹配消费者时一定会进入队列。是否接纳、何时重投和确认后如何删除，由 Broker 协议与存储实现共同决定。
{% endhint %}

数据库中过期记录会在读取时被过滤，但不会由本插件自动后台清理。维护应限定分区，并核对旧身份和旧协议数据兼容性。业务仍须设计幂等处理，避免确认前后故障引发重复副作用。

[ZeroMQ 项目](zero.md) · [消息项目索引](README.md) · [源码及数据库资源](https://github.com/Zongsoft/framework/tree/main/messaging/.storages)
