---
description: 理解插件式应用中的宿主、应用上下文、模块和服务。
icon: sitemap
---

# 插件应用模型

插件式应用由宿主程序、插件框架、插件树、应用上下文和应用模块组成。宿主负责“进程如何启动”，插件负责“能力如何进入应用”。

## 宿主程序

宿主程序负责启动进程并建立运行环境。它通常只包含 `Program.cs`、项目文件、部署脚本和基础配置。业务能力应尽量放入插件，而不是固化在宿主中。

框架提供两类常用启动入口：

- `Application.Daemon(...)`：用于后台服务、Worker 和常驻进程。
- `Application.Terminal(...)`：用于命令行、终端工具和交互式程序。

这些入口会创建 .NET Host，加载宿主 `.option` 配置，注册插件配置源，加载插件树并初始化应用上下文。

## 应用上下文

应用上下文表示当前运行中的应用实例，对应核心库中的 `IApplicationContext`。它包含应用名称、版本、环境、配置、模块集合、服务提供器、事件管理器、工作器和运行时属性。

Web 宿主中的 `/Application` 接口会返回当前应用上下文的基本信息。

## 模块

模块对应核心库中的 `IApplicationModule`。模块有名称、版本、程序集、服务容器和属性集合；继承 `ApplicationModule<TEvents>` 的模块还可以拥有自己的事件注册表。

模块名称很重要：数据访问、服务注册、日志命名和模块隔离都会使用模块名作为边界。例如数据服务默认会根据类型所在程序集的 `ApplicationModuleAttribute` 查找模块名，再获得对应的数据访问器。

Web 宿主中的 `/Modules` 接口可用于查看当前加载的模块信息。

## 服务

插件可以向应用注册服务。宿主启动时会扫描宿主程序集和插件清单中的程序集，把符合服务注册约定的类型加入服务容器；插件树中的 `/Workspace/Environment/Services` 节点也可以把声明式构件注册为单例服务。

模块也可以拥有自己的服务域。`ApplicationModule` 会基于应用服务容器创建模块级服务提供器，用于隔离或命名模块内部服务。

## 工作台与启动节点

默认插件会把常用运行时对象挂载到 `/Workbench` 下，例如：

- `/Workbench/Modules`：当前应用模块集合。
- `/Workbench/Services`：当前应用服务容器。
- `/Workbench/Events`：全局事件管理器。
- `/Workbench/Configuration/ConnectionSettings/Drivers`：连接设置驱动集合。
- `/Workbench/Startup`：启动时需要加载或运行的工作器集合。

这使插件之间可以通过稳定路径发现能力，而不是直接引用彼此的实现类型。
