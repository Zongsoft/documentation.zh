---
description: Notification 变更令牌工具。
icon: message
---

# Notification

`Notification` 用于创建或获取变更令牌，常与缓存依赖、配置刷新和状态观察配合。

| 成员 | 说明 |
| --- | --- |
| `Notified` | 永远处于已变更状态的令牌。 |
| `GetToken(CancellationToken)` | 将可取消令牌包装为变更令牌。 |
| `GetToken(CancellationTokenSource)` | 从取消源创建变更令牌；传入 `null` 时返回 `Notified`。 |

{% code title="Notification.cs" %}
```csharp
using var source = new CancellationTokenSource();
var token = Notification.GetToken(source);

source.Cancel();
Console.WriteLine(token.HasChanged);
```
{% endcode %}

`Notified` 适合表达立即失效的依赖，例如需要强制缓存项创建后即过期的场景。

## 相关资源

* [Notification.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Notification.cs)
