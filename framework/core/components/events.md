---
description: Zongsoft.Components 事件描述、事件交换与插件化事件处理器。
icon: bolt
---

# 事件

`Zongsoft.Components` 的事件模型用于把领域事件从具体模块中抽象出来，再通过插件树挂载事件描述和事件处理器。它的核心价值是解耦：事件发布方不需要知道处理器来自哪个模块，处理器也可以通过插件部署在不同运行环境中。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `EventBinder` | 把实际事件源与事件描述绑定起来。 |
| `EventContext` | 事件执行上下文，承载事件名、参数、事件描述和处理状态。 |
| `EventDescriptor`、`EventDescriptorCollection` | 事件元数据和描述集合。 |
| `EventLocator` | 从插件路径或注册表中定位事件描述。 |
| `EventManager` | 管理事件描述、过滤器和处理流程。 |
| `EventExchanger` | 事件交换器，也是 `WorkerBase` 派生类，负责打开事件通道并交换事件上下文。 |
| `EventRegistryBase` | 事件注册表基类，适合模块集中声明事件。 |
| `IEventChannel` | 事件通道接口，负责承接事件上下文并投递到处理器。 |

## 插件化事件总线

事件总线的典型结构是：模块先定义事件描述，插件文件把事件暴露到 Workbench 路径下，其他模块再把处理器挂载到这些事件节点。这样新增处理器时通常只需要增加插件声明和处理器实现，不需要修改事件发布方。

{% code title="Zongsoft.Security.plugin" %}
```xml
<extension path="/Workbench/Modules">
	<object name="Security" value="{static:Zongsoft.Security.Module.Current, Zongsoft.Security}">
		<expose name="Events" value="{path:../@Events}" />
		<expose name="Properties" value="{path:../@Properties}" />
	</object>
</extension>

<!-- 事件声明 -->
<extension path="/Workbench/Modules/Security/Events">
	<expose name="Authentication" value="{path:../@Authentication}">
		<expose name="Authenticated" value="{path:../@Authenticated}" />
		<expose name="Authenticating" value="{path:../@Authenticating}" />
	</expose>
</extension>
```
{% endcode %}

`Zongsoft.Security` 的 `Module.Events.cs` 使用 `EventRegistryBase` 声明认证相关事件，并把事件描述绑定到认证模块的实际事件上。业务模块可以参照同样方式，把采集、测量、状态变化等事件发布出来，再通过 daemon 插件挂载处理器集合。

## 执行过程

{% stepper %}
{% step %}
## 注册事件

模块通过 `EventRegistryBase` 创建 `EventDescriptor`，并把事件描述放入插件树或事件注册表。
{% endstep %}

{% step %}
## 触发事件

业务代码构造 `EventContext`，或调用 `EventExchanger.RaiseAsync(...)` 以名称和参数触发事件。
{% endstep %}

{% step %}
## 定位处理器

`EventLocator` 根据事件名找到事件描述和插件节点，事件通道再取得挂载在该节点下的处理器集合。
{% endstep %}

{% step %}
## 交换与投递

`EventExchanger` 作为工作者打开通道，把上下文交给 `IEventChannel`，由通道完成处理器投递。
{% endstep %}
{% endstepper %}

<details>
<summary>适合使用事件总线的场景</summary>

认证成功后写审计日志、设备状态变化后推送告警、订单支付后触发积分和通知、数据采集完成后进行聚合计算，这些都适合使用事件总线。事件发布方只负责“发生了什么”，扩展模块通过插件挂载处理器来决定“接下来做什么”。
</details>

## 参考实现

* [Module.Events.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Module.Events.cs)
* [Zongsoft.Security.plugin](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Security/src/Zongsoft.Security.plugin)
* [Components 事件源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)
