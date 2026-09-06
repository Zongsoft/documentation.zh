---
description: 按 externals 源码项目查找扩展包、配置入口与相关主题文档。
icon: folders
---

# 按项目阅读

已知道项目名或准备部署某个包时，可以直接进入项目页。现有[扩展插件](../../externals.md)继续按需求组织：缓存、脚本、调度、表格、云服务和设备集成。项目页把某个实现的部署与限制集中在一起，并链接到完整主题用法。

## 项目索引

以下收录 14 个外部扩展项目；同目录下的 Web、Gateway 和可选存储产物归在相应项目中。

| 项目 | 主要能力 | 对应主题 |
| --- | --- | --- |
| [Aliyun (aliyun)](aliyun.md) | 接入阿里云 OSS、消息、短信与语音、移动推送等能力 | [云服务与回调](../cloud.md) |
| [Amazon (amazon)](amazon.md) | 通过框架文件系统接入 Amazon S3 及兼容对象存储 | [云服务与回调](../cloud.md) |
| [ClosedXml (closedxml)](closedxml.md) | 把业务模型接入 Excel 数据归档、提取与模板服务，适合导出业务记录、人工填写后再导入等流程 | [表格与模板扩展](../documents.md) |
| [Etcd (etcd)](etcd.md) | 提供基础键值操作、序号和租约锁，适合需要原子序号分配或协调共享资源访问的场景 | [缓存与分布式协作](../caching.md) |
| [Garnet (garnet)](garnet.md) | 通过宿主[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)运行支持 Redis 协议的 Garnet 服务器 | [缓存与分布式协作](../caching.md) |
| [Hangfire (hangfire)](hangfire.md) | 将持久后台作业与框架调度契约连接起来，适合延迟执行和周期任务 | [任务调度与弹性执行](../execution.md) |
| [Lua (lua)](lua.md) | 通过 NLua 与 KeraLua 提供 Lua 表达式求值 | [脚本与表达式](../scripting.md) |
| [Opc (opc)](opc.md) | 提供 OPC UA 客户端、服务端及读写订阅适配，用于连接工业数据服务 | [OPC UA 设备协议](../integration.md) |
| [OpenXml (openxml)](openxml.md) | 提供显式工作簿和单元格操作，适合需要直接控制表格结构的程序 | [表格与模板扩展](../documents.md) |
| [Polly (polly)](polly.md) | 把重试、超时、熔断、限流和回退接入 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 执行管线，用于处理一次操作遇到的暂时故障 | [任务调度与弹性执行](../execution.md) |
| [Python (python)](python.md) | 通过 IronPython 提供 Python 求值能力，适合在受控规则中使用与该运行时兼容的语言及库 | [脚本与表达式](../scripting.md) |
| [Redis (redis)](redis.md) | 把 Redis 接入缓存、序号、分布式锁、消息流、配置和可靠消息存储 | [缓存与分布式协作](../caching.md) |
| [Scriban (scriban)](scriban.md) | 提供 Scriban 纯脚本表达式求值，适合把小范围规则按名称和配置接入业务插件 | [脚本与表达式](../scripting.md) |
| [Wechat (wechat)](wechat.md) | 提供微信账户、公众平台、第三方平台和支付适配 | [云服务与回调](../cloud.md) |

## 如何配合两种目录阅读

如果任务是“导出业务记录”，先从表格主题比较 ClosedXml 与 OpenXml；如果已经选择 ClosedXml，就从项目页检查包、服务匹配和表格命名，再跳转到导出/导入示例。

{% hint style="info" %}
💡 源码目录、NuGet 主包与运行能力不是一一对应的文件。一个项目可能还有独立 Web/Gateway 包，也可能依赖原生库或外部服务；按项目页列出的实际角色选择部署产物。
{% endhint %}
