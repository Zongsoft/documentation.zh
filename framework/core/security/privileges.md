---
description: Zongsoft.Core 中 Zongsoft.Security.Privileges 的权限模型、认证器、授权器和默认实现。
icon: user-shield
---

# Zongsoft.Security.Privileges

`Zongsoft.Security.Privileges` 是核心库中的身份认证与权限模型命名空间。它定义用户、角色、成员关系、权限定义、认证器、授权器、权限服务和权限计算规则；默认数据库实现位于 `D:\Zongsoft\framework\Zongsoft.Security`，业务系统可以继承这些基类并替换存储模型。

## 核心理念

Privileges 的设计不是把权限写死在接口、控制器或页面上，而是把“权限定义”和“授权结果”分开：

| 概念 | 类型 | 说明 |
| --- | --- | --- |
| 权限定义 | [`Privilege`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/Privilege.cs)、`Privilege.Permission` | 插件声明出来的权限树，说明系统有哪些可授权能力。 |
| 授权记录 | [`IPrivilege`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IPrivilege.cs)、[`IPrivilegable`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IPrivilegable.cs) | 数据库存储的“某个用户或角色被授予/拒绝了哪些权限”。 |
| 授权目标 | `Privilege.Permission.Target` | 业务资源或功能点，例如 `Branch`、`Employees`、`SaleOrder`。 |
| 授权操作 | `Privilege.Permission.Action` | 对目标的动作，例如 `Get`、`Query`、`Create`、`Update`、`Delete`，空操作按 `*` 处理。 |
| 权限主体 | [`IUser`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IUser.cs)、[`IRole`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/IRole.cs)、[`Member`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Privileges/Member.cs) | 用户、角色，以及用户或角色加入角色后的成员关系。 |

一句话概括：插件负责声明“系统有什么权限”，数据库负责记录“谁被授予或拒绝了什么”，运行时负责根据角色继承和拒绝规则算出最终结果。

## 权限树

权限树由 `PrivilegeCategory` 和 `Privilege` 组成。分类用于导航和组织，权限用于表达一个可授权能力；一个权限可以包含多个 `Permission`，也就是多个目标与动作组合。

{% code title="Automao.Common.Privileges.plugin" %}
```xml
<extension path="/Workbench/Security/Authorization/Authorizer">
	<object name="Settings" type="Category">
		<object name="Branch" type="Category">
			<object name="Branch.Query" type="Privilege" required="true" tags="alias:query">
				<object target="Branch" action="Get" />
				<object target="Branch" action="Query" />
				<object target="Branch" action="Export" />
			</object>
			<object name="Branch.Update" type="Privilege" tags="alias:save-update">
				<object target="Branch" action="Update" />
			</object>
		</object>
	</object>
</extension>
```
{% endcode %}

上面的声明表达了两层含义：

* 展示层和授权配置层看到的是 `Settings/Branch/Branch.Query` 这样的权限树。
* 运行时检查某个资源动作时，可以通过 `Privileger.FindAll("Branch", "Query")` 找到包含该目标动作的权限定义。

`Privilege.PermissionCollection.Contains(target, action)` 支持通配动作 `*`。因此 `new Permission("Branch", "*")` 可以覆盖 `Branch:Get`、`Branch:Query`、`Branch:Update` 等所有动作。

{% hint style="info" %}
权限名称建议稳定、短小、可读，例如 `Employees.Query`。目标与动作建议对应业务服务或 API 的资源语义，例如 `Employees:Query`、`Employees:Export`。不要把临时页面文案或按钮标题直接当作权限名。
{% endhint %}

## 权限本地化

`Privilege` 和 `PrivilegeCategory` 会按约定从资源中读取标题与说明。常见资源键如下：

| 对象 | 资源键示例 |
| --- | --- |
| 分类标题 | `Privilege.Settings.Category`、`Privilege.Settings.Branch.Category` |
| 权限标题 | `Privilege.Branch.Query`、`Privilege.Employees.Update` |
| 权限说明 | `Privilege.Branch.Query.Description` |

业务系统公共模块在 `Automao.Common.Privileges.plugin` 中声明权限树，并在 `Properties/Resources*.resx` 中提供显示文本。这让权限名保持稳定，界面文案可以本地化。

## 用户、角色与成员

`IUser` 与 `IRole` 都继承 Zongsoft 的可标识模型，核心属性包括名称、启用状态、头像、昵称、命名空间和描述。`IUser.Administrator` 与 `IRole.Administrators` 是框架约定的管理员名称。

`Member` 表示角色成员，成员可以是用户，也可以是角色：

| 成员类型 | 含义 |
| --- | --- |
| `MemberType.User` | 用户加入角色。 |
| `MemberType.Role` | 角色加入角色，形成角色继承。 |

默认数据库中的 `Member` 表用 `RoleId + MemberId + MemberType` 保存成员关系。业务系统实现沿用这个结构，但角色和用户模型增加了 `TenantId`、`BranchId`、审计字段和业务字段。

## 认证链路

认证入口是 `Authentication.AuthenticateAsync(...)`：

