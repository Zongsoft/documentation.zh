---
description: Zongsoft.Components 命名空间及其子命名空间的职责。
icon: cubes
---

# Zongsoft.Components

`Zongsoft.Components` 是核心类库中的组件模型命名空间，覆盖命令、特性、转换器、可监管对象、工作者、标识和事件交换等基础构件。

## 主要职责

* 定义组件标识、别名、权重、版本、命名对象和服务描述。
* 提供命令模型、命令节点、命令表达式、命令出口和参数绑定。
* 提供可监管对象、工作者、断路器、尝试器等运行时组件模式。
* 提供常用转换器和组件特性扩展。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Components.Commands` | 命令节点、命令执行、命令参数、命令别名和命令出口。 |
| `Zongsoft.Components.Converters` | 布尔、枚举、版本、架构等常用转换器。 |
| `Zongsoft.Components.Features` | 断路器等组件特性模型。 |
| `Zongsoft.Components.States` | 状态机、状态图、状态上下文、状态处理器和状态流转。 |

## 类型

<table data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th data-card-target data-type="content-ref"></th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td>命令：低耦合的跨领域调用模型、命令行解析和终端交互基础。</td>
			<td><a href="components/commands.md">commands.md</a></td>
		</tr>
		<tr>
			<td>事件：事件描述、事件定位、事件交换和插件化处理器挂载。</td>
			<td><a href="components/events.md">events.md</a></td>
		</tr>
		<tr>
			<td>Worker：可启动、停止、暂停、恢复的后台工作者模型。</td>
			<td><a href="components/worker.md">worker.md</a></td>
		</tr>
		<tr>
			<td>Executor：把处理逻辑、上下文和 Feature 管线组合为可执行单元。</td>
			<td><a href="components/executor.md">executor.md</a></td>
		</tr>
		<tr>
			<td>Handler：处理器抽象、选择器和插件化处理器集合。</td>
			<td><a href="components/handler.md">handler.md</a></td>
		</tr>
		<tr>
			<td>Filter：围绕上下文执行前后处理的过滤器接口。</td>
			<td><a href="components/filter.md">filter.md</a></td>
		</tr>
		<tr>
			<td>Superviser：面向可监管对象的观察、失效和恢复模型。</td>
			<td><a href="components/superviser.md">superviser.md</a></td>
		</tr>
		<tr>
			<td>Weighter：平滑加权轮询选择器。</td>
			<td><a href="components/weighter.md">weighter.md</a></td>
		</tr>
		<tr>
			<td>标识：对象标识抽象和统一标识值。</td>
			<td><a href="components/identifier.md">identifier.md</a></td>
		</tr>
		<tr>
			<td>版本：可比较、可持久化为整数的四段版本值。</td>
			<td><a href="components/version.md">version.md</a></td>
		</tr>
		<tr>
			<td>Discriminator：让容器按内容识别子集合或目标类型。</td>
			<td><a href="components/discriminator.md">discriminator.md</a></td>
		</tr>
		<tr>
			<td>Feature：Retry、Fallback、Breaker、Throttle、Timeout 等执行特性。</td>
			<td><a href="components/feature.md">feature.md</a></td>
		</tr>
		<tr>
			<td>Attempter：失败尝试次数统计和锁定窗口控制。</td>
			<td><a href="components/attempter.md">attempter.md</a></td>
		</tr>
		<tr>
			<td>AliasAttribute：为类型、成员、参数等声明别名。</td>
			<td><a href="components/alias-attribute.md">alias-attribute.md</a></td>
		</tr>
		<tr>
			<td>Converters：组件层常用类型转换器。</td>
			<td><a href="components/converters.md">converters.md</a></td>
		</tr>
	</tbody>
</table>

{% content-ref url="components/states.md" %}
[states.md](components/states.md)
{% endcontent-ref %}

## 相关资源

* [Components 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
