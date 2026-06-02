---
description: Zongsoft.Components Attempter 失败尝试统计和锁定窗口。
icon: shield-halved
---

# Attempter

`Attempter` 用于统计某个键的失败尝试次数，并在达到限制后进入锁定周期。它常用于登录、验证码、敏感操作二次确认等安全场景。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IAttempter` | 尝试器接口，定义检查、成功完成和失败登记。 |
| `Attempter` | 默认实现，基于分布式缓存和序列递增统计失败次数。 |
| `IAttempterOptions` | 尝试限制选项接口。 |
| `AttempterOptions` | 默认尝试限制选项。 |

## 工作机制

{% stepper %}
{% step %}
## Check

调用 `CheckAsync(key)` 检查当前键是否仍允许尝试。
{% endstep %}

{% step %}
## Fail

失败时调用 `FailAsync(key)`。实现会通过缓存的 `ISequence` 能力递增失败次数。
{% endstep %}

{% step %}
## Window / Period

未达到限制时设置短窗口；达到限制时设置锁定周期。
{% endstep %}

{% step %}
## Done

成功后调用 `DoneAsync(key)` 清除缓存键，避免历史失败次数继续影响用户。
{% endstep %}
{% endstepper %}

{% code title="登录失败限制示意" %}
```csharp
if(!await attempter.CheckAsync(userName, cancellation))
	throw new InvalidOperationException("尝试次数过多，请稍后再试。");

if(await ValidatePasswordAsync(userName, password, cancellation))
{
	await attempter.DoneAsync(userName, cancellation);
	return;
}

if(await attempter.FailAsync(userName, cancellation))
	throw new InvalidOperationException("尝试次数过多，请稍后再试。");
```
{% endcode %}

`Attempter` 依赖的缓存需要支持 `ISequence` 递增操作，否则失败登记无法原子计数。安全模块会把认证尝试器作为插件构件暴露，方便通过配置调整限制策略。

## 参考实现

* [Attempter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Attempter.cs)
* [Zongsoft.Security.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.plugin)
