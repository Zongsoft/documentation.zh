---
description: Zongsoft.Expressions 命名空间及其子命名空间的职责。
icon: code
---

# Zongsoft.Expressions

`Zongsoft.Expressions` 提供表达式求值和词法分析基础能力，用于解析轻量表达式、标识符、字面量、关键字和操作符。

## 主要职责

* 定义表达式求值器接口、选项和基础实现。
* 提供词法分析器和多种 tokenizer。
* 支持布尔、空值、数值、字符串、标识符、关键字和操作符 token。
* 为条件表达式、配置表达式或命令表达式提供底层解析能力。

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Expressions.Tokenization` | 词法分析、token、tokenizer 和词法状态。 |

## 相关资源

* [Expressions 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Expressions)
