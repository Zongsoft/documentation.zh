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

来源：[framework/Zongsoft.Core/src/Data/DataAccessBase.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/DataAccessBase.cs#L120)（节选；上下文见源文件）。

{% code title="DataAccessBase.cs" %}
```csharp
public IChangeToken Disposed => Notification.GetToken(_cancellation);
```
{% endcode %}

上面是框架数据访问器的 Disposed 属性。Discussions 从 Module.Accessor 取得访问器，提供者缓存该访问器时使用此属性作为依赖：释放访问器会触发失效，使下一次取得访问器时重新创建。完整链路见[内存缓存](../caching/memory-cache.md)。

Notification 本身不发送业务消息，也不持有重新加载逻辑；它把一次取消通知转换为缓存和配置组件可观察的变更信号。令牌失效后不能复位，需要下一轮观察时应创建新的取消源。

`Notified` 适合表达立即失效的依赖，例如需要强制缓存项创建后即过期的场景。

## 相关资源

* [Notification.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Notification.cs)
