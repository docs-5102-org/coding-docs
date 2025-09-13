---
title: SpringBoot集成RediSearch
category:
  - Web框架
  - quartz
tag:
  - Spring Boot
---

# SpringBoot集成RediSearch

## 简介

RediSearch是Redis的全文搜索模块，提供了强大的搜索和索引功能。本文档将详细介绍如何在SpringBoot项目中集成RediSearch，包括两种不同的集成方式及其优缺点。

## 环境要求

- Redis 6.0+（需要安装RediSearch模块）
- SpringBoot 2.x/3.x
- JDK 8+

## RediSearch安装

### 方式一：Redis Stack
```bash
# 使用Docker安装Redis Stack（包含RediSearch）
docker run -d --name redis-stack -p 6379:6379 redis/redis-stack:latest
```

### 方式二：编译安装
```bash
# 下载并编译RediSearch模块
git clone https://github.com/RediSearch/RediSearch.git
cd RediSearch
make

# 在redis.conf中加载模块
loadmodule /path/to/redisearch.so
```

## 集成方案对比

| 方案 | 依赖包 | 版本要求 | 优点 | 缺点 | 推荐度 |
|------|--------|----------|------|------|--------|
| 方案一 | jredisearch | 2.2.0 | 简单易用 | 已废弃，功能有限 | ⭐⭐ |
| 方案二 | jedis | 4.4.6+ | 官方支持，功能完整 | 配置稍复杂 | ⭐⭐⭐⭐⭐ |

## 方案一：使用JRediSearch（不推荐）

> ⚠️ **注意**: JRediSearch已被废弃，建议使用方案二

### 添加依赖
```xml
<dependency>
    <groupId>com.redislabs</groupId>
    <artifactId>jredisearch</artifactId>
    <version>2.2.0</version>
</dependency>
```

### 基本用法示例
```java
@Component
@Slf4j
public class RediSearchLegacyService {
    
    public void basicExample() {
        Client client = new Client("student", "localhost", 6379);
        
        try {
            // 清除现有索引（仅用于测试）
            client.dropIndex();
        } catch (Exception e) {
            log.info("索引不存在，跳过删除");
        }
        
        // 定义索引结构
        Schema schema = new Schema()
            .addTextField("title", 5.0)
            .addTextField("body", 1.0)
            .addNumericField("star");
        
        // 创建索引
        client.createIndex(schema, Client.IndexOptions.Default());
        
        // 添加文档
        Map<String, Object> doc1 = Map.of(
            "title", "SpringBoot教程",
            "body", "详细介绍SpringBoot的使用方法",
            "star", 1000
        );
        
        AddOptions options = new AddOptions()
            .setNosave(false)
            .setLanguage("chinese");
            
        client.addDocument(new Document("doc1", doc1, 1.0, null), options);
        
        // 搜索文档
        Query query = new Query("教程")
            .addFilter(new Query.NumericFilter("star", 0, 1500))
            .setWithScores()
            .limit(0, 10);
            
        SearchResult result = client.search(query);
        log.info("搜索结果数量: {}", result.totalResults);
    }
}
```

## 方案二：使用Jedis 4.x（推荐）

### 添加依赖
```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>4.4.6</version>
</dependency>
```

### 配置类

#### Jedis连接池配置
```java
@ConfigurationProperties(prefix = "spring.redis")
@Configuration
@Data
@Slf4j
public class JedisConfig {
    
    private String host = "localhost";
    private int database = 0;
    private int port = 6379;
    private String password;
    private int timeout = 2000;
    
    @Bean
    public JedisPool jedisPool() {
        JedisPoolConfig config = new JedisPoolConfig();
        config.setMaxTotal(20);
        config.setMaxIdle(10);
        config.setMinIdle(5);
        config.setTestOnBorrow(true);
        
        JedisPool jedisPool = StringUtils.hasText(password) 
            ? new JedisPool(config, host, port, timeout, password, database)
            : new JedisPool(config, host, port, timeout, null, database);
            
        log.info("JedisPool初始化成功, host={}, port={}", host, port);
        return jedisPool;
    }
}
```

#### RediSearch服务配置
```java
@Configuration
@EnableConfigurationProperties
public class RediSearchConfig {
    
    @Value("${redisearch.default-index:default}")
    private String defaultIndexName;
    
    @Bean
    @Primary
    public UnifiedJedis unifiedJedis(@Autowired JedisPool jedisPool) {
        return new UnifiedJedis(jedisPool);
    }
}
```

