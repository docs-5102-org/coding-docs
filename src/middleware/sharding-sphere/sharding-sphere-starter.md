---
title: ShardingSphere 入门教程
category:
  - 中间件
tag:
  - ShardingSphere
---

# Apache ShardingSphere 入门教程

## 概述

Apache ShardingSphere 是一个开源的分布式数据库生态系统，专注于数据分片、分布式事务和数据库治理。它可以帮助您轻松实现数据库的水平分片、读写分离、分布式治理等功能。

### 核心特性

- **数据分片**：支持分库分表，支持范围、哈希、复合、Hint等多种分片策略
- **分布式事务**：支持XA和BASE模式的分布式事务
- **读写分离**：支持一主多从的读写分离模式  
- **分布式治理**：配置中心、注册中心、熔断降级、链路追踪
- **数据库发现**：自动发现数据库拓扑和状态
- **SQL支持**：兼容MySQL、PostgreSQL、SQLServer、Oracle等主流数据库

## 版本选择

### ShardingSphere 5.2.1（推荐）

- ✅ **支持批量插入**（已修复相关bug）
- ✅ 功能更完善，性能更优
- ✅ 社区活跃，长期支持

### ShardingSphere 4.1.0（不推荐）

- ❌ **不支持批量更新、插入**
- ❌ 存在批量操作相关bug
- ⚠️ 已停止维护

> **重要提示**：强烈建议使用 5.2.1 或更高版本，避免批量操作的相关问题。

## 快速开始

### 1. 添加Maven依赖

#### ShardingSphere 5.2.1 依赖配置

```xml
<!-- ShardingSphere JDBC Core Spring Boot Starter -->
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-jdbc-core-spring-boot-starter</artifactId>
    <version>5.2.1</version>
</dependency>

<!-- Groovy支持（用于算法表达式） -->
<dependency>
    <groupId>org.codehaus.groovy</groupId>
    <artifactId>groovy</artifactId>
    <version>2.5.8</version>
</dependency>

<!-- YAML解析器（必需版本1.33） -->
<dependency>
    <groupId>org.yaml</groupId>
    <artifactId>snakeyaml</artifactId>
    <version>1.33</version>
</dependency>
```

### 2. 配置数据源

#### 方式一：Java Config 配置（推荐）

```java
@Configuration
public class DataSourceConfig {

    /**
     * 配置主数据源
     */
    @Bean(name = "masterDataSource")
    @ConfigurationProperties(prefix = "spring.shardingsphere.datasource.master")
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().build();
    }

    /**
     * 配置ShardingSphere数据源
     */
    @Bean(name = "dataSource")
    @Primary
    public DataSource dataSource(@Qualifier("masterDataSource") DataSource masterDataSource) throws SQLException {
        // 配置数据源映射
        Map<String, DataSource> dataSourceMap = new HashMap<>();
        dataSourceMap.put("master", masterDataSource);
        
        // 创建ShardingSphere数据源
        return ShardingSphereDataSourceFactory.createDataSource(
            dataSourceMap, 
            Arrays.asList(createShardingRuleConfiguration()), 
            new Properties()
        );
    }

    /**
     * 创建分片规则配置
     */
    private ShardingRuleConfiguration createShardingRuleConfiguration() {
        ShardingRuleConfiguration shardingRuleConfig = new ShardingRuleConfiguration();
        
        // 绑定表组（逻辑相关的表）
        shardingRuleConfig.getBindingTableGroups().add("novel_chapter");
        
        // 配置表分片规则
        shardingRuleConfig.getTables().add(getChapterTableRuleConfiguration());
        
        // 配置分片算法
        shardingRuleConfig.getShardingAlgorithms().put(
            "chapter_sharding_algorithm", 
            new AlgorithmConfiguration("INLINE", chapterAlgorithmProperties())
        );
        
        // 配置分布式主键生成器
        shardingRuleConfig.getKeyGenerators().put(
            "snowflake", 
            new AlgorithmConfiguration("SNOWFLAKE", new Properties())
        );
        
        return shardingRuleConfig;
    }

    /**
     * 配置章节表分片规则
     */
    private ShardingTableRuleConfiguration getChapterTableRuleConfiguration() {
        // 逻辑表名和实际节点
        ShardingTableRuleConfiguration result = new ShardingTableRuleConfiguration(
            "novel_chapter", 
            "master.novel_chapter_${0..99}"
        );
        
        // 分表策略：根据id字段进行分表
        result.setTableShardingStrategy(
            new StandardShardingStrategyConfiguration("id", "chapter_sharding_algorithm")
        );
        
        // 主键生成策略
        result.setKeyGenerateStrategy(
            new KeyGenerateStrategyConfiguration("id", "snowflake")
        );
        
        return result;
    }

    /**
     * 分片算法属性配置
     */
    private Properties chapterAlgorithmProperties() {
        Properties props = new Properties();
        // 分表表达式：根据id模100进行分表
        props.setProperty("algorithm-expression", "novel_chapter_${id % 100}");
        return props;
    }

    /**
     * 事务管理器
     */
    @Bean(name = "transactionManager")
    @Primary
    public PlatformTransactionManager transactionManager(@Qualifier("dataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }

    /**
     * JDBC模板
     */
    @Bean(name = "jdbcTemplate")
    @Primary
    public JdbcTemplate jdbcTemplate(@Qualifier("dataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

#### 方式二：YAML配置

```yaml
spring:
  shardingsphere:
    # 数据源配置
    datasource:
      names: master
      master:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://localhost:3306/novel_db
        username: root
        password: password
    
    # 分片规则配置
    rules:
      sharding:
        # 分片算法配置
        sharding-algorithms:
          chapter-sharding-algorithm:
            type: INLINE
            props:
              algorithm-expression: novel_chapter_${id % 100}
        
        # 主键生成策略配置
        key-generators:
          snowflake:
            type: SNOWFLAKE
        
        # 表分片规则配置
        tables:
          novel_chapter:
            actual-data-nodes: master.novel_chapter_${0..99}
            table-strategy:
              standard:
                sharding-column: id
                sharding-algorithm-name: chapter-sharding-algorithm
            key-generate-strategy:
              column: id
              key-generator-name: snowflake
    
    # 属性配置
    props:
      sql-show: false  # 是否显示SQL
