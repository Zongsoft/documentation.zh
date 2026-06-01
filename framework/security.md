---
description: Zongsoft.Security 的认证、授权、密码、证书和验证码能力。
icon: shield-halved
---

# 安全

`Zongsoft.Security` 提供安全相关能力，包括认证、授权、密码、证书等基础功能。`Zongsoft.Security.Web` 提供 Web API 相关扩展，`Zongsoft.Security.Captcha` 提供人机识别能力。

## 主要包

- `Zongsoft.Security`
- `Zongsoft.Security.Web`
- `Zongsoft.Security.Captcha`

## 典型内容

- 身份验证。
- 授权控制。
- 密码相关能力。
- 证书处理。
- Web API 安全集成。
- 验证码和人机识别。

## 与宿主的关系

安全插件通常通过 `.deploy` 文件部署到宿主的 `plugins/zongsoft/security` 目录，并通过 `*.option` 文件配置环境相关参数。
