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

## 注意事项

连接字符串由对应数据库驱动解释。配置时应同时确认驱动包已经部署到宿主插件目录。

生产环境中建议把敏感信息交给环境配置、密钥系统或部署平台注入，避免把账号密码提交到源码仓库。
