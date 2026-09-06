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

{% code title="OrderPattern.regex" %}
```regex
(?<name>[A-Za-z]+)=(?<value>\d+)
```
{% endcode %}

输入 `apples=12 oranges=7` 应得到两次匹配，并能分别检查 `name` 和 `value`。选中结果时，结合索引和长度核对命中位置，而不只比较显示文本。

## 选项影响

当前默认启用 IgnoreCase、IgnorePatternWhitespace、ExplicitCapture。它们分别影响大小写、表达式空白解释和未命名分组的捕获行为。界面还提供 Multiline 与 Singleline；两者分别影响行锚点和点号匹配，不是同一个“多行模式”。

完整枚举见 [`System.Text.RegularExpressions.RegexOptions`](https://learn.microsoft.com/zh-cn/dotnet/api/system.text.regularexpressions.regexoptions)。将规则移回应用时，应保持同样选项与转义方式；C# 字符串、JSON 和正则本身是不同的转义层。

## 验证边界

至少准备正常输入、无匹配、多个匹配、命名组、重复捕获、零长度结果和非法表达式。交互式小样本匹配成功不能证明大输入性能，应用仍应根据输入规模设置匹配超时并避免高回溯模式。

打开和保存操作只应针对自己的测试文件，避免将敏感真实文本当作默认样本。源码入口：[Regular](https://github.com/Zongsoft/tools/tree/main/regular)。
