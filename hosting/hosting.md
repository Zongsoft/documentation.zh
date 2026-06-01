---
description: Zongsoft 宿主程序的职责、类型和目录结构。
icon: server
---

# 宿主概览

宿主程序负责初始化运行时环境，并承载插件式应用。它本身不应该包含业务代码，业务能力应由部署到 `plugins/` 目录的插件提供。

## 宿主类型

- 终端宿主：用于命令行交互和调试。
- 后台服务宿主：用于 Windows Service 或 systemd。
- Web 宿主：用于 ASP.NET Web API 和站点应用。

## 代码位置

```text
hosting/
  terminal/
  daemon/
  web/
```

## 核心原则

修改宿主项目时，优先关注：

- `Program.cs`
- `*.csproj`
- `appsettings.json`
- `.deploy`
- 部署脚本
- 打包脚本
- 容器文件

不要把业务逻辑加入宿主项目。需要业务行为时，应查找插件、配置、外部业务代码或 framework 代码。
