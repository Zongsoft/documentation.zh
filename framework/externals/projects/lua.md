---
description: Lua 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Lua

通过 NLua 与 KeraLua 提供 Lua 表达式求值。业务通过公共求值器契约选择 Lua，脚本语法和返回值仍由 Lua 决定。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/lua` |
| 主包 | `Zongsoft.Externals.Lua` |
| 配套主题 | [脚本与表达式](../scripting.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals lua]
nuget:Zongsoft.Externals.Lua
```
{% endcode %}

在应用初始化后按名称 `Lua` 匹配表达式求值器。示例计算可使用 `return x + y`，变量通过每次调用自己的字典传入。

## 接入步骤

1. 部署匹配操作系统和架构的原生运行库。
2. 按脚本专题的公共调用方式改用 Lua 名称和语法，验证输入及返回值类型。
3. 覆盖多返回值、空值、语法错误和连续调用，再接入业务规则。

具体配置、调用示例和相关基础概念见[脚本与表达式](../scripting.md)。

## 项目边界

{% hint style="info" %}
💡 每次 Evaluate 创建并释放 Lua 状态；不要据此认定任意脚本都有时间限制或安全隔离。共享 Global 只适合启动阶段配置稳定内容。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [脚本与表达式](../scripting.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/lua)
