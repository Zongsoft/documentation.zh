---
description: 查找框架、数据、消息、模型与交付术语，并跳转到解释和使用场景。
icon: book
---

# 术语表

本页给出阅读入口；详细背景、示例和边界在对应专题中展开。

## 应用与插件

| 术语 | 含义 | 深入阅读 |
| --- | --- | --- |
| 宿主 | 建立运行环境并承载插件的进程入口 | [宿主概览](../hosting/hosting.md) |
| 内容根 | 应用解析配置及资源的基准之一，与工作目录需区分 | [基础概念](../overview/concepts.md#host) |
| 插件 | 清单与运行产物组成的扩展单元，不是单个 DLL 的别名 | [插件化](../overview/pluginization.md) |
| 插件树 | 用路径组织构件与扩展点的运行结构 | [插件概念](../overview/concepts.md#plugin-tree) |
| 构件 | 由插件元数据创建、暴露或引用的对象 | [构件与服务](../framework/plugins/builtins-and-services.md) |
| 模块 | 组织业务服务及上下文的逻辑边界 | [模块与提供者](../overview/concepts.md#module-service-provider) |
| 服务提供者 | 根据契约和名称供应服务实例的对象 | [服务定位](../framework/core/services/locating.md) |
| 站点 | 部署方案中的场景划分，常用于 Web 组合 | [Web 宿主](../hosting/web.md) |

## 数据

| 术语 | 含义 | 深入阅读 |
| --- | --- | --- |
| 实体映射 | 描述业务实体与数据库表、字段、关系的元数据 | [映射文件](../framework/data/mapping.md) |
| 数据模式 Schema | 选择读取或写入的成员及导航形状 | [数据模式](../framework/data/schema.md) |
| 导航属性 | 表达关联对象或集合的成员 | [数据概念](../framework/data/concepts.md) |
| 条件 | 选择哪些记录的谓词结构 | [条件与操作元](../framework/data/conditions-and-operands.md) |
| 数据访问器 | 通过名称与映射执行数据操作 | [数据访问](../framework/data/data-access.md) |
| 数据服务 | 在数据操作外组织授权、业务规则和扩展 | [数据服务](../framework/data/services.md) |
| 环境事务 | 随当前执行上下文传播的事务作用域 | [事务与一致性](../framework/data/transactions.md) |
| 归档格式 | 模型数据的导入导出文件约定 | [表格与报表](../framework/externals/documents.md) |

## 消息与分布式协作

| 术语 | 含义 | 深入阅读 |
| --- | --- | --- |
| Broker | 接受、路由或保存消息的中间服务 | [消息队列](../framework/messaging.md) |
| 确认 ACK | 消费者报告消息达到约定处理阶段 | [投递概念](../framework/messaging/concepts.md) |
| 幂等 | 重复执行同一业务操作不增加额外副作用 | [可靠投递](../framework/messaging/reliability.md) |
| 背压 | 下游处理不足时限制继续进入的工作量 | [投递概念](../framework/messaging/concepts.md) |
| Pending | Broker 已接纳但尚未完成确认的消息状态 | [消息存储](../framework/messaging/reliability.md) |
| 租约 | 有效期内维持资源或锁状态的机制 | [缓存与协作](../framework/externals/caching.md) |
| 栅栏令牌 | 让资源端识别并拒绝过期锁持有者的单调令牌 | [分布式锁](../framework/core/services/distributed-lock.md) |

## 智能化、诊断与交付

| 术语 | 含义 | 深入阅读 |
| --- | --- | --- |
| 助手 | 一组模型连接和服务能力的命名入口 | [智能化](../framework/intelligences.md) |
| 会话 | 多轮聊天状态与历史的管理对象 | [会话与流式响应](../framework/intelligences/sessions.md) |
| 流式响应 | 在完整结果形成前逐步交付增量内容 | [会话与流式响应](../framework/intelligences/sessions.md) |
| 遥测 | 日志、指标和链路等运行观测数据 | [诊断](../framework/diagnostics.md) |
| OTLP | OpenTelemetry 遥测数据传输协议 | [协议接入](../framework/diagnostics/otlp.md) |
| 部署清单 | 描述文件如何组装进运行目录 | [部署格式](deploy-files.md) |
| 发布 manifest | 描述升级包身份、大小、校验和与执行器 | [自动升级](../framework/upgrading.md) |
| 全量/增量发布 | 清理后完整复制 / 在旧目录覆盖文件的升级方式 | [升级类型](../framework/upgrading.md) |
| `.deployment` | 应用内升级器向进程外部署器交接的描述文件 | [升级接入](../framework/upgrading/workflow.md) |
