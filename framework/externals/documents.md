---
description: 在模型归档、底层工作簿操作和报表引擎之间选择合适的接入方式。
icon: file-excel
---

# 表格与报表扩展

把业务记录导出给人工填写、修改单元格和生成分页报表，是不同的工作。先选择所需数据边界，再选择扩展，可以避免把模型归档做成大量手写单元格代码。

| 扩展 | 适合任务 | 接入层次 |
| --- | --- | --- |
| ClosedXml | 模型记录导出、导入、Excel 模板渲染 | Core 数据归档与模板契约 |
| OpenXml | 创建工作簿、定位与修改单元格 | 显式工作簿对象和底层格式 |
| Grapecity | ActiveReports 模板与 Web 查看器/设计器 | [报表契约](../reporting.md)及商业引擎 |

## ClosedXml 模型导出

部署 `Zongsoft.Externals.ClosedXml` 后，以格式名 `Spreadsheet` 匹配归档生成器。以下代码放在已初始化应用的命令或服务中，不依赖数据库。

{% code title="ExportUsers.cs" %}
```csharp
using Zongsoft.Data;
using Zongsoft.Data.Archiving;
using Zongsoft.Services;

var generator = ApplicationContext.Current.Services
	.FindRequired<IDataArchiveGenerator>("Spreadsheet");
var users = new[] { new User { UserId = 1, Name = "Alice" } };

await using var output = File.Create("users.xlsx");
await generator.GenerateAsync(output, Model.GetDescriptor<User>(), users);

public class User
{
	public int UserId { get; set; }
	public string Name { get; set; }
}
```
{% endcode %}

调用者负责输出流，生成器由容器管理。对于实际数据服务，应使用 `service.GetDescriptor()`，这样映射中的主键、长度和语义信息才进入描述器；仅按 CLR 类型获取描述不能自动得到全部映射上下文。

## 导入依靠真正的 Excel 表格

当前内部表格名是 `__{model.QualifiedName}__`。无模块 `User` 对应 `__User__`，所属模块为 `Sales` 的模型对应 `__Sales.User__`。工作表名只是展示名称，普通区域和 Defined Name 也不能代替 Excel Table。

提取器按模型查找表格，并根据字段名称映射列。生成的标题单元格有字段对应的名称，人工模板可使用属性名作为表头后备匹配。旧模板只使用 `User` 表格名时，需要迁移到限定名约定。

💡 没有汇总行时，提取器会在表格列范围内向下寻找追加记录，忽略全空行。因此请把备注放在表格列带之外；启用汇总行时则只读取声明的数据区域。

## 类型、验证与显示

生成器根据描述元数据提供枚举/布尔下拉、长度、数字及日期等录入验证。这些只是 Excel 的录入辅助，复制粘贴或其他工具写入可能绕过它们，服务器仍须执行提取和模型验证。

长整数、标识符、空值和日期需专门验证往返。Excel 的数字精度不能直接覆盖全部 .NET 数值类型；当前早于 `1900-01-01` 的日期会以文本保存。应用应比较重新提取的字段值，而不是只看工作簿外观。

通过 `DataArchiveGeneratorOptions` 选择列，或用 `DataArchiveField` 调整宽度、对齐、颜色和格式。宽度单位是排版点，`Format` 接收 .NET 格式说明符，不是任意 Excel 数字格式代码。模板定位、渲染和归档提取是不同服务，均需按目标契约匹配。

## OpenXml 的显式工作簿操作

当任务是控制单元格而非模型归档，可直接引用 `Zongsoft.Externals.OpenXml`：

{% code title="CreateWorkbook.cs" %}
```csharp
using Zongsoft.Externals.OpenXml.Spreadsheet;

using var book = SpreadsheetDocument.Create("summary.xlsx", "Summary");
book.Sheets[0].Cells.SetValue("A1", "Total");
book.Sheets[0].Cells.SetValue("B1", 42.5m);
book.Save();
```
{% endcode %}

打开已有文件默认只读，修改时需明确 `editable: true`。释放包装器会关闭底层包。此扩展不会启动 Excel 或计算公式，公式缓存、图表和其他高级格式需根据底层能力另外处理。

## Grapecity 的使用范围

Grapecity 适配器可打开和保存 ActiveReports 定义，配套 Web 包提供查看器/设计器接入。目标环境还需完整商业运行时、字体、资源和许可证，源码部署清单不代表这些资源已齐全。

{% hint style="warning" %}
🚨 当前直接报表 `Render` 路径会抛出未实现异常，`Export` 与定位器设置也有未完成路径。应逐项验证所需 Web 或引擎功能，不能把接口声明当作已可导出 PDF 的保证。
{% endhint %}

所有上传工作簿和模板都应限制大小及资源访问范围。大文件可能占用显著内存，必要时改为有界批次或适合流式处理的方案。验证至少包括空表、字段变动、人工追加、中文、公式和资源释放。

源码入口：[ClosedXml](https://github.com/Zongsoft/framework/tree/main/externals/closedxml)、[OpenXml](https://github.com/Zongsoft/framework/tree/main/externals/openxml)、[Grapecity](https://github.com/Zongsoft/framework/tree/main/externals/grapecity)。
