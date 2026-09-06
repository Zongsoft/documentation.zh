---
description: 采集当前运行环境的硬件信息，并理解设备标识的稳定性与使用范围。
icon: microchip
---

# 硬件信息

`Zongsoft.Hardwares` 实现核心库 `Zongsoft.IO.Hardwares` 中的硬件采集契约。它适合设备信息展示、诊断和应用授权流程中的辅助识别；采集结果取决于操作系统、权限与实际运行环境。

## 信息模型

`IHardware` 描述单项硬件，常见字段包括 `Code`、`Name`、`Type`、`Model`、`Serie`。单个设备是否具有唯一特征，应通过 `HasUnique(out string)` 判断。不要把 `HardwareProfile.Identifier` 误认为每个设备都有的属性。

`HardwareProfile` 用于组合设备信息并产生汇总标识。单项设备、一次采集结果和机器画像是三个不同层次：新增网卡、迁移虚拟机或改变可见设备，都可能影响画像输入。

## 部署与采集

{% code title=".deploy" %}
```ini
[plugins zongsoft hardwares]
nuget:Zongsoft.Hardwares
```
{% endcode %}

Discussions 没有硬件采集用例。本页采用 framework 中 HardwareCollectorTest 的真实测试：通过采集器读取设备，验证集合及元素非空，不输出真实设备标识。插件应用也可以通过核心硬件契约解析采集器。

来源：[framework/Zongsoft.Hardwares/test/HardwareCollectorTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Hardwares/test/HardwareCollectorTest.cs#L11)（节选；上下文见源文件）。

{% code title="HardwareCollectorTest.cs" %}
```csharp
public void TestCollect()
{
	var hardwares = HardwareCollector.Instance.Collect();

	Assert.NotNull(hardwares);
	Assert.DoesNotContain(hardwares, hardware => hardware == null);
}
```
{% endcode %}

框架 samples/Program.cs 使用该次采集结果构造 HardwareProfile，并打印画像与设备详情；这适合本地查看，输出不宜原样保存到公共日志。需要画像时，可以用该次采集到的设备集合构造 `HardwareProfile`。建议先固定并记录应用采用的设备筛选规则，再讨论标识是否符合业务要求。

## 平台与异步边界

当前实现按 Windows、Linux、macOS 选择平台采集器，并补充网络设备信息；其他平台仅走可用的网络信息路径。容器看到的通常是容器可见环境，不能默认等于物理宿主完整硬件。

`CollectAsync` 在采集枚举过程中逐项检查取消并异步让出执行。它不是把所有底层系统查询改造成可中断的异步调用；耗时的平台查询不一定能立即响应取消。需要在请求链路中使用时，应控制调用频率并考虑缓存。

{% hint style="warning" %}
🚨 硬件指纹不是可信身份凭证。虚拟化、设备替换、权限变化及可伪造的系统信息都可能影响结果；授权系统应同时设计重新绑定、故障恢复和其他身份验证机制。
{% endhint %}

## 排查和使用建议

出现字段为空时，先用相同账号检查操作系统是否暴露该信息，再比较本地、服务账号和容器的权限差异。不要把“字段缺失”直接当作机器非法，也不要在没有证据时编造替代序列号。

如需上报设备画像，应只收集用途需要的字段，并控制访问、保存时间和脱敏方式。诊断页面优先展示采集时间、类型和缺失原因，完整标识留在有相应权限的管理流程中。

源码入口：[采集实现](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Hardwares/src)、[核心硬件契约](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/IO/Hardwares)。
