---
description: Polly 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Polly

把重试、超时、熔断、限流和回退接入 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 执行管线，用于处理一次操作遇到的暂时故障。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/polly` |
| 主包 | `Zongsoft.Externals.Polly` |
| 配套主题 | [任务调度与弹性执行](../execution.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals polly]
nuget:Zongsoft.Externals.Polly
```
{% endcode %}

通过插件树把管线构建器绑定到执行器，策略使用 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的相应特性表达。应针对具体操作决定策略及其组合顺序。

## 接入步骤

1. 用可控短操作确认执行器确实经过配置管线。
2. 逐项验证重试次数、超时取消、熔断恢复或限流拒绝，再组合策略。
3. 把最终错误和总耗时与业务预期比较，之后再接入外部调用。

具体配置、调用示例和相关基础概念见[任务调度与弹性执行](../execution.md)。

## 项目边界

{% hint style="info" %}
💡 部署插件不会让全部 HTTP 或数据库调用自动获得策略。重试需要操作可重放；与 Hangfire 作业重试叠加时，应计算总尝试次数及总时间预算。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [任务调度与弹性执行](../execution.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/polly)
