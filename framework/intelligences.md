---
description: 配置 AI 助手，连接模型服务，并通过终端或 Web 使用聊天能力。
icon: brain
---

# 智能化

`Zongsoft.Intelligences` 把模型服务接入组织为助手、模型和聊天服务。它适合让插件应用使用统一入口调用模型，并为运维人员提供终端命令、为客户端提供 Web 接口。模型推理仍由所连接的模型服务执行；部署插件不会同时安装模型服务器或下载模型。

## 先理解四个概念

| 概念 | 负责什么 | 配置或使用时的选择 |
| --- | --- | --- |
| 提供者 | 适配模型服务协议 | 例如 `ollama` 驱动 |
| 助手 | 给一组连接设置和服务能力命名 | 例如名为 `ollama` 的助手 |
| 模型 | 实际执行推理的模型 | 连接中的 `model`，必须在服务器可用 |
| 会话 | 保存连续对话的状态与历史 | 有上下文的多轮聊天；详见[会话与流式响应](intelligences/sessions.md) |

助手名与驱动名可以相同，但不是同一个概念。同一驱动可以配置不同服务器或模型的多个助手。`AssistantManager` 是查找助手的入口；具体助手通过聊天服务和模型服务提供能力。调用者不应把某个服务器特有的模型管理操作视为所有提供者都支持的功能。

## 接入本地模型服务

首先准备可访问的 Ollama 服务及已安装的模型。这里的 `qwen3:0.6b` 只是配置示例，应替换为服务器实际提供的模型名。模型许可证、内存需求、上下文长度及工具调用支持由所选模型和服务决定。

在宿主的部署清单中加入插件；终端宿主需已有终端命令基础设施。

{% code title=".deploy" %}
```ini
[plugins zongsoft intelligences]
nuget:Zongsoft.Intelligences
```
{% endcode %}

将设置合并到应用自己的 `.option` 文件；不要依赖覆盖包内文件来保存环境配置。

{% code title="Application.option" %}
```xml
<options>
	<option path="ai">
		<connectionSettings>
			<connectionSetting connectionSetting.name="ollama" driver="ollama"
				value="server=http://127.0.0.1:11434;model=qwen3:0.6b" />
		</connectionSettings>
	</option>
</options>
```
{% endcode %}

按照[选项文件匹配规则](../references/option-files.md)使用宿主实际应用名替换文件名。容器中的 `127.0.0.1` 指向容器自身，模型服务器在其他容器或宿主机时应改为可达地址。

## 从终端验证

先确认助手被发现，再确认模型服务可用，最后发起一次短对话。这样能区分配置加载失败和远程推理失败。

{% code title="Assistant.commands" %}
```text
ai.assistant
ai.assistant ollama
ai.assistant.model.list
ai.assistant.chat.open
ai.assistant.chat "请用一句话介绍自己。" --format:text --streaming
ai.assistant.chat.history
ai.assistant.chat.close
```
{% endcode %}

`ai.assistant ollama` 选择当前助手；聊天子命令在该上下文中工作。`model.list --running` 查看运行中的模型，`model.info` 查看指定模型信息。`model.install` 和 `model.uninstall` 会改变模型服务器状态，使用前通过命令帮助确认参数和目标助手。

💡 先用一个短问题完成验证，再引入长提示词、工具调用和多轮历史。长时间无响应可能来自模型冷启动、资源不足或网络问题，不一定是插件没有加载。

## 提供 Web 接口

在已有 [Web 宿主](../hosting/web.md)上额外部署 `Zongsoft.Intelligences.Web`。助手列表入口是 `/AI/Assistants`，模型入口是 `/AI/Assistants/{name}/Models`；会话、历史与聊天接口见[会话文章](intelligences/sessions.md)。

接口层不替代业务自己的用户认证、助手访问范围、请求配额和会话归属校验。特别是模型安装、删除及会话枚举能力，通常应只向有相应权限的使用者开放。

## 提示词与能力边界

默认实现可从程序集旁的 `preludes` 目录加载与助手名匹配的预置提示词。预置提示词属于应用配置，不应由未经检查的用户输入覆盖。它可以定义回答格式和任务背景，但不能代替权限检查或限制被调用工具的实际能力。

当前这一模块主要提供助手、模型和聊天基础设施。检索增强生成还需要应用自行组织资料切分、索引、检索及引用；自动执行工具还需要明确工具权限和错误处理。不要仅因为接口能够调用模型，就假定已具备完整知识库或自治任务系统。

## 排查顺序

1. 助手列表为空：检查 `.option` 文件是否匹配应用名，插件是否进入扫描目录。
2. 助手存在但模型列表失败：检查 `server`、容器网络、服务监听地址和协议。
3. 模型列表正常但聊天失败：核对模型名、模型加载状态及服务器日志。
4. 单轮正常、多轮异常：检查会话标识、过期、历史大小和并发请求，继续阅读[会话与流式响应](intelligences/sessions.md)。

源码入口：[助手与聊天实现](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Intelligences/src)、[Web 控制器](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Intelligences/api/Controllers)。
