---
description: Zongsoft.Resources 资源定位、资源访问和资源键命名约定。
icon: book
---

# Zongsoft.Resources

`Zongsoft.Resources` 提供一组围绕程序集资源集的访问抽象，用于统一读取本地化文本、嵌入对象资源和带上下文的资源键。它的重点不是替代 .NET 的资源系统，而是在 Zongsoft 框架内部提供一层更贴近模块、类型和成员上下文的资源定位能力。

典型使用场景包括：为命令、分类节点、组件描述、异常消息、插件构件或 UI 元数据提供本地化文本；按类型位置查找资源；在多个候选资源键之间做回退；以及为模块定义自定义资源定位规则。

## 主要职责

* 定义 `IResource` 资源访问接口，统一读取字符串和对象资源。
* 定义 `IResourceLocator` 资源定位器接口，把类型、成员或字符串位置转换为资源集候选路径。
* 提供 `Resource` 默认实现，扫描程序集内的 `.resources` 资源集并封装 .NET 资源管理器。
* 提供 `ResourceUtility` 扩展方法，让调用方可以从 `Type`、`MemberInfo` 或 `Assembly` 直接读取资源。
* 支持多个候选资源键的顺序查找，便于按“精确键、简化键、默认键”的方式回退。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IResource` | 资源访问接口，提供 `GetString(...)`、`GetObject(...)` 和对应 `TryGet*` 方法。 |
| `Resource` | 默认资源对象，基于程序集中的 `.resources` 资源集读取字符串或对象。 |
| `IResourceLocator` | 资源定位器接口，根据调用位置返回资源集候选路径。 |
| `ResourceLocator` | 默认定位器，按类型命名空间、资源集约定和程序集名称生成候选路径。 |
| `ResourceUtility` | 资源访问扩展方法，封装按类型、成员、程序集和候选键读取资源的常用入口。 |

## 资源定位规则

`Resource` 会在构造时扫描程序集清单资源名称，并把以 `.resources` 结尾的资源集交给 .NET 资源管理器管理。读取资源时，调用方提供资源键 `name` 和可选位置 `location`；定位器负责把位置转换为一个或多个资源集名称，再按顺序尝试读取。

默认 `ResourceLocator` 的定位规则通常可以理解为从“更具体的位置”逐步回退到“更通用的位置”：

{% code title="ResourceLocation.txt" %}
```text
Zongsoft.Security.Users.UserService.Properties.Resources
Zongsoft.Security.Users.UserService.Resources
Zongsoft.Security.Users.UserService
Zongsoft.Security.Users.Properties.Resources
Zongsoft.Security.Users.Resources
Zongsoft.Security.Users
Zongsoft.Security.Properties.Resources
Zongsoft.Security.Resources
Zongsoft.Security
```
{% endcode %}

如果程序集内只有一个资源集，默认定位器会优先返回这个资源集。随后才会根据调用位置和程序集名称继续生成候选路径。这样简单程序集可以只维护一个资源文件，而较大的模块也可以按命名空间或类型拆分资源。

{% hint style="info" %}
位置字符串通常来自类型或成员，例如 `ResourceUtility` 会把 `Zongsoft.Security.Users.UserService` 这样的类型转换为同名位置。资源文件命名越贴近类型所在命名空间，默认定位器越容易按预期找到资源。
{% endhint %}

## 基本读取

最直接的方式是从类型或程序集读取资源字符串。适合命令标题、错误消息、菜单文本、分类节点标题等需要本地化但又不想把资源文件路径写死的场景。

{% code title="ReadResourceString.cs" %}
```csharp
using Zongsoft.Resources;

var title = typeof(UserService).GetResourceString("Title");
var description = typeof(UserService).GetResourceString("Description");
```
{% endcode %}

如果调用方已经拿到了 `IResource`，也可以显式指定类型作为定位上下文：

{% code title="ReadWithResource.cs" %}
```csharp
using Zongsoft.Resources;

var resource = Resource.GetResource<UserService>();

var title = resource.GetString<UserService>("Title");
var icon = resource.GetObject("Icon", typeof(UserService));
```
{% endcode %}

`GetString(...)` 和 `GetObject(...)` 在找不到资源时返回 `null`。如果需要区分“找不到”和“资源值为空”，可以使用 `TryGetString(...)` 或 `TryGetObject(...)`。

## 候选键回退

有些组件需要先查找精确键，再回退到通用键。例如分类节点可以优先使用完整路径，再退回到节点名称；命令可以优先使用完整命令路径，再退回到命令类型名称。

{% code title="FallbackResourceKeys.cs" %}
```csharp
using Zongsoft.Resources;

var title = typeof(UserCategory).GetResourceString(
	"Security.Users.Title",
	"Users.Title",
	"Title");

var description = typeof(UserCategory).GetResourceString(
	"Security.Users.Description",
	"Users.Description",
	"Description");
```
{% endcode %}

这种写法适合资源键需要兼容历史命名或多层上下文的场景。候选键按传入顺序查找，第一次命中即返回。

{% content-ref url="collections/category.md" %}
[category.md](collections/category.md)
{% endcontent-ref %}

## 组件标题和描述

在组件模型里，资源常被用来补充“可展示文本”。例如分类、命令、插件构件或服务描述可以保存稳定的代码名称，而把面向用户的标题和说明放到资源文件中。这样框架对象保持稳定，界面文本可以随文化或模块资源调整。

{% code title="CategoryResourceUsage.cs" %}
```csharp
using Zongsoft.Resources;

var resource = Resource.GetResource(typeof(UserCategory));

var title = resource.GetString(
	"Security.Users.Title",
	typeof(UserCategory));

var description = resource.GetString(
	"Security.Users.Description",
	typeof(UserCategory));
```
{% endcode %}

这种方式尤其适合插件化模块：插件声明和代码类型使用稳定名称，资源文件负责提供不同语言、不同部署环境下的展示文本。

## 对象资源

除了字符串，`IResource` 也支持对象资源。对象资源通常用于图标、模板、二进制片段或其它嵌入资源。调用方式与字符串资源相同，只是入口换成 `GetObject(...)` 或 `TryGetObject(...)`。

{% code title="ReadObjectResource.cs" %}
```csharp
using Zongsoft.Resources;

var icon = typeof(UserService).GetResourceObject("Icon");

if(icon is not null)
	await RenderIconAsync(icon, cancellation);
```
{% endcode %}

对象资源的实际类型取决于资源文件内容。调用方在使用前应进行类型检查或转换，不要假定所有资源都能转换为某个固定类型。

## 自定义定位器

默认定位器适合按命名空间和资源集约定查找资源。如果模块有自己的资源集命名约定，可以实现 `IResourceLocator`。例如一个安全模块可能希望先查类型所在位置对应的资源集，再回退到模块级默认资源集。

{% code title="ModuleResourceLocator.cs" %}
```csharp
using Zongsoft.Resources;

public sealed class ModuleResourceLocator : IResourceLocator
{
	public IEnumerable<string> Locate(string origin)
	{
		if(!string.IsNullOrEmpty(origin))
			yield return $"{origin}.Resources";

		yield return "Zongsoft.Security.Resources";
		yield return "Zongsoft.Security.Properties.Resources";
	}
}
```
{% endcode %}

使用自定义定位器时，可以直接构造 `Resource`，或者在首次取得程序集资源对象时传入定位器：

{% code title="UseCustomLocator.cs" %}
```csharp
using Zongsoft.Resources;

var resource = new Resource(
	typeof(UserService).Assembly,
	new ModuleResourceLocator());

var title = resource.GetString("Title", typeof(UserService));
```
{% endcode %}

{% hint style="warning" %}
`Resource.GetResource(...)` 会按程序集缓存资源对象。如果同一程序集需要使用自定义定位器，建议显式构造 `Resource`，或确保首次缓存该程序集资源对象时就传入正确定位器，避免后续调用拿到已缓存的默认定位器实例。
{% endhint %}

## 使用建议

资源键建议保持稳定、短小并带有上下文，例如 `Title`、`Description`、`Commands.Start.Title`、`Security.Users.Description`。面向用户的文本放在资源文件中，代码和插件声明中尽量保存稳定名称，这样更利于本地化和插件复用。

资源文件的组织可以按模块大小调整：简单模块使用一个 `Properties.Resources` 即可；大型模块可以按命名空间或类型拆分资源集。默认定位器会沿着类型位置逐级回退，因此资源集命名最好与命名空间保持一致。

读取资源时，如果缺失资源不会影响主流程，可以使用 `GetString(...)` 并处理 `null`；如果缺失资源意味着配置错误，建议使用 `TryGetString(...)` 后明确抛出业务可读的错误信息。

## 相关资源

* [Resources 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Resources)
* [Category 资源用法](collections/category.md)
