---
description: Zongsoft.Data 命名空间及其子命名空间在核心类库中的职责。
icon: database
---

# Zongsoft.Data

`Zongsoft.Data` 在核心类库中定义数据访问的基础抽象、数据服务模型、条件、操作元、模式、分页、排序、数据字典和数据元数据。完整的数据引擎实现由 `Zongsoft.Data` 模块继续扩展。

## 主要职责

* 定义 `IDataAccess`、`IDataService`、`IDataSearcher` 等数据访问和数据服务抽象。
* 表达查询条件、操作元、分页、排序、返回值、数据模式和数据类型。
* 提供数据服务事件、数据操作选项、模型描述和数据字典。
* 提供数据元数据抽象，供映射文件和数据引擎实现使用。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Data.Archiving` | 数据归档相关抽象。 |
| `Zongsoft.Data.Metadata` | 实体、属性、关联、命令和参数等数据元数据模型。 |

## 相关资源

* [Data 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Data)
* [数据引擎](../data/README.md)
* [Zongsoft.Data NuGet 包](https://www.nuget.org/packages/Zongsoft.Data)
