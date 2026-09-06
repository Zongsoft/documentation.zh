---
description: Zongsoft.Common 命名空间的职责和主要类型。
icon: wrench
---

# Zongsoft.Common

`Zongsoft.Common` 放置[核心类库](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core)中最通用的工具类型和扩展方法，包括类型转换、随机、校验、序列、时间、字符串、URI 和类型别名等基础能力。

## 主要职责

* 提供增强版 `Convert`、`Randomizer`、`EnumUtility` 等常用工具。
* 提供字符串、数组、日期时间、类型、URI 等扩展方法。
* 提供校验码、顺序号、别名集合、位向量和注解工具。
* 为上层模块减少对重复小工具类的散落依赖。

## 类型

<table data-view="cards">
	<thead>
		<tr>
			<th></th>
			<th></th>
			<th data-hidden data-card-target data-type="content-ref">页面</th>
		</tr>
	</thead>
	<tbody>
		<tr><td><strong>AggregateExceptionUtility</strong></td><td>聚合异常中的特定异常处理。</td><td><a href="common/aggregate-exception-utility.md">aggregate-exception-utility.md</a></td></tr>
		<tr><td><strong>AnnotationUtility</strong></td><td>读取成员分类、显示名称和描述注解。</td><td><a href="common/annotation-utility.md">annotation-utility.md</a></td></tr>
		<tr><td><strong>BitVector</strong></td><td>32 位和 64 位位标记。</td><td><a href="common/bit-vector.md">bit-vector.md</a></td></tr>
		<tr><td><strong>Buffer</strong></td><td>内存租赁、编码解码和二进制读取。</td><td><a href="common/buffer.md">buffer.md</a></td></tr>
		<tr><td><strong>Checksum</strong></td><td>哈希校验值计算、解析和验证。</td><td><a href="common/checksum.md">checksum.md</a></td></tr>
		<tr><td><strong>Convert</strong></td><td>类型转换和十六进制转换。</td><td><a href="common/convert.md">convert.md</a></td></tr>
		<tr><td><strong>EnumUtility</strong></td><td>枚举项元数据、别名和描述。</td><td><a href="common/enum-utility.md">enum-utility.md</a></td></tr>
		<tr><td><strong>HierarchyVector32</strong></td><td>四级层级编码和父子关系判断。</td><td><a href="common/hierarchy-vector32.md">hierarchy-vector32.md</a></td></tr>
		<tr><td><strong>Locker</strong></td><td>同步和异步互斥锁。</td><td><a href="common/locker.md">locker.md</a></td></tr>
		<tr><td><strong>Notification</strong></td><td>变更令牌和立即失效令牌。</td><td><a href="common/notification.md">notification.md</a></td></tr>
		<tr><td><strong>OperationException</strong></td><td>带原因码的操作异常。</td><td><a href="common/operation-exception.md">operation-exception.md</a></td></tr>
		<tr><td><strong>Predication</strong></td><td>异步条件断言、断言基类和组合集合。</td><td><a href="common/predication.md">predication.md</a></td></tr>
		<tr><td><strong>Randomizer</strong></td><td>随机字节、数字和字符串生成。</td><td><a href="common/randomizer.md">randomizer.md</a></td></tr>
		<tr><td><strong>Sequence</strong></td><td>序列号接口和号段增长器。</td><td><a href="common/sequence.md">sequence.md</a></td></tr>
		<tr><td><strong>Timer</strong></td><td>周期任务计时器。</td><td><a href="common/timer.md">timer.md</a></td></tr>
		<tr><td><strong>Timestamp</strong></td><td>时间戳转换。</td><td><a href="common/timestamp.md">timestamp.md</a></td></tr>
		<tr><td><strong>TypeAlias</strong></td><td>类型别名解析和生成。</td><td><a href="common/type-alias.md">type-alias.md</a></td></tr>
		<tr><td><strong>Validator</strong></td><td>同步和异步数据有效性验证接口。</td><td><a href="common/validator.md">validator.md</a></td></tr>
		<tr><td><strong>常用扩展</strong></td><td>数组、字符串、时间、类型和 URI 扩展。</td><td><a href="common/extensions.md">extensions.md</a></td></tr>
	</tbody>
</table>

## 相关资源

* [Common 源码目录](https://github.com/Zongsoft/framework/tree/main/Zongsoft.Core/src/Common)
