---
description: Zongsoft.Components 命名空间及其子命名空间的职责。
icon: cubes
---

# Zongsoft.Components

`Zongsoft.Components` 是[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)中的组件模型命名空间，覆盖命令、执行管线、处理器、过滤器、转换器、可监管对象、工作者、标识和事件交换等基础构件。它的目标不是提供某个具体业务能力，而是为不同领域的业务对象提供一组可组合、可扩展、可被宿主程序复用的运行时抽象。

## 主要职责

* 定义组件标识、别名、权重、命名对象和服务描述，让组件可以被发现、描述和选择。
* 提供命令模式、命令树、命令表达式解析、命令出口和参数绑定，用于跨领域、低耦合地触发业务动作。
* 提供执行管线、处理器和过滤器，把上下文、执行逻辑和横切特性组织为可扩展的执行单元。
* 提供[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)、监视器、均衡器、尝试器等运行时组件模式，用于后台任务、状态观测和失败控制。
* 提供常用转换器、状态机和组件特性扩展，降低基础设施代码的重复实现。

## 命令模式

命令模式是 `Zongsoft.Components` 中最常被跨模块复用的组件模型之一。它把一次操作描述为一段命令表达式，并由 `CommandExecutor` 在命令树中定位 `CommandNode`、创建 `CommandContext`、调用 `ICommand` 实例。命令不依赖特定容器或宿主：同一组命令既可以被后台服务或 Web 程序直接调用，也可以被终端宿主加载为交互式命令。

这种模式特别适合跨领域调用。调用方只需要知道“要执行什么动作”和“传递哪些参数”，不必引用具体服务接口。例如短信发送、队列订阅、文件操作、配置读取等能力，都可以通过命令表达式进入统一执行管线。通用命令的具体实现主要位于 `Zongsoft.Commands` 项目，终端程序中的命令交互则由 `Zongsoft.Terminals` 基于同一套模型实现。

{% content-ref url="components/commands.md" %}
[commands.md](components/commands.md)
{% endcontent-ref %}

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Components` | 命令模型的核心类型，例如 `ICommand`、`CommandBase`、`CommandContext`、`CommandNode`、`CommandLine` 和 `CommandExecutor`。 |
| `Zongsoft.Components.Commands` | 基于命令模型实现的内置组件命令，例如[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)的启动、停止、暂停、恢复和状态查询命令。 |
| `Zongsoft.Components.Converters` | 布尔、枚举、版本、架构等常用转换器。 |
| `Zongsoft.Components.Features` | Retry、Fallback、Breaker、Throttle、Timeout 等执行特性模型。 |
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
			<td>标识：对象标识抽象和统一标识值。</td>
			<td><a href="components/identifier.md">identifier.md</a></td>
		</tr>
		<tr>
			<td>AliasAttribute：为类型、成员、参数等声明别名。</td>
			<td><a href="components/alias-attribute.md">alias-attribute.md</a></td>
		</tr>
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
			<td>Discriminator：让容器按内容识别子集合或目标类型。</td>
			<td><a href="components/discriminator.md">discriminator.md</a></td>
		</tr>
		<tr>
			<td>Attempter：失败尝试次数统计和锁定窗口控制。</td>
			<td><a href="components/attempter.md">attempter.md</a></td>
		</tr>
		<tr>
			<td>Converters：组件层常用类型转换器。</td>
			<td><a href="components/converters.md">converters.md</a></td>
		</tr>
		<tr>
			<td>状态机：状态图、状态上下文、状态处理器和状态流转。</td>
			<td><a href="components/states.md">states.md</a></td>
		</tr>
		<tr>
			<td>执行管线：把 Executor、上下文和 Feature 特性组合为可执行单元。</td>
			<td><a href="components/executor.md">executor.md</a></td>
		</tr>
	</tbody>
</table>

## 相关资源

* [Components 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
