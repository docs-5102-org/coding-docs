---
title: Elasticsearch面试集锦
category:
  - 面试题
tag:
  - Elasticsearch
  - es
order: 1
date: 2025-11-28
---

# Elasticsearch 高频面试题

---

## 一、基础概念

### 1. ES 是什么？适合哪些场景？

Elasticsearch 是一个基于 Lucene 的分布式全文搜索引擎，支持近实时搜索和分析。

适合场景：
- 全文搜索（电商商品搜索、内容检索）
- 日志分析（ELK Stack）
- 时序数据分析
- 地理位置搜索

不适合场景：
- 强事务需求（金融转账）
- 频繁更新的关系型数据

---

### 2. ES 的核心概念和关系型数据库的对比

| ES 概念 | 关系型数据库 | 说明 |
|---|---|---|
| Index（索引） | Table（表） | 存储同类文档的容器 |
| Document（文档） | Row（行） | 一条数据记录，JSON 格式 |
| Field（字段） | Column（列） | 文档中的一个属性 |
| Mapping（映射） | Schema（表结构） | 定义字段类型 |
| Shard（分片） | 无 | 数据水平分割单元 |

> ES 7.x 之后移除了 Type 的概念，一个索引只对应一类文档。

---

### 3. 什么是分片（Shard）和副本（Replica）？

**主分片（Primary Shard）**：索引数据被水平切分为多个分片，每个分片是一个独立的 Lucene 实例。分片数在创建索引时确定，之后不能修改。

**副本分片（Replica Shard）**：主分片的拷贝，用于容灾和提升读性能。副本数可以动态修改。

```json
PUT /my_index
{
  "settings": {
    "number_of_shards": 3,    // 主分片数，创建后不可改
    "number_of_replicas": 1   // 副本数，可动态调整
  }
}
```

**面试要点**：
- 分片过多会增加管理开销，过少会导致扩容困难
- 单个分片建议大小控制在 10GB～50GB
- 副本分片不能和主分片分配在同一个节点上

---

### 4. 近实时搜索（NRT）是怎么实现的？

ES 写入数据后默认 **1 秒**后才能被搜索到，这就是"近实时"。

原因在于 ES 的写入流程：

```
写入请求
   ↓
写入 Memory Buffer（内存缓冲区）
   ↓  每隔 1s refresh 一次
写入 File System Cache（文件系统缓存）← 此时可被搜索
   ↓  每隔 30min 或手动 flush
写入磁盘（Segment 文件）
```

可以手动触发 refresh：
```json
POST /my_index/_refresh
```

或者调整 refresh 间隔：
```json
PUT /my_index/_settings
{
  "index.refresh_interval": "5s"
}
```

---

## 二、写入与查询原理

### 5. ES 的写入流程是什么？

1. 客户端发请求到任意节点，该节点成为**协调节点**
2. 协调节点根据文档 `_id` 计算目标主分片：`shard = hash(_id) % number_of_shards`
3. 请求转发到对应主分片所在节点
4. 主分片写入成功后，并行同步到所有副本分片
5. 所有副本确认后，返回成功给客户端

---

### 6. ES 的查询流程是什么？

分为两个阶段：

**Query 阶段（散发）**
- 协调节点将请求广播到所有相关分片（主或副本）
- 每个分片在本地执行查询，返回 top N 的文档 ID 和评分

**Fetch 阶段（聚合）**
- 协调节点汇总所有分片的结果，全局排序，确定最终 top N
- 根据文档 ID 去对应分片拉取完整文档内容
- 返回给客户端

> 这就是为什么深翻页（from + size）性能差：每个分片都要返回 from + size 条，协调节点再做全局合并。

---

### 7. text 和 keyword 的区别？

| | text | keyword |
|---|---|---|
| 是否分词 | ✅ 会分词 | ❌ 不分词 |
| 适合场景 | 全文搜索（文章标题、描述） | 精确匹配、过滤、聚合、排序 |
| 能否聚合 | ❌ | ✅ |
| 查询方式 | match | term / terms |

实际项目中，经常同时需要两种能力，用 multi-field 解决：

```json
"title": {
  "type": "text",
  "fields": {
    "keyword": { "type": "keyword" }
  }
}
```

- `title` 用于全文搜索
- `title.keyword` 用于聚合和精确匹配

---

### 8. match 和 term 的区别？

**match**：会对查询词做分词处理，再去倒排索引匹配，适合全文搜索。

```json
{ "match": { "title": "苹果手机" } }
// 会分词为 "苹果" "手机" 分别匹配
```

**term**：不分词，精确匹配倒排索引中的词项，适合 keyword 字段。

```json
{ "term": { "status.keyword": "published" } }
```

**常见踩坑**：用 `term` 查询 `text` 类型字段，因为 `text` 存的是分词后的词项，直接用原始值匹配会返回空结果。

---

### 9. bool 查询有哪几种子句？

| 子句 | 作用 | 是否影响评分 |
|---|---|---|
| must | 必须匹配，等同于 AND | ✅ 影响 |
| should | 至少匹配一个，等同于 OR | ✅ 影响 |
| must_not | 必须不匹配，等同于 NOT | ❌ 不影响 |
| filter | 必须匹配，但不计算评分 | ❌ 不影响 |

**性能建议**：纯过滤场景（不需要相关性排序）用 `filter` 代替 `must`，因为 `filter` 有缓存机制，性能更好。

```json
{
  "query": {
    "bool": {
      "must": [{ "match": { "title": "手机" } }],
      "filter": [{ "term": { "status.keyword": "on_sale" } }]
    }
  }
}
```

---

## 三、性能优化

### 10. 深翻页问题怎么解决？