```

### 3. 应用程序配置

```yaml
# application.yml
spring:
  application:
    name: sharding-demo
  
  shardingsphere:
    datasource:
      master:
        type: com.zaxxer.hikari.HikariDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        jdbc-url: jdbc:mysql://localhost:3306/novel_db?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false
        username: root
        password: your_password
        hikari:
          maximum-pool-size: 20
          minimum-idle: 5
```

## 分片策略详解

### 1. 分片算法类型

| 算法类型 | 说明 | 适用场景 |
|---------|-----|---------|
| INLINE | 行表达式分片算法 | 简单的取模、范围分片 |
| MOD | 取模分片算法 | 均匀分布的数值分片 |
| HASH_MOD | 哈希取模分片算法 | 字符串类型的均匀分片 |
| RANGE | 范围分片算法 | 按数值范围分片 |
| BOUNDARY_RANGE | 边界范围分片算法 | 自定义范围边界 |

### 2. 分片策略配置示例

#### 按用户ID分库分表

```java
// 分库策略
new StandardShardingStrategyConfiguration("user_id", "database_sharding_algorithm")

// 分表策略  
new StandardShardingStrategyConfiguration("user_id", "table_sharding_algorithm")

// 算法配置
Properties dbProps = new Properties();
dbProps.setProperty("algorithm-expression", "ds${user_id % 2}");

Properties tableProps = new Properties();
tableProps.setProperty("algorithm-expression", "user_${user_id % 4}");
```

#### 按时间范围分表

```java
Properties props = new Properties();
props.setProperty("algorithm-expression", "order_${create_time.format('yyyyMM')}");
```

## 最佳实践

### 1. 分片键选择原则

- **高基数**：分片键应该有足够的唯一值
- **访问模式**：根据业务查询模式选择分片键
- **数据分布**：确保数据能够均匀分布
- **业务相关性**：选择业务意义明确的字段

### 2. 表设计建议

```sql
-- 推荐的分片表设计
CREATE TABLE user_order_{分片后缀} (
    id BIGINT PRIMARY KEY,           -- 全局唯一主键（雪花算法）
    user_id BIGINT NOT NULL,         -- 分片键
    order_no VARCHAR(64) NOT NULL,   -- 业务编号
    amount DECIMAL(10,2),            -- 金额
    status TINYINT,                  -- 状态
    create_time TIMESTAMP,           -- 创建时间
    update_time TIMESTAMP,           -- 更新时间
    
    INDEX idx_user_id (user_id),     -- 分片键索引
    INDEX idx_order_no (order_no),   -- 业务查询索引
    INDEX idx_create_time (create_time)
);
```

### 3. 性能优化建议

- **避免跨片查询**：尽量基于分片键进行查询
- **使用绑定表**：关联查询的表使用相同分片规则
- **合理设置连接池**：根据分片数量调整连接池大小
- **监控SQL执行**：开启SQL日志监控性能

## 常见问题解决

### 1. YAML解析错误

```
Caused by: java.lang.NoSuchMethodError: 'void org.apache.shardingsphere.infra.util.yaml.constructor.ShardingSphereYamlConstructor$1.setCodePointLimit(int)'
```

**解决方案**：确保使用snakeyaml 1.33版本

```xml
<dependency>
    <groupId>org.yaml</groupId>
    <artifactId>snakeyaml</artifactId>
    <version>1.33</version>
