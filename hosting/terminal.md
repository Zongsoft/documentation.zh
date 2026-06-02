---
description: 终端宿主的定位和使用场景。
icon: terminal
---

# 终端宿主

终端宿主是基于 Zongsoft 插件框架的控制台应用宿主。它适合交互式调试、命令行复现和观察插件式应用行为。

## 代码位置

```text
hosting/terminal
```

## 启动方式

终端宿主通过插件框架启动应用：

{% code title="Program.cs" %}
```csharp
Zongsoft.Plugins.Hosting.Application
	.Terminal("zongsoft.terminal", [.. args, "host=terminal", "site=daemon"])
	.Run();
```
{% endcode %}

## 适用场景

- 调试插件加载。
- 调试命令行能力。
- 观察事件、服务和后台工作者。
- 在不启动 Web 服务的情况下复现业务行为。
