---
description: Zongsoft.Diagnostics 与 OpenTelemetry 相关诊断能力。
icon: stethoscope
---

# 诊断

`Zongsoft.Diagnostics` 提供诊断能力，重点包括 OpenTelemetry 协议相关的接收、处理和导出扩展。

## 主要能力

- OpenTelemetry 协议接收和处理。
- Console、Prometheus、Zipkin 等导出插件。
- 诊断协议客户端和服务端扩展。

## 主要包

- `Zongsoft.Diagnostics`
- `Zongsoft.Diagnostics.Protocols.Client`
- `Zongsoft.Diagnostics.Protocols.Server`

## 部署提示

宿主部署文件通常会把诊断配置复制为 `Zongsoft.Diagnostics.option`。不同站点可以使用不同配置，例如 `Zongsoft.Diagnostics-default.option`。