</dependency>
```

### 2. 依赖冲突问题

**问题**：`shardingsphere-jdbc-core` 和 `sharding-jdbc-core` 混用

**解决方案**：
- 使用最新版本：`shardingsphere-jdbc-core-spring-boot-starter`
- 移除旧版本依赖：`sharding-jdbc-core`

### 3. 批量操作问题

**ShardingSphere 4.x版本**：
- ❌ 不支持批量更新和插入
- 会导致分片数据结果错误

**ShardingSphere 5.x版本**：
- ✅ 已修复批量操作问题
- 支持正确的批量插入和更新

### 4. 事务管理

```java
@Service
@Transactional(rollbackFor = Exception.class)
public class UserService {
    
    // 跨片事务会自动处理
    public void createUserAndOrder(User user, Order order) {
        userMapper.insert(user);
        orderMapper.insert(order);
    }
}
```

## 进阶功能

### 1. 读写分离配置

```yaml
spring:
  shardingsphere:
    rules:
      readwrite-splitting:
        data-sources:
          pr_ds:
            primary-data-source-name: master
            replica-data-source-names: slave1,slave2
            load-balancer-name: round-robin
        load-balancers:
          round-robin:
            type: ROUND_ROBIN
```

### 2. 数据库发现

```yaml
spring:
  shardingsphere:
    rules:
      database-discovery:
        data-sources:
          replica_ds:
            data-source-names: master,slave1,slave2
            discovery-heartbeat-name: mgr-heartbeat
            discovery-type-name: mgr
```

### 3. 影子库配置

```yaml
spring:
  shardingsphere:
    rules:
      shadow:
        enable: true
        data-sources:
          shadow-data-source:
            production-data-source-name: ds
            shadow-data-source-name: ds-shadow
```

## 监控与运维

### 1. 性能监控

```yaml
spring:
  shardingsphere:
    props:
      sql-show: true                    # 显示SQL
      sql-simple: true                  # 简化SQL显示
      executor-size: 16                 # 执行器大小
      max-connections-size-per-query: 1 # 单次查询最大连接数
```

### 2. 链路追踪

```xml
<dependency>
    <groupId>org.apache.shardingsphere</groupId>
    <artifactId>shardingsphere-tracing-opentracing</artifactId>
    <version>5.2.1</version>
</dependency>
```

### 3. 运维管理

- 使用ShardingSphere-UI进行可视化管理
- 配置注册中心实现配置动态更新
- 监控各分片节点的健康状态

## 总结

Apache ShardingSphere 是一个功能强大的分布式数据库解决方案，通过本教程您可以：

1. ✅ 快速搭建分库分表环境
2. ✅ 掌握核心配置和最佳实践
3. ✅ 了解常见问题的解决方案
4. ✅ 探索进阶功能的使用方式

建议在生产环境使用时：
- 选择最新稳定版本（5.2.1+）
- 详细测试分片规则
- 制定完整的监控方案
- 准备数据迁移和扩容策略

## 参考资源

- [官方文档](https://shardingsphere.apache.org/document/5.2.1/en/overview/)
- [Spring Boot集成指南](https://shardingsphere.apache.org/document/5.2.1/en/user-manual/shardingsphere-jdbc/spring-boot-starter/)
- [示例项目](https://github.com/apache/shardingsphere/tree/5.2.1/examples)
- [YAML配置参考](https://shardingsphere.apache.org/document/5.2.1/en/user-manual/shardingsphere-jdbc/yaml-config/)
- 实战项目：`miliqk-manage`