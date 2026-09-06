---
description: 从 Discussions 模块实例、验证器和命令依赖理解插件构件与容器服务。
icon: book-open
---

# 构件与服务


构件是插件树中的对象及其装配描述，服务是通过容器解析的能力。一个模块实例可以同时被插件树引用，并通过自己的服务容器组织业务对象。

## 复用已有对象

来源：[src/Zongsoft.Discussions.plugin](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.plugin#L20)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.plugin" %}
```xml
<extension path="/Workbench/Modules">
	<object name="Discussions" value="{static:Zongsoft.Discussions.Module.Current, Zongsoft.Discussions}">
		<expose name="Accessor" value="{path:../@Accessor}">
			<expose name="Filters" value="{path:../@Filters}" />
		</expose>

		<expose name="Events" value="{path:../@Events}" />
		<expose name="Properties" value="{path:../@Properties}" />
	</object>
</extension>
```
{% endcode %}

这里使用 value 引用已有 Module.Current，避免创建第二个模块。type 形式则用于让构建器创建新对象；验证器与过滤器使用这一方式。

## 服务从程序集发现

来源：[src/Services/ForumService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ForumService.cs#L41)（节选；上下文见源文件）。

{% code title="ForumService.cs" %}
```csharp
[Service(nameof(ForumService))]
[DataService(typeof(ForumCriteria))]
public class ForumService : DataServiceBase<Forum>
{
	#region 构造函数
	public ForumService(IServiceProvider serviceProvider) : base(serviceProvider) { }
```
{% endcode %}

程序集被加载和扫描后，Service 特性描述注册。ForumService 的构造函数接收服务提供者，后续访问器与关联服务使用该范围。

## 命令依赖业务服务

来源：[src/Services/Commands/MessageSendCommand.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/Commands/MessageSendCommand.cs#L58)（节选；上下文见源文件）。

{% code title="MessageSendCommand.cs" %}
```csharp
[ServiceDependency(Provider = Module.NAME)]
public MessageService Service { get; set; }
```
{% endcode %}

属性注入指定 Discussions 模块提供者。命令类存在并不表示它已经进入终端命令树；当前 Discussions.plugin 没有挂载 MessageSendCommand，因此不能直接编造一个可运行的 send 命令教程。命令本身的真实逻辑见[命令](../core/components/commands.md)。

## 生命周期与所有权

不要把请求身份放入共享构件，也不要逐次释放容器拥有的服务。需要有状态操作时应使用明确的调用上下文。服务找不到时先判断失败发生在程序集扫描、模块选择还是构件注入阶段，详见[服务定位](../core/services/locating.md)。
