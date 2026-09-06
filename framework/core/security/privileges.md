---
description: Zongsoft.Core 中 Zongsoft.Security.Privileges 的权限模型、认证器、授权器和默认实现。
icon: user-shield
---

# Zongsoft.Security.Privileges

`Zongsoft.Security.Privileges` 是核心库中的身份认证与权限模型命名空间。它定义用户、角色、成员关系、权限定义、认证器、授权器、权限服务和权限计算规则；默认数据库实现位于 [Zongsoft.Security 项目](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Security)，业务系统可以继承这些基类并替换存储模型。

## 核心理念

Privileges 的设计不是把权限写死在接口、控制器或页面上，而是把“权限定义”和“授权结果”分开：

| 概念 | 类型 | 说明 |
| --- | --- | --- |
| 权限定义 | [`Privilege`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/Privilege.cs)、`Privilege.Permission` | 插件声明出来的权限树，说明系统有哪些可授权能力。 |
| 授权记录 | [`IPrivilege`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IPrivilege.cs)、[`IPrivilegable`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IPrivilegable.cs) | 数据库存储的“某个用户或角色被授予/拒绝了哪些权限”。 |
| 授权目标 | `Privilege.Permission.Target` | 业务资源或功能点，由具体模块声明，不能仅凭数据表名推断。 |
| 授权操作 | `Privilege.Permission.Action` | 对目标的动作，例如 `Get`、`Query`、`Create`、`Update`、`Delete`，空操作按 `*` 处理。 |
| 权限主体 | [`IUser`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IUser.cs)、[`IRole`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IRole.cs)、[`Member`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/Member.cs) | 用户、角色，以及用户或角色加入角色后的成员关系。 |

一句话概括：插件负责声明“系统有什么权限”，数据库负责记录“谁被授予或拒绝了什么”，运行时负责根据角色继承和拒绝规则算出最终结果。

## 权限树

权限树由 `PrivilegeCategory` 和 `Privilege` 组成。分类用于导航和组织，权限用于表达一个可授权能力；一个权限可以包含多个 `Permission`，也就是多个目标与动作组合。

Discussions 当前没有声明独立的权限定义树。它在主题读取中直接判断审核状态、作者和版主关系；不能假定添加一个权限名称就自动改变这些业务规则。权限树本身的装配机制可阅读核心 [PrivilegeCategory](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/PrivilegeCategory.cs) 与[识别器](../components/discriminator.md)。

权限定义与权限检查是两个步骤：定义告诉配置界面有哪些可授权能力，检查负责在真正执行操作前计算主体是否被授予权限。PermissionCollection 支持目标与动作匹配，空动作按通配动作处理；命名权限与数据记录的授权状态仍需通过服务关联。

## 权限本地化

`Privilege` 和 `PrivilegeCategory` 会按约定从资源中读取标题与说明。资源键按权限名称、分类路径、Category 和 Description 等约定组合。具体查找顺序以 [Privilege](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/Privilege.cs) 和 [PrivilegeCategory](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/PrivilegeCategory.cs) 为准。名称用于稳定匹配，资源文本负责展示；Discussions 现有业务资源的组织见[资源管理](../resources.md)。

## 用户、角色与成员

`IUser` 与 `IRole` 都继承 Zongsoft 的可标识模型，核心属性包括名称、启用状态、头像、昵称、命名空间和描述。`IUser.Administrator` 与 `IRole.Administrators` 是框架约定的管理员名称。

`Member` 表示角色成员，成员可以是用户，也可以是角色：

| 成员类型 | 含义 |
| --- | --- |
| `MemberType.User` | 用户加入角色。 |
| `MemberType.Role` | 角色加入角色，形成角色继承。 |

默认数据库中的 `Member` 表用 `RoleId + MemberId + MemberType` 保存成员关系。Discussions 的 UserIdentity 实现 IUser 并增加 SiteId 等讨论业务信息，其论坛成员关系仍由模块自己的模型维护。

## 认证链路

认证入口是 `Authentication.AuthenticateAsync(...)`：

