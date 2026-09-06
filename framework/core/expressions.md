---
description: Zongsoft.Expressions 的表达式求值抽象、词法分析器、token 模型和 tokenizer 扩展方式。
icon: code
---

# Zongsoft.Expressions

`Zongsoft.Expressions` 提供表达式求值抽象和词法分析基础设施。它把一段表达式文本先切分成常量、标识符、关键字和符号 token，再交给具体表达式求值器或上层解析器解释语义。

这个命名空间更像“表达式基础层”，而不是某一种固定语法的完整脚本引擎。框架中的条件表达式、配置表达式、命令参数表达式和部分数据查询表达式，都可以在这套基础层之上定义自己的关键字、操作符和求值规则。

{% hint style="info" %}
`Lexer` 只负责词法切分，不负责判断 `1 + 2` 应该如何计算，也不负责处理操作符优先级。算术、条件、成员访问或数据库表达式语义，需要由调用方或具体 `IExpressionEvaluator` 实现完成。
{% endhint %}

## 主要职责

* 定义表达式求值器接口、基础类和运行选项。
* 提供可复用的词法分析器 `Lexer` 和扫描器 `TokenScanner`。
* 把表达式文本切分为 `TokenType.Constant`、`TokenType.Identifier`、`TokenType.Symbol` 和 `TokenType.Keyword`。
* 内置空值、布尔值、数字、字符串、标识符和符号 tokenizer。
* 支持调用方追加或调整 tokenizer，以识别领域关键字和自定义符号。
* 为插件配置、命令解释、条件解析、数据表达式和轻量脚本求值提供底层能力。

## 核心类型

