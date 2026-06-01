---
description: 了解插件文件、附属文件和插件加载目录。
icon: file-code
---

# 插件文件与加载

插件文件是插件式应用的入口元数据。宿主程序启动后，插件框架会扫描 `plugins/` 目录，读取 `*.plugin` 文件并加载相应程序集。

## 常见插件文件

```text
plugins/
  zongsoft/
    data/
      Zongsoft.Data.plugin
      Zongsoft.Data.dll
      Zongsoft.Data.option
      Zongsoft.Data.mapping
```

## 附属文件

插件目录中常见附属文件包括：

- `*.option`：选项配置。
- `*.mapping`：数据映射。
- `*.pdb`：调试符号。
- `zh-Hans`、`zh-CN`：本地化资源。
- 证书、模板或静态资源。

## 部署来源

插件可以来自本地构建输出，也可以来自 NuGet 包。Zongsoft 的 NuGet 包通常会在包内包含 `.deploy` 文件，用来描述插件内容如何部署到宿主目录。

更多部署规则见 [部署工具 dotnet-deploy](../../tools/deployer.md)。
