---
description: Zongsoft 工具链概览。
icon: screwdriver-wrench
---

# 工具概览

Zongsoft 工具链用于辅助部署、打包、升级和开发调试。

## 工具列表

| 工具 | 命令 | 用途 |
| --- | --- | --- |
| Zongsoft.Tools.Deployer | `dotnet deploy` | 根据 `.deploy` 文件部署插件和附属文件 |
| Zongsoft.Tools.Packager | `dotnet-pack` | 制作 `.tar.gz`、`.deb`、`.rpm` 安装包 |
| Zongsoft.Tools.Upgrader | `dotnet-upgrade` | 制作、校验和发布自动升级包 |
| Zongsoft.Tools.Regular | GUI | 正则表达式测试工具 |

## 推荐使用顺序

1. 使用 `dotnet deploy` 把插件部署到宿主。
2. 使用宿主程序完成运行验证。
3. 使用 `dotnet-pack` 制作安装包。
4. 使用 `dotnet-upgrade` 制作升级包。

## 相关资源

* [tools 仓库](https://github.com/Zongsoft/tools)
* [tools 中文 README](https://github.com/Zongsoft/tools/blob/main/README-zh_CN.md)
* [tools 英文 README](https://github.com/Zongsoft/tools/blob/main/README.md)
* [Zongsoft.Tools.Deployer NuGet 包](https://www.nuget.org/packages/Zongsoft.Tools.Deployer)
* [Zongsoft.Tools.Packager NuGet 包](https://www.nuget.org/packages/Zongsoft.Tools.Packager)
* [Zongsoft.Tools.Upgrader NuGet 包](https://www.nuget.org/packages/Zongsoft.Tools.Upgrader)
