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

## 放置位置

映射文件通常随业务插件一起部署：

```text
plugins/
	Zongsoft.Security/
		Zongsoft.Security.plugin
		Zongsoft.Security.dll
		Zongsoft.Security.mapping
```

运行时通过映射加载器发现并加载这些文件。测试代码中也常见手动添加 `MetadataFileLoader` 的方式，用于从指定目录加载映射文件。

## 命名建议

推荐用业务模块名命名映射文件：

```text
Zongsoft.Security.mapping
Zongsoft.Discussions.mapping
Zongsoft.Administratives.mapping
```

这样可以让模块、程序集、插件和映射文件保持一致，便于定位问题，也便于未来拆分部署。

## 映射职责

映射文件应描述稳定的数据结构，而不是表达具体查询：

- 实体名称和命名空间。
- 实体对应的数据表或数据源。
- 属性与字段的映射。
- 主键、序号、只读、可排序等属性特征。
- 继承关系。
- 一对一、一对多、多对多等导航关系。
- 可复用的数据命令。

具体查询要返回哪些字段，应交给 [数据模式](schema.md)；具体过滤条件，应交给 [条件与操作元](conditions-and-operands.md)。

## 维护原则

- 一个业务模块维护自己的 `.mapping` 文件。
- 不把整个系统的映射堆进一个总文件。
- 映射变更应与数据库结构变更同步评审。
- 谨慎修改导航关系，因为查询、级联删除和写入范围都会受到影响。
- 优先手写并使用 XSD 校验，避免工具生成不可读的大文件。
