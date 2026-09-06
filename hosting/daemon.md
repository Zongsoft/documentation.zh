---
description: 承载长期后台任务，正确区分宿主生命周期集成、服务安装和业务就绪。
icon: gears
---

# 后台服务宿主

后台服务宿主用于消息消费、计划任务、同步处理等长期工作。业务通过插件[工作器](../framework/core/components/worker.md)接入启动和停止，不需要把循环直接写进宿主入口。

## 平台生命周期

当前入口使用 `Application.Daemon("zongsoft.daemon", ...)`，并传入 `host=daemon`、`site=daemon`。按构建平台条件集成 Windows Service 或 systemd。

来源：[hosting/daemon/Program.cs](https://github.com/Zongsoft/hosting/blob/main/daemon/Program.cs#L9)（节选；上下文见源文件）。

{% code title="Program.cs" %}
```csharp
static void Main(string[] args)
{
	#if WINDOWS
	Zongsoft.Plugins.Hosting.Application
		.Daemon("zongsoft.daemon", [.. args, "host=daemon", "site=daemon"], builder =>
		{
			builder.Services.AddWindowsService(options => options.ServiceName = builder.Environment.ApplicationName);
		}).Run();
	#elif LINUX
	Zongsoft.Plugins.Hosting.Application
		.Daemon("zongsoft.daemon", [.. args, "host=daemon", "site=daemon"], builder =>
		{
			builder.Services.AddSystemd();
		}).Run();
	#else
	Zongsoft.Plugins.Hosting.Application
		.Daemon("zongsoft.daemon", [.. args, "host=daemon", "site=daemon"])
		.Run();
	#endif
}
```
{% endcode %}

这些调用让宿主响应系统服务生命周期，不会自动在操作系统中安装服务。服务注册、启动账号、工作目录、自动启动和恢复策略由安装包或运维配置完成。

## 接入顺序

1. 在[终端宿主](terminal.md)中验证业务配置和处理器。
2. 准备 daemon 的发布目录，检查 Main、daemon 方案和业务插件。
3. 在前台启动已部署程序，确认没有依赖终端输入的逻辑。
4. 通过符合目标系统的安装流程注册服务，检查实际运行账号和路径。
5. 验证业务就绪、停止和重启后的恢复，而不只检查服务状态为 Running。

## 工作器应怎样运行

启动阶段完成必要初始化，持续循环应响应取消，并避免无界创建后台任务。外部服务暂时不可用时，应有明确重连或失败策略；不能吞掉异常后让进程看似健康却不再处理工作。

停止阶段先停止接收，再在允许时间内处理在途任务。消息消费需要结合[确认与幂等](../framework/messaging/reliability.md)，定时作业需要结合[调度生命周期](../framework/externals/execution.md)。

## 安装与账号

Windows 目录提供 `install.cmd` 和 `uninstall.cmd`；Linux 安装包由[打包工具](../tools/packager.md)生成服务文件和生命周期脚本。执行前核对服务名、程序路径及数据目录。

{% hint style="warning" %}
🚨 安装/卸载会修改系统服务配置。服务账号看到的环境变量、用户目录、证书和网络权限可能与交互账号不同，必须使用实际服务身份验证依赖访问。
{% endhint %}

## 常见故障

启动即退出时，检查入口、运行时、程序集及配置加载错误。进程存活但不工作时，检查工作器是否挂载、启动是否失败、消息订阅或作业存储是否正常。仅在服务环境出错时，重点比较工作目录、账号和环境配置。

日志和持久数据应有独立路径及权限，尤其采用[全量升级](../framework/upgrading.md)时，不能把应用内数据默认当作被保留的内容。

源码入口：[后台宿主](https://github.com/Zongsoft/hosting/tree/main/daemon)。
