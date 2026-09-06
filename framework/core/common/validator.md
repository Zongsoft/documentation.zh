---
description: 从框架安全模块的密码策略验证器理解结果、失败信息和调用上下文。
icon: clipboard-check
---

# Validator

IValidator&lt;T&gt; 返回是否通过，并允许通过 failure 回调报告原因。Discussions 的 DataValidator 实现的是数据访问验证契约，负责站点和审计字段；两者不能仅因名称相近就混为一谈。

## 真实密码验证器

来源：[framework/Zongsoft.Security/src/Validators/PasswordValidator.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Validators/PasswordValidator.cs#L42)（节选；上下文见源文件）。

{% code title="PasswordValidator.cs" %}
```csharp
[Service(typeof(IValidator<string>))]
public class PasswordValidator : IValidator<string>, IMatchable
```
{% endcode %}

安全模块注册 PasswordValidator 供服务发现。策略并未写死成“至少八位”，而是由 IdentityOptions 参数提供。

来源：[framework/Zongsoft.Security/src/Validators/PasswordValidator.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Validators/PasswordValidator.cs#L58)（节选；上下文见源文件）。

{% code title="PasswordValidator.cs" %}
```csharp
var options = parameter as Configuration.IdentityOptions;

//如果没有设置密码验证策略，则返回验证成功
if(options == null || options.PasswordLength < 1)
	return true;

//如果如果密码长度小于配置要求的长度，则返回验证失败
if(string.IsNullOrEmpty(data) || data.Length < options.PasswordLength)
{
	failure?.Invoke($"The password length must be no less than {options.PasswordLength} characters.");
	return false;
}

bool isValidate;
```
{% endcode %}

没有提供策略或长度小于一时返回成功；长度不足时通过 failure 返回原因。这是当前实现的重要边界，部署者必须提供符合自身要求的策略，不能把未配置理解成采用了默认强策略。

## 强度与失败消息

后续逻辑根据配置分别判断纯数字、最低、普通和最高强度。完整方法见同一源文件。调用方可以收集失败消息显示给用户，也可以只关心返回值；不要把输入的密码本身写入日志。

## 同步、异步与上下文

验证接口有同步和异步形式，并可以传递自定义参数。当前密码检查是本地计算；需要调用外部依赖的验证器应传播取消令牌并控制调用成本。同步成功不代表持久化或认证已经成功，这些属于后续业务步骤。

| 需求 | 应使用的机制 |
| --- | --- |
| 输入值是否符合规则并返回原因 | IValidator |
| 是否满足条件 | [Predication](predication.md) |
| 数据查询站点约束与审计字段 | [Discussions DataValidator](../../data/services.md) |
| 用户能否执行资源动作 | [认证与授权](../../security/authentication.md) |

调用位置可核对框架 [UserServiceBase.Password](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/UserServiceBase.Password.cs)。
