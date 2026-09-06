---
description: 以 Discussions 映射中的外部序号和站点分域说明生成责任。
icon: arrow-up-1-9
---

# 序号器

序号器负责按名称或业务范围生成编号。Discussions 没有自行实现一个演示序号服务，而是在映射中声明外部序号需求，由数据引擎和部署的提供者完成生成。

## 主题使用外部序号

来源：[src/Zongsoft.Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping#L293)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.mapping" %}
```xml
<property name="ThreadId" type="ulong" nullable="false" sequence="#" />
```
{% endcode %}

`#` 表示外部序号。调用业务新增方法时，编号可能尚未生成，所以不能依赖默认编号为新文件提供唯一名字；当前正文文件名还使用随机后缀，见[随机数](randomizer.md)。

## 论坛按站点分域

来源：[src/Zongsoft.Discussions.mapping](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/Zongsoft.Discussions.mapping#L203)（节选；上下文见源文件）。

{% code title="Zongsoft.Discussions.mapping" %}
```xml
<property name="ForumId" type="ushort" nullable="false" sequence="#(SiteId)" />
```
{% endcode %}

ForumId 的编号范围与 SiteId 关联。模型关系和数据库键也需要包含站点，否则不同站点内相同编号会发生混淆。

## 基础序号与本地号段

ISequenceBase 表达基础递增、重置等能力；框架还可通过 Variate 包装获得号段分配。号段降低远端调用次数，但进程退出可能留下未使用号码，不能据此承诺连续无间隙。

Discussions 清单没有固定序号器实现，部署者必须核对实际提供者和名称。框架 [SequenceTest](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Common/SequenceTest.cs) 验证号段增长与重置，[Redis SequenceTest](https://github.com/Zongsoft/framework/blob/main/externals/redis/test/SequenceTest.cs) 提供具体实现参考。不要把测试中的固定区间作为生产配置。

## 使用边界

编号生成成功不代表业务写入已经提交。回滚、重试和跨节点并发都会影响编号使用情况。重置已有业务编号还可能导致键冲突，必须与持久化数据和缓存号段一起评估。
