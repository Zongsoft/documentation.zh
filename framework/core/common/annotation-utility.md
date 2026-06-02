---
description: AnnotationUtility 成员注解读取工具。
icon: book
---

# AnnotationUtility

`AnnotationUtility` 用于从类型成员读取显示相关注解，包括分类、显示名称和描述。

| 方法 | 说明 |
| --- | --- |
| `GetCategory` | 读取 `CategoryAttribute`。 |
| `GetDisplayName` | 读取 `DisplayNameAttribute` 或 `DisplayAttribute.Name`。 |
| `GetDescription` | 读取 `DescriptionAttribute` 或 `DisplayAttribute.Description`。 |

{% code title="AnnotationUtility.cs" %}
```csharp
var property = typeof(User).GetProperty(nameof(User.Name));

var category = AnnotationUtility.GetCategory(property);
var displayName = AnnotationUtility.GetDisplayName(property);
var description = AnnotationUtility.GetDescription(property);
```
{% endcode %}

这些方法适合模型描述、表单显示、命令参数和配置项说明。

## 相关资源

* [AnnotationUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/AnnotationUtility.cs)
