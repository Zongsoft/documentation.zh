---
description: 使用 Windows 正则测试器理解匹配、组和重复捕获，并保持选项与应用一致。
icon: magnifying-glass
---

# 正则表达式工具

`Zongsoft.Tools.Regular` 是基于 WinForms 的 .NET 正则匹配测试器，当前项目目标为 `net10.0-windows`。它展示匹配、分组和捕获层次，适合调试提取规则；当前主要界面逻辑没有独立的替换执行流程，不应把它当作完整替换编辑器。

## 准备与运行

从 tools 仓库根目录构建项目：

{% code title="BuildRegular.ps1" %}
```powershell
dotnet build ./regular/src/Zongsoft.Tools.Regular.csproj
```
{% endcode %}

随后运行相应输出目录的 Windows 可执行文件。此工具不是插件宿主，无需 `.plugin` 或 `dotnet deploy`；程序文件及所需桌面运行时由自身项目决定。

## 读取匹配结果

在输入区域放入测试文本，在表达式区域填写正则，执行匹配后观察结果树。匹配表示一次整体命中，组表示表达式中命名或编号的子部分，捕获表示重复分组在一次匹配中的各次结果。

Discussions 没有独立的正则调试样例，可用 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的 TextRegular.Web.Email 定义观察命名组。下面摘录实际规则；复制到工具的表达式框时，仅取 C# 逐字字符串中的内容，不包含 @、引号或字段声明。

来源：[framework/Zongsoft.Core/src/Text/TextRegular.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Text/TextRegular.cs#L115)（节选；上下文见源文件）。

{% code title="TextRegular.cs" %}
```csharp
public static readonly TextRegular Email = new(@"^\s*(?<value>[A-Za-z0-9]([-_\.]?[A-Za-z0-9]+)*@([A-Za-z0-9]+([-_]?[A-Za-z0-9]+)*)(\.[A-Za-z0-9]+([-_]?[A-Za-z0-9]+)*)*\.[A-Za-z]+)\s*$");
```
{% endcode %}

该规则的 value 组提取邮箱主体，外围空白不属于 value。使用待核对的应用输入观察整体匹配和分组结果；它是框架现有的邮箱格式规则，不代表对全部合法邮箱语法的完整实现。选中结果时，结合索引和长度核对命中位置，而不只比较显示文本。

## 选项影响

当前默认启用 IgnoreCase、IgnorePatternWhitespace、ExplicitCapture。它们分别影响大小写、表达式空白解释和未命名分组的捕获行为。界面还提供 Multiline 与 Singleline；两者分别影响行锚点和点号匹配，不是同一个“多行模式”。

完整枚举见 [`System.Text.RegularExpressions.RegexOptions`](https://learn.microsoft.com/zh-cn/dotnet/api/system.text.regularexpressions.regexoptions)。将规则移回应用时，应保持同样选项与转义方式；C# 字符串、JSON 和正则本身是不同的转义层。

## 验证边界

至少准备正常输入、无匹配、多个匹配、命名组、重复捕获、零长度结果和非法表达式。交互式小样本匹配成功不能证明大输入性能，应用仍应根据输入规模设置匹配超时并避免高回溯模式。

打开和保存操作只应针对自己的测试文件，避免将敏感真实文本当作默认样本。源码入口：[Regular](https://github.com/Zongsoft/tools/tree/main/regular)。
