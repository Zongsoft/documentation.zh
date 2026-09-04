# Zongsoft 中文文档协作规则

本仓库是 Zongsoft 开发框架、宿主程序与工具链的中文 GitBook 文档库。编辑者必须把本文档当作项目级规则，并同时遵守 GitBook 官方 `skill.md` 规范：

https://gitbook.com/docs/skill.md

## 基础约束

- 保持已有文件的换行符；新增文本文件使用 CRLF 换行。
- 使用 Tab 字符缩进。编辑现有文件时延续该文件当前缩进方式；`SUMMARY.md` 当前使用空格缩进层级，除非整体重排导航，否则不要改变它。
- 不要修改与当前任务无关的文件，不要重排整篇文档，不要批量替换风格差异。
- `README.md` 作为英文入口，`README.zh-Hans.md` 作为简体中文入口；其他正文优先使用简体中文。术语、包名、类型名、命令名和文件名保持原文。
- 文档面向 Zongsoft 使用者，解释应落在“如何用、何时用、注意事项”，避免写成源码逐行注释。

## GitBook 写作规则

- 编辑已有内容前先读 `SUMMARY.md`，确认页面在导航中的位置、同级页面命名和相对链接。
- 页面文件使用 GitBook 支持的 Markdown：frontmatter、GitBook 自定义区块、相对链接、资源引用都必须保持可渲染。
- 新增普通页面时，尽量添加 `description` 和合适的 `icon` frontmatter。
- 新增页面后同步 `SUMMARY.md`，不要让同一个 Markdown 文件在 `SUMMARY.md` 中出现两次。
- 内部链接使用相对路径，例如 `[部署工具](tools/deployer.md)`；移动文件时同步修复引用。
- 图片和可下载资源放在 `.gitbook/assets/` 下，引用路径按页面位置写相对路径。
- 导航入口或专题入口可使用 GitBook card table；一般说明优先使用段落、列表、hint、tabs、stepper、content-ref。
- 代码块尽量使用 GitBook 的 code title 区块包裹并提供标题。

{% code title="GitBookCodeBlock.md" %}
````markdown
{% code title="Program.cs" %}
```csharp
builder.Services.AddHostedService<Worker>();
```
{% endcode %}
````
{% endcode %}

## .NET 类型链接规则

正文中出现简短代码形式的 .NET 内置类、命名空间、接口、结构、枚举等时，如果它不是以 `System.` 打头，应为其补充官方文档链接和 source.dot.net 源码链接。

- 能找到 Microsoft Learn 文档时，格式为：类型名链接到 Learn，后接斜体格式的 `(源码)` 链接。
- 找不到 Learn 文档时，类型名直接链接到 source.dot.net 源码。
- `System.` 打头的基础类型和命名空间不强制补链接，但当它是页面重点概念时可以补充。
- Zongsoft 自有类型优先链接到本库相关页面；若需要源码，链接到对应 GitHub 源文件或目录。
- 外部第三方类型优先链接其官方文档；需要源码时，链接到可用的 GitHub 源文件或目录。
- 不要为代码块内部每个类型加链接；规则主要适用于正文中的 inline code。

{% code title="DotnetTypeLinks.md" %}
```markdown
[`Microsoft.Extensions.Caching.Memory.MemoryCache`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.caching.memory.memorycache) _[源码](https://source.dot.net/#Microsoft.Extensions.Caching.Memory/MemoryCache.cs)_

[`IChangeToken`](https://source.dot.net/#Microsoft.Extensions.Primitives/IChangeToken.cs)
```
{% endcode %}

## 本库内容边界

- 文档覆盖 Zongsoft 框架、插件框架、数据引擎、宿主程序、工具链和参考格式；新增内容应放入现有栏目，不要另起一套分类。
- 概览页解释设计目标和边界；快速开始页写可执行路径；框架指南页讲核心抽象和典型用法；参考页保留格式、包索引、术语表等可查信息。
- 对比较复杂的类、组件模型、扩展机制或一整套设计模式，尽量补充设计原则、设计思路和设计意图，帮助读者理解为什么这样使用，以及适用场景、前置条件和适用范围、注意事项等。
- 本库当前假定 .NET SDK 8、9、10 都可能出现；具体版本要求必须以对应项目文件、包说明或源码为准，不要写死未经核实的版本结论。
- 提到部署、插件、映射、选项、驱动时，优先串联现有页面：`framework/plugins/`、`framework/data/`、`hosting/`、`tools/`、`references/`。
- 代码示例应短小、能说明 API 形状，并使用 Tab 缩进 C#、XML、YAML、text 树形结构中的层级。
- 示例文件名使用有意义的标题，如 `SelectUsers.cs`、`Zongsoft.Data.plugin`、`samples.option`。
- 解释边界条件时使用 GitBook hint：普通提示用 `info`，风险和限制用 `warning`，破坏性或不可逆操作才用 `danger`。
- 数据表适合放类型关系、包索引、配置项矩阵；导航入口适合使用 card table；互斥方案适合使用 tabs；有先后顺序的教程适合使用 stepper。
- 不要把尚未在源码、包或已有文档中确认的行为写成事实。需要推断时明确说明“通常”“建议”“取决于配置”等边界词。

## 校验清单

- frontmatter 是合法 YAML，GitBook 自定义区块都有匹配的结束标签。
- `SUMMARY.md` 与新增、移动、删除的页面保持同步。
- 内部相对链接可解析，资源路径相对于当前页面正确。
- 代码块有语言标识；主要代码块有 GitBook code title 标题。
- inline .NET 类型链接符合本规则，尤其是非 `System.` 打头的 Microsoft 扩展类型。
- 没有把用户未要求的现有改动回退或混入本次改动。
