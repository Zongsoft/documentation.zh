---
description: 按可观察现象定位插件、配置、数据、消息和交付中的常见问题。
icon: circle-question
---

# 常见问题

## 包已安装，为什么插件没有出现？

包引用用于编译，运行时还需清单和相关产物进入扫描目录。先检查实际进程路径，再查看 `.plugin`、依赖声明和 DLL。完整步骤见[最小部署](get-started/deploy-first-plugin.md)。

## 插件出现了，为什么第一次调用仍失败？

服务可能延迟建立连接，第三方依赖也可能在部署时被其他包覆盖。检查[服务定位](framework/core/services/locating.md)、选定连接和最终 DLL 版本；插件列表只能证明加载阶段的一部分。

## 修改 `.option` 后为什么没有变化？

核对文件是否匹配应用名或插件清单基名、环境与 host/site；再检查后续配置源是否覆盖该键。不要默认所有组件都支持运行中热更新。详见[选项配置](references/option-files.md)。

## 宿主入口可以直接写业务吗？

应用组合和启动配置属于宿主职责，业务规则建议放入插件服务，再由命令、[工作器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Components/IWorker.cs)或控制器调用。这样更容易在[终端与 Web](hosting/hosting.md)之间复用和验证。

## `Resolve`、`Find`、`Locate` 为什么结果不同？

它们分别偏向容器注册解析、服务匹配、名称与提供者定位。“连接名@Redis”中的 Redis 是提供者别名；其他提供者也未必有对应别名。见[完整规则](framework/core/services/locating.md)。

## 查询为什么缺少导航字段？

检查映射关系和 Schema。`*` 不意味着任意层级全量展开；导航需要相应声明，导航中的 `:20` 是限制数量，不是顶层页号。参见[数据模式](framework/data/schema.md)和[查询](framework/data/querying.md)。

## 异步查询为什么在循环中才报错？

取得异步序列不代表已经完成查询，执行和读取可能在枚举时发生。错误处理、取消及资源生命周期应覆盖枚举范围。见[数据访问接口](framework/data/data-access.md)。

## 消息发布返回成功，为什么业务没完成？

返回值可能表示本地发送、协议发布结果或 Broker 持久接纳。它不是通用业务确认。ZeroMQ 无在线匹配订阅时还可能返回 `null`；Kafka 显式确认又需考虑后台自动提交。见[可靠投递](framework/messaging/reliability.md)。

## 为什么异步消息处理器没有被等待？

当前同步委托订阅重载接收 `System.Action<Message>`。把异步 lambda 传进去会形成 `async void`，应改为实现 `IHandler<Message>` 或继承异步处理器基类，参考[消息示例](framework/messaging.md)。

## Excel 工作表存在，为什么导入找不到表？

ClosedXml 提取器按真正的 Excel Table 及模型限定名查找，例如 `__Sales.User__`。工作表名或普通区域不能替代 Table。见[表格扩展](framework/externals/documents.md)。

## 安装或升级后为什么入口不正确？

区分展示名、服务名、程序集名和运行应用名。打包工具使用名称推断入口，升级器使用实际应用身份匹配发布；Web 类库 `Zongsoft.Web.dll` 不是宿主入口。见[打包](tools/packager.md)与[升级恢复](framework/upgrading/workflow.md)。

## `.deployment` 存在就代表升级成功吗？

它表示已经有待部署交接。还需确认旧进程退出、文件替换、新进程启动及业务健康。全量部署可能清理应用目录中的数据和日志，部署前必须安排数据保存与恢复。见[自动升级](framework/upgrading.md)。

## 应该先读哪条路径？

第一次接触从[架构](overview/architecture.md)和[基础概念](overview/concepts.md)开始，再完成[业务插件](get-started/first-business-plugin.md)。已有业务需求则从首页的[阅读导航](README.md)进入对应数据、消息、Web 或外部扩展专题。
