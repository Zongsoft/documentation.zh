---
description: Zongsoft 自动升级组件和升级工具。
icon: rotate
---

# 自动升级

Zongsoft 自动升级能力位于 framework 仓库的 `upgrading` 目录，包含本地部署器、升级器插件、Web 服务端和升级打包工具。

## 组成

- `Zongsoft.Upgrading.Deployer`：本地升级部署器。
- `Zongsoft.Upgrading.Upgrader`：宿主应用中的升级器插件。
- `Zongsoft.Upgrading.Web`：服务端发布和下载支持。
- `Zongsoft.Tools.Upgrader`：升级包打包、校验和发布工具。

## 基本流程

1. 使用 `dotnet-upgrade pack` 制作升级包。
2. 使用 `dotnet-upgrade checksum` 校验包。
3. 使用 `dotnet-upgrade publish` 发布包和清单。
4. 宿主应用中的升级器检测、下载并触发部署。

更多工具参数见 [升级打包器 dotnet-upgrade](../tools/upgrader.md)。
