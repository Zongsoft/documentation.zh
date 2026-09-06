---
description: 从发表主题与更新统计理解事务边界、提交和外部副作用。
icon: book-open
---

# 事务与一致性


发表主题不是一次孤立插入：主题、正文帖和关联统计必须协同。Discussions 在 ThreadService.OnInsert 中组织这一工作单元。

来源：[src/Services/ThreadService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/ThreadService.cs#L200)（节选；上下文见源文件）。

{% code title="ThreadService.cs" %}
```csharp
protected override int OnInsert(IDataDictionary<Models.Thread> data, ISchema schema, DataInsertOptions options)
{
	if(!data.TryGetValue(p => p.Post, out var post) || post == null || string.IsNullOrEmpty(post.Content))
		throw new InvalidOperationException("Missing content of the thread.");

	//确保数据模式含有“主题内容贴”复合属性
	schema.Include("Post{*}");

	//更新主题内容贴的相关属性
	post.Visible = false;
	post.Approved = this.ServiceProvider.ResolveRequired<ForumService>().CanPublish(data);
	data.SetValue(p => p.Approved, post.Approved);
	schema.Include(nameof(Models.Thread.Approved));

	var content = DataDictionary.GetDictionary<Post>(post);
	return Utility.MutateContent(content, () => this.Posting.GetContentFilePath(content), () =>
	{
		using(var transaction = new Transaction())
		{
			//调用基类同名方法，插入主题数据
			var count = base.OnInsert(data, schema, options);

			if(count < 1)
				return count;

			//更新发帖人关联的主题统计信息
			this.SetMostRecentThread(data);

			//提交事务
			transaction.Commit();

			return count;
		}
	});
}
```
{% endcode %}

## 为什么在这里建立事务

方法先确认主题正文存在，并把 Post 导航包含进数据模式。随后插入主题与正文关系，再更新所属论坛和作者的统计，最后提交。插入没有成功时直接返回，不会执行 Commit。

这段业务代码使用 Zongsoft.Data.Transaction 的环境事务机制；它不是直接创建某一种数据库连接事务。底层资源怎样加入、嵌套范围怎样投票，见[核心事务](../core/data/transactions.md)。

## 统计也属于业务状态

SetMostRecentThread 更新论坛的最后发帖信息、作者累计主题数和最近主题信息。只复制 Insert 而漏掉这些步骤，会出现主题存在但列表摘要和个人统计不一致的情况。

## 事务覆盖范围

同一个服务调用可能还触发正文文件写入。数据库事务不能自动回滚文件存储；外部文件需要补偿、重试或事后清理。跨驱动、跨连接的原子性也必须以实际参与资源为准，不能仅凭 using 作用域作保证。

## 验证这条路径

使用隔离站点与临时数据库，检查成功发表后主题、正文、论坛摘要和作者统计；再模拟插入或统计阶段失败，核对回滚结果及文件残留。检查授权失败时不产生副作用。
