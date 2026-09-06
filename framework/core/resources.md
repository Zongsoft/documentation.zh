---
description: 以 Discussions 的资源键和框架现有测试说明本地化资源、定位回退与组件标题。
icon: book
---

# Zongsoft.Resources

Resources 为程序集资源提供统一访问入口。一个资源键可以保持稳定，而展示文本随文化设置变化；类型和成员的位置则帮助框架确定去哪个资源集查找。它常用于组件标题、枚举描述、命令帮助和错误提示。

## Discussions 中的资源组织

Discussions 的 [Properties/Resources.resx](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Properties/Resources.resx) 已经保存论坛领域文本，无需再创建假想的 UserCategory 或安全模块资源集。

| 真实资源键 | 中文文本 | 用途 |
| --- | --- | --- |
| Accessibility | 可访问性 | 访问范围的显示名称 |
| Accessibility.Internal | 内部人员 | 枚举值文本 |
| Accessibility.Moderator | 版主 | 枚举值文本 |
| Accessibility.Specified | 限定人员 | 枚举值文本 |
| Approved | 已审核 | 审核状态的显示名称 |
| Forum | 论坛 | 领域对象名称 |
| ForumId | 论坛编号 | 字段名称 |

Resources.Designer.cs 是对应的生成访问器。调整文本应编辑 resx，再使用项目的资源生成流程更新访问器；直接修改生成文件不能稳定保留变更。资源键存在只说明文本可供查找，并不表示每个前端都已使用它。

## 主要对象怎样协作

| 对象 | 职责 |
| --- | --- |
| IResource | 按键读取字符串、对象，以及尝试读取的结果 |
| Resource | 扫描程序集内的资源集并组织读取 |
| IResourceLocator | 把调用位置转换为资源集候选名称 |
| ResourceLocator | 提供默认的逐级定位规则 |
| ResourceUtility 与 Resource 扩展 | 接收类型、成员和候选键，减少调用方的重复转换 |

资源集定位与资源键查找是两个步骤：先找到可能包含文本的资源集，再在其中查找键。位置通常来自类型的命名空间，不能把位置字符串当作资源键。

## 完整读取范例：枚举描述测试

Discussions 没有独立的资源读取测试，因此使用框架 ResourceTest。这里的 Gender 来自该测试项目，不是 Discussions.Models.Gender；两个项目各自拥有资源文件。

来源：[framework/Zongsoft.Core/test/Resources/ResourceTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Resources/ResourceTest.cs#L14)（节选；上下文见源文件）。

{% code title="ResourceTest.cs" %}
```csharp
public void Test()
{
	var resource = Resource.GetResource<Gender>();
	Assert.NotNull(resource);

	var text = resource.GetString("Gender.Male");
	Assert.NotNull(text);
	Assert.Equal("男士", text);

	text = resource.GetString("Gender.Female");
	Assert.NotNull(text);
	Assert.Equal("女士", text);

	text = EnumUtility.GetEnumDescription(Gender.Male);
	Assert.NotNull(text);
	Assert.Equal("男士", text);

	text = EnumUtility.GetEnumDescription(Gender.Female);
	Assert.NotNull(text);
	Assert.Equal("女士", text);
}
```
{% endcode %}

测试先直接读取 Gender.Male / Gender.Female，再经 EnumUtility 取得枚举说明。两条路径应得到同样文本。这说明界面可展示资源文本，业务仍保留稳定的枚举值。进一步用法见[枚举工具](common/enum-utility.md)。

## 定位器的真实回退规则

来源：[framework/Zongsoft.Core/src/Resources/ResourceLocator.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Resources/ResourceLocator.cs#L44)（节选；上下文见源文件）。

{% code title="ResourceLocator.cs" %}
```csharp
public IEnumerable<string> Locate(string origin)
{
	//如果资源管理器中没有资源集，则无需定位
	if(_resource.Count == 0)
		yield break;

	//如果资源管理器中只有一个资源集，则只能定位它
	if(_resource.Count == 1)
		yield return _resource.Resources.First().BaseName;

	if(!string.IsNullOrEmpty(origin))
	{
		foreach(var location in GetLocations(origin))
			yield return location;
	}

	foreach(var location in GetLocations($"{_resource.Assembly.GetName().Name}"))
		yield return location;
}
```
{% endcode %}

默认定位器首先处理没有资源集、只有一个资源集的情况，然后尝试来源位置以及程序集名称。GetLocations 会从完整位置逐级回退，每一级依次尝试 Properties.Resources、Resources 和位置本身。实际候选名称由程序集与调用类型决定，不需要手写另一个模块的资源树。

## 组件怎样选择候选键

来源：[framework/Zongsoft.Core/src/Collections/CategoryBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/CategoryBase.cs#L130)（节选；上下文见源文件）。

{% code title="CategoryBase.cs" %}
```csharp
protected virtual string GetTitle() => Resources.ResourceUtility.GetString(_resource,
[
	$"{this.FullPath.Trim(PathSeparator).Replace(PathSeparator, '.')}.{nameof(Category)}.{nameof(this.Title)}",
	$"{this.FullPath.Trim(PathSeparator).Replace(PathSeparator, '.')}.{nameof(Category)}",
	$"{this.FullPath.Trim(PathSeparator).Replace(PathSeparator, '.')}.{nameof(this.Title)}",
	this.FullPath.Trim(PathSeparator).Replace(PathSeparator, '.'),
	$"{this.Name}.{nameof(Category)}.{nameof(this.Title)}",
	$"{this.Name}.{nameof(Category)}",
	$"{this.Name}.{nameof(this.Title)}",
	this.Name,
]);
```
{% endcode %}

Category 优先按完整分类路径查标题，再退回节点名称。这个规则允许同名节点在不同位置显示不同文本；也允许小型分类树只提供通用名称。完整分类树范例见[Category](collections/category.md)。

## 对象资源与自定义定位

GetObject 用于读取非字符串资源，实际类型由资源文件决定。当前 Discussions 没有通过此接口读取图标并渲染的完整用例，因此不提供依赖未实现 RenderIconAsync 的代码。需要展示资源对象时，调用者应先检查类型，再交给相应呈现组件。

项目若采用不同的资源集命名方式，可以实现 IResourceLocator，并把实例交给 Resource 构造函数。默认实现已经适用于 Discussions 的 Properties.Resources 组织，无需为本案例添加新定位器。

{% hint style="info" %}
💡 Resource.GetResource 按程序集缓存实例。需要专用定位器时，显式创建拥有该定位器的 Resource，或者确保首次缓存时使用正确配置；后续取得缓存对象不会自动替换定位规则。
{% endhint %}

## 缺失文本时怎样排查

先检查 resx 是否包含目标键，再检查编译产物是否带有对应资源集，最后核对当前文化和来源位置。区分“键未命中”与“命中的文本为空”；主流程可以接受缺失时保留回退文本，配置错误则应明确报告。框架实现见 [Resource.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Resources/Resource.cs)。
