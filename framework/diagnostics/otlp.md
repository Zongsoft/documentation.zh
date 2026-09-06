---
description: 接入 OTLP gRPC 客户端和 Listener 服务端，核对处理器装配、数据转换及可靠性限制。
icon: satellite-dish
---

# OTLP 协议接入

OTLP 是遥测数据传输协议。一个批次可包含多个 Resource，每个资源下有多个 Scope，再包含指标点、日志或追踪。应用若把所有层次压成一个列表，很容易丢失来源、属性或数据点语义。

## 客户端包的职责

`Zongsoft.Diagnostics.Protocols.Client` 提供生成的消息类型及 gRPC 客户端 Stub。它不会自动插桩、采集、批处理、重试或建立 SDK 导出管线。普通应用从[诊断配置](../diagnostics.md)开始；直接协议调用才需要自行构造请求。

下面展示调用形状，空请求不产生业务遥测；需要引用协议包及 gRPC .NET 客户端，并替换为自己的受控端点：

{% code title="ExportMetrics.cs" %}
```csharp
using Grpc.Net.Client;
using OpenTelemetry.Proto.Collector.Metrics.V1;

using var cancellation = new CancellationTokenSource(TimeSpan.FromSeconds(5));
using var channel = GrpcChannel.ForAddress("https://collector.example.invalid");
var client = new MetricsService.MetricsServiceClient(channel);
var response = await client.ExportAsync(
	new ExportMetricsServiceRequest(),
	cancellationToken: cancellation.Token);
```
{% endcode %}

业务导出器还要填充资源、作用域和数据点，处理响应及部分成功，控制队列、批次大小和重试范围。生成式 API 版本不等于线协议稳定性，不建议直接将这些类型作为业务长期存储模型。

## 服务端的装配

在插件 Web 宿主部署 gRPC 和协议服务端：

{% code title="TelemetryServer.deploy（片段）" %}
```ini
[plugins zongsoft web grpc]
nuget:Zongsoft.Web.Grpc

[plugins zongsoft diagnostics protocols server]
nuget:Zongsoft.Diagnostics.Protocols.Server
```
{% endcode %}

Listener 的 Logs、Metrics、Traces 服务通过 `gRPC` 标签映射。随包选项声明 `http://*:4317` 的 HTTP/2 端点，实际部署应限定地址、传输安全与发送方访问；普通 HTTP/1 JSON 请求不能验证该 gRPC 入口。

## 注册处理器

接收服务把协议消息转换成框架模型，然后分派给对应处理器集合。指标处理器挂载示例：

{% code title="Acme.Telemetry.plugin（扩展片段）" %}
```xml
<extension path="/Workbench/Diagnostics/Telemetry/Listener/Metrics">
	<object type="Acme.Telemetry.MetricHandler, Acme.Telemetry" />
</extension>
```
{% endcode %}

类型需要由应用提供，并在清单中声明程序集及服务端插件依赖。[服务端样例](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Diagnostics/protocols/server/samples)使用类型化处理器打印指标；打印只用于观察，不提供数据库、持久队列或失败重试。

## 当前转换与可靠性边界

{% hint style="warning" %}
🚨 当前实现不能作为已证明无损的通用 OTLP 接收器：指标处理在资源循环中重新建立集合，最终分派无法保留前面资源的全部指标；Gauge 也投射为框架 Counter 相关模型。接入多资源批次或依赖特定指标语义前，应针对这些行为验证并处理。
{% endhint %}

时间戳从 Unix 纳秒转换为毫秒，存在精度损失。处理器通过并行分派执行，单个处理器异常会记录并隔离，响应不会逐一报告这些失败。没有处理器时也不能从成功响应推断数据被消费。

需要可靠接收时，应明确定义何时入队或落盘、如何处理过载、失败如何被发送方或运维发现。当前协议响应与处理器失败语义必须纳入设计；仅在处理器中捕获异常并打印不足以保证不丢数据。

## 验证顺序

先验证 HTTP/2 端点与服务标签，再挂载记录型处理器，发送包含已知数量资源、作用域和数据点的合成批次，比较接收结果。随后检查空批次、处理器失败、取消和目标存储故障，最后才连接真实遥测源。

源码依据：[分派与时间转换](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/server/src/Listener.cs)、[指标转换](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/server/src/Listener.Metrics.cs)、[客户端生成项目](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/client/src/Zongsoft.Diagnostics.Protocols.Client.csproj)。
