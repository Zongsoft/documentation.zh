---
description: Zongsoft.Text 文本模板接口、正则验证器和常用文本匹配用法。
icon: font
---

# Zongsoft.Text

`Zongsoft.Text` 提供轻量的文本模板抽象和正则验证器，用于把“文本如何生成、如何格式化、如何验证”从具体业务代码中拆出来。它适合处理命令参数、配置值、短信模板参数、URI 判断、邮箱和常见中文文本格式验证等基础场景。

当前核心类型集中在两个方向：一类是 `ITemplate` / `ITemplateFormatter`，用于定义模板和模板数据格式化扩展点；另一类是 `ITextRegular` / `TextRegular`，用于封装可复用的正则匹配器，并在匹配成功时提取规范化结果。

## 主要职责

* 定义文本模板接口，让业务模块可以按模板名称把数据求值为文本。
* 定义模板格式化器接口，让外部服务模板参数可以在发送前转换成供应商需要的结构。
* 提供 `TextRegular` 正则封装，统一处理匹配、失败容错和结果提取。
* 提供邮箱、URL、HTTP/FTP URL、中国手机号、固定电话、身份证号、邮政编码等常用验证器。
* 让命令、配置、消息、资源输出和外部通讯可以复用同一套轻量文本处理约定。

## 关键类型

| 类型 | 说明 |
| --- | --- |
| `ITemplate` | 文本模板接口，提供模板名称和 `Evaluate(...)` 求值入口。 |
| `ITemplateFormatter` | 模板数据格式化器接口，按模板名称、数据和附加参数返回格式化后的模板数据。 |
| `ITextRegular` | 文本匹配接口，继承可匹配对象约定，并支持输出匹配结果。 |
| `TextRegular` | 正则文本匹配器，提供 `Match(...)` 和 `IsMatch(...)`。 |
| `TextRegular.Web` | Web 常用验证器，目前提供邮箱验证器。 |
| `TextRegular.Uri` | URL 验证器，包含任意协议、HTTP、FTP 和按协议创建验证器。 |
| `TextRegular.Chinese` | 中国手机号、固定电话、身份证号和邮政编码验证器。 |

## 正则验证器

`TextRegular` 用一个正则表达式构造可复用的文本验证器。它内部启用编译、忽略大小写、忽略模式空白和显式捕获，并设置匹配超时时间。调用 `Match(...)` 只返回是否匹配，调用 `IsMatch(...)` 则会在匹配成功时返回结果文本。

{% code title="EmailValidation.cs" %}
```csharp
using Zongsoft.Text;

if(TextRegular.Web.Email.IsMatch(input, out var email))
{
	await SendEmailAsync(email, cancellation);
}
```
{% endcode %}

`IsMatch(...)` 的结果提取有一个重要约定：如果正则包含名为 `value` 的捕获组，则会把该组所有捕获值连接成结果；如果没有 `value` 组，则返回整个匹配文本。这个约定适合把用户输入中的空格、分隔符、国家码等非核心内容去掉，返回更适合保存或后续处理的规范化值。

{% code title="CellphoneNormalization.cs" %}
```csharp
using Zongsoft.Text;

var input = "+86 138-1234-5678";

if(TextRegular.Chinese.Cellphone.IsMatch(input, out var number))
{
	// number 通常会是 13812345678
	await SendSmsAsync(number, message, cancellation);
}
```
{% endcode %}

如果只需要判断某个字符串是不是 URL，可以使用 `Match(...)`：

{% code title="UrlMatch.cs" %}
```csharp
using Zongsoft.Text;

if(TextRegular.Uri.Http.Match(url))
	return await http.GetStringAsync(url, cancellation);
```
{% endcode %}

框架中的文件系统工具就使用 `TextRegular.Uri.Url.Match(...)` 判断传入的虚拟路径是否已经是 URI；如果是 URI，就直接返回原始地址，而不是继续按本地文件系统路径解析。

## 预置验证器

| 验证器 | 用途 |
| --- | --- |
| `TextRegular.Web.Email` | 验证并提取邮箱地址。 |
| `TextRegular.Uri.Url` | 验证任意协议 URL。 |
| `TextRegular.Uri.Http` | 验证 `http` 或 `https` URL。 |
| `TextRegular.Uri.Ftp` | 验证 `ftp` 或 `ftps` URL。 |
| `TextRegular.Uri.GetRegular(scheme)` | 按指定协议创建并缓存 URL 验证器。 |
| `TextRegular.Chinese.Cellphone` | 验证并规范化中国手机号。 |
| `TextRegular.Chinese.Telephone` | 验证并规范化中国固定电话。 |
| `TextRegular.Chinese.IdentityNo` | 验证并规范化中国身份证号码。 |
| `TextRegular.Chinese.PostalCode` | 验证并提取中国邮政编码。 |

