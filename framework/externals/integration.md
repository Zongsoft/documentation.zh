---
description: 理解 OPC UA 的会话与证书，以及 Velopack 安装应用的更新生命周期。
icon: plugs
---

# 设备协议与桌面更新

OPC 与 Velopack 都是专用适配器：前者连接工业数据服务，后者更新已安装的桌面应用。它们没有共享业务协议，本页分别说明接入前必须具备的运行条件。

## OPC UA 的基本概念

OPC UA 以服务端地址空间组织设备数据。**NodeId** 标识节点，节点的值还伴随类型、状态码和时间戳；仅显示数值会丢失质量及采样时间信息。

**Session** 是与服务器交互的会话；**Subscription** 及监视项用于持续接收变化。订阅不是永久有效对象，断线重连、服务器重启和证书变更后，都需要验证其恢复状态。

`Zongsoft.Externals.Opc` 提供相关客户端、服务端及读写订阅适配。插件让程序集和 SDK 可用，实际端点、证书信任、会话建立和工作器生命周期由应用组织。

## 从本地示例开始

先阅读[OPC 示例说明](https://github.com/Zongsoft/framework/blob/main/externals/opc/samples/README.zh-Hans.md)，使用其中配套的本地 server/client 项目。建议依次验证连接、浏览、读取一个已知节点、订阅变化，再验证断线后的恢复。

真实设备写入前还要明确数据类型、量纲、允许范围和设备状态。不能因为 SDK 写入方法返回成功，就忽略设备侧联锁和后续状态确认。

## 证书与身份

应用证书用于建立受信任通信，用户身份决定会话能执行哪些操作，两者不能相互替代。证书主题、应用 URI、有效期及信任目录都应与实际部署一致。

{% hint style="warning" %}
🚨 不要把示例自签名证书、自动信任所有证书或写在命令行中的示例密码作为正式部署方案。私钥和信任目录由运行账号保护；信任变更后应验证客户端与服务器双方的连接行为。
{% endhint %}

诊断至少保留节点标识、质量状态、源时间戳和错误阶段，并控制敏感设备信息的访问。退出时应停止订阅分派、关闭会话并释放客户端，避免重启后残留重复订阅。

## Velopack 更新的是安装应用

`Zongsoft.Externals.Velopack` 将 Velopack 初始化和检查更新接入宿主工作器。它只在 Velopack 识别为有效安装应用时运行；普通 `dotnet run` 开发目录被忽略并不一定是配置错误。

{% code title="Application.option" %}
```xml
<options>
	<option path="/Externals/Velopack">
		<connectionSettings default="current">
			<connectionSetting connectionSetting.name="current" driver="velopack"
				value="source=web;url=https://updates.example.invalid/releases;period=300s" />
		</connectionSettings>
	</option>
</options>
```
{% endcode %}

示例域名仅用于说明格式。`source` 选择来源工厂，`url` 配置发布源，`period` 控制检查周期。周期至少五分钟时，工作器还会在启动约三十秒后提前检查；检查重叠会被防止。

发现更新后会下载并应用更新、重启应用，因此应在启用前安排未保存工作和在途任务的处理。配套 Web Feed 包提供发布元数据接入，客户端、安装包工具及 Feed 格式需要保持兼容。

## 与框架自动升级的关系

Velopack 使用自己的安装与发布体系，独立于[框架自动升级](../upgrading.md)的 ZIP、manifest 和 `.deployment` 流程。选择其中一种作为应用更新责任方，避免两个工作器同时替换同一安装目录。

验证需要完整安装包及本地测试发布源，覆盖首次安装、旧版升级、无更新、中断下载、磁盘不足和重启。读取到新版本元数据并不等于安装更新成功。

源码入口：[OPC](https://github.com/Zongsoft/framework/tree/main/externals/opc)、[Velopack](https://github.com/Zongsoft/framework/tree/main/externals/velopack)。
