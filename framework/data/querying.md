---
description: 使用数据访问接口进行查询、导航、分页、排序和聚合。
icon: magnifying-glass-chart
---

# 查询与导航

查询由四个部分组成：实体、条件、数据模式和分页排序。实体决定查什么，条件决定过滤哪些数据，数据模式决定返回什么形状，分页排序决定结果集顺序与窗口。

## 基本查询

{% code title="SelectUsers.cs" %}
```csharp
var users = accessor.Select<User>(
	Condition.Equal(nameof(User.Enabled), true),
	"*, Roles{Name}"
);
```
{% endcode %}

`schema` 中的 `Roles{Name}` 会显式加载角色导航属性。如果不写导航属性，默认只读取用户的简单字段。

## 分页排序

导航集合可以在 `schema` 中限量和排序，冒号后是最多条数，不是页码：

```graphql
*, Members:20(Name, ~CreatedTime){User{Name}}
```

根查询也可以通过查询参数传入分页和排序对象：

{% code title="PagedSelect.cs" %}
```csharp
var page = accessor.Select<User>(
	Condition.Like(nameof(User.Name), "%admin%"),
	"*",
	Paging.Page(1, 20),
	Sorting.Descending(nameof(User.CreatedTime))
);
```
{% endcode %}

具体重载以当前目标框架和包版本中的 `IDataAccess` 为准。

## 导航查询

导航属性来自 `.mapping` 文件中的关系定义。数据引擎根据映射推导连接关系，因此业务代码只需要表达对象图：

```graphql
*, Creator{Name}, Comments:50(CreatedTime){*, Author{Name}}
```

这个模式会返回当前实体、创建者、评论集合以及评论作者。

## 聚合

聚合既可以单独查询，也可以作为写入表达式的一部分：

{% code title="AggregateOrders.cs" %}
```csharp
var total = accessor.Aggregate<Order, decimal>(
	DataAggregateFunction.Sum,
	nameof(Order.Amount),
	Condition.Equal(nameof(Order.CustomerId), customerId)
);
```
{% endcode %}

常见聚合包括计数、求和、平均值、最大值、最小值、中位数、方差和标准差。驱动会决定底层数据库支持哪些聚合和函数。

## 数据命令

当确实需要数据库原生命令、存储过程或复杂脚本时，可以在映射中定义命令，然后使用 `Execute` 或 `ExecuteScalar` 调用：

{% code title="ExecuteCommand.cs" %}
```csharp
var count = accessor.ExecuteScalar(
	"Orders.RebuildStatistics",
	new[] { new Parameter("TenantId", tenantId) }
);
```
{% endcode %}

优先使用声明式查询；只有在无法用映射、条件和模式表达时，再引入数据命令。

## 一次异步读取

以下片段假设 accessor 来自[具名提供者](data-access.md)，User 及其字段已映射，cancellation 来自调用方：

{% code title="ReadUsersAsync.cs" %}
```csharp
var users = accessor.SelectAsync<User>(
	Condition.Equal(nameof(User.Enabled), true),
	"UserId, Name",
	Paging.Page(1, 20),
	new[] { Sorting.Ascending(nameof(User.UserId)) },
	cancellation);

await foreach(var user in users)
	Console.WriteLine(user.Name);
```
{% endcode %}

排序包含稳定唯一键，可减少相同排序值带来的分页漂移；并发写入下仍需按业务要求考虑快照或游标策略。查询准备和后置事件的异常可能在枚举时传播，完整语义见[数据访问接口](data-access.md)。

## 控制对象图成本

只包含当前页面需要的导航及字段，为集合设合理限量。集合导航可能产生从查询，不要把一段 schema 理解为必定一次数据库往返。分页总数也可能有额外计算成本；大批量导出应按实际驱动与结果生命周期分批处理。

对模型未映射的计算成员，引擎不会推导其所需字段。需要完整姓名等计算值时，模式中还应包含参与计算的原始字段。
