---
description: Zongsoft.Core 中 Zongsoft.Security 命名空间的声明身份、凭证、密钥、验证码与安全基础模型。
icon: shield
---

# Zongsoft.Security

`Zongsoft.Security` 是核心库中的安全基础层。它不直接等同于完整的安全业务模块，而是为上层的 `Zongsoft.Security` 插件、Web 认证、业务身份模型和权限系统提供可复用的抽象、工具和运行时对象。

核心库把安全能力拆成三类：

| 领域 | 主要类型 | 用途 |
| --- | --- | --- |
| 声明身份 | [`CredentialIdentity`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/CredentialIdentity.cs)、[`CredentialPrincipal`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/CredentialPrincipal.cs)、[`ClaimsIdentityModeling`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/ClaimsIdentityModeling.cs) | 表示登录后的身份、凭证编号、续约令牌、场景和身份模型转换。 |
| 声明工具 | [`ClaimNames`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/ClaimNames.cs)、[`ClaimUtility`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/ClaimUtility.cs)、[`ClaimsIdentityExtension`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/ClaimsIdentityExtension.cs) | 为标准 claims 增加命名空间、描述、授权、类型转换、角色和模型映射能力。 |
| 安全辅助 | [`Password`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Password.cs)、[`Secretor`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Secretor.cs)、[`Certificate`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Certificate.cs)、[`ICaptcha`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/ICaptcha.cs) | 处理密码摘要、一次性秘密、证书、签名、人机识别和挑战扩展。 |

权限、认证器、授权器、用户、角色和成员模型位于 [`Zongsoft.Security.Privileges`](security/privileges.md)。如果只想了解权限树、角色继承和授权计算，请直接阅读该页。

## 设计边界

核心安全命名空间只定义“如何表达身份与安全材料”，不规定“用户表怎么设计”或“登录接口怎么写”。默认数据库、服务实现和插件挂载位于 [`Zongsoft.Security`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Security) 项目；业务系统可以继承核心抽象，替换模型、查询条件、claims 补充逻辑和权限存储字段。

这种分层的好处是：

