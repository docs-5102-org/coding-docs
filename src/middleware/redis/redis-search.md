---
title: RediSearch教程
category:
  - 中间件
tag:
  - RediSearch
---

# RediSearch 教程

## 📖 简介

RediSearch 是一个强大的 Redis 模块，为 Redis 数据库提供了高级的搜索功能，包括：
- 全文搜索
- 二次索引
- 查询语言支持
- 压缩反向索引（低内存占用）
- 精确短语匹配
- 模糊搜索
- 数字过滤

### 官方资源
- GitHub: https://github.com/RediSearch/RediSearch
- 官方文档: https://redis.io/docs/interact/search-and-query/

## 🐳 Docker 安装（推荐）

### 为什么推荐 Docker 安装？

Docker 安装 RediSearch 具有以下优势：
- **集成方便**: Docker 镜像已经将 Redis 和 RediSearch 完美集成
- **环境完整**: 包含运行 RediSearch 所需的全部环境
- **部署简单**: 一行命令即可启动
- **版本稳定**: 避免版本兼容问题

> **注意**: RediSearch 是 Redis 的一个模块，不是独立服务。在 Docker 容器中运行 RediSearch 意味着同时运行 Redis。

### 安装命令

```bash
# 启动 RediSearch 容器
docker run -p 6379:6379 redislabs/redisearch:latest

# 后台运行
docker run -d -p 6379:6379 --name redisearch redislabs/redisearch:latest
```

## ☕ 基于 Jedis 的 Java 实现

### 核心概念

在开始编码前，需要理解两个重要的字段类型：

#### 1. 标签字段（TagField）
- **用途**: 精确匹配查询
- **特点**: 不分词处理，作为整体存储
- **查询语法**: 使用大括号 `{}`，如 `@status:{NO_USED}`
- **适用场景**: 分类、状态标记、预定义值

#### 2. 文本字段（TextField）
- **用途**: 全文搜索
- **特点**: 支持分词处理和复杂查询
- **查询语法**: 支持前缀搜索、近似匹配等
- **适用场景**: 自由文本、描述、文章内容

### 完整实现示例

```java
package com.example.redisearch;

import cn.hutool.core.bean.BeanUtil;
import com.alibaba.fastjson.JSONObject;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import redis.clients.jedis.UnifiedJedis;
import redis.clients.jedis.search.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * RediSearch 全文搜索服务
 * 用于微信公众号文章的索引和搜索功能
 */
@Service
@Slf4j
public class RediSearchService {

    @Autowired
    private UnifiedJedis unifiedJedis;

    // 索引前缀
    private static final String INDEX_PREFIX = "wx:mp:article:";
    // 索引名称
    public static final String INDEX_NAME = "wxMpArticle";

    /**
     * 创建搜索索引
     * @param indexName 索引名称
     */
    public void createIndex(String indexName) {
        if (isIndexExists(indexName)) {
            log.info("索引 [{}] 已存在，跳过创建", indexName);
            return;
        }

        // 定义索引结构
        Schema schema = new Schema()
                .addTagField("fakeid")           // 标签字段：公众号ID
                .addTagField("link")             // 标签字段：文章链接
                .addTextField("title", 5.0)      // 文本字段：文章标题（权重5.0）
                .addTextField("info", 1.0)       // 文本字段：文章信息
                .addTextField("detail", 1.0)     // 文本字段：文章详情
                .addTagField("status")           // 标签字段：文章状态
                .addTagField("mpType")           // 标签字段：公众号类型
                .addSortableNumericField("timestamp"); // 数值字段：时间戳（可排序）

        // 创建索引规则
        IndexDefinition rule = new IndexDefinition(IndexDefinition.Type.HASH)
                .setPrefixes(INDEX_PREFIX)       // 设置键前缀
                .setLanguage("chinese");         // 支持中文分词

        // 执行创建索引
        unifiedJedis.ftCreate(indexName,
                IndexOptions.defaultOptions().setDefinition(rule),
                schema);
        
        log.info("索引 [{}] 创建成功", indexName);
    }

    /**
     * 删除索引
     * @param indexName 索引名称
     */
    public void removeIndex(String indexName) {
        if (isIndexExists(indexName)) {
            unifiedJedis.ftDropIndex(indexName);
            log.info("索引 [{}] 删除成功", indexName);
        } else {
            log.warn("索引 [{}] 不存在", indexName);
        }
    }

    /**
     * 批量添加文档到索引
     * @param articles 文章列表
     */
    public void addDocuments(List<ArticleDto> articles) {
        for (ArticleDto article : articles) {
            Map<String, Object> fields = BeanUtil.beanToMap(article);
            String key = INDEX_PREFIX + article.getLink();
            unifiedJedis.hsetObject(key, fields);
        }
        log.info("成功添加 {} 篇文章到索引", articles.size());
    }

    /**
     * 检查文档是否存在
     * @param link 文章链接
     * @return true-存在，false-不存在
     */
    public boolean documentExists(String link) {
        String key = INDEX_PREFIX + link;
        return unifiedJedis.exists(key);
    }

    /**
     * 更新文档状态
     * @param link 文章链接
     * @param status 新状态
     */
    public void updateDocumentStatus(String link, String status) {
        String key = INDEX_PREFIX + link;
        unifiedJedis.hset(key, "status", status);
        log.info("文档 [{}] 状态更新为: {}", link, status);
    }

    /**
     * 删除单个文档
     * @param link 文章链接
     */
    public void removeDocument(String link) {
        String key = INDEX_PREFIX + link;
        unifiedJedis.del(key);
        log.info("文档 [{}] 删除成功", key);
    }

    /**
     * 批量删除文档
     * @param links 文章链接列表
     */
    public void removeDocuments(List<String> links) {
        String[] keys = links.stream()
                .map(link -> INDEX_PREFIX + link)
                .toArray(String[]::new);
        unifiedJedis.del(keys);
        log.info("批量删除 {} 个文档", links.size());
    }

    /**
     * 分页搜索文档
     * @param indexName 索引名称
     * @param queryText 搜索文本（可为空）
     * @param mpType 公众号类型（可为空）
     * @param page 页码（从1开始）
     * @param size 每页大小
     * @return 搜索结果
     */
    public SearchResult searchWithPagination(String indexName, String queryText, 
                                           String mpType, int page, int size) {
        // 计算分页参数
        int offset = Math.max(0, (page - 1) * size);
        
        // 构建查询条件
        String queryKey = buildQuery(queryText, mpType);
        
        // 创建查询对象
        Query query = new Query(queryKey)
                .setLanguage("chinese")           // 中文分词
                .limit(offset, size)              // 分页设置
                .setSortBy("timestamp", false);   // 按时间倒序

        return unifiedJedis.ftSearch(indexName, query);
    }

    /**
     * 根据状态搜索文档
     * @param indexName 索引名称
     * @param status 文档状态
     * @return 搜索结果
     */
    public SearchResult searchByStatus(String indexName, String status) {
        if (StringUtils.isBlank(status)) {
            return null;
        }

        String queryKey = String.format("@status:{%s}", status);
        Query query = new Query(queryKey).setLanguage("chinese");
        
        return unifiedJedis.ftSearch(indexName, query);
    }

    /**
     * 检查索引是否存在
     * @param indexName 索引名称
     * @return true-存在，false-不存在
     */
    public boolean isIndexExists(String indexName) {
        return unifiedJedis.ftList().contains(indexName);
    }

    /**
     * 构建查询字符串
     * @param queryText 搜索文本
     * @param mpType 公众号类型
     * @return 查询字符串
     */
    private String buildQuery(String queryText, String mpType) {
        if (StringUtils.isNotBlank(queryText) && StringUtils.isNotBlank(mpType)) {
            // 同时搜索标题和类型
            return String.format("@title:*%s* @mpType:{%s}", queryText, mpType);
        } else if (StringUtils.isNotBlank(queryText)) {
            // 仅搜索标题（模糊匹配）
            return String.format("@title:*%s*", queryText);
        } else if (StringUtils.isNotBlank(mpType)) {
            // 仅搜索类型（精确匹配）
            return String.format("@mpType:{%s}", mpType);
        } else {
            // 搜索所有
            return "*";
        }
    }
}

/**
 * 文章数据传输对象
 */
@Data
public class ArticleDto {
    private String fakeid;      // 公众号ID
    private String link;        // 文章链接
    private String title;       // 文章标题
    private String info;        // 文章信息
    private String detail;      // 文章详情
    private String status;      // 文章状态
    private String mpType;      // 公众号类型
    private Long timestamp;     // 时间戳
}
```

