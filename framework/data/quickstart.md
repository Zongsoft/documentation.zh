---
description: 在插件宿主中部署数据引擎和 SQLite，通过公共契约完成无表的首次查询。
icon: bolt
---

# 完成首次数据查询

本教程接着[业务命令示例](../../get-started/first-business-plugin.md)，用 SQLite 内存连接执行 `SELECT 42`。目标是验证提供者、连接设置、驱动、映射和调用的完整链路，不涉及业务表或数据库初始化。

## 部署引擎与驱动

在 PluginDemo 的部署清单中追加：

{% code title="PluginDemo/.deploy（追加内容）" %}
```ini
[plugins zongsoft data]
nuget:Zongsoft.Data

[plugins zongsoft data sqlite]
nuget:Zongsoft.Data.SQLite
```
{% endcode %}

业务仍只引用 Core。为业务清单 `Acme.Rules.plugin` 增加 `Zongsoft.Data` 依赖，并将后面的映射文件一同复制到业务插件目录。

## 配置连接和命名命令

在 `Acme.Rules.option` 根节点中追加：

{% code title="Acme.Rules.option（追加片段）" %}
```xml
<option path="/Data">
	<connectionSettings>
		<connectionSetting connectionSetting.name="Docs" driver="SQLite"
			value="Database=:memory:;Mode=Memory" />
	</connectionSettings>
</option>
```
{% endcode %}

创建映射：

{% code title="Docs.mapping" %}
```xml
<schema xmlns="http://schemas.zongsoft.com/data">
	<container name="Docs">
		<command name="Answer" type="text" mutability="none">
			<script driver="SQLite">SELECT 42</script>
		</command>
	</container>
</schema>
```
{% endcode %}

默认加载器递归搜索应用目录的映射。`Docs` 是访问器/连接名，`Docs.Answer` 是映射命令限定名；两者分别解决连接选择和命令定位。

## 在命令中调用

把入门示例 `EvaluateCommand` 的执行方法替换为以下内容，并增加 `using Zongsoft.Data;`：

{% code title="EvaluateCommand.cs（替换执行方法）" %}
```csharp
protected override async ValueTask<object> OnExecuteAsync(CommandContext context, CancellationToken cancellation)
{
	var provider = ApplicationContext.Current.Services
		.ResolveRequired<Zongsoft.Services.IServiceProvider<IDataAccess>>();
	var data = provider.GetService("Docs")
		?? throw new InvalidOperationException("未取得 Docs 访问器。");
	var result = await data.ExecuteScalarAsync("Docs.Answer", cancellation);
	context.Output.WriteLine(result);
	return result;
}
```
{% endcode %}

在业务部署章节补充 `../Acme.Rules/Docs.mapping`，重新构建业务类库，停止示例宿主后部署。进入 `out` 启动宿主并执行 `evaluate`，预期输出 `42`。

## 如何判断失败位置

- 提供者解析失败：检查 Data 清单和程序集扫描；当前建议消费契约为 `Zongsoft.Services.IServiceProvider<IDataAccess>`。
- 连接不存在：检查配置是否关联业务清单，名称和 XML 属性是否正确。
- 驱动不存在：同时检查连接设置驱动和数据驱动的注册。
- 命令不存在：检查映射文件、XML 命名空间与 `Docs.Answer` 限定名。
- 原生库加载失败：检查 SQLite 包产物、操作系统和架构，尤其是 `e_sqlite3` 的可解析位置。

{% hint style="info" %}
💡 SQLite 内存库不保证不同连接共享数据。本例只做常量查询；业务示例需要持久数据时应使用独立文件库，并另外准备表结构。更换数据库驱动不会自动翻译映射中手写的 SQL。
{% endhint %}

下一步：[映射业务实体](mapping.md)、[连接配置](connections.md)、[数据访问接口](data-access.md)。源码入口：[提供者注册](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/DataAccessProvider.cs)、[映射加载器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Data/src/Metadata/Profiles/MetadataFileLoader.cs)。
