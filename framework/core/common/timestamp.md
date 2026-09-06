---
description: 以 Discussions 附件命名理解纪元与经过时间。
icon: clock
---

# Timestamp


Timestamp 以指定纪元计算时间点或经过时间。Discussions 的附件上传使用 Millennium 纪元的累计天数作为文件名的一部分，与随机后缀组合。

来源：[src/api/Controllers/FileController.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Controllers/FileController.cs#L79)（节选；上下文见源文件）。

{% code title="FileController.cs" %}
```csharp
var infos = this.Accessor.Write(this.Request,
							  this.DataService.GetDirectory(id),
							  args => args.FileName = $"{Timestamp.Millennium.Epoch.GetElapsed().Days}-{Randomizer.GenerateString()}", cancellation);
```
{% endcode %}

这段代码位于 UploadAsync：Request 来自当前 HTTP 请求，目录由 FileService 决定，cancellation 来自调用方。它没有把文件名中的天数当作业务主键或访问权限。

## 纪元、单位与时区

Unix 和 Millennium 是不同起点。跨系统传递时间值时，必须同时约定起点和单位；仅传一个数字不足以判断它表示秒、毫秒、天数还是 ticks。时区展示也应与持久化时间约定区分。

## 与业务审计时间的区别

Discussions 的 CreatedTime、ModifiedTime 等审计字段由 DataValidator 使用 DateTime.Now 填写。附件名称使用纪元天数，不代表整个模块已经统一采用 Unix 时间戳。审计策略见[数据服务](../../data/services.md)。

方法和边界可核对 [Timestamp 源码](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Timestamp.cs)及[对应测试](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Timestamp.cs)。
