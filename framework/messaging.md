---
description: Zongsoft 消息队列插件的组成。
icon: message
---

# 消息队列

Zongsoft 提供多个消息队列插件，用于把核心库中的消息抽象接入具体消息系统。

## 支持的插件

- `Zongsoft.Messaging.Kafka`
- `Zongsoft.Messaging.RabbitMQ`
- `Zongsoft.Messaging.Mqtt`
- `Zongsoft.Messaging.ZeroMQ`

## 代码位置

```text
framework/messaging
```

## 使用方式

消息插件通常作为业务应用的基础设施插件部署到宿主中。部署后，业务模块通过核心抽象访问消息能力，而不是直接依赖具体消息中间件。
