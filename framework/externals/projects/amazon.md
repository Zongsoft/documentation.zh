---
description: Amazon 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Amazon

通过框架文件系统接入 Amazon S3 及兼容对象存储。适用于以 Bucket 和对象 Key 管理文件资源的应用。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/amazon` |
| 主包 | `Zongsoft.Externals.Amazon` |
| 配套主题 | [云服务与回调](../cloud.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals amazon]
nuget:Zongsoft.Externals.Amazon
```
{% endcode %}

连接设置位于 `/Externals/Amazon/ConnectionSettings`，驱动键为 `amazon.s3`。文件系统标识为 `zfs.s3`，例如 `zfs.s3:/assets/manuals/start.pdf` 中 assets 是 Bucket。

## 接入步骤

1. 准备测试 Bucket、连接端点、区域和有权限的凭据。
2. 按专题中的只读示例检查已存在对象，再验证应用实际需要的列举、读取或写入。
3. 释放每次调用产生的流，并用最终对象信息确认写入结果。

具体配置、调用示例和相关基础概念见[云服务与回调](../cloud.md)。

## 项目边界

{% hint style="info" %}
💡 自定义端点使用路径式寻址。兼容 S3 不代表全部供应商行为一致；目录只是对象键前缀，不应把本地文件的重命名、追加和随机写入语义直接套入对象存储。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [云服务与回调](../cloud.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/amazon)
