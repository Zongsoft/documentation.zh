---
description: 连接 核心类库 安全契约、持久化身份权限、Web 接口与验证码，建立完整的安全调用链。
icon: shield-halved
---

# 安全

Zongsoft 的安全能力分为公共契约、默认持久化实现和可选 Web 接口。[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 定义身份、凭据和权限等模型；Zongsoft.Security 实现用户、角色、成员与权限服务，并通过数据引擎保存；Web 和 Captcha 插件分别提供 HTTP 接口与人机挑战。

## 先分清三个问题

**身份验证**确认请求者是谁，例如校验身份与秘密并签发凭据。**授权**决定该主体能否对某资源执行操作。**人机挑战**降低自动化滥用，它既不是身份证明，也不替代授权。

例如用户成功登录后，仍可能没有删除订单权限；拥有订单读取权限，也不表示可以读取其它租户的订单。完整规则需要结合操作授权和数据范围，见[认证与授权](security/authentication.md)。

## 部署组成

{% code title="Security.deploy（片段）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft security]
nuget:Zongsoft.Security

[plugins zongsoft security web]
nuget:Zongsoft.Security.Web
```
{% endcode %}

在现有 Web 宿主中追加这些条目，并另行部署目标数据库驱动、配置 Security 连接、初始化相应数据库结构及凭据所需缓存。纯后台使用不需要 Web 子插件。部署器默认跳过部分 Zongsoft 传递依赖，所以部署方案要明确组合。

Security 清单挂载模块、身份验证器、授权器以及用户、角色、成员和权限服务。应用通常通过公共安全契约和服务 API 使用它们，不在控制器内构造持久化实现或直接改权限表。

## 初始化顺序

1. 核对[数据驱动和连接](data/connections.md)，使用测试数据库。
2. 根据目标数据库准备 [Security 数据库脚本](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Security/database)，保持它与映射版本一致。
3. 部署 Security 清单、选项、映射和依赖，配置凭据缓存及认证策略。
4. 验证一次成功登录、一次失败登录、一次已授权和一次被拒绝的操作，再验证续期和退出。

{% hint style="warning" %}
🚨 随包 identity 默认配置允许密码长度为 0、强度为 None，它们是框架默认值，不是生产策略。部署前应由应用明确密码、身份核验、凭据期限和管理角色。
{% endhint %}

## 配置入口

主要配置位于 `/Security/Identity`、`/Security/Authentication`、`/Security/Authorization`。认证配置包含期限、失败尝试窗口与场景期限；授权配置包含管理角色。配置文件必须按[选项匹配规则](../references/option-files.md)进入应用，不能只编辑未被加载的文件。

验证码独立接入，见[验证码与确认令牌](security/captcha.md)。基础权限模型见[核心权限](core/security/privileges.md)。

实现依据：[安全插件装配](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.plugin)、[默认选项](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.option)。