1. 触发 Authenticating 事件，根据 scheme 从 `Authentication.Authenticators` 找到 `IAuthenticator`。
2. 调用 `VerifyAsync(...)` 校验输入凭据并返回票证。
3. 调用 `IssueAsync(...)` 把票证签发成 [`ClaimsIdentity`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claimsidentity) _[源码](https://source.dot.net/#System.Security.Claims/ClaimsIdentity.cs)_。
4. 创建 `CredentialPrincipal`，携带 `CredentialId`、`RenewalToken`、`Scenario` 和 `Validity`。
5. 依次执行 `Authentication.Challengers`。
6. 通过 `Authentication.Authority` 注册凭证。
7. 触发 Authenticated 事件；异常分支也触发该事件，并携带错误。

核心库提供两个认证器基类：

| 基类 | 默认 scheme | 输入 | 适用场景 |
| --- | --- | --- | --- |
| `Authentication.IdentityAuthenticatorBase` | 空字符串 | 命名空间、身份、密码 | 用户名、邮箱、手机号加密码登录。 |
| `Authentication.SecretorAuthenticatorBase` | `Secret` | 验证码或一次性秘密 | 短信验证码登录、邮箱验证码登录、找回密码确认。 |

默认安全插件把实现挂载到 `/Workbench/Security/Authentication`：

来源：[framework/Zongsoft.Security/src/Zongsoft.Security.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.plugin#L55)（节选；上下文见源文件）。

{% code title="Zongsoft.Security.plugin" %}
```xml
<!-- 挂载身份验证器 -->
<extension path="/Workbench/Security/Authentication">
	<object name="Identity" value="{static:Zongsoft.Security.Privileges.Authenticators.Identity, Zongsoft.Security}" />
	<object name="Secretor" value="{static:Zongsoft.Security.Privileges.Authenticators.Secretor, Zongsoft.Security}" />
</extension>
```
{% endcode %}

## 业务质询

`IChallenger` 在认证器签发身份之后执行，适合放业务准入规则和 claims 增强。业务系统把站点差异放在各站点的 `UserChallenger` 中，并通过插件挂载到 `Authentication.Challengers`：

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L40)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
	<!-- 挂载身份质询器 -->
	<extension path="/Workbench/Security/Authentication/Challengers">
		<object value="{static:Zongsoft.Discussions.Security.UserChallenger.Instance, Zongsoft.Discussions}" />
	</extension>

	<!-- 挂载身份转换器 -->
	<extension path="/Workbench/Security/Authentication/Transformers">
		<object value="{static:Zongsoft.Discussions.Security.UserIdentity+Transformer.Instance, Zongsoft.Discussions}" />
	</extension>
```
{% endcode %}

Discussions 的 UserChallenger 追加站点身份，并写入 SiteId、头像、等级和发帖统计等声明。UserIdentity.Transformer 仅识别 Zongsoft.Discussions 认证方案，把这些声明转换为业务身份；业务代码通过 UserIdentity.Current 读取。完整源码与字段含义见[安全基础](../security.md)。

## 授权记录

授权记录由 `IPrivilegeService` 读写。默认数据库有两张授权表：

| 表 | 作用 |
| --- | --- |
| `Privilege` | 保存用户或角色对某个权限名的授权方式。 |
| `PrivilegeFiltering` | 保存某个权限下的字段或数据过滤表达式。 |

授权方式由 `PrivilegeMode` 表示：

| 值 | 含义 |
| --- | --- |
| `Granted` | 明确授予。 |
| `Denied` | 明确拒绝，计算时会压过同层级授予。 |
| `Revoked` | 撤回或空状态，默认实现通常把它视为没有有效授权。 |

默认安全插件提供通用权限存储。Discussions 没有增加 TenantId、BranchId 形式的权限表覆写；其站点查询边界通过 DataValidator 实现，不能将两种机制混为一谈。

Discussions 未实现独立的角色权限写入范例；默认数据库的写入路径见 [PrivilegeService](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Privileges/PrivilegeService.cs) 及 [PrivilegeServiceBase](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/PrivilegeServiceBase.cs)。调用时使用实际用户或角色标识，并由业务组合层明确授权记录的更新范围。

## 权限计算

授权判断入口是 `IAuthorizer.AuthorizeAsync(identity, privilege, parameters, cancellation)`。默认 `AuthorizerBase` 会先按用户标识缓存计算结果，再检查指定权限名是否在最终集合中。

默认 `PrivilegeEvaluator` 的计算流程是：

1. 把当前用户或角色标识转换成成员标识。
2. 通过 `IMemberService.GetAncestorsAsync(...)` 取出所有祖先角色，按层级由远及近返回。
3. 按层级读取每组角色的授权记录。
4. 读取当前用户或角色自己的授权记录。
5. 调用 `PrivilegeEvaluatorBase` 折叠所有声明。

折叠规则是“就近优先、同级拒绝优先”：

* 祖先层级先进入上下文，当前用户或当前角色最后进入上下文，所以越靠近当前主体的授权越晚处理。
* 同一层级中，`Denied` 会移除同名权限，并阻止同层级的 `Granted` 重新加入。
* 下一层级如果再次 `Granted`，可以覆盖更远层级的拒绝；这就是“就近优先”。

来源：[framework/Zongsoft.Core/src/Security/Privileges/AuthorizerBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/AuthorizerBase.cs#L67)（节选；上下文见源文件）。

{% code title="AuthorizerBase.cs" %}
```csharp
public virtual async ValueTask<bool> AuthorizeAsync(ClaimsIdentity user, string privilege, Parameters parameters, CancellationToken cancellation = default)
{
	if(user == null)
		return false;

	if(privilege == null)
		return false;

	var privileges = await _cache.GetOrCreateAsync(user.Identify(),
		key => (GetPrivilegesAsync((Identifier)key, cancellation), TimeSpan.FromMinutes(60)));

	return privileges.Contains(privilege);

	async Task<HashSet<string>> GetPrivilegesAsync(Identifier identifier, CancellationToken cancellation)
	{
		var privileges = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

		var results = this.Evaluator.EvaluateAsync(identifier, parameters, cancellation);
		await foreach(var result in results)
			privileges.Add(result.Privilege);

		return privileges;
	}
}
```
{% endcode %}

{% hint style="warning" %}
默认 `AuthorizerBase` 以用户标识缓存最终权限集，使用 60 分钟滑动过期。修改角色成员或授权记录后，业务实现需要考虑缓存刷新、应用拥有的缓存失效机制，否则短时间内可能看到旧授权结果。
{% endhint %}

## 权限过滤

`IPrivilegeService.Filtering` 提供权限过滤服务。它不决定“有没有某权限”，而是描述“有该权限时，还应隐藏哪些字段或限制哪些范围”。默认数据库的 `PrivilegeFiltering.PrivilegeFilter` 是字符串表达式，。Discussions 没有接入这套授权过滤表达式；它的 PostFilter 和 ThreadFilter 处理正文可见性，属于数据过滤器机制。真实实现见[过滤器](../components/filter.md)。

这种能力适合数据查询、导出或详情接口的字段裁剪。调用方应先完成普通授权，再读取过滤服务并把过滤表达式交给数据层或业务层解释。

扩展默认实现时，应分别核对模型、授权记录存储、主体身份和缓存失效；只替换用户模型不会自动改变所有权限查询条件。

## 使用建议

* 新增功能权限时，先在对应业务插件的 `*-privileges.plugin` 中声明分类、权限和目标动作，再补资源文本。
* 授权记录只保存权限名和授权方式，不要复制权限树结构。
* 多租户系统应在权限服务的数据条件中带入租户边界，避免跨租户读取授权记录。
* Claims 中保存租户、机构、角色名和许可摘要；实时敏感的授权结果仍通过 `IAuthorizer` 或 `IPrivilegeService` 查询。
* 角色继承不要过深。层级越深，授权解释越难，缓存失效也越容易被忽略。
* `Denied` 用于明确阻断继承权限；普通移除应使用 `Revoked` 或删除授权记录。

## 相关页面

* [Zongsoft.Security](../security.md)
* [插件文件与加载](../../plugins/plugin-file.md)
* [数据访问接口](../../data/data-access.md)
* [分层类](../collections/category.md)
