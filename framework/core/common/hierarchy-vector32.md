---
description: HierarchyVector32 四级层级编码结构。
icon: code-branch
---

# HierarchyVector32

`HierarchyVector32` 使用一个 32 位无符号整数表达最多四级层级编码，每级占用一个字节。

来源：[framework/Zongsoft.Data/test/Models/AddressConditionConverter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/test/Models/AddressConditionConverter.cs#L10)（节选；上下文见源文件）。

{% code title="AddressConditionConverter.cs" %}
```csharp
public override ICondition Convert(ConditionConverterContext context)
{
	if(context.Value == null)
		return null;

	static ICondition GetCondition(string name, uint id)
	{
		if(id == 0)
			return Condition.Equal(name, 0u);

		return Zongsoft.Data.Range.Create((HierarchyVector32)id).ToCondition(name);
	}

	if(context.Names.Length == 1)
		return GetCondition(context.GetFullName(), Zongsoft.Common.Convert.ConvertValue<uint>(context.Value));

	return ConditionCollection.Or(context.Names.Select(name => GetCondition(context.GetFullName(name), Zongsoft.Common.Convert.ConvertValue<uint>(context.Value))));
}
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

## 实际用途：层级范围查询

Discussions 的论坛与文件夹使用自身的数据模型，没有把编号编码为 HierarchyVector32。上面采用框架数据测试的 AddressConditionConverter：将地址编号解释为层级向量，再通过 Range.Create 生成范围查询条件；多字段条件以 Or 合并。输入零被单独转换为等值条件，避免把根节点范围误当成具体地址。

## 编码约束

四个字节从高位到低位对应四层。末尾非零字节决定深度，剩余低位范围表示后代；第四层的 Minimum 和 Maximum 相同。零向量深度为零。构造函数本身不会验证前面的层级是否连续，调用方应保持编码规则一致。

这适合层级上限已固定、编码规则由系统统一分配的区域或机构查询；不适合任意深度、频繁移动节点的树。需要动态父子关系时，先阅读[层次化模型](../collections/hierarchical.md)，不要把普通自增 ID 强制转换后当成有效层级编码。

## 相关资源

* [HierarchyVector32.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/HierarchyVector32.cs)
