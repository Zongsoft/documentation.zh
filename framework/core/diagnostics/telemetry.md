---
description: Zongsoft.Core 中 Telemetry 抽象、Diagnostor 配置与 OpenTelemetry 接入方式。
icon: chart-line
---

# Telemetry

`Zongsoft.Diagnostics.Telemetry` 是核心库中的遥测抽象层，用来描述和辅助创建指标、追踪源和导出器。它不负责采集线程、网络导出或 OpenTelemetry SDK 生命周期；这些由独立的 `Zongsoft.Diagnostics` 插件完成。

{% hint style="info" %}
本页中的 “meter” 指 .NET 诊断指标的 [`System.Diagnostics.Metrics.Meter`](https://learn.microsoft.com/zh-cn/dotnet/api/system.diagnostics.metrics.meter) _[源码](https://source.dot.net/#System.Diagnostics.DiagnosticSource/System/Diagnostics/Metrics/Meter.cs)_，不是物联网业务里的设备指标数据模型。业务指标数据和诊断遥测指标可以同时存在，但用途不同：前者是业务数据，后者是系统观测数据。
{% endhint %}

## 基本分工

| 层次 | 职责 | 常见类型 |
| --- | --- | --- |
| 业务代码 | 创建 meter、counter、histogram，并在关键路径打点。 | [`System.Diagnostics.Metrics.Meter`](https://learn.microsoft.com/zh-cn/dotnet/api/system.diagnostics.metrics.meter) _[源码](https://source.dot.net/#System.Diagnostics.DiagnosticSource/System/Diagnostics/Metrics/Meter.cs)_、[`Counter<T>`](https://learn.microsoft.com/zh-cn/dotnet/api/system.diagnostics.metrics.counter-1) _[源码](https://source.dot.net/#System.Diagnostics.DiagnosticSource/System/Diagnostics/Metrics/Counter.cs)_ |
| 核心抽象 | 描述 meter/exporter，提供动态创建仪表的辅助方法。 | `MeterDescriptor`、`ExporterDescriptor`、`MeterExtension` |
| 诊断配置 | 声明采集哪些 meter/source，以及导出到哪里。 | `Diagnostor`、`Diagnostor.Filtering` |
| 实现插件 | 创建 OpenTelemetry provider，调用 exporter launcher。 | `DiagnostorWorker`、`IExporterLauncher<TArgument>` |

应用代码只需要关心“在哪里打点”和“指标名如何设计”；宿主配置负责决定是否采集、采集哪些、导出到哪里。

## Diagnostor

`Diagnostor` 是核心库中的遥测配置对象，它包含：

| 成员 | 说明 |
| --- | --- |
| `Name` | 诊断器名称，通常与宿主 worker 或模块相关。 |
| `Meters` | 指标采集过滤器，包含 meter 名称集合和 exporter 集合。 |
| `Traces` | 追踪采集过滤器，包含 Activity source 名称集合和 exporter 集合。 |

`Diagnostor.Filtering.Filters` 是要采集的 meter/source 名称；`Exporters` 是导出器集合，每个导出器包含 `Driver` 和 `Settings`。核心库只保存这些设置，不解析 OTLP、Prometheus 或 Zipkin 的具体参数。

`Diagnostor.Configurator` 用于把配置来源转换成 `Diagnostor` 对象。`Zongsoft.Diagnostics` 实现项目提供了配置器，从 `/Diagnostics/Diagnostor` 读取 `DiagnostorOptions`。

## Telemetry 类型

| 类型 | 说明 |
| --- | --- |
| `MeterDescriptor` | 描述一个 meter：名称、类型、版本、标签、标题和说明。 |
| `MeterProvider` | 保存 meter 描述符集合，默认实例为 `MeterProvider.Default`。 |
| `ExporterDescriptor` | 描述一个 exporter：名称、标题和说明。 |
| `ExporterProvider` | 保存 exporter 描述符集合，默认实例为 `ExporterProvider.Default`。 |
| `IExporterLauncher<TArgument>` | 把 exporter 接入某个 OpenTelemetry builder 的启动器契约。 |
| `ExporterLauncherBase<TArgument>` | 根据 driver 名称匹配 launcher 的基类。 |
| `MeterExtension` | 通过运行时 `Type` 创建 counter、up-down counter、gauge 和 histogram。 |

`MeterExtension` 适合指标值类型在运行时才确定的框架型代码。普通业务代码已经知道类型时，应优先使用 .NET 自带泛型方法，例如 `CreateCounter<long>`、`CreateHistogram<double>`。

{% code title="DynamicMeter.cs" %}
```csharp
using System.Diagnostics.Metrics;
using Zongsoft.Diagnostics.Telemetry;

var meter = new Meter("Demo.Inventory", "1.0.0");
var counter = meter.CreateCounter("inventory.adjustments", typeof(long), "items");
```
{% endcode %}

## 业务模块打点

业务模块通常在模块类上挂一个专用的 meter 门面，把一组相关仪表集中声明。这样调用点只需要写 `Module.Current.Meter.Acquirer.Count.Add(...)`，不用到处拼指标名。

{% code title="Module.Meter.cs" %}
```csharp
partial class Module
{
	public ModuleMeter Meter { get; }

	public sealed class ModuleMeter
	{
		private readonly System.Diagnostics.Metrics.Meter _meter;

		public readonly AcquirerMeter Acquirer;
		public readonly MeasurerMeter Measurer;

		public ModuleMeter(Module module)
		{
			_meter = module.Services.ResolveRequired<IMeterFactory>().Create(Module.NAME);
			this.Acquirer = new(_meter);
			this.Measurer = new(_meter);
		}

		public sealed class AcquirerMeter(System.Diagnostics.Metrics.Meter meter)
		{
			private const string METER = "Acquirer";

			public readonly Counter<long> Count = meter.CreateCounter<long>($"{METER}.{nameof(Count)}");
			public readonly Counter<long> Error = meter.CreateCounter<long>($"{METER}.{nameof(Error)}");
		}

		public sealed class MeasurerMeter(System.Diagnostics.Metrics.Meter meter)
		{
			private const string METER = "Measurer";

			public readonly Counter<int> Count = meter.CreateCounter<int>($"{METER}.{nameof(Count)}");
		}
	}
}
```
{% endcode %}

模块构造时初始化该门面：

{% code title="Module.cs" %}
```csharp
public partial class Module : ApplicationModule<Module.EventRegistry>
{
	public const string NAME = nameof(Things);
	public static readonly Module Current = new();

	private Module() : base(NAME)
	{
		this.Meter = new(this);
		this.Logging = new(this);
	}

	public ModuleMeter Meter { get; }
	public Diagnostics.Logging Logging { get; }
}
```
{% endcode %}

在业务处理器里按吞吐、次数或错误打点：

{% code title="Measurer.cs" %}
```csharp
protected override async ValueTask OnHandleAsync(Meter argument, Parameters parameters, CancellationToken cancellation)
{
	if(argument.Metrics == null || argument.Metrics.Count == 0)
		return;

	Module.Current.Meter.Measurer.Count.Add(argument.Metrics.Count);
	Module.Current.Meter.Measurer.Count.Add(1, new KeyValuePair<string, object>("Kind", "Times"));
}
```
{% endcode %}

采集器可以把成功和失败分到不同 counter，并带上关键标签：

{% code title="AcquirerWorker.cs" %}
```csharp
private async void Acquirer_Acquired(object sender, AcquiredEventArgs args)
{
	if(args.Cancelled)
		return;

	KeyValuePair<string, object>[] tags = [];
	if(!args.Result.IsEmpty)
		tags =
		[
			new(nameof(args.Result.Key), args.Result.Key),
			new(nameof(args.Result.Code), args.Result.Code),
			new(nameof(args.Result.Extra), args.Result.Extra),
		];

	if(args.Error == null)
	{
		Module.Current.Meter.Acquirer.Count.Add(1, tags);
		await Module.Current.Events.Acquirer.OnAcquiredAsync(args.Result);
	}
	else
	{
		Module.Current.Meter.Acquirer.Error.Add(1, tags);
	}
}
```
{% endcode %}

{% hint style="warning" %}
标签不要放高基数字段，例如完整异常文本、随机 ID、长地址或原始报文。高基数标签会让时序数据库和导出器压力迅速放大。需要排障细节时，用日志记录原始内容，用指标记录分类和计数。
{% endhint %}

## 协议采集器打点

协议插件可以使用独立的 `Diagnostor` 门面，把同一协议下的 DA、UA 或不同驱动分组。下面的结构来自 OPC 协议项目的典型写法：

{% code title="Automao.Things.Protocols.Opc/Diagnostor.cs" %}
```csharp
public sealed class Diagnostor
{
	private readonly Meter _meter;

	private static readonly Lazy<Diagnostor> _current = new(() => new Diagnostor());
	public static Diagnostor Current => _current.Value;

	private Diagnostor()
	{
		_meter = Module.Current.Services.ResolveRequired<IMeterFactory>().Create("Automao.Things.Protocols.Opc");
		this.DA = new DAMeter(_meter);
		this.UA = new UAMeter(_meter);
	}

	public readonly UAMeter DA;
	public readonly UAMeter UA;

	public sealed class UAMeter
	{
		internal UAMeter(Meter meter)
		{
			this.Count = meter.CreateCounter<long>($"{nameof(UA)}.{nameof(Count)}");
			this.Events = meter.CreateCounter<long>($"{nameof(UA)}.{nameof(Events)}");
			this.Opens = meter.CreateCounter<long>($"{nameof(UA)}.{nameof(Opens)}");
			this.Closes = meter.CreateCounter<long>($"{nameof(UA)}.{nameof(Closes)}");
			this.Reads = meter.CreateCounter<long>($"{nameof(UA)}.{nameof(Reads)}");
			this.Writes = meter.CreateCounter<long>($"{nameof(UA)}.{nameof(Writes)}");
		}

		public readonly Counter<long> Count;
		public readonly Counter<long> Events;
		public readonly Counter<long> Opens;
		public readonly Counter<long> Closes;
		public readonly Counter<long> Reads;
		public readonly Counter<long> Writes;
	}
}
```
{% endcode %}

在采集器生命周期中使用这些 counter：

{% code title="UaAcquirer.cs" %}
```csharp
protected override async ValueTask<bool> OnOpenAsync(AcquirerSettings settings, CancellationToken cancellation)
{
	try
	{
		await _client.ConnectAsync(options, cancellation);
		Diagnostor.Current.UA.Opens.Add(1);
		return true;
	}
	catch(Exception ex)
	{
		Module.Current.Logging.Error(this, ex.Message, ex, options);
		Zongsoft.Diagnostics.Logging.GetLogging<UaAcquirer>().Error(ex, options);
		return false;
	}
}

private ValueTask OnFlushAsync(IEnumerable<Meter.Metric> metrics, CancellationToken cancellation)
{
	Diagnostor.Current.UA.Events.Add(1, new KeyValuePair<string, object>("Name", "Flushing"));

	var meter = new Meter(this.Name, null, DateTime.Now, metrics);
	this.OnAcquired(meter, cancellation);

	Diagnostor.Current.UA.Events.Add(1, new KeyValuePair<string, object>("Name", "Flushed"));
	return ValueTask.CompletedTask;
}

private void OnConsume(Subscriber subscriber, Subscriber.Entry entry, object value)
{
	Diagnostor.Current.UA.Events.Add(1, new KeyValuePair<string, object>("Name", "Arriving"));

	var data = this.GetResult(entry, value);
	_spooler.PutAsync(data);

	Diagnostor.Current.UA.Events.Add(1, new KeyValuePair<string, object>("Name", "Arrived"));
	Diagnostor.Current.UA.Count.Add(1);
	Diagnostor.Current.UA.Count.Add(1, new KeyValuePair<string, object>("Code", data.Key));
}
```
{% endcode %}

这个范例中：

| 指标 | 含义 |
| --- | --- |
| `UA.Opens` | OPC-UA 采集器打开次数。 |
| `UA.Closes` | OPC-UA 采集器关闭次数。 |
| `UA.Reads` | 主动读取次数。 |
| `UA.Events` | 生命周期或数据事件次数，使用 `Name` 标签区分事件名。 |
| `UA.Count` | 数据到达数量，可带 `Code` 标签观察某类指标。 |

## 采集配置

业务代码创建 meter 后，还需要宿主配置采集该 meter。协议插件可以在 `.option` 中声明自己的 meter 名称：

{% code title="Automao.Things.Protocols.Opc.option" %}
```xml
<options>
	<option path="/Diagnostics">
		<diagnostor>
			<meters>
				<filter>Automao.Things.Protocols.Opc</filter>
			</meters>
		</diagnostor>
	</option>
</options>
```
{% endcode %}

完整导出配置通常由诊断插件或站点配置补充 exporter：

{% code title="Zongsoft.Diagnostics.option" %}
```xml
<option path="/Diagnostics">
	<diagnostor>
		<meters>
			<filter>Automao.Things.Protocols.Opc</filter>

			<exporters>
				<exporter exporter.name="telemetry"
				          driver="telemetry"
				          settings="server=http://localhost:4317;protocol=grpc;processorType=batch;timeout=30s;interval=15s;" />
				<exporter exporter.name="prometheus"
				          driver="prometheus"
				          settings="urls=http://127.0.0.1:9464,http://localhost:9464;path=/metrics;totalSuffix=true;cacheDuration=300ms;" />
			</exporters>
		</meters>
	</diagnostor>
</option>
```
{% endcode %}

{% hint style="warning" %}
`DiagnostorWorker` 只有在某个分组同时具备至少一个 filter 和至少一个 exporter 时，才会创建对应的 OpenTelemetry provider。单独声明 filter 可以表达模块希望被采集，但最终是否导出仍取决于宿主合并后的配置。
{% endhint %}

`*` filter 会启用默认 .NET/ASP.NET Core meter/source，并加入当前应用模块名。快速接入时可以使用 `*`，生产环境建议显式列出关心的 meter 名称，减少无关指标。

## OpenTelemetry 实现

独立的 `Zongsoft.Diagnostics` 项目基于 OpenTelemetry .NET 实现诊断管线。插件启动时会：

1. 把 `MeterProvider.Default` 和 `ExporterProvider.Default` 暴露到 `/Workbench/Diagnostics`。
2. 把 `DiagnostorWorker` 挂到 `/Workbench/Startup`。
3. 从 `/Diagnostics/Diagnostor` 读取 `Meters` 和 `Traces`。
4. 对指标调用 `AddMeter(...)`，对追踪调用 `AddSource(...)`。
5. 按 exporter 的 `Driver` 查找 `IExporterLauncher<TArgument>` 并接入导出器。
6. 停止时调用 provider 的 `Shutdown()` 并释放对象。

内置 exporter driver：

| Driver | 适用信号 | 说明 |
| --- | --- | --- |
| `telemetry` 或 `OpenTelemetry` | Metrics、Traces | 使用 OTLP exporter，支持 gRPC 或 HTTP/Protobuf。 |
| `Console` | Metrics、Traces | 输出到控制台或调试输出目标。 |
| `Prometheus` | Metrics | 启用 Prometheus exporter 和 HttpListener 抓取端点。 |
| `Zipkin` | Traces | 把 trace 导出到 Zipkin endpoint。 |

## Metrics 数据模型

`Zongsoft.Diagnostics.Telemetry.Metrics` 是一组与 OpenTelemetry 指标数据形状接近的轻量模型，主要用于协议接收、转换或内部传递：

| 类型 | 说明 |
| --- | --- |
| `Metrics.Meter` | 表示一个 meter 及其指标集合，包含名称、版本和标签。 |
| `Metric` | 指标基类，包含名称、单位、说明和标签。 |
| `Metric.Counter` | 计数器指标，包含是否单调递增以及一组点。 |
| `Metric.Histogram` | 直方图指标，包含计数、总值、最小值、最大值和时间范围。 |
| `Metric.Summary` | 摘要指标，包含计数、总值和分位值。 |

这些类型不是 .NET 实时指标 API 的替代品。业务打点仍应使用 `System.Diagnostics.Metrics`；`Metrics` 子命名空间更适合接收 OTLP 指标、转换协议数据或表达导入后的指标数据。

## 设计建议

* meter 名称使用模块或协议全名，例如 `Things`、`Automao.Things.Protocols.Opc`，便于配置 filter。
* instrument 名称用分组加动作，例如 `UA.Opens`、`UA.Events`、`Measurer.Count`。
* 计数器适合事件次数和吞吐量；耗时分布应使用 histogram；当前状态值再考虑 gauge。
* 标签用来表达低基数分类，例如 `Name=Arrived`、`Status=Success`、`Kind=Times`。
* 日志记录失败原因和上下文，指标记录数量、速率和分布；两者配合使用，不要互相替代。

## 相关资源

* [Zongsoft.Diagnostics 核心源码](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Diagnostics)
* [Zongsoft.Diagnostics 实现项目](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Diagnostics)

* [.NET 指标概述](https://learn.microsoft.com/zh-cn/dotnet/core/diagnostics/metrics)
* [OpenTelemetry .NET](https://github.com/open-telemetry/opentelemetry-dotnet)
