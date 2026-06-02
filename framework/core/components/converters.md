---
description: Zongsoft.Components.Converters 常用类型转换器。
icon: repeat
---

# Converters

`Zongsoft.Components.Converters` 提供组件层常用类型转换器，主要服务于配置绑定、插件构件属性解析、命令选项绑定和序列化协作。

## 转换器列表

| 转换器 | 说明 |
| --- | --- |
| `ArchitectureConverter` | 在文本和处理器架构枚举之间转换。 |
| `BooleanConverter` | 布尔值转换，适合兼容多种文本表示。 |
| `CollectionConverter` | 集合转换器，用于把文本或对象转换为目标集合。 |
| `EncodingConverter` | 字符编码转换器，例如从 `utf-8` 转为 `Encoding.UTF8`。 |
| `EndpointConverter` | 网络端点转换器。 |
| `EnumConverter` | 枚举转换器。 |
| `GuidConverter` | GUID 转换器。 |
| `TimeSpanConverter` | 时间间隔转换器，支持命令选项和配置中的时间表达。 |

## 使用位置

* 插件文件中的构件属性。
* 选项配置文件中的复杂值。
* 命令行选项绑定，例如 `--timeout:5s`。
* JSON、类型描述器或配置绑定需要文本与对象互转的地方。

{% code title="命令选项中的 TimeSpan" %}
```csharp
[CommandOption("timeout", 't', typeof(TimeSpan), "1s")]
public sealed class ShellCommand : CommandBase<CommandContext>
{
}
```
{% endcode %}

转换器的目标是让外部文本配置更接近人类书写习惯，同时保持运行时类型清晰。

## 参考实现

* [Converters 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components/Converters)
