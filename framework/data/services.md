---
description: 在 IDataAccess 之上组织业务数据服务，明确验证、授权、可写能力与 Web 接口的职责。
icon: layer-group
---

# 数据服务

数据访问器回答“怎样读写数据”，数据服务回答“这个业务模型允许怎样被使用”。`DataServiceBase<TModel>` 将模型名称、查询、写入、验证、授权、过滤和子服务组合起来，适合由命令、工作器和 Web 控制器共同调用。

## 先建立业务边界

例如商品查询和商品调价可以使用相同数据访问器，但不应共享完全相同的授权和字段规则。数据服务可以在调用访问器之前验证条件和输入，控制可写能力，并将模块规则留在业务层。

不要把数据服务理解为创建一个空派生类后，任意用户就能安全访问所有数据。身份、字段名单、租户条件和数据库映射仍须由应用明确配置。

## 显式接入访问器

下面是服务骨架，假定 `Catalog.Product` 已映射，且具名连接 `Catalog` 存在：

{% code title="ProductService.cs" %}
```csharp
using Zongsoft.Data;
using Zongsoft.Services;

[Service<IDataService<Product>>]
public sealed class ProductService : DataServiceBase<Product>
{
	public ProductService(System.IServiceProvider services) : base("Catalog.Product", services)
	{
		var provider = services.ResolveRequired<Zongsoft.Services.IServiceProvider<IDataAccess>>();
		this.DataAccess = provider.GetService("Catalog")
			?? throw new InvalidOperationException("未配置 Catalog 数据访问器。");
	}
}

public sealed class Product
{
	public int ProductId { get; set; }
	public string Name { get; set; } = string.Empty;
}
```
{% endcode %}

该骨架刻意显式设置 DataAccess：基类的延迟属性路径仍查找 `IDataAccessProvider`，而当前具体插件推荐消费具名提供者契约。应用已有注册桥接时可以沿用，但不能在示例中假定它必然存在。

## 验证与授权顺序

查询入口先授权，再通过 OnValidate 修整条件，随后处理模式、默认排序并调用访问器。写入还有数据验证过程。适合放在这些环节的规则包括追加当前租户条件、禁止修改所有者和验证必填字段。

配置 Authorizer 后由业务授权器判断；缺少授权器时，基类会拒绝匿名主体，但这只是一条基础检查，不能替代角色、资源和数据范围的细粒度权限。相关机制见[安全](../security.md)。

{% hint style="warning" %}
🚨 服务的 `CanInsert`、`CanUpdate`、`CanUpsert`、`CanDelete` 表达能力开关，不是完整的用户权限系统。主服务在未指定可变性时，删除默认不可用；子服务还受到主服务能力影响。不要从“继承了 CRUD 基类”推断所有操作已经开放。
{% endhint %}

## 过滤器与事件

数据服务过滤器适合模型相关的横切规则；访问器过滤器则作用于更底层的数据操作。根据规则归属选择一层，避免两层重复追加条件或重复审计。

查询后事件仍遵循[异步访问器的准备与枚举语义](data-access.md)：准备完成不等于所有结果已读取。审计“查询完成”时应说明记录的是命令准备、读取结束还是 HTTP 响应结束。

## 接到 Web

`ServiceController<TModel,TService>` 可以把数据服务映射为 HTTP 操作。控制器负责请求绑定和响应，业务验证与授权应继续由服务承担。控制器示例和操作约定见[请求与数据服务接口](../web/data-services.md)。

源码依据：[数据服务基类](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/DataServiceBase.cs)、[查询入口](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Data/DataServiceBase.Select.cs)。
