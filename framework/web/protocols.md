---
description: 为插件 Web 应用启用 OpenAPI/Scalar 与 gRPC，区分文档生成、服务注册和实际协议端点。
icon: network-wired
---

# OpenAPI 与 gRPC

OpenAPI 描述 HTTP 接口，便于浏览、调试和生成客户端；gRPC 按协议定义调用服务，通常使用 Protocol Buffers。二者是不同接入方式，也分别由可选插件提供，不必为普通 MVC 应用全部安装。

{% tabs %}
{% tab title="OpenAPI 与 Scalar" %}
## 部署文档插件

在现有 Web 宿主部署清单中追加：

{% code title="OpenAPI.deploy（片段）" %}
```ini
[plugins zongsoft web openapi]
nuget:Zongsoft.Web.OpenApi
```
{% endcode %}

保留包内清单、选项和依赖。初始化器会注册文档端点和 Scalar 界面。默认端点为 `/openapi/v1.json`、`/openapi/v1.yaml`（也接受 yml）及 `/scalar`。

文档根据已发现的控制器和操作元数据生成；属性路由直接参与生成，约定式路由还需要实际运行路由表。没有真正映射的端点，不能靠写一段文档配置变为可调用接口。

## 配置与验证

配置节为 `/web/openapi`，可以声明服务器、环境、认证方案和公共请求头。认证方案在文档中出现，仅说明客户端应如何携带证明，不会自动给服务器安装认证或授权。

先打开 JSON 文档，确认业务路径、方法和参数来源，再用 Scalar 发起一次真实请求。遇到文档与路由不一致时，检查属性路由和控制器描述符，而不要先修改业务逻辑。

{% hint style="warning" %}
🚨 当前初始化器启用 Scalar 认证信息持久化，并生成一个示例 Credential 值；这个随机值不是服务器签发的有效登录凭据。共享设备上不要保存真实凭据，文档和管理接口的公开范围也应由应用限制。
{% endhint %}
{% endtab %}

{% tab title="gRPC" %}
## 部署协议宿主扩展

{% code title="Grpc.deploy（片段）" %}
```ini
[plugins zongsoft web grpc]
nuget:Zongsoft.Web.Grpc
```
{% endcode %}

该插件注册 gRPC 服务端和反射服务，不定义应用的 `.proto`。业务需要提供生成的服务基类实现，并通过框架服务系统注册具体类型，赋予 `gRPC` 标签。

Discussions 当前没有 gRPC 服务实现。框架诊断协议服务通过 Listener 的静态 Metrics 成员注册 OTLP 指标接收器：

来源：[framework/Zongsoft.Diagnostics/protocols/server/src/Listener.Metrics.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Diagnostics/protocols/server/src/Listener.Metrics.cs#L51)（节选；上下文见源文件）。

{% code title="Listener.Metrics.cs" %}
```csharp
[Service(Tags = "gRPC", Members = nameof(Metrics))]
partial class Listener
{
	#region 单例字段
	public static readonly MetricsProcessor Metrics = new();
```
{% endcode %}

MetricsProcessor 在同一文件中继承 MetricsService.MetricsServiceBase，并实现 Export 方法。这里的 Members 表示注册静态成员；它与直接注册服务类型是服务系统支持的两种入口。完整调用链见 [OTLP 协议接入](../diagnostics/otlp.md)。

初始化器读取标签下的类型并映射服务。只继承生成基类或只复制 DLL，都不足以完成端点发现。

## 协议与取消

宿主和代理必须支持所需 HTTP/2、TLS、消息大小与截止时间。服务实现应把调用取消传给下游操作；客户端超时也不等于已执行的写操作被撤销。实际调用应使用匹配协议的客户端，不能用普通 JSON 请求验证 gRPC 方法。

{% hint style="warning" %}
🚨 当前初始化器还会映射 gRPC 反射，能够暴露服务元数据。部署时应明确访问策略，不要默认把协议管理面公开。
{% endhint %}
{% endtab %}
{% endtabs %}

实现依据：[OpenAPI 初始化](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/openapi/WebInitializer.cs)、[文档端点](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/openapi/WebExtension.cs)、[gRPC 初始化](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Web/grpc/GrpcInitializer.cs)。OTLP 协议接入示例见[诊断协议](../diagnostics/otlp.md)。
