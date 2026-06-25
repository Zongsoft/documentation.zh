---
description: 配置数据连接、驱动和读写分离。
icon: plug
---

# 连接配置

数据连接配置项名称与 `DataAccess` 名称匹配。一个 `DataAccess` 可以拥有多个数据源，用于读写分离等场景。

## 配置位置

连接配置位于 `/Data/ConnectionSettings` 选项路径下。`DataAccessProvider` 获取访问器时会从当前应用配置读取该集合：

```text
/Data/ConnectionSettings
```

如果调用 `GetAccessor()` 时没有指定名称，会使用默认连接；如果指定名称不存在，也会回退到默认连接。没有默认连接且指定名称不存在时会抛出数据配置异常。

<details>

<summary>访问器名称如何匹配连接配置？</summary>

`IDataAccessProvider.GetAccessor("Security")` 会优先查找名为 `Security` 的连接配置。如果没有传入名称，则使用 `connectionSettings` 的默认项。读写分离时，`Security:master`、`Security:slave` 仍属于同一个 `Security` 数据访问名称下的不同数据源。

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

连接名称可以使用冒号分隔数据源标识：

{% code title="ReadWrite.option" %}
```xml
<configuration>
	<option path="/Data">
		<connectionSettings>
			<connectionSetting connectionSetting.name="Default:master"
			                   driver="MySql"
			                   mode="WriteOnly"
			                   value="server=192.168.0.10;database=zongsoft" />
			<connectionSetting connectionSetting.name="Default:slave"
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
