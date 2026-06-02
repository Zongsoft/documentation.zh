---
description: Zongsoft.Components 命名空间及其子命名空间的职责。
icon: cubes
---

# Zongsoft.Components

`Zongsoft.Components` 是核心类库中的组件模型命名空间，覆盖命令、特性、转换器、可监管对象、工作者、标识和事件交换等基础构件。

## 主要职责

* 定义组件标识、别名、权重、版本、命名对象和服务描述。
* 提供命令模型、命令节点、命令表达式、命令出口和参数绑定。
* 提供可监管对象、工作者、断路器、尝试器等运行时组件模式。
* 提供常用转换器和组件特性扩展。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Components.Commands` | 命令节点、命令执行、命令参数、命令别名和命令出口。 |
| `Zongsoft.Components.Converters` | 布尔、枚举、版本、架构等常用转换器。 |
| `Zongsoft.Components.Features` | 断路器等组件特性模型。 |

## 相关资源

* [Components 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
* [Zongsoft.Core README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/README.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
