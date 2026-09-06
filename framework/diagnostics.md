---
description: 区分日志、指标和追踪，以配置装配诊断采集、导出和协议接收。
icon: stethoscope
---

# 诊断

诊断帮助回答三个层次的问题：发生了什么、整体运行怎样、一次请求慢在哪里。Zongsoft 的 Core 提供诊断与遥测抽象，Diagnostics 插件将过滤器、导出器和启动工作器接入配置；协议 Client/Server 包负责 OTLP 传输边界。

## 日志、指标与追踪

**日志**记录离散事件，例如订单校验失败；**指标**记录可以聚合的测量，例如请求数和延迟分布；**追踪**把一次请求跨组件的操作串起来，用于分析耗时与依赖关系。三者互补，不能只靠打印异常代替整个可观测流程。

指标名称和标签应保持稳定，避免将订单号、原始 URL 或用户 ID 这类高基数值作为常规指标标签。追踪和日志也应避免携带凭据及不必要的业务正文。

## 部署和配置

{% code title="Diagnostics.deploy（片段）" %}
```ini
[plugins zongsoft diagnostics]
nuget:Zongsoft.Diagnostics
```
{% endcode %}

插件将诊断工作器挂到 Startup，按 `/Diagnostics/Diagnostor` 配置启动。当前配置器处理 meters 和 traces；不能仅根据接收端支持日志就推断这里也会自动配置一套日志导出管线。

下面示例仅导出匹配名称的指标到一个受控 OTLP/gRPC 端点：

{% code title="Zongsoft.Diagnostics.option" %}
```xml
<options>
	<option path="/Diagnostics">
		<diagnostor>
			<meters>
				<filter>Acme.Orders</filter>
				<exporters>
					<exporter exporter.name="telemetry" driver="telemetry"
						settings="server=http://localhost:4317;protocol=grpc;processorType=batch;timeout=30s;interval=15s;" />
				</exporters>
			</meters>
		</diagnostor>
	</option>
</options>
```
{% endcode %}

这里 filter 的文本是配置集合项，符合[选项 XML 规则](../references/option-files.md)。应用还需要产生相应名称的指标，仅有过滤器和导出器不会产生业务测量。

## 导出器的区别

随包选项展示 OTLP、Prometheus 与 Zipkin。OTLP 向采集端发送；Prometheus 暴露指标抓取端点；Zipkin 接收追踪数据。默认示例包含本机 4317、9464 和 9411 等地址，实际部署应按需要保留和配置，避免无意启用未使用的出口或监听。

{% hint style="info" %}
💡 排查时先产生一个明确的合成测量值，再等待配置的批处理间隔，检查过滤器名称、导出器配置和接收端。空闲应用没有匹配测量时，“没有输出”不一定是网络故障。
{% endhint %}

## 采集、传输与存储分别验证

Core 诊断 API 的使用见[遥测](core/diagnostics/telemetry.md)。需要自己调用 OTLP 服务或实现接收处理器时，继续阅读[OTLP 协议接入](diagnostics/otlp.md)。协议调用成功只证明传输与服务响应，不自动证明后端存储完成。

源码依据：[配置器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/src/Configuration/Configurator.cs)、[默认选项](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/src/Zongsoft.Diagnostics.option)、[启动清单](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/src/Zongsoft.Diagnostics.plugin)。
