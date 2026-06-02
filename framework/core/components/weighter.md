---
description: Zongsoft.Components Weighter 平滑加权轮询选择器。
icon: scale-balanced
---

# Weighter

`Weighter<T>` 是一个平滑加权轮询选择器。它适合在多个候选项之间按权重分配请求，同时避免传统加权轮询在短时间内过度集中到高权重节点。

它是进程内的轻量选择器，不保存外部分布式状态。多个进程各自持有 `Weighter<T>` 时，只能保证各自进程内的平滑分配。

## 基本原理

平滑加权轮询会为每个候选项维护当前权重。每次选择时，算法先给所有候选项累加其静态权重，再选择当前权重最高的候选项，最后把该候选项的当前权重减去总权重。经过多个周期后，高权重候选项被选中的次数更多，但结果会尽量均匀地分布在序列中。

{% code title="平滑加权轮询示意" %}
```text
A:5 B:1 C:1

选择序列可能接近：
A, A, B, A, C, A, A
```
{% endcode %}

## 常用成员

| 成员 | 说明 |
| --- | --- |
| `Add(value, weight)` | 添加一个候选项及其权重。 |
| `Remove(value)` | 移除候选项。 |
| `Get()` | 选择下一个候选项。 |
| `Clear()` | 清空全部候选项。 |
| `Count` | 获取当前候选项数量。 |

## 适用场景

* 多个短信供应商之间按容量或成本分摊发送量。
* 多个网关、连接、队列消费者之间做平滑选择。
* 同一个功能有多个处理器时，按优先级或权重选择执行者。
* 在本地进程内做轻量负载均衡，不需要引入外部负载均衡器。

{% code title="短信供应商选择" %}
```csharp
var weighter = new Weighter<string>([]);

weighter.Add("primary-sms", 5);
weighter.Add("backup-sms", 2);
weighter.Add("low-cost-sms", 3);

var provider = weighter.Get();
await SendAsync(provider, message, cancellation);
```
{% endcode %}

{% hint style="info" %}
构造函数需要初始候选集合；后续可以通过 `Add(...)` 和 `Remove(...)` 动态调整候选项。权重小于 1 时会被修正为最小有效权重。
{% endhint %}

`Weighter<T>` 适合本地进程内的轻量流量分摊。需要全局配额、跨进程一致性或实时健康检查时，通常应使用更完整的负载均衡或调度机制。候选项为空时 `Get()` 返回目标类型默认值，调用方应处理空集合情况。

## 参考

* [Weighter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Weighter.cs)
* [平滑的加权轮询均衡算法](https://blog.zongsoft.com/ping-hua-de-jia-quan-lun-xun-jun-heng-suan-fa)