`from + size` 深翻页性能差，每个分片都要取 `from + size` 条数据再合并。

**解决方案一：search_after（推荐）**

游标式翻页，每次用上一页最后一条的排序值作为起点：

```json
GET /my_index/_search
{
  "size": 10,
  "sort": [{ "created_at": "desc" }, { "_id": "asc" }],
  "search_after": ["2024-01-15", "abc123"]
}
```

适合：顺序翻页、实时数据

**解决方案二：scroll API**

快照式翻页，创建时固定数据集：

```json
POST /my_index/_search?scroll=1m
{ "size": 100, "query": { "match_all": {} } }
```

适合：数据导出、离线批量处理，不适合实时查询

---

### 11. 写入性能如何优化？

- **批量写入**：用 `_bulk` API 代替单条写入，建议每批 5～15MB
- **调大 refresh 间隔**：写入期间设置 `"refresh_interval": "-1"` 关闭自动刷新，写完再手动 refresh
- **调大副本数**：写入时设为 0，写完再恢复
- **使用自动生成的 `_id`**：ES 自动生成的 ID 避免了版本查询，比指定 ID 写入更快
- **适当增加主分片数**：利用多节点并行写入能力

---

### 12. 查询性能如何优化？

- **使用 filter 代替 must**：filter 结果会被缓存
- **避免 wildcard 前缀模糊查询**：`"title": "*手机"` 性能极差，可改用 `edge_ngram` 分词器
- **避免深翻页**：用 `search_after` 替代大 `from` 值
- **合理设置 mapping**：不需要搜索的字段设置 `"index": false`
- **控制返回字段**：用 `_source` 过滤只返回需要的字段，减少网络传输

---

## 四、集群与运维

### 13. ES 集群的节点类型有哪些？

| 节点类型 | 职责 |
|---|---|
| Master 节点 | 管理集群状态、索引创建删除、分片分配 |
| Data 节点 | 存储数据，执行搜索和聚合 |
| Coordinating 节点 | 接收请求、分发、汇总结果（每个节点默认都有此能力） |
| Ingest 节点 | 写入前的数据预处理（pipeline） |

生产环境建议 Master 节点和 Data 节点分离，避免 Master 节点因数据操作压力影响集群稳定性。

---

### 14. 脑裂问题是什么？如何避免？

**脑裂**：网络分区导致集群出现多个 Master，各自管理不同数据，造成数据不一致。

**解决方案**：设置 `discovery.zen.minimum_master_nodes = (master候选节点数 / 2) + 1`

ES 7.x 之后引入了新的选举机制（基于 Raft），自动处理了脑裂问题，不再需要手动配置。

---

### 15. 索引别名有什么用？

别名相当于索引的"软链接"，主要用途：

- **零停机重建索引**：mapping 变更需要重建时，先建新索引，切换别名指向，应用层无感知
- **按时间滚动索引**：`logs-2024-01`、`logs-2024-02` 共用别名 `current_logs`，按月切换
- **多索引联合查询**：一个别名指向多个索引，统一查询入口
- **数据隔离**：带 filter 的别名，不同业务方访问同一索引的不同数据切片

---

### 16. 如何做不停机的 Mapping 变更？

ES 不允许修改已有字段类型，变更 mapping 必须重建索引。标准流程：

```
1. 创建新索引 products_v2（新 mapping）
2. 用 _reindex API 将数据从 v1 迁移到 v2
3. 将别名 products 从 v1 切换到 v2
4. 删除旧索引 products_v1
```

```json
POST /_reindex
{
  "source": { "index": "products_v1" },
  "dest": { "index": "products_v2" }
}
```

---

## 五、高级特性

### 17. 聚合有哪几类？

| 类型 | 代表 | 用途 |
|---|---|---|
| Bucket 聚合 | terms、date_histogram、range | 分组，类似 GROUP BY |
| Metric 聚合 | avg、max、min、sum、cardinality | 计算统计值 |
| Pipeline 聚合 | moving_avg、bucket_sort | 对聚合结果再聚合 |

实际场景中常见嵌套用法：先 Bucket 分组，再在每个桶内计算 Metric，等同于 `GROUP BY + 统计函数`。

---

### 18. ES 如何保证数据不丢失？

**Translog（事务日志）机制**：

- 数据写入 Memory Buffer 的同时，同步写入 translog
- translog 默认每次请求都 fsync 到磁盘（可配置异步）
- 节点崩溃重启时，从 translog 中恢复未持久化的数据
- 当 translog 过大或达到 30 分钟，触发 flush，将数据持久化为 Segment 文件，translog 清空

---

### 19. 倒排索引是什么？

倒排索引是 ES（Lucene）实现全文检索的核心数据结构。

正向索引：文档 → 词语
倒排索引：词语 → 文档列表

举例：

| 词项 | 文档列表 |
|---|---|
| 苹果 | doc1, doc3, doc5 |
| 手机 | doc1, doc2 |
| 华为 | doc2, doc4 |

搜索"苹果手机"时，找到"苹果"和"手机"对应的文档列表，取交集得到 doc1，极大提升了搜索效率。

---

### 20. cardinality 聚合是做什么的？精确吗？

`cardinality` 用于统计字段的近似去重数量，类似 SQL 的 `COUNT(DISTINCT field)`。

```json
"aggs": {
  "unique_users": {
    "cardinality": { "field": "user_id" }
  }
}
```

它使用 **HyperLogLog++** 算法，是近似值，默认误差率约 **1%～5%**。

可以通过 `precision_threshold` 提升精度（值越大越精确，内存消耗越大）：

```json
"cardinality": {
  "field": "user_id",
  "precision_threshold": 10000
}
```

---

*整理于 2024 年，基于 ES 7.x / 8.x 版本*