---
description: 将完整发布目录制作为 Linux 安装包，检查入口、systemd 和安装生命周期。
icon: box
---

# 打包工具 dotnet-pack

`dotnet-pack` 将已经准备好的应用目录制作为 `.tar.gz`、`.deb` 或 `.rpm`，并生成安装所需的元数据与生命周期脚本。它不会替你编译业务插件或自动补齐运行目录。

## 选择格式

| 命令 | 产物 | 适用交付方式 |
| --- | --- | --- |
| `tar` | tar.gz 及安装脚本 | 显式运行安装/卸载流程 |
| `deb` | Debian 包 | 目标系统包管理器 |
| `rpm` | RPM 包 | 目标系统包管理器 |

工具使用 .NET 写入格式，打包期不依赖外部打包命令；验证及安装仍应在适合的目标环境进行。Windows 生成 Linux 包时，还需检查可执行权限的推断结果。

## 制作一个包

先安装 `Zongsoft.Tools.Packager` 全局工具，并把宿主及插件部署到 `publish`。下面是 Bash 示例：

{% code title="PackApplication.sh" %}
```bash
dotnet-pack deb \
	--name:Acme.Service \
	--title:"Acme Service" \
	--version:1.0.0 \
	--platform:linux \
	--architecture:x64 \
	--framework:net10.0 \
	--source:./publish \
	--output:./packages/
```
{% endcode %}

PowerShell 中不要使用 Bash 的反斜杠续行，可以把参数写在同一行。`name` 应与实际应用入口相符，而不是仅填写产品展示名。

## 文件和安装路径

未显式选择打包项时按命令规则收集源目录；可以用文件、目录、末级通配符和 `source:target` 别名控制内容。`--exclude` 用于排除日志、缓存和测试配置，不能假定支持 deployer 的全部跨级通配语法。

根路径别名如 `/etc/acme/app.conf` 表示安装到系统路径。deb/rpm 将它作为对应根路径项处理，tar 放到 `.root/` 并由安装脚本复制。应用文件与机器配置的更新、保留和删除策略应分别确认。

## systemd 入口

未禁用时，工具会使用指定服务文件或生成服务。`--daemon:none`、`disable`、`disabled` 可禁用服务生成；省略 daemon 并不等于禁用。

`--name` 参与宿主入口推断，`--daemon` 可以指定服务标识，`--install-path` 指定安装目录。Web 宿主应保持入口 `Zongsoft.Hosting.Web`，服务名可为 `zongsoft.web`，避免生成启动 `Zongsoft.Web.dll` 类库的服务。

`--daemon-bind:8080` 会生成本机 HTTP 地址参数；`--daemon-environments` 可将选定变量写入服务文件。秘密进入服务文件前需要明确权限和维护方式。

## 生命周期与验证

安装前后、卸载前后支持扩展脚本。当前生成器区分 Debian 升级动作及 RPM 剩余实例，避免把升级误当最终卸载；旧版已安装包携带的脚本仍可能影响升级，所以还需测试受支持的旧版路径。

{% code title="InspectPackages.sh" %}
```bash
tar -tf application.tar.gz
dpkg-deb --info application.deb
dpkg-deb --contents application.deb
rpm -qip application.rpm
rpm -qlp application.rpm
rpm -qp --scripts application.rpm
```
{% endcode %}

以上按实际生成格式选择执行，替换文件名；它们检查产物，不执行安装。重点核对入口文件、安装路径、依赖、权限、配置标记及服务脚本，再在可丢弃目标环境验证首次安装、升级和最终卸载。

{% hint style="warning" %}
🚨 安装包中的脚本会修改系统服务与路径。包能被读取不代表安装、升级和卸载都安全；不要直接用生产应用验证生成规则。
{% endhint %}

源码入口：[打包器](https://github.com/Zongsoft/tools/tree/main/packager)、[完整选项](https://github.com/Zongsoft/tools/blob/main/packager/README.zh-Hans.md)。
