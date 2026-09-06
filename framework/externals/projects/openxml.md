---
description: OpenXml 项目的能力范围、部署产物、接入入口与使用边界。
icon: plug
---

# OpenXml

提供显式工作簿和单元格操作，适合需要直接控制表格结构的程序。模型记录的归档流程可以同时参考 ClosedXml 项目。

| 项目项 | 值 |
| --- | --- |
| 源码目录 | `externals/openxml` |
| 主包 | `Zongsoft.Externals.OpenXml` |
| 配套主题 | [表格与模板扩展](../documents.md) |

## 部署与使用入口

将主包追加到已有宿主的[部署清单](../../../references/deploy-files.md)，并保留包中的插件清单、程序集及附属运行资源：

{% code title="Application.deploy（追加片段）" %}
```ini
[plugins zongsoft externals openxml]
nuget:Zongsoft.Externals.OpenXml
```
{% endcode %}

直接使用项目中的 SpreadsheetDocument 包装器创建或打开工作簿。专题提供创建工作簿、写入单元格并保存的短示例。

## 接入步骤

1. 从创建一个工作表和两个单元格开始，保存后重新打开检查值。
2. 编辑已有文件时显式使用 editable 参数；默认打开方式为只读。
3. 验证中文、数据类型、所需格式及释放后文件能否再次访问。

具体配置、调用示例和相关基础概念见[表格与模板扩展](../documents.md)。

## 项目边界

{% hint style="info" %}
💡 包装器不会启动 Excel，也不会计算公式。公式缓存、图表等能力应按底层实现验证；调用者创建的工作簿要及时释放，以关闭底层文件包。
{% endhint %}

## 继续阅读

[按项目浏览扩展](README.md) · [表格与模板扩展](../documents.md) · [源码与项目说明](https://github.com/Zongsoft/framework/tree/main/externals/openxml)