这些验证器更适合做输入格式确认和基础规范化，不应当被当成完整业务校验。例如身份证号码是否真实存在、手机号是否已实名、邮箱域名是否可投递，都需要交给更具体的业务流程或外部服务确认。

## 自定义验证器

业务模块可以用自己的正则创建 `TextRegular`。只要在正则中使用 `(?<value>...)` 捕获真正需要的片段，调用方就能拿到规范化后的结果。

{% code title="CommandNameRegular.cs" %}
```csharp
using Zongsoft.Text;

var regular = new TextRegular(@"^\s*(?<value>[A-Za-z][A-Za-z0-9_\.-]*)\s*$");

if(regular.IsMatch(input, out var commandName))
{
	await ExecuteCommandAsync(commandName, cancellation);
}
```
{% endcode %}

{% hint style="info" %}
`TextRegular` 的匹配失败会返回 `false`，包括空文本、正则匹配失败和匹配异常。它适合做宽容的输入判断；如果调用方需要暴露具体错误原因，应在外层补充更明确的提示。
{% endhint %}

## 模板接口

`ITemplate` 表示一个可求值的文本模板。它只规定模板名称和求值入口，不限定模板语法，因此实现可以来自字符串模板、脚本模板、资源文件、外部服务模板或自定义模板引擎。

{% code title="NoticeTemplate.cs" %}
```csharp
using Zongsoft.Text;

public sealed class NoticeTemplate : ITemplate
{
	public string Name => "notice";

	public string Evaluate(object data, params object[] arguments)
	{
		var user = (User)data;
		return $"您好 {user.Name}，您有一条新的通知。";
	}
}
```
{% endcode %}

`ITemplateFormatter` 更偏向“发送前格式化”。它接收模板名称、原始数据和附加参数，返回格式化后的数据对象。这个返回值可以继续被序列化为 JSON、查询字符串或供应商 API 需要的参数结构。

{% code title="SmsTemplateFormatter.cs" %}
```csharp
using Zongsoft.Text;

public sealed class SmsTemplateFormatter : ITemplateFormatter
{
	public string Name => "sms";

	public object Format(string name, object data, params object[] arguments)
	{
		return name switch
		{
			"Alarm" => new { title = data?.ToString(), level = "warning" },
			_ => data,
		};
	}
}
```
{% endcode %}

在外部通讯场景中，模板配置可以指定一个格式化器名称。发送前，服务按名称解析 `ITemplateFormatter`，再把模板参数交给格式化器处理。例如阿里云语音和短信发送流程会在提交请求前调用格式化器，把业务参数转换成供应商模板参数。

## 典型用例

{% tabs %}
{% tab title="输入校验" %}
命令、配置和 Web 表单可以用 `TextRegular` 做第一层格式判断。例如命令参数输入手机号时，先用 `TextRegular.Chinese.Cellphone.IsMatch(...)` 提取规范化号码，再进入认证、发送或业务查询流程。
{% endtab %}

{% tab title="路径判断" %}
文件系统、资源引用和下载地址处理时，可以先用 `TextRegular.Uri.Url.Match(...)` 判断文本是否已经是 URL。如果是 URL，就按远程地址处理；否则继续按本地路径或虚拟路径解析。
{% endtab %}

{% tab title="模板参数" %}
短信、语音、通知和消息队列等外部服务常常要求模板参数符合特定格式。可以把格式转换放到 `ITemplateFormatter`，让业务代码只提交原始数据，格式化器负责适配不同模板或供应商。
{% endtab %}
{% endtabs %}

## 使用建议

`TextRegular` 适合做轻量格式判断和结果提取。对于需要强安全保证的场景，例如身份核验、支付参数、权限表达式或外部回调签名，应在正则验证后继续做业务校验和安全校验。

模板接口适合做框架级扩展点，而不是规定某一种模板语法。项目可以根据实际需要选择字符串插值、资源文件、脚本模板或第三方模板引擎，只要最终实现 `ITemplate` 或 `ITemplateFormatter` 即可。

如果正则需要复用，建议定义成静态只读验证器，避免在热路径上重复构造；如果协议或格式由配置决定，可以使用 `TextRegular.Uri.GetRegular(...)` 这类带缓存的入口。

## 相关资源

* [Text 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Text)
* [FileSystem.cs URL 判断用例](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/IO/FileSystem.cs)
* [阿里云电信模板格式化用例](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/src/Telecom/Phone.cs)
