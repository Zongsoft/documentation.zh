---
description: 沿 hosting 已有方案部署 Discussions 领域与 Web 插件。
icon: rocket
---

# 部署第一个插件

本篇采用 hosting 仓库的真实 Web 宿主和 Discussions 部署项。需要同级 framework、hosting、discussions 源码，以及自己的隔离数据库、身份与文件存储配置。

## 1. 确认现有方案已经包含业务插件

来源：[hosting/web/web.deploy](https://github.com/Zongsoft/hosting/blob/main/web/web.deploy#L29)（节选；上下文见源文件）。

{% code title="web.deploy" %}
```ini
[plugins zongsoft discussions]
nuget:Zongsoft.Discussions@0.8.0
nuget:Zongsoft.Discussions.Web@0.8.0
```
{% endcode %}

0.8.0 是当前方案锁定的包版本，不表示 NuGet 上永远最新。领域库和 Web 库要一起部署；数据、安全和其他公共插件由同一方案的其余条目提供。

## 2. 区分宿主发布与业务构建

宿主项目位于 hosting/web/default，入口是 Zongsoft.Hosting.Web.dll。默认从同级 framework 输出引用 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)、Web、Plugins、Plugins.Web，因此发布前要先构建这些项目的相同目标框架和配置。命令从 hosting/web/default 执行：

{% code title="发布真实 Web 宿主" %}
```powershell
dotnet publish Zongsoft.Hosting.Web.csproj -c Release -f net10.0 -o ./out
```
{% endcode %}

该命令只准备宿主运行文件。本地构建的 discussions 不会自动替代部署清单中的 NuGet 0.8.0；本地源码构建步骤见[业务插件](first-business-plugin.md)。

## 3. 为隔离环境准备配置

检查 hosting/.deploy/default/options 中的应用、数据、安全和文件配置，替换为自己的测试端点。Discussions 的映射含外部序号和实体驱动选择，数据库脚本必须与实际部署匹配，见[首次查询](../framework/data/quickstart.md)。

不要直接运行 deploy.cmd 作为学习验证：该脚本还会清理插件目录并可能继续打包。下面使用同一部署器和已存在的方案，目标设为上一步的 out 目录：

{% code title="从 hosting/web/default 收集插件" %}
```powershell
dotnet deploy .deploy --destination:./out --host:web --site:default --scheme:default --environment:development --debug:off --edition:Release --framework:net10.0 --platform:win --architecture:x64
```
{% endcode %}

参数来自真实部署脚本；平台与架构应按实际运行环境调整。环境目录里的配置必须先审阅，命令不会替你建立安全的测试数据库。

## 4. 核对本地修改是否进入运行目录

使用 NuGet 清单时运行的是包内版本。调试本地修改，应停止宿主后，把 discussions 构建的 DLL/PDB 以及相应 plugin、option、mapping 更新到 out/plugins/zongsoft/discussions，并保留 Web 模板目录。不能把旧包和新源码混在一起后依然按同一版本排障。

领域与 Web 的资源清单见[部署文件格式](../references/deploy-files.md)。部署后应同时看到两个插件清单、领域映射、选项和用户列表模板。

## 5. 从运行目录启动并验证

{% code title="启动 Web 宿主" %}
```powershell
Set-Location ./out
dotnet ./Zongsoft.Hosting.Web.dll
```
{% endcode %}

监听地址由宿主配置提供。先确认 /Application，再用 discussions/docs/http/forum.http 的只读查询验证论坛接口。401/403、404、连接失败和空结果代表不同问题，按[运行与调试](run-and-debug.md)逐层排查。

这条路径会连接配置中的业务依赖。文档迁移阶段的离线编译和回归检查不能替代你所在环境的完整部署验收。
