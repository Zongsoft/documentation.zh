---
description: Zongsoft 对第三方基础设施和服务的插件化适配。
icon: plug-circle-bolt
---

# 扩展插件

`externals` 目录包含对第三方库、云服务和基础设施的插件化适配。

## 常见扩展

- Aliyun
- Amazon Web Services
- ClosedXML / OpenXML
- Hangfire
- Redis / Garnet
- Polly
- OPC
- Lua / Python
- Scriban
- WeChat
- Velopack
- etcd

## 使用原则

扩展插件把第三方能力接入 Zongsoft 的插件化运行时。业务模块应优先依赖框架抽象或插件暴露的服务，而不是把第三方 SDK 调用散落在业务代码中。
