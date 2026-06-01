---
description: 使用数据模式描述查询、导航、分页和排序。
icon: brackets-curly
---

# 数据模式

数据模式是 Zongsoft.Data 中描述数据形状的 DSL。它类似 GraphQL 的选择集，但不要求预先定义查询脚本。

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
- `!`：排除之前定义。
- `!Name`：排除指定属性。
- `{ ... }`：描述导航属性的子模式。
- `:1/20`：分页。
- `(Name, ~CreatedTime)`：排序，`~` 表示倒序。

## 使用位置

数据访问接口中的 `schema` 参数用于接收数据模式。解析后的结构由核心库中的 `ISchema` 接口表示。
