---
description: Hangfire 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Hangfire

将持久后台作业与框架调度契约连接起来，适合延迟执行和周期任务。作业存储、执行进程和管理界面分别承担不同职责。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/hangfire` |
| 主包 | `Zongsoft.Externals.Hangfire` |
| 配套主题 | [任务调度与弹性执行](../execution.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals hangfire]
nuget:Zongsoft.Externals.Hangfire
```
{% endcode %}

业务处理器挂载到 `/Workbench/Scheduler/Handlers`。延迟或周期调度器由容器提供，daemon 插件变体负责后台 Server。

可选产物包括 `Zongsoft.Externals.Hangfire.Storages.Redis` 和 `Zongsoft.Externals.Hangfire.Web`。Redis 作业存储使用 Hangfire 连接；Web Dashboard 不负责代替后台 Server 执行任务。

## 接入步骤

1. 准备作业存储，并核对部署站点所需的 daemon 变体。
2. 注册稳定处理器名称，按专题示例调度一次短作业并观察实际执行。
3. 再验证周期时区、重复执行、失败重试与停机恢复。

具体配置、调用示例和相关基础概念见[任务调度与弹性执行](../execution.md)。

## 项目边界

{% hint style="info" %}
💡 调度返回的是任务标识，不是业务结果。持久任务参数应使用可序列化业务数据；更改处理器名称或参数结构时，需要考虑存储中的旧任务。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [任务调度与弹性执行](../execution.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/hangfire)
