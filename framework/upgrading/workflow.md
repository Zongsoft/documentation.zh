---
description: 配置升级发现与部署交接，验证发布状态，并按阶段定位升级失败。
icon: stairs
---

# 升级接入与故障恢复

先用可丢弃的应用目录完成一轮升级，再接入正式环境。准备旧版应用、新版完整运行目录、匹配平台的部署器，以及独立包存储；不要直接把开发源码目录当作升级目标。

## 1. 准备运行产物

在待升级应用中部署 `Zongsoft.Upgrading.Upgrader`，并将匹配平台与架构的部署器放入 `{应用目录}/.deployer/`。Windows 文件名为 `Zongsoft.Upgrading.Deployer.exe`；其他受支持平台按对应发布产物部署。

部署器是独立的 Native AOT 程序，仅复制应用内升级器 DLL 不足以工作。Linux 的启动流程还依赖 `systemd-run`；普通精简容器未必具备此环境。容器部署应先决定由外部编排替换镜像，还是在具备相应进程管理能力的环境中使用自升级。

## 2. 配置发现通道

Discussions 没有独立升级客户端配置。下面采用框架升级器随包选项，默认选择 Web 包管理器，并同时声明 File 通道；地址需要按待升级应用实际部署环境调整。

来源：[framework/upgrading/upgrader/Zongsoft.Upgrading.Upgrader.option](https://github.com/Zongsoft/framework/blob/main/upgrading/upgrader/Zongsoft.Upgrading.Upgrader.option#L3)（节选；上下文见源文件）。

{% code title="Zongsoft.Upgrading.Upgrader.option" %}
```xml
<options>
	<option path="/Upgrading">
		<connectionSettings default="Web">
			<connectionSetting connectionSetting.name="Web"
			                   value="url=http://127.0.0.1:8069/Upgrading/Upgrader;timeout=30s" />

			<connectionSetting connectionSetting.name="File"
			                   value="url=zfs.s3:/upgrading/releases/" />
		</connectionSettings>
	</option>
</options>
```
{% endcode %}

当前随包 `.option` 默认选择 `Web`。不要仅凭旧 README 中 `default="File"` 的示例判断部署默认值。应用配置文件的名称与覆盖规则见[选项配置文件](../../references/option-files.md)。

插件在启动工作器中注册升级器，默认周期为十分钟；周期大于等于五分钟时，还会在启动约十秒后安排一次检查。因此安装并启动插件之前，应先准备正确的发布源与停机策略。

## 3. 管理包与发布状态

制作 ZIP 与 manifest 后，Web 发布按“导入 manifest → 上传包 → 标记已发布”的顺序进行。服务端上传后从存储内容重新计算大小与校验和。包存储和元数据数据库是两类资源，需要一起备份并保证引用一致。

Web 模块需要数据引擎、实际数据库驱动、初始化后的升级库表结构，以及 `/Upgrading/Settings` 中配置的存储提供者。随包清单使用 SQLite 路径，若更换驱动，还应同步连接、数据库初始化和插件依赖。

发现入口的真实控制器方法如下。name 和 edition 来自路由，platform、architecture 及附加参数来自请求；调用时使用实际宿主发布身份，而不是把 Discussions 插件包名当成宿主名：

来源：[framework/upgrading/web/Controllers/UpgraderController.cs](https://github.com/Zongsoft/framework/blob/main/upgrading/web/Controllers/UpgraderController.cs#L48)（节选；上下文见源文件）。

{% code title="UpgraderController.cs" %}
```csharp
public async Task<IActionResult> GetAsync(string name, string edition, [FromQuery]Platform platform, [FromQuery]Architecture architecture, CancellationToken cancellation = default)
{
	if(string.IsNullOrWhiteSpace(name))
		throw new BadHttpRequestException($"The '{nameof(name)}' parameter is required.", StatusCodes.Status400BadRequest);

	var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

	foreach(var pair in this.Request.Query)
		parameters[pair.Key] = pair.Value;

	foreach(var header in this.Request.Headers)
		parameters[header.Key] = header.Value;

	using var stream = new MemoryStream();
	await Release.SaveAsync(stream, Upgrader.GetAsync(name, edition, platform, architecture, parameters, cancellation), cancellation);
	return this.File(stream.ToArray(), "application/manifest+xml");
}
```
{% endcode %}

响应使用共享发布协议的 XML。发布必须可见、已发布、未废弃，身份及版本范围匹配，并且包路径和正数大小可用。指定评估器时，还必须通过评估器。

评估器适合决定某个发布是否适合特定实例，例如灰度范围。请求参数和头只是输入，硬件字段也不是可靠身份凭证；认证及发布权限应由独立机制处理。评估器应尽量保持确定、无副作用，避免一次版本检查修改业务状态。

## 4. 理解准备和部署

应用内 `UpgradeAsync` 负责下载、按元数据验证、解压及写入 `.deployment`。返回 `true` 也可能是发现已有待部署描述，不能据此认为刚刚重新验证了所有文件。

`Deploy` 检查部署器存在，启动该程序后关闭当前宿主。进程外部署器等待宿主退出，独占读取描述文件，按全量或增量方式处理文件，再执行相应启动器。

| 应用/平台 | 当前重启路径 |
| --- | --- |
| Windows Web | IIS 应用池回收路径 |
| Windows 后台服务 | `sc start` |
| Linux/FreeBSD 服务 | `systemctl start` |
| 终端及通用宿主 | 直接启动进程 |

部署账号必须具备相应权限，宿主类型和启动参数必须正确。某个平台能运行 .NET，并不代表其中每一种系统服务管理方式都存在。

## 5. 检查结果与恢复

| 现象 | 优先检查 |
| --- | --- |
| 没发现发布 | 实际应用名、分发名、版本、平台/架构、发布状态、评估器 |
| 下载失败 | 包 URL、存储提供者、凭据、超时、文件大小和 checksum |
| 已有 `.deployment` 但不退出 | `.deployer` 是否存在、进程启动日志、文件锁 |
| 已退出但文件不完整 | 清理/复制错误、磁盘空间、文件占用、执行器日志 |
| 文件已更新但未恢复服务 | 启动器、服务名、工作目录、权限及实际进程日志 |

全量部署会清理应用内日志，升级验收时应把日志输出或快照保存在应用目录外。最后同时确认 `.deployment` 生命周期结束、`.version` 内容和新进程的健康状态。

失败后先保存描述文件、manifest、解压目录及日志的副本，判断停在哪个阶段。不要为了让工作器重新运行而直接删除所有交接信息；若文件已被部分替换，应依据已准备的恢复包和数据备份恢复到一致状态，再重新尝试。

源码入口：[客户端](https://github.com/Zongsoft/framework/tree/main/upgrading/upgrader)、[部署顺序](https://github.com/Zongsoft/framework/blob/main/upgrading/deployer/Deployer.Deploy.cs)、[Web 管理器](https://github.com/Zongsoft/framework/tree/main/upgrading/web)。
