---
title: SpringBoot 默认数据源为什么是HikariCP？
category:
  - Web框架
tag:
  - Spring Boot
  - HikariCP
---

# SpringBoot 默认数据源为什么是HikariCP？

## 前言

从 Spring Boot 2.0 开始，官方将默认数据库连接池从 Tomcat JDBC Pool 替换为 HikariCP。这个决定并非随意为之，而是基于 HikariCP 在性能、稳定性、可靠性等多个维度的卓越表现。本文将深入分析 Spring Boot 选择 HikariCP 的原因，以及 HikariCP 的技术优势。

## HikariCP 简介

HikariCP（光速连接池）是一个高性能的 JDBC 连接池，由 Brett Wooldridge 开发。"Hikari" 在日语中意为"光"，暗示其超快的性能特点。HikariCP 以"快速、简单、可靠"为口号，在 Java 生态系统中获得了广泛认可。

### 基本特性

- **轻量级**：代码量仅约 130KB
- **高性能**：号称是最快的 JDBC 连接池
- **零依赖**：不依赖其他第三方库
- **简单配置**：配置项精简且合理

## Spring Boot 选择 HikariCP 的五大理由

### 理由一：代码量优势

| 连接池     | 代码行数 | JAR 包大小 |
|-----------|----------|------------|
| HikariCP  | ~3,000   | 130KB      |
| Tomcat    | ~8,000   | 400KB      |
| Druid     | ~15,000  | 1.8MB      |
| C3P0      | ~18,000  | 750KB      |
| DBCP      | ~5,000   | 350KB      |

**代码量少的优势：**
- 更少的 Bug 可能性
- 更高的执行效率
- 更容易维护和理解
- 更快的类加载速度

### 理由二：卓越的性能表现

#### 连接获取/关闭性能测试

基于标准的 `DataSource.getConnection()` 和 `Connection.close()` 操作测试：

| 并发数 | HikariCP | Druid | Tomcat | DBCP | C3P0  |
|--------|----------|-------|---------|------|-------|
| 1      | 67       | 830   | 442     | 480  | 632   |
| 5      | 293      | 985   | 447     | 767  | 933   |
| 10     | 376      | 1130  | 1374    | 986  | 1062  |
| 20     | 694      | 1818  | 1751    | 1800 | 1682  |
| 50     | 1722     | 4224  | 4317    | 5018 | 8587  |

**测试结果分析：**
- HikariCP 在所有并发级别下都表现最优
- 随着并发数增加，HikariCP 的性能优势更加明显
- 在高并发（50个并发）场景下，HikariCP 比 C3P0 快约 5 倍

#### 查询语句性能测试

执行 10 万次查询操作的耗时对比：

| 并发数 | HikariCP | Druid  | Tomcat | DBCP   | C3P0   |
|--------|----------|--------|---------|--------|--------|
| 1      | 16229    | 22978  | 21783   | 23727  | 32143  |
| 5      | 19354    | 24245  | 24953   | 26796  | 34511  |
| 10     | 20177    | 25995  | 27225   | 28017  | 41917  |

### 理由三：出色的稳定性

HikariCP 在长时间运行测试中表现出了极好的稳定性：

- **内存使用**：内存占用稳定，无内存泄漏
- **连接管理**：连接回收机制高效可靠
- **异常处理**：对各种异常情况处理得当

### 理由四：高可靠性

#### 数据库连接中断处理对比

当数据库连接中断时，各连接池的处理方式：

| 连接池    | 处理方式                           | 评分 |
|-----------|-----------------------------------|------|
| HikariCP  | 5秒后抛出 SQLException，处理及时   | A+   |
| Druid     | 处理较为合理，但略慢于 HikariCP    | A    |
| Tomcat    | 返回无效连接，55秒后才能正确处理   | C    |
| C3P0      | 无任何提示，2分钟后才有错误返回    | D    |
| DBCP      | 类似 Tomcat，处理不够及时          | C    |

### 理由五：良好的社区口碑

- Spring Boot 官方选择并推荐
- 众多知名开源项目采用
- 社区活跃度高，问题响应及时
- 持续的版本更新和优化

## HikariCP 高性能的技术原理

### 1. 优化并精简字节码

HikariCP 使用 Javassist 字节码操作库生成动态代理：

```java
// HikariCP 的代理实现示例
public final class ConnectionProxy extends Connection {
    // 通过字节码注入实现，减少不必要的方法调用
    // 编译时优化，运行时高效
}
```

**优化策略：**
- 减少方法调用层次
- 避免不必要的类型检查
- 精简代理对象的字节码
- 利用 JVM 的内联优化

### 2. ConcurrentBag：专用并发集合

HikariCP 实现了专门为连接池设计的无锁集合 `ConcurrentBag`：

```java
public class ConcurrentBag<T> {
    // ThreadLocal 存储线程专属对象
    private final ThreadLocal<List<Object>> threadList;
    
    // 共享对象列表
    private final CopyOnWriteArrayList<T> sharedList;
    
    // queue-stealing 机制
    public T borrow(long timeout, TimeUnit timeUnit) {
        // 1. 首先尝试从 ThreadLocal 获取
        // 2. 然后从共享列表获取
        // 3. 避免锁竞争，提高并发性能
    }
}
```

**技术优势：**
- 优先使用线程本地对象，避免锁竞争
- queue-stealing 机制提高资源利用率
- 避免伪共享（false sharing）问题

