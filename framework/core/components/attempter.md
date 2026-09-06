---
description: Zongsoft.Components Attempter 失败尝试统计和锁定窗口。
icon: shield-halved
---

# Attempter

`Attempter` 用于统计某个键的失败尝试次数，并在达到限制后进入锁定周期。它常用于登录、验证码、敏感操作二次确认等安全场景。

尝试器把“失败次数”和“锁定窗口”放到缓存中维护。调用方只需要在验证前检查、失败后登记、成功后清除即可。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `IAttempter` | 尝试器接口，定义检查、成功完成和失败登记。 |
| `Attempter` | 默认实现，基于分布式缓存和 `ISequence` 递增统计失败次数。 |
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

未达到限制时设置短窗口；第一次达到限制时设置锁定周期。
{% endstep %}

{% step %}
## Done

成功后调用 `DoneAsync(key)` 清除缓存键，避免历史失败次数继续影响用户。
{% endstep %}
{% endstepper %}

来源：[framework/Zongsoft.Core/src/Security/Privileges/Authenticators.Identity.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/Authenticators.Identity.cs#L86)（节选；上下文见源文件）。

{% code title="Authenticators.Identity.cs" %}
```csharp
public async ValueTask<Ticket> VerifyAsync(string key, Requirement requirement, string scenario, Parameters parameters, CancellationToken cancellation = default)
{
	if(string.IsNullOrWhiteSpace(requirement.Identity))
	{
		if(string.IsNullOrEmpty(key))
			throw new AuthenticationException(SecurityReasons.InvalidIdentity, "Missing identity.");

		requirement.Identity = key;
	}

	//获取验证失败的解决器
	var attempter = this.Attempter;
	var attempterKey = $"{this.GetType().Name}:{requirement.Identity}@{requirement.Namespace}";

	//确认验证失败是否超出限制数，如果超出则返回账号被禁用
	if(attempter != null && !await attempter.CheckAsync(attempterKey, cancellation))
		throw new AuthenticationException(SecurityReasons.AccountSuspended);

	//获取当前用户的密钥信息
	var cipher = await Authentication.Servicer.Users.Passworder.GetAsync(requirement.Identity, requirement.Namespace, cancellation);

	//如果帐户不存在则验证失败
	if(cipher == null)
		throw new AuthenticationException(SecurityReasons.InvalidIdentity);

	//执行密码验证，如果成功则返回验证成功的票证
	if(await Authentication.Servicer.Users.Passworder.VerifyAsync(requirement.Password, cipher, cancellation))
	{
		//通知验证尝试成功，即清空验证失败记录
		if(attempter != null)
			await attempter.DoneAsync(attempterKey, cancellation);

		//返回验证成功的票证
		return this.CreateTicket(cipher.Identifier, requirement);
	}

	//通知验证尝试失败
	if(attempter != null)
		await attempter.FailAsync(attempterKey, cancellation);

	//抛出验证失败异常
	throw new AuthenticationException(SecurityReasons.InvalidPassword);
}
```
{% endcode %}

Discussions 使用框架安全认证入口，模块质询器在其后补充站点身份。上面是核心密码认证器的真实检查、成功清理和失败登记流程，键由认证器类型、用户身份及命名空间构成。不存在的账号在读取密钥失败后直接抛出，不能把这里的 FailAsync 理解为覆盖所有失败类型。

`Attempter` 依赖的缓存需要支持 `ISequence` 递增操作，否则失败登记无法原子计数。安全模块会把认证尝试器作为插件构件暴露，方便通过配置调整限制策略。

{% hint style="warning" %}
尝试器的键会规范化为小写并加上内部前缀。调用方应使用稳定、非敏感的键，例如用户名、手机号或业务主体标识，不要直接把明文密码、验证码或令牌作为键。
{% endhint %}

`Limit` 小于 1 时表示不限制失败次数；`Window` 表示未达到阈值时失败次数保留多久，`Period` 表示达到阈值后的锁定时长。在分布式环境下，建议配置支持原子递增的分布式缓存，否则多个节点上的失败统计可能不可靠。

## 参考实现

* [Attempter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Attempter.cs)
* [Zongsoft.Security.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.plugin)
