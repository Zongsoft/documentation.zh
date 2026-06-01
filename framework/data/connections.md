---
description: 配置数据连接、驱动和读写分离。
icon: plug
---

# 连接配置

数据连接配置项名称与 `DataAccess` 名称匹配。一个 `DataAccess` 可以拥有多个数据源，用于读写分离等场景。

## 单数据源

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

## 读写分离

连接名称可以使用冒号分隔数据源标识：

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

## 注意事项

连接字符串由对应数据库驱动解释。配置时应同时确认驱动包已经部署到宿主插件目录。
