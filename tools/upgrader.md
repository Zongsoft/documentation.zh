---
description: dotnet-upgrade 自动升级打包器的用途和基本命令。
icon: arrows-rotate
---

# 升级打包器 dotnet-upgrade

`dotnet-upgrade` 用于制作、校验和发布自动升级包。它位于 framework 仓库的 `upgrading/tool` 目录。

## 基本命令

```bash
dotnet-upgrade pack [选项...] [参数...]
dotnet-upgrade checksum [选项] <包文件...>
dotnet-upgrade publish [选项] <包文件...>
```

## 打包

常见必填选项包括：

- `--name`
- `--version`
- `--platform`
- `--framework`

示例：

```bash
dotnet-upgrade pack \
	--name:Zongsoft.Daemon \
	--version:1.1.0 \
	--edition:stable \
	--framework:net10.0 \
	--platform:windows \
	--architecture:x64 \
	--source:"D:\Zongsoft\hosting\daemon\bin\Debug\net10.0"
```

## 发布清单

打包完成后会生成 `.manifest` 发布清单，包含应用名称、版本、平台、包文件、校验码、标签、标题和执行器等信息。
