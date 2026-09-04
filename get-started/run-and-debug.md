---
description: 运行宿主程序并验证插件是否成功加载。
icon: bug
---

# 运行与调试

部署插件后，可以启动宿主程序验证插件是否成功加载。不同宿主适合不同调试方式。

## 终端调试

终端宿主适合开发阶段观察命令、服务和事件行为。它支持控制台交互，适合快速复现插件加载和业务调用问题。

```bash
dotnet run --project hosting/terminal/Zongsoft.Hosting.Terminal.csproj
```

## Web 调试

Web 宿主适合验证 HTTP API。启动后可以访问应用信息接口：

```text
GET /Application
GET /Modules
GET /Events
```

hosting 仓库的 `web/.http` 目录用于存放 HttpYac 请求定义。使用前请在 VS Code 的 `settings.json` 中配置 `httpyac.environmentVariables`，并选择对应的运行环境。

## 常见检查点

- `plugins/` 目录是否存在目标插件。
- `*.plugin` 文件路径是否正确。
- 相关 `*.dll` 是否已部署。
- 环境相关的 `*.option` 文件是否被复制到目标位置。
- 数据插件是否包含必要的 `*.mapping` 文件。
- 宿主启动参数中的 `host`、`site`、`environment` 是否符合预期。

## 下一步

如果你要理解插件如何构建和加载，继续阅读 [插件框架](../framework/plugins/README.md)。如果你要接入数据库，继续阅读 [数据引擎](../framework/data/README.md)。
