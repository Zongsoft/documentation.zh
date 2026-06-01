---
description: 使用数据访问接口进行查询、导航、分页、排序和聚合。
icon: magnifying-glass-chart
---

# 查询与导航

查询由四个部分组成：实体、条件、数据模式和分页排序。实体决定查什么，条件决定过滤哪些数据，数据模式决定返回什么形状，分页排序决定结果集顺序与窗口。

## 基本查询

```csharp
var users = accessor.Select<User>(
	Condition.Equal(nameof(User.Enabled), true),
	"*, Roles{Name}"
);
```

`schema` 中的 `Roles{Name}` 会显式加载角色导航属性。如果不写导航属性，默认只读取用户的简单字段。

## 分页排序

导航集合可以在 `schema` 中分页排序：

```graphql
*, Members:1/20(Name, ~CreatedTime){User{Name}}
```

根查询也可以通过查询参数传入分页和排序对象：

```csharp
var page = accessor.Select<User>(
	Condition.Like(nameof(User.Name), "%admin%"),
	"*",
	Paging.Page(1, 20),
	Sorting.Descending(nameof(User.CreatedTime))
);
```

具体重载以当前目标框架和包版本中的 `IDataAccess` 为准。

## 导航查询

导航属性来自 `.mapping` 文件中的关系定义。数据引擎根据映射推导连接关系，因此业务代码只需要表达对象图：

```graphql
*, Creator{Name}, Comments:1/50(CreatedTime){*, Author{Name}}
```

这个模式会返回当前实体、创建者、评论集合以及评论作者。

## 聚合

聚合既可以单独查询，也可以作为写入表达式的一部分：

```csharp
var total = accessor.Aggregate<Order, decimal>(
	DataAggregateFunction.Sum,
	nameof(Order.Amount),
	Condition.Equal(nameof(Order.CustomerId), customerId)
);
```

常见聚合包括计数、求和、平均值、最大值、最小值、中位数、方差和标准差。驱动会决定底层数据库支持哪些聚合和函数。

## 数据命令

当确实需要数据库原生命令、存储过程或复杂脚本时，可以在映射中定义命令，然后使用 `Execute` 或 `ExecuteScalar` 调用：

```csharp
var count = accessor.ExecuteScalar(
	"RebuildStatistics",
	new[] { new Parameter("TenantId", tenantId) }
);
```

优先使用声明式查询；只有在无法用映射、条件和模式表达时，再引入数据命令。
