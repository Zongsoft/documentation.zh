---
description: 根据契约、名称和提供者解析服务，理解模块回退、注册生命周期与释放责任。
icon: compass
---

# 服务定位与所有权

当同一能力有多个实现或多组连接时，仅按类型解析已经不够。例如一个应用可能同时使用 Scriban 和 Lua，也可能通过 Redis 提供两个独立的具名缓存。Zongsoft 将“选择实现”和“取得具名实例”分别交给匹配查找与提供者定位。

本页补充[服务模型](../services.md)中的实际选择流程。前提是应用上下文已经初始化，目标插件程序集已被扫描，所需配置已生效。

## 选择哪个入口

| 已知条件 | 调用 | 行为 |
| --- | --- | --- |
| 只知道契约类型 | `Resolve<T>()` | 按类型解析，可能返回空 |
| 契约必须存在 | `ResolveRequired<T>()` | 缺少注册时抛出异常 |
| 已登记的服务别名 | `Resolve("name")` | 查名称注册映射 |
| 同一契约中的选择参数 | `Find<T>(argument)` | 按匹配规则选择实现 |
| 选择失败应立即报告 | `FindRequired<T>(argument)` | 缺少匹配对象时失败 |
| 名称来自配置，可能包含提供者 | `Locate<T>("name@provider")` | 选择提供者，再取得具名实例 |

`Find` 的参数不一定是名称；它也可能是实现自行解释的匹配条件。按名称选择求值器，只是常见用法之一。

{% code title="ResolveEvaluator.cs" %}
```csharp
using Zongsoft.Expressions;
using Zongsoft.Services;

var evaluator = ApplicationContext.Current.Services
	.FindRequired<IExpressionEvaluator>("Scriban");
var result = evaluator.Evaluate("20 + 22", new Dictionary<string, object>());
```
{% endcode %}

本片段依赖已部署的 Scriban 插件，参见[第一个业务插件](../../../get-started/first-business-plugin.md)。

## Locate 的解析顺序

[`ServiceLocator`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceLocator.cs) 按下面的路径定位对象：

1. 限定名为空白时，直接按类型解析。
2. 未指定提供者时，依次尝试名称注册、匹配查找，以及该契约的具名提供者。
3. 指定 `name@provider` 时，按别名或匹配规则取得提供者，再调用其 `GetService(name)`。

这里的具名提供者是 Zongsoft 的 [`IServiceProvider<T>`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/IServiceProvider%601.cs)，不同于按类型工作的 `System.IServiceProvider`。

{% code title="LocateCache.cs" %}
```csharp
using Zongsoft.Caching;
using Zongsoft.Services;

var cache = ApplicationContext.Current.Services
	.Locate<IDistributedCache>("OrderCache@Redis")
	?? throw new InvalidOperationException("未找到 OrderCache 缓存。");
```
{% endcode %}

其中缓存接口为 `Zongsoft.Caching.IDistributedCache`。本例还要求 Redis 插件及名为 `OrderCache` 的连接配置，见[缓存与分布式协作](../../externals/caching.md)。找到提供者后，其创建过程仍可能因配置或连接失败抛出异常；`Locate` 不负责兜底外部系统故障。

## 与插件表达式的区别

`{service:~@Orders}` 表示从 Orders 模块按目标成员类型解析服务；`{service:@Orders}` 返回模块容器。这里 `@` 后面是模块名。

`Locate<T>("OrderCache@Redis")` 的 `@` 后面则是具名提供者。需要用 XML 注入缓存时，应按照[构件与服务](../../plugins/builtins-and-services.md)的成员类型和表达式契约装配，不能把上述字符串直接改写成 `{service:OrderCache@Redis}` 并期待相同效果。

## 模块回退与实例身份

模块容器优先解析模块注册，找不到时回退应用共享服务。集合解析先收集模块项，再补充共享项，按具体类型去重。业务不应依赖无明确顺序约定的候选项来选择默认实现；有歧义时使用名称或匹配参数。

模块不是请求作用域。同一个共享实例可能被多个模块解析到。程序集上的模块注解决定服务归属，应用提供的模块对象还需要挂载到模块集合；详见[插件应用模型](../../plugins/application-model.md)。

## 谁负责释放

服务特性扫描普通类型时，默认以单例注册，实现类型和服务契约通常指向同一实例。静态成员注册则暴露已有对象。具体行为见[注册源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Services/ServiceCollectionExtension.cs)。

因此，消费者通常不对解析结果使用 `using`，也不在每次调用后 `Dispose()`。调用方显式创建的对象、工厂明确交付所有权的对象，以及调用产生的流或订阅等资源，应遵循各自契约释放。不能仅从“通过提供者取得”推断谁拥有对象。

{% hint style="warning" %}
🚨 共享服务中保存某个请求的用户、临时状态或未同步集合，可能导致并发串扰。需要作用域或瞬态生命周期时，应使用代码注册明确声明；不要期待服务特性自动选择生命周期。
{% endhint %}

## 排查顺序

先检查清单是否声明程序集，再检查服务特性或注册器是否执行；确认别名、模块名和提供者名各自正确；最后验证具名配置和外部连接。服务在容器中存在，仅覆盖了这条链路的前半段。
