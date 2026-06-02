---
description: Zongsoft.Configuration 命名空间及其子命名空间的职责。
icon: sliders
---

# Zongsoft.Configuration

`Zongsoft.Configuration` 提供配置识别、配置绑定、连接设置、模型配置、选项配置、INI Profile 和 XML 配置支持，是 Zongsoft 配置体系的核心入口。

## 主要职责

* 提供配置解析、识别、绑定和组合配置提供程序。
* 支持连接配置描述、配置属性标注和配置异常处理。
* 支持模型配置、选项配置、Profile 配置和 XML 配置。
* 为插件化配置和模块化配置合并提供基础抽象。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Configuration.Models` | 模型化配置描述和配置对象映射。 |
| `Zongsoft.Configuration.Options` | 选项树、选项提供程序和选项节点访问。 |
| `Zongsoft.Configuration.Profiles` | 类 INI Profile 配置读写与层级 Section 访问。 |
| `Zongsoft.Configuration.Profiles.Directives` | Profile 指令处理。 |
| `Zongsoft.Configuration.Xml` | XML 配置读写与配置元素模型。 |

## 相关资源

* [Configuration 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Configuration)
* [选项配置文件](../../references/option-files.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
