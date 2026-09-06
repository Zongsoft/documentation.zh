---
description: 采用框架 SuperviserTest 的真实对象与并发测试说明监测生命周期。
icon: eye
---

# 监视器

Superviser 管理被监测对象，按键查找和取消监测，并通过事件通知状态变化。Discussions 当前没有监测器业务流程，因此本页使用框架 SuperviserTest 的现有用例。

## 注册与键的含义

来源：[framework/Zongsoft.Core/test/Components/SuperviserTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Components/SuperviserTest.cs#L17)（节选；上下文见源文件）。

{% code title="SuperviserTest.cs" %}
```csharp
private void Initialize(int count = 2)
{
	for(int i = 0; i < count; i++)
	{
		var name = $"S{i + 1}";
		_superviser.Supervise(name, new MySupervisable(name));
		_superviser.Supervise(name, new MySupervisable(name));
	}
}
```
{% endcode %}

测试类持有 Superviser&lt;string&gt;，MySupervisable 是同一测试文件内的被监测对象。这里对同一个键重复注册，用于验证监测器不会按调用次数重复计数。测试对象不是设备协议客户端，不能据此推断网络重连行为。

## 取消监测与对象通知

来源：[framework/Zongsoft.Core/test/Components/SuperviserTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Components/SuperviserTest.cs#L43)（节选；上下文见源文件）。

{% code title="SuperviserTest.cs" %}
```csharp
public void TestUnsupervise()
{
	this.Initialize(2);

	Assert.True(_superviser.Unsupervise("S1", out var observable));
	Assert.NotNull(observable);
	Assert.IsType<MySupervisable>(observable);
	Assert.Equal("S1", ((MySupervisable)observable).Name);
	Assert.True(((MySupervisable)observable).IsUnsupervised(TimeSpan.FromSeconds(10)));
	Assert.False(_superviser.Contains("S1"));

	Assert.True(_superviser.Unsupervise("S2", out observable));
	Assert.NotNull(observable);
	Assert.IsType<MySupervisable>(observable);
	Assert.Equal("S2", ((MySupervisable)observable).Name);
	Assert.True(((MySupervisable)observable).IsUnsupervised(TimeSpan.FromSeconds(10)));
	Assert.False(_superviser.Contains("S2"));

	Assert.Equal(0, _superviser.Count);
}
```
{% endcode %}

取消操作返回关联对象，之后键不再存在。测试等待对象收到取消监测回调，说明回调与调用返回的时间需要分别考虑。

## 并发行为

框架同一测试文件还验证并发注册同一键、并发取消和事件计数。实际业务应特别检查重复注册、取消与重新注册交错时的所有权，不能只在单线程环境验证 Contains。

## 生命周期与适用边界

监测生命周期和失败阈值描述的是对象监测策略，不自动等于网络连接存活、进程健康或业务请求成功。实现被监测对象时，应明确何时报告数据、错误与完成，以及取消监测后如何释放资源。

监测器自身应由明确的服务生命周期管理；不要为每次查询创建共享监测器，也不要在取消后继续把旧对象当作当前连接。参见[服务所有权](../services/locating.md)和[通知](../common/notification.md)。
