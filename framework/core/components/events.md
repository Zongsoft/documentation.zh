---
description: 从 Discussions 的事件注册表入口理解模块事件的装配边界。
icon: bolt
---

# 事件


模块事件为业务组件提供显式的事件入口。Discussions 的 Module 继承带事件注册表类型参数的 [ApplicationModule](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ApplicationModule.cs)，并在插件树中暴露 Events。

来源：[src/Module.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Module.cs#L56)（节选；上下文见源文件）。

{% code title="Module.cs" %}
```csharp
public sealed class EventRegistry : EventRegistryBase
{
	#region 构造函数
	public EventRegistry() : base(NAME)
	{
	}
	#endregion
```
{% endcode %}

当前 EventRegistry 没有声明论坛业务事件，因此不能把发帖、审核或消息发送描述为已经发布了事件。它只提供扩展位置。

## 插件暴露事件入口

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L26)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<expose name="Events" value="{path:../@Events}" />
<expose name="Properties" value="{path:../@Properties}" />
```
{% endcode %}

暴露注册表让插件体系能发现模块事件。添加事件仍需定义事件名称、载荷、触发时机、处理方式及失败策略。尤其要区分事务提交前和提交后，避免把未提交的数据发送给外部消费者。

## 框架中的完整参考

Discussions 尚无完整业务事件流程，可继续核对框架[组件事件实现](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Components)与[安全模块](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Security/src)的实际事件定义。事件与消息队列之间需要明确桥接，不能因为框架支持事件就推断论坛已经使用 Broker。

相关概念：[处理器](handler.md)、[消息队列](../../messaging.md)、[事务](../../data/transactions.md)。
