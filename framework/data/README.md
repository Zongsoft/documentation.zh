---
description: Zongsoft.Data 数据引擎的设计目标、能力和阅读入口。
icon: database
---

# 数据引擎

`Zongsoft.Data` 是一个类 GraphQL 风格的 ORM 数据访问框架。它通过数据模式、映射文件、条件表达式和数据库驱动描述数据访问结构，目标是在不手写 SQL 的情况下完成复杂查询、导航、过滤、分页、分组、聚合和写入操作。

它不是把 SQL 换成另一种字符串 SQL，而是把数据访问拆成四个稳定层次：

* 模型层：业务代码使用 POCO 类型或匿名对象。
* 元数据层：`.mapping` 文件描述实体、字段、继承和导航关系。
* 访问层：`IDataAccess` 暴露统一的查询、写入、聚合、导入和执行接口。
* 驱动层：各数据库驱动把统一表达式转换为对应数据库语法并执行。

## 特性

* 支持严格 POCO 对象。
* 支持读写分离。
* 支持表继承相关操作。
* 支持按业务模块隔离映射文件。
* 使用数据模式描述查询和写入形状。
* 提供多数据库驱动。

## 核心概念

* [数据模式](schema.md)：描述查询或写入的数据形状。
* [映射文件](mapping.md)：描述实体、表、字段和关系。
* [连接配置](connections.md)：配置数据源、读写分离和驱动。
* [数据访问接口](data-access.md)：执行查询、写入、聚合和命令。
* [条件与操作元](conditions-and-operands.md)：表达过滤条件和字段运算。
* [查询与导航](querying.md)：使用 `schema`、分页和排序读取对象图。
* [写入操作](writing.md)：新增、更新、删除和增改。
* [驱动](drivers.md)：选择、部署和扩展数据库驱动。

## 驱动

常见驱动包括 SQL Server、MySQL、SQLite、DuckDB、PostgreSQL、TDengine、ClickHouse 和 InfluxDB。驱动通常以独立插件方式部署，并把数据驱动与连接设置驱动挂载到插件树。

完整包名见 [包与模块索引](../../references/packages.md)，部署方式见 [插件文件与加载](../plugins/plugin-file.md)。

## 典型调用

```csharp
var accessor = dataAccessProvider.GetAccessor("Security");

var users = accessor.Select<User>(
	Condition.Equal(nameof(User.Enabled), true),
	"*, Roles{Name}",
	Sorting.Descending(nameof(User.CreatedTime))
);
```

在这个调用中：

* `Security` 是数据访问名称，通常与业务模块或连接配置名称对应。
* `Condition` 描述过滤条件。
* `schema` 字符串描述返回字段和导航属性。
* 排序由 `Sorting` 表达，最终由驱动转换为数据库方言；需要分页时可使用带 `Paging` 参数的重载。
