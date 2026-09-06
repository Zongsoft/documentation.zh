---
description: 在 .NET Host 中启动插件式应用并加载插件目录。
icon: power-off
---

# 宿主集成

宿主集成的目标是把标准 .NET Host 与 Zongsoft 插件框架连接起来。宿主仍然使用 [`IHost`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.hosting.ihost) _[源码](https://source.dot.net/#Microsoft.Extensions.Hosting.Abstractions/IHost.cs)_、配置、依赖注入和生命周期事件；插件框架负责在 Host 构建过程中加载插件树、注册插件程序集服务，并创建应用上下文。

## 启动入口

Discussions 的业务代码放在插件中，进程由 hosting 项目承载。下面是现有守护宿主的实际入口，平台分支由项目编译符号选择。

插件框架提供 `Application.Daemon(...)` 和 `Application.Terminal(...)` 两组入口：

来源：[hosting/daemon/Program.cs](https://github.com/Zongsoft/hosting/blob/main/daemon/Program.cs#L9)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
static void Main(string[] args)
{
	#if WINDOWS
	Zongsoft.Plugins.Hosting.Application
		.Daemon("zongsoft.daemon", [.. args, "host=daemon", "site=daemon"], builder =>
		{
			builder.Services.AddWindowsService(options => options.ServiceName = builder.Environment.ApplicationName);
		}).Run();
	#elif LINUX
	Zongsoft.Plugins.Hosting.Application
		.Daemon("zongsoft.daemon", [.. args, "host=daemon", "site=daemon"], builder =>
		{
			builder.Services.AddSystemd();
		}).Run();
	#else
	Zongsoft.Plugins.Hosting.Application
		.Daemon("zongsoft.daemon", [.. args, "host=daemon", "site=daemon"])
		.Run();
	#endif
}
```
{% endcode %}

`Daemon` 适合后台服务和常驻进程，`Terminal` 适合终端程序。两者都会加载宿主配置文件，再构建和初始化 Host。

## 配置加载顺序

宿主启动时会按应用名加载 `.option` 文件：

- `{ApplicationName}.option`
- `{ApplicationName}.{Environment}.option`
- `{ApplicationName}.{Host}.option`
- `{ApplicationName}.{Host}.{Environment}.option`
- `{ApplicationName}.{Site}.option`
- `{ApplicationName}.{Site}.{Environment}.option`

其中 `Environment` 来自 Host 环境名，`host` 和 `site` 来自配置节。应用名可由 Host 设置、`appsettings.json` 或入口程序集名确定。

{% hint style="info" %}
`.option` 是 Zongsoft 配置体系使用的 XML 配置文件。插件目录中的插件配置也会作为配置源加入应用配置。
{% endhint %}

## 插件加载过程

构建 Host 时，框架会执行以下动作：

1. 创建 `PluginOptions`，确定内容根、环境名和插件目录，并将插件配置源加入应用配置。
2. 通过 `PluginTree.Get(options).Load()` 加载插件树。
3. 注册宿主程序集、宿主引用程序集和插件清单程序集中的服务类型。
4. 添加默认 `System.Net.Http.HttpClient` 服务。
5. 注册 `/Workspace/Environment/Services` 下的声明式服务。
6. 构建 Host 并调用 `Initialize()` 初始化应用上下文。

如果 `plugins` 目录不存在，插件加载会失败并抛出目录不存在异常。部署宿主时应确保插件目录与宿主应用目录匹配。

{% content-ref url="plugin-file.md" %}
[plugin-file.md](plugin-file.md)
{% endcontent-ref %}

## 服务注册

插件程序集服务注册来自两个来源：

- 程序集扫描：宿主程序集、宿主引用程序集和插件 `manifest` 中声明的程序集。
- 插件树服务节点：`/Workspace/Environment/Services` 下的构件会作为单例注册到服务集合。

这意味着普通服务可以用代码特性和约定注册；需要声明式配置的服务可以放进插件树。

## 初始化与生命周期

Host 构建完成后会初始化 `ApplicationContext`。应用上下文会解析所有 [`IApplicationInitializer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IApplicationInitializer.cs) 并执行初始化；当 Host 生命周期进入 Started、Stopping、Stopped 时，应用上下文会启动或停止已注册的[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)，并触发对应事件。

插件式应用的推荐边界是：

- 宿主负责进程、环境和少量基础配置。
- 插件负责模块、服务、命令、驱动、控制器和业务能力。
- 应用上下文负责在运行时统一暴露模块、服务、事件和生命周期。

<details>

<summary>什么时候应该改宿主，什么时候应该写插件？</summary>

如果改动影响进程启动、站点选择、Host 环境、服务托管方式或部署入口，通常属于宿主职责。如果改动是业务能力、数据库驱动、命令、Web API、后台[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)或模块内部服务，优先放入插件。

</details>

{% content-ref url="../../get-started/deploy-first-plugin.md" %}
[deploy-first-plugin.md](../../get-started/deploy-first-plugin.md)
{% endcontent-ref %}

## 内容根与配置匹配

默认插件目录由内容根与 `plugins` 组合。启动 DLL 的绝对路径不会自动更改工作目录，因此应从已部署目录启动，并确认其中包含基础清单。宿主配置与插件配置使用不同的后缀匹配规则，详见[选项配置文件](../../references/option-files.md)。

程序集引用扫描只处理当时已加载的入口引用，再处理入口程序集及已加载插件清单声明的程序集。不要以为放进目录的每个 DLL 都会自动参与服务扫描。

Web 应用使用配套的 `Zongsoft.Web.Application.Web(...)` 入口，并额外完成控制器、[初始化器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IApplicationInitializer.cs)和中间件装配，见[Web 基础](../web.md)。
