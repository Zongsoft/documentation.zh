# 文档补全与源码核对记录

本文件记录本轮大纲、交付与验证，不加入读者导航。读者入口见 [SUMMARY.md](SUMMARY.md)。

## 最终范围与基线

- 中文文档中心现有 176 个不重复的导航页面；本次新增的项目分类路线保留 29 篇页面。
- 业务案例优先取自 discussions；缺少直接用例时采用 framework 的现有项目、测试或 samples。宿主与工具操作对应 hosting、tools 的实际方案。
- 最终核对的本地提交：framework 590979a3、discussions 9a3376e、hosting 064f7cb、tools 641f216；discussions 另有本次尚未提交的修复。源码链接使用 main 分支，因此这些修复提交前应以本地工作树和摘录记录核对。
- 已阅读仓库及相关源码目录的 AGENTS.md、SKILL.md、README，并使用 GitBook skill 与官方规范。文档库只保留中文 README.md。
- framework 工作树未修改。代码修复集中在用户授权的 discussions，未执行数据库脚本、真实 HTTP 请求、云服务调用、Cake 发布或 NuGet 推送。

## 大纲与交付入口

| 顺序 | 内容 | 交付与核对重点 |
| --- | --- | --- |
| 1 | 架构与基础概念 | [架构](overview/architecture.md)、[概念](overview/concepts.md)：依赖方向、宿主、插件、模块、服务及配置职责 |
| 2 | 快速开始 | [部署 Discussions](get-started/deploy-first-plugin.md)、[业务插件](get-started/first-business-plugin.md)：真实宿主、项目和运行资源，不再保留独立假想应用 |
| 3 | 插件框架 | [插件文件](framework/plugins/plugin-file.md)、[构件与服务](framework/plugins/builtins-and-services.md)、[宿主集成](framework/plugins/hosting.md)：源码中的挂载与解析流程 |
| 4 | 数据引擎 | [首次查询](framework/data/quickstart.md)、[映射](framework/data/mapping.md)、[数据服务](framework/data/services.md)、[事务](framework/data/transactions.md)：论坛复合键、正文导航、租户及审核 |
| 5 | Web | [控制器](framework/web/controllers.md)、[数据服务接口](framework/web/data-services.md)、[协议](framework/web/protocols.md)：实际路由、请求上下文和异步服务入口 |
| 6 | 安全 | [认证](framework/security/authentication.md)、[身份与凭证](framework/core/security.md)、[权限](framework/core/security/privileges.md)：真实声明、身份转换和业务权限边界 |
| 7 | 诊断 | [诊断](framework/diagnostics.md)、[OTLP](framework/diagnostics/otlp.md)：指标、日志、链路、导出和接收服务 |
| 8 | 其他模块 | [智能化](framework/intelligences.md)、[机器学习](framework/learning.md)、[硬件](framework/hardwares.md)、[报表](framework/reporting.md)：现有调用、依赖及未完成实现 |
| 9 | 消息 | [消息队列](framework/messaging.md)、[可靠投递](framework/messaging/reliability.md)：生产、订阅、确认、存储及协议差异 |
| 10 | 自动升级 | [升级流程](framework/upgrading/workflow.md)：配置、包发现、部署、失败恢复与清理范围 |
| 11 | 外部扩展 | [按能力阅读](framework/externals.md)：缓存、锁、执行、脚本、表格、云存储与 OPC UA |
| 12 | 宿主与工具 | [宿主](hosting/hosting.md)、[部署器](tools/deployer.md)、[打包器](tools/packager.md)、[升级器](tools/upgrader.md)、[正则工具](tools/regular.md) |
| 13 | [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 与参考 | 集合、配置、IO、序列化、命令、事件、过滤、服务、通讯等真实源码范例；同步 [包索引](references/packages.md)、[选项格式](references/option-files.md)、[术语](references/glossary.md)及 FAQ |
| 14 | 校验 | 导航、相对路径、锚点、代码来源、类型链接、GitBook 区块、XML、换行、图片及代表性页面预览 |

上述内容已完成本轮编辑与核对。具有外部依赖的功能明确保留部署验收条件，不以静态校验代替实际集成结果。

## 并行阅读路线

保留原有能力分类，通过独立项目入口交叉链接，SUMMARY.md 不重复挂载同一个文件。

- [数据驱动](framework/data/drivers.md)：MySQL、SQL Server、PostgreSQL、SQLite、DuckDB、ClickHouse、TDengine、InfluxDB，共 8 项。
- [消息项目](framework/messaging/projects/README.md)：kafka、rabbit、mqtt、zero、.storages，共 5 项。
- [外部项目](framework/externals/projects/README.md)：aliyun、amazon、closedxml、etcd、garnet、hangfire、lua、opc、openxml、polly、python、redis、scriban、wechat，共 14 项。

externals/velopack 与 externals/grapecity 按维护者要求不再收录。对应项目页、导航与包索引已移除。原“设备协议与桌面更新”调整为 [OPC UA 设备协议](framework/externals/integration.md)，设置 plug 图标；表格专题保留 ClosedXml、OpenXml，Reporting 公共契约仍保留。

## 范例来源与后续维护

[discussions-examples.json](.gitbook/discussions-examples.json) 记录 121 篇页面中的 297 段摘录、源文件及行范围。C#、XML、HTTP 等摘录与本地对应源码逐段核对；安装、构建、部署命令是围绕真实项目编写的操作指引，协议示意图解释公共契约，不冒充 Discussions 的现有集成。

在相邻源码工作树均存在时，从本文档仓库执行 node .gitbook/verify-examples.mjs，可以重新核对来源记录、当前源码及正文中的代码是否一致。工具源码见 [verify-examples.mjs](.gitbook/verify-examples.mjs)。源码变化后应先理解行为，再修改正文和摘录记录；不要仅为通过检查而更新行号。

## 配图与阅读样式

- 使用 imagegen skill 和内置 image_gen 工具重新生成首页、入门、插件、数据封面，并新增消息、外部扩展配图，共 6 张 2172 × 724 横幅。
- 图片置于 .gitbook/assets，原 4 张 SVG 已替换，正文与卡片资源链接已同步。[生成记录](.gitbook/assets/image-generation.json)保留提示词和文件清单。
- 统一暖白背景、低饱和青蓝及模块化构图；不内嵌难以维护的 API 文字。精确关系继续使用表格、正文和 Mermaid。
- 以章节、概念链接、代码标题、提示区块和适量 💡 / 🚨 提高可读性；普通类型说明与实现边界分开表达。

## Discussions 修复

| 问题 | 修复后的行为 |
| --- | --- |
| 配置接口的直接依赖缺失 | 显式声明 Configuration.Abstractions，支持默认 NuGet 与本地框架引用 |
| Web 包中的 HTTP 路径错误 | 从 docs/http 打包 5 个真实请求文件；主题请求包含 ForumId 与嵌套 Post.Content |
| 头像与照片上传递归 | 控制器使用 UploadAsync 回调保存路径，并传递请求取消 |
| 调用方 SiteId 替代当前站点 | 查询条件与当前身份站点按 AND 组合，保留原条件 |
| 查询前包装结果及异步枚举丢失 | OnFiltered 包装最终结果，保留模型类型、异步读取、分页事件及提前释放 |
| 未审核正文及类型不一致 | 匿名/非作者结果脱敏；清空及读出正文都使用内嵌类型，避免空路径或重复读文件 |
| 版主详情在授权前丢失正文 | 原文关联到当前实例的内部弱引用表；详情完成版主授权后恢复，不修改审核状态 |
| 主题级联正文及直接回复漏掉审核 | 两条入口统一查询论坛规则，服务端确定 Approved；主题与正文一致，并强制纳入写入模式 |
| HTTP 异步入口绕过同步业务钩子 | 为 8 个服务补齐相关异步路径，传递取消，使用异步访问器与事务完成接口 |
| 长正文失败后遗留文件 | 主题、帖子、反馈、私信统一处理内容转换和新增文件失败补偿；短文本替换恢复内嵌标志 |
| 文件名碰撞及重复正文转换 | 消息/反馈使用随机后缀；反馈不再重复把已转成路径的内容写一次 |
| 私信主记录失败仍写接收者 | 主记录未写入时直接返回，避免继续创建接收关系 |
| 重复实现 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 的枚举能力 | 5 处查询改用 核心类库 的 FirstOrDefault；过滤适配层复用 Pageable.Filter 和 Enumerable，移除业务层迭代实现 |

补充复核：取消 7 个服务文件中的 CancellationToken 别名，统一引用 System.Threading；模型重名处明确使用 Models.Thread。保留的正文转换与失败文件补偿属于 Discussions 的业务规则，不能由数据库事务替代。新增验证覆盖分页通知订阅/退订、分页抑制状态以及异步过滤取消与释放。

Discussions 的 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 依赖已升级为 7.59.0。2026-09-06 核对 NuGet 时最新仍为 7.58.0，后者的分页过滤将错误的当前元素传给回调；本地 7.59.0 已修复。当前按本地 framework 引用验证，发布前不能把旧版包路径的验证结果沿用到最新修改。构建方式已同步至 Discussions 的中英文 README 和本库准备环境页面。

回归入口为 discussions/test/Zongsoft.Discussions.Regression.csproj，是使用 dotnet run 执行的控制台检查程序，不是 dotnet test 项目。检查覆盖隔离身份、站点条件、同步/异步、正文内嵌/外置、审核策略、失败补偿、提前取消、迭代释放及上传空请求。

数据库事务、对象存储和业务状态仍有不同的生命周期。新增文件的失败补偿不能替代进程崩溃恢复、旧文件回收或真实数据库的级联与并发验收。

## 框架源码的已知差异

这些差异已在对应页面说明，未修改 framework：

- 当前具名数据提供者注册与 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 默认访问器解析契约存在差异；Discussions 使用模块访问器。
- XSD 与加载器的部分默认值不一致；不能只看格式定义推断运行行为。
- Kafka 自动提交和自动位点记录影响手动确认保证；Redis 锁的租约与 fencing 不等同完整共识协议，演示文件计数器也不是原子业务提交。
- ZeroMQ README 与公共基类的重复订阅兼容性检查存在差异，正文以当前实现为准。
- Scriban 可选变量参数仍被直接访问 Count；使用真实的变量字典调用方式。
- Learning 的 TextFileLoader.Settings.Populate 与 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 虚方法签名不同，Pipeline.Build 还有组合缺陷，Web 入口存在骨架内容；不提供声称完整可运行的训练教程。
- Reporting 的部分定位/渲染实现尚未完成；升级清单与选项中的默认方案也须按实际文件区分。

## 最终验证

- 176 个导航页面均存在且不重复，收录范围与驱动/消息/外部项目目录一致；页面图标完整。
- 全库内部相对路径及引用锚点通过检查。718 个导航正文中的 GitHub 源码路径与相邻仓库对应；未宣称全部外部网站在线可达。
- frontmatter 的简单键值、GitBook 区块配对、代码围栏、语言与标题检查通过；正文简写的 .NET 类型补充官方文档及源码链接，已区分同名框架类型与属性名。
- 297 段登记摘录通过源文件、行范围与正文一致性检查；38 段 XML 在临时根元素中通过语法解析，不等同全部映射的数据库运行验证。
- 六张图片已检查。首页、数据入门、MySQL、Kafka、分布式锁、数据服务经过本地内容渲染检查，并检查窄屏数据入门；无图片缺失或整页横向溢出。此预览不模拟全部 GitBook 自定义渲染，未在线发布 GitBook。
- Discussions 以本地 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 7.59.0 引用通过 275 项离线回归检查；API 项目的 net8.0、net9.0、net10.0 构建均通过，零错误、零警告。核心类库 7.59.0 尚待 NuGet 发布，当前默认包还原路径未完成验证。
- 按新增 README 命令重新构建本地 [核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core) 与 Web 的 net10.0 输出后，275 项回归再次通过。核心类库 自身有 4 个既有警告（过时的 PasswordUtility 和未使用的 category 参数），Web 无警告；framework 工作树未修改。
- 本地 dotnet pack 生成 Web 包，验证 .deploy、Web 插件及 5 个 HTTP 文件，重新检查包内主题请求内容。打包提示既有包缺少 README；未推送包。
- 本次修改涉及的文本统一使用 CRLF；代码使用 Tab，并清理连续两个及以上空行，SUMMARY 保留空格层级。`.cmd` 必须使用 CRLF，`.sh` 遵循 `.gitattributes` 使用 LF。文档与 discussions 的 git diff --check 通过。

本轮没有连接真实数据库、Broker、云服务、模型服务或设备，也没有执行部署重启。外部集成的运行验收由各页给出的真实项目入口、前置条件与检查项继续指导。
