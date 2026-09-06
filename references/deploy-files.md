---
description: 以 Discussions 领域与 Web 插件的真实部署清单说明资源布局和变量。
icon: file-code
---

# 部署文件格式


.deploy 描述如何从包或本地目录收集文件并放到目标布局。Discussions 为领域库和 Web 库分别提供清单，随 NuGet 包交付。

## 领域包的根布局

来源：[src/Zongsoft.Discussions.deploy](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.deploy#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.deploy" %}
```ini
artifacts/Zongsoft.Discussions.plugin
artifacts/Zongsoft.Discussions.option
artifacts/Zongsoft.Discussions.mapping
lib/$(Framework)/Zongsoft.Discussions.*
```
{% endcode %}

artifacts 中是清单、选项和映射；lib 下根据 Framework 变量选择目标框架程序集。这里没有虚构的业务目录，也没有自动建库步骤。缺少对应目标框架的产物时，应先解决构建或版本选择。

## Web 包与模板目录

来源：[src/api/Zongsoft.Discussions.Web.deploy](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Zongsoft.Discussions.Web.deploy#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.Web.deploy" %}
```ini
artifacts/Zongsoft.Discussions.Web.plugin
lib/$(Framework)/Zongsoft.Discussions.Web.*

[templates]
artifacts/templates/*.xlsx
```
{% endcode %}

方括号段落把后续文件放到 templates 子目录；右侧源路径仍相对于包内布局解释。Web 模板由项目文件从 docs/templates 收集。部署清单与 csproj 的 Pack、PackagePath 必须一起核对，否则源代码中有文件，包内却可能没有。

## 变量来自部署过程

Framework 由部署器的目标参数提供，不是运行时随意猜出的 SDK 版本。其他变量、条件复制、重命名与 import 指令属于部署工具能力，完整来源参考[部署器](../tools/deployer.md)和框架[Profile 解析](../framework/core/configuration.md)。不能将宿主命令行参数与部署阶段变量混为一谈。

## 清单的验证顺序

先生成本地包或发布目录，再检查清单引用是否能解析，最后检查目标目录中的 DLL、plugin、option、mapping 和 templates。NuGet 包构建与推送是不同操作；Discussions 的 Cake pack 任务还包含推送，进行文档验证时不要调用它。

阅读真实交付路径：[部署第一个插件](../get-started/deploy-first-plugin.md)。
