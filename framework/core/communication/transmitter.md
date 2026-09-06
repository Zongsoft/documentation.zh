---
description: ITransmitter、TransmitterDescriptor、TransmitterHandler 和模板通知发送。
icon: paper-plane
---

# Transmitter

`Transmitter` 是模板化消息发送模型。它把“由谁发送、通过哪个通道发送、使用哪个模板、模板需要哪些参数、发给谁”拆成可描述、可配置、可执行的结构，适合短信、语音、微信模板消息、验证码和业务通知。

## 类型关系

| 类型 | 说明 |
| --- | --- |
| `ITransmitter` | 模板信息发送器接口。 |
| `ITransmitterArgumenter` | 将处理器参数集转换为模板参数对象。 |
| `TransmitterDescriptor` | 发送器元数据，描述名称、标题、通道和模板。 |
| `TransmitterDescriptor.Channel` | 发送通道，例如短信、语音、微信模板消息。 |
| `TransmitterDescriptor.Template` | 模板定义。 |
| `TransmitterDescriptor.Template.Parameter` | 模板参数定义。 |
| `TransmitterHandler` | 处理器入口，按参数查找发送器并调用发送。 |
| `TransmitterUtility` | 构建描述符的链式扩展方法。 |

## 为什么需要 Descriptor

`TransmitterDescriptor` 不是单纯的说明文字。它可以让后台或 GUI 动态知道：

* 系统里有哪些发送器，例如 `Phone`、`Wechat`。
* 每个发送器有哪些通道，例如 `message`、`voice`。
* 每个通道有哪些模板。
* 每个模板需要哪些参数。

这对“用户在界面上定义通知规则”很关键。界面可以读取描述符后，生成通道下拉框、模板下拉框、参数输入表单，再把用户配置保存为可执行的 `TransmitterHandler.Argument`。

## 构建描述符

Discussions 当前没有模板短信或语音发送用例。framework 的 Aliyun PhoneTransmitter 从真实选项集合读取短信、语音模板，创建描述符。模板标识和参数来自已配置的服务，不在文档中另造收件人或告警模板。

