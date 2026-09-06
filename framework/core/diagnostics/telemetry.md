---
description: 从框架安全模块的真实认证指标理解计量器、仪表、标签和导出。
icon: chart-line
---

# Telemetry

遥测指标把多次操作汇总为可观察的数量或分布，追踪则记录一次调用经过的边界。Discussions 尚未定义自己的指标组；其依赖的框架安全模块已为认证过程记录计数，本页以该实现为例。

## 创建模块计量器

来源：[framework/Zongsoft.Security/src/Module.Meter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Module.Meter.cs#L61)（节选；上下文见源文件）。

{% code title="Module.Meter.cs" %}
```csharp
internal Diagnostor()
{
	#if NET8_0_OR_GREATER
	_meter = Current.Services.ResolveRequired<IMeterFactory>().Create(NAME);
	#else
	_meter = new Meter(NAME, Current.Version.ToString());
	#endif

	this.Authentication = new(_meter);
}
```
{% endcode %}

.NET 8 及以上从模块容器取得 IMeterFactory；较早目标直接创建 Meter。计量器名来自安全模块常量，生命周期跟随模块诊断器，不是每次登录新建一个。

## 定义认证仪表

来源：[framework/Zongsoft.Security/src/Module.Meter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Module.Meter.cs#L74)（节选；上下文见源文件）。

{% code title="Module.Meter.cs" %}
```csharp
	public sealed class AuthenticationMeter(Meter meter)
	{
		#region 常量定义
		private const string METER = nameof(Diagnostor.Authentication);
		#endregion

		#region 公共字段
		public readonly Counter<long> Authenticated = meter.CreateCounter<long>($"{METER}.{nameof(Authenticated)}");
		public readonly Counter<long> Authenticating = meter.CreateCounter<long>($"{METER}.{nameof(Authenticating)}");
		#endregion
	}
}
```
{% endcode %}

Authenticated 与 Authenticating 是两个 Counter，用于不同阶段。仪表名称稳定之后才能配置过滤、仪表盘和告警；不能仅因中文显示名称相同就更改协议中的名称。

## 在真实事件中记录测量值

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

测量值是一次认证尝试，标签区分 Scheme 与 Scenario。标签应具有受控范围；把每个用户编号或请求编号用作指标标签会造成高基数，个体追踪更适合日志或 tracing。

## 采集与导出是后续步骤

创建 Meter 和记录 Counter 不代表外部后端已经收到数据。还需要选中来源、配置导出器与传输端点，并实际产生测量值。真实配置见[诊断扩展](../../diagnostics.md)。

| 信号 | 适合回答的问题 |
| --- | --- |
| 日志 | 某次操作发生了什么，异常调用链是什么 |
| 指标 | 一段时间内多少次、分布如何、是否异常增长 |
| 追踪 | 一次请求经过哪些组件，每段耗时如何 |

三者可以关联，但不能仅凭一个指标计数反推出完整业务过程。对发帖或文件存储的监控若要加入 Discussions，应先确定业务成功点、失败分类和事务边界，不能把安全模块的计数直接改名成论坛统计。

## 验证范围

确认计量器创建、事件触发、标签值、过滤匹配与导出结果；再检查取消、后端不可用和进程退出。采用自建 OTLP 服务端时还需核对转换限制，见[协议接入](../../diagnostics/otlp.md)。
