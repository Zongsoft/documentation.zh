---
description: 根据所选教程准备 SDK、工具和源码输出，区分包使用与框架源码开发。
icon: list-check
---

# 准备环境

![准备环境](../.gitbook/assets/zongsoft-start-cover.png)

学习插件使用可以直接从 NuGet 获取框架，不必先构建全部仓库。只有需要调试框架源码、使用本地未发布改动或构建现有 hosting 时，才需要准备相邻源码输出。

## 先选择一条路径

| 目标 | 必需内容 | 起点 |
| --- | --- | --- |
| 创建最小插件应用 | 匹配 SDK、部署工具、可用包源 | [第一个插件](deploy-first-plugin.md) |
| 调试框架与现有宿主 | Git、framework/hosting 源码、匹配编译输出 | [宿主概览](../hosting/hosting.md) |
| 连接数据库或消息系统 | 前面内容及所选外部服务 | 对应驱动与连接专题 |

## 开发规范

开始编写业务插件或 Web 接口前，开发者应阅读并遵守以下规范：

- [C# 编码规范](https://github.com/Zongsoft/Guidelines/blob/main/zongsoft.csharp.guidelines.md)：编写和审查 C# 代码时遵守统一的命名、格式与编码约定。
- [REST API 设计规范](https://github.com/Zongsoft/Guidelines/blob/main/zongsoft.rest-api.guidelines.md)：设计和实现 HTTP 接口时遵守资源命名、HTTP 方法、状态码与参数约定。

规范以链接中的最新内容为准；学习示例时也应结合规范理解，开发与代码审查时按规范核对。

## SDK 版本

当前 hosting 根配置为 .NET 10；本库最小教程也以 `net10.0` 编写。framework 多个类库支持 .NET 8、9、10，但具体项目、示例和工具需以自己的 `.csproj`、`Directory.Build.props` 及包依赖为准。

{% code title="CheckDotnet.ps1" %}
```powershell
dotnet --info
dotnet --list-sdks
dotnet --list-runtimes
```
{% endcode %}

SDK 用于编译，运行时用于执行。安装较新运行时不代表机器已具备所有旧目标所需运行时；Web 和 Windows 桌面工具还各有运行环境要求。

## 源码目录

需要源码路径时，建议把仓库放在同一个父目录：

{% code title="Workspace.layout" %}
```text
Zongsoft/
	framework/
	discussions/
	hosting/
	tools/
	documentation.zh/
```
{% endcode %}

{% code title="CloneRepositories.ps1" %}
```powershell
git clone https://github.com/Zongsoft/framework.git
git clone https://github.com/Zongsoft/hosting.git
git clone https://github.com/Zongsoft/Zongsoft.Discussions.git discussions
git clone https://github.com/Zongsoft/tools.git
git -C framework submodule update --init --recursive
```
{% endcode %}

framework 的 OpenTelemetry 协议来源使用子模块；构建相关诊断项目时需要对应内容。hosting 默认引用 framework 的相邻输出，源码目录存在还不够，必须先编译所需类库的对应配置和目标。

## 工具与可选环境

安装步骤见[安装包](install.md)。编辑器可使用支持 .NET 的 IDE，Shell 命令应按 PowerShell 或 Bash 的各自语法执行，不能混用续行和变量插值。

仅编译 Discussions 不要求运行外部服务；完整论坛查询需要按真实映射与宿主方案准备数据库、身份与相关依赖。MQTT 和模型服务器不是论坛业务的固有前置条件。按需要准备依赖服务，并先检查端点就绪；使用 Podman 时阅读[容器化环境](../hosting/containerization.md)。

准备完成后，应能明确回答：目标框架是什么、包从哪里来、输出目录在哪里、实际启动哪个程序。接着[选择宿主](hosting.md)并完成第一个运行闭环。
