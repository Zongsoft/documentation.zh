---
description: 从安全模块事件与日志过滤说明可组合的条件断言。
icon: circle-check
---

# Predication

Predication 将“条件是否成立”表达为可同步或异步执行的对象。Discussions 的业务条件主要使用数据引擎 Condition；它没有自定义 PredicationBase。因此这里采用 framework 安全模块的事件注册作为真实用例。

## 将委托用于事件描述

来源：[framework/Zongsoft.Security/src/Module.Events.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Module.Events.cs#L63)（节选；上下文见源文件）。

{% code title="Module.Events.cs" %}
```csharp
public static readonly EventDescriptor<Privileges.AuthenticatedEventArgs> Authenticated = new(Predication.Predicate<Privileges.AuthenticatedEventArgs>(OnAuthenticated), $"{nameof(Privileges.Authentication)}.{nameof(Privileges.Authentication.Authenticated)}");
public static readonly EventDescriptor<Privileges.AuthenticatingEventArgs> Authenticating = new(Predication.Predicate<Privileges.AuthenticatingEventArgs>(OnAuthenticating), $"{nameof(Privileges.Authentication)}.{nameof(Privileges.Authentication.Authenticating)}");
```
{% endcode %}

安全模块用 Predication.Predicate 将方法包装成对应参数类型的断言。事件描述器和绑定逻辑仍由模块负责，断言工厂不自动完成事件注册。

来源：[framework/Zongsoft.Security/src/Module.Events.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Module.Events.cs#L114)（节选；上下文见源文件）。

{% code title="Module.Events.cs" %}
```csharp
private static bool OnAuthenticating(Privileges.AuthenticatingEventArgs args)
{
	Current.Meter.Authentication.Authenticating.Add(1,
		new KeyValuePair<string, object>(nameof(args.Scheme), args.Scheme),
		new KeyValuePair<string, object>(nameof(args.Scenario), args.Scenario));

	return true;
}
```
{% endcode %}

这个真实回调先记录认证指标，再返回 true。它说明断言可能包含副作用；组合和短路会影响后续回调是否执行，因此不能无条件把带副作用断言当作纯函数重排。

## 类型与组合

| 类型 | 责任 |
| --- | --- |
| IPredication、IPredication&lt;T&gt; | 非泛型与强类型判断契约 |
| Predication | 从委托创建实现 |
| PredicationBase&lt;T&gt; | 命名、参数转换与服务匹配 |
| PredicationCollection | 组合多个断言 |
| PredicationCombination | AND 或 OR 的短路规则 |

集合为空时返回成功；AND 在失败时短路，OR 在成功时短路。默认对象转换会影响弱类型入口，扩展时应检查参数类型、附加 Parameters 与取消语义。

## 日志中的实际使用

框架 LoggerPredication 根据日志来源、异常类型和级别进行判断。配置由 Initialize 读取，具体实现见 [LoggerPredication](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Diagnostics/LoggerPredication.cs)。这类规则适合输出筛选，不应代替业务授权。

需要返回具体失败原因时使用[验证器](validator.md)；需要让数据库筛选记录时使用[数据条件](../../data/conditions-and-operands.md)。
