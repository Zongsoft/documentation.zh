---
description: 位于 Zongsoft.Core 核心库的 Configuration 命名空间。
icon: square-sliders
cover: >-
  https://images.unsplash.com/photo-1593720218365-b2076cfdefee?crop=entropy&cs=srgb&fm=jpg&ixid=M3wxOTcwMjR8MHwxfHNlYXJjaHwyfHxjb25maWd1cmF0aW9ufGVufDB8fHx8MTc1NzUxNjE3MXww&ixlib=rb-4.1.0&q=85
coverY: 0
layout:
  width: default
  cover:
    visible: true
    size: full
  title:
    visible: true
  description:
    visible: true
  tableOfContents:
    visible: true
  outline:
    visible: true
  pagination:
    visible: true
  metadata:
    visible: true
---

# 配置

### 概述

该命名空间提供了基于 [_**M**icrosoft.**E**xtensions.**C**onfiguration_](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.configuration) 相关的扩展，并增加了 _**XML**_ 格式的 `.option` 配置文件和功能强化的 `.ini` 格式的配置文件，以及自定义持久化的配置模型。

### 设置

通过字符串来表示设置信息，由 [_**S**ettings_](https://github.com/Zongsoft/framework/blob/master/Zongsoft.Core/src/Configuration/Settings.cs) 类提供设置的解析和表达。

### 连接设置

通过字符串来表示连接设置信息，由 [_**C**onnection**S**ettings**B**ase_](https://github.com/Zongsoft/framework/blob/master/Zongsoft.Core/src/Configuration/ConnectionSettingsBase.cs) 类及相关类提供解析和表达。
