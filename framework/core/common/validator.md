---
description: Validator 数据有效性验证接口。
icon: clipboard-check
---

# Validator

`IValidator<T>` 表示数据有效性验证接口。它把验证结果和失败消息分开：方法返回 `true` / `false` 表示是否通过，`failure` 回调用于输出一条或多条失败原因。

## 接口成员

| 成员 | 说明 |
| --- | --- |
| `Validate(T data, Action<string> failure)` | 便捷同步验证入口。 |
| `Validate(T data, object argument, Action<string> failure)` | 带自定义参数的同步验证入口。 |
| `ValidateAsync(T data, Action<string> failure, CancellationToken cancellation)` | 便捷异步验证入口。 |
| `ValidateAsync(T data, object argument, Action<string> failure, CancellationToken cancellation)` | 带自定义参数的异步验证入口。 |

`argument` 用于传入验证上下文，例如当前租户、调用场景、密码策略或字段配置。`failure` 可以为空，表示调用方只关心是否通过。

## 实现验证器

{% code title="PasswordValidator.cs" %}
```csharp
using System;
using System.Threading;
using System.Threading.Tasks;
using Zongsoft.Common;

public sealed class PasswordValidator : IValidator<string>
{
	public bool Validate(string data, object argument, Action<string> failure = null)
	{
		if(string.IsNullOrWhiteSpace(data))
		{
			failure?.Invoke("密码不能为空。");
			return false;
		}

		if(data.Length < 8)
		{
			failure?.Invoke("密码长度不能少于 8 个字符。");
			return false;
		}

		return true;
	}

	public Task<bool> ValidateAsync(
		string data,
		object argument,
		Action<string> failure = null,
		CancellationToken cancellation = default)
	{
		return Task.FromResult(this.Validate(data, argument, failure));
	}
}
```
{% endcode %}

## 收集失败消息

调用方可以通过 `failure` 回调收集错误消息，再决定是展示给用户、写入日志还是转换为业务异常。

{% code title="ValidatePassword.cs" %}
```csharp
using System;
using System.Collections.Generic;

var validator = new PasswordValidator();
var failures = new List<string>();

if(!validator.Validate("123", failures.Add))
{
	foreach(var failure in failures)
		Console.WriteLine(failure);
}
```
{% endcode %}

## 在框架中的用法

安全模块会按服务名查找 `IValidator<string>`，用于用户名、角色名、密码等输入的规则校验。例如密码服务会查找名为 `password` 的验证器，用户名服务会查找名为 `user.name` 的验证器。

<details>
<summary>适合使用 Validator 的场景</summary>

* 输入值需要返回明确失败消息。
* 规则可能来自配置、服务或业务上下文。
* 同步和异步验证入口都要对外暴露。
* 验证器需要按名称注册并被业务服务查找。

</details>

{% content-ref url="predication.md" %}
[predication.md](predication.md)
{% endcontent-ref %}

## 相关资源

* [IValidator.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/IValidator.cs)
* [UserServiceBase.Password.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/UserServiceBase.Password.cs)
* [UserServiceBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/UserServiceBase.cs)
* [RoleServiceBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/RoleServiceBase.cs)