## 🔍 查询命令示例

### FT.SEARCH 基本用法

```bash
# 1. 精确匹配查询（TagField）
FT.SEARCH wxMpArticle "@status:{NO_USED}"

# 2. 模糊查询（TextField）
FT.SEARCH wxMpArticle "@title:*关键词*"

# 3. 组合查询
FT.SEARCH wxMpArticle "@title:*科技* @status:{PUBLISHED}"

# 4. 全文搜索所有字段
FT.SEARCH wxMpArticle "人工智能"

# 5. 分页查询
FT.SEARCH wxMpArticle "*" LIMIT 0 10

# 6. 排序查询
FT.SEARCH wxMpArticle "*" SORTBY timestamp DESC
```

### 高级查询示例

```bash
# 范围查询
FT.SEARCH wxMpArticle "@timestamp:[1640995200 +inf]"

# 多条件组合
FT.SEARCH wxMpArticle "(@title:技术 @status:{PUBLISHED}) | (@mpType:{TECH})"

# 排除特定条件
FT.SEARCH wxMpArticle "* -@status:{DELETED}"
```

## 📋 最佳实践

### 1. 索引设计原则
- **合理选择字段类型**: 精确匹配用 TagField，全文搜索用 TextField
- **设置合适的权重**: 重要字段（如标题）设置更高权重
- **避免过多索引字段**: 只索引需要搜索的字段

### 2. 查询优化
- **使用前缀匹配**: 对于大量数据，前缀匹配比通配符匹配更高效
- **合理使用分页**: 避免一次查询过多数据
- **缓存热点查询**: 对频繁查询进行结果缓存

### 3. 性能监控
```bash
# 查看索引信息
FT.INFO wxMpArticle

# 查看所有索引
FT._LIST

# 查看查询性能
FT.PROFILE wxMpArticle SEARCH QUERY "@title:*关键词*"
```

## 🚨 常见问题

### Q1: TagField 和 TextField 的区别？
**A**: TagField 用于精确匹配，不分词；TextField 用于全文搜索，支持分词和模糊匹配。

### Q2: 中文搜索不准确？
**A**: 确保在创建索引时设置 `.setLanguage("chinese")`，并在查询时也指定中文语言。

### Q3: 内存占用过高？
**A**: RediSearch 使用压缩索引，但仍需根据数据量合理配置 Redis 内存。

### Q4: 索引更新策略？
**A**: 支持实时更新，添加/修改文档后索引会自动更新，无需重建。

## 📚 参考资源

- [RediSearch 官方文档](https://redis.io/docs/interact/search-and-query/)
- [RediSearch GitHub](https://github.com/RediSearch/RediSearch)
- [Jedis RediSearch 文档](https://github.com/redis/jedis)

---

> 💡 **提示**: 本教程基于实际项目经验整理，涵盖了 RediSearch 的核心功能和最佳实践。建议结合具体业务场景进行调整和优化。