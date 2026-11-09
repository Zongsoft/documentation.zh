---
description: 使用交互式终端验证插件、命令和后台业务，区分运行身份与部署方案。
icon: terminal
---

# 终端宿主

终端宿主适合观察插件加载、调用业务命令和复现后台任务。它保留命令交互，因此比直接把业务安装成系统服务更容易看到输入、输出与错误上下文。

## 启动入口

终端入口先等待创建宿主，再等待运行和清理完成：

以下为 Main 方法片段，需要引入 System.Threading.Tasks 和 Microsoft.Extensions.Hosting。接口依据见 [Application.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Hosting/Application.cs)。

{% code title="Program.cs" %}
```csharp
static async Task Main(string[] args)
{
	var host = await Zongsoft.Plugins.Hosting.Application.TerminalAsync(
		"zongsoft.terminal", [.. args, "host=terminal", "site=daemon"]);

	await host.RunAsync();
}
```
{% endcode %}

`host=terminal` 标识交互宿主，`site=daemon` 使其组合后台场景的配置与插件。不要为了“名称统一”将二者改成同一值，现有部署清单会使用它们选择不同资源。

## 从最小应用开始

如果还没有业务部署方案，先完成[部署第一个插件](../get-started/deploy-first-plugin.md)。该教程以 Discussions 和现有宿主为基础，适合学习 Main、Terminal 及命令插件的关系。

使用 hosting 仓库的现有终端时，先按根目录说明准备框架输出，再检查 `terminal/.deploy`、方案清单和 `deploy.cmd`。脚本组合宿主编译、插件部署及方案选择，不能把 `dotnet build` 当作全部部署工作。

已部署目录可通过对应可执行文件或 DLL 启动；从运行目录执行：

{% code title="RunTerminal.ps1" %}
```powershell
dotnet ./Zongsoft.Hosting.Terminal.dll
```
{% endcode %}

## 验证命令

在终端中先执行 `help` 查看实际命令树，`plugin.list` 查看已部署的插件，再执行业务命令。命令不存在时，先检查构件路径、命令插件及依赖；命令存在但调用失败时，再检查服务解析与业务配置。

[首个业务插件](../get-started/first-business-plugin.md)从 Discussions 的模块、数据服务和插件挂载展开；站内信命令的真实实现见[命令模型](../framework/core/components/commands.md)。命令类存在不代表已经挂载到当前终端，请以实际插件树为准。

## 停止与信号

默认终端宿主将 Ctrl+C／SIGINT 转为终端 Aborting 通知，已处理时保持运行，未处理时请求停止；Ctrl+Break／SIGQUIT 和 SIGTERM 直接请求停止。中断处理器应及时返回，不得等待所属宿主停止。显式注册的自定义宿主生命周期自行负责信号管理。

标准输入与进程同寿命，停止只结束输入等待，不关闭标准输入，也不等待底层控制台读取退出。宿主仍须等待交互命令退出清理和工作器停止；RunAsync 返回后入口才能退出。

## 调试与退出

附加调试器时，应匹配运行 DLL、PDB 和源码版本；修改源码后只重建而未复制输出，断点可能仍对应旧实现。手工替换文件前停止宿主，保留目标目录和部署版本记录。

退出可使用 `exit -yes`。如果停止很慢，检查[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)是否仍等待外部请求、消息处理或未响应取消，不要先把所有后台任务改为强制退出。

自动升级测试必须使用实际应用名 `zongsoft.terminal` 匹配发布，并检查 `.deployer` 是否仍在部署目录。详见[升级接入](../framework/upgrading/workflow.md)。

源码入口：[终端项目](https://github.com/Zongsoft/hosting/tree/main/terminal)。
