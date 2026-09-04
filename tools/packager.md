---
description: dotnet-pack 打包工具的用途、命令和包格式。
icon: box
---

# 打包工具 dotnet-pack

`dotnet-pack` 是 .NET 全局工具，用于把发布目录打包为 Linux 分发和安装常用格式。

## 支持格式

- `.tar.gz`
- `.deb`
- `.rpm`

## 安装

```bash
dotnet tool install -g Zongsoft.Tools.Packager
```

## 基本命令

```bash
dotnet-pack deb \
	--name:MyCompany.MyApp \
	--title:"MyApp Service" \
	--version:1.0.0 \
	--platform:linux \
	--architecture:x64 \
	--framework:net10.0 \
	--source:./publish \
	--output:./packages
```

## 常用能力

- 自动生成 systemd 服务文件。
- 生成安装和卸载生命周期脚本。
- 支持文件条目、目录递归、通配符和目标别名。
- 支持变量替换。
- 在 Unix 类系统上保留文件权限。

## 适用场景

当宿主和插件已经部署到发布目录后，可以使用 `dotnet-pack` 生成可交付安装包。

## 相关资源

* [packager 源码目录](https://github.com/Zongsoft/tools/tree/main/packager)
* [packager 中文 README](https://github.com/Zongsoft/tools/blob/main/packager/README.zh-Hans.md)
* [packager 英文 README](https://github.com/Zongsoft/tools/blob/main/packager/README.md)
* [Zongsoft.Tools.Packager NuGet 包](https://www.nuget.org/packages/Zongsoft.Tools.Packager)
