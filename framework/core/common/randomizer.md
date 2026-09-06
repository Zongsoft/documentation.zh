---
description: 以 Discussions 的正文文件名说明随机字符串的真实用途。
icon: shuffle
---

# Randomizer


Randomizer 提供随机字节、整数和字符串。Discussions 使用随机字符串作为文件名的一部分，避免新建内容尚未取得数据库编号时共用同一个文件名。

来源：[src/Services/PostService.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Services/PostService.cs#L222)（节选；上下文见源文件）。

{% code title="PostService.cs" %}
```csharp
protected virtual string GetContentFilePath(ulong postId, string contentType)
{
	return Utility.GetFilePath(string.Format("posts/post-{0}-{1}.txt", postId.ToString(), Zongsoft.Common.Randomizer.GenerateString()));
}
```
{% endcode %}

PostId 提供业务线索，随机后缀降低同一编号或未分配编号产生路径冲突的机会。路径还会经过 Utility.GetFilePath 加上配置和用户范围。随机文件名不能代替访问控制，也不构成绝对唯一性保证。

## 方法选择

| 方法 | 作用 |
| --- | --- |
| Generate | 指定长度的随机字节 |
| GenerateInt16、GenerateInt32、GenerateInt64 | 有符号整数 |
| GenerateUInt16、GenerateUInt32、GenerateUInt64 | 无符号整数 |
| GenerateSecret | 密钥风格字符串 |
| GenerateString | 普通随机字符串，可限定数字 |

本业务没有直接使用 GenerateSecret 作为凭证，因此不能把文件命名做法直接推广为认证令牌方案。字符串长度和字符范围的框架用例见 [RandomizerTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/RandomizerTest.cs)。

关联阅读：[文件系统](../io.md)、[写入操作](../../data/writing.md)。
