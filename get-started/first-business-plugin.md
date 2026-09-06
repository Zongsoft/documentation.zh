---
description: 编写只依赖 Core 的计算命令，通过插件清单和配置选择 Scriban 实现。
icon: puzzle-piece
---

# 编写第一个业务插件

本教程接着[最小终端宿主](deploy-first-plugin.md)，增加一个 `evaluate` 命令，读取选项指定的求值器并输出 `42`。业务类库只依赖 Core；Scriban 实现由部署加入。

这条路径展示了插件化的实际价值：业务依赖公共契约，装配层选择实现。开始前请确认 PluginDemo 能执行 `echo hello`，并先退出正在运行的示例宿主。

{% stepper %}
{% step %}
## 创建业务类库

在与 `PluginDemo` 相同的父目录执行：

{% code title="创建 Acme.Rules" %}
```shell
dotnet new classlib -n Acme.Rules -f net10.0
cd Acme.Rules
dotnet add package Zongsoft.Core
```
{% endcode %}

选择与宿主兼容的 Core 版本，创建以下文件：

{% code title="EvaluateCommand.cs" %}
```csharp
using Zongsoft.Components;
using Zongsoft.Expressions;
using Zongsoft.Services;

[assembly: ApplicationModule("Rules")]

namespace Acme.Rules;

public sealed class Module : ApplicationModule
{
	public static readonly Module Current = new();
	private Module() : base("Rules") { }
}

public sealed class EvaluateCommand : CommandBase<CommandContext>
{
	protected override ValueTask<object> OnExecuteAsync(CommandContext context, CancellationToken cancellation)
	{
		var name = ApplicationContext.Current.Configuration["Rules:Evaluator"]
			?? throw new InvalidOperationException("未配置 Rules:Evaluator。");
		var evaluator = Module.Current.Services.FindRequired<IExpressionEvaluator>(name);
		var result = evaluator.Evaluate("x + y", new Dictionary<string, object>
		{
			["x"] = 20,
			["y"] = 22,
		});
		context.Output.WriteLine(result);
		return ValueTask.FromResult(result);
	}
}
```
{% endcode %}

`Module.Current` 是本应用定义的入口，不是 Core 预置的全局类型。模块容器可以回退应用共享服务，因此不需要在 Rules 模块里重新注册 Scriban。命令的异步入口形状与框架一致，但本例的算术求值本身同步完成。
{% endstep %}

{% step %}
## 创建清单和配置

在类库目录中创建：

{% code title="Acme.Rules.plugin" %}
```xml
<plugin name="Acme.Rules">
	<manifest>
		<assemblies>
			<assembly name="Acme.Rules" />
		</assemblies>
		<dependencies>
			<dependency name="Main" />
		</dependencies>
	</manifest>
	<extension path="/Workbench/Modules">
		<object name="Rules" value="{static:Acme.Rules.Module.Current, Acme.Rules}" />
	</extension>
	<extension path="/Workbench/Executor/Commands">
		<object name="Evaluate" type="Acme.Rules.EvaluateCommand, Acme.Rules" />
	</extension>
</plugin>
```
{% endcode %}

清单把同一个模块实例加入应用，并把命令加入终端执行器。配置文件与清单保持相同主文件名：

{% code title="Acme.Rules.option" %}
```xml
<options>
	<option path="/">
		<rules evaluator="Scriban" />
	</option>
</options>
```
{% endcode %}

`evaluator` 属性生成 `Rules:Evaluator` 键。这里不能用 `<evaluator>Scriban</evaluator>` 替代；本框架的 XML 提供程序把文本节点用于集合项，详见[选项配置](../references/option-files.md)。
{% endstep %}

{% step %}
## 构建并加入部署方案

从 `Acme.Rules` 执行：

{% code title="编译业务插件" %}
```shell
dotnet build -c Debug -f net10.0
```
{% endcode %}

在 `PluginDemo/.deploy` 末尾追加：

{% code title="PluginDemo/.deploy（追加内容）" %}
```ini
[plugins zongsoft externals scriban]
nuget:Zongsoft.Externals.Scriban

[plugins acme rules]
../Acme.Rules/bin/Debug/net10.0/Acme.Rules.dll
../Acme.Rules/Acme.Rules.plugin
../Acme.Rules/Acme.Rules.option
```
{% endcode %}

从 `PluginDemo` 项目目录再次执行前一篇的部署命令。此处业务 DLL 显式来自 Debug 目录，部署器的 `edition` 变量不会改写这条固定路径。
{% endstep %}

{% step %}
## 验证业务调用

进入 `PluginDemo/out` 启动 `dotnet PluginDemo.dll`，输入 `evaluate`，预期输出 `42`。再用 `plugin.list` 检查 `Acme.Rules` 与 Scriban 插件均已加载，最后执行 `exit -yes`。

若提示未配置，检查选项主名和键；若找不到求值器，检查实现插件的部署、程序集扫描和名称；若找不到命令，先检查业务清单和命令扩展路径。
{% endstep %}
{% endstepper %}

## 从示例走向业务

实际项目可以把接口放到独立的契约程序集，让多个业务插件共享。不要将可变的请求状态保存在共享求值器上，也不要逐次释放由容器管理的实例。

{% hint style="warning" %}
🚨 修改求值器名称并不保证脚本兼容。Lua、Python、Scriban 使用不同语法及执行模型；本例仅演示受控的本地算术，不能据此把任意用户脚本视为可安全执行的内容。
{% endhint %}

继续阅读：[服务定位与所有权](../framework/core/services/locating.md)、[构件与服务](../framework/plugins/builtins-and-services.md)、[脚本与模板](../framework/externals/scripting.md)。
