---
description: 宿主程序的部署文件、配置文件和手工部署方式。
icon: truck
---

# 部署宿主

宿主程序通过部署获得业务能力。部署就是把插件和附属文件复制到宿主目录下的 `plugins/` 目录。

## 部署文件

每个宿主目录通常包含 `.deploy` 文件。部署文件会引用公共部署资源，例如：

```text
hosting/.deploy/default/options
```

部署规则中常见变量包括：

- `scheme`
- `environment`
- `site`
- `debug`
- `framework`
- `platform`
- `architecture`

## 配置文件

环境无关配置通常使用基础文件名：

```text
Zongsoft.Security.option
```

环境相关配置通常在文件名中加入环境：

```text
Zongsoft.Security.development.option
Zongsoft.Security.production.option
```

调试环境配置可以使用：

```text
Zongsoft.Security.development-debug.option
```

## 手工部署

开发调试时，如果只修改了某个插件，可以手工复制该插件的 `*.plugin`、`*.dll`、`*.option`、`*.mapping` 等文件到目标插件目录，以避免完整部署耗时过长。
