---
description: 使用交互式终端验证插件、命令和后台业务，区分运行身份与部署方案。
icon: terminal
---

# 终端宿主

终端宿主适合观察插件加载、调用业务命令和复现后台任务。它保留命令交互，因此比直接把业务安装成系统服务更容易看到输入、输出与错误上下文。

## 启动入口

当前 `hosting/terminal/Program.cs` 的关键调用如下：

{% code title="Program.cs" %}
```csharp
using Microsoft.Extensions.Hosting;

Zongsoft.Plugins.Hosting.Application
	.Terminal("zongsoft.terminal", [.. args, "host=terminal", "site=daemon"])
	.Run();
```
{% endcode %}

`host=terminal` 标识交互宿主，`site=daemon` 使其组合后台场景的配置与插件。不要为了“名称统一”将二者改成同一值，现有部署清单会使用它们选择不同资源。

## 从最小应用开始

如果还没有业务部署方案，先完成[部署第一个插件](../get-started/deploy-first-plugin.md)。该教程创建独立小宿主和输出目录，适合学习 Main、Terminal 及命令插件的关系。

使用 hosting 仓库的现有终端时，先按根目录说明准备框架输出，再检查 `terminal/.deploy`、方案清单和 `deploy.cmd`。脚本组合宿主编译、插件部署及方案选择，不能把 `dotnet build` 当作全部部署工作。

已部署目录可通过对应可执行文件或 DLL 启动；从运行目录执行：

{% code title="RunTerminal.ps1" %}
```powershell
dotnet ./Zongsoft.Hosting.Terminal.dll
```
{% endcode %}

## 验证命令

在终端中先执行 `help` 查看实际命令树，`plugin.list` 查看已部署的插件，再执行业务命令。命令不存在时，先检查构件路径、命令插件及依赖；命令存在但调用失败时，再检查服务解析与业务配置。

[首个业务插件](../get-started/first-business-plugin.md)提供一个返回 `42` 的表达式命令，可用于验证“加载 → 配置 → 服务 → 执行”整个闭环。

## 调试与退出

附加调试器时，应匹配运行 DLL、PDB 和源码版本；修改源码后只重建而未复制输出，断点可能仍对应旧实现。手工替换文件前停止宿主，保留目标目录和部署版本记录。

退出可使用 `exit -yes`。如果停止很慢，检查工作器是否仍等待外部请求、消息处理或未响应取消，不要先把所有后台任务改为强制退出。

自动升级测试必须使用实际应用名 `zongsoft.terminal` 匹配发布，并检查 `.deployer` 是否仍在部署目录。详见[升级接入](../framework/upgrading/workflow.md)。

源码入口：[终端项目](https://github.com/Zongsoft/hosting/tree/main/terminal)。
