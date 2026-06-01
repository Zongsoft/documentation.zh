---
description: Zongsoft.Data 数据引擎的设计目标、能力和阅读入口。
icon: database
---

# 数据引擎

`Zongsoft.Data` 是一个类 GraphQL 风格的 ORM 数据访问框架。它通过数据模式和映射文件描述数据访问结构，目标是在不手写 SQL 的情况下完成复杂查询、导航、过滤、分页、分组、聚合和写入操作。

## 特性

- 支持严格 POCO 对象。
- 支持读写分离。
- 支持表继承相关操作。
- 支持按业务模块隔离映射文件。
- 使用数据模式描述查询和写入形状。
- 提供多数据库驱动。

## 核心概念

- [数据模式](schema.md)：描述查询或写入的数据形状。
- [映射文件](mapping.md)：描述实体、表、字段和关系。
- [连接配置](connections.md)：配置数据源、读写分离和驱动。

## 驱动

常见驱动包括：

- SQL Server
- MySQL / MariaDB
- SQLite
- DuckDB
- PostgreSQL
- InfluxDB
- TDengine
- ClickHouse

完整包名见 [包与模块索引](../../reference/packages.md)。
