---
title: Lucene
category:
  - 中间件
  - 检索引擎
tag:
  - Lucene
---

## Lucene 简介

Lucene是apache软件基金会4 jakarta项目组的一个子项目，是一个开放源代码的全文检索引擎工具包，但它不是一个完整的全文检索引擎，而是一个全文检索引擎的架构，提供了完整的查询引擎和索引引擎，部分文本分析引擎（英文与德文两种西方语言）。Apache Lucene set the standard for search and indexing performance. Lucene is the search core of both Apache Solr™ and Elasticsearch™。

## 核心特点

### 1. 技术架构优势
Lucene的目的是为软件开发人员提供一个简单易用的工具包，以方便的在目标系统中实现全文检索的功能，或者是以此为基础建立起完整的全文检索引擎。

### 2. 突出优点
根据文章内容，Lucene具有以下突出优势：

- **平台独立性**：索引文件格式独立于应用平台。Lucene定义了一套以8位字节为基础的索引文件格式，使得兼容系统或者不同平台的应用能够共享建立的索引文件

- **高效索引**：在传统全文检索引擎的倒排索引的基础上，实现了分块索引，能够针对新的文件建立小文件索引，提升索引速度

- **优秀架构**：优秀的面向对象的系统架构，使得对于Lucene扩展的学习难度降低，方便扩充新功能

- **灵活扩展**：设计了独立于语言和文件格式的文本分析接口，索引器通过接受Token流完成索引文件的创立，用户扩展新的语言和文件格式，只需要实现文本分析的接口

- **强大查询**：已经默认实现了一套强大的查询引擎，用户无需自己编写代码即可使系统可获得强大的查询能力，Lucene的查询实现中默认实现了布尔操作、模糊查询（Fuzzy Search）、分组查询等等

## 工作原理

基于搜索引擎理论，Lucene的工作流程包括：

### 索引构建阶段
1. **文档收集**：收集需要索引的文档
2. **文档分析**：蜘蛛抓取的页面文件分解、分析，并以巨大表格的形式存入数据库，这个过程即是索引（index)
3. **倒排索引构建**：搜索引擎的核心数据结构为倒排文件（也称倒排索引），倒排索引是指用记录的非主属性值(也叫副键)来查找记录而组织的文件叫倒排文件

### 搜索查询阶段  
1. **查询处理**：用户在搜索引擎界面输入关键词，单击"搜索"按钮后，搜索引擎程序即对搜索词进行处理，如中文特有的分词处理，去除停止词
2. **结果排序**：对搜索词处理后，搜索引擎程序便开始工作，从索引数据库中找出所有包含搜索词的网页，并且根据排名算法计算出哪些网页应该排在前面

## 应用场景

Our core algorithms along with the Solr search server power applications the world over, ranging from mobile devices to sites like Twitter, Apple and Wikipedia。apache软件基金会的网站使用了Lucene作为全文检索的引擎，IBM的开源软件eclipse的2.1版本中也采用了Lucene作为帮助子系统的全文索引引擎。

## 官方参考文档

### 主要官方资源：

1. **Apache Lucene 官网**：https://lucene.apache.org/
2. **核心文档**：https://lucene.apache.org/core/documentation.html
3. **GitHub 源码**：https://github.com/apache/lucene
4. **API 文档**：https://lucene.apache.org/core/10_2_2/index.html (最新版本)
5. **历史版本文档**：https://lucene.apache.org/core/6_5_1/index.html (6.5.1版本示例)
6. **Lucene 3.0 原理与代码分析完整版**

链接: https://pan.baidu.com/s/1kN5sUUf07XcO2Nv1GzxemQ 密码: haxp


### 开发资源：
- **下载地址**：http://archive.apache.org/dist/lucene/java/
- **许可证**：Apache Software License 2.0
- **系统要求**：JDK 1.7+ (4.8版本开始)

Lucene作为一个成熟的开源全文检索库，为现代搜索应用提供了强大的基础架构支持，是构建企业级搜索解决方案的理想选择。