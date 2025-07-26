---
title: Solr 入门教程指南
category:
  - 中间件
tag:
  - Solr
---

# Solr 入门教程指南

## 1. 什么是 Solr？

Apache Solr 是一个基于 Apache Lucene 构建的开源企业级搜索平台。它提供了强大的全文搜索、实时索引、数据库集成、丰富的文档处理能力以及高可用性的分布式搜索和索引复制功能。

### 主要特性
- **全文搜索**：支持复杂的查询语法和搜索功能
- **实时索引**：支持近实时的文档索引和搜索
- **分布式搜索**：支持集群部署和水平扩展
- **多种数据格式**：支持 JSON、XML、CSV 等多种数据格式
- **管理界面**：提供直观的 Web 管理界面
- **RESTful API**：通过 HTTP API 进行所有操作

## 2. 安装和配置

### 系统要求
- Java 8 或更高版本
- 至少 512MB 内存
- 足够的磁盘空间用于索引数据

### 下载和安装

[Solr 安装和启动完整指南](./solr-install.md)


## 3. 核心概念

### Core（核心）
Core 是 Solr 中的基本单位，类似于数据库中的表。每个 Core 包含：
- **索引**：存储和搜索的数据
- **配置文件**：定义字段类型、搜索行为等
- **Schema**：定义文档结构和字段属性

### Document（文档）
Document 是 Solr 中数据的基本单位，类似于数据库中的记录。每个文档由多个字段组成。

### Field（字段）
Field 是文档中的属性，每个字段都有特定的类型（如文本、数字、日期等）。

### Schema
Schema 定义了文档的结构，包括字段类型、字段属性（是否索引、是否存储等）。

## 4. 创建第一个 Core

### 使用命令行创建
```bash
# 创建一个名为 "books" 的 core
bin/solr create -c books

# 创建 core 时指定配置集
bin/solr create -c books -d _default
```

### 通过管理界面创建
1. 访问 `http://localhost:8983/solr`
2. 点击 "Core Admin"
3. 点击 "Add Core"
4. 填写 Core 名称和相关配置

## 5. 配置 Schema

Schema 定义在 `managed-schema` 文件中，位于 `server/solr/[core-name]/conf/` 目录。

### 基本字段类型
```xml
<!-- 文本字段 -->
<field name="title" type="text_general" indexed="true" stored="true"/>

<!-- 字符串字段（不分析） -->
<field name="id" type="string" indexed="true" stored="true" required="true"/>

<!-- 数字字段 -->
<field name="price" type="pfloat" indexed="true" stored="true"/>

<!-- 日期字段 -->
<field name="publish_date" type="pdate" indexed="true" stored="true"/>

<!-- 多值字段 -->
<field name="categories" type="text_general" indexed="true" stored="true" multiValued="true"/>
```

### 字段属性说明
- **indexed**：是否建立索引，用于搜索
- **stored**：是否存储原始值，用于返回结果
- **required**：是否为必填字段
- **multiValued**：是否支持多个值

### 动态字段
```xml
<!-- 动态字段，匹配所有以 _s 结尾的字段名 -->
<dynamicField name="*_s" type="string" indexed="true" stored="true"/>
<dynamicField name="*_i" type="pint" indexed="true" stored="true"/>
<dynamicField name="*_f" type="pfloat" indexed="true" stored="true"/>
```

## 6. 索引数据

### 使用 JSON 格式索引

1. **单个文档**
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     'http://localhost:8983/solr/books/update/json/docs' \
     --data-binary '
   {
     "id": "1",
     "title": "Java编程思想",
     "author": "Bruce Eckel",
     "price": 89.0,
     "categories": ["编程", "Java"],
     "publish_date": "2007-06-01T00:00:00Z"
   }'
   ```

2. **批量文档**
   ```bash
   curl -X POST -H 'Content-Type: application/json' \
     'http://localhost:8983/solr/books/update' \
     --data-binary '
   [
     {
       "id": "2",
       "title": "Spring实战",
       "author": "Craig Walls",
       "price": 79.0,
       "categories": ["编程", "Spring"]
     },
     {
       "id": "3",
       "title": "MySQL必知必会",
       "author": "Ben Forta",
       "price": 59.0,
       "categories": ["数据库", "MySQL"]
     }
   ]'
   ```

3. **提交更改**
   ```bash
   curl http://localhost:8983/solr/books/update?commit=true
   ```

### 使用 XML 格式索引
```bash
curl -X POST -H 'Content-Type: application/xml' \
  'http://localhost:8983/solr/books/update' \
  --data-binary '
<add>
  <doc>
    <field name="id">4</field>
    <field name="title">Python核心编程</field>
    <field name="author">Wesley Chun</field>
    <field name="price">99.0</field>
    <field name="categories">编程</field>
    <field name="categories">Python</field>
  </doc>
</add>'
```

### 使用 CSV 格式索引
```bash
curl -X POST -H 'Content-Type: application/csv' \
  'http://localhost:8983/solr/books/update/csv?commit=true&header=true' \
  --data-binary '
