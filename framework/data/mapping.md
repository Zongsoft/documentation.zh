---
description: 使用 .mapping 文件描述实体、表、字段和导航关系。
icon: table
---

# 映射文件

映射文件是扩展名为 `.mapping` 的 XML 文件，用来描述实体结构与数据库结构之间的关系。

## 为什么需要映射文件

Zongsoft.Data 不要求实体类依赖注解或 Attribute。实体、表、字段、导航和继承关系由映射文件显式描述。

这样做的好处是：

- POCO 类型保持干净。
- 数据结构由模块负责人集中维护。
- 不同业务模块可以独立维护自己的映射文件。
- 映射文件可以随插件一起部署。

## 模块隔离

不要把整个应用的映射都写入一个大文件。推荐每个业务模块拥有自己的映射文件，例如：

```text
Zongsoft.Security.mapping
Zongsoft.Discussions.mapping
```

## XML Schema

framework 仓库提供 `Zongsoft.Data.xsd`，可用于编辑 `.mapping` 文件时获得 XML 智能提示。

源码位置：

```text
framework/Zongsoft.Data/Zongsoft.Data.xsd
```
