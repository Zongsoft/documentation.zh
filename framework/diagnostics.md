---
description: 以框架随包选项说明指标与追踪的过滤和导出配置。
icon: stethoscope
---

# 诊断

Zongsoft.Diagnostics 将 Core 诊断选项接到实际导出器。Discussions 没有独立定义诊断方案，使用时由宿主选择和部署；本页采用框架随包配置作为参考。

## 指标导出配置

来源：[framework/Zongsoft.Diagnostics/src/Zongsoft.Diagnostics.option](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/src/Zongsoft.Diagnostics.option#L6)（节选；上下文见源文件）。

{% code title="Zongsoft.Diagnostics.option" %}
```xml
<meters>
	<filter>*</filter>

	<exporters>
		<exporter exporter.name="telemetry" driver="telemetry"
		          settings="server=http://localhost:4317;protocol=grpc;processorType=batch;timeout=30s;interval=15s;" />

		<exporter exporter.name="prometheus" driver="prometheus"
		          settings="urls=http://127.0.0.1:9464,http://localhost:9464;path=/metrics;totalSuffix=true;cacheDuration=300ms;" />
	</exporters>
</meters>
```
{% endcode %}

这是原配置中的 meters 节：通配过滤器选择来源，telemetry 指向本地 OTLP gRPC 接收端，prometheus 提供拉取端点。端口属于该配置，不应当作所有宿主的固定端口。运行前应根据自己的环境选择需要的导出方式。

## 追踪与日志不是同一个配置对象

同一文件还有 traces 节，配置 OTLP 和 Zipkin。日志输出另由[Core 日志体系](core/diagnostics.md)组织；启用指标导出不等于应用日志也会发送到相同目标。

## 从业务测量到后端

框架安全模块的真实认证指标见[Telemetry](core/diagnostics/telemetry.md)。先确认业务确实记录测量值，再检查过滤和导出；没有输出可能是没有匹配来源，也可能是传输端点、协议或后端故障。

Discussions 的发帖数等持久化业务统计与遥测 Counter 不同：前者需要数据库事务维护，后者用于观测运行过程。不要互相替代。

## 接入顺序与成本

先选明确信号和来源，再设置批处理、间隔、超时与接收端，随后验证失败行为和资源释放。通配来源适合初次核对，正式部署应评估吞吐、标签基数和敏感属性。

自建接收器阅读[OTLP 协议接入](diagnostics/otlp.md)，源码依据为 [Configurator](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/src/Configuration/Configurator.cs)。
