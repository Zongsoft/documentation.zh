---
description: 以 Discussions 社区论坛的真实源码串联插件、数据、权限、文件和归档。
icon: seedling
---

# 用户案例


本文档统一以 [Discussions](https://github.com/Zongsoft/Zongsoft.Discussions) 社区论坛模块为业务案例。本地源码位于同级 discussions 仓库。页面中的业务代码直接节选自该仓库，省略外围代码时会注明文件与方法；部署命令则围绕这个真实项目编写，不另建演示应用。

## 从业务认识框架

Discussions 将站点、论坛、主题、帖子、私信、用户资料和附件组织为模型。模型描述数据，服务实现业务动作，Web 控制器适配请求，插件清单把这些对象接入宿主。它是业务类库和 Web 插件，并不自带生产宿主、数据库连接或完整运维方案。

| 阅读任务 | 真实入口 | 对应指南 |
| --- | --- | --- |
| 理解业务模块怎样装配 | Module.cs、[Zongsoft.Discussions.plugin](https://github.com/Zongsoft/discussions/blob/main/src/Zongsoft.Discussions.plugin) | [业务插件](get-started/first-business-plugin.md) |
| 查询论坛主题并分页 | ForumService.GetPinnedThreads | [查询与导航](framework/data/querying.md) |
| 创建主题并维护统计 | ThreadService.OnInsert | [事务与一致性](framework/data/transactions.md) |
| 投票并重新统计票数 | PostService.Upvote、SetPostVotes | [写入操作](framework/data/writing.md) |
| 约束站点和审核可见性 | DataValidator、ThreadFilter、PostFilter | [数据服务](framework/data/services.md) |
| 转换认证身份 | UserChallenger、UserIdentity | [认证与授权](framework/security/authentication.md) |
| 保存长正文与附件 | Utility、FileController | [文件系统](framework/core/io.md) |
| 导出用户及站点信息 | UserDataTemplateModelProvider、user-list.xlsx | [表格与模板](framework/externals/documents.md) |

## 业务关系

站点是业务隔离范围；论坛编号在站点内分配，因此论坛关系不能只使用 ForumId。主题通过 PostId 指向正文帖，回复和评论也由 Post 模型承载。私信正文由 Message 保存，收件人及已读状态由 UserMessage 保存；这里的“消息”是站内业务数据，不能据此认定项目使用了消息队列。

阅读字段时同时核对 [模型](https://github.com/Zongsoft/Zongsoft.Discussions/tree/main/src/Models)、[映射](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping) 和 [数据库脚本](https://github.com/Zongsoft/Zongsoft.Discussions/tree/main/database)。四种 SQL 脚本的存在不等于每种数据库组合都已通过运行验收。

## 范例的边界

代码中的 this、data、schema、options 和 cancellation 属于原方法上下文，不能直接粘贴到空白 Program.cs。先理解其宿主、身份、映射、配置和服务依赖，再运行对应业务路径。源码链接使用 main 分支；本次修复尚未提交时，以本地 discussions 工作树为准。

{% hint style="info" %}
💡 当前项目没有覆盖框架的全部能力。没有直接用例时，采用同级 framework 仓库中的现有项目、测试或 samples，并明确标注来源；不把框架示例中的缓存、队列、调度或 AI 功能描述为论坛现有实现。
{% endhint %}

## 本地核对顺序

先[构建业务库](get-started/first-business-plugin.md)，再[部署到真实宿主](get-started/deploy-first-plugin.md)，随后检查数据库映射、身份和文件目录，最后使用仓库 docs/http 中的请求验证自己的隔离环境。不要直接执行其中保存的远端地址或认证信息。

归档模板、SQL 和 HTTP 请求都能提供真实业务背景，但不应原样带入生产环境。尤其是数据库脚本可能重建对象，执行前应审阅并使用临时数据库。
