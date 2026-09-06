---
description: 从实体、主键和属性开始编写 .mapping，建立导航关系及命名 SQL 命令。
icon: table
---

# 映射文件

`.mapping` 是描述实体与数据库结构关系的 XML 文件。它把业务模型从数据库注解中解耦，同时让表、列、关系和命令可以随业务插件交付。概念背景见[对象关系映射](concepts.md)。

## 完整的实体关系示例

下面声明客户与订单。假定数据库已经存在对应的表及字段；映射本身不会执行建表或迁移。

{% code title="Orders.mapping" %}
```xml
<schema xmlns="http://schemas.zongsoft.com/data">
	<container name="Orders">
		<entity name="Customer" table="Sales_Customer">
			<key>
				<member name="CustomerId" />
			</key>
			<property name="CustomerId" type="int" nullable="false" />
			<property name="Name" type="string" length="100" nullable="false" />
		</entity>
		<entity name="Order" table="Sales_Order">
			<key>
				<member name="OrderId" />
			</key>
			<property name="OrderId" type="int" nullable="false" />
			<property name="CustomerId" type="int" nullable="false" />
			<property name="Amount" type="decimal" precision="18" scale="2" nullable="false" />
			<complexProperty name="Customer" port="Customer" multiplicity="?" immutable="true">
				<link port="CustomerId" anchor="CustomerId" />
			</complexProperty>
		</entity>
	</container>
</schema>
```
{% endcode %}

容器限定实体名为 `Orders.Customer` 与 `Orders.Order`，`table` 指向物理表。属性名对应模型成员，列名不同时可用 `field`。主键成员必须在标量属性中存在。本例由业务提供 ID，不隐式引入外部序号服务。

## 标量属性的边界

字符串应声明长度，小数应声明精度与小数位；同时核对数据库实际列类型和可空性。`immutable="true"` 的字段用于只能在新增时设置的值，例如创建时间或所有者；它不是用户权限声明。

序号选择影响生成责任：`sequence="*"` 使用数据库内置序号，`sequence="#"` 使用外部序号器，`sequence="#(TenantId)"` 表达按属性分域的序号。只有部署了相应服务并确认生成策略时才启用外部序号；详见[序号器](../core/common/sequence.md)。

## 导航如何连接

`complexProperty.port` 指向目标实体，`link.port` 指目标属性，`link.anchor` 指当前实体属性；同名时可省略 anchor。复合键使用多个 link。`multiplicity` 的 `?`、`!`、`*` 分别表示可选单值、必需单值和集合。

通过中间实体导航时，可以使用 `port="中间实体:目标导航"`，再由 link 连接当前实体到中间实体。关系约束通过 `constraints` 声明；应核对约束作用于主控端还是目标端，避免关联到其它租户或类型的数据。

{% hint style="warning" %}
🚨 当前 XSD 与加载器对复合属性 `immutable` 的缺省值不同：XSD 为 `true`，加载器按 `false` 处理。因此示例显式声明它。需要级联写入的关系应写 `immutable="false"`，并审核写入和删除范围。
{% endhint %}

## 命名 SQL 与存储过程

普通实体操作无法表达的数据库专属逻辑，可以放入命名命令。下面是无需业务表的 SQLite 示例：

{% code title="Docs.mapping" %}
```xml
<schema xmlns="http://schemas.zongsoft.com/data">
	<container name="Docs">
		<command name="Answer" type="text" mutability="none">
			<script driver="SQLite"><![CDATA[SELECT 42]]></script>
		</command>
	</container>
</schema>
```
{% endcode %}

调用名称为 `Docs.Answer`。每个 script 指定数据库驱动，SQL 由目标数据库解释；也可以把脚本放在映射所在目录或子目录，按 `{命令限定名}-{驱动名}.sql` 命名，例如 `Docs.Answer-SQLite.sql`。加载器兼容旧的未限定命令名，但限定名脚本优先；新文件建议使用限定名，避免不同模块同名命令互相覆盖。参数用 parameter 声明名称、类型和方向，再由调用方传值；不要把输入拼进 SQL。

`type` 使用 `text` 或 `procedure`，参数 direction 使用 XSD 支持的 `input`、`output`、`both`、`return`。命令的 `mutability` 决定读写数据源选择，引擎不会分析 SQL 推断是否写入。

{% hint style="warning" %}
🚨 命令 mutability 的缺省值也存在 XSD/加载器差异：XSD 为 `none`，加载器按可写处理。只读命令务必显式写 `mutability="none"`，写命令则声明实际写入类型。
{% endhint %}

## 部署与维护

默认映射加载器递归搜索应用目录中的 `.mapping`。建议按模块拆文件，保持实体限定名唯一，将相关外部 SQL 一同部署。配置清单同主名规则适用于 `.option`，不要将它误套给映射加载器。

修改映射应同时审核数据库结构、模型、模式文本和所有级联调用。先用 [Zongsoft.Data.xsd](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/Zongsoft.Data.xsd) 检查结构，再通过目标驱动的实际操作检查语义；XSD 合法不证明表存在，也不证明关系正确。

实现依据：[映射解析器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Metadata/Profiles/MetadataFileResolver.cs)。后续阅读：[数据模式](schema.md)、[写入操作](writing.md)、[连接配置](connections.md)。
