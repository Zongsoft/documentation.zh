---
description: 按应用场景选择第三方适配器，理解公共契约、插件部署和外部运行环境的关系。
icon: plug-circle-bolt
---

# 扩展插件

![不同外部能力通过适配接口连接到框架](../.gitbook/assets/zongsoft-externals-cover.png)

外部扩展把第三方运行时、基础设施或云服务接入 Zongsoft。业务模块尽量依赖框架契约，应用组合层负责选择提供者；实际协议、资源及故障行为仍由具体实现决定。

## 按需求阅读

| 需求 | 扩展 | 专题 |
| --- | --- | --- |
| 缓存、序号、分布式锁、进程内缓存服务器 | Redis、etcd、Garnet | [缓存与分布式协作](externals/caching.md) |
| 规则计算、语言脚本、文本表达式 | Lua、Python、Scriban | [脚本与表达式](externals/scripting.md) |
| 后台作业、重试、超时与熔断 | Hangfire、Polly | [任务调度与弹性执行](externals/execution.md) |
| 工作簿交换、模板与单元格操作 | ClosedXml、OpenXml | [表格与模板扩展](externals/documents.md) |
| 对象存储、短信推送、微信及回调 | Amazon、Aliyun、Wechat | [云服务与回调](externals/cloud.md) |
| 工业通讯与设备数据接入 | Opc | [OPC UA 设备协议](externals/integration.md) |

## 按项目阅读

如果已经确定项目名称，可从[项目索引](externals/projects/README.md)进入 Aliyun、Amazon、Redis、etcd、Hangfire 等 14 个项目的独立页面，查看包、配置入口和实现限制。

## 接入的共同路径

先确定需要的公共能力，再部署实现包及其附属文件。插件加载后，检查配置、服务注册或插件树节点，最后执行一次受控调用。只在插件列表中看到名称，无法证明延迟连接、原生库或第三方依赖版本都正确。

{% code title=".deploy（以 Scriban 为例）" %}
```ini
[plugins zongsoft externals scriban]
nuget:Zongsoft.Externals.Scriban
```
{% endcode %}

这段内容应合并到已有宿主的部署清单。部署参数和运行目录见[部署工具](../tools/deployer.md)；如何让业务插件通过配置选择实现，见[首个业务插件](../get-started/first-business-plugin.md)。

## 三种常见接入形态

**服务提供者**按连接名称供应缓存、锁等实例；**可匹配服务**按名称或格式找到求值器、归档器；**插件树构件**通过扩展路径挂载文件系统、工作器及处理器集合。它们都属于插件扩展，但获取方式不同。

不要看到包里有一个类型，就推断它一定注册在容器中；也不要把 Redis 的别名规则套给其他提供者。详细区别见[服务定位与所有权](core/services/locating.md)。

## 运行和版本边界

外部服务地址、凭据、数据库、存储桶、证书和许可证由部署环境提供。包版本应与宿主和第三方依赖组合核对，特别是多个部署清单向同一目录复制不同版本 DLL 时。

框架适配器不会自动创建全部云资源或替代其权限配置。脚本插件也不自动成为安全沙箱，Dashboard 不自动成为完整运维权限系统。各专题说明已实现的能力、需要应用补充的责任和验证路径。

源码入口：[外部扩展目录](https://github.com/Zongsoft/framework/tree/main/externals)。