id,title,author,price
5,"设计模式","GoF",69.0
6,"算法导论","CLRS",128.0
'
```

## 7. 搜索查询

### 基本查询语法

1. **简单查询**
   ```
   # 搜索标题中包含 "Java" 的文档
   http://localhost:8983/solr/books/select?q=title:Java

   # 搜索所有字段中包含 "编程" 的文档
   http://localhost:8983/solr/books/select?q=编程

   # 搜索所有文档
   http://localhost:8983/solr/books/select?q=*:*
   ```

2. **字段查询**
   ```
   # 指定字段查询
   q=title:Java
   q=author:Bruce
   q=price:89.0

   # 多字段查询
   q=title:Java AND author:Bruce
   q=title:Java OR title:Spring
   ```

3. **范围查询**
   ```
   # 价格范围查询
   q=price:[50 TO 100]
   q=price:{50 TO 100}  # 排除边界值

   # 日期范围查询
   q=publish_date:[2020-01-01T00:00:00Z TO NOW]
   ```

### 查询参数

1. **基本参数**
   - `q`：查询语句
   - `fl`：返回字段列表
   - `rows`：返回结果数量
   - `start`：结果偏移量（分页）
   - `sort`：排序字段

   ```
   http://localhost:8983/solr/books/select?
     q=*:*&
     fl=id,title,price&
     rows=10&
     start=0&
     sort=price desc
   ```

2. **过滤查询（fq）**
   ```
   # 过滤价格大于50的结果
   http://localhost:8983/solr/books/select?
     q=*:*&
     fq=price:[50 TO *]&
     fq=categories:编程
   ```

### 高级搜索功能

1. **模糊查询**
   ```
   # 模糊匹配
   q=title:Jav~
   
   # 通配符查询
   q=title:Jav*
   q=title:*编程
   ```

2. **短语查询**
   ```
   # 精确短语
   q=title:"Java编程"
   
   # 邻近查询（词距离在2以内）
   q=title:"Java 思想"~2
   ```

3. **布尔查询**
   ```
   q=title:Java AND price:[50 TO 100]
   q=title:Java OR title:Python
   q=title:Java NOT author:Bruce
   ```

## 8. 管理界面使用

### Query 界面
在 Solr 管理界面的 "Query" 选项卡中，您可以：
- 输入查询语句
- 设置查询参数
- 查看查询结果
- 分析查询执行计划

### Documents 界面
用于添加、更新和删除文档：
- 选择文档格式（JSON、XML、CSV等）
- 输入文档内容
- 执行索引操作

### Schema 界面
管理字段和字段类型：
- 添加新字段
- 修改字段属性
- 管理动态字段
- 复制字段设置

## 9. 实用技巧

### 性能优化
1. **合理设置字段属性**
   - 只对需要搜索的字段设置 `indexed="true"`
   - 只对需要返回的字段设置 `stored="true"`

2. **使用过滤查询**
   - 使用 `fq` 参数进行过滤，可以被缓存

3. **优化提交策略**
   - 批量索引时减少提交频率
   - 使用软提交和硬提交

### 常用命令

```bash
# 检查 Solr 状态
bin/solr status

# 重启 Solr
bin/solr restart

# 删除 core
bin/solr delete -c core_name

# 备份数据
curl 'http://localhost:8983/solr/books/replication?command=backup'

# 删除所有文档
curl -X POST -H 'Content-Type: application/json' \
  'http://localhost:8983/solr/books/update?commit=true' \
  --data-binary '{"delete":{"query":"*:*"}}'
```

### 故障排除

1. **查看日志**
   ```bash
   tail -f server/logs/solr.log
   ```

2. **检查配置**
   - 确认 Java 版本
   - 检查端口占用
   - 验证配置文件语法

3. **常见问题**
   - 内存不足：增加 JVM 堆内存
   - 端口冲突：更改默认端口
   - 权限问题：检查文件权限

## 10. 下一步学习

掌握了基础知识后，您可以继续学习：

- **SolrCloud**：分布式搜索和高可用性
- **自定义分析器**：处理特定语言或格式的文本
- **数据导入处理器（DIH）**：从数据库导入数据
- **Suggester**：自动完成和建议功能
- **Faceting**：分面搜索和聚合统计
- **空间搜索**：地理位置相关的搜索功能

## 总结

Solr 是一个功能强大的搜索平台，通过本教程您已经了解了：
- Solr 的安装和基本配置
- Core 和 Schema 的概念
- 如何索引和搜索数据
- 管理界面的使用
- 基本的优化技巧

## 参考资料

- **solr官网教程**：https://lucene.apache.org/solr/guide/7_4/solr-tutorial.html
- **Tutorialspoint**：
  - https://www.tutorialspoint.com/apache_solr/index.htm
  - [pdf](https://www.tutorialspoint.com/apache_solr/apache_solr_tutorial.pdf)

