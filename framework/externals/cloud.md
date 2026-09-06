---
description: 接入对象存储、云通信与微信服务，并正确处理回调验证和重复通知。
icon: cloud
---

# 云服务与回调

云适配器把远程协议接入框架，但配置、调用权限和业务完成条件仍需应用明确。读取一个存储对象、发送通知和接收支付回调，不能使用同一种重试或确认策略。

## 能力与配置入口

| 扩展 | 当前主要能力 | 配置位置 |
| --- | --- | --- |
| Amazon | S3 及兼容对象存储 | `/Externals/Amazon/ConnectionSettings` |
| Aliyun | OSS、消息、短信/语音、移动推送 | `/Externals/Aliyun` 的相应服务设置 |
| Wechat | 账户、公众平台、第三方平台和支付适配 | 随包账户、证书及服务选项 |

各主包与 Web/API/Gateway 是不同部署产物。只需访问存储时无需部署回调网关；需要接收回调时，仅安装客户端主包也不会自动提供 HTTP 入口。

## 对象存储基础

对象存储由 Bucket 和 Key 定位数据，目录通常只是键前缀。框架文件系统提供统一路径，但重命名、追加、列举、随机写入等行为未必与本地磁盘相同。

Amazon 插件注册 `zfs.s3`，例如 `zfs.s3:/assets/manuals/start.pdf` 中 `assets` 是 Bucket。Aliyun OSS 使用 `zfs.oss`。Bucket 选择和 Key 前缀应受业务权限约束，不要把用户提供的完整路径直接用于跨租户访问。

下面的片段只读取已存在对象的信息，运行前需要部署 Amazon 插件并配置相应 S3 连接。

{% code title="InspectObject.cs" %}
```csharp
using Zongsoft.IO;

var info = await FileSystem.File.GetInfoAsync(
	"zfs.s3:/assets/manuals/start.pdf");
Console.WriteLine(info == null ? "Object not found." : info.ToString());
```
{% endcode %}

Amazon 连接驱动为 `amazon.s3`，支持区域、端点和凭据配置；自定义端点会采用路径式寻址。服务账号是否具有所需操作权限，应在专用资源上验证。访问流由调用者及时释放，写入还应验证上传完成及最终对象信息。

## Aliyun 的服务配置

`general` 选择服务中心与内外网，具名证书保存访问凭据；Bucket、消息、通信模板及推送应用可按配置选择对应服务和凭据。这里的 Certificate 是该适配器的凭据模型，不应一概理解为 TLS 证书文件。

短信与语音操作引用云端已配置模板，参数必须符合模板定义；推送还需正确应用和目标类型。调用成功通常表示平台接受请求，送达或业务完成可能通过后续查询、回执或回调确认。避免对发送类操作盲目套用通用重试。

## 微信中的不同身份

应用标识、用户在应用下的标识、第三方平台令牌和支付商户身份属于不同范围。应用不能把一个范围中的标识直接用于另一个范围，也不能把用户授权视为商户支付权限。

第三方平台流程通常包含接收平台票据、获取平台访问令牌、生成预授权信息、用户完成授权、保存授权者凭据并刷新。具体字段和时效以对应平台接口及当前适配器实现为准，不把旧 README 中的时长写成不可变协议。

## 回调网关不是自动验签器

当前两个网关公开以下分派入口：

| 网关 | 默认 POST 路由 |
| --- | --- |
| Aliyun | `/Externals/Aliyun/Fallback/{name}/{key?}` |
| Wechat | `/Externals/Wechat/Fallback/{name}/{key?}` |

`name` 是处理器分派键，不是来源认证。处理器应按具体服务协议对原始数据验签、检查有效性、必要时解密，再进入业务处理。微信网关也不会自动提供所有产品要求的 GET 地址验证。

Wechat 可在启动阶段向 `FallbackExecutor.Instance.Handlers` 注册已构造的处理器；Aliyun 当前插件节点绑定的是执行器自身，追加集合前需要暴露其 `Handlers` 属性。完整注册片段分别见[微信网关](https://github.com/Zongsoft/framework/blob/main/externals/wechat/gateway/README.zh-Hans.md)和[阿里云网关](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/gateway/README.zh-Hans.md)。

## 回调应答与幂等

网关将请求流与参数交给处理器。流只在请求生命周期内有效；需要后台处理时，应在大小限制内复制并可靠保存必要内容。处理器非空结果返回内容，空结果通常为 `204`，这未必符合服务方要求的确认格式，必须按目标协议验证。

{% hint style="warning" %}
🚨 网关不会自动完成所有产品的签名校验、解密和重放防护。回调可能重复，业务更新应按经过验证的事件或交易标识去重；收到正确签名也不意味着同一副作用可以执行多次。
{% endhint %}

先用脱敏的固定请求验证签名、错误签名、重复、过期和处理失败，再接入专用平台测试环境。日志记录请求关联标识和错误类型，避免保存访问密钥、完整签名、证书秘密或原始交易数据。

源码入口：[Amazon](https://github.com/Zongsoft/framework/tree/main/externals/amazon)、[Aliyun](https://github.com/Zongsoft/framework/tree/main/externals/aliyun)、[Wechat](https://github.com/Zongsoft/framework/tree/main/externals/wechat)。
