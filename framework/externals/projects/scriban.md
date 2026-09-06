---
description: Scriban 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Scriban

提供 Scriban 纯脚本表达式求值，适合把小范围规则按名称和配置接入业务插件。完整入门示例使用此项目演示服务匹配。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/scriban` |
| 主包 | `Zongsoft.Externals.Scriban` |
| 配套主题 | [脚本与表达式](../scripting.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals scriban]
nuget:Zongsoft.Externals.Scriban
```
{% endcode %}

在应用初始化后按名称 `Scriban` 匹配表达式求值器。表达式使用纯脚本，例如 `x + y`，不直接加入模板分隔符。

## 接入步骤

1. 先完成首个业务插件教程，确认清单、服务注册和命令均生效。
2. 为每次求值传入独立变量字典，验证预期数值或文本结果。
3. 保存规则版本与测试输入，覆盖缺字段、语法错误及非法结果。

具体配置、调用示例和相关基础概念见[脚本与表达式](../scripting.md)。

## 项目边界

{% hint style="info" %}
💡 当前实现直接读取 variables.Count；即使没有变量也应传入空字典。每次建立上下文不意味着任意脚本可安全执行或保证在指定时间内停止。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [脚本与表达式](../scripting.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/scriban)
