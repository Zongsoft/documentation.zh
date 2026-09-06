---
description: 理解 Zongsoft.Services 的应用上下文、服务注册、服务解析和插件服务发现。
icon: server
---

# Zongsoft.Services

`Zongsoft.Services` 是 Zongsoft 运行时的服务模型。它连接标准 .NET 依赖注入、应用上下文、应用模块和插件树，让宿主程序、插件程序集和声明式构件可以把能力注册到同一个运行时，并按应用、模块或插件树位置解析出来。

它不是要替代 .NET DI，而是在 [`IServiceCollection`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.dependencyinjection.iservicecollection) _[源码](https://source.dot.net/#Microsoft.Extensions.DependencyInjection.Abstractions/IServiceCollection.cs)_、`System.IServiceProvider` 和 [`IServiceProviderFactory<TContainerBuilder>`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.dependencyinjection.iserviceproviderfactory-1) _[源码](https://source.dot.net/#Microsoft.Extensions.DependencyInjection.Abstractions/IServiceProviderFactory.cs)_ 之上补充这些能力：

* 应用上下文：用 [`IApplicationContext`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IApplicationContext.cs) 表示当前应用实例，统一暴露配置、环境、模块、服务、事件、工作器和生命周期。
* 应用模块：用 [`IApplicationModule`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IApplicationModule.cs) 表示一个子系统或插件模块，并为模块提供自己的服务解析域。
* 服务发现：通过服务名称、标签、匹配参数、模块名和插件树表达式寻找服务，而不只按类型解析。
* 服务构建：通过 [`ServiceAttribute`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceAttribute.cs)、[`IServiceRegistration`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IServiceRegistration.cs)、[`ServiceDependencyAttribute`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceDependencyAttribute.cs) 和 [`ServiceProviderFactory`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceProviderFactory.cs) 把声明式注册、代码注册和属性注入串起来。
* 分布式协作：在 `Zongsoft.Services.Distributing` 中提供分布式锁和锁令牌等基础抽象。

## 运行时结构

在插件式应用中，服务模型通常形成三层：

| 层级 | 入口 | 作用 |
| --- | --- | --- |
| 应用服务容器 | `ApplicationContext.Current.Services` | 全局默认容器，承载宿主、插件和框架注册的服务。 |
| 模块服务容器 | `ApplicationContext.Current.Modules["模块名"].Services` | 以模块名为边界解析服务；模块内找不到时会回退到应用服务容器。 |
| 插件树构件 | `/Workspace/Environment/Services`、`/Workbench/...` | 声明式对象和扩展点；其中服务节点会被注册到应用服务容器，其他节点通常通过路径或构件解析器发现。 |

这种结构的设计意图是把“进程级基础设施”和“插件提供的业务能力”分开：宿主负责建立 Host 和服务容器，插件负责声明程序集、构件和扩展点，应用上下文负责把两者组织成可查询的运行时。

{% hint style="info" %}
插件树中的对象不一定都是 DI 服务。只有被程序集扫描注册、代码显式注册，或挂在 `/Workspace/Environment/Services` 下并由宿主构建流程加入服务集合的对象，才会进入服务容器。
{% endhint %}

## 注册来源

服务进入应用通常有四个来源。

### 代码注册

宿主或插件可以在 Host 构建阶段直接向服务集合添加服务。普通 .NET 服务生命周期仍然按 DI 规则生效，例如单例、作用域和瞬态。

{% code title="Program.cs" %}
```csharp
using Zongsoft.Plugins.Hosting;

var host = Application.Daemon(args, builder =>
{
	builder.Services.AddSingleton<IClock, SystemClock>();
});

await host.RunAsync();
```
{% endcode %}

代码注册适合宿主私有服务、启动入口相关服务，或需要明确生命周期的基础设施服务。

### 程序集扫描

插件宿主在构建应用时，会调用 [`ServiceCollectionExtension.Register`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceCollectionExtension.cs) 扫描程序集中的公共类型：

1. 先扫描入口程序集引用的程序集。
2. 再扫描入口程序集本身。
3. 再递归扫描已加载插件 `manifest` 中声明的程序集；同一个程序集只注册一次。

扫描时有两种注册模式：

| 模式 | 适用场景 | 行为 |
| --- | --- | --- |
| 实现 `IServiceRegistration` | 一个程序集需要集中注册多项服务、复杂生命周期或条件注册。 | 框架创建注册器实例，调用 `Register(services, configuration)`；注册器接管该类型的服务注册。 |
| 标注 `ServiceAttribute` | 类型本身就是服务，适合简单、约定化注册。 | 框架把实现类型注册为单例，并按契约、名称、标签和静态成员规则追加注册。 |

{% code title="GreetingService.cs" %}
```csharp
using Zongsoft.Services;
using System.Text.Json;

[Service<IGreetingService>("Greeting")]
public class GreetingService : IGreetingService
{
	public string Say(string name) => $"你好，{name}";
}
```
{% endcode %}

当 `ServiceAttribute` 指定名称时，框架会登记该名称，名称以 `Service` 结尾时还会登记去掉后缀后的短名。因此名为 `GreetingService` 的服务通常也可以按 `Greeting` 查找。

### 静态成员注册

如果服务对象本来就是静态属性或字段，可以通过 `ServiceAttribute.Members` 暴露成员值。框架会读取指定的公开静态成员，并按成员类型和显式契约注册为单例实例。

{% code title="CodecServices.cs" %}
```csharp
using Zongsoft.Services;

[Service(typeof(ITextCodec), Members = nameof(Default))]
public static class CodecServices
{
	public static ITextCodec Default { get; } = new JsonTextCodec();
}
```
{% endcode %}

这种方式适合无状态、全局唯一、已经由框架或第三方库提供的对象。需要依赖注入构造参数的服务，优先使用普通类型注册。

### 插件树服务节点

插件宿主还会查找 `/Workspace/Environment/Services` 节点，并把该节点下的每个子构件作为单例服务注册到应用服务集合中。服务类型来自构件的 `ValueType`，服务实例由构件在解析时创建或解包。

{% code title="Zongsoft.Example.plugin" %}
```xml
<extension path="/Workspace/Environment/Services">
	<object name="Greeting" type="Zongsoft.Example.GreetingService, Zongsoft.Example" />
</extension>
```
{% endcode %}

这种方式适合需要从插件文件声明、用 `{option:...}`、`{path:...}` 或 `{service:...}` 组装的服务。它的生命周期在当前宿主实现中按单例注册，因此不要把请求级状态、会话状态或必须频繁重建的对象放在这里。

## 服务解析

服务解析分为按类型、按名称、按标签和按匹配参数四类。

| 方式 | API | 说明 |
| --- | --- | --- |
| 类型解析 | `Resolve<T>()`、`ResolveRequired<T>()`、`ResolveAll<T>()` | 对标准 `GetService`、`GetRequiredService`、`GetServices` 的语义封装。 |
| 名称解析 | `Resolve("name")`、`ResolveRequired("name")` | 根据 `ServiceAttribute.Name` 登记的名称解析服务。 |
| 匹配解析 | `Find<T>(argument)`、`FindAll<T>(argument)` | 在同一契约的多个实现中查找匹配者。服务可实现 [`IMatchable`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IMatchable.cs) 或 [`IMatcher<T>`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IMatcher.cs)，也可以通过 `Name` 属性与参数做忽略大小写匹配。 |
| 标签解析 | `Resolves(tag)`、`GetTags(tag)` | 按 `ServiceAttribute.Tags` 组织服务集合，适合把一组同类扩展归入同一用途。 |

{% hint style="warning" %}
按名称解析依赖注册阶段记录的名称映射，主要来自 `ServiceAttribute.Name`。如果只用 `services.AddSingleton<T>()` 手工注册，而没有额外登记名称，就不能直接通过 `Resolve("name")` 找到它。
{% endhint %}

### 按类型解析

按类型解析适合普通依赖：调用方知道需要哪个契约，不关心具体实现是谁。`Resolve<T>()` 适合可选依赖，`ResolveRequired<T>()` 适合缺失即失败的强依赖，`ResolveAll<T>()` 适合初始化器、处理器、过滤器这类多实现集合。

[`ApplicationContext`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ApplicationContext.cs) 中有两个典型用法：

* `Exit(...)` 通过 `Resolve<IHost>()` 查找当前 [`IHost`](https://learn.microsoft.com/zh-cn/dotnet/api/microsoft.extensions.hosting.ihost) _[源码](https://source.dot.net/#Microsoft.Extensions.Hosting.Abstractions/IHost.cs)_。Host 不存在时不退出 Host 流程，因此这是可选依赖。
* `Initialize()` 通过 `ResolveAll<IApplicationInitializer>()` 收集所有应用初始化器，然后逐个执行。

{% code title="ApplicationContext.cs" %}
```csharp
var host = _services.Resolve<IHost>();

if(host != null)
{
	if(timeout > TimeSpan.Zero)
		host.StopAsync(timeout).GetAwaiter().GetResult();
	else
		host.StopAsync().GetAwaiter().GetResult();

	host.WaitForShutdown();
}
```
{% endcode %}

{% code title="ApplicationContext.Initialize.cs" %}
```csharp
var services = this.Services;

if(services != null)
	_initializers.AddRange(services.ResolveAll<IApplicationInitializer>());

foreach(var initializer in _initializers)
	initializer?.Initialize(this);
```
{% endcode %}

这两个例子体现了类型解析的边界：单个可选对象用 `Resolve<T>()`，多扩展点集合用 `ResolveAll<T>()`。如果调用方必须拿到服务才能继续，则改用 `ResolveRequired<T>()`，把注册缺失暴露为明确异常。

### 按名称解析

按名称解析适合“文本配置最终指向一个服务实例”的场景。核心库中的 [`MessageQueueConverter`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Messaging/MessageQueueConverter.cs) 就是这样的例子：它把字符串转换为 `IMessageQueue`。

它的解析顺序是：

1. 如果文本形如 `queue@provider`，先用 `Find<IMessageQueueProvider>(provider)` 找到对应队列提供器，再从该提供器取队列。
2. 如果没有指定提供器，就遍历 `ResolveAll<IMessageQueueProvider>()`，找到第一个包含该队列名的提供器。
3. 如果所有提供器都找不到，最后才用 `Resolve(text)` 按服务名称解析队列实例。

{% code title="MessageQueueConverter.cs" %}
```csharp
if(index > 0 && index < text.Length - 1)
{
	var provider = services.Find<IMessageQueueProvider>(text[(index + 1)..]);
	if(provider == null)
		return null;

	var name = text[..index];
	return provider.Exists(name) ? provider.Queue(name) : null;
}

foreach(var provider in services.ResolveAll<IMessageQueueProvider>())
{
	if(provider.Exists(text))
		return provider.Queue(text);
}

return services.Resolve(text) as IMessageQueue;
```
{% endcode %}

这里的 `Resolve(text)` 是兜底方案，适合某个队列对象本身已经通过 `ServiceAttribute.Name` 登记为命名服务的情况。若配置必须命中命名服务，可以使用 `ResolveRequired(name)`，让配置错误在解析阶段直接失败。

### 根据参数查找

`Find<T>(argument)` 和 `FindAll<T>(argument)` 适合同一契约存在多个实现，并且调用方只知道一个“选择参数”的场景。核心库里大量基础类型已经为这种模式实现了 `IMatchable` 或 `IMatchable<string>`。

例如 [`ExpressionEvaluatorBase`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/ExpressionEvaluatorBase.cs) 以 `Name` 表示表达式求值器名称，并用 `IMatchable` 支持忽略大小写匹配。调用方只需要传入名称，就能在多个 `IExpressionEvaluator` 实现中找到目标求值器。

{% code title="ExpressionEvaluatorBase.cs" %}
```csharp
public string Name { get; } = name;

bool Services.IMatchable.Match(object argument) =>
	argument is string name && string.Equals(name, this.Name, StringComparison.OrdinalIgnoreCase);

bool Services.IMatchable<string>.Match(string name) =>
	string.Equals(name, this.Name, StringComparison.OrdinalIgnoreCase);
```
{% endcode %}

{% code title="FindExpressionEvaluator.cs" %}
```csharp
var evaluator = ApplicationContext.Current.Services.Find<IExpressionEvaluator>("Scriban");

if(evaluator != null)
	return evaluator.Evaluate("1 + 2");
```
{% endcode %}

[`TextRegular`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Text/TextRegular.cs) 则把匹配参数当作待验证文本。也就是说，`Find<ITextRegular>("someone@example.com")` 不是按名称找正则，而是在一组文本规则服务中找到能够匹配该文本的规则。

{% code title="TextRegular.cs" %}
```csharp
bool Services.IMatchable.Match(object parameter) =>
	parameter != null && this.Match(parameter.ToString());
```
{% endcode %}

消息队列提供器也是典型场景。[`MessageQueueFactoryBase`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Messaging/MessageQueueFactoryBase.cs) 通过名称匹配队列工厂，`MessageQueueConverter` 解析 `queue@provider` 时就调用了 `Find<IMessageQueueProvider>(provider)`。

{% code title="MessageQueueFactoryBase.cs" %}
```csharp
public string Name { get; } = name ?? throw new ArgumentNullException(nameof(name));

protected virtual bool OnMatch(string name) =>
	string.Equals(this.Name, name, StringComparison.OrdinalIgnoreCase);
```
{% endcode %}

因此，`Find` 的关键不是“按类型拿第一个服务”，而是让每个候选服务自己判断“我是否适合这个参数”。当没有实现 `IMatchable` 或 `IMatcher<T>` 时，框架才会尝试用服务的 `Name` 属性做默认匹配。

### 获取标签集

标签适合把服务按“用途”组织起来，而不是按类型或名称选择单个实现。`Zongsoft.Diagnostics.Protocols.Server` 和 `Zongsoft.Web.Grpc` 就用标签把 gRPC 服务注册与端点映射解耦。

在 [`Listener.Metrics.cs`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/server/src/Listener.Metrics.cs) 中，`Metrics` 静态成员被标注为服务，并打上 `gRPC` 标签：

{% code title="Listener.Metrics.cs" %}
```csharp
[Service(Tags = "gRPC", Members = nameof(Metrics))]
partial class Listener
{
	public static readonly MetricsProcessor Metrics = new();
}
```
{% endcode %}

`ServiceCollectionExtension` 扫描到这个注解时，会把 `Metrics` 成员值注册为服务，并把该服务类型归入 `gRPC` 标签。到了 [`GrpcInitializer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/grpc/GrpcInitializer.cs)，初始化器不需要知道有哪些诊断或业务 gRPC 服务，只要读取标签下的服务类型即可：

{% code title="GrpcInitializer.cs" %}
```csharp
foreach(var service in app.ServiceProvider.GetTags("gRPC"))
{
	MapGrpcService(app, service);
}
```
{% endcode %}

这个例子的适用场景很明确：插件或模块负责声明“我是一个 gRPC 服务”，Web gRPC 初始化器负责统一映射所有带 `gRPC` 标签的服务。双方不需要互相引用具体实现。

### 按标签解析

`GetTags(tag)` 返回标签下的服务类型，适合 `GrpcInitializer` 这类“只需要类型，不需要实例”的场景。`Resolves(tag)` 和 `Resolves(Type, tag)` 则会进一步从服务容器中解析实例，适合需要直接调用标签下服务对象的场景。

如果 gRPC 初始化器需要拿到实例做预热、诊断或读取元数据，可以把上面的类型枚举改成实例解析：

{% code title="ResolveGrpcTaggedServices.cs" %}
```csharp
foreach(var service in app.ServiceProvider.Resolves("gRPC"))
{
	// service 是带有 gRPC 标签的服务实例。
}
```
{% endcode %}

如果标签下有多类服务，而注册标签时也包含了调用方关心的契约，则使用 `Resolves(Type, tag)` 过滤。以当前 gRPC 例子来说，`Listener.Metrics` 的标签记录来自静态成员的具体类型；如果调用方能够引用该具体类型，则按具体类型解析才会命中：

{% code title="ResolveTypedTaggedServices.cs" %}
```csharp
foreach(var service in app.ServiceProvider.Resolves(typeof(Listener.MetricsProcessor), "gRPC"))
{
	// service 是 Listener.MetricsProcessor 实例。
}
```
{% endcode %}

实际映射 gRPC 端点时选择 `GetTags("gRPC")` 更合适，因为 `MapGrpcService<TService>()` 需要的是服务类型；需要执行服务对象行为时，再使用 `Resolves(...)` 解析实例。

## 模块服务域

模块服务域用于解决“同一个契约在不同模块里可能有不同实现”的问题。模块的 `Services` 属性会基于应用服务容器创建一个带模块名的服务提供器；解析时会先尝试模块化服务，再回退到应用服务容器。

模块化服务的来源通常是带 [`ApplicationModuleAttribute`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ApplicationModuleAttribute.cs) 的服务类型。框架扫描到服务契约时，会额外登记带模块名的包装服务，使模块容器能优先取到本模块实现。

{% code title="OrderModuleServices.cs" %}
```csharp
using Zongsoft.Services;

[ApplicationModule("Orders")]
[Service<IOrderNumberGenerator>]
public class OrderNumberGenerator : IOrderNumberGenerator
{
	public string Generate() => "SO-" + DateTime.UtcNow.Ticks;
}
```
{% endcode %}

当对象位于某个模块或插件树节点下时，框架会尽量根据对象所属模块选择服务容器。这样业务插件可以声明自己的模块服务，同时仍能复用应用级公共服务。

## 属性注入

构造函数注入仍然是首选。属性或字段注入主要用于插件构件、运行时反射构建对象、可选依赖或需要按模块名选择服务的场景。

[`ServiceDependencyAttribute`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceDependencyAttribute.cs) 支持三类选择：

| 设置 | 含义 |
| --- | --- |
| 不指定 `Provider` | 使用注入目标所在模块的服务容器；找不到时回退到应用服务容器。 |
| `Provider = "/"` 或 `Provider = "*"` | 直接使用应用服务容器。 |
| `Provider = "模块名"` | 使用指定模块的服务容器；找不到时回退到应用服务容器。 |

{% code title="ReportWorker.cs" %}
```csharp
using Zongsoft.Services;

public class ReportWorker
{
	[ServiceDependency(IsRequired = true)]
	public IReportStore Store { get; set; }

	[ServiceDependency(Provider = "/", IsRequired = true)]
	public IClock Clock { get; set; }
}
```
{% endcode %}

如果设置 `ServiceName`，注入器会改用 [`IServiceProvider<T>`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IServiceProvider%601.cs) 的 `GetService(string)` 查找命名服务。`ServiceName = "~"` 或 `ServiceName = "."` 表示把注入目标所在模块名作为服务名。

## 插件中的服务发现

插件文件里的 `{service:...}` 表达式由 `Zongsoft.Plugins` 中的 [`ServicesParser`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/Services/ServicesParser.cs) 处理。它不是单纯从全局容器取对象，而会结合当前构件位置和显式容器名选择服务域。

| 表达式 | 结果 |
| --- | --- |
| `{service:@}` | 返回应用默认服务容器。 |
| `{service:@Orders}` | 返回名为 `Orders` 的模块服务容器；模块不存在则返回空。 |
| `{service:Greeting}` | 从当前构件所属模块容器或应用容器解析名为 `Greeting` 的服务。 |
| `{service:Greeting@Orders}` | 从 `Orders` 模块服务容器解析名为 `Greeting` 的服务。 |
| `{service:~}` | 按当前目标成员类型解析一个服务。 |
| `{service:*}` | 按当前目标成员类型解析所有服务。 |
| `{service:~@}`、`{service:*@}` | 强制从应用默认服务容器按目标成员类型解析。 |
| `{service:~@Orders}`、`{service:*@Orders}` | 从指定模块服务容器按目标成员类型解析。 |

所有格式还可以在服务对象后继续访问属性或字段，例如 `{service:Greeting.Options@Orders}`。这适合在插件构件属性中引用已注册服务的某个配置对象或子对象。

{% hint style="info" %}
未显式写 `@模块名` 时，服务解析器会尝试使用当前构件父节点名称匹配模块名；匹配失败才使用应用默认服务容器。插件路径命名如果能和模块名保持一致，服务表达式会更自然。
{% endhint %}

## 插件宿主的构建顺序

`Zongsoft.Plugins.Hosting` 中的应用构建器把服务注册和插件加载编排在一起。以 `Application.Daemon(...)`、`Application.Terminal(...)` 为入口时，构建过程大致如下：

1. 创建 .NET Host 构建器，并把容器工厂设置为 `Zongsoft.Services.ServiceProviderFactory`。
2. 按应用名加载宿主 `.option` 配置。
3. 创建 [`PluginOptions`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/PluginOptions.cs)，把插件配置源加入应用配置。
4. 调用 [`PluginTree.Get(options).Load()`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/PluginTree.cs) 加载插件树。
5. 扫描宿主引用程序集、宿主程序集和插件清单程序集，执行服务注册。
6. 注册默认 `System.Net.Http.HttpClient` 服务。
7. 把 `/Workspace/Environment/Services` 下的构件注册为单例服务。
8. 构建 Host，并通过 `Initialize()` 初始化 [`PluginApplicationContext`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Plugins/src/PluginApplicationContext.cs)。
9. 应用启动时打开工作台，加载 `/Workbench/Startup` 下的工作器。

`Daemon` 和 `Terminal` 会先注册各自的应用上下文实现，再映射为 `PluginApplicationContext` 和 `IApplicationContext`。这意味着应用代码通常只依赖 `IApplicationContext`，而插件宿主内部仍能使用更具体的插件上下文访问插件树和工作台。

## 使用建议

* 宿主专属、生命周期敏感、需要立即配置的服务，用代码注册。
* 插件程序集中的普通业务服务，用 `ServiceAttribute` 或 `IServiceRegistration` 注册。
* 需要在插件文件中声明、可由配置或路径表达式组装的对象，放到 `/Workspace/Environment/Services`。
* 需要被其他插件按扩展点发现的对象，优先挂到约定插件树路径，而不是强行放进 DI 容器。
* 同一契约有多个实现时，用 `Find<T>(argument)`、`IMatchable`、`IMatcher<T>` 或标签组织，不要把实现选择逻辑写死在调用方。
* 模块内部服务尽量标注 `ApplicationModuleAttribute`，让模块容器可以优先解析本模块实现。

{% hint style="warning" %}
`ServiceAttribute` 扫描注册的普通类型默认按单例注册。包含可变状态、请求状态或需要释放的短生命周期对象，应使用代码注册明确生命周期，或通过工厂服务创建。
{% endhint %}

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Services.Distributing` | 分布式锁、锁令牌和分布式协作基础类型。 |

## 相关资源

* [分布式锁](services/distributed-lock.md)
* [插件应用模型](../plugins/application-model.md)
* [宿主集成](../plugins/hosting.md)
* [构件与服务](../plugins/builtins-and-services.md)
* [Services 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Services)
* [Plugins Hosting 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins/src/Hosting)
* [Plugins Services 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins/src/Services)


关于按契约解析、按名称匹配、提供者定位以及共享实例所有权，参见[服务定位与所有权](services/locating.md)。表达式实现的语言与并发差异见[脚本与表达式](../externals/scripting.md)。
