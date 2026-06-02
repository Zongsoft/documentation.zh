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

## 类型

<table data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th></th>
			<th data-hidden data-card-target data-type="content-ref">页面</th>
		</tr>
	</thead>
	<tbody>
		<tr><td><strong>常规通讯</strong></td><td>收发器、监听器、通道和协议包解析。</td><td><a href="communication/general.md">general.md</a></td></tr>
		<tr><td><strong>请求应答</strong></td><td>多响应请求、响应关联和 ZeroMQ 实现。</td><td><a href="communication/request-response.md">request-response.md</a></td></tr>
		<tr><td><strong>Notifier</strong></td><td>通知激发器抽象和当前实现状态。</td><td><a href="communication/notifier.md">notifier.md</a></td></tr>
		<tr><td><strong>Transmitter</strong></td><td>模板通知发送器、描述符和 GUI 配置场景。</td><td><a href="communication/transmitter.md">transmitter.md</a></td></tr>
	</tbody>
</table>

## 相关资源

* [Communication 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Communication)
* [Zongsoft.Net 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Net)
