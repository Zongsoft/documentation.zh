---
description: Zongsoft.Messaging 命名空间及其子命名空间的职责。
icon: message
---

# Zongsoft.Messaging

`Zongsoft.Messaging` 定义消息队列、生产者、消费者、轮询器和消息队列工厂等基础抽象。它提供统一消息模型，具体队列实现由外部模块或扩展插件提供。

## 主要职责

* 定义 `IMessageQueue`、`IMessageProducer`、`IMessageConsumer` 等消息抽象。
* 提供消息入队、出队、订阅、可靠性和回退行为选项。
* 提供消息队列工厂、提供程序和守护处理基础。
* 支持上层模块以统一接口接入不同消息队列产品。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Messaging.Options` | 队列、订阅和消息队列集合的配置选项。 |

## 相关资源

* [Messaging 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Messaging)
* [消息队列](../messaging.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
