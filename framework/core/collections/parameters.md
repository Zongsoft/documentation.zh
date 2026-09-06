---
description: Parameters 参数包、类型键、字符串键、链式构建和 JSON 序列化。
icon: sliders
---

# Parameters

`Parameters` 是一个轻量参数包，既可以按字符串名称保存参数，也可以按 [`Type`](https://learn.microsoft.com/zh-cn/dotnet/api/system.type) _[源码](https://source.dot.net/#System.Private.CoreLib/Type.cs)_ 保存参数。它常用于命令调用、服务上下文、数据访问选项、事件参数和跨层传递少量上下文数据。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `Parameters` | 参数容器，实现 [`IDictionary<object, object>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.idictionary-2) _[源码](https://source.dot.net/#System.Private.CoreLib/IDictionary.cs)_。 |
| `Parameters.Json` | `Parameters` 的 JSON 转换器实现。 |
| `ParametersUtility` | 提供链式添加参数的扩展方法。 |

## 字符串键与并发初始化

字符串键忽略大小写。`null` 名称会被转换为空字符串。

来源：[framework/Zongsoft.Core/test/Collections/ParametersTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/ParametersTest.cs#L18)（节选；上下文见源文件）。

{% code title="ParametersTest.cs" %}
```csharp
public async Task GetOrAdd_ConcurrentSameName_CreatesSingleValueAsync()
{
	const int COUNT = 64;
	var parameters = new Parameters();
	var factoryCalls = 0;
	var start = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
	var tasks = new Task<object>[COUNT];

	for(var index = 0; index < tasks.Length; index++)
	{
		tasks[index] = Task.Run(async () =>
		{
			await start.Task;
			return parameters.GetOrAdd("Shared", _ =>
			{
				Interlocked.Increment(ref factoryCalls);
				return new object();
			});
		});
	}

	start.SetResult();
	var results = await Task.WhenAll(tasks);

	Assert.Equal(1, factoryCalls);
	Assert.Single(parameters);
	Assert.Same(results[0], parameters.GetValue("shared"));
	Assert.All(results, result => Assert.Same(results[0], result));
}
```
{% endcode %}

`TryGetValue<TValue>(string name, out TValue value)` 会尝试将原始值转换为目标类型。

## 类型键与值复用

按类型保存参数时，可以直接通过泛型读取。读取时如果没有找到完全匹配的类型键，`Parameters` 会查找可赋值的类型键。

来源：[framework/Zongsoft.Core/test/Collections/ParametersTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/ParametersTest.cs#L49)（节选；上下文见源文件）。

{% code title="ParametersTest.cs" %}
```csharp
public void GetOrAdd_TypeKey_ReusesExistingValueWithoutCallingFactory()
{
	var parameters = new Parameters();
	var expected = parameters.GetOrAdd(() => new ParameterMarker());

	var actual = parameters.GetOrAdd<ParameterMarker>(() => throw new InvalidOperationException("The existing value must win."));

	Assert.Same(expected, actual);
	Assert.Same(expected, parameters.GetValue<ParameterMarker>());
}
```
{% endcode %}

按类型设置参数时，值必须能赋给声明类型；如果声明类型是非空值类型，则不能设置为 `null`。

## 链式构建

`ParametersUtility` 让已有参数包可以继续链式追加参数。

Discussions 的 PostService.OnInsert 读取 options.Parameters 中名为 Thread 的关联对象，用于区分主题内容贴与普通回帖。这个分支的调用方必须显式传入关联对象；映射中存在 Post 复合属性本身并不会自动填充 Parameters。参阅 [帖子写入](../../data/writing.md)。

`Append` 可以把另一个 `Parameters` 中的条目合并到当前实例。

## JSON 序列化

下面节选同一测试文件中的 TestJson。parameters 来自该方法前半部分构造的参数包，涵盖有名参数、类型键、时间值、字节数组和 IPerson 测试模型；不是一个独立的顶层程序。类型键测试中的 ParameterMarker 也定义在同一文件中。

`Parameters.Json` 为 `Parameters` 提供 JSON 转换器。字符串键按属性名输出，类型键会使用 `$` 前缀加类型别名输出。

来源：[framework/Zongsoft.Core/test/Collections/ParametersTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/ParametersTest.cs#L107)（节选；上下文见源文件）。

{% code title="ParametersTest.cs" %}
```csharp
var json = Serializer.Json.Serialize(parameters);
Assert.NotNull(json);
Assert.NotEmpty(json);

var result = Serializer.Json.Deserialize<Parameters>(json);
Assert.NotNull(result);
Assert.NotEmpty(result);
```
{% endcode %}

复杂对象会以包含 `$type` 和 `$value` 的对象形式保存，读取时再按类型别名恢复值。

## 相关资源

* [Parameters.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/Parameters.cs)
* [Parameters.Json.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/Parameters.Json.cs)
* [ParametersUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Collections/ParametersUtility.cs)
* [ParametersTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Collections/ParametersTest.cs)
