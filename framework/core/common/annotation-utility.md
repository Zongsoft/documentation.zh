---
description: AnnotationUtility 成员注解读取工具。
icon: book
---

# AnnotationUtility

`AnnotationUtility` 用于从类型成员读取显示相关注解，包括分类、显示名称和描述。

| 方法 | 说明 |
| --- | --- |
| `GetCategory` | 读取 [`CategoryAttribute`](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.categoryattribute) _[源码](https://source.dot.net/#System.ComponentModel.Primitives/CategoryAttribute.cs)_。 |
| `GetDisplayName` | 读取 [`DisplayNameAttribute`](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.displaynameattribute) _[源码](https://source.dot.net/#System.ComponentModel.Primitives/DisplayNameAttribute.cs)_ 或 `DisplayAttribute.Name`。 |
| `GetDescription` | 读取 [`DescriptionAttribute`](https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.descriptionattribute) _[源码](https://source.dot.net/#System.ComponentModel.Primitives/DescriptionAttribute.cs)_ 或 `DisplayAttribute.Description`。 |

来源：[framework/externals/aliyun/src/Telecom/PhoneTransmitter.cs](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/src/Telecom/PhoneTransmitter.cs#L71)（节选；上下文见源文件）。

{% code title="PhoneTransmitter.cs" %}
```csharp
_descriptor = new TransmitterDescriptor(this.Name, AnnotationUtility.GetDisplayName(this.GetType()), AnnotationUtility.GetDescription(this.GetType()));
```
{% endcode %}

## 从注解到显示元数据

上面是框架 Aliyun PhoneTransmitter 创建发送器描述符的实际代码。该类型使用 DisplayName 和 Description 特性声明资源键，AnnotationUtility 读取注解并配合资源机制得到标题与说明。完整示例见[模板发送器](../communication/transmitter.md)，资源查找见[资源管理](../resources.md)。Discussions 的模型字段和枚举也依赖资源描述，但没有这段发送器代码。

## 什么时候使用

当模型、命令或配置项的说明由类型声明统一维护时，读取注解能避免在每个界面重复保存名称。注解负责展示元数据，不参与数据库列名匹配，也不能代替参数验证。缺失注解或资源时应按调用方显示约定处理，不要把返回的标题用于权限键或持久标识。

## 相关资源

* [AnnotationUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/AnnotationUtility.cs)
