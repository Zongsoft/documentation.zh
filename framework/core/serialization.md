---
description: Zongsoft.Serialization 命名空间及其子命名空间的职责。
icon: brackets-curly
---

# Zongsoft.Serialization

`Zongsoft.Serialization` 定义序列化接口、文本序列化接口和 JSON 序列化扩展，用于统一对象到文本或结构化数据的转换。

## 主要职责

* 定义 `ISerializer`、`ITextSerializer` 等序列化抽象。
* 提供 JSON 读写扩展和常用转换器。
* 支持模型、字典、混合对象、时间、字节数组等类型转换。
* 为配置、数据、消息和 Web 输出提供统一序列化基础。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Serialization.Json` | JSON 读写扩展、序列化器和 JSON 辅助类型。 |
| `Zongsoft.Serialization.Json.Converters` | JSON 转换器集合。 |

## 相关资源

* [Serialization 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Serialization)
* [Zongsoft.Core README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/README.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
