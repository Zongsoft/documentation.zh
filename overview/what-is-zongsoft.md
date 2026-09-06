---
description: 了解 Zongsoft 开源框架系列的组成、定位与适用场景。
icon: circle-info
---

# 什么是 Zongsoft

Zongsoft 是面向 .NET 应用开发的一组开源框架、宿主程序与工具链。它的核心能力围绕插件化应用展开：宿主程序只负责建立运行环境，业务能力通过插件、配置、数据映射和附属资源部署到宿主中。

## 组成部分

### Framework

[`Zongsoft/framework`](https://github.com/Zongsoft/framework) 是框架代码仓库，包含[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)、插件框架、数据引擎、Web 基础库、安全、诊断、消息队列、自动升级和第三方服务适配。

### Hosting

[`Zongsoft/hosting`](https://github.com/Zongsoft/hosting) 提供终端、后台服务和 Web 三类宿主程序。宿主程序本身不承载业务逻辑，它们通过插件框架加载 `plugins/` 目录中的插件文件来组成应用。

### Tools

[`Zongsoft/tools`](https://github.com/Zongsoft/tools) 提供部署和打包工具，包括 `dotnet-deploy`、`dotnet-pack` 和正则表达式 GUI 工具。自动升级打包器 `dotnet-upgrade` 位于 framework 仓库的 `upgrading/tool` 目录。

## 适用场景

Zongsoft 更适合需要长期演进、模块边界清晰、部署形态多样的业务系统。例如：

- 多业务模块组合的后台服务。
- 需要按站点、环境、客户或部署方案组合功能的大型应用。
- 需要将通用能力沉淀为插件并跨项目复用的系统。
- 需要部署、安装包和自动升级流程配套的 .NET 应用。

## 与常见框架的关系

Zongsoft 与 [ABP](https://abp.io) 一样属于偏完整应用框架与工具链的体系，但它的组织重心更偏向“插件式应用运行时”。阅读本文档时，可以先把 Zongsoft 理解为：

1. 一套基础开发抽象。
2. 一套插件化应用模型。
3. 一套宿主程序模板。
4. 一套部署、打包和升级工具。
