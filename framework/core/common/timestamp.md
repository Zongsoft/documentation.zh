---
description: Timestamp 时间戳转换工具。
icon: clock
---

# Timestamp

`Timestamp` 用于在 `DateTime` 和整数时间戳之间转换。它支持不同纪元和不同时间单位。

## 预置纪元

| 成员 | 说明 |
| --- | --- |
| `Timestamp.Unix` | 以 Unix Epoch 为起点，即 1970-01-01 00:00:00 UTC。 |
| `Timestamp.Millennium` | 以 2000-01-01 00:00:00 UTC 为起点。 |

## 时间戳转换

{% code title="TimestampSample.cs" %}
```csharp
using Zongsoft.Common;

var timestamp = Timestamp.Unix.Now;
var datetime = Timestamp.Unix.ToDateTime(timestamp);
```
{% endcode %}

默认单位是秒，也可以指定毫秒等单位。

{% code title="TimestampUnitSample.cs" %}
```csharp
var value = Timestamp.Unix.ToTimestamp(
	DateTime.UtcNow,
	TimestampUnit.Millisecond);

var time = Timestamp.Unix.ToDateTime(
	value,
	TimestampUnit.Millisecond);
```
{% endcode %}

`Today` 和 `Yesterday` 会基于 UTC 日期计算当天和昨日的时间戳。

## 相关资源

* [Timestamp.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Common/Timestamp.cs)
