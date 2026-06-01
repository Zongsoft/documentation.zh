---
description: 使用数据模式描述查询、导航、分页和排序。
icon: brackets-curly
---

# 数据模式

数据模式是 Zongsoft.Data 中描述数据形状的 DSL。它类似 GraphQL 的选择集，但不要求预先定义查询脚本。数据访问方法中的 `schema` 参数就是数据模式字符串；解析后的结构由 `ISchema` 表示。

如果不指定 `schema`，查询默认只获取简单属性，不自动加载导航属性。需要导航对象或导航集合时必须显式写出。

## 基本示例

```graphql
*, !CreatorId, !CreatedTime
```

表示包含所有简单属性，但排除 `CreatorId` 和 `CreatedTime`。

```graphql
*, Creator{Name, FullName}
```

表示包含所有简单属性，并包含 `Creator` 导航属性中的 `Name` 和 `FullName`。

```graphql
*, Users:1/20(Grade, ~CreatedTime){*}
```

表示包含 `Users` 导航集合，对集合分页并排序。

## 常用符号

- `*`：包含所有简单属性。
- `!`：排除之前定义；单独使用时表示排除所有属性。
- `!Name`：排除指定属性。
- `{ ... }`：描述导航属性的子模式。
- `:1/20`：分页。
- `(Name, ~CreatedTime)`：排序，`~` 表示倒序。

## 语法轮廓

```ebnf
schema ::= item [ "," item ]*
item ::= "*" | "!" | "!" identifier | identifier paging? sorting? children?
paging ::= ":" ( "*" | pageIndex [ "/" pageSize ] )
sorting ::= "(" sortItem [ "," sortItem ]* ")"
children ::= "{" schema "}"
sortItem ::= identifier | "~" identifier | "!" identifier
```

## 导航集合

导航集合可以独立分页和排序：

```graphql
*, Members:1/50(Name, ~CreatedTime){User{Name, Avatar}}
```

这表示读取当前实体的简单属性，并读取 `Members` 集合的第一页，每页 50 条，按 `Name` 正序、`CreatedTime` 倒序排序，同时在每个成员上继续读取 `User` 导航对象。

## 写入场景

`schema` 不只用于查询，也用于写入和删除：

- `Insert` / `Update` / `Upsert`：限定要写入的成员范围。
- `Delete`：限定级联删除或导航删除范围。
- `Import`：限定批量导入字段。

写入时应避免把外部输入直接拼成宽泛的 `*`，推荐显式列出允许写入的字段，减少误写导航属性或只读字段的风险。

## 使用位置

数据访问接口中的 `schema` 参数用于接收数据模式。解析后的结构由核心库中的 `ISchema` 接口表示。
