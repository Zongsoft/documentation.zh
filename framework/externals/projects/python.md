---
description: Python 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# Python

通过 IronPython 提供 Python 求值能力，适合在受控规则中使用与该运行时兼容的语言及库。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/python` |
| 主包 | `Zongsoft.Externals.Python` |
| 配套主题 | [脚本与表达式](../scripting.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals python]
nuget:Zongsoft.Externals.Python
```
{% endcode %}

在应用初始化后按名称 `Python` 匹配表达式求值器。部署要保留所需 lib 标准库，不能依赖系统 CPython 的包安装结果。

## 接入步骤

1. 确认部署目录中的 IronPython 与标准库完整。
2. 使用专题中的变量传递方式验证简单表达式，再验证应用实际导入的库。
3. 对并发调用、输入输出和全局状态建立明确的执行边界。

具体配置、调用示例和相关基础概念见[脚本与表达式](../scripting.md)。

## 项目边界

{% hint style="info" %}
💡 当前实现复用引擎，并在调用期间切换运行时 IO。独立变量字典不能保证线程隔离；需要时由应用串行化或使用独立进程，不能把求值器当作安全沙箱。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [脚本与表达式](../scripting.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/python)