来源：[framework/externals/aliyun/src/Telecom/PhoneTransmitter.cs](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/src/Telecom/PhoneTransmitter.cs#L65)（节选；上下文见源文件）。

{% code title="PhoneTransmitter.cs" %}
```csharp
public TransmitterDescriptor Descriptor
{
	get
	{
		if(_descriptor == null)
		{
			_descriptor = new TransmitterDescriptor(this.Name, AnnotationUtility.GetDisplayName(this.GetType()), AnnotationUtility.GetDescription(this.GetType()));

			var channel = _descriptor.Channel(MESSAGE_CHANNEL, Properties.Resources.Text_Phone_Message);
			foreach(var option in this.Phone.Options.Message.Templates)
			{
				var template = channel.Template(option.Name);

				foreach(var parameter in option.Parameters)
					template.Parameter(parameter.Name, parameter.Title, parameter.Description);
			}

			channel = _descriptor.Channel(VOICE_CHANNEL, Properties.Resources.Text_Phone_Voice);
			foreach(var option in this.Phone.Options.Voice.Templates)
			{
				var template = channel.Template(option.Name);

				foreach(var parameter in option.Parameters)
					template.Parameter(parameter.Name, parameter.Title, parameter.Description);
			}
		}

		return _descriptor;
	}
}
```
{% endcode %}

`TransmitterUtility` 提供 `Channel`、`Template`、`Parameter` 扩展方法，方便发送器在运行时从配置或远端服务中构造描述符。

## 执行发送

`ITransmitter` 的核心方法是 `TransmitAsync`。`destination` 是目的地，例如手机号、OpenId、邮箱或自定义地址；`channel` 是通道；`template` 是模板标识；`data` 是模板参数对象。下面是框架 Secretor 完成方案和验证码验证后生成确认码、委托发送器投递的实际调用片段；其变量来自外层 TransmitAsync 方法，不能脱离验证步骤直接暴露为公共发送接口。

来源：[framework/Zongsoft.Core/src/Security/Secretor.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Secretor.cs#L355)（节选；上下文见源文件）。

{% code title="Secretor.cs" %}
```csharp
var token = GetKey(scheme, destination, template, scenario, channel);
var value = await _secretor.GenerateAsync(token, null, extra, cancellation);

//发送验证码到目的地
await transmitter.TransmitAsync(destination, channel, template, new SecretTemplateData(value), cancellation);
```
{% endcode %}

`TransmitterHandler` 则把发送动作包装成通用处理器。它会按 `Argument.Name` 查找 `ITransmitter`，再按 `Argument.Channel`、`Argument.Template` 和 `Argument.Destination` 执行发送。

来源：[framework/Zongsoft.Core/src/Communication/TransmitterHandler.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/TransmitterHandler.cs#L49)（节选；上下文见源文件）。

{% code title="TransmitterHandler.cs" %}
```csharp
protected override ValueTask OnHandleAsync(Argument argument, Collections.Parameters parameters, CancellationToken cancellation)
{
	if(argument == null)
		return ValueTask.CompletedTask;

	//获取指定名称的发送器
	var transmitter = _serviceProvider.FindRequired<ITransmitter>(argument.Name);

	//获取指定的发送通道
	if(!transmitter.Descriptor.Channels.TryGetValue(argument.Channel ?? string.Empty, out var channel))
		channel = transmitter.Descriptor.Channels.Count > 0 ? transmitter.Descriptor.Channels[0] : null;

	//如果没有指定参数对象则尝试通过参数转换器将参数集转换成发送模板的参数对象
	if(argument.Parameter == null)
	{
		//获取指定的发送器参数转换器
		var argumenter = _serviceProvider.Find<ITransmitterArgumenter>(argument);

		if(argumenter != null)
			argument.Parameter = argumenter.GetArgument(transmitter, channel?.Name ?? argument.Channel, argument.Template, argument.Parameter, parameters);
		else
			argument.Parameter = parameters;
	}

	//执行发送任务
	return transmitter.TransmitAsync(argument.Destination, argument.Channel, argument.Template, argument.Parameter, cancellation);
}
```
{% endcode %}

如果 `Argument.Parameter` 为空，`TransmitterHandler` 会尝试从服务容器查找 `ITransmitterArgumenter`，把当前处理器参数集转换为模板参数对象。这让 GUI 可以只保存“模板参数映射规则”，运行时再由参数转换器生成最终对象。

## Aliyun PhoneTransmitter

`externals/aliyun` 中的 `PhoneTransmitter` 是最典型的实现：

* `Name` 固定为 `Phone`。
* `Descriptor` 根据 `Phone.Options.Message.Templates` 生成 `message` 通道。
* `Descriptor` 根据 `Phone.Options.Voice.Templates` 生成 `voice` 通道。
* `TransmitAsync` 中，`message` 通道调用 `Phone.SendAsync`，`voice` 通道调用 `Phone.CallAsync`。

来源：[framework/externals/aliyun/src/Telecom/PhoneTransmitter.cs](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/src/Telecom/PhoneTransmitter.cs#L98)（节选；上下文见源文件）。

{% code title="PhoneTransmitter.cs" %}
```csharp
public async ValueTask TransmitAsync(string destination, string channel, string template, object data, CancellationToken cancellation)
{
	if(data == null)
		throw new ArgumentNullException(nameof(data));

	if(string.IsNullOrEmpty(channel) || string.Equals(channel, MESSAGE_CHANNEL, StringComparison.OrdinalIgnoreCase))
		await this.Phone.SendAsync(template, new[] { destination }, data, cancellation:cancellation);
	else if(string.Equals(channel, VOICE_CHANNEL, StringComparison.OrdinalIgnoreCase))
		await this.Phone.CallAsync(template, destination, data, cancellation:cancellation);
	else
		throw new ArgumentException($"Unsupported ‘{channel}’ channel.", nameof(channel));
}
```
{% endcode %}

## GUI 配置场景

以下是基于描述符能力的界面设计建议，Discussions 尚未实现这样的通知规则界面：

{% stepper %}
{% step %}
读取服务容器中所有 `ITransmitter`，展示发送器列表，例如 `Phone`、`Wechat`。
{% endstep %}

{% step %}
读取选中发送器的 `Descriptor.Channels`，展示短信、语音、微信模板消息等通道。
{% endstep %}

{% step %}
读取选中通道的 `Templates`，展示模板列表和参数定义。
{% endstep %}

{% step %}
保存用户选择的发送器、通道、模板、目的地表达式和参数映射。
{% endstep %}

{% step %}
运行时构造 `TransmitterHandler.Argument`，交给 `TransmitterHandler` 或直接调用 `ITransmitter.TransmitAsync`。
{% endstep %}
{% endstepper %}

这套模型特别适合验证码、用户绑定手机/邮箱、找回密码、告警通知、审批提醒等“模板固定、参数变化、接收人动态”的场景。

## 相关资源

* [ITransmitter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/ITransmitter.cs)
* [ITransmitterArgumenter.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/ITransmitterArgumenter.cs)
* [TransmitterDescriptor.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/TransmitterDescriptor.cs)
* [TransmitterDescriptor.partials.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/TransmitterDescriptor.partials.cs)
* [TransmitterHandler.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/TransmitterHandler.cs)
* [TransmitterUtility.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Communication/TransmitterUtility.cs)
* [PhoneTransmitter.cs](https://github.com/Zongsoft/framework/blob/main/externals/aliyun/src/Telecom/PhoneTransmitter.cs)
* [Wechat Transmitter.cs](https://github.com/Zongsoft/framework/blob/main/externals/wechat/src/Transmitter.cs)
* [Secretor.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Security/Secretor.cs)
