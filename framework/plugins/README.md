---
description: Zongsoft.Plugins 插件框架的职责和核心概念。
icon: puzzle-piece
---

# 插件框架

`Zongsoft.Plugins` 是 Zongsoft 插件化应用的核心库。它把应用拆成可独立部署、可声明依赖、可挂载能力的插件模块，让终端程序、后台服务、Web 应用和富客户端共享一套扩展模型。

## 核心概念

- 插件文件：使用 `*.plugin` 描述程序集、依赖、构件、解析器和扩展点。
- 插件目录：宿主启动时默认扫描应用目录下的 `plugins/` 目录。
- 插件树：所有扩展点会被组织为一棵路径树，例如 `/Workbench/Data/Drivers`。
- 构件：插件树上的可构建对象，由 `object`、`lazy`、`expose` 等构建器创建或暴露。
- 应用上下文：运行时中表示应用、环境、模块、服务、事件和工作器的上下文。
- 应用模块：插件加载后形成的业务或基础设施模块，可以拥有自己的服务域和事件注册表。

## 与宿主程序的关系

宿主程序不是业务模块。它负责建立 .NET Host、配置源和服务容器；插件框架负责加载 `plugins/` 目录中的插件文件，再由插件向应用注册业务能力。

```mermaid
flowchart LR
	A["宿主程序"] --> B["插件框架"]
	B --> C["plugins 目录"]
	C --> D["*.plugin"]
	D --> E["插件树"]
	E --> F["模块 / 服务 / 命令 / 事件 / API"]
```

## 加载结果

插件加载完成后，运行时会形成三层结果：

- 插件集合：记录已加载的主插件、从插件和子插件。
- 插件树：把扩展点、构件和自定义对象挂载到统一路径。
- 服务容器：宿主程序集和插件程序集中的服务会被注册到应用服务容器。

默认的基础插件会挂载 `/Workbench`、`/Workbench/Configuration/ConnectionSettings`、`/Workbench/Diagnostics` 等节点；数据、Web、安全等插件会继续向这些节点添加驱动、过滤器、命令、事件处理器或服务。

## 继续阅读

- [插件应用模型](application-model.md)
- [插件文件与加载](plugin-file.md)
- [宿主集成](hosting.md)
- [构件与服务](builtins-and-services.md)
- [宿主程序](../../hosting/README.md)
