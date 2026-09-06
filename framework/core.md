---
description: Zongsoft.Core 核心类库的职责和主要命名空间。
icon: cube
---

# 核心类库

[`Zongsoft.Core`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 是 Zongsoft 框架的核心类库，不依赖第三方类库。它提供框架中被其它模块共享的基础抽象、工具类、服务模型和运行时能力。

## 主要能力

- 集合、转换、随机、枚举和常用扩展。
- 通讯、执行管线和组件模型。
- 配置、选项、INI Profile 和资源处理。
- 缓存、序列化、事务和轻量状态机。
- 安全、凭证、授权基础抽象。
- 服务容器、命令模型、后台工作者。
- 终端应用支持。

## 代码位置

```text
framework/Zongsoft.Core
```

## 命名空间

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
			<td><strong>通用基础</strong></td>
			<td>集合、常用工具、反射、资源和文本处理。</td>
			<td><a href="core/common.md">common.md</a></td>
		</tr>
		<tr>
			<td><strong>组件与服务</strong></td>
			<td>组件模型、命令、应用上下文、服务访问和分布式协作。</td>
			<td><a href="core/components.md">components.md</a></td>
		</tr>
		<tr>
			<td><strong>版本表达</strong></td>
			<td>语义化版本、四段式数值版本号和版本比较。</td>
			<td><a href="core/versioning/version.md">version.md</a></td>
		</tr>
		<tr>
			<td><strong>配置与数据抽象</strong></td>
			<td>配置绑定、选项文件、数据访问抽象和数据元数据。</td>
			<td><a href="core/configuration.md">configuration.md</a></td>
		</tr>
		<tr>
			<td><strong>运行时能力</strong></td>
			<td>缓存、通讯、消息、调度、序列化、事务和状态流转。</td>
			<td><a href="core/caching.md">caching.md</a></td>
		</tr>
		<tr>
			<td><strong>应用支撑</strong></td>
			<td>诊断、安全、终端、IO 和表达式处理。</td>
			<td><a href="core/diagnostics.md">diagnostics.md</a></td>
		</tr>
	</tbody>
</table>

## 何时阅读本节

当你需要理解其它模块里的通用类型、服务抽象、命令模型、选项配置或终端能力时，应先回到[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)。插件框架、数据引擎、Web 基础库等模块都会复用这里的基础抽象。

## 相关资源

* [Zongsoft.Core 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)
* [Zongsoft.Core README](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/README.md)
* [Zongsoft.Core NuGet 包](https://www.nuget.org/packages/Zongsoft.Core)
