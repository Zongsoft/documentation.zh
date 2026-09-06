---
description: 用泛型服务控制器连接数据服务，理解 HTTP 方法、模式、分页和授权边界。
icon: arrows-left-right
---

# 请求与数据服务接口

当业务已经有 `IDataService<TModel>`，可以使用泛型服务控制器复用查询、计数、存在判断与写入操作。控制器处理 HTTP 语义，数据服务处理业务验证和授权，访问器处理数据引擎操作。

## 控制器骨架

下面消费[数据服务示例](../data/services.md)中的 Product 和对应服务。类库需要引用 Zongsoft.Web，且处于能扫描该程序集的插件宿主中：

{% code title="ProductController.cs" %}
```csharp
using Microsoft.AspNetCore.Mvc;
using Zongsoft.Data;
using Zongsoft.Web;

[ApiController]
[Route("api/products")]
public sealed class ProductController(IDataService<Product> service)
	: ServiceController<Product, IDataService<Product>>
{
	protected override IDataService<Product> GetService() => service;
}
```
{% endcode %}

基类通过 GetService 扩展点获取服务，不能传入不存在的基类 service 构造参数。应用仍需注册服务、映射实体、配置数据连接，并确定身份和权限规则。

## 方法与操作

| HTTP 入口 | 主要用途 |
| --- | --- |
| `GET api/products/{key?}` | 取得单项或查询结果 |
| 计数/存在判断 Action | 按键或条件检查数据，具体模板以操作路由为准 |
| `POST api/products` | 新增 |
| `PUT api/products` | 增改保存 |
| `PATCH api/products/{key}` | 更新 |
| `DELETE api/products/{key?}` | 删除，受服务能力及键解析约束 |

继承基类后，不要只根据常见 REST 习惯推断 PUT/PATCH 的具体行为。子服务还有不同的路径和批量操作，实际路由应通过[OpenAPI](protocols.md)或控制器元数据核对。

## 参数绑定与返回

绑定器将分页、排序、范围和混合值等文本转换为框架对象；格式化器使用框架序列化器。无效输入应查看模型状态和错误响应，不要把所有请求失败当成数据库异常。

根查询的 page 参数与数据模式中的导航限量不同。数据模式控制字段和对象图，根分页控制结果窗口，详见[数据模式](../data/schema.md)及[查询](../data/querying.md)。分页结果通过 WebUtility 的分页处理携带元数据，客户端应同时检查响应头与正文。

## 不让通用接口扩大权限

公开查询时，应控制可选字段、导航深度、集合限量和可排序成员；写入时应限制所有者、租户和审计字段。把客户端输入直接作为完整模式或无约束过滤条件，可能绕过应用原本的数据范围设计。

数据服务的可写能力、授权器和验证器要一起工作。默认基类检查不等于业务权限已完成，也不意味着每个新增或删除入口都应开放。

{% hint style="info" %}
💡 先验证一个有权限用户的单项查询，再验证无效参数、匿名访问和无权限访问，最后测试写入及其影响行数。这样可以区分 HTTP 绑定、权限和数据库三类问题。
{% endhint %}

实现依据：[服务控制器](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/src/ServiceController.cs)、[控制器基类](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/src/ServiceControllerBase.cs)、[绑定器](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Web/src/Binders)。