* 身份载体基于标准 [`ClaimsIdentity`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claimsidentity) _[(源码)](https://source.dot.net/#System.Security.Claims/ClaimsIdentity.cs)_ 和 [`ClaimsPrincipal`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claimsprincipal) _[(源码)](https://source.dot.net/#System.Security.Claims/ClaimsPrincipal.cs)_，可以接入 ASP.NET Core、令牌认证和宿主上下文。
* 业务身份可以通过 _转换器_ 从 Claims 还原成强类型模型，调用方不必到处解析字符串。
* 凭证、验证码、密码、证书等安全材料以接口暴露，默认实现可替换，业务模块只依赖稳定契约。

## 声明模型

声明是登录后在进程内传递身份信息的最小单元。一个 [`Claim`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claim) _[源码](https://source.dot.net/#System.Security.Claims/Claim.cs)_ 保存一项事实，例如用户编号、用户名、角色、租户编号、语言或授权信息。

`ClaimNames` 定义了 Zongsoft 额外约定的声明名：

| 名称 | 含义 |
| --- | --- |
| `Namespace` | 身份所属命名空间，常用于多租户、组织或业务域隔离。 |
| `Description` | 身份或声明对象的说明文本。 |
| `Creation`、`Modification` | 创建和修改时间。 |
| `Authorization` | 授权相关声明，通常作为可重复声明处理。 |

`ClaimUtility` 负责 Claim 值与 .NET 类型之间的转换。它根据 Claim 的 `ValueType` 识别 `bool`、[`DateTime`](https://learn.microsoft.com/zh-cn/dotnet/api/system.datetime) _[源码](https://source.dot.net/#System.Private.CoreLib/DateTime.cs)_、[`DateOnly`](https://learn.microsoft.com/zh-cn/dotnet/api/system.dateonly) _[源码](https://source.dot.net/#System.Private.CoreLib/DateOnly.cs)_、[`TimeOnly`](https://learn.microsoft.com/zh-cn/dotnet/api/system.timeonly) _[源码](https://source.dot.net/#System.Private.CoreLib/TimeOnly.cs)_、整数、浮点数、[`TimeSpan`](https://learn.microsoft.com/zh-cn/dotnet/api/system.timespan) _[源码](https://source.dot.net/#System.Private.CoreLib/TimeSpan.cs)_ 或 Zongsoft 类型别名。设置 Claim 时，`ClaimsIdentityExtension.SetClaim(...)` 会反向生成合适的 `ValueType`。

来源：[src/Security/UserChallenger.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserChallenger.cs#L126)（节选；上下文见源文件）。

{% code title="UserChallenger.cs" %}
```csharp
private ClaimsIdentity Identity(UserProfile user)
{
	var identity = user.Identity(UserIdentity.Scheme, "Zongsoft");

	identity.SetClaim(nameof(UserProfile.SiteId), user.SiteId);
	identity.SetClaim(nameof(UserProfile.Gender), user.Gender);
	identity.SetClaim(nameof(UserProfile.Avatar), user.Avatar);
	identity.SetClaim(nameof(UserProfile.Grade), user.Grade);
	identity.SetClaim(nameof(UserProfile.TotalPosts), user.TotalPosts);
	identity.SetClaim(nameof(UserProfile.TotalThreads), user.TotalThreads);

	//进行其他声明定义
	this.OnClaims(identity, user);

	//返回新构建的身份
	return identity;
}
```
{% endcode %}

`ClaimsIdentityExtension` 还提供了常用读取和判断：

* `GetIdentifier<T>()` 读取 `ClaimTypes.NameIdentifier` 并转换成指定类型。
* `GetNamespace()` / `SetNamespace(...)` 处理 Zongsoft 命名空间声明。
* `InRole(...)`、`InRoles(...)` 和 `IsAdministrator()` 按身份中的角色声明判断。
* `GetQualifiedName()` 组合命名空间与名称，形成 `namespace:name` 风格的限定名。
* `AsModel<T>()` 把 Claims 写入 `IUser`、`IModel` 或普通对象。

{% hint style="info" %}
Claims 应保存“认证后需要频繁读取的小事实”，例如用户编号、名称、租户编号、分支机构、语言、角色名和许可模块。不要把大对象、动态权限列表或需要实时一致的数据全部塞进 Claims；这些内容通常应通过服务查询或按需缓存。
{% endhint %}

## 凭证主体

`CredentialIdentity` 是登录身份，构造时会写入名称声明和签发者声明。签发者使用 `ClaimTypes.System` 保存，因此同一个 [`ClaimsPrincipal`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claimsprincipal) _[源码](https://source.dot.net/#System.Security.Claims/ClaimsPrincipal.cs)_ 可以按认证方案或模块查找对应身份。

`CredentialPrincipal` 是登录后的凭证主体，扩展了标准 [`ClaimsPrincipal`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claimsprincipal) _[源码](https://source.dot.net/#System.Security.Claims/ClaimsPrincipal.cs)_：

| 属性 | 说明 |
| --- | --- |
| `CredentialId` | 凭证编号，用于注册、查找、注销和模型缓存键。 |
| `RenewalToken` | 续约令牌，用于刷新凭证或延长会话。 |
| `Scenario` | 登录场景，例如 `web`、`api`、`mobile`。 |
| `Validity` | 凭证有效时长。 |
| `Disposed` | 凭证失效通知，身份模型缓存会随之失效。 |

`CredentialPrincipal` 可以序列化和反序列化，因此默认凭证提供器可以把它写入缓存、Cookie 或其他存储。认证成功后，`Authentication.AuthenticateAsync(...)` 会创建凭证主体，执行 _质询器(**C**hallengers)_，最后通过 `ICredentialProvider.RegisterAsync(...)` 注册。

## 身份模型转换

`ClaimsIdentityModeling` 是当前推荐的身份模型入口。它从 `ApplicationContext.Current.Principal` 或传入的 _主体_ 中获取 `CredentialPrincipal`，再按认证方案取出对应身份并执行转换。

转换器有两种来源：

* `Authentication.Transformer` 中的 `ClaimsPrincipalTransformer.Transformers`。
* 当前应用服务容器中的 `IClaimsIdentityTransformer`。

转换结果会以 `CredentialId` 和 _scheme_ 为键缓存；凭证主体释放时缓存随之失效。Discussions 的 UserIdentity.Current 按 [Zongsoft.Discussions](https://github.com/Zongsoft/discussions/tree/main/src) 方案读取模型：

来源：[src/Security/UserIdentity.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserIdentity.cs#L110)（节选；上下文见源文件）。

{% code title="UserIdentity.cs" %}
```csharp
public static UserIdentity Current => ClaimsIdentityModeling.GetModel<UserIdentity>(Scheme);
```
{% endcode %}

业务 _转换器_ 通常只处理自己认识的认证方案，把 _Claim_ 转成业务身份属性：

来源：[src/Security/UserIdentity.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Security/UserIdentity.cs#L130)（节选；上下文见源文件）。

{% code title="UserIdentity.cs" %}
```csharp
private bool OnTransform(UserIdentity user, Claim claim)
{
	switch(claim.Type)
	{
		case nameof(UserIdentity.SiteId):
			user.SiteId = (claim.Value != null && uint.TryParse(claim.Value, out var siteId)) ? siteId : 0;
			return true;
		case nameof(UserIdentity.Gender):
			user.Gender = (claim.Value != null && Enum.TryParse<Models.Gender>(claim.Value, out var gender)) ? gender : Models.Gender.None;
			return true;
		case nameof(UserIdentity.Avatar):
			user.Avatar = claim.Value;
			return true;
		case nameof(UserIdentity.Grade):
			user.Grade = (claim.Value != null && byte.TryParse(claim.Value, out var grade)) ? grade : (byte)0;
			return true;
		case nameof(UserIdentity.TotalPosts):
			user.TotalPosts = (claim.Value != null && uint.TryParse(claim.Value, out var totalPosts)) ? totalPosts : 0;
			return true;
		case nameof(UserIdentity.TotalThreads):
			user.TotalThreads = (claim.Value != null && uint.TryParse(claim.Value, out var totalThreads)) ? totalThreads : 0;
			return true;
		default:
			return false;
	}
}
```
{% endcode %}

## 密码与秘密

`Password` 是核心库推荐的密码摘要结构。它把算法、指数、随机数和派生值打包在同一个值中，文本格式类似：

算法#指数:随机数|派生值。这是格式说明，真实序列化与验证输入见 [PasswordTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Security/PasswordTest.cs)。

`Password.Generate(...)` 使用 PBKDF2 生成摘要；省略算法参数时默认使用 SHA256。`Verify(...)` 根据摘要中保存的算法、随机数和指数重新计算，因此已有 SHA1 摘要仍可继续验证。旧的 `PasswordUtility` 已标记为过时，新的实现应优先使用 `Password`；业务服务中的 `Passworder` 目前仍保留旧格式兼容路径，后续需要配合重哈希迁移。

`ISecretor` 和 `Secretor` 用于一次性秘密，例如短信验证码、邮箱验证码、找回密码令牌或敏感操作二次确认。默认实现把秘密保存到分布式缓存，支持：

| 能力 | 说明 |
| --- | --- |
| `GenerateAsync(...)` | 按名称生成秘密，并保存附加文本。 |
| `VerifyAsync(...)` | 校验秘密但不删除，适合有效期内可重复确认的场景。 |
| `RemoveAsync(...)` | 校验成功后删除，适合一次性消费。 |
| `Period` | 限制同一名称重复生成的最小间隔。 |
| `Transmitter` | 发送秘密，可接入短信、邮件、站内信和验证码校验。 |

{% hint style="warning" %}
验证码名称应包含业务场景和目标标识，可参照 Secretor.Transmitter.GetKey 对方案、目的地、模板、场景和通道的组合，并确保全局唯一。过宽的名称会导致不同用户或不同场景互相覆盖。
{% endhint %}

## 证书、签名与挑战

`ICertificate`、`ICertificateProvider<TCertificate>`、`ICertificateResolver` 和 `Certificate` 封装证书标识、颁发者、主体、有效期以及 RSA/X509 证书适配。`ISignaturer` 和 `ISecretor` 分别覆盖签名与秘密校验场景。

`IChallenger` 是认证后的补充质询点。认证器只负责“凭据是否正确”和“签发基础身份”，challenger 负责登录后的业务检查与 claims 增强。Discussions 的 UserChallenger 完成以下工作：

* 从主身份读取用户编号，并查询或创建 Discussions 用户资料。
* 创建资料时从身份命名空间确定 SiteId；已有资料保留自己的站点信息。
* 调用 OnVerify 扩展点，再创建 [Zongsoft.Discussions](https://github.com/Zongsoft/discussions/tree/main/src) 身份加入主体。
* 写入 SiteId、Gender、Avatar、Grade、TotalPosts 和 TotalThreads 声明。

当前 OnVerify 是空实现，不能据此宣称已校验账号启用状态、站点状态或许可范围；这些业务准入规则需要由实际模块补充。资料统计声明也是签发时的快照，不会随每次发帖自动刷新。

这种拆分能让密码登录、验证码登录等不同认证方式共享同一组业务质询规则。

## 异常与原因

所有安全相关异常都继承自 `SecurityException`。`SecurityReasons` 提供稳定原因码，例如：

| 原因 | 常见场景 |
| --- | --- |
| `InvalidIdentity` | 身份不存在、编号无效或无法签发身份。 |
| `InvalidPassword` | 密码错误。 |
| `AccountDisabled`、`AccountSuspended` | 账号不可用或尝试次数过多。 |
| `Forbidden` | 认证通过后不满足业务准入条件。 |
| `VerifyFaild` | 验证码或秘密校验失败。 |

业务代码应优先抛出带原因码的 `AuthenticationException` 或 `AuthorizationException`，便于 Web 层、日志、监控和前端统一处理。

## 相关页面

* [Zongsoft.Security.Privileges](security/privileges.md)
* [安全模块概览](../security.md)
* [插件框架](../plugins/README.md)
* [数据访问接口](../data/data-access.md)
