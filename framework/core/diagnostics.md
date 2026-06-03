---
description: Zongsoft.Core 中诊断日志抽象的职责、扩展点和业务日志用法。
icon: stethoscope
---

# Zongsoft.Diagnostics

`Zongsoft.Diagnostics` 是 `Zongsoft.Core` 中的诊断日志基础层。它提供运行日志、异常日志和业务操作日志所需的最小抽象，但不强制绑定某个日志框架或存储方案。

核心思路是把“产生日志”和“处理日志”分开：

* 业务或框架代码通过 `Logging`、`LoggingBase<TLog>` 产生日志项。
* 日志项实现 `ILog`，表达级别、来源、消息、时间和异常。
* 一个或多个 `ILogger` 负责过滤、格式化、缓冲和写入目标介质。
* 插件树通过 `/Workbench/Diagnostics/Loggers` 挂载 logger，最终进入 `Logging.Loggers` 集合。

{% hint style="info" %}
遥测指标、追踪源和 OpenTelemetry 导出配置已拆到 [Telemetry](diagnostics/telemetry.md)。本页只讨论日志模型和日志落库。
{% endhint %}

## 使用边界

| 场景 | 推荐入口 | 说明 |
| --- | --- | --- |
| 框架运行日志 | `Logging.GetLogging(...)` | 记录组件运行、后台任务、异常兜底等信息，默认可以写入文本文件。 |
| 终端诊断日志 | `ConsoleLogger` | 终端或控制台宿主中输出彩色日志内容。 |
| 业务操作日志 | `LoggingBase<TLog>` + 自定义 `LoggerBase<TLog>` | 定义业务日志模型，把用户、租户、模块、操作目标、动作和内容写入数据库或分析型存储。 |

运行日志关注程序是否正常，业务日志关注用户做了什么。两者可以走同一套抽象，但不建议使用同一个日志模型。

## 日志项

`ILog` 是日志项的最小契约：

| 属性 | 说明 |
| --- | --- |
| `Level` | 日志级别。 |
| `Source` | 日志来源，通常是程序集、模块或业务对象。 |
| `Message` | 人可读的摘要消息。 |
| `Timestamp` | 日志产生时间。 |
| `Exception` | 异常对象，可为空。 |

`LogEntry` 是默认实现，适合运行日志。它会自动从异常补齐消息、来源和异常数据；如果 `data` 参数本身是异常，也会转成 `Exception`。

`LogLevel` 从低到高为 `Trace`、`Debug`、`Info`、`Warn`、`Error`、`Fatal`。默认文本文件 logger 只记录 `Info` 及以上级别，因此调试级别日志不会默认进入生产文件。

## Logging 入口

`Logging` 是日志分发入口。它不是单个 logger，而是一个按名称创建 `LogEntry` 并分发给全局 logger 集合的轻量门面。

{% code title="RuntimeLogging.cs" %}
```csharp
using Zongsoft.Diagnostics;

public sealed class Worker
{
	private readonly Logging _logging = Logging.GetLogging<Worker>();

	public async ValueTask RunAsync(CancellationToken cancellation)
	{
		try
		{
			await this.ExecuteAsync(cancellation);
			_logging.Info("工作器执行完成。");
		}
		catch(OperationCanceledException)
		{
			_logging.Warn("工作器被取消。");
			throw;
		}
		catch(Exception ex)
		{
			_logging.Error("工作器执行失败。", ex, new { Worker = nameof(Worker) });
			throw;
		}
	}
}
```
{% endcode %}

常用入口如下：

| 方法 | 来源名称 |
| --- | --- |
| `Logging.Default` | 入口程序集名。 |
| `Logging.GetLogging<T>()` | `T` 所在程序集名。 |
| `Logging.GetLogging(instance)` | 实例实际类型所在程序集名。 |
| `Logging.GetLogging("name")` | 指定名称。 |

如果 `Logging.Loggers` 为空，并且日志项是 `LogEntry`，`Logging` 会回退到 `TextFileLogger.Default`。在插件化宿主中，`Zongsoft.Plugins` 的主插件会把 `Logging.Loggers` 暴露为 `/Workbench/Diagnostics/Loggers`，默认挂入 `TextFileLogger.Default`。

## Logger 扩展点

`ILogger` 表示日志输出器，负责接收日志、刷新缓冲和释放前的持久化。实现 logger 时通常继承 `LoggerBase<TLog>`：