1. 根据 scheme 从 `Authentication.Authenticators` 找到 `IAuthenticator`。
2. 调用 `VerifyAsync(...)` 校验输入凭据并返回票证。
3. 调用 `IssueAsync(...)` 把票证签发成 [`ClaimsIdentity`](https://learn.microsoft.com/zh-cn/dotnet/api/system.security.claims.claimsidentity) _[源码](https://source.dot.net/#System.Security.Claims/ClaimsIdentity.cs)_。
4. 创建 `CredentialPrincipal`，携带 `CredentialId`、`RenewalToken`、`Scenario` 和 `Validity`。
5. 依次执行 `Authentication.Challengers`。
6. 通过 `Authentication.Authority` 注册凭证。
7. 触发 `Authenticating` 和 `Authenticated` 事件。

核心库提供两个认证器基类：

| 基类 | 默认 scheme | 输入 | 适用场景 |
| --- | --- | --- | --- |
| `Authentication.IdentityAuthenticatorBase` | 空字符串 | 命名空间、身份、密码 | 用户名、邮箱、手机号加密码登录。 |
| `Authentication.SecretorAuthenticatorBase` | `Secret` | 验证码或一次性秘密 | 短信验证码登录、邮箱验证码登录、找回密码确认。 |

默认安全插件把实现挂载到 `/Workbench/Security/Authentication`：

{% code title="Zongsoft.Security.plugin" %}
```xml
<extension path="/Workbench/Security/Authentication">
	<object name="Identity" value="{static:Zongsoft.Security.Privileges.Authenticators.Identity, Zongsoft.Security}" />
	<object name="Secretor" value="{static:Zongsoft.Security.Privileges.Authenticators.Secretor, Zongsoft.Security}" />
</extension>
```
{% endcode %}

## 业务质询

`IChallenger` 在认证器签发身份之后执行，适合放业务准入规则和 claims 增强。业务系统把站点差异放在各站点的 `UserChallenger` 中，并通过插件挂载到 `Authentication.Challengers`：

{% code title="Automao.Security.Services.plugin" %}
```xml
<extension path="/Workbench/Security/Authentication/Challengers">
	<object value="{static:Automao.Security.Privileges.UserChallenger.Instance, Automao.Security.Services}" />
</extension>

<extension path="/Workbench/Security/Authentication/Transformers">
	<object value="{static:Automao.Security.Privileges.UserIdentity+Transformer.Instance, Automao.Security.Services}" />
</extension>
```
{% endcode %}

业务系统 business 站点的 challenger 在登录后补充：

* `TenantId`、`BranchId`、`TenantTypeId`、`Country`、`Language`。
* 当前用户可访问的分支机构集合 `Branches`。
* 当前员工允许的登录场景 `Scenarios`。
* 租户许可与员工模块交集后的 `Licenses`。
* 用户所属角色名，用于标准 role claim 判断。

随后 `UserIdentity.Transformer` 把这些 claims 转成强类型 `UserIdentity`，业务代码通过 `Identity.Current` 获取当前租户和用户信息。

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

业务系统数据库在 `Privilege` 和 `PrivilegeFiltering` 表中增加 `TenantId`，用于多租户分区。它的 `PrivilegeService` 继承 `PrivilegeServiceBase<TPrivilege>`，重写数据访问条件和写入模型，同时在更新权限时刷新角色的 `ModifiedTime`。

{% code title="SetRolePrivileges.cs" %}
```csharp
var role = new Identifier(typeof(IRole), roleId);
var privileges = new[]
{
	new PrivilegeService.Privilege("Branch.Query", PrivilegeMode.Granted),
	new PrivilegeService.Privilege("Branch.Delete", PrivilegeMode.Denied),
};

await Authorization.Servicer.Privileges.SetPrivilegesAsync(role, privileges, parameters, cancellation);
```
{% endcode %}

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

{% code title="Authorize.cs" %}
```csharp
var identity = ApplicationContext.Current.Principal.GetIdentity("Identity");
var allowed = await Authorization.Authorizer.AuthorizeAsync(
	identity,
	"Branch.Query",
	new Parameters(),
	cancellation);

if(!allowed)
	throw new AuthorizationException(SecurityReasons.Forbidden);
```
{% endcode %}

{% hint style="warning" %}
默认 `AuthorizerBase` 以用户标识缓存最终权限集，缓存时长为 60 分钟。修改角色成员或授权记录后，业务实现需要考虑缓存刷新、凭证重建或缩短缓存时长，否则短时间内可能看到旧授权结果。
{% endhint %}

## 权限过滤

`IPrivilegeService.Filtering` 提供权限过滤服务。它不决定“有没有某权限”，而是描述“有该权限时，还应隐藏哪些字段或限制哪些范围”。默认数据库的 `PrivilegeFiltering.PrivilegeFilter` 是字符串表达式，例如：

```text
!Amount,!Details.Price,!Details.Discount,!Details.Quantity
```

这种能力适合数据查询、导出或详情接口的字段裁剪。调用方应先完成普通授权，再读取过滤服务并把过滤表达式交给数据层或业务层解释。

业务系统的覆写方式可以作为参考：

- 在默认安全表上增加租户、机构、审计和业务用户字段。
- 继承核心服务基类，替换模型、条件和写入逻辑。
- 按站点实现 `UserChallenger` 和 `UserIdentity`。
- 在 `*-privileges.plugin` 插件中挂载业务模块的权限定义树。

这种覆写方式遵循同一个模式：核心库给出抽象和计算规则，默认安全模块给出通用实现，业务系统只扩展业务边界和数据结构。

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
