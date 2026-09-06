---
description: 选择终端、后台或 Web 宿主，理解应用身份、配置目录和插件生命周期。
icon: server
---

# 宿主概览

宿主提供进程入口、配置、服务容器、日志和启停生命周期，插件提供业务能力。保持宿主入口简洁，可以让同一业务组件在不同部署方案中复用；复用的前提是目标宿主具备它需要的交互或协议能力。

## 选择宿主

| 类型 | 主要入口 | 适合场景 | 阅读 |
| --- | --- | --- | --- |
| Terminal | 交互命令 | 开发调试、手工诊断、复现后台行为 | [终端宿主](terminal.md) |
| Daemon | 长期工作器 | 消费消息、执行作业、系统服务 | [后台服务宿主](daemon.md) |
| Web | HTTP 管线 | 控制器、接口、网关 | [Web 宿主](web.md) |

终端可模拟后台业务，但 Web 控制器和中间件仍需 Web 宿主；使用终端输入的插件也不应无条件在无交互服务中启动。

## 当前源码构建方式

hosting 根目录的 `Directory.Build.props` 当前设置 `net10.0`，并启用 `ZongsoftFrameworkPathReferenced`，从相邻 framework 的对应输出引用类库。构建宿主之前，需要准备匹配目标框架和编译配置的框架产物。

框架库本身可能支持 .NET 8、9、10，这不代表每个宿主项目和所有依赖均使用相同目标。切换版本时还要核对项目、中央包版本和发布脚本，参见[环境准备](../get-started/prerequisites.md)。

## 运行目录与身份

{% code title="Application.layout" %}
```text
application/
	Host.dll
	Host.deps.json
	Host.runtimeconfig.json
	appsettings.json
	plugins/
		Main.plugin
		zongsoft/
		acme/
```
{% endcode %}

可执行文件名、运行时应用名、`host` 和 `site` 不一定相同。应用名影响配置及升级匹配，`host/site` 参与部署和运行配置选择。终端当前应用名为 `zongsoft.terminal`，但入口程序集为 `Zongsoft.Hosting.Terminal`。

工作目录、应用目录和内容根路径也应分开理解，见[基础概念](../overview/concepts.md#host)。从其他目录启动服务时，错误的相对路径可能导致配置、数据库或插件资源解析到不同位置。

## 一次完整启动的验证

先确认进程正确启动，再检查插件加载、构件与服务注册，最后验证业务调用。某些提供者延迟建立连接，首次访问才会暴露端点、权限或 DLL 版本错误。

停止时，宿主通知工作器停止并释放自己拥有的资源。业务工作器应停止接收新任务、传递取消、等待必要的在途操作；不应靠强制退出代替正常生命周期设计。

下一步：[部署宿主](deployment.md)、[容器化环境](containerization.md)、[插件宿主集成](../framework/plugins/hosting.md)。

源码入口：[hosting 仓库](https://github.com/Zongsoft/hosting)。
