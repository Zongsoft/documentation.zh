---
description: 使用成员选择、点路径、导航限量和排序描述查询与写入的数据形状。
icon: brackets-curly
---

# 数据模式

数据模式是数据访问方法的 `schema` 文本参数，解析结果由 `ISchema` 表示。它描述本次操作涉及哪些成员；实体关系仍由[映射文件](mapping.md)决定。需要先理解两者区别时，参见[数据访问基础](concepts.md#schema)。

## 从简单字段到对象图

{% code title="UserSelection.schema" %}
```text
*, !Password, Creator{Name}, Roles:20(Name){RoleId, Name}
```
{% endcode %}

这个模式包含模型可匹配的已映射简单属性，排除 Password，读取创建者姓名，并最多读取 20 个角色，按名称正序排序。这里假定这些属性和关系已经映射。

`*` 不自动加载导航，也不自动加入未映射的计算属性。没有指定模式时，引擎默认按 `*` 解析；为了稳定接口字段和减少敏感信息暴露，公开接口通常应使用明确的字段名单。

## 常用写法

| 写法 | 含义 |
| --- | --- |
| `Name, CreatedTime` | 选择简单成员 |
| `*` | 展开当前层的已映射简单成员 |
| `!` | 清除当前层已选成员 |
| `!Password` | 排除指定成员 |
| `Department{Name}` | 选择导航下的成员 |
| `Department.Manager.Name` | 沿点路径选择深层成员 |
| `Department`、`Department.*`、`Department{*}` | 终止于映射导航时展开其简单成员 |
| `Users:20(~CreatedTime){Name}` | 集合最多 20 条，按创建时间倒序 |
| `Users:0{*}`、`Users:*{*}` | 不限条数 |

{% hint style="warning" %}
🚨 当前导航语法中的冒号表示**限量**。旧写法 `Users:1/20` 已不符合当前解析器，不能用它表示第一页。根查询分页使用 `Paging`，详见[查询与导航](querying.md)。
{% endhint %}

## 点路径、包含与排除

点路径与花括号构成同一成员树，允许混用，例如 `Department.Manager{Name}`。重复包含同名导航会合并其子成员。排除逐段验证名称，未知成员会报错；有效但尚未包含的路径不会凭空加入结果。

`!Department` 与 `Department{!}` 都会移除该导航。`!*`、`!Department.*`、首尾句点、连续句点以及 `Department.*.Name` 不合法。文本 DSL 使用句点，模式对象路径 API 支持的斜杠不属于文本语法。

## 限量与排序

冒号后接受无符号数字或 `*`。正数表示最多记录数，`0` 和 `*` 表示不限。排序中 `~`、`-` 表示倒序，`+` 或无前缀表示正序；同名排序以最后一次声明为准。

{% code title="RecentOrders.schema" %}
```text
Customer{Name}, Lines:10(-CreatedTime,+LineId){ProductId, Quantity}
```
{% endcode %}

限量和排序修饰路径的终止成员，之后不能继续写句点，例如 `Lines:10.ProductId` 不合法，应改用花括号。成员之间可以有空白，但冒号后不能写 `: 10`，标识符内部也不能插入空白。

## 模型计算成员

显式指定的成员如果没有映射，引擎会尝试从当前模型的公共实例属性或字段中查找。找到后将其视为不参与持久化的成员，不生成数据库字段；仍找不到则报参数错误。

例如模型的 `DisplayName` 由 `FirstName` 与 `LastName` 计算，模式应同时包括依赖字段。只写 `DisplayName` 不会自动推导出它依赖哪些映射字段。

## 写入时的含义

Insert、Update、Upsert 使用模式限制写入成员，Delete 使用模式控制关系处理范围。Import 的字符串成员参数是字段名单，不应直接当作完整的导航 DSL 使用。

{% hint style="warning" %}
🚨 数据模式控制成员范围，不代替授权。外部输入不能自行决定是否写入所有者、租户、审计字段或级联删除关系。写入前还应检查映射的不可变属性和服务的验证规则。
{% endhint %}

解析依据：[Core 模式解析器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/SchemaParserBase.cs)、[引擎元数据绑定](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/SchemaParser.cs)、[模式回归用例](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Data/SchemaTest.cs)。
