---
description: 使用 Insert、Update、Upsert、Delete 和 Import 写入数据。
icon: pen-to-square
---

# 写入操作

写入操作包括新增、更新、增改、删除和导入。它们都遵循同一个原则：数据对象提供值，条件确定目标，`schema` 限定成员范围，映射文件决定字段和关系。

## 新增

{% code title="InsertUser.cs" %}
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
{% endcode %}

新增时推荐显式指定允许写入的字段，尤其是在外部输入较多或模型包含导航属性时。

## 更新

{% code title="UpdateUser.cs" %}
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
{% endcode %}

更新对象可以是实体，也可以是匿名对象。匿名对象适合只更新少量字段。

## 字段运算更新

{% code title="IncrementReplies.cs" %}
```csharp
accessor.Update<Thread>(
	new
	{
		TotalReplies = Operand.Field("TotalReplies") + 1
	},
	Condition.Equal("ThreadId", threadId)
);
```
{% endcode %}

这种方式避免先读后写导致的并发问题，适合计数器和金额累计。

## 增改

`Upsert` 表示存在则更新，不存在则新增：

{% code title="UpsertProfile.cs" %}
```csharp
accessor.Upsert<UserProfile>(
	profile,
	"UserId, DisplayName, Avatar"
);
```
{% endcode %}

是否能高效执行取决于映射中的键定义和数据库驱动支持。对于关键业务路径，应确认目标驱动的 upsert 行为。

## 删除

{% code title="DeleteUser.cs" %}
```csharp
accessor.Delete<User>(
	Condition.Equal(nameof(User.UserId), userId)
);
```
{% endcode %}

删除也可以带 `schema`，用于控制导航或级联范围：

{% code title="DeleteRoleMembers.cs" %}
```csharp
accessor.Delete<Role>(
	Condition.Equal(nameof(Role.RoleId), roleId),
	"Members"
);
```
{% endcode %}

删除范围取决于映射关系和数据引擎的级联处理。生产代码应避免对空条件执行删除。

## 批量导入

`Import` 适合把大量同结构数据快速写入目标数据源：

{% code title="ImportLogs.cs" %}
```csharp
accessor.Import<LogEntry>(
	logs,
	"LogId, Level, Message, CreatedTime"
);
```
{% endcode %}

导入能力由驱动实现。不同数据库在批量写入、事务和返回值支持上可能不同。

## 返回值、并发与事务

写入后检查影响行数，并明确零行的含义：可能是条件不匹配、数据已经变化，或操作没有产生目标更新。关键更新可在条件中同时携带版本号或预期状态，再根据影响行数判断是否发生并发冲突。

字段运算将计算移到数据库内，减少先读后写的竞争窗口，但不能替代整套并发控制。涉及多条记录或多个操作共同成功时，使用[事务](transactions.md)并在目标驱动上验证。

## 级联不是任意对象图持久化

写入导航必须同时满足映射的可写关系、模式成员选择和驱动执行能力。集合子记录的增改语义，不等于自动删除输入中缺少的所有旧明细；业务应明确“追加、更新、替换集合”各自的规则。

Import 的 members 参数是字段名单，适合大量同结构记录；不同驱动有自己的批量实现和返回语义。导入前验证数据、序号与事务范围，不能假定与逐条 Insert 的扩展行为完全相同。
