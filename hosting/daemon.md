---
description: 后台服务宿主的定位、平台差异和服务托管方式。
icon: gears
---

# 后台服务宿主

后台服务宿主适合长期运行的服务程序。它可以按平台集成 Windows Service 或 Linux systemd。

## 代码位置

```text
hosting/daemon
```

## 平台集成

Windows 平台会注册 Windows Service：

```csharp
builder.Services.AddWindowsService(options => options.ServiceName = builder.Environment.ApplicationName);
```

Linux 平台会集成 systemd：

```csharp
builder.Services.AddSystemd();
```

## 安装脚本

daemon 目录包含安装和卸载脚本：

- `install.cmd`
- `uninstall.cmd`

{% hint style="warning" %}
安装和卸载服务通常需要管理员权限，并会修改本机服务配置。执行前应先阅读脚本内容。
{% endhint %}
