---
description: 使用 IDataAccess 执行查询、写入、聚合、导入和数据命令。
icon: code
---

# 数据访问接口

所有数据操作都通过核心库中的 `Zongsoft.Data.IDataAccess` 接口进入。接口提供同步和异步两套方法，覆盖查询、计数、存在判断、聚合、执行命令、新增、更新、删除、增改和批量导入。

## 获取访问器

当前数据引擎插件通过静态提供者注册具名消费契约，推荐从应用或模块容器取得 `Zongsoft.Services.IServiceProvider<IDataAccess>`：

{% code title="ResolveDataAccess.cs" %}
```csharp
using Zongsoft.Data;
using Zongsoft.Services;

var provider = ApplicationContext.Current.Services
	.ResolveRequired<Zongsoft.Services.IServiceProvider<IDataAccess>>();
var accessor = provider.GetService("Security")
	?? throw new InvalidOperationException("未取得数据访问器。");
```
{% endcode %}

`IDataAccessProvider` 仍是存在的核心接口，但不能假定具体插件已将它注册到容器。上面的契约对应当前 `DataAccessProvider.Instance` 注册；普通消费方也不应逐次释放共享访问器。
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

## 异步查询语义

`SelectAsync` 在返回前完成 `selecting` 回调、`Selecting` 事件和查询前过滤器，然后立即启动异步查询准备。正常 Provider 路径返回一个内部异步结果句柄；第一次枚举会异步等待准备完成，而不会在调用 `SelectAsync` 时同步阻塞线程。

查询准备成功后，系统依次执行查询后过滤器、`Selected` 事件和 `selected` 回调，再开始枚举 Provider 提供的结果。准备阶段或这些后置处理抛出的异常会在枚举结果时传播；调用返回前发生的预取消、查询前过滤器异常或短路处理异常则直接由 `SelectAsync` 抛出。

传给 `SelectAsync` 的取消标记同时作用于查询准备和后续枚举。通过 `WithCancellation` 或 `GetAsyncEnumerator` 传入的枚举器取消标记只取消该次等待和枚举，不会取消同一结果句柄所共享的查询准备。顺序重复枚举会复用同一次准备结果，不会重复调用 Provider。

正常 Provider 路径返回的句柄同时实现 `IPageable`，因此可以在枚举前订阅 `Paginated`：

{% code title="PaginatedQuery.cs" %}
```csharp
var paging = Paging.Page(1, 20);
var users = accessor.SelectAsync<User>(null, paging);

if(users is IPageable pageable)
	pageable.Paginated += (_, args) => Console.WriteLine(args.Paging.Total);

await foreach(var user in users)
	Console.WriteLine(user.Name);
```
{% endcode %}

结果尚未准备完成时，`IPageable.Suppressed` 根据本次请求的 `Paging` 判断；准备完成后优先采用 Provider 结果的分页状态。如果 Provider 结果不支持分页，则该值为 `true`。分页事件的 sender 是调用方实际持有的结果句柄，可用于正确退订事件。

为了保留真正的异步准备能力，正常路径返回的句柄与 Provider 写入查询上下文的结果对象不保证引用相同。只有 `selecting` 回调或 `Selecting` 事件短路查询时，事件提供的结果对象才会原样返回。

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

## 从准备完成到读取完成

查询后过滤器和 Selected 表示查询准备已完成，不表示所有行已经枚举完毕。处理逐行结果时，应把异常和取消处理包围实际的 `await foreach`，而不只包围取得结果的那一行。

顺序重复枚举复用准备结果，不等于提供者结果必然可重放，更不承诺并发枚举安全。需要重复遍历时，应按数据量主动物化；需要重查数据库时，重新调用 SelectAsync。源码与回归依据见[异步实现](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/DataAccessBase.Select.cs)及[异步查询用例](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Data/DataAccessBaseSelectTest.cs)。

完整装配示例见[首次查询](quickstart.md)，业务层规则见[数据服务](services.md)。
