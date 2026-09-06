---
description: 制作 ZIP 升级包与 manifest，理解文件选择、校验和更新与发布顺序。
icon: arrows-rotate
---

# 升级打包器 dotnet-upgrade

`Zongsoft.Tools.Upgrader` 位于 framework 的 `upgrading/tool`，生成供[自动升级](../framework/upgrading.md)消费的 ZIP 和 manifest。它与制作 deb/rpm 的 `dotnet-pack` 是不同工具。

## 安装和输入目录

{% code title="InstallUpgradeTool.ps1" %}
```powershell
dotnet tool install -g Zongsoft.Tools.Upgrader
```
{% endcode %}

打包前先构建、发布并部署完整应用到独立目录。避免直接打包运行中的目录：日志或数据库可能被锁定，内容也可能在收集期间变化。

## 制作全量包

以下 PowerShell 命令以独立 `publish` 目录为输入：

{% code title="PackUpgrade.ps1" %}
```powershell
dotnet-upgrade pack --name:Acme.Service --version:1.1.0 --edition:stable --framework:net10.0 --platform:windows --architecture:x64 --kind:Fully --checksum:sha256 --source:./publish --output:./releases/ --exclude:'logs/;.garnet/;'
```
{% endcode %}

`name` 必须匹配运行时应用名，`edition` 是发布分发名；它与 deployer 中表示编译输出配置的同名变量不同。`version`、`platform`、`framework` 为必要信息，架构必须符合目标应用。

未指定输出文件名时，按 `{name}[-edition]@{version}_{runtime}` 命名，生成 ZIP 及配对 `.manifest`。清单包含身份、类型、大小、checksum、包路径以及可选说明和执行器。

## 选择文件与变量

没有位置参数时收集整个源目录，指定参数后按文件或目录选择。支持末级 `*`、`?`，`source:target` 用于重定位；目标为空、`~` 或 `/` 可表示包根目录。重复 ZIP 条目会警告并跳过，不会静默覆盖。

排除规则以分号分隔，不应假定支持 `**` globstar。变量支持 `$(name)` 和 `%name%`，先使用命令选项，再使用环境变量；PowerShell 应以单引号传递需要工具展开的字面变量。

`Delta` 只是覆盖型增量文件包，不是自动生成二进制差分。选择全量或增量前，先阅读[发布类型及清理边界](../framework/upgrading.md)。

## checksum 会修改清单

{% code title="RefreshChecksum.ps1" %}
```powershell
dotnet-upgrade checksum ./releases/Acme.Service-stable@1.1.0_win-x64.zip
```
{% endcode %}

命令可接受 ZIP、manifest 或无扩展名包名，重新计算并更新配对 manifest。它不是只读的“验证通过/失败”检查；比较原始发布是否被篡改时，应保存可信原始校验信息，不能先重算覆盖它。

## 发布通道与顺序

`publish` 支持 `amazon.s3`（别名 `s3`）和 `web`。S3 通道上传包与清单；Web 通道按导入 manifest、上传对应包、标记已发布的顺序执行。具体凭据和目标参数见[发布选项](https://github.com/Zongsoft/framework/blob/main/upgrading/tool/README.zh-Hans.md)。

先检查 ZIP 条目、清单身份与配对关系，再执行发布。发布完成后还需验证发现接口能为目标应用返回正确版本，而不是只检查存储中出现一个 ZIP。

## 执行器和完成判断

执行器选项使用 `--executor.<name>@<event>:"command"`，当前内置 Copy、Move、Link、Delete，事件包括 Deploying、Deployed。它们会在部署阶段操作文件，不是普通发布说明；缺少事件名的定义会警告并忽略。

{% hint style="warning" %}
🚨 当前打包失败时可能留下不完整 ZIP，进程退出码也可能仍为零。验收必须同时检查日志、ZIP 可读性和配对 manifest，不能仅以退出码判断成功。
{% endhint %}

升级完成还需检查目标进程及业务健康，详见[升级接入与恢复](../framework/upgrading/workflow.md)。
