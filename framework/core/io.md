---
description: Zongsoft.IO 命名空间及其子命名空间的职责。
icon: folder
---

# Zongsoft.IO

`Zongsoft.IO` 提供文件系统抽象、路径处理、压缩、硬件信息和二进制读写扩展，用于隔离本地文件系统与外部文件系统的差异。

## 主要职责

* 定义虚拟文件系统、文件信息、目录信息和路径位置。
* 提供文件系统集合、路径工具、模式匹配和二进制读写扩展。
* 提供压缩器抽象和硬件信息描述。
* 为云存储、分布式文件系统等外部实现预留扩展点。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.IO.Compression` | 压缩器接口和压缩实现基础。 |
| `Zongsoft.IO.Hardwares` | 硬件配置、硬件组件和硬件属性描述。 |

## 相关资源

* [IO 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/IO)
