---
description: 沿 Discussions 论坛查询核对映射、身份、连接和结果。
icon: play
---

# 完成首次数据查询

第一次查询使用 Discussions 已有论坛接口。前提是[业务插件已部署](../../get-started/deploy-first-plugin.md)，宿主连接的是自己的隔离环境。

## 1. 核对真实数据契约

同时阅读 Discussions 的 Models/Forum.cs、Zongsoft.Discussions.mapping 和 database 下所选数据库脚本。Forum 使用 SiteId 与 ForumId 复合键；外部序号需要相应服务；Message 还有 ClickHouse 驱动标记。这些约束不能靠只修改数据库连接字符串解决。

数据库脚本可能重建对象，应先审阅并只在临时数据库执行。映射文件不会自动创建这些表。

## 2. 核对访问器、连接与身份

来源：[src/Module.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Module.cs#L52)（节选；上下文见源文件）。

{% code title="Module.cs" %}
```csharp
public IDataAccess Accessor => _accessor ??= this.Services.ResolveRequired<IDataAccessProvider>().GetAccessor(this.Name);
```
{% endcode %}

访问器名是 Discussions。连接配置与驱动必须允许该访问器选到正确数据源；身份需要包含 Discussions 方案及 SiteId，参见[连接配置](connections.md)和[认证](../security/authentication.md)。

## 3. 使用仓库中的论坛请求

以下仅摘录请求行，省略 Host 和 Authorization；page 是原请求中的环境变量，由你的请求工具提供：

来源：[docs/http/forum.http](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/docs/http/forum.http#L2)（节选；上下文见源文件）。

{% code title="forum.http" %}
```http
GET /Discussions/Forums?page={{page}} HTTP/1.1
```
{% endcode %}

这条请求读取论坛集合。可见性规则由 ForumService 处理，站点条件由数据验证器补充；空集合可能表示当前范围没有数据，不一定是查询失败。

## 4. 顺着服务检查结果

来源：[src/Services/ForumService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ForumService.cs#L83)（节选；上下文见源文件）。

{% code title="ForumService.cs" %}
```csharp
public IEnumerable<Models.Thread> GetPinnedThreads(ushort forumId, string schema, Paging paging = null)
{
	return this.DataAccess.Select<Models.Thread>(
		Condition.Equal(nameof(Models.Thread.ForumId), forumId) &
		Condition.Equal(nameof(Models.Thread.IsPinned), true) &
		Condition.Equal(nameof(Models.Thread.Visible), true),
		schema, paging, Sorting.Descending(nameof(Models.Thread.ThreadId)));
}
```
{% endcode %}

这是同一模块里读取置顶主题的真实调用：条件、数据模式、分页和排序都有明确来源。理解接口集合查询后，可以在这个方法及数据过滤器设置断点，观察访问器如何工作。

## 成功标准与排障

确认请求进入正确控制器、访问器选中预期连接、数据只属于当前站点、字段形状符合 schema、未审核正文没有暴露。进一步的写入和事务验证使用独立测试数据；不要把一次 SELECT 成功当作整个论坛业务已经验收。

找不到实体时检查映射部署；找不到驱动时检查插件；无法连接时检查数据源；缺少序号服务时检查依赖装配。更多阅读：[映射](mapping.md)、[查询](querying.md)、[服务](services.md)。
