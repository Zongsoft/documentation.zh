---
description: 配置数据连接、驱动和读写分离。
icon: plug
---

# 连接配置

数据连接配置项名称与访问器名称匹配（取得方式见[数据访问接口](data-access.md)）。一个 `DataAccess` 可以拥有多个数据源，用于读写分离等场景。

## 配置位置

连接配置位于 `/Data/ConnectionSettings` 选项路径下。`DataAccessProvider` 获取访问器时会从当前应用配置读取该集合：

```text
/Data/ConnectionSettings
```

如果调用 `GetService(null)` 时没有指定名称，会使用默认连接；如果指定名称不存在，也会回退到默认连接。没有默认连接且指定名称不存在时会抛出数据配置异常。

<details>

<summary>访问器名称如何匹配连接配置？</summary>

通过具名提供者调用 `GetService("Security")` 会优先查找名为 `Security` 的连接配置。如果没有传入名称，则使用 `connectionSettings` 的默认项。读写分离时，`Security`、`Security#slave` 仍属于同一个 `Security` 数据访问名称下的不同数据源。

</details>

## 单数据源

{% code title="Default.option" %}
```xml
<configuration>
	<option path="/Data">
		<connectionSettings default="Default">
			<connectionSetting connectionSetting.name="Default"
			                   driver="MySql"
			                   value="server=127.0.0.1;user=root;password=secret;database=zongsoft;charset=utf8mb4" />
		</connectionSettings>
	</option>
</configuration>
```
{% endcode %}

`connectionSetting.name` 应与数据访问名称一致。业务模块通常用模块名作为数据访问名称，例如 `Security`、`Administratives` 或 `Discussions`。

## 连接字符串属性

`value` 是传给对应驱动的连接字符串，通常由分号分隔的键值项组成。连接设置对象会把这些键值项映射到驱动定义的属性，并按属性类型转换，例如端口、布尔值、时间间隔、网络端点或集合。

{% code title="ConnectionValue.option" %}
```xml
<connectionSetting connectionSetting.name="Default"
                   driver="MyDriver"
                   value="server=192.168.0.1:8080,localhost:8088;timeout=1m;mapping=s1:t1,s2=t2,same" />
```
{% endcode %}

集合属性可以写成一个文本值，放在连接字符串 `value` 内时通常使用逗号或竖线分隔元素，因为分号已经被外层连接项用作分隔符；具体元素如何转换由属性类型或属性上声明的转换器决定。驱动如果为某个集合属性声明了元素转换器，就可以把 `mapping=s1:t1,s2=t2,same` 这类短格式解析成结构化条目。

驱动设置对象还可以把多个扁平键组装成一个复合属性。下面的写法不会要求连接字符串里出现完整的 `cluster` 值，而是用 `cluster.` 前缀为 `Cluster` 属性填充子成员：

{% code title="CompositeConnectionValue.option" %}
```xml
<connectionSetting connectionSetting.name="Default"
                   driver="MyDriver"
                   value="cluster.address=192.168.0.100;cluster.heartbeat=30s" />
```
{% endcode %}

这类写法适合描述集群、证书、代理、重试策略等结构化设置。能否使用取决于驱动的连接设置类是否定义了对应属性，以及该属性类型是否可以被自动创建并写入公共成员。

## 读写分离

连接名称使用 `#` 追加数据源标识。应保留与访问器同名的基础连接，因为默认访问器工厂先检查精确连接名；仅配置后缀项可能在取得访问器时回退或失败：

{% code title="ReadWrite.option" %}
```xml
<configuration>
	<option path="/Data">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Default"
			                   driver="MySql"
			                   mode="WriteOnly"
			                   value="server=192.168.0.10;database=zongsoft" />
			<connectionSetting connectionSetting.name="Default#slave"
			                   driver="MySql"
			                   mode="ReadOnly"
			                   value="server=192.168.0.11;database=zongsoft" />
		</connectionSettings>
	</option>
</configuration>
```
{% endcode %}

`mode="WriteOnly"` 的数据源用于写入，`mode="ReadOnly"` 的数据源用于读取。驱动和数据源提供器会根据操作类型选择合适的数据源。

## 驱动名称

`driver` 属性必须匹配已部署驱动注册的名称。例如 MySQL 驱动插件会注册：

- `/Workbench/Configuration/ConnectionSettings/Drivers/MySql`
- `/Workbench/Data/Drivers/MySql`

如果插件目录中没有部署对应驱动，连接字符串即使正确也无法被解析和执行。

{% content-ref url="drivers.md" %}
[drivers.md](drivers.md)
{% endcontent-ref %}

## 注意事项

连接字符串由对应数据库驱动解释。配置时应同时确认驱动包已经部署到宿主插件目录。

生产环境中建议把敏感信息交给环境配置、密钥系统或部署平台注入，避免把账号密码提交到源码仓库。

<details>

<summary>配置文件里可以放真实连接串吗？</summary>

开发环境可以使用本地测试连接串，但生产环境不建议把账号、密码、访问密钥写入仓库。更稳妥的做法是由部署平台、环境变量、密钥管理服务或站点级配置注入敏感值。

</details>

## 路由与一致性

数据源提供器选择精确名称及 `名称#后缀` 项，再按操作从可读或可写集合选择数据源。查询、存在判断和聚合走可读源；命名命令根据映射中的 mutability 路由。只读命令应明确写 `mutability="none"`，详见[映射文件](mapping.md)。

读写分离依赖数据库自身的复制与一致性策略。刚写完立即读取可能受到复制延迟影响；需要读到本次写入时，应根据业务的事务和数据源方案处理，不能认为配置多个连接就自动保证强一致。

## 连接故障保护

当前引擎通过 DataConnector 管理物理连接建立。同一数据源的连接建立受串行保护，失败后的一段时间内可快速拒绝后续连接，避免大量请求同时冲击不可用数据库。

首次物理连接失败通常保留数据库提供程序的原始异常；熔断期间快速拒绝使用 DataConnectionException，可读取 RetryAt、RetryAfter 等信息。恢复数据库后仍应考虑重试等待时间，不要把每次快速拒绝都当成新的网络故障。

实现定位：[连接名筛选](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Common/DataSourceProvider.cs)、[分隔符和访问模式](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Common/DataSource.cs)、[访问器名称](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/DataAccessProviderBase.cs)、[连接保护](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Common/DataConnector.cs)。
