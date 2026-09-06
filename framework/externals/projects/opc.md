---
description: Opc 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Opc

提供 OPC UA 客户端、服务端及读写订阅适配，用于连接工业数据服务。节点标识、数值质量和采样时间都属于业务数据。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/opc` |
| 主包 | `Zongsoft.Externals.Opc` |
| 配套主题 | [OPC UA 设备协议](../integration.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals opc]
nuget:Zongsoft.Externals.Opc
```
{% endcode %}

端点、应用证书、信任目录、用户身份和会话生命周期由应用组织。项目包含配套本地 server/client 示例，可先用于验证读取与订阅。

## 接入步骤

1. 按项目示例准备本地服务器与客户端，建立证书信任和会话。
2. 先浏览并读取已知节点，再验证变化订阅、状态码与源时间戳。
3. 验证断线、服务器重启和退出释放后，再设计真实设备的写入控制。

具体配置、调用示例和相关基础概念见[OPC UA 设备协议](../integration.md)。

## 项目边界

{% hint style="info" %}
💡 应用证书和用户权限解决不同问题。插件部署不自动完成信任配置，读取到数值也不代表质量状态正常；示例中的信任方式不能直接作为正式设备部署策略。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [OPC UA 设备协议](../integration.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/opc)
