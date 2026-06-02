---
description: Zongsoft.Diagnostics 命名空间及其子命名空间的职责。
icon: stethoscope
---

# Zongsoft.Diagnostics

`Zongsoft.Diagnostics` 提供日志、诊断、异常选项、配置器和遥测基础抽象，用于统一框架内部的运行状态观察和诊断输出。

## 主要职责

* 提供日志器、日志格式化器、日志处理器和文本文件日志实现。
* 提供诊断器、诊断配置器和异常输出选项。
* 提供遥测指标、计量器、导出器和描述信息。
* 为宿主和模块提供统一诊断扩展点。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Diagnostics.Configuration` | 诊断配置相关模型。 |
| `Zongsoft.Diagnostics.Telemetry` | 遥测、导出器、计量器和指标基础模型。 |
| `Zongsoft.Diagnostics.Telemetry.Metrics` | 指标类型与指标采集辅助类型。 |

## 相关资源

* [Diagnostics 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Diagnostics)
* [诊断](../diagnostics.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
