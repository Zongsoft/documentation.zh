---
description: Category 分类树及 CategoryBase、CategoryCollection、CategoryCollectionBase 的用法。
icon: list-tree
---

# Category

`Category` 表示一个可嵌套的分类节点。它继承自 `CategoryBase<Category>`，通过 `Categories` 属性持有子分类集合，常用于菜单、功能分组、导航分类、模块能力分组等树状结构。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `Category` | 具体分类节点，内置 `CategoryCollection` 子集合。 |
| `CategoryBase<TSelf>` | 分类节点基类，提供标题、描述、图标、排序、标签和资源本地化。 |
| `CategoryCollection` | `Category` 的默认子分类集合，提供按名称快速新增分类的 `Add` 方法。 |
| `CategoryCollectionBase<TCategory>` | 分类集合基类，负责父节点维护和按 `Ordinal` 自动排序。 |

`Category` 同时也是层级节点，因此它继承了路径、完整路径、根节点判断和路径查找等能力。

## 创建分类树

来源：[framework/Zongsoft.Core/test/Collections/CategoryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/CategoryTest.cs#L119)（节选；上下文见源文件）。

{% code title="CategoryTest.cs" %}
```csharp
private static Category Initialize()
{
	var root = new Category();

	var file = root.Categories.Add("File");
	var edit = root.Categories.Add("Edit");
	var help = root.Categories.Add("Help");

	file.Categories.Add("Open");
	file.Categories.Add("Close");
	file.Categories.Add("Save");
	file.Categories.Add("SaveAs");
	file.Categories.Add("Recents").Categories.AddRange(
		new Category("Document-1"),
		new Category("Document-2")
	);

	return root;
}
```
{% endcode %}

无参构造的 `Category` 是根节点，名称为 `/`，完整路径也是 `/`。普通节点的名称不能包含 `/`、`\`、`*`、`?`、`!`、`@` 等层级路径非法字符。

## 路径查找

`Category` 支持按层级路径查找节点。路径可以包含空白、相对路径、根路径和父级跳转。

来源：[framework/Zongsoft.Core/test/Collections/CategoryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/CategoryTest.cs#L36)（节选；上下文见源文件）。

{% code title="CategoryTest.cs" %}
```csharp
public void TestFind()
{
	var root = Initialize();

	var found = root.Find("File");
	Assert.NotNull(found);
	Assert.Equal("File", found.Name);
	Assert.Equal("/", found.Path);
	Assert.Equal("/File", found.FullPath);

	found = root.Find("Edit");
	Assert.NotNull(found);
	Assert.Equal("Edit", found.Name);
	Assert.Equal("/", found.Path);
	Assert.Equal("/Edit", found.FullPath);

	found = root.Find("Help");
	Assert.NotNull(found);
	Assert.Equal("Help", found.Name);
	Assert.Equal("/", found.Path);
	Assert.Equal("/Help", found.FullPath);

	found = root.Find(" File / Save");
	Assert.NotNull(found);
	Assert.Equal("Save", found.Name);
	Assert.Equal("/File", found.Path);
	Assert.Equal("/File/Save", found.FullPath);

	Assert.NotNull(root.Find(" File/ Recents"));
	Assert.NotNull(root.Find(" File /Recents / Document-1"));

	Assert.NotNull(root.Find(" /File/ Save"));
	Assert.NotNull(root.Find("/ File  /Recents"));
	Assert.NotNull(root.Find(" / File  /  Recents/Document-2"));

	found = root.Find("File").Find(" Open");
	Assert.NotNull(found);
	Assert.Equal("Open", found.Name);
	Assert.Equal("/File", found.Path);
	Assert.Equal("/File/Open", found.FullPath);

	found = root.Find("File").Find("./ Recents");
	Assert.NotNull(found);
	Assert.Equal("Recents", found.Name);
	Assert.Equal("/File", found.Path);
	Assert.Equal("/File/Recents", found.FullPath);

	found = root.Find("File").Find("Recents").Find("Document-2  ");
	Assert.NotNull(found);
	Assert.Equal("Document-2", found.Name);
	Assert.Equal("/File/Recents", found.Path);
	Assert.Equal("/File/Recents/Document-2", found.FullPath);

	found = root.Find("Edit").Find(".. / File / Save");
	Assert.NotNull(found);
	Assert.Equal("Save", found.Name);
	Assert.Equal("/File", found.Path);
	Assert.Equal("/File/Save", found.FullPath);
}
```
{% endcode %}

`Find` 返回匹配节点，找不到时返回 `null`。路径分段前后的空白会被忽略。

## 排序

`CategoryBase<TSelf>.Ordinal` 表示分类的排列顺序。向 `CategoryCollectionBase<TCategory>` 添加节点时，集合会按 `Ordinal` 插入到合适位置。

来源：[framework/Zongsoft.Core/test/Collections/CategoryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/CategoryTest.cs#L97)（节选；上下文见源文件）。

{% code title="CategoryTest.cs" %}
```csharp
public void TestOrdinal()
{
	const int COUNT = 100;

	var root = new Category();

	for(int i = 0; i < COUNT; i++)
	{
		var ordinal = Random.Shared.Next() % COUNT;
		root.Categories.Add(new Category($"A{(i + 1):000}") { Ordinal = ordinal });
	}

	for(int i = 1; i < root.Categories.Count; i++)
	{
		Assert.NotNull(root.Categories[i]);
		Assert.NotNull(root.Categories[i - 1]);
		Assert.True(root.Categories[i].Ordinal >= root.Categories[i - 1].Ordinal);
	}
}
```
{% endcode %}

测试随机设置 100 个节点的 Ordinal，随后逐项验证排序值不递减。上面的 Initialize 和 TestFind 属于同一测试夹具；复用代码时需要保留它们的关系。

## 本地化标题和描述

`CategoryBase<TSelf>` 可以接收 `Zongsoft.Resources.IResource`。当 `Title` 或 `Description` 没有显式设置时，会按完整路径和节点名称查找资源键。

`Title` 的资源键查找顺序包含：

* `{path}.Category.Title`
* `{path}.Category`
* `{path}.Title`
* `{path}`
* `{name}.Category.Title`
* `{name}.Category`
* `{name}.Title`
* `{name}`

`Description` 的资源键查找顺序包含：

* `{path}.Category.Description`
* `{path}.Description`
* `{name}.Category.Description`
* `{name}.Description`

显式设置 `Title`、`Description`、`Icon`、`Tags` 时，会触发属性变更通知。

## 相关资源

* [Category.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/Category.cs)
* [CategoryBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/CategoryBase.cs)
* [CategoryCollection.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/CategoryCollection.cs)
* [CategoryCollectionBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/CategoryCollectionBase.cs)
* [CategoryTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/CategoryTest.cs)
