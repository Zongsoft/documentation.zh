---
description: Hierarchical 层级节点、节点集合、路径查找和层级表达式。
icon: code-branch
---

# Hierarchical

`Hierarchical` 相关类型提供树状节点、节点集合、路径查找和表达式解析能力。`Category`、配置树、选项树等需要“按路径定位节点”的模型，都可以复用这套基础设施。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `HierarchicalNode` | 非泛型层级节点基类，提供名称、路径、完整路径和非法字符约束。 |
| `HierarchicalNode<TNode>` | 泛型层级节点基类，提供父节点、子节点集合和 `Find` 查找逻辑。 |
| `HierarchicalNodeCollection<TNode>` | 基于名称键的子节点集合，忽略大小写，禁止添加根节点。 |
| `HierarchicalNodeUtility` | 提供 `IsRoot` 等层级节点扩展方法。 |
| `HierarchicalExpression` | 表示“层级路径 + 成员访问表达式”的解析结果。 |
| `HierarchicalExpressionParser` | 解析层级表达式文本。 |

## 层级节点

层级节点以 `/` 作为路径分隔符。根节点名称为 `/`，根节点的 `Path` 为空字符串，`FullPath` 为 `/`。

{% code title="HierarchicalPath.cs" %}
```csharp
var root = new Category();
var file = root.Categories.Add("File");
var save = file.Categories.Add("Save");

Console.WriteLine(root.FullPath); // /
Console.WriteLine(file.FullPath); // /File
Console.WriteLine(save.FullPath); // /File/Save
```
{% endcode %}

节点名称不能为空，不能包含路径分隔符和层级表达式保留字符。

## 路径查找

`HierarchicalNode<TNode>.Find` 支持以下路径形式：

| 路径 | 说明 |
| --- | --- |
| `/A/B` | 从根节点开始查找。 |
| `A/B` | 从当前节点的子节点开始查找。 |
| `./A` | 从当前节点开始查找。 |
| `../A` | 从父节点开始查找。 |
| 空字符串 | 返回当前节点。 |

{% code title="FindHierarchicalNode.cs" %}
```csharp
var root = new Category();
var file = root.Categories.Add("File");
file.Categories.Add("Open");
file.Categories.Add("Save");

var open = root.Find("/File/Open");
var save = file.Find("./Save");
var again = file.Find("../File/Open");
```
{% endcode %}

路径分段两端的空白会被忽略。找不到节点时返回 `null`。

## 层级表达式

`HierarchicalExpression` 用来解析“节点路径 + 成员访问器”。表达式由路径和可选成员访问两部分组成。

{% code title="ParseHierarchicalExpression.cs" %}
```csharp
using Zongsoft.Collections;

var expression = HierarchicalExpression.Parse(
	" / segment1 / segment2 @ property1 [100] . property2 ");

Console.WriteLine(expression.Path);      // /segment1/segment2
Console.WriteLine(expression.Anchor);    // Root
Console.WriteLine(expression.Segments);  // segment1, segment2
Console.WriteLine(expression.Accessor);  // property1[100].property2
```
{% endcode %}

常见格式包括：

* `/root/node@property`
* `../sibling/node@property`
* `child/node[index]`
* `@property1.property2`

成员访问部分由 `Zongsoft.Reflection.Expressions` 解析，因此可以表达属性、索引器和链式成员访问。

## 相关资源

* [HierarchicalExpression.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HierarchicalExpression.cs)
* [HierarchicalExpressionParser.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HierarchicalExpressionParser.cs)
* [HierarchicalNode.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HierarchicalNode.cs)
* [HierarchicalNode&lt;T&gt;.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HierarchicalNode%601.cs)
* [HierarchicalNodeCollection.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HierarchicalNodeCollection.cs)
* [HierarchicalNodeUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/HierarchicalNodeUtility.cs)
* [HierarchicalExpressionTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/HierarchicalExpressionTest.cs)
