---
description: Etcd 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Etcd

提供基础键值操作、序号和租约锁，适合需要原子序号分配或协调共享资源访问的场景。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/etcd` |
| 主包 | `Zongsoft.Externals.Etcd` |
| 配套主题 | [缓存与分布式协作](../caching.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals etcd]
nuget:Zongsoft.Externals.Etcd
```
{% endcode %}

连接设置位于 `/Externals/Etcd/ConnectionSettings`，驱动键为 `etcd`。序号与锁通过对应提供者接入；多个实现共存时，在应用组合层明确选择。

## 接入步骤

1. 配置测试集群和独立键前缀，先确认连接与目标键空间。
2. 验证序号首次分配、重复递增及过期策略；首次结果为 seed + interval。
3. 验证锁获取、竞争、租约失效及续期失败，再让资源端使用栅栏令牌拒绝旧持有者。

具体配置、调用示例和相关基础概念见[缓存与分布式协作](../caching.md)。

## 项目边界

{% hint style="info" %}
💡 当前提供者没有 Etcd 服务别名，不能照搬 Redis 的 `name@Redis` 调用。它也不是公共分布式缓存接口的替代实现；连接名不会自动成为键命名空间。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [缓存与分布式协作](../caching.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/etcd)
