---
title: Elasticsearch 完整入门教程
category:
  - 中间件
tag:
  - Elasticsearch
  - es
---

# Elasticsearch 完整入门教程

## 目录
1. [Elasticsearch 简介](#elasticsearch-简介)
2. [核心概念](#核心概念)
3. [安装与配置](#安装与配置)
4. [基础操作](#基础操作)
5. [查询DSL](#查询dsl)
6. [聚合分析](#聚合分析)
7. [索引管理](#索引管理)
8. [集群管理](#集群管理)
9. [性能优化](#性能优化)
10. [实战案例](#实战案例)
11. [推荐资源](#推荐资源)

## Elasticsearch 简介

Elasticsearch 是一个基于 Lucene 构建的分布式、RESTful 搜索和分析引擎，能够解决不断涌现出的各种用例。作为 Elastic Stack 的核心，它集中存储您的数据，帮助您发现意料之中以及意料之外的情况。

### 主要特性
- **分布式实时文件存储**：每个字段都被索引并可被搜索
- **分布式实时分析搜索引擎**：支持 PB 级别数据的实时搜索
- **高可用性**：可扩展到数百台服务器，处理 PB 级别数据
- **插件支持**：丰富的插件生态系统
- **RESTful API**：简单的 HTTP API，支持各种编程语言

## 核心概念

### 1. 集群（Cluster）
- 一个或多个节点组织在一起的集合
- 提供联合索引和搜索功能
- 通过集群名称进行标识（默认：elasticsearch）

### 2. 节点（Node）
- 集群中的单个服务器
- 存储数据并参与集群的索引和搜索功能
- 通过节点名称进行标识

### 3. 索引（Index）
- 类似于关系数据库中的"数据库"
- 具有相似特征的文档的集合
- 通过索引名称进行标识（必须小写）

### 4. 文档（Document）
- 索引信息的基本单位
- 以 JSON 格式表示
- 类似于关系数据库中的"行"

### 5. 字段（Field）
- 文档中的键值对
- 类似于关系数据库中的"列"

### 6. 映射（Mapping）
- 定义文档及其包含的字段如何存储和索引
- 类似于关系数据库中的"表结构"

### 7. 分片（Shard）
- 索引可以划分成多个分片
- 每个分片本身就是一个功能完善的"索引"
- 可以托管在集群中的任何节点上

## 安装与配置

### Docker 安装（推荐）
```bash
# 拉取官方镜像
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.8.0

# 创建网络
docker network create elastic

# 运行 Elasticsearch
docker run --name es01 --net elastic -p 9200:9200 -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  docker.elastic.co/elasticsearch/elasticsearch:8.8.0
```

### 传统安装
```bash
# 下载并解压
wget https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.8.0-linux-x86_64.tar.gz
tar -xzf elasticsearch-8.8.0-linux-x86_64.tar.gz
cd elasticsearch-8.8.0/

# 启动
./bin/elasticsearch
```

### 配置文件说明
主要配置文件：`config/elasticsearch.yml`

```yaml
# 集群名称
cluster.name: my-application

# 节点名称
node.name: node-1

# 数据存储路径
path.data: /path/to/data

# 日志存储路径
path.logs: /path/to/logs

# 网络配置
network.host: 192.168.0.1
http.port: 9200

# 集群发现配置
discovery.seed_hosts: ["host1", "host2"]
cluster.initial_master_nodes: ["node-1", "node-2"]
```

## 基础操作

### 1. 健康检查
```bash
# 集群健康状态
curl -X GET "localhost:9200/_cluster/health?pretty"

# 节点信息
curl -X GET "localhost:9200/_nodes?pretty"

# 索引列表
curl -X GET "localhost:9200/_cat/indices?v"
```

### 2. 索引操作
```bash
# 创建索引
curl -X PUT "localhost:9200/my_index?pretty"

# 删除索引
curl -X DELETE "localhost:9200/my_index?pretty"

# 查看索引设置
curl -X GET "localhost:9200/my_index/_settings?pretty"
```

### 3. 文档操作
```bash
# 创建文档（指定ID）
curl -X PUT "localhost:9200/my_index/_doc/1?pretty" -H 'Content-Type: application/json' -d'
{
  "title": "Elasticsearch 入门",
  "content": "这是一个关于 Elasticsearch 的教程",
  "author": "张三",
  "publish_date": "2024-01-01"
}
'

# 创建文档（自动生成ID）
curl -X POST "localhost:9200/my_index/_doc?pretty" -H 'Content-Type: application/json' -d'
{
  "title": "高级搜索",
  "content": "深入了解 Elasticsearch 高级功能"
}
'

# 获取文档
curl -X GET "localhost:9200/my_index/_doc/1?pretty"

# 更新文档
curl -X POST "localhost:9200/my_index/_update/1?pretty" -H 'Content-Type: application/json' -d'
{
  "doc": {
    "author": "李四"
  }
}
'

# 删除文档
curl -X DELETE "localhost:9200/my_index/_doc/1?pretty"
```

## 查询DSL

Elasticsearch 提供了基于 JSON 的查询语言。

### 1. 基础查询
```json
# 查询所有文档
GET /my_index/_search
{
  "query": {
    "match_all": {}
  }
}

# 精确匹配
GET /my_index/_search
{
  "query": {
    "term": {
      "author": "张三"
    }
  }
}

# 全文搜索
GET /my_index/_search
{
  "query": {
    "match": {
      "content": "Elasticsearch 教程"
    }
  }
}

# 多字段搜索
GET /my_index/_search
{
  "query": {
    "multi_match": {
      "query": "Elasticsearch",
      "fields": ["title", "content"]
    }
  }
}
```

### 2. 复合查询
```json
# Bool 查询
GET /my_index/_search
{
  "query": {
    "bool": {
      "must": [
        {"match": {"title": "Elasticsearch"}}
      ],
      "should": [
        {"match": {"author": "张三"}}
      ],
      "must_not": [
        {"match": {"content": "删除"}}
      ],
      "filter": [
        {"range": {"publish_date": {"gte": "2024-01-01"}}}
      ]
    }
  }
}
```

### 3. 过滤查询
```json
# 范围查询
GET /my_index/_search
{
  "query": {
    "range": {
      "publish_date": {
        "gte": "2024-01-01",
        "lte": "2024-12-31"
      }
    }
  }
}

# 存在性查询
GET /my_index/_search
{
  "query": {
    "exists": {
      "field": "author"
    }
  }
}
```

### 4. 排序和分页
```json
GET /my_index/_search
{
  "query": {"match_all": {}},
  "sort": [
    {"publish_date": {"order": "desc"}},
    {"_score": {"order": "desc"}}
  ],
  "from": 0,
  "size": 10
}
```

## 聚合分析

### 1. 指标聚合
```json
# 计算平均值、最大值、最小值
GET /sales/_search
{
  "size": 0,
  "aggs": {
    "avg_price": {
      "avg": {"field": "price"}
    },
    "max_price": {
      "max": {"field": "price"}
    },
    "min_price": {
      "min": {"field": "price"}
    }
  }
}
```

### 2. 桶聚合
```json
# 按类别分组
GET /products/_search
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {
        "field": "category.keyword",
        "size": 10
      }
    }
  }
}

# 日期直方图
GET /logs/_search
{
  "size": 0,
  "aggs": {
    "daily_logs": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "day"
      }
    }
  }
}
```

### 3. 嵌套聚合
```json
GET /sales/_search
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {"field": "category.keyword"},
      "aggs": {
        "avg_price": {
          "avg": {"field": "price"}
        }
      }
    }
  }
}
```

## 索引管理

### 1. 映射管理
```json
# 创建带映射的索引
PUT /products
{
  "mappings": {
    "properties": {
      "title": {
        "type": "text",
        "analyzer": "standard"
      },
      "price": {
        "type": "double"
      },
      "category": {
        "type": "keyword"
      },
      "description": {
        "type": "text",
        "index": false
      },
      "created_at": {
        "type": "date",
        "format": "yyyy-MM-dd"
      }
    }
  }
}

# 添加字段映射
PUT /products/_mapping
{
  "properties": {
    "tags": {
      "type": "keyword"
    }
  }
}
```

### 2. 索引模板
```json
# 创建索引模板
PUT /_index_template/logs_template
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "@timestamp": {"type": "date"},
        "message": {"type": "text"},
        "level": {"type": "keyword"}
      }
    }
  }
}
```

### 3. 别名管理
```json
# 创建别名
POST /_aliases
{
  "actions": [
    {
      "add": {
        "index": "logs-2024-01",
        "alias": "current_logs"
      }
    }
  ]
}

# 切换别名
POST /_aliases
{
  "actions": [
    {"remove": {"index": "logs-2024-01", "alias": "current_logs"}},
    {"add": {"index": "logs-2024-02", "alias": "current_logs"}}
  ]
}
```

## 集群管理

### 1. 集群监控
```bash
# 集群状态
GET /_cluster/health

# 节点统计
GET /_nodes/stats

# 索引统计
GET /_stats

# 分片分配信息
GET /_cat/shards?v
```

### 2. 集群设置
```json
# 动态设置
PUT /_cluster/settings
{
  "persistent": {
    "cluster.routing.allocation.enable": "all"
  }
}

# 临时设置
PUT /_cluster/settings
{
  "transient": {
    "indices.recovery.max_bytes_per_sec": "50mb"
  }
}
```

## 性能优化

### 1. 索引优化
- **合理设计映射**：只索引需要搜索的字段
- **使用合适的分析器**：根据语言选择分析器
- **控制字段数量**：避免映射爆炸
- **批量操作**：使用 bulk API 提高写入性能

### 2. 查询优化
- **使用过滤器**：filter context 不计算相关性得分
- **避免深度分页**：使用 scroll 或 search_after
- **合理使用聚合**：限制聚合的深度和广度
- **缓存查询结果**：利用查询缓存

### 3. 硬件优化
- **内存配置**：堆内存设置为物理内存的50%
- **磁盘选择**：使用 SSD 提高 I/O 性能
- **网络优化**：确保节点间网络延迟低

## 实战案例

### 案例1：构建搜索系统
```json
# 创建产品索引
PUT /products
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "chinese_analyzer": {
          "tokenizer": "ik_max_word",
          "filter": ["lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "name": {
        "type": "text",
        "analyzer": "chinese_analyzer",
        "search_analyzer": "chinese_analyzer"
      },
      "description": {
        "type": "text",
        "analyzer": "chinese_analyzer"
      },
      "price": {"type": "double"},
      "category": {"type": "keyword"},
      "brand": {"type": "keyword"},
      "tags": {"type": "keyword"},
      "created_at": {"type": "date"}
    }
  }
}

# 搜索产品
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        {"multi_match": {
          "query": "手机",
          "fields": ["name^2", "description"],
          "type": "best_fields"
        }}
      ],
      "filter": [
        {"range": {"price": {"gte": 1000, "lte": 5000}}},
        {"term": {"category": "电子产品"}}
      ]
    }
  },
  "aggs": {
    "brands": {
      "terms": {"field": "brand", "size": 10}
    },
    "price_ranges": {
      "range": {
        "field": "price",
        "ranges": [
          {"to": 1000},
          {"from": 1000, "to": 3000},
          {"from": 3000}
        ]
      }
    }
  },
  "highlight": {
    "fields": {
      "name": {},
      "description": {}
    }
  }
}
```

### 案例2：日志分析系统
```json
# 创建日志索引模板
PUT /_index_template/nginx_logs
{
  "index_patterns": ["nginx-logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 1,
      "number_of_replicas": 0,
      "refresh_interval": "5s"
    },
    "mappings": {
      "properties": {
        "@timestamp": {"type": "date"},
        "remote_ip": {"type": "ip"},
        "method": {"type": "keyword"},
        "url": {"type": "keyword"},
        "status": {"type": "integer"},
        "response_time": {"type": "float"},
        "user_agent": {"type": "text", "index": false}
      }
    }
  }
}

# 分析访问统计
GET /nginx-logs-*/_search
{
  "size": 0,
  "query": {
    "range": {
      "@timestamp": {
        "gte": "now-24h"
      }
    }
  },
  "aggs": {
    "hourly_requests": {
      "date_histogram": {
        "field": "@timestamp",
        "calendar_interval": "hour"
      }
    },
    "status_codes": {
      "terms": {
        "field": "status",
        "size": 10
      }
    },
    "top_urls": {
      "terms": {
        "field": "url",
        "size": 20,
        "order": {"_count": "desc"}
      }
    },
    "avg_response_time": {
      "avg": {
        "field": "response_time"
      }
    }
  }
}
```

## 推荐资源

### 官方文档
- **Elasticsearch 官方文档**：https://www.elastic.co/guide/en/elasticsearch/reference/current/
- **Elasticsearch 中文文档**：https://www.elastic.co/guide/cn/elasticsearch/guide/current/
- **Kibana 用户手册**：https://www.elastic.co/guide/cn/kibana/current/
- **Logstash 参考文档**：https://www.elastic.co/guide/en/logstash/current/

### 学习教程
- **Elastic Stack 官方培训**：https://www.elastic.co/training/
- **Elasticsearch 权威指南**：https://elasticsearch.cn/book/elasticsearch_definitive_guide_2.x/
- **提供的教程资源**：
  - GitHub 教程：https://github.com/tuonioooo/mass-data-lucene
  - GitBook 教程：https://tuonioooo.gitbooks.io/mass-data-lucene/content/
  - Kibana 示例数据教程：https://www.elastic.co/guide/cn/kibana/current/tutorial-load-dataset.html

### 社区资源
- **Elasticsearch 中文社区**：https://elasticsearch.cn/
- **Stack Overflow**：搜索 elasticsearch 标签
- **Elastic 官方博客**：https://www.elastic.co/blog/
- **GitHub Awesome Elasticsearch**：收录优秀的 ES 相关项目

### 实用工具
- **Elasticsearch Head**：Web 界面管理工具
- **Cerebro**：集群监控和管理工具
- **ElasticHQ**：集群管理界面
- **Dejavu**：Web UI 用于浏览 Elasticsearch 数据

### 客户端库
- **Java**：Elasticsearch Java Client
- **Python**：elasticsearch-py
- **Node.js**：@elastic/elasticsearch
- **PHP**：elasticsearch-php
- **Go**：go-elasticsearch

### 书籍推荐
1. 《Elasticsearch 权威指南》
2. 《深入理解 Elasticsearch》
3. 《Elasticsearch 实战》
4. 《Learning Elastic Stack》

通过以上教程和资源，您可以从基础入门到高级应用逐步掌握 Elasticsearch。建议先从基础概念和操作开始，然后结合实际项目需求深入学习特定领域的知识。