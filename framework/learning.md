---
description: 认识机器学习模块的数据集、估计器目录与训练管线，以及当前实现范围。
icon: graduation-cap
---

# 机器学习

`Zongsoft.Learning` 围绕 ML.NET 建立数据集、加载器、估计器描述与管线配置。它适合研究如何把训练步骤组织为插件扩展，当前不能直接视为完整的训练平台。

## 与大语言模型调用的区别

[智能化模块](intelligences.md)主要连接已有模型服务进行推理。这里的机器学习模块关注结构化数据如何加载、转换，以及如何描述训练步骤。一个通常的训练过程包括准备样本、拆分训练集与测试集、拟合模型、评估误差及保存模型；部署预测服务又是后续阶段。

不要只根据训练集上的效果判断模型可用。数据泄漏、特征定义变化和训练/预测时预处理不一致，都会使离线指标失去参考价值。业务应先确定预测目标和评价方法，再选择算法。

## 主要组成

| 组成 | 作用 | 当前注意事项 |
| --- | --- | --- |
| 数据集 | 描述来源、字段和加载设置 | 字段元数据不自动等于文本加载器的列配置 |
| 数据加载器 | 把外部数据转换为训练数据 | 已有文本文件加载路径，具体选项由加载器消费 |
| 估计器描述 | 为转换或训练步骤提供名称、参数和构建器 | 通过目录发现已注册能力 |
| 管线 | 按顺序描述多个步骤 | 当前构建实现存在限制，见下文 |

当前目录中可见文本文件加载、列合并、独热编码及哈希编码、LightGBM 回归等能力。目录结构比单纯的算法枚举更重要：扩展者通过描述对象和构建器注册步骤，使用者按名称引用它们。

## 先验证插件目录

部署 `Zongsoft.Learning` 后，可以在应用初始化完成之后检查已加载的估计器目录。以下是业务命令或诊断入口中的辅助代码，不是一套训练程序。

{% code title="InspectEstimators.cs" %}
```csharp
using Zongsoft.Learning;

PrintCatalog(Pipeline.Catalog);

static void PrintCatalog(EstimatorDescriptorCatalog catalog)
{
	foreach(var estimator in catalog.Estimators)
		Console.WriteLine(estimator.Name);

	foreach(var child in catalog.Catalogs)
		PrintCatalog(child);
}
```
{% endcode %}

如果目录缺项，先检查插件清单、扩展注册和程序集部署，再检查训练参数。文本加载时应显式检查分隔符、标题行、列索引、字段类型和缺失值处理，不要假定数据集的展示字段会自动配置加载器。

## 当前实现限制

{% hint style="warning" %}
🚨 当前源码的 `Pipeline.Build` 在后续步骤中调用 `estimator.Append(estimator)`，没有把结果累积回管线；因此多步骤配置不能据此认定已正确串接。空步骤列表返回空结果，未知步骤名称也缺少完整的错误转换。正式训练前需要先修复并验证这些路径。
{% endhint %}

Web 项目中的控制器骨架也不构成完整的训练任务 API。仅部署包不能获得训练调度、任务持久化、模型版本仓库、评估看板或在线预测服务。数据库目录中的设计文件同样不能作为已经完成的运行功能。

## 如何开展应用集成

1. 选择一份可重复的小数据集，明确输入列、目标列和评估指标。
2. 验证加载器输出，再独立验证一个转换或训练步骤。
3. 对照当前管线实现确认步骤顺序和组合结果，修复限制后再组合步骤。
4. 由应用负责数据版本、训练日志、模型保存与预测入口；把训练失败与业务请求失败分开处理。

需要可直接运行的 ML.NET 训练路径时，应同时参考所用 ML.NET 版本的官方示例，并在应用中验证模型结果，不能把本模块的元数据声明当作训练成功的证据。

源码入口：[机器学习模块](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Learning)、[管线构建](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Learning/src/Pipeline.cs)。
