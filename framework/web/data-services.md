---
description: 以 Discussions 的主题审核控制器说明 Web 与业务服务的分工。
icon: route
---

# 请求与数据服务接口


Discussions Web 插件让控制器适配 HTTP，让业务服务处理论坛规则。ThreadController 继承泛型 ServiceController，模型和服务由类型参数明确指定。

来源：[src/api/Controllers/ThreadController.cs](https://github.com/Zongsoft/Zongsoft.Discussions/blob/main/src/api/Controllers/ThreadController.cs#L40)（节选；上下文见源文件）。

{% code title="ThreadController.cs" %}
```csharp
[Authorization]
[ControllerName("Threads")]
public class ThreadController : ServiceController<Thread, ThreadService>
{
	#region 公共方法
	[ActionName("Approve")]
	[HttpPost("{id}/Approve")]
	public object Approve(ulong id)
	{
		return this.DataService.Approve(id) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Hidden")]
	[HttpPost("{id}/Hidden")]
	public object Hidden(ulong id)
	{
		return this.DataService.Visible(id, false) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Visible")]
	[HttpPost("{id}/Visible")]
	public object Visible(ulong id)
	{
		return this.DataService.Visible(id, true) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Lock")]
	[HttpPost("{id}/Lock")]
	public object Lock(ulong id)
	{
		return this.DataService.SetLocked(id, true) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Unlock")]
	[HttpPost("{id}/Unlock")]
	public object Unlock(ulong id)
	{
		return this.DataService.SetLocked(id, false) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Pin")]
	[HttpPost("{id}/Pin")]
	public object Pin(ulong id)
	{
		return this.DataService.SetPinned(id, true) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Unpin")]
	[HttpPost("{id}/Unpin")]
	public object Unpin(ulong id)
	{
		return this.DataService.SetPinned(id, false) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Valued")]
	[HttpPost("{id}/Valued")]
	public object Valued(ulong id)
	{
		return this.DataService.SetValued(id, true) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Unvalued")]
	[HttpPost("{id}/Unvalued")]
	public object Unvalued(ulong id)
	{
		return this.DataService.SetValued(id, false) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Global")]
	[HttpPost("{id}/Global")]
	public object Global(ulong id)
	{
		return this.DataService.SetGlobal(id, true) ? this.NoContent() : this.NotFound();
	}

	[ActionName("Unglobal")]
	[HttpPost("{id}/Unglobal")]
	public object Unglobal(ulong id)
	{
		return this.DataService.SetGlobal(id, false) ? this.NoContent() : this.NotFound();
	}
	#endregion
```
{% endcode %}

## 路由、动作与返回值

ControllerName 将控制器名指定为 Threads；模块提供 Discussions 区域，基类提供通用数据接口。Approve 的路由片段是主题编号加 Approve，调用服务成功返回 204，无匹配更新返回 404。最终地址还取决于宿主 PathBase 和路由约定，不能照搬旧 docs/api.md 中的单数名称或 api 前缀。

## 服务才决定业务条件

ThreadService.Approve 同时判断主题编号、尚未批准和版主资格。控制器不直接更新 Approved，从而让其他入口也可以复用服务逻辑。有关条件与关联正文更新，见[条件与操作元](../data/conditions-and-operands.md)。

## 通用 CRUD 与业务动作

基类提供查询、计数、导入导出等入口；实际可用性还受数据服务能力和授权配置限制。不要因为继承了控制器就认定所有操作应向所有用户开放。新增动作要检查身份、SiteId、目标资源权限和副作用。

## 查询模式和请求范围

ForumController 从请求头取得数据模式，分页来自查询参数。这使同一服务可以支持不同返回形状，也要求服务控制敏感字段、导航成本和审核判定字段。模式语法见[数据模式](../data/schema.md)。

运行前先[部署控制器插件](controllers.md)，并在自己的隔离环境使用仓库 docs/http 中的请求结构核对路由。
