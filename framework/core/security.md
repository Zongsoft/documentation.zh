---
description: Zongsoft.Security 命名空间及其子命名空间的职责。
icon: shield
---

# Zongsoft.Security

`Zongsoft.Security` 提供认证、授权、凭证、证书、声明身份、密码、验证码和权限基础模型。完整安全业务实现由 `Zongsoft.Security` 模块继续扩展。

## 主要职责

* 定义认证器、认证服务、授权器和授权服务抽象。
* 提供密码、验证码、证书和声明身份相关辅助能力。
* 提供授权异常、认证异常和权限验证基础类型。
* 支撑上层安全模块和 Web 认证集成。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Security.Privileges` | 权限、角色、成员和授权目标等权限模型。 |

## 相关资源

* [Security 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Security)
* [安全](../security.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
