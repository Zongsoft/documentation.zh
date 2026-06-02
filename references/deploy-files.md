---
description: .deploy 部署文件的基本格式和常见条目。
icon: file-lines
---

# 部署文件格式

`.deploy` 文件是 INI 风格文本文件，用于描述插件和附属文件如何部署到目标目录。

## 基本结构

{% code title="web.deploy" %}
```ini
[plugins]
nuget:Zongsoft.Plugins/plugins/Main.plugin

[plugins zongsoft data]
nuget:Zongsoft.Data
```
{% endcode %}

章节表示目标目录，条目表示要部署的源内容。

## 变量

部署文件支持两种变量语法：

```text
$(name)
%name%
```

变量来源包括环境变量、宿主 `appsettings.json` 和命令行选项。

## 过滤条件

条目末尾可以使用 `<...>` 写过滤条件：

{% code title="web.deploy" %}
```ini
app.$(environment)-debug.option = app.option <debug:on>
app.$(environment).option = app.option <!debug:on>
```
{% endcode %}

## NuGet 部署

{% code title="web.deploy" %}
```ini
nuget:Zongsoft.Data@latest
nuget:Zongsoft.Data@6.2.0/.deploy
```
{% endcode %}

如果包根目录包含 `.deploy` 文件，通常会优先执行包内部署文件。
