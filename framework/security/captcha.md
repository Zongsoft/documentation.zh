---
description: 使用 Authencode 图片挑战和短期确认令牌，理解两阶段核验、缓存及重放边界。
icon: fingerprint
---

# 验证码与确认令牌

Authencode 使用图片挑战降低自动化滥用。它先验证答案，再签发一个供后续业务流程消费的短期确认令牌。因此，显示图片、提交答案和消费确认是三个步骤，不应把挑战令牌直接当成已经验证的结果。

## 前置条件

部署 Zongsoft.Security.Captcha 及主 Security 插件，HTTP 场景还需要 Security.Web。宿主应提供框架的分布式缓存契约；多实例必须使用共享缓存，否则不同节点可能找不到同一挑战。

{% code title="Captcha.deploy（追加片段）" %}
```ini
[plugins zongsoft security captcha]
nuget:Zongsoft.Security.Captcha
```
{% endcode %}

## 客户端流程

1. 通过已部署的验证码端点请求 Authencode 方案。
2. 显示返回的 PNG，并从 `X-Captcha` 响应头保留挑战令牌。
3. 将用户答案与挑战令牌组成 `token:code` 提交，提供者也接受 `token=code`。
4. 保存验证成功后返回的确认令牌，将它交给要求验证码的业务流程。
5. 业务最终核验确认令牌，消费对应的确认缓存项并删除原挑战。

浏览器跨域使用时还要确认响应头可被前端读取；反向代理不能丢弃 `X-Captcha`。图片渲染失败时检查目标环境字体和图像依赖。

## 有效期与一次性语义

当前实现的挑战有效期为 10 分钟，确认令牌有效期为 5 分钟。最终核验通过缓存的移除并取值操作消费确认项，同一个确认令牌不能再次成功使用。

{% hint style="warning" %}
🚨 答案验证成功本身不会立即删除挑战。最终消费前，同一挑战可以产生多个确认令牌，因此不能把整个挑战流程描述为严格单次使用。业务还需要自己的请求限速和操作幂等规则。
{% endhint %}

## 集成时应验证什么

分别测试错误答案、挑战过期、确认过期、重复确认和跨节点确认。只调用图片生成器得到一张 PNG，并没有验证缓存、令牌与业务确认流程。

验证码用于防滥用，不证明用户身份。需要提供适合无法完成图片挑战用户的替代流程，也不要把答案或令牌写入日志。

实现依据：[AuthencodeCaptcha](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/captcha/AuthencodeCaptcha.cs)、[验证码控制器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/api/Controllers/CaptchaController.cs)。
