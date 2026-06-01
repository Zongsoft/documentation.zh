---
description: 使用 dotnet-deploy 将插件和附属文件部署到宿主程序。
icon: box-open
---

# 部署第一个插件

Zongsoft 插件式应用通过部署把插件放入宿主目录。部署通常由 `dotnet-deploy` 工具和 `.deploy` 文件完成。

## 部署流程

```mermaid
flowchart LR
    A["选择宿主"] --> B["读取 .deploy 文件"]
    B --> C["解析本地文件与 NuGet 包"]
    C --> D["复制插件和附属文件"]
    D --> E["启动宿主并加载插件"]
```

## 安装部署工具

```bash
dotnet tool install -g Zongsoft.Tools.Deployer
```

如果已经安装：

```bash
dotnet tool update -g Zongsoft.Tools.Deployer
```

## 执行部署

进入宿主目录后运行部署命令：

```bash
dotnet deploy --edition:Debug --framework:net10.0 --platform:win --architecture:x64
```

如果宿主目录没有默认 `.deploy` 文件，需要指定部署文件：

```bash
dotnet deploy --edition:Debug --framework:net10.0 --platform:win --architecture:x64 web.deploy
```

## 部署结果

部署完成后，宿主目录下通常会出现或更新 `plugins/` 目录。每个插件会按模块路径存放插件文件、程序集、选项配置和映射文件。

{% hint style="warning" %}
部署脚本可能复制文件、下载 NuGet 包或触发后续打包流程。自动化环境中建议先阅读脚本内容，确认参数和影响范围。
{% endhint %}
