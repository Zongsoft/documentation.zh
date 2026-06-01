---
description: Zongsoft 文档中的常见术语。
icon: book
---

# 术语表

## 宿主

负责启动应用并承载插件的程序。Zongsoft 当前提供终端、后台服务和 Web 三类宿主。

## 插件

通过 `*.plugin` 描述并由插件框架加载的模块单元。插件通常包含程序集、配置、映射和资源。

## 部署

把插件和附属文件复制到宿主目录的过程。通常由 `dotnet-deploy` 和 `.deploy` 文件完成。

## 选项配置

以 `.option` 文件表达的模块配置。配置可以按环境、站点和部署方案拆分。

## 数据映射

以 `.mapping` 文件表达的实体、表、字段和关系元数据。

## 数据模式

Zongsoft.Data 中用于描述查询或写入数据形状的 DSL。

## 站点

Web 宿主中的应用划分方式，例如 `default`、`administration`、`business`、`gateway` 等。
