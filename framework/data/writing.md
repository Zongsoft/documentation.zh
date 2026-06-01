---
description: 使用 Insert、Update、Upsert、Delete 和 Import 写入数据。
icon: pen-to-square
---

# 写入操作

写入操作包括新增、更新、增改、删除和导入。它们都遵循同一个原则：数据对象提供值，条件确定目标，`schema` 限定成员范围，映射文件决定字段和关系。

## 新增

```csharp
accessor.Insert<User>(
	new User
	{
		UserId = userId,
		Name = name,
		Enabled = true,
	},
	"UserId, Name, Enabled"
);
```

新增时推荐显式指定允许写入的字段，尤其是在外部输入较多或模型包含导航属性时。

## 更新

```csharp
accessor.Update<User>(
	new
	{
		Name = name,
		ModifiedTime = DateTime.UtcNow,
	},
	Condition.Equal(nameof(User.UserId), userId),
	"Name, ModifiedTime"
);
```

更新对象可以是实体，也可以是匿名对象。匿名对象适合只更新少量字段。

## 字段运算更新

```csharp
accessor.Update<Thread>(
	new
	{
		TotalReplies = Operand.Field("TotalReplies") + 1
	},
	Condition.Equal("ThreadId", threadId)
);
```

这种方式避免先读后写导致的并发问题，适合计数器和金额累计。

## 增改

`Upsert` 表示存在则更新，不存在则新增：

```csharp
accessor.Upsert<UserProfile>(
	profile,
	"UserId, DisplayName, Avatar"
);
```

是否能高效执行取决于映射中的键定义和数据库驱动支持。对于关键业务路径，应确认目标驱动的 upsert 行为。

## 删除

```csharp
accessor.Delete<User>(
	Condition.Equal(nameof(User.UserId), userId)
);
```

删除也可以带 `schema`，用于控制导航或级联范围：

```csharp
accessor.Delete<Role>(
	Condition.Equal(nameof(Role.RoleId), roleId),
	"Members"
);
```

删除范围取决于映射关系和数据引擎的级联处理。生产代码应避免对空条件执行删除。

## 批量导入

`Import` 适合把大量同结构数据快速写入目标数据源：

```csharp
accessor.Import<LogEntry>(
	logs,
	"LogId, Level, Message, CreatedTime"
);
```

导入能力由驱动实现。不同数据库在批量写入、事务和返回值支持上可能不同。
