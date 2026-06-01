---
description: 准备本地开发、构建、部署和调试 Zongsoft 应用所需环境。
icon: list-check
---

# 准备环境

开始使用 Zongsoft 前，建议先准备 .NET SDK、Git、可选容器环境和常用命令行工具。

## 必需环境

- Git
- .NET SDK 8、9 或 10
- PowerShell 或 Bash
- 一个支持 .NET 的 IDE，例如 Visual Studio、Visual Studio Code 或 JetBrains Rider

{% hint style="info" %}
framework 仓库当前面向 .NET 8、.NET 9、.NET 10 等版本。具体项目可能声明不同目标框架，构建前应以对应 `.csproj` 或 `Directory.Build.props` 为准。
{% endhint %}

## 推荐目录

建议把相关仓库 clone 到同一个根目录下，例如：

```text
D:\Zongsoft
  framework
  hosting
  tools
  documentation.zh
```

这样可以让文档、宿主、工具和源码中的相对引用更容易对应。

## 拉取源码

```bash
git clone https://github.com/Zongsoft/framework.git
git clone https://github.com/Zongsoft/hosting.git
git clone https://github.com/Zongsoft/tools.git
```

framework 仓库包含子模块，clone 后需要更新：

```bash
git submodule update --init --recursive
```

## 可选容器环境

如果需要本地运行 Redis、MySQL、PostgreSQL 或 RustFS，可以使用 hosting 仓库提供的 Podman 容器文件。Windows 环境建议先确认 WSL 2 可用。
