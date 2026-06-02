---
description: 使用 IDataAccess 执行查询、写入、聚合、导入和数据命令。
icon: code
---

# 数据访问接口

所有数据操作都通过核心库中的 `Zongsoft.Data.IDataAccess` 接口进入。接口提供同步和异步两套方法，覆盖查询、计数、存在判断、聚合、执行命令、新增、更新、删除、增改和批量导入。

## 获取访问器

访问器通常通过 `IDataAccessProvider` 获取：

{% code title="UserService.cs" %}
```csharp
public class UserService(IDataAccessProvider provider)
{
	private readonly IDataAccess _data = provider.GetAccessor("Security");
}
```
{% endcode %}

访问器名称与连接配置名称匹配。如果不传名称，或者指定名称不存在且配置了默认连接，则会使用默认连接。

## 操作类别

`IDataAccess` 的常用方法包括：

- `Select` / `SelectAsync`：查询对象集合。
- `Count` / `Exists`：计数和存在判断。
- `Aggregate`：聚合计算，如 `Sum`、`Average`、`Maximum`。
- `Insert` / `InsertMany`：新增单条或多条数据。
- `Update` / `UpdateMany`：更新单条或多条数据。
- `Upsert` / `UpsertMany`：按键新增或更新。
- `Delete`：删除并可按 `schema` 控制级联范围。
- `Import`：批量导入数据。
- `Execute` / `ExecuteScalar`：执行映射中定义的数据命令。

这些方法通常都有泛型实体重载和实体名字符串重载。泛型重载适合强类型业务代码；字符串重载适合动态模型、工具和跨模块场景。

## 事件与过滤器

访问器暴露了完整的数据操作事件，例如 `Selecting`、`Selected`、`Inserting`、`Inserted`、`Updating`、`Updated`、`Deleting`、`Deleted` 和 `Error`。这些事件可用于审计、诊断、租户条件追加或统一异常处理。

访问器还包含过滤器集合。过滤器适合封装横切逻辑，例如：

- 自动附加租户条件。
- 审计创建人、创建时间、修改人、修改时间。
- 统一处理软删除。
- 拦截敏感字段写入。

## Schema 参数

许多方法都有 `schema` 参数。它用于控制字段范围和导航范围：

{% code title="SelectUsers.cs" %}
```csharp
var users = accessor.Select<User>(
	Condition.Equal(nameof(User.Enabled), true),
	"*, Roles{Name}"
);
```
{% endcode %}

不传 `schema` 时，查询默认只返回简单属性。需要导航属性时必须显式指定。

## Options 参数

每类操作都有对应的 Options 类型，例如 `DataSelectOptions`、`DataInsertOptions`、`DataUpdateOptions`、`DataDeleteOptions`。这些选项用于控制返回值、数据源选择、执行策略或特定操作行为。

业务代码优先使用简洁重载；当需要细粒度行为时再使用 Options。
