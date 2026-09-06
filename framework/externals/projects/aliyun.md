---
description: Aliyun 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Aliyun

接入阿里云 OSS、消息、短信与语音、移动推送等能力。不同服务有独立的资源、模板和权限条件，按实际使用的能力准备配置。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/aliyun` |
| 主包 | `Zongsoft.Externals.Aliyun` |
| 配套主题 | [云服务与回调](../cloud.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals aliyun]
nuget:Zongsoft.Externals.Aliyun
```
{% endcode %}

配置位于 `/Externals/Aliyun`。通用设置选择服务中心和网络，具名 Certificate 保存访问凭据；此处 Certificate 是适配器的凭据模型。OSS 通过 `zfs.oss` 文件系统接入。

回调需要另行部署 `Zongsoft.Externals.Aliyun.Gateway`，主包不会自动提供 HTTP 回调入口。

## 接入步骤

1. 选择一项服务，配置专用资源及对应凭据；对象存储先验证已存在对象的信息读取。
2. 短信、语音与推送要核对模板、应用和目标类型，再验证平台返回值及业务回执。
3. 接收回调时注册目标处理器，并验证原始请求的签名、重复通知和协议要求的应答。

具体配置、调用示例和相关基础概念见[云服务与回调](../cloud.md)。

## 项目边界

{% hint style="info" %}
💡 默认回调路径中的 name 是处理器分派键。网关不自动完成所有服务的验签、解密和重放防护；Aliyun 的处理器集合装配还需按实际插件节点暴露 Handlers 属性。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [云服务与回调](../cloud.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/aliyun)
