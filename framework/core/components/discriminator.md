---
description: Zongsoft.Components Discriminator 识别器和插件构件装配。
icon: tags
---

# Discriminator

`IDiscriminator` 是一个很小但很有用的接口：它让一个容器对象根据输入参数识别目标类型或目标子集合。插件构件装配时，如果父对象实现了识别器，就可以把子构件追加到正确的位置，而不是只能依赖固定的属性名或集合类型。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IDiscriminator` | 定义 `Discriminate(object argument)`，根据参数返回识别结果。 |

## 权限分类示例

`PrivilegeCategory` 同时包含子分类集合和权限集合。它实现 `IDiscriminator` 后，可以根据输入内容返回应该追加到哪个集合。

{% code title="PrivilegeCategory 识别逻辑示意" %}
```csharp
object IDiscriminator.Discriminate(object argument)
{
	return argument switch
	{
		Privilege => this.Privileges,
		PrivilegeCategory => this.Categories,
		"Privilege" => this.Privileges,
		"Category" => this.Categories,
		_ => null,
	};
}
```
{% endcode %}

## 插件装配中的用途

`Zongsoft.Plugins` 中的 `BuiltinType` 会先询问拥有者或默认成员是否实现 `IDiscriminator`，如果返回 `Type` 或集合，就用它判断构件类型。`ObjectBuilder` 在追加子对象时也会先调用容器的识别器，把子对象交给正确的集合。

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

## 参考实现

* [IDiscriminator.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IDiscriminator.cs)
* [PrivilegeCategory.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/PrivilegeCategory.cs)
* [BuiltinType.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/BuiltinType.cs)
* [ObjectBuilder.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Builders/ObjectBuilder.cs)
