---
description: 从可核对的仓库示例理解 Zongsoft 的组合方式，并按场景迁移到自己的应用。
icon: seedling
---

# 用户案例

本页整理可在源码和本文档中核对的实践路径，帮助理解组件如何组合。它们是技术示例与应用模式，不代表已核实的客户部署、性能指标或商业背书。

## 业务规则插件

[首个业务插件](get-started/first-business-plugin.md)将命令、配置和表达式求值器组合起来：业务模块依赖 Core 契约，宿主部署 Scriban。这个小例子适合学习扩展点与运行配置，也可以作为更复杂规则服务的起点。

迁移到真实业务时，应增加规则版本、输入校验、返回值验证和运行时边界；不要把演示的任意脚本输入直接暴露为高权限接口。

## 后台消息处理

[MQTT 样例](https://github.com/Zongsoft/framework/tree/main/messaging/mqtt/samples)提供独立 Broker 与交互客户端；[ZeroMQ 样例](https://github.com/Zongsoft/framework/tree/main/messaging/zero/samples)展示服务器与客户端分离。这些项目适合观察订阅、发布、连接及关闭。

业务系统可把处理器放进 daemon 工作器，再增加幂等与持久化。协议返回值、ACK 和业务完成需分别记录，参见[可靠投递](framework/messaging/reliability.md)。样例的单机结果不能直接用于容量或高可用承诺。

## 数据服务与 HTTP 边界

[首次数据查询](framework/data/quickstart.md)从 SQLite 标量查询建立配置和映射闭环，[数据服务](framework/data/services.md)再组织业务规则，[控制器](framework/web/data-services.md)提供 HTTP 适配。

这种分层适合让终端维护命令、后台任务和 Web 接口复用同一业务服务。权限应在业务层保持一致，不能因为调用来自后台就默认绕过数据范围。

## 人工表格交换

[ClosedXml 源码与测试](https://github.com/Zongsoft/framework/tree/main/externals/closedxml)展示模型归档与工作簿约定。常见工作流是导出模板、人工填写、提取并校验记录，再通过数据服务写入。

文件提取与业务提交应分阶段，先给使用者清楚的行列错误，再决定整批或部分提交。表格内录入验证不能代替服务器校验，详见[表格与报表](framework/externals/documents.md)。

## 多宿主交付

[hosting 仓库](https://github.com/Zongsoft/hosting)提供 terminal、daemon 和 default Web 入口，通过部署方案组合插件。它适合观察同一套框架能力如何适配交互调试、后台运行和 HTTP 接口。

正式采用时，需要自己的版本锁定、环境配置、数据目录、安装与恢复策略。按[部署模型](overview/deployment.md)先生成可运行目录，再选择安装包或升级包；不要省略目标系统上的安装与升级验收。
