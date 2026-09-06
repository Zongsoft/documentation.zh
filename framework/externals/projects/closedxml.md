---
description: ClosedXml 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# ClosedXml

把业务模型接入 Excel 数据归档、提取与模板服务，适合导出业务记录、人工填写后再导入等流程。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/closedxml` |
| 主包 | `Zongsoft.Externals.ClosedXml` |
| 配套主题 | [表格与模板扩展](../documents.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals closedxml]
nuget:Zongsoft.Externals.ClosedXml
```
{% endcode %}

通过 Core 的归档或模板契约按 `Spreadsheet` 格式匹配服务。实际数据服务优先提供自身描述器，让映射中的主键、长度和语义进入归档过程。

## 接入步骤

1. 沿专题的生成器示例导出少量模型记录，检查列名、显示格式和字段验证。
2. 人工修改或追加记录后，用同一模型描述提取，比较实际字段值。
3. 覆盖空表、空值、长整数、日期和字段变动，再接入业务校验与写入。

具体配置、调用示例和相关基础概念见[表格与模板扩展](../documents.md)。

## 项目边界

{% hint style="info" %}
💡 导入定位的是 Excel Table，表格名为 `__{model.QualifiedName}__`，工作表名或普通区域不能替代它。没有汇总行时会在表格列范围内向下提取追加记录，备注应放在列带之外。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [表格与模板扩展](../documents.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/closedxml)
