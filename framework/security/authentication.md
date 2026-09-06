---
description: 理解登录、凭据续期撤销、角色权限与数据范围，核对 Web 接口的真实接入路径。
icon: user-shield
---

# 认证与授权

认证成功后得到的凭据是后续请求的身份证明。凭据的存在不能代替操作授权，角色名称也不能代替数据范围过滤。设计业务接口时，应把这几层分别验证。

## 登录与凭据生命周期

典型流程为：根据策略完成人机或带外验证，按已注册认证方案登录，保存返回凭据，后续请求通过对应认证处理器携带凭据，在到期前按策略续期，退出时撤销。

默认安全插件挂载 Identity 与 Secretor 等认证器。scheme 表示认证方式，scenario 表示登录场景；客户端不能自行假定任意名称都有效。准确请求模板可查[安全 HTTP 示例](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Security/docs/http)，并与当前部署的 OpenAPI 核对。

{% code title="Security.option（认证配置片段）" %}
```xml
<option path="/Security">
	<authentication period="08:00:00">
		<attempter limit="5" window="00:01:00" period="00:05:00" />
		<expiration>
			<scenario scenario.name="api" period="1.00:00:00" />
		</expiration>
	</authentication>
</option>
```
{% endcode %}

这些值展示配置形状，应用应根据实际使用场景选择期限与失败限制。登录成功后还要验证缓存中的凭据能被后续请求读取；多实例部署必须协调缓存和身份配置。

## Web 接入

Security.Web 的 AuthenticationController 提供登录、退出、续期与秘密签发核验。User、Role 和嵌套权限控制器维护相应状态，AuthorizationController 提供授权相关查询。

凭据方案的 Web 管线接入来自 Zongsoft.Web。插件宿主已经装配认证和授权中间件，具体策略和受保护端点仍由应用决定。遇到 401 先核对凭据方案与有效性，遇到 403 再核对主体、操作与数据范围；实际失败状态还应对照当前端点实现。

## 角色、成员与权限

用户和角色通过成员关系组织，角色可形成继承关系。直接权限与过滤权限具有不同职责：前者表达资源/操作允许与否，后者约束可操作的数据范围。管理接口修改成员或权限时，要区分追加和 reset 语义，避免把局部变更变成整组替换。

业务层应该经安全服务维护这些关系，避免直接修改表而遗漏相关不变量。对租户或命名空间中的资源，验证身份、目标资源归属和查询范围，不能只验证一个全局角色名。

## 应用验证清单

验证凭据时覆盖有效、过期、撤销和续期失败；验证权限时覆盖匿名、普通用户、允许和拒绝；验证数据范围时使用两个不同归属的对象，确保不能通过替换 URL 中的 ID 越界访问。

{% hint style="warning" %}
🚨 客户端超时或取消不证明权限变更已回滚。对于重试的用户、成员或权限管理操作，应重新读取状态或使用业务幂等机制。凭据、秘密和密码不应进入日志或查询字符串。
{% endhint %}

源码入口：[认证控制器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/api/Controllers/AuthenticationController.cs)、[持久化权限服务](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Security/src/Privileges)、[凭据提供者](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/CredentialProvider.cs)。
