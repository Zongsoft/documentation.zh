---
description: Zongsoft .option 选项配置文件的组织方式。
icon: sliders
---

# 选项配置文件

`.option` 文件用于配置插件和应用模块。宿主部署时会根据环境、站点和调试参数选择不同配置文件。

## 命名约定

环境无关配置：

```text
Zongsoft.Security.option
```

环境相关配置：

```text
Zongsoft.Security.development.option
Zongsoft.Security.test.option
Zongsoft.Security.production.option
```

调试配置：

```text
Zongsoft.Security.development-debug.option
Zongsoft.Security.test-debug.option
Zongsoft.Security.production-debug.option
```

## 部署位置

配置文件通常位于：

```text
hosting/.deploy/{scheme}/options
```

部署时复制到目标插件目录，并可能重命名为插件期望的默认配置名。

## 组织建议

- 环境无关配置作为默认值。
- 环境相关配置只覆盖环境差异。
- 不同业务模块维护自己的配置文件。
- 不要在文档或代码示例中暴露真实密钥、连接串和凭证。
