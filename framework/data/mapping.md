---
description: 以 Discussions 的论坛复合键、主题正文关系和序号配置解释映射。
icon: table
---

# 映射文件


.mapping 把领域模型映射到数据库结构。它声明表、键、字段与导航关系，可以随业务插件交付；它本身不创建数据库，也不执行迁移。Discussions 的映射放在单个 [Zongsoft.Discussions.mapping](https://github.com/Zongsoft/discussions/blob/main/src/Zongsoft.Discussions.mapping) 中，容器名是 Discussions。

## 论坛编号属于站点

下面是 Forum 实体内部的键与编号属性定义，外围 entity 声明及其他属性见源文件。

下面是 Forum 实体内部的键与编号属性定义，外围 entity 声明及其他属性见源文件。

来源：[src/Zongsoft.Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping#L197)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.mapping" %}
```xml
<key>
	<member name="SiteId" />
	<member name="ForumId" />
</key>

<property name="SiteId" type="uint" nullable="false" />
<property name="ForumId" type="ushort" nullable="false" sequence="#(SiteId)" />
```
{% endcode %}

Forum 的键由 SiteId 与 ForumId 组成。ForumId 使用按 SiteId 分域的外部序号，不能把另一个站点相同 ForumId 的论坛视为同一个对象。实体限定名是 Discussions.Forum，物理表名为 Discussions_Forum。

## 主题怎样引用论坛和正文

来源：[src/Zongsoft.Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping#L278)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.mapping" %}
```xml
<complexProperty name="Forum" port="Forum">
	<link port="SiteId" />
	<link port="ForumId" />
</complexProperty>
```
{% endcode %}

关系的 link.port 指向目标属性，anchor 指当前实体属性。上述关系位于 ForumUser 实体中，完整上下文见源文件；相同名字的 Forum 导航也存在于主题中。复合键关系应同时连接站点与论坛编号。

来源：[src/Zongsoft.Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping#L330)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.mapping" %}
```xml
<complexProperty name="Post" port="Post" multiplicity="!">
	<link port="PostId" />
</complexProperty>
```
{% endcode %}

主题的 Post 是必需的正文帖。ThreadService.OnInsert 会把 Post 导航包含进写入模式，才能将模型关系交给引擎处理；仅给模型新增一个属性不会自动产生数据库关系。

## 标量、默认值与不可变字段

来源：[src/Zongsoft.Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping#L293)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.mapping" %}
```xml
<property name="ThreadId" type="ulong" nullable="false" sequence="#" />
<property name="SiteId" type="uint" nullable="false" immutable="true" />
<property name="ForumId" type="ushort" nullable="false" />
<property name="Title" type="nvarchar" length="50" nullable="false" />
<property name="Acronym" type="varchar" length="50" nullable="true" />
<property name="Summary" type="nvarchar" length="500" nullable="true" />
<property name="Tags" type="nvarchar" length="100" nullable="true" />
<property name="PostId" type="ulong" nullable="false" />
```
{% endcode %}

字符串长度、可空性和数据库类型要同时与模型、SQL 核对。immutable 用来约束写入阶段，不能代替用户授权。序号标记 # 需要外部序号服务；按站点分域的序号还依赖 SiteId 先被正确赋值，见[序号器](../core/common/sequence.md)。

## 四种 SQL 脚本不是自动兼容承诺

Discussions 的 database 目录包含 MySQL、SQL Server、PostgreSQL、ClickHouse 脚本。当前映射中的 Message 还显式指定 ClickHouse 驱动，因此选择其他数据库时必须同时核对实体驱动标记、数据源选择和 SQL 结构。不能仅换连接字符串就宣布切换完成。

## 扩展与校验

复杂属性的 multiplicity 区分可选单值、必需单值和集合。需要级联写入时应明确审核 immutable 与 behaviors；默认值必须以[映射加载器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Metadata/Profiles/MetadataFileResolver.cs)为准。XSD 验证检查格式，实际驱动验证检查数据库语义，两者不能互相替代。

Discussions 当前没有命名 SQL 命令。该能力可继续查阅框架 [MetadataCommandScriptorTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/test/MetadataCommandScriptorTest.cs)，不要为论坛另造 Answer 或订单统计命令。

继续阅读：[数据模式](schema.md)、[连接配置](connections.md)、[写入](writing.md)。
