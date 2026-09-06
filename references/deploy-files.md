---
description: 查阅部署章节、解析器、变量、条件、NuGet 资产及删除语义。
icon: file-lines
---

# 部署文件格式

`.deploy` 是供[部署工具](../tools/deployer.md)读取的 INI 风格文本。它在部署时执行，不是宿主的运行配置，也不会自动成为插件依赖声明。

## 章节和条目

{% code title="Acme.deploy" %}
```ini
[plugins acme orders]
../Acme.Orders/bin/$(edition)/$(framework)/Acme.Orders.dll
../Acme.Orders/Acme.Orders.plugin
../configuration/orders.$(environment).option = Acme.Orders.option
```
{% endcode %}

`[plugins acme orders]` 表示目标目录层次。没有显式目标名时，文件按源名称放入章节目录；等号右侧可重命名或指定目标路径。源相对路径按部署描述文件上下文解析。

一般条目形状为 `resolver:argument = destination <filter>`，其中解析器、目标和过滤条件都可按具体语法省略。

## 解析器

| 写法 | 含义 |
| --- | --- |
| `../Plugin/Plugin.dll` | 默认本地路径解析器 |
| `:D:/Build/Plugin.dll` | 显式空解析器，避免盘符被识别为解析器名 |
| `nuget:Package@version/path` | 指定包、可选版本和包内路径 |
| `delete:obsolete.dll` | 删除当前章节目标下的文件，`remove` 为同义名称 |

本地源路径支持 `*`、`?` 和跨级目录 `**`。这些规则属于 deployer，不应套用到其他打包工具的过滤器。

{% hint style="danger" %}
🚨 `delete/remove` 会删除目标文件，且不接受等号右侧的目标路径部分。部署前确认章节和目标根目录，不要用含糊的通配规则清理共享目录。
{% endhint %}

## 变量与覆盖

支持 `$(name)` 和 `%name%`，名称不区分大小写。加载顺序为环境变量、目标应用的 `appsettings.json`、命令行选项，后者覆盖前者。`ApplicationName` 可通过 `application` 别名引用。

常见变量是 `edition`、`framework`、`platform`、`architecture`、`scheme`、`environment` 和 `site`，但它们的业务意义由部署方案确定。工具不会因为变量叫 `environment` 就自动生成相应配置文件。

在 PowerShell 命令行传入包含 `$(...)` 的字面参数时，应使用单引号防止 PowerShell 提前执行插值。部署文件内部则直接使用变量语法。

## 条件过滤

{% code title="Environment.deploy" %}
```ini
[plugins acme orders]
orders.$(environment)-debug.option = Acme.Orders.option <debug:on>
orders.$(environment).option = Acme.Orders.option <!debug:on>
optional.dll <feature>
compatibility.dll <framework:net8.0^>
```
{% endcode %}

| 条件 | 判断 |
| --- | --- |
| `<feature>` / `<!feature>` | 变量存在 / 不存在，不依据值是否为 true |
| `<site:web,api>` | 值匹配候选之一，忽略大小写 |
| `<!debug:on>` | 对匹配结果取反 |
| `<feature & debug:on>` | 两个条件均满足 |
| `<feature \| debug:on>` | 任一条件满足 |
| `<framework:net8.0^>` | 目标框架版本至少为指定版本 |

过滤不满足时条目被跳过。检查产物缺失时应同时检查变量是否存在、值是否正确及条件是否被满足。

## NuGet 资产与依赖

省略版本或使用 `latest` 会选择最新包；可重复发布应固定经过验证的版本。未指定包内路径时，优先执行根 `.deploy`，否则使用最接近 `Framework` 的 `lib/{framework}` 资产。

`NuGet_Server` 配置包源，`NuGet_Packages` 配置缓存目录。默认依赖忽略前缀包含 `System.`、`Microsoft.Extensions.`、`Zongsoft.`，可通过 `ignoreDependentPrefix` 指定需要忽略的前缀。

包解析会访问包源并递归处理依赖，但最终仍是顺序复制，不会替运行目录统一求解依赖版本。多个包向同一路径写入时，应核对覆盖策略和最终程序集，尤其是原生资源及插件首次调用路径。

## 与其他描述文件的关系

`.plugin` 声明运行组件和扩展，`.option` 提供运行配置，`.mapping` 提供数据元数据，`.deploy` 决定这些文件怎样进入目标目录。文件已复制不代表插件可加载；清单可加载也不代表配置和外部服务可用。

下一步：[部署宿主](../hosting/deployment.md)、[选项配置文件](option-files.md)。
