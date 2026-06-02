---
description: Zongsoft.Components Weighter 平滑加权轮询选择器。
icon: scale-balanced
---

# Weighter

`Weighter<T>` 是一个平滑加权轮询选择器。它适合在多个候选项之间按权重分配请求，同时避免传统加权轮询在短时间内过度集中到高权重节点。

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

## 适用场景

* 多个短信供应商之间按容量或成本分摊发送量。
* 多个网关、连接、队列消费者之间做平滑选择。
* 同一个功能有多个处理器时，按优先级或权重选择执行者。
* 在本地进程内做轻量负载均衡，不需要引入外部负载均衡器。

{% code title="短信供应商选择" %}
```csharp
var weighter = new Weighter<string>();

weighter.Add("primary-sms", 5);
weighter.Add("backup-sms", 2);
weighter.Add("low-cost-sms", 3);

var provider = weighter.Get();
await SendAsync(provider, message, cancellation);
```
{% endcode %}

## 参考

* [Weighter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Weighter.cs)
* [平滑的加权轮询均衡算法](https://blog.zongsoft.com/ping-hua-de-jia-quan-lun-xun-jun-heng-suan-fa)
