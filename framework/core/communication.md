---
description: Zongsoft.Communication 命名空间的职责和主要类型。
icon: radio
---

# Zongsoft.Communication

`Zongsoft.Communication` 提供通讯通道、监听器、收发器、请求器和协议包解析等基础抽象。它不绑定具体传输协议，具体网络实现通常由 `Zongsoft.Net` 等模块承接。

## 主要职责

* 定义 `IChannel`、`IListener`、`IReceiver`、`IRequester` 等通讯抽象。
* 提供通道基类、通道集合、通道选择器和通知器模型。
* 提供 `IPacketizer` 等协议包解析扩展点。
* 为网络层或自定义通讯协议提供统一的设计入口。

## 相关资源

* [Communication 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Communication)
* [Zongsoft.Net 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Net)
