---
description: 按 Kafka、RabbitMQ、MQTT、ZeroMQ 与 .storages 源码项目查找消息实现。
icon: folders
---

# 按项目阅读

从具体 Broker 或源码目录进入时，使用本页定位包、配置与实现边界。现有[消息队列](../../messaging.md)继续承担跨实现比较和公共调用示例，[投递概念](../concepts.md)与[可靠性专题](../reliability.md)解释共同背景。

| 源码项目 | 文档 | 负责什么 |
| --- | --- | --- |
| kafka | [Kafka](kafka.md) | Kafka 客户端、主题分区与消费位点 |
| rabbit | [RabbitMQ](rabbit.md) | 交换机路由、队列与消费确认 |
| mqtt | [MQTT](mqtt.md) | 设备发布订阅、主题过滤器与 QoS |
| zero | [ZeroMQ](zero.md) | 客户端、内置 Broker 与两种投递路径 |
| .storages | [消息存储](storages.md) | 数据库持久记录与供 Broker 使用的存储工厂 |

## 从角色理解组合

前四个项目提供消息通讯实现，.storages 提供可选的持久存储。以 ZeroMQ 为例，客户端、Broker 和数据库存储可能部署在不同进程或节点中；连接配置和存储配置分别服务于它们的角色。

{% hint style="info" %}
💡 名称相近的 Group、Queue、Topic 和确认操作在不同协议中可能具有不同含义。迁移项目时，先阅读目标项目的映射及限制，再复用公共业务处理器。
{% endhint %}
