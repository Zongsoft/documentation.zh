---
description: 安装 Zongsoft 相关 NuGet 包和全局工具。
icon: download
---

# 安装包

Zongsoft 框架组件主要通过 NuGet 包分发，工具链通过 .NET 全局工具分发。

## 安装框架包

按你的应用需要安装对应包。例如，插件式应用通常会用到：

```bash
dotnet add package Zongsoft.Core
dotnet add package Zongsoft.Plugins
```

如果需要 Web 能力：

```bash
dotnet add package Zongsoft.Web
dotnet add package Zongsoft.Plugins.Web
```

如果需要数据访问：

```bash
dotnet add package Zongsoft.Data
dotnet add package Zongsoft.Data.MySql
```

可用驱动包括 SQL Server、MySQL、SQLite、DuckDB、PostgreSQL、InfluxDB、TDengine 和 ClickHouse 等，具体见 [包与模块索引](../references/packages.md)。

## 安装部署工具

`dotnet-deploy` 用于根据 `.deploy` 文件部署插件和附属文件。

```bash
dotnet tool install -g Zongsoft.Tools.Deployer
```

更新已安装工具：

```bash
dotnet tool update -g Zongsoft.Tools.Deployer
```

## 安装打包工具

`dotnet-pack` 用于制作 `.tar.gz`、`.deb`、`.rpm` 安装包。

```bash
dotnet tool install -g Zongsoft.Tools.Packager
```

## 检查工具

```bash
dotnet tool list -g
```

确认列表中包含需要的工具后，再继续阅读 [选择宿主程序](hosting.md)。
