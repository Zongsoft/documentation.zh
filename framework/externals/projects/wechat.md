---
description: Wechat 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Wechat

提供微信账户、公众平台、第三方平台和支付适配。应用身份、用户身份、平台授权与商户权限需要分别处理。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/wechat` |
| 主包 | `Zongsoft.Externals.Wechat` |
| 配套主题 | [云服务与回调](../cloud.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals wechat]
nuget:Zongsoft.Externals.Wechat
```
{% endcode %}

按随包选项配置账户、证书及所用服务。主包提供客户端能力，HTTP API 和回调入口使用独立产物。

相关产物包括 `Zongsoft.Externals.Wechat.Web` 和 `Zongsoft.Externals.Wechat.Gateway`，按实际需要组合。

## 接入步骤

1. 先确定所用微信产品以及对应应用或商户身份。
2. 核对授权、令牌保存与刷新流程，再验证所需客户端操作。
3. 接收回调时注册处理器，验证签名、解密、重复通知及目标协议要求的应答内容。

具体配置、调用示例和相关基础概念见[云服务与回调](../cloud.md)。

## 项目边界

{% hint style="info" %}
💡 默认 Gateway 的 POST 分派不等于完整平台地址验证或自动验签。应在业务执行前完成来源验证和幂等检查，不能把网关路由名称作为认证依据。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [云服务与回调](../cloud.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/wechat)
