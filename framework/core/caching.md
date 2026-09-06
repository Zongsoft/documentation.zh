---
description: Zongsoft.Caching 命名空间的职责和主要类型。
icon: database
---

# Zongsoft.Caching

`Zongsoft.Caching` 提供[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)中的缓存抽象和内存缓存实现，用于支撑进程内缓存、缓存过期、容量控制、缓冲刷新和缓存事件通知。

## 主要职责

* 定义 `IDistributedCache` 等缓存访问抽象。
* 提供 `MemoryCache`、`MemoryCacheOptions` 等进程内缓存实现和配置。
* 表达缓存过期策略、缓存优先级、淘汰原因和缓存变更事件。
* 提供 `Spooler<T>` 异步缓冲器，用于高频写入的批量刷新。
* 为其它模块提供统一的缓存依赖，而不是直接绑定某个具体缓存实现。

## 类型

<table data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th></th>
			<th data-hidden data-card-target data-type="content-ref">页面</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>MemoryCache</strong></td>
			<td>进程内缓存、过期策略、依赖令牌、淘汰事件和容量提醒。</td>
			<td><a href="caching/memory-cache.md">memory-cache.md</a></td>
		</tr>
		<tr>
			<td><strong>Spooler&lt;T&gt;</strong></td>
			<td>基于 Channel 的异步缓冲器，用于高频写入的批量刷新。</td>
			<td><a href="caching/spooler.md">spooler.md</a></td>
		</tr>
	</tbody>
</table>

## 相关资源

* [Caching 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Caching)
