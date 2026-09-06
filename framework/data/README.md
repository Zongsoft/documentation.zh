---
description: Zongsoft.Data 数据引擎的设计目标、能力和阅读入口。
icon: database
---

# 数据引擎

![数据引擎](../../.gitbook/assets/zongsoft-data-cover.png)

[`Zongsoft.Data`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data) 是一个类 GraphQL 风格的 ORM 数据访问框架。它通过数据模式、映射文件、条件表达式和数据库驱动描述数据访问结构，目标是在不手写 SQL 的情况下完成复杂查询、导航、过滤、分页、分组、聚合和写入操作。

它不是把 SQL 换成另一种字符串 SQL，而是把数据访问拆成四个稳定层次：

* 模型层：业务代码使用 POCO 类型或匿名对象。
* 元数据层：`.mapping` 文件描述实体、字段、继承和导航关系。
* 访问层：`IDataAccess` 暴露统一的查询、写入、聚合、导入和执行接口。
* 驱动层：各数据库驱动把统一表达式转换为对应数据库语法并执行。

先理解[对象关系与数据访问](concepts.md)，再按[首次查询](quickstart.md)按 Discussions 的建表、连接和论坛查询用例验证。业务规则组织见[数据服务](services.md)。

## 特性

* 支持严格 POCO 对象。
* 支持读写分离。
* 支持表继承相关操作。
* 支持按业务模块隔离映射文件。
* 使用数据模式描述查询和写入形状。
* 提供多数据库驱动。

## 核心概念

<table data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th></th>
			<th data-hidden data-card-target data-type="content-ref">页面</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>数据模式</strong></td>
			<td>描述查询或写入的数据形状。</td>
			<td><a href="schema.md">schema.md</a></td>
		</tr>
		<tr>
			<td><strong>映射文件</strong></td>
			<td>描述实体、表、字段和关系。</td>
			<td><a href="mapping.md">mapping.md</a></td>
		</tr>
		<tr>
			<td><strong>连接配置</strong></td>
			<td>配置数据源、读写分离和驱动。</td>
			<td><a href="connections.md">connections.md</a></td>
		</tr>
		<tr>
			<td><strong>数据访问接口</strong></td>
			<td>执行查询、写入、聚合和命令。</td>
			<td><a href="data-access.md">data-access.md</a></td>
		</tr>
		<tr>
			<td><strong>条件与操作元</strong></td>
			<td>表达过滤条件和字段运算。</td>
			<td><a href="conditions-and-operands.md">conditions-and-operands.md</a></td>
		</tr>
		<tr>
			<td><strong>查询与导航</strong></td>
			<td>使用 `schema`、分页和排序读取对象图。</td>
			<td><a href="querying.md">querying.md</a></td>
		</tr>
		<tr>
			<td><strong>写入操作</strong></td>
			<td>新增、更新、删除和增改。</td>
			<td><a href="writing.md">writing.md</a></td>
		</tr>
		<tr>
			<td><strong>驱动</strong></td>
			<td>选择、部署和扩展数据库驱动。</td>
			<td><a href="drivers.md">drivers.md</a></td>
		</tr>
	</tbody>
</table>

## 选择入口

{% tabs %}
{% tab title="我要查询数据" %}
先看 [数据模式](schema.md) 和 [查询与导航](querying.md)。这两页解释如何表达字段、导航属性、分页和排序。
{% endtab %}

{% tab title="我要写入数据" %}
先看 [写入操作](writing.md) 和 [条件与操作元](conditions-and-operands.md)。这两页解释新增、更新、删除、增改和字段运算。
{% endtab %}

{% tab title="我要接数据库" %}
先看 [连接配置](connections.md) 和 [驱动](drivers.md)。这两页解释连接名、读写分离、驱动插件和部署检查。
{% endtab %}
{% endtabs %}

## 按驱动阅读

常见驱动包括 SQL Server、MySQL、SQLite、DuckDB、PostgreSQL、TDengine、ClickHouse 和 InfluxDB。驱动通常以独立插件方式部署，并把数据驱动与连接设置驱动挂载到插件树。

已选定数据库时，可以直接进入 [MySQL](drivers/mysql.md)、[SQL Server](drivers/mssql.md)、[PostgreSQL](drivers/postgres.md)、[SQLite](drivers/sqlite.md)、[DuckDB](drivers/duckdb.md)、[ClickHouse](drivers/clickhouse.md)、[TDengine](drivers/tdengine.md) 或 [InfluxDB](drivers/influx.md) 项目页。

完整包名见 [包与模块索引](../../references/packages.md)，部署方式见 [插件文件与加载](../plugins/plugin-file.md)。

{% content-ref url="drivers.md" %}
[drivers.md](drivers.md)
{% endcontent-ref %}

## 典型调用

来源：[src/Module.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Module.cs#L52)（节选；上下文见源文件）。

{% code title="Module.cs" %}
```csharp
public IDataAccess Accessor => _accessor ??= this.Services.ResolveRequired<IDataAccessProvider>().GetAccessor(this.Name);
```
{% endcode %}

在这个调用中：

* `this.Services.ResolveRequired<IDataAccessProvider>()` 从模块服务中解析数据访问提供者。
* `GetAccessor(this.Name)` 按当前模块名称获取访问器；所示源码属于 Discussions 模块。
* `??=` 缓存访问器，供后续调用复用。

查询条件、返回字段、导航、排序和分页的用法，见[数据访问接口](data-access.md)和[查询与导航](querying.md)。

## 下一步

{% content-ref url="schema.md" %}
[schema.md](schema.md)
{% endcontent-ref %}

{% content-ref url="data-access.md" %}
[data-access.md](data-access.md)
{% endcontent-ref %}

{% content-ref url="writing.md" %}
[writing.md](writing.md)
{% endcontent-ref %}

## 相关资源

* [Zongsoft.Data 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data)
* [Zongsoft.Data 中文 README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/README.zh-Hans.md)
* [Zongsoft.Data 英文 README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/README.md)
* [Zongsoft.Data NuGet 包](https://www.nuget.org/packages/Zongsoft.Data)
