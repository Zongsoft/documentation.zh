---
description: 使用 dotnet-deploy 将本地和 NuGet 产物组合到可验证的宿主运行目录。
icon: truck-ramp-box
---

# 部署工具 dotnet-deploy

`dotnet-deploy` 读取 `.deploy` 文件，执行文件复制、NuGet 包解析和显式删除。它解决运行目录的组装问题，不负责业务数据迁移、系统服务安装或保证所有 DLL 版本自动兼容。

## 安装与版本

{% code title="InstallDeployer.ps1" %}
```powershell
dotnet tool install -g Zongsoft.Tools.Deployer
dotnet tool list -g
```
{% endcode %}

已安装时使用 `dotnet tool update -g Zongsoft.Tools.Deployer`。团队发布流程应固定工具版本并记录包版本，避免不同机器选择不同的最新包。

## 最小部署

在包含 `.deploy` 的项目目录执行，明确目标运行目录和框架参数：

{% code title="DeployApplication.ps1" %}
```powershell
dotnet deploy .deploy --destination:./out --edition:Release --framework:net10.0 --platform:win --architecture:x64
```
{% endcode %}

{% code title=".deploy" %}
```ini
[plugins]
nuget:Zongsoft.Plugins/plugins/Main.plugin

[plugins zongsoft data]
nuget:Zongsoft.Data
```
{% endcode %}

这只是插件组合片段，目标目录还需宿主发布产物。完整闭环见[部署第一个插件](../get-started/deploy-first-plugin.md)。指定其他文件时，把 `.deploy` 换成对应文件；也可以按应用方案传入多份清单。

## 文件选择与覆盖

章节表示目标子目录，条目指定本地文件、包或删除动作。变量、条件和路径细节见[部署格式参考](../references/deploy-files.md)。

`--overwrite` 的现有取值为 `alway`、`never`、`newest`；`alway` 是工具实际拼写，不要自行改成 `always`。`newest` 按文件策略决定覆盖，不等于按程序集版本选择最高版本。

{% hint style="warning" %}
🚨 部署是顺序文件操作。后续包的传递依赖可能覆盖前面复制的 DLL，甚至变成较旧版本；NuGet 条目不执行整个部署图的统一版本求解。应检查最终目录版本和首次业务调用。
{% endhint %}

## NuGet 与附属资源

未指定包内路径时，优先处理包根 `.deploy`，否则选择最适用目标框架的 `lib` 资产。框架包内的清单还可能复制 `.plugin`、`.option`、`.mapping`、SQL、语言库或原生资源。

默认忽略某些依赖前缀，包括 `System.`、`Microsoft.Extensions.`、`Zongsoft.`。因此依赖宿主基础库或其他 Zongsoft 插件时，要检查宿主产物和明确的清单组合，不能只依赖传递复制。

## 排查与验收

路径含 Windows 盘符时要防止被误识别为解析器，例如使用 `:D:/...`；缺失框架资产时检查 `framework` 和包实际目录；配置未出现时检查条件和应用变量。

验收同时查看错误输出、目标文件及运行结果。当前某些未定义解析器错误不会形成非零退出码，不能仅凭脚本退出码认定部署成功。Windows 自动化还需要有效控制台句柄，遇到控制台错误应在实际终端中检查工具运行环境。

源码入口：[部署器](https://github.com/Zongsoft/tools/tree/main/deployer)、[完整命令说明](https://github.com/Zongsoft/tools/blob/main/deployer/README.zh-Hans.md)。