| 类型 | 作用 | 常见用法 |
| --- | --- | --- |
| [`IExpressionEvaluator`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/IExpressionEvaluator.cs) | 表达式求值器契约。 | 按表达式文本、选项和变量集合返回求值结果。 |
| [`ExpressionEvaluatorBase`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/ExpressionEvaluatorBase.cs) | 求值器基类。 | 统一名称匹配、默认选项、全局变量和释放逻辑。 |
| [`ExpressionEvaluatorOptions`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/ExpressionEvaluatorOptions.cs) | 求值运行选项。 | 指定输入、输出、错误输出和扩展属性。 |
| [`Lexer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/Lexer.cs) | 词法分析入口。 | 从字符串或流创建 `TokenScanner`。 |
| [`TokenScanner`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/TokenScanner.cs) | token 扫描器。 | 逐个扫描 token，或作为集合枚举所有 token。 |
| [`ITokenizer`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/ITokenizer.cs) | 分词器接口。 | 为新的字面量、关键字或领域符号提供识别逻辑。 |
| [`Token`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/Token.cs) | token 对象。 | 携带 token 类型和值。 |
| [`SymbolToken`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/SymbolToken.cs) | 符号 token。 | 表示 `+`、`==`、`&&`、`??`、括号等内置符号。 |
| [`SyntaxException`](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/src/Expressions/SyntaxException.cs) | 语法异常。 | 分词过程中遇到非法字符或不完整字面量时抛出。 |

## 词法分析流程

`Lexer` 维护一个 tokenizer 列表。`TokenScanner.Scan()` 每次扫描时会先跳过空白字符，然后按列表顺序尝试每个 tokenizer；第一个返回有效 token 的 tokenizer 决定当前位置的识别结果。如果所有 tokenizer 都无法识别当前字符，而输入尚未结束，则抛出 `SyntaxException`。

默认 `Lexer` 的 tokenizer 顺序如下：

| 顺序 | tokenizer | 识别内容 |
| --- | --- | --- |
| 1 | `NullTokenizer` | `null`，忽略大小写。 |
| 2 | `NumberTokenizer` | 整数、小数，以及 `L`、`F`、`D`、`M` 数字后缀。 |
| 3 | `StringTokenizer` | 单引号或双引号字符串。 |
| 4 | `BooleanTokenizer` | `true`、`false`，忽略大小写。 |
| 5 | `IdentifierTokenizer` | 以字母或 `_` 开头，后续为字母、数字或 `_` 的标识符。 |
| 6 | `SymbolTokenizer` | 内置符号 token。 |

来源：[framework/Zongsoft.Core/test/Expressions/LexerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Expressions/LexerTest.cs#L15)（节选；上下文见源文件）。

{% code title="LexerTest.cs" %}
```csharp
const string EXPRESSION = @"1+2f	_abc123'text\'suffix'	-30L*4.5 / 5.5m (true || FALSE?yes:no)null??nothing";

var scanner = Lexer.Instance.GetScanner(EXPRESSION);
Assert.NotNull(scanner);

var token = scanner.Scan();
Assert.NotNull(token);
Assert.Equal(TokenType.Constant, token.Type);
Assert.IsType<int>(token.Value);
Assert.Equal(1, (int)token.Value);

token = scanner.Scan();
Assert.NotNull(token);
Assert.Equal(SymbolToken.Plus, token);

token = scanner.Scan();
Assert.NotNull(token);
Assert.Equal(TokenType.Constant, token.Type);
Assert.IsType<float>(token.Value);
Assert.Equal(2.0f, (float)token.Value);
```
{% endcode %}

Discussions 没有自行构造词法器；上面的 Core 测试依次断言整数常量 1、加号和单精度常量 2。完整测试继续覆盖标识符、字符串、负号和其他运算符。后续它是普通条件、数据查询条件还是命令参数条件，取决于调用方如何解释这些 token。

## Token 规则

内置 token 大致分为四类：

| token 类型 | 示例 | 说明 |
| --- | --- | --- |
| `Constant` | `null`、`true`、`30L`、`4.5`、`5.5m`、`'text'` | 字面量常量，`Token.Value` 会保存解析后的 .NET 值。 |
| `Identifier` | `Name`、`_abc123`、`Field1` | 变量名、字段名、参数名、方法名或调用方定义的标识。 |
| `Symbol` | `+`、`-`、`*`、`/`、`==`、`&&`、`??`、`(`、`)`、`[`、`]` | 内置操作符或分隔符。 |
| `Keyword` | `in`、`between` | 由调用方显式加入 `KeywordTokenizer` 后才会出现。 |

数字字面量从数字开始：不带小数点时默认解析为 `int`，包含小数点时默认解析为 `double`；后缀 `L` 表示 `long`，`F` 表示 `float`，`D` 表示 `double`，`M` 表示 `decimal`。数字不能以小数点结尾，也不能包含多个小数点。

字符串可以使用单引号或双引号包裹，并支持常见转义：`\\`、`\'`、`\"`、`\s`、`\t`、`\n`、`\r`。字符串字面量不能跨行，缺少结束引号时会抛出 `SyntaxException`。

内置符号覆盖常见运算和分隔场景：

| 类别 | 符号 |
| --- | --- |
| 算术 | `+`、`-`、`*`、`/`、`%` |
| 逻辑与比较 | `!`、`&&`、`||`、`==`、`!=`、`<`、`<=`、`>`、`>=` |
| 空值与条件 | `??`、`?`、`:` |
| 访问与分隔 | `.`、`,`、`;`、`|` |
| 括号 | `(`、`)`、`[`、`]`、`{`、`}` |

{% hint style="warning" %}
数字负号不是数字字面量的一部分。表达式 `-30L` 会被扫描为符号 `-` 和常量 `30L`，是否把它解释为负数由后续语法解析或求值阶段决定。
{% endhint %}

## 关键字与自定义 tokenizer

默认词法器没有启用业务关键字，因此 `in`、`between` 这类文本会先被识别为标识符。需要领域关键字时，可以创建新的 `Lexer` 实例，并把 `KeywordTokenizer` 放在 `IdentifierTokenizer` 之前。

来源：[framework/Zongsoft.Core/test/Expressions/LexerTest.cs](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Expressions/LexerTest.cs#L139)（节选；上下文见源文件）。

{% code title="LexerTest.cs" %}
```csharp
const string EXPRESSION = @"Field1 == 100 && Field2<1.23f && Field3 >=10.5m && (PI between ""3.1415926~3.1415927"" || Number IN [10,20,30] )";

var lexer = new Lexer();
lexer.Tokenizers.Insert(0, new KeywordTokenizer(true, "in", "Between"));

var scanner = lexer.GetScanner(EXPRESSION);
Assert.NotNull(scanner);

var token = scanner.Scan();
Assert.NotNull(token);
Assert.Equal(TokenType.Identifier, token.Type);
Assert.Equal("Field1", token.Value);
```
{% endcode %}

`KeywordTokenizer(true, ...)` 表示忽略大小写，因此 `IN`、`in` 和 `In` 都可以被识别为同一个关键字 token。关键字识别后仍只产生 token，不会自动实现集合包含、范围匹配或 SQL 翻译；这些语义应由后续解析器或求值器处理。

自定义 tokenizer 适合这些场景：

* 需要识别领域关键字，例如 `between`、`like`、`contains`。
* 需要把某类字面量直接转换为特定值，例如日期、时间段、枚举名或变量占位符。
* 需要限制可用符号，或为某个 DSL 增加专用符号。

实现自定义 tokenizer 时应遵守一个原则：只在当前位置能完整识别时返回 token；不能识别时返回失败结果，并把读取器偏移量恢复到尝试前的位置。这样后续 tokenizer 才能继续判断同一段文本。

## 表达式求值器

`IExpressionEvaluator` 定义了表达式求值的公共形状。调用方传入表达式文本、可选变量集合和可选运行选项，求值器返回一个对象结果。

来源：[framework/externals/python/test/PythonExpressionEvaluatorTest.cs](https://github.com/Zongsoft/framework/blob/main/externals/python/test/PythonExpressionEvaluatorTest.cs#L14)（节选；上下文见源文件）。

{% code title="PythonExpressionEvaluatorTest.cs" %}
```csharp
public void TestEvaluate1()
{
	var evaluator = new PythonExpressionEvaluator();
	var variables = new Dictionary<string, object>();

	var result = evaluator.Evaluate("1+2", null);
	Assert.NotNull(result);
	Assert.Equal(3, Zongsoft.Common.Convert.ConvertValue<int>(result));

	variables["subtract"] = (Delegate)Subtract;
	result = evaluator.Evaluate("subtract(100, 20)", variables);
	Assert.NotNull(result);
	Assert.Equal(80, Zongsoft.Common.Convert.ConvertValue<int>(result));

	evaluator.Evaluate("a=1;b=2;result=a+b;", variables);
	Assert.NotEmpty(variables);
	Assert.True(variables.TryGetValue("result", out result));
	Assert.Equal(3, Zongsoft.Common.Convert.ConvertValue<int>(result));
}
```
{% endcode %}

上面是 Python 插件的实际测试，Subtract 为同一测试类中的静态方法，变量字典还接收脚本写回的 result。求值器通常由具体模块实现自己的语法和语义。`ExpressionEvaluatorBase` 提供这些通用能力：

* `Name` 表示求值器名称。
* 实现服务匹配接口，可以按名称忽略大小写查找求值器。
* `Global` 保存求值器级全局变量。
* `Options` 保存默认输入、输出、错误输出和扩展属性。
* `Dispose()` 释放时会清理全局变量。

`ExpressionEvaluatorOptions` 默认使用 `Console.In`、`Console.Out` 和 `Console.Error`，也可以通过静态方法或扩展方法替换输入输出。

来源：[framework/externals/python/test/PythonExpressionEvaluatorTest.cs](https://github.com/Zongsoft/framework/blob/main/externals/python/test/PythonExpressionEvaluatorTest.cs#L98)（节选；上下文见源文件）。

{% code title="PythonExpressionEvaluatorTest.cs" %}
```csharp
public void TestEvaluateOutputDoesNotLeakAcrossCallsOrEvaluators()
{
	const string PRINT_MESSAGE = "First evaluator output";
	using var evaluator = new PythonExpressionEvaluator();

	using(var output = new StringWriter())
	{
		evaluator.Evaluate($"print('{PRINT_MESSAGE}')", ExpressionEvaluatorOptions.Out(output));
		Assert.Equal(PRINT_MESSAGE, output.ToString());
	}

	var result = evaluator.Evaluate("print('Subsequent call output'); result=41");
	Assert.Equal(41, Zongsoft.Common.Convert.ConvertValue<int>(result));

	using var subsequentEvaluator = new PythonExpressionEvaluator();
	result = subsequentEvaluator.Evaluate("print('Second evaluator output'); result=42");

	Assert.Equal(42, Zongsoft.Common.Convert.ConvertValue<int>(result));
}
```
{% endcode %}

输出隔离测试先释放首轮输出对象，再执行下一次调用和另一个求值器调用，用于验证输出流恢复。它不证明多个调用并发时共享运行时完全隔离；更多边界见脚本专题。

如果应用中注册了多个 `IExpressionEvaluator` 实现，可以结合服务模型按名称选择。例如 `ExpressionEvaluatorBase` 已经支持忽略大小写匹配，因此调用方可以通过服务发现机制查找某个命名求值器。

现有语言实现的注册名是 Lua、Python 和 Scriban。选择方式、部署和语法差异见[脚本与表达式](../externals/scripting.md)。Discussions 未注册 JavaScript 求值器，不能把名称查找成功视为任意语言都已经可用。

## 使用建议

把 `Lexer` 用在“需要先理解文本结构”的边界层：例如解析配置值、命令参数、查询条件、筛选规则或轻量表达式。对于固定格式并且语义很简单的文本，普通字符串处理可能更直接；对于需要变量、括号、操作符和字面量组合的场景，词法分析能让后续解析更清晰。

为领域语法添加关键字时，尽量用新的 `Lexer` 实例，不要直接修改全局 `Lexer.Instance`。全局实例适合作为默认通用词法器；领域语法通常应该拥有自己的 tokenizer 顺序，避免影响其他模块。

来自用户输入的表达式应限制语法范围，并在求值前做白名单校验。词法器可以告诉你文本被切成了哪些 token，但不会自动判断某个标识符、方法名、字段名或操作符是否允许暴露给外部用户。

{% hint style="warning" %}
不要把 tokenization 结果直接拼接成 SQL、脚本或命令文本。需要生成数据库查询或命令时，应在解析阶段构建明确的语法树或操作模型，再由对应驱动处理参数化和转义。
{% endhint %}

## 子命名空间

| 命名空间 | 说明 |
| --- | --- |
| `Zongsoft.Expressions.Tokenization` | 内置 tokenizer、字面量 tokenizer 基类和关键字、字符串、数字、布尔、空值、标识符、符号分词器。 |

## 相关资源

* [Expressions 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Expressions)
* [Tokenization 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Expressions/Tokenization)
* [Lexer 测试](https://github.com/Zongsoft/framework/blob/main/Zongsoft.Core/test/Expressions/LexerTest.cs)
* [服务发现](services.md#根据参数查找)
* [数据引擎条件与操作元](../data/conditions-and-operands.md)
