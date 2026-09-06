---
description: 安装 Zongsoft 相关 NuGet 包和全局工具。
icon: download
---

# 安装包

Zongsoft 框架组件主要通过 NuGet 包分发，工具链通过 .NET 全局工具分发。

## 编译引用与运行部署

`dotnet add package` 让项目能够编译使用相应 API；插件宿主还需要 `.plugin`、`.option`、映射及依赖等运行产物。业务模块通常只引用需要的契约，具体驱动由宿主部署方案选择。例如只使用数据访问契约的模块不必直接引用所有数据库驱动。

团队项目应固定兼容版本。不同版本包混合部署时，最终 DLL 和附属资源必须匹配；不能把 NuGet 还原成功当作插件部署成功。

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

## 工具找不到时

先检查 `dotnet tool list -g` 和工具目录是否进入 PATH，再打开新终端重试。全局安装属于当前账号，系统服务或其他账号不一定能找到同一路径。离线或私有源环境还需预先安排包缓存和访问权限。

仅制作插件应用时先安装部署器即可，Linux 安装包和自动升级工具在相应阶段再准备。不要为了运行一个无外部依赖的示例启动全部容器。
