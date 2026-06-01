---
description: dotnet-deploy 部署工具的用途、格式和常用命令。
icon: truck-ramp-box
---

# 部署工具 dotnet-deploy

`dotnet-deploy` 根据部署文件复制文件、解析 NuGet 包并部署插件附属资源。

## 安装

```bash
dotnet tool install -g Zongsoft.Tools.Deployer
```

更新：

```bash
dotnet tool update -g Zongsoft.Tools.Deployer
```

## 基本命令

```bash
dotnet deploy --edition:Debug --framework:net10.0 --platform:win --architecture:x64
```

指定部署文件：

```bash
dotnet deploy --edition:Debug --framework:net10.0 --platform:win --architecture:x64 web.deploy
```

## 部署文件

部署文件是 INI 风格文本文件，由章节和条目组成。章节表示目标目录，条目表示源文件、NuGet 包或删除操作。

```ini
[plugins]
nuget:Zongsoft.Plugins/plugins/Main.plugin

[plugins zongsoft security]
nuget:Zongsoft.Security
```

## 解析器

* 默认路径解析器：复制本地文件，支持 `*`、`?`、`**`。
* `nuget`：下载 NuGet 包并部署包内文件或 `.deploy`。
* `delete` / `remove`：删除目标文件。

更多语法见 [部署文件格式](../references/deploy-files.md)。
