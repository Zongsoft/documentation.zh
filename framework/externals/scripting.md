---
description: 通过表达式契约选择 Lua、Python 或 Scriban，并管理语法、变量和运行时隔离。
icon: code
---

# 脚本与表达式

表达式适合将小范围、经审核的计算规则从业务代码中抽出，例如价格计算或字段转换。脚本语言则能表达更复杂的控制流程。灵活性增加后，类型验证、执行成本与可访问能力也必须由应用明确约束。

## 统一调用与不同语言

三个插件都注册 `IExpressionEvaluator`，按名字匹配，但不会自动翻译语言语法。

| 名称 | 实现 | 同一计算的写法 | 部署关注点 |
| --- | --- | --- | --- |
| `Lua` | NLua / KeraLua | `return x + y` | 平台和架构匹配的原生库 |
| `Python` | IronPython | `x + y` | 部署 `lib` 标准库；不是系统 CPython 环境 |
| `Scriban` | Scriban 纯脚本求值 | `x + y` | 不要把带模板分隔符的文本直接当成纯表达式 |

Python 中能否导入某个库取决于 IronPython 兼容性和部署内容，安装了系统 Python 包不代表此运行时可用。

## 从业务插件调用

宿主部署选定实现，业务项目只引用 Core 契约。以下片段运行在插件初始化之后，预期结果表示数值 `42`。

{% code title="EvaluateRule.cs" %}
```csharp
using Zongsoft.Expressions;
using Zongsoft.Services;

var evaluator = ApplicationContext.Current.Services
	.FindRequired<IExpressionEvaluator>("Scriban");
var variables = new Dictionary<string, object>
{
	["x"] = 20,
	["y"] = 22,
};

var result = evaluator.Evaluate("x + y", variables);
Console.WriteLine(result);
```
{% endcode %}

需要配置选择时，从选项读取求值器名，并同时选择与该语言匹配的表达式。完整项目、命令和部署示例见[首个业务插件](../../get-started/first-business-plugin.md)。

当前 Scriban 实现会直接读取 `variables.Count`，即使没有变量也应传入空字典，不能把可选参数的默认值视为已支持空对象输入。

## 变量与返回值

每次调用创建自己的变量集合，在应用边界验证返回值类型和范围。数字宽度、空值、集合和多返回值在语言之间并不完全等价；不要在业务深处直接强制转换任意脚本结果。

共享 `Global` 适合在应用启动时注册稳定函数或常量，不应在并发请求中反复修改。暴露宿主对象时，应只传入确有必要的数据与受限操作，而不是完整服务容器。

## 运行时与并发

Lua 每次求值创建并释放自己的 Lua 状态；Python 复用引擎并在调用期间切换运行时输入输出；Scriban 每次建立求值上下文。这些实现不能统一概括为“传入独立字典就线程隔离”。

尤其是 Python 的 IO 和全局状态，应在应用拥有的执行边界中串行化，或通过独立进程隔离。容器注册的求值器由宿主管理；直接构造的独立实例才由构造方负责释放。

{% hint style="warning" %}
🚨 脚本执行不等于安全沙箱。当前接口不能保证任意脚本都在指定时间内停止；对不可信脚本，需要独立的权限、进程和资源隔离设计。不要依靠异常捕获阻止无限循环或过量资源使用。
{% endhint %}

## 验证与错误定位

为应用实际使用的规则保存脱敏输入和预期结果，覆盖缺字段、空值、非法语法、除零、类型不匹配及重复执行。诊断记录规则标识、版本与错误位置，避免记录包含秘密的完整变量或脚本。

模板生成是另一类任务：它把数据渲染成完整文本或文件。工作簿模板应使用[表格归档和模板服务](documents.md)，不能只因为安装了 Scriban 就假定所有模板格式都已接入。

源码入口：[Lua](https://github.com/Zongsoft/framework/tree/main/externals/lua)、[Python](https://github.com/Zongsoft/framework/tree/main/externals/python)、[Scriban](https://github.com/Zongsoft/framework/tree/main/externals/scriban)。
