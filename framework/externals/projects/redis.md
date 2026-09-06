---
description: Redis 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Redis

把 Redis 接入缓存、序号、分布式锁、消息流、配置和可靠消息存储。各项能力共用基础设施，但有不同的契约与一致性边界。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/redis` |
| 主包 | `Zongsoft.Externals.Redis` |
| 配套主题 | [缓存与分布式协作](../caching.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals redis]
nuget:Zongsoft.Externals.Redis
```
{% endcode %}

普通连接位于 `/Externals/Redis/ConnectionSettings`，驱动及提供者别名为 `Redis`。例如 “连接名@Redis” 由 Redis 提供者按指定连接名取得实例。

## 接入步骤

1. 按缓存专题配置独立测试连接，使用唯一键验证读写和清理。
2. 核对实际连接选择、数据库编号与键前缀，再按所需能力验证序号或锁。
3. 需要消息存储时，另按可靠性专题配置与 Broker 严格同名的连接及稳定存储身份。

具体配置、调用示例和相关基础概念见[缓存与分布式协作](../caching.md)。

## 项目边界

{% hint style="info" %}
💡 普通提供者可能回退默认连接，消息存储工厂则严格匹配 Broker 名。共享实例不应按请求释放或修改命名空间；键空间通知断线不重放，不能替代可靠事件日志。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [缓存与分布式协作](../caching.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/redis)
