---
description: 以 Discussions 长正文与附件上传说明虚拟文件系统和路径。
icon: folder-tree
---

# Zongsoft.IO


Discussions 将短正文放在数据库，将较长正文保存为文件，并把文件路径存回数据模型。Zongsoft.IO 提供统一文件接口，实际本地磁盘或对象存储实现由部署决定。

## 基础路径来自配置

来源：[src/Zongsoft.Discussions.option](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.option#L1)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.option" %}
```xml
<?xml version="1.0" encoding="utf-8" ?>

<options>
	<option path="/Discussions">
		<general siteId="1" basePath="zfs.s3:/zongsoft-discussions/" />
	</option>
</options>
```
{% endcode %}

真实配置使用 zfs.s3 方案。运行需要相应文件系统实现和自己的存储配置；该路径不是文档读者可直接使用的公共空间。Utility.GetFilePath 再根据站点、用户和相对路径组织目录。

## 用同一入口写入文本

来源：[src/Utility.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Utility.cs#L241)（节选；上下文见源文件）。

{% code title="Utility.cs" %}
```csharp
public static bool WriteTextFile(string path, string content)
{
	if(string.IsNullOrWhiteSpace(path))
		throw new ArgumentNullException(nameof(path));

	if(string.IsNullOrWhiteSpace(content))
		return false;

	using(var stream = FileSystem.File.Open(path, FileMode.Create, FileAccess.Write))
	{
		using(var writer = new StreamWriter(stream, System.Text.Encoding.UTF8))
		{
			writer.Write(content);
		}
	}

	return true;
}
```
{% endcode %}

FileSystem.File 根据路径选择实现；流和文本写入器按作用域释放。数据库事务无法回滚这里已经产生的文件，调用业务需要处理失败补偿。

## 内容与路径的区别

来源：[src/Utility.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Utility.cs#L48)（节选；上下文见源文件）。

{% code title="Utility.cs" %}
```csharp
public static bool IsContentEmbedded(string contentType)
{
	if(string.IsNullOrEmpty(contentType))
		return true;

	return contentType.TrimEnd().EndsWith(CONTENT_TYPE_EMBEDDED_SUFFIX, StringComparison.OrdinalIgnoreCase);
}
```
{% endcode %}

空类型或带 +embedded 后缀表示内容字段保存正文；其他类型表示外置文件。这个标记是 Discussions 的业务约定，不是通用 MIME 传输规则。读取外置文件后应同步标记为内嵌，避免下游再次把正文当路径。

## HTTP 附件上传

来源：[src/api/Controllers/FileController.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Controllers/FileController.cs#L79)（节选；上下文见源文件）。

{% code title="FileController.cs" %}
```csharp
var infos = this.Accessor.Write(this.Request,
							  this.DataService.GetDirectory(id),
							  args => args.FileName = $"{Timestamp.Millennium.Epoch.GetElapsed().Days}-{Randomizer.GenerateString()}", cancellation);
```
{% endcode %}

上传目录由 FileService 计算，文件名使用纪元天数和随机字符串。控制器随后把文件信息转换成业务 File 模型，写入失败时清理刚保存的文件。原始客户端文件名与服务端存储名不同，展示与下载应按业务模型解释。

## 运行与故障检查

文件不存在或读取失败时，当前 Utility.ReadTextFile 返回空字符串。排障时要分别检查数据中保存的路径、文件系统插件、存储访问权限与文件是否存在，不能把空正文一律归因于数据库。

为每个隔离环境设置独立目录；站点目录是存储组织方式，不能替代接口权限。有关文件模型、内容标记和外部存储来源，见[真实案例](../../cases.md)及 [Amazon 扩展](../externals/projects/amazon.md)。
