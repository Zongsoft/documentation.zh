---
description: Garnet 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Garnet

通过宿主工作器运行支持 Redis 协议的 Garnet 服务器。项目承担服务器托管职责，业务客户端仍需要相应的访问适配器。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/garnet` |
| 主包 | `Zongsoft.Externals.Garnet` |
| 配套主题 | [缓存与分布式协作](../caching.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals garnet]
nuget:Zongsoft.Externals.Garnet
```
{% endcode %}

设置位于 `/Externals/Garnet`，具名 server 的 value 转换为服务器选项。启动工作器会使用相应端口和存储目录。

## 接入步骤

1. 明确绑定地址、端口、认证和持久化目录后再启用工作器。
2. 使用选定客户端验证应用实际依赖的命令和数据类型。
3. 如启用 AOF 或检查点，验证停止、重新启动和数据恢复。

具体配置、调用示例和相关基础概念见[缓存与分布式协作](../caching.md)。

## 项目边界

{% hint style="info" %}
💡 服务器与宿主共享进程资源及故障边界。相对目录通常相对适配器程序集解析，`~/` 相对应用根目录；Redis 协议兼容不等于全部命令和持久化行为相同。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [缓存与分布式协作](../caching.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/garnet)
