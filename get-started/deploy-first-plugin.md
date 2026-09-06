---
description: 从空目录创建最小终端宿主，部署命令插件并验证一次完整调用。
icon: box-open
---

# 部署第一个插件

本教程创建独立的 `PluginDemo` 目录，得到一个能执行命令的插件式终端。它不需要数据库、缓存或云服务，适合先验证“宿主发布 → 插件部署 → 加载 → 调用”这条路径。

前置条件：已安装 .NET 10 SDK，NuGet 源可访问，并完成[安装部署工具](install.md)。这里选用 `net10.0` 作为完整示例；使用其它目标框架时，须同时核对宿主、插件和依赖版本。

{% stepper %}
{% step %}
## 创建启动器

在自己准备的示例父目录执行：

{% code title="创建 PluginDemo" %}
```shell
dotnet new console -n PluginDemo -f net10.0
cd PluginDemo
dotnet add package Zongsoft.Plugins
```
{% endcode %}

把 `Program.cs` 替换为：

{% code title="Program.cs" %}
```csharp
using Microsoft.Extensions.Hosting;
using Zongsoft.Plugins.Hosting;

Application.Terminal("PluginDemo", args).Run();
```
{% endcode %}

启动器只声明终端宿主，没有引用命令插件的具体类型。后面的命令能力由部署加入。
{% endstep %}

{% step %}
## 声明部署内容

在 `PluginDemo` 项目目录创建文件名为 `.deploy` 的文本文件：

{% code title=".deploy" %}
```ini
[plugins]
nuget:Zongsoft.Plugins/plugins/Main.plugin
nuget:Zongsoft.Plugins/plugins/Terminal.plugin

[plugins zongsoft commands]
nuget:Zongsoft.Commands
```
{% endcode %}

章节中的空格分隔目标目录层级。第一节部署插件框架的基础和终端清单，第二节部署命令包及其包内部署清单声明的文件。格式详见[部署文件](../references/deploy-files.md)。

本例未固定包版本，便于首次尝试。建立可重复交付方案时，应把 NuGet 引用和 `nuget:包名@版本` 固定为相互兼容的版本，尤其要核对宿主根目录的 Core 版本。
{% endstep %}

{% step %}
## 发布宿主并部署插件

以下命令仍从 `PluginDemo` 项目目录执行，以 Windows x64 为例：

{% code title="发布到独立 out 目录" %}
```shell
dotnet publish -c Release -f net10.0 -o out
dotnet deploy --destination:./out --framework:net10.0 --edition:Release --platform:win --architecture:x64
```
{% endcode %}

第一条生成启动器及运行依赖，第二条读取当前目录 `.deploy`，把插件部署到 `out`。Linux 目标应改用实际的平台和架构；含原生库的包必须匹配目标运行环境。

{% hint style="warning" %}
🚨 部署会写入目标文件。示例使用独立 `out` 目录；不要将目标改为已有业务运行目录来尝试。当前部署器可能在输出错误后仍返回退出码 0，必须同时检查输出和产物。
{% endhint %}
{% endstep %}

{% step %}
## 检查文件并启动

至少应能找到下面这些文件；此处省略其它宿主依赖和资源目录：

{% code title="PluginDemo/out" %}
```text
out/
	PluginDemo.dll
	PluginDemo.deps.json
	PluginDemo.runtimeconfig.json
	plugins/
		Main.plugin
		Terminal.plugin
		zongsoft/
			commands/
				Zongsoft.Commands.plugin
				Zongsoft.Commands.dll
```
{% endcode %}

进入部署目录启动：

{% code title="启动 PluginDemo" %}
```shell
cd out
dotnet PluginDemo.dll
```
{% endcode %}

在出现的终端提示符中逐条输入：

{% code title="验证插件提供的命令" %}
```text
help
echo hello
plugin.list
exit -yes
```
{% endcode %}

预期能显示帮助、输出 `hello`、列出已加载插件，然后退出。这样既验证了发现插件，也验证了插件贡献的命令能被执行。
{% endstep %}
{% endstepper %}

## 如果没有达到预期

| 现象 | 优先检查 |
| --- | --- |
| 工具无法运行或提示控制台句柄错误 | Windows 使用正常交互终端；自动化终端需要 PTY/ConPTY |
| 找不到插件或配置 | 当前目录是否为 `out`，内容根是否正确 |
| 缺少基础构建器或工作台 | `Main.plugin`、`Terminal.plugin` 是否存在 |
| 命令不存在 | 命令插件清单、程序集和依赖是否完整 |
| 类型加载或方法不存在 | 宿主和插件的 Core、Plugins 及其它共享依赖是否兼容 |

下一步：[编写第一个业务插件](first-business-plugin.md)，在同一宿主中增加一个只依赖 Core 的计算命令。更详细的检查步骤见[运行与调试](run-and-debug.md)。

本教程根据[终端入口](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Hosting/Application.cs)、[基础清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/plugins/Main.plugin)与[命令插件](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Commands)组织。
