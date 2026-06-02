---
description: HierarchyVector32 四级层级编码结构。
icon: code-branch
---

# HierarchyVector32

`HierarchyVector32` 使用一个 32 位无符号整数表达最多四级层级编码，每级占用一个字节。

{% code title="HierarchyVector32.cs" %}
```csharp
var parent = new HierarchyVector32(1, 2, 0, 0);
var child = new HierarchyVector32(1, 2, 3, 0);

Console.WriteLine(parent.Depth);
Console.WriteLine(HierarchyVector32.Contains(parent.Value, child.Value));
Console.WriteLine(HierarchyVector32.IsChild(parent.Value, child.Value));
```
{% endcode %}

## 常用成员

| 成员 | 说明 |
| --- | --- |
| `Depth` | 当前编码深度。 |
| `Value` | 原始 32 位值。 |
| `Minimum` / `Maximum` | 当前层级覆盖的值范围。 |
| `Contains` | 判断一个编码是否包含另一个编码。 |
| `IsChild` | 判断是否为直接或间接子级。 |
| `GetParent` | 获取父级编码。 |
| `GetAncestors` | 获取祖先编码列表。 |

它适合组织机构、区域、分类码、菜单层级等固定层级编码。

## 相关资源

* [HierarchyVector32.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/HierarchyVector32.cs)