| 类型 | 说明 |
| --- | --- |
| `LoggerBase<TLog>` | 提供空值检查、`Predication` 过滤和统一的 `FlushAsync` 入口。 |
| `LoggerBase<TLog, TModel>` | 在 logger 上绑定 `ILogFormatter<TLog, TModel>`。 |
| `FileLogger<TLog, TModel>` | 文件 logger 基类，支持缓冲写入、按来源分组和滚动文件。 |
| `TextFileLogger` | 默认文本文件 logger，使用 XML 风格格式化器。 |
| `ConsoleLogger` | 控制台/终端 logger。 |

`LoggerPredicationOptions` 可以为 logger 设置过滤条件。配置路径为 `/Diagnostics/Loggers/{loggerName}/Predication`；无名称 logger 使用 `/Diagnostics/Loggers/Predication`。该选项模型包含 `MinLevel`、`MaxLevel`、`Sources` 和 `Exceptions`，来源支持前缀、后缀或包含式的 `*` 通配模式。

## 文件日志

`TextFileLogger` 适合低成本地保留框架运行日志。默认路径形如：

```text
~/logs/yyyyMM/{source}-{sequence}.log
```

`~` 表示应用目录，`{source}` 来自日志项的 `Source`，`{sequence}` 根据文件大小限制滚动。`FileLogger<TLog, TModel>` 内部使用缓冲器批量写入；遇到 `Error` 及以上级别会主动刷新，降低严重错误丢失的概率。

{% hint style="warning" %}
文件日志适合排障，不适合作为业务审计主存储。业务审计通常需要可查询字段、权限隔离、保留策略和统计分析能力，应使用自定义业务日志模型。
{% endhint %}

## 业务日志模型

业务系统通常需要把操作日志保存到关系型数据库或时序/分析型数据库。推荐先定义业务日志模型，而不是直接使用 `LogEntry`。

{% code title="BusinessLog.cs" %}
```csharp
using Zongsoft.Diagnostics;

public sealed class BusinessLog : ILog
{
	private readonly Exception _exception;

	public BusinessLog(LogLevel level, string message, Exception exception = null, string content = null)
	{
		this.Level = level;
		this.Message = string.IsNullOrEmpty(message) ? exception?.Message : message;
		this.Content = content;
		this.Timestamp = DateTime.Now;
		_exception = exception;
	}

	public ulong LogId { get; set; }
	public uint UserId { get; set; }
	public string Site { get; set; }
	public uint TenantId { get; set; }
	public uint BranchId { get; set; }
	public string Module { get; set; }
	public string Domain { get; set; }
	public string Target { get; set; }
	public string Action { get; set; }
	public string Content { get; set; }

	public LogLevel Level { get; set; }
	public string Message { get; set; }
	public DateTime Timestamp { get; set; }

	Exception ILog.Exception => _exception;
	string ILog.Source => string.IsNullOrEmpty(this.Module) ? this.Target : $"{this.Module}:{this.Target}";
}
```
{% endcode %}

这种模型保留 `ILog` 所需的最小字段，同时增加业务查询常用字段。落库时可以映射到类似 `LogId`、`UserId`、`TenantId`、`BranchId`、`Module`、`Domain`、`Target`、`Action`、`Site`、`Level`、`Message`、`Content`、`Timestamp` 的表结构。

## 业务 Logging

继承 `LoggingBase<TLog>` 可以把调用点的日志方法转换为业务日志模型。它会自动用 `CallerMemberName` 作为 `Action`，并可根据对象、类型或字符串生成来源。

{% code title="BusinessLogging.cs" %}
```csharp
using Zongsoft.Services;
using Zongsoft.Diagnostics;

public sealed class BusinessLogging(IApplicationModule module) : LoggingBase<BusinessLog>
{
	protected override BusinessLog CreateLog(
		LogLevel level,
		string message,
		Exception exception,
		object data,
		string source,
		string action)
	{
		var moduleName = module?.Name;
		var index = source?.IndexOf(':') ?? -1;

		if(index > 0)
		{
			moduleName = source[..index];
			source = source[(index + 1)..];
		}

		return new BusinessLog(level, message, exception, GetContent(data))
		{
			Module = string.IsNullOrEmpty(moduleName) ? "_" : moduleName,
			Domain = "_",
			Target = source,
			Action = action,
		};
	}

	private static string GetContent(object data)
	{
		if(data == null)
			return null;
		if(data is string text)
			return text;
		if(data is byte[] binary)
			return Convert.ToBase64String(binary);

		try
		{
			return Zongsoft.Serialization.Serializer.Json.Serialize(data);
		}
		catch
		{
			return data.GetType().AssemblyQualifiedName;
		}
	}
}
```
{% endcode %}

