---
description: 使用 Condition 和 Operand 表达过滤条件、字段引用和写入运算。
icon: filter
---

# 条件与操作元

条件用于表达过滤，操作元用于表达字段、常量、函数、聚合和运算。它们共同组成驱动可翻译的数据表达式，最终由数据库驱动转换为对应方言。

## 条件

`Condition` 是最常用的条件类型：

```csharp
var criteria =
	Condition.Equal(nameof(User.Enabled), true) &
	Condition.Like(nameof(User.Name), "%admin%");
```

常见条件包括：

- `Equal` / `NotEqual`
- `GreaterThan` / `GreaterThanEqual`
- `LessThan` / `LessThanEqual`
- `Like`
- `In`
- `Between`

条件可以用 `&` 和 `|` 组合，分别表示逻辑与和逻辑或。

## 字段引用

当条件右侧不是常量，而是另一个字段时，使用字段操作元：

```csharp
var criteria = Condition.Equal(
	"MostRecentThreadAuthorId",
	Operand.Field("MostRecentPostAuthorId")
);
```

这会生成字段与字段的比较，而不是字段与字符串常量的比较。

## 写入运算

操作元也可用于写入字段：

```csharp
accessor.Update<Thread>(
	new
	{
		TotalReplies = Operand.Field("TotalReplies") + 1,
		ModifiedTime = DateTime.UtcNow,
	},
	Condition.Equal("ThreadId", threadId)
);
```

这类表达式适合计数器、金额计算、标志位、聚合回写等场景。

## 操作元类型

常用操作元包括：

- 常量操作元：`Operand.Constant(value)` 或普通常量值。
- 字段操作元：`Operand.Field("Name")`。
- 函数操作元：`Operand.Function("COALESCE", ...)`。
- 聚合操作元：`Operand.Sum("Details.Amount")`。
- 一元操作元：`!`、`~`、`-`。
- 二元操作元：`+`、`-`、`*`、`/`、`%`、`&`、`|`、`^`。

## 聚合回写

```csharp
accessor.Update<Order>(
	new
	{
		Amount = Operand.Sum("Details.Amount")
	},
	Condition.Equal("OrderId", orderId)
);
```

驱动会根据映射关系和数据库方言把聚合表达式翻译为合适的 SQL 或类 SQL 表达式。

{% hint style="warning" %}
条件和操作元表达的是数据层表达式，不是 C# 本地计算。只有驱动支持的函数、运算符和导航路径才能被正确翻译。
{% endhint %}