### 3. FastList：高效的 ArrayList 替代

```java
public final class FastList<T> implements List<T> {
    private T[] elementData;
    private int size;
    
    // 去除边界检查，提高访问速度
    public T get(int index) {
        return elementData[index]; // 无 rangeCheck
    }
    
    // 从尾部开始遍历，适应连接池的使用模式
    public boolean remove(Object element) {
        for (int index = size - 1; index >= 0; index--) {
            if (element == elementData[index]) {
                // 快速移除
            }
        }
    }
}
```

## HikariCP vs Druid 对比分析

### 性能对比

| 指标       | HikariCP | Druid |
|------------|----------|-------|
| 连接获取速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐  |
| 内存占用   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐    |
| 启动速度   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐    |

### 功能对比

| 功能       | HikariCP | Druid |
|------------|----------|-------|
| 基础连接池  | ✅        | ✅     |
| SQL 监控   | ❌        | ✅     |
| SQL 防火墙 | ❌        | ✅     |
| 统计信息   | 基础      | 丰富   |
| 扩展性     | 一般      | 很好   |

### 选择建议

**选择 HikariCP 的场景：**
- 追求极致性能
- 简单的连接池需求
- 微服务架构
- 内存敏感的应用

**选择 Druid 的场景：**
- 需要 SQL 监控功能
- 需要 SQL 防火墙
- 复杂的企业级应用
- 需要详细的统计分析

## Spring Boot 中使用 HikariCP

### 1. 默认配置

Spring Boot 2.0+ 默认使用 HikariCP，无需额外依赖：

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/testdb
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
```

### 2. HikariCP 专用配置

```yaml
spring:
  datasource:
    type: com.zaxxer.hikari.HikariDataSource
    hikari:
      # 连接池名称
      pool-name: MyHikariCP
      # 最小空闲连接数
      minimum-idle: 5
      # 最大连接池大小
      maximum-pool-size: 20
      # 自动提交
      auto-commit: true
      # 空闲超时时间（毫秒）
      idle-timeout: 30000
      # 连接最大存活时间（毫秒）
      max-lifetime: 1800000
      # 连接超时时间（毫秒）
      connection-timeout: 30000
      # 连接测试查询
      connection-test-query: SELECT 1
```

### 3. 编程式配置

```java
@Configuration
public class DataSourceConfig {
    
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl("jdbc:mysql://localhost:3306/testdb");
        config.setUsername("root");
        config.setPassword("password");
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // 性能优化配置
        config.setMaximumPoolSize(20);
        config.setMinimumIdle(5);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(600000);
        config.setMaxLifetime(1800000);
        
        return new HikariDataSource(config);
    }
}
```

## 性能调优建议

### 1. 核心参数优化

```yaml
spring:
  datasource:
    hikari:
      # 根据实际并发调整，通常为 CPU 核心数 * 2
      maximum-pool-size: 20
      
      # 保持一定的空闲连接，减少连接创建开销
      minimum-idle: 5
      
      # 连接超时时间不宜过长
      connection-timeout: 20000
      
      # 连接存活时间，避免连接过期
      max-lifetime: 1200000
      
      # 空闲超时，及时回收空闲连接
      idle-timeout: 300000
```

### 2. PreparedStatement 缓存优化

```yaml
spring:
  datasource:
    hikari:
      data-source-properties:
        # MySQL 驱动的 PreparedStatement 缓存
        cachePrepStmts: true
        prepStmtCacheSize: 250
        prepStmtCacheSqlLimit: 2048
        useServerPrepStmts: true
        useLocalSessionState: true
        rewriteBatchedStatements: true
        cacheResultSetMetadata: true
        cacheServerConfiguration: true
        elideSetAutoCommits: true
        maintainTimeStats: false
```

### 3. 监控配置

```java
@Configuration
@EnableConfigurationProperties(HikariDataSource.class)
public class DataSourceConfig {
    
    @Bean
    public MeterRegistry meterRegistry() {
        return new PrometheusMeterRegistry(PrometheusConfig.DEFAULT);
    }
    
    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource dataSource(MeterRegistry meterRegistry) {
        HikariDataSource dataSource = new HikariDataSource();
        // 启用指标收集
        dataSource.setMetricRegistry((MetricRegistry) meterRegistry);
        return dataSource;
    }
}
```

## 参考资料

http://blog.csdn.net/qq_31125793/article/details/51241943

## 总结

Spring Boot 选择 HikariCP 作为默认数据库连接池是一个经过深思熟虑的决定，主要基于以下考虑：

1. **卓越的性能表现**：在各种基准测试中都表现优异
2. **稳定可靠**：经过大量生产环境验证
3. **轻量级设计**：代码量少，依赖简单
4. **优秀的工程实现**：字节码级优化，专用数据结构
5. **活跃的社区支持**：持续更新，问题响应及时

对于大多数 Spring Boot 应用来说，HikariCP 提供了性能和简单性的最佳平衡。虽然在监控和扩展功能方面不如 Druid 丰富，但其在核心功能上的卓越表现使其成为默认选择的最佳候选者。

在实际项目中，建议：
- **一般场景**：直接使用 HikariCP，配置简单，性能优异
- **需要监控**：考虑 Druid 或使用外部监控工具
- **性能敏感**：HikariCP 是不二选择

随着云原生和微服务架构的普及，轻量级、高性能的 HikariCP 将继续在 Java 生态系统中发挥重要作用。