在模块上暴露该门面后，业务代码可以使用统一入口：

{% code title="Module.cs" %}
```csharp
public sealed class Module : ApplicationModule<Module.EventRegistry>
{
	public static readonly Module Current = new();
	private Module() : base("Things") => this.Logging = new(this);
	public BusinessLogging Logging { get; }
}
```
{% endcode %}

{% code title="UseBusinessLogging.cs" %}
```csharp
public async ValueTask ActivateAsync(string key, string secret, CancellationToken cancellation)
{
	try
	{
		await this.ActivateCoreAsync(key, secret, cancellation);
		Module.Current.Logging.Info(this, "机器激活成功。", new { key }, "Activate");
	}
	catch(Exception ex)
	{
		Zongsoft.Diagnostics.Logging.GetLogging(this).Error(ex);
		throw;
	}
}
```
{% endcode %}

范例中的 `this` 会被转换为来源，`Activate` 会进入动作字段，匿名对象会被序列化为日志内容。这样查询时可以按模块、目标、动作和用户维度筛选，而不是从一段纯文本中解析。

## 数据库 Logger

业务 logger 负责补齐运行时上下文并写入存储。高频日志建议通过 `Spooler<T>` 批量刷新。

{% code title="DatabaseLogger.cs" %}
```csharp
using Zongsoft.Caching;
using Zongsoft.Security;
using Zongsoft.Services;
using Zongsoft.Diagnostics;

public sealed class DatabaseLogger : LoggerBase<BusinessLog>
{
	private readonly Spooler<BusinessLog> _spooler;
	private readonly Lazy<string> _site;

	public DatabaseLogger()
	{
		_spooler = new(this.FlushAsync, TimeSpan.FromSeconds(5), 1000);
		_site = new(() => ApplicationContext.Current?.Configuration?.GetOptionValue<string>(nameof(BusinessLog.Site)));
	}

	protected override ValueTask OnLogAsync(BusinessLog log, CancellationToken cancellation)
	{
		log.Module ??= "_";
		log.Domain ??= "_";
		log.Site ??= _site.Value;

		var identity = ApplicationContext.Current?.Principal?.Identity;
		if(identity != null && !identity.IsAnonymous())
		{
			if(log.UserId == 0)
				log.UserId = identity.GetIdentifier<uint>();
		}

		return _spooler.PutAsync(log, cancellation);
	}

	protected override ValueTask OnFlushAsync(CancellationToken cancellation) => _spooler.FlushAsync(cancellation);
	private async ValueTask FlushAsync(IEnumerable<BusinessLog> logs, CancellationToken cancellation)
	{
		try
		{
			await Module.Current.Accessor.ImportAsync(logs, cancellation);
		}
		catch(Exception ex)
		{
			Zongsoft.Diagnostics.Logging.GetLogging<DatabaseLogger>().Error(ex);
		}
	}
}
```
{% endcode %}

{% hint style="warning" %}
数据库写入失败时，不要再次写业务日志，否则可能形成递归失败。应使用运行日志记录 logger 自身的异常。
{% endhint %}

## 插件挂载

把业务 logger 挂到 `/Workbench/Diagnostics/Loggers` 后，`Logging.Loggers` 会自动分发给它。

{% code title="Business.plugin" %}
```xml
<extension path="/Workbench/Diagnostics/Loggers">
	<object name="Database" type="Demo.Diagnostics.DatabaseLogger, Demo" />
</extension>
```
{% endcode %}

如果同时挂载文件 logger、控制台 logger 和数据库 logger，同一条日志会分发给多个 logger。每个 logger 可通过自己的 `Predication` 决定是否处理。

## 设计建议

* 运行日志用于排障，业务日志用于审计和用户可见查询，不要把两者混成同一个表。
* 业务日志模型应包含稳定字段，`Content` 只放补充内容，不要把核心查询维度藏在 JSON 里。
* 高频日志要批量写入；同步逐条写数据库会放大业务请求延迟。
* `Warn` 适合记录可恢复的业务拒绝或异常状态，`Error` 适合记录操作失败，`Fatal` 只用于宿主或关键能力不可继续的情况。
* logger 内部异常要用运行日志兜底，避免业务日志系统故障导致业务主流程雪崩。

## 相关资源

* [Diagnostics 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Diagnostics)
* [Telemetry](diagnostics/telemetry.md)
* [诊断插件](../diagnostics.md)
