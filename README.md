---
description: Zongsoft 开发框架、宿主程序与工具链的中文文档中心。
icon: book-open
---

# Zongsoft 开发框架

![Zongsoft 文档封面](.gitbook/assets/zongsoft-docs-cover.png)

Zongsoft 是一组面向 .NET 的开源框架、宿主程序和开发工具，核心目标是帮助团队构建可插件化、可部署、可维护的业务应用。

主要内容包括：

{% columns %}
{% column %}
### 开发框架

提供核心抽象、插件框架、数据引擎、Web 基础、安全、诊断、消息、自动升级以及常见第三方服务适配。
{% endcolumn %}

{% column %}
### 宿主与工具

宿主程序负责承载插件式应用；工具链负责部署插件、制作安装包、发布升级包和辅助开发调试。
{% endcolumn %}
{% endcolumns %}

## 快速导航

<table data-card-size="large" data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th></th>
			<th data-hidden data-card-target data-type="content-ref">页面</th>
			<th data-hidden data-card-cover data-type="image">封面</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><strong>了解整体设计</strong></td>
			<td>从框架、宿主和工具链的边界开始建立全局图景。</td>
			<td><a href="overview/what-is-zongsoft.md">what-is-zongsoft.md</a></td>
			<td><a href=".gitbook/assets/zongsoft-docs-cover.png">zongsoft-docs-cover.png</a></td>
		</tr>
		<tr>
			<td><strong>从本地环境开始</strong></td>
			<td>准备 SDK、源码、目录和可选容器环境。</td>
			<td><a href="get-started/prerequisites.md">prerequisites.md</a></td>
			<td><a href=".gitbook/assets/zongsoft-start-cover.png">zongsoft-start-cover.png</a></td>
		</tr>
		<tr>
			<td><strong>理解插件化应用</strong></td>
			<td>理解插件树、构件、服务注册和宿主集成。</td>
			<td><a href="framework/plugins/README.md">plugins</a></td>
			<td><a href=".gitbook/assets/zongsoft-plugins-cover.png">zongsoft-plugins-cover.png</a></td>
		</tr>
		<tr>
			<td><strong>学习数据访问</strong></td>
			<td>用数据模式、映射文件和驱动完成对象图读写。</td>
			<td><a href="framework/data/README.md">data</a></td>
			<td><a href=".gitbook/assets/zongsoft-data-cover.png">zongsoft-data-cover.png</a></td>
		</tr>
	</tbody>
</table>

## 阅读路径

如果你是第一次接触 Zongsoft，建议按下面顺序阅读：

1. 从 [什么是 Zongsoft](overview/what-is-zongsoft.md) 了解整体边界。
2. 阅读 [插件化](overview/pluginization.md)，理解业务能力为什么以插件方式组织。
3. 按 [准备环境](get-started/prerequisites.md) 和 [安装包](get-started/install.md) 完成本地准备。
4. 选择一个 [宿主程序](get-started/hosting.md)，完成[最小部署](get-started/deploy-first-plugin.md)和[首个业务插件](get-started/first-business-plugin.md)。
5. 进入框架指南，按需要阅读[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)、插件框架、数据引擎、Web 基础等主题。

{% hint style="info" %}
本文档优先以“如何构建一个插件式应用”的路径组织内容，而不是按 NuGet 包逐个罗列。包名、源码路径和模块关系可以在 [包与模块索引](references/packages.md) 中查阅。
{% endhint %}

## 按问题深入

- 需要确定模块边界、设计扩展契约或逐步改造已有系统：阅读[插件化设计专题](overview/pluginization.md#插件化设计专题)。
- 不清楚宿主、模块、服务与提供者的关系：阅读[基础概念](overview/concepts.md)和[服务定位](framework/core/services/locating.md)。
- 需要业务数据与 HTTP 接口：从[首次查询](framework/data/quickstart.md)到[数据服务](framework/data/services.md)，再连接[Web 控制器](framework/web/controllers.md)。
- 需要异步工作和外部基础设施：阅读[消息投递概念](framework/messaging/concepts.md)、[任务调度](framework/externals/execution.md)及[扩展索引](framework/externals.md)。
- 需要模型调用、诊断或应用交付：进入[智能化](framework/intelligences.md)、[诊断](framework/diagnostics.md)和[升级流程](framework/upgrading/workflow.md)。
