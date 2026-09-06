---
description: Zongsoft 常见包、模块和源码目录索引。
icon: boxes-stacked
---

# 包与模块索引

本页用于快速查找常见 NuGet 包、源码目录和用途。

## 核心框架

| 包 | 源码目录 | 用途 |
| --- | --- | --- |
| [`Zongsoft.Core`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) | `framework/Zongsoft.Core` | 核心抽象与基础类库 |
| [`Zongsoft.Plugins`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins) | `framework/Zongsoft.Plugins` | 插件框架 |
| [`Zongsoft.Plugins.Web`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Plugins.Web) | `framework/Zongsoft.Plugins.Web` | Web 插件化支持 |
| [`Zongsoft.Data`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Data) | `framework/Zongsoft.Data` | 数据引擎 |
| [`Zongsoft.Web`](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Web) | `framework/Zongsoft.Web` | Web 基础能力 |
| `Zongsoft.Security` | `framework/Zongsoft.Security` | 安全能力 |
| `Zongsoft.Diagnostics` | `framework/Zongsoft.Diagnostics` | 诊断能力 |

## 数据驱动

| 包 | 数据库 |
| --- | --- |
| `Zongsoft.Data.MsSql` | SQL Server |
| `Zongsoft.Data.MySql` | MySQL / MariaDB |
| `Zongsoft.Data.SQLite` | SQLite |
| `Zongsoft.Data.DuckDB` | DuckDB |
| `Zongsoft.Data.PostgreSql` | PostgreSQL |
| `Zongsoft.Data.Influx` | InfluxDB |
| `Zongsoft.Data.TDengine` | TDengine |
| `Zongsoft.Data.ClickHouse` | ClickHouse |

## 消息队列

| 包 | 中间件 |
| --- | --- |
| `Zongsoft.Messaging.Kafka` | Kafka |
| `Zongsoft.Messaging.RabbitMQ` | RabbitMQ |
| `Zongsoft.Messaging.Mqtt` | MQTT |
| `Zongsoft.Messaging.ZeroMQ` | ZeroMQ |

## 工具

| 包 | 命令 |
| --- | --- |
| `Zongsoft.Tools.Deployer` | `dotnet deploy` |
| `Zongsoft.Tools.Packager` | `dotnet-pack` |
| `Zongsoft.Tools.Upgrader` | `dotnet-upgrade` |

## 应用能力与配套组件

| 包或组件 | 指南 | 部署关注点 |
| --- | --- | --- |
| `Zongsoft.Commands` | [命令](../framework/core/components/commands.md) | 通用命令集合，包括调度命令 |
| `Zongsoft.Web.OpenApi`、`Zongsoft.Web.Grpc` | [协议接入](../framework/web/protocols.md) | 文档/调试入口与 gRPC 路由 |
| `Zongsoft.Security.Web`、`Zongsoft.Security.Captcha` | [安全](../framework/security.md) | 身份接口与验证码分别配置 |
| `Zongsoft.Diagnostics.Protocols.Client`、`Zongsoft.Diagnostics.Protocols.Server` | [OTLP](../framework/diagnostics/otlp.md) | 协议类型/客户端与接收处理器 |
| `Zongsoft.Intelligences`、`Zongsoft.Intelligences.Web` | [智能化](../framework/intelligences.md) | 助手连接、模型服务及会话隔离 |
| `Zongsoft.Learning` | [机器学习](../framework/learning.md) | 当前训练管线实现限制 |
| `Zongsoft.Net` | [网络通讯](../framework/net.md) | 分包器、处理器和连接生命周期 |
| `Zongsoft.Hardwares` | [硬件信息](../framework/hardwares.md) | 平台权限与画像稳定性 |
| `Zongsoft.Reporting` | [报表](../framework/reporting.md) | 需要具体引擎、模板及数据加载 |
| `Zongsoft.Messaging.Storages.Data` | [消息存储](../framework/messaging/reliability.md) | 数据库表、映射、SQL 和稳定分区 |

## 外部扩展

| 包 | 指南 |
| --- | --- |
| `Zongsoft.Externals.Redis`、`Zongsoft.Externals.Garnet`、`Zongsoft.Externals.Etcd` | [缓存与分布式协作](../framework/externals/caching.md) |
| `Zongsoft.Externals.Lua`、`Zongsoft.Externals.Python`、`Zongsoft.Externals.Scriban` | [脚本与表达式](../framework/externals/scripting.md) |
| `Zongsoft.Externals.Hangfire`、`Zongsoft.Externals.Polly` | [任务调度与弹性执行](../framework/externals/execution.md) |
| `Zongsoft.Externals.Hangfire.Storages.Redis`、`Zongsoft.Externals.Hangfire.Web` | [Hangfire 的部署角色](../framework/externals/execution.md) |
| `Zongsoft.Externals.ClosedXml`、`Zongsoft.Externals.OpenXml` | [表格与模板](../framework/externals/documents.md) |
| `Zongsoft.Externals.Amazon`、`Zongsoft.Externals.Aliyun`、`Zongsoft.Externals.Wechat` | [云服务](../framework/externals/cloud.md) |
| `Zongsoft.Externals.Aliyun.Gateway`、`Zongsoft.Externals.Wechat.Gateway` | [回调网关](../framework/externals/cloud.md) |
| `Zongsoft.Externals.Opc` | [OPC UA 设备协议](../framework/externals/integration.md) |

## 自动升级

| 组件 | 部署位置 | 指南 |
| --- | --- | --- |
| `Zongsoft.Upgrading.Upgrader` | 待升级应用插件目录 | [升级接入](../framework/upgrading/workflow.md) |
| `Zongsoft.Upgrading.Deployer` | 应用的 `.deployer` 目录 | [进程交接](../framework/upgrading.md) |
| `Zongsoft.Upgrading.Web` | 发布管理 Web 宿主 | [发布管理](../framework/upgrading/workflow.md) |
| `Zongsoft.Tools.Upgrader` | 构建/发布工具环境 | [升级打包器](../tools/upgrader.md) |

## 如何使用索引

本表按本地源码中的项目与产物命名整理，不是所有版本均已发布的保证。安装时核对目标版本的包内容和目标框架；源码主分支的新增能力可能尚未进入你使用的包版本。

同一个包可能带多个插件变体，Web、daemon、gateway 还可能分成独立项目。依赖关系以目标版本的 `.plugin`、`.deploy` 和项目文件为准，不能仅按包名前缀推断加载顺序。
