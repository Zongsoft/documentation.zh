---
description: Zongsoft.Components Weighter 平滑加权轮询选择器。
icon: scale-balanced
---

# Weighter

`Weighter<T>` 是一个进程内的平滑加权轮询选择器。它适合在多个等价候选项之间按权重分配请求，例如多个数据源、供应商、网关、连接或处理器实例；权重越高，被选中的次数越多，但选择结果会尽量分散到整个调度序列中。

和普通加权轮询相比，`Weighter<T>` 的重点是“平滑”。如果权重为 `4:2:1`，普通轮询很容易得到 `A,A,A,A,B,B,C` 这类集中序列，而平滑加权轮询会更接近 `A,B,A,C,A,B,A`，从而避免高权重节点在短时间内被连续压上太多请求。

{% hint style="info" %}
关于算法背景、随机算法、一致哈希、Nginx 与 LVS 两类加权轮询算法的对比，可阅读《[平滑的加权轮询均衡算法](https://blog.zongsoft.com/ping-hua-de-jia-quan-lun-xun-jun-heng-suan-fa)》。
{% endhint %}

## 设计意图

`Weighter<T>` 解决的是本地选择问题：在一组候选项都可用、都能处理同类请求，但容量、成本或优先级不同的情况下，调用方希望按比例分配流量，同时尽量减少短时间内的请求突刺。

它不保存外部分布式状态，也不负责健康检查、失败熔断或全局配额。多个进程各自持有 `Weighter<T>` 时，只能保证各自进程内的选择序列平滑；如果需要跨进程一致性，通常应在更上层的负载均衡器、调度器或服务治理机制中处理。

## 算法过程

平滑加权轮询会为每个候选项维护当前权重。每次选择时，算法先给所有候选项累加其静态权重，再选择当前权重最高的候选项，最后把该候选项的当前权重减去总权重。经过多个周期后，高权重候选项被选中的次数更多，但结果会尽量均匀地分布在序列中。

设 `A`、`B`、`C` 的权重分别为 `4`、`2`、`1`，总权重为 `7`，一个完整周期的演算如下：

| 轮次 | 累加后当前权重 | 选中项 | 选中后当前权重 |
| --- | --- | --- | --- |
| 1 | `{ 4, 2, 1 }` | `A` | `{ -3, 2, 1 }` |
| 2 | `{ 1, 4, 2 }` | `B` | `{ 1, -3, 2 }` |
| 3 | `{ 5, -1, 3 }` | `A` | `{ -2, -1, 3 }` |
| 4 | `{ 2, 1, 4 }` | `C` | `{ 2, 1, -3 }` |
| 5 | `{ 6, 3, -2 }` | `A` | `{ -1, 3, -2 }` |
| 6 | `{ 3, 5, -1 }` | `B` | `{ 3, -2, -1 }` |
| 7 | `{ 7, 0, 0 }` | `A` | `{ 0, 0, 0 }` |

因此，一个周期内的命中次数符合 `4:2:1`，序列为 `A,B,A,C,A,B,A`，并在周期结束后回到初始状态。

## 常用成员

| 成员 | 说明 |
| --- | --- |
| `Weighter(entries, weightThunk)` | 使用候选集合和可选的权重解析函数创建选择器。 |
| `Add(value, weight)` | 添加一个候选项及其固定权重。 |
| `Add(value, weighter)` | 添加一个候选项，并通过函数计算该候选项的权重。 |
| `Remove(value)` | 移除候选项。 |
| `Get()` | 选择下一个候选项。 |
| `Clear()` | 清空全部候选项。 |
| `Count` | 获取当前候选项数量。 |

构造函数会忽略初始集合中的 `null` 候选项。未提供权重解析函数时，默认权重为 `100`；最终有效权重不会小于 `1`。如果通过 `Add(value, weight)` 添加候选项并传入非正数权重，则会回退到默认权重。

## 适用场景

* 数据访问框架按读写模式和权重选择数据源。
* 多个短信供应商之间按容量或成本分摊发送量。
* 多个网关、连接、队列消费者之间做平滑选择。
* 同一个功能有多个处理器时，按优先级或权重选择执行者。
* 在本地进程内做轻量负载均衡，不需要引入外部负载均衡器。

{% code title="SelectServer.cs" %}
```csharp
using Zongsoft.Components;

var servers = new[]
{
	new Server("primary", 5),
	new Server("backup", 2),
	new Server("low-cost", 3),
};

var weighter = new Weighter<Server>(servers, server => server.Weight);

var server = weighter.Get();

if(server != null)
	await SendAsync(server, message, cancellation);

public sealed record Server(string Name, int Weight);
```
{% endcode %}

## 使用注意

`Get()` 每调用一次都会推进内部当前权重，所以它不是纯查询方法。调用方应把 `Weighter<T>` 视为有状态选择器，而不是可重复读取同一结果的缓存。

候选项为空时，`Get()` 返回目标类型默认值。对引用类型而言通常是 `null`，调用方应在发送请求、建立连接或执行处理器前处理空集合情况。

候选项可通过 `Add(...)`、`Remove(...)` 和 `Clear()` 动态调整。对于临时不可用的节点，建议先从选择器中移除，或在创建选择器前完成可用性过滤；`Weighter<T>` 本身不会探测节点健康状态，也不会根据调用失败自动降低权重。

## 相关实现

`Zongsoft.Data` 的数据源选择器会分别为可读、可写数据源维护 `Weighter<T>`，并根据数据访问方法选择读库或写库。这个场景体现了 `Weighter<T>` 的典型边界：它只负责在已筛选出的候选集合中按权重选择，下游的数据访问上下文、命令可变性和数据源模式仍由数据框架判断。

## 参考

* [Weighter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/Weighter.cs)
* [DataSourceSelector.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Common/DataSourceSelector.cs)
* [平滑的加权轮询均衡算法](https://blog.zongsoft.com/ping-hua-de-jia-quan-lun-xun-jun-heng-suan-fa)