### 核心服务类

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class RediSearchService {
    
    private final UnifiedJedis jedis;
    
    /**
     * 创建索引
     */
    public boolean createIndex(String indexName, Schema schema, String keyPrefix) {
        try {
            // 检查索引是否已存在
            if (indexExists(indexName)) {
                log.info("索引 {} 已存在", indexName);
                return true;
            }
            
            // 创建索引定义
            IndexDefinition definition = new IndexDefinition(IndexDefinition.Type.HASH)
                .setPrefixes(keyPrefix)
                .setLanguage("chinese");
            
            // 创建索引
            jedis.ftCreate(indexName, 
                IndexOptions.defaultOptions().setDefinition(definition), 
                schema);
                
            log.info("索引 {} 创建成功", indexName);
            return true;
            
        } catch (Exception e) {
            log.error("创建索引失败: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 检查索引是否存在
     */
    public boolean indexExists(String indexName) {
        try {
            jedis.ftInfo(indexName);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * 添加文档到索引
     */
    public boolean addDocument(String key, Map<String, String> fields) {
        try {
            fields.put("_language", "chinese");
            jedis.hset(key, fields);
            log.debug("文档 {} 添加成功", key);
            return true;
        } catch (Exception e) {
            log.error("添加文档失败: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 搜索文档
     */
    public SearchResult search(String indexName, String queryStr, int offset, int limit) {
        try {
            Query query = new Query(queryStr)
                .setLanguage("chinese")
                .limit(offset, limit)
                .setWithScores();
                
            SearchResult result = jedis.ftSearch(indexName, query);
            log.debug("搜索完成，共找到 {} 条结果", result.getTotalResults());
            return result;
            
        } catch (Exception e) {
            log.error("搜索失败: {}", e.getMessage(), e);
            return new SearchResult(0, 0, Collections.emptyList());
        }
    }
    
    /**
     * 高级搜索（支持过滤器）
     */
    public SearchResult advancedSearch(String indexName, SearchParams params) {
        try {
            Query query = new Query(params.getQueryString())
                .setLanguage("chinese")
                .limit(params.getOffset(), params.getLimit());
            
            // 添加数字过滤器
            if (params.getNumericFilters() != null) {
                params.getNumericFilters().forEach(query::addFilter);
            }
            
            // 添加排序
            if (StringUtils.hasText(params.getSortBy())) {
                query.setSortBy(params.getSortBy(), params.isAscending());
            }
            
            // 设置高亮
            if (params.isHighlight()) {
                query.highlightFields();
            }
            
            SearchResult result = jedis.ftSearch(indexName, query);
            log.debug("高级搜索完成，共找到 {} 条结果", result.getTotalResults());
            return result;
            
        } catch (Exception e) {
            log.error("高级搜索失败: {}", e.getMessage(), e);
            return new SearchResult(0, 0, Collections.emptyList());
        }
    }
    
    /**
     * 删除索引
     */
    public boolean dropIndex(String indexName) {
        try {
            jedis.ftDropIndex(indexName);
            log.info("索引 {} 删除成功", indexName);
            return true;
        } catch (Exception e) {
            log.error("删除索引失败: {}", e.getMessage(), e);
            return false;
        }
    }
}
```

### 搜索参数类

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchParams {
    private String queryString;
    private int offset = 0;
    private int limit = 10;
    private List<Query.Filter> numericFilters;
    private String sortBy;
    private boolean ascending = true;
    private boolean highlight = false;
    
    public static SearchParams simple(String query) {
        return SearchParams.builder()
            .queryString(query)
            .build();
    }
    
    public SearchParams withPaging(int offset, int limit) {
        this.offset = offset;
        this.limit = limit;
        return this;
    }
    
    public SearchParams withSort(String field, boolean ascending) {
        this.sortBy = field;
        this.ascending = ascending;
        return this;
    }
    
    public SearchParams withHighlight() {
        this.highlight = true;
        return this;
    }
}
```

### 使用示例

```java
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Slf4j
public class SearchController {
    
    private final RediSearchService searchService;
    private static final String PRODUCT_INDEX = "product_index";
    private static final String PRODUCT_PREFIX = "product:";
    
    @PostMapping("/init")
    public ResponseEntity<String> initIndex() {
        // 定义索引结构
        Schema schema = new Schema()
            .addTextField("title", 5.0)
            .addTextField("description", 1.0)
            .addTextField("category", 2.0)
            .addNumericField("price")
            .addNumericField("rating")
            .addTagField("tags");
        
        boolean success = searchService.createIndex(PRODUCT_INDEX, schema, PRODUCT_PREFIX);
        return success ? ResponseEntity.ok("索引创建成功") : ResponseEntity.badRequest().body("索引创建失败");
    }
    
    @PostMapping("/products")
    public ResponseEntity<String> addProduct(@RequestBody ProductDTO product) {
        Map<String, String> fields = Map.of(
            "title", product.getTitle(),
            "description", product.getDescription(),
            "category", product.getCategory(),
            "price", String.valueOf(product.getPrice()),
            "rating", String.valueOf(product.getRating()),
            "tags", String.join(",", product.getTags())
        );
        
        String key = PRODUCT_PREFIX + product.getId();
        boolean success = searchService.addDocument(key, fields);
        
        return success ? ResponseEntity.ok("产品添加成功") : ResponseEntity.badRequest().body("产品添加失败");
    }
    
    @GetMapping("/products")
    public ResponseEntity<SearchResultDTO> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(defaultValue = "rating") String sortBy,
            @RequestParam(defaultValue = "false") boolean ascending) {
        
        SearchParams.SearchParamsBuilder builder = SearchParams.builder()
            .queryString(query)
            .offset(page * size)
            .limit(size)
            .sortBy(sortBy)
            .ascending(ascending)
            .highlight(true);
        
        // 添加价格过滤器
        if (minPrice != null || maxPrice != null) {
            double min = minPrice != null ? minPrice : Double.NEGATIVE_INFINITY;
            double max = maxPrice != null ? maxPrice : Double.POSITIVE_INFINITY;
            builder.numericFilters(List.of(new Query.NumericFilter("price", min, max)));
        }
        
        SearchResult result = searchService.advancedSearch(PRODUCT_INDEX, builder.build());
        
        SearchResultDTO dto = SearchResultDTO.builder()
            .total(result.getTotalResults())
            .page(page)
            .size(size)
            .documents(convertDocuments(result.getDocuments()))
            .build();
        
        return ResponseEntity.ok(dto);
    }
    
    private List<DocumentDTO> convertDocuments(List<Document> documents) {
        return documents.stream()
            .map(doc -> DocumentDTO.builder()
                .id(doc.getId())
                .score(doc.getScore())
                .fields(doc.getProperties())
                .build())
            .collect(Collectors.toList());
    }
}
```

## 配置文件

### application.yml
```yaml
spring:
  redis:
    host: localhost
    port: 6379
    database: 0
    password: # 如果有密码请填写
    timeout: 2000
    
redisearch:
  default-index: product_index
  
logging:
  level:
    com.yourpackage.search: DEBUG
```

## 最佳实践

### 1. 索引设计原则
- 合理设置字段权重，重要字段权重更高
- 使用TAG字段存储枚举值和标签
- 数值字段使用NUMERIC类型以支持范围查询
- 设置合适的前缀以避免键冲突

### 2. 中文搜索优化
```java
// 创建支持中文的索引
IndexDefinition definition = new IndexDefinition(IndexDefinition.Type.HASH)
    .setPrefixes("product:")
    .setLanguage("chinese")
    .setStopWords("的", "是", "在", "有"); // 设置停用词
```

### 3. 性能优化
- 使用连接池管理Redis连接
- 合理设置搜索结果的分页大小
- 对频繁搜索的字段建立适当的索引
- 定期清理不需要的文档和索引

### 4. 错误处理
```java
public SearchResult safeSearch(String indexName, String query) {
    try {
        return searchService.search(indexName, query, 0, 10);
    } catch (JedisException e) {
        log.error("Redis连接异常", e);
        return SearchResult.empty();
    } catch (Exception e) {
        log.error("搜索异常", e);
        return SearchResult.empty();
    }
}
```


## 总结

本文详细介绍了SpringBoot集成RediSearch的两种方案，推荐使用Jedis 4.x方案，因为它提供了更好的功能支持和长期维护。通过合理的配置和最佳实践，可以构建高性能的全文搜索功能。

在实际项目中，建议：
1. 使用Jedis 4.x方案
2. 合理设计索引结构
3. 做好异常处理和监控
4. 定期维护和优化索引
