---
description: Zongsoft.Components Discriminator 识别器和插件构件装配。
icon: tags
---

# Discriminator

`IDiscriminator` 是一个很小但很有用的接口：它让一个容器对象根据输入参数识别目标类型或目标子集合。插件构件装配时，如果父对象实现了识别器，就可以把子构件追加到正确的位置，而不是只能依赖固定的属性名或集合类型。

它适合解决“同一个节点下允许多种子对象”的装配问题。识别器把类型判断留给领域容器本身，而不是让插件构建器猜测每一种集合属性。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IDiscriminator` | 定义 `Discriminate(object argument)`，根据参数返回识别结果。 |

## 权限分类示例

`PrivilegeCategory` 同时包含子分类集合和权限集合。它实现 `IDiscriminator` 后，可以根据输入内容返回应该追加到哪个集合。

来源：[framework/Zongsoft.Core/src/Security/Privileges/PrivilegeCategory.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/PrivilegeCategory.cs#L128)（节选；上下文见源文件）。

{% code title="PrivilegeCategory.cs" %}
```csharp
object IDiscriminator.Discriminate(object argument)
{
	switch(argument)
	{
		case string type:
			if(string.IsNullOrEmpty(type) || string.Equals(type, nameof(Category), StringComparison.OrdinalIgnoreCase))
				return this.Categories;

			if(string.Equals(type, nameof(Privilege), StringComparison.OrdinalIgnoreCase))
				return this.Privileges;

			break;
		case Privilege:
			return this.Privileges;
		case PrivilegeCategory:
			return this.Categories;
	}

	return null;
}
```
{% endcode %}

这是核心权限分类的实际实现。空类型名与 Category 指向子分类集合，Privilege 指向权限集合，字符串比较忽略大小写；无法识别时返回空。Discussions 的插件挂载仍遵循同一构件装配规则，但未定义自己的 IDiscriminator。

## 插件装配中的用途

[`Zongsoft.Plugins`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins) 中的 `BuiltinType` 会先询问拥有者或默认成员是否实现 `IDiscriminator`，如果返回 [`Type`](https://learn.microsoft.com/zh-cn/dotnet/api/system.type) _[源码](https://source.dot.net/#System.Private.CoreLib/Type.cs)_ 或集合，就用它判断构件类型。`ObjectBuilder` 在追加子对象时也会先调用容器的识别器，把子对象交给正确的集合。

{% stepper %}
{% step %}
## 读取插件节点

插件系统读取一个内建构件节点，准备构造或追加对象。
{% endstep %}

{% step %}
## 询问识别器

如果父对象实现 `IDiscriminator`，构建器把类型名或子对象传给 `Discriminate(...)`。
{% endstep %}

{% step %}
## 选择目标

识别器返回目标类型、目标集合或目标容器，构建器再完成类型解析或追加操作。
{% endstep %}
{% endstepper %}

这种设计特别适合“一个节点下可能包含多种子对象”的插件结构，例如权限分类下既能放权限项，也能放子分类。

{% hint style="info" %}
识别器返回值可以是目标类型、目标集合或目标容器，具体解释由调用方决定。插件装配中的行为以 [`Zongsoft.Plugins`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins) 的构件构建流程为准。
{% endhint %}

`IDiscriminator` 适合容器内部有清晰分类规则的场景。如果子对象只有一个固定集合属性，直接公开集合或属性通常更简单。识别规则也应保持可预测，尽量不要依赖外部状态或会频繁变化的运行时条件。

## 参考实现

* [IDiscriminator.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IDiscriminator.cs)
* [PrivilegeCategory.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/PrivilegeCategory.cs)
* [BuiltinType.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/BuiltinType.cs)
* [ObjectBuilder.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Builders/ObjectBuilder.cs)
