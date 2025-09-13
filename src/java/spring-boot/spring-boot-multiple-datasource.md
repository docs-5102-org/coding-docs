---
title: 多数据源配置教程
category:
  - Web框架
tag:
  - Spring Boot
  - 多数据源配置
---

# SpringBoot 2.7.18 多数据源配置教程

本文主要介绍基于 SpringBoot 2.7.18 版本的多数据源配置方案，包括官方默认的 HikariCP、Druid 连接池以及动态切换等多种实现方式。

## 一、SpringBoot 官方默认 HikariCP 多数据源配置

### 1.1 项目依赖

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.18</version>
    <relativePath/>
</parent>

<groupId>com.universal.toolbox.file</groupId>
<artifactId>demo2</artifactId>
<version>0.0.1-SNAPSHOT</version>
<name>demo2</name>
<description>SpringBoot 多数据源配置示例</description>

<properties>
    <java.version>8</java.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jdbc</artifactId>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### 1.2 配置文件 application.yml

```yml
spring:
  datasource:
    # SpringBoot 2.7.18 默认使用 HikariCP 数据源
    type: com.zaxxer.hikari.HikariDataSource
    # 如果所有数据源都使用 MySQL，驱动可以提到公共配置
    driver-class-name: com.mysql.cj.jdbc.Driver
    
    # 主数据源配置
    master:
      jdbc-url: jdbc:mysql://localhost:3306/yichuang_mp?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false&allowMultiQueries=true
      username: root
      password: root
      pool-name: HikariCPMaster
      connection-test-query: SELECT 1
      minimum-idle: 10
      maximum-pool-size: 60
      max-lifetime: 1800000      # 连接最大存活时间(30分钟)
      connection-timeout: 600000  # 连接超时时间(10分钟)
      idle-timeout: 1600000      # 空闲连接最大时长(约27分钟)
      
    # 权限数据源配置
    auth:
      jdbc-url: jdbc:mysql://localhost:3306/yichuang_auth?serverTimezone=Asia/Shanghai&useUnicode=true&characterEncoding=utf8&useSSL=false&allowMultiQueries=true
      username: root
      password: root
      pool-name: HikariCPAuth
      connection-test-query: SELECT 1
      minimum-idle: 10
      maximum-pool-size: 60
      max-lifetime: 1800000
      connection-timeout: 600000
      idle-timeout: 600000       # 空闲连接最大时长(10分钟)
```

**配置说明：**
- `type`: 指定数据源类型，SpringBoot 2.7.18 默认为 HikariCP
- `driver-class-name`: 数据库驱动，可提到公共位置
- 自定义数据源名称下的配置属性全部为 HikariCP 数据源的属性值

### 1.3 主数据源配置类

```java
@Configuration
public class DataSourceConfig {
    
    /**
     * 配置主数据源
     * @Primary 注解表示这是主数据源
     */
    @Bean(name = "dataSource")
    @Qualifier("dataSource")
    @ConfigurationProperties(prefix = "spring.datasource.master")
    @Primary
    public DataSource masterDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    /**
     * 配置主事务管理器
     * 主事务时不需要指定事务名称，其他事务需要指定名称
     */
    @Bean(name = "transactionManager")
    @Primary
    public PlatformTransactionManager txManager(@Qualifier("dataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
    
    /**
     * 默认的 JdbcTemplate 模板
     */
    @Bean(name = "jdbcTemplate")
    @Primary
    public JdbcTemplate jdbcTemplate(@Qualifier("dataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

**关键说明：**
- `@ConfigurationProperties(prefix = "spring.datasource.master")` 会自动识别配置文件的属性值并注入到 `DataSourceBuilder.create().build()` 中
- 由于默认使用 HikariCP，生成的 dataSource 实例就是 `HikariDataSource`

### 1.4 权限数据源配置类

```java
@Configuration
public class AuthDataSourceConfig {
    
    @Bean(name = "authDataSource")
    @Qualifier("authDataSource")
    @ConfigurationProperties(prefix = "spring.datasource.auth")
    public DataSource authDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    /**
     * 配置权限事务管理器
     * 使用事务时需要指定事务名称
     * @example @Transactional(value = "authTransactionManager")
     */
    @Bean(name = "authTransactionManager")
    public PlatformTransactionManager txManager(@Qualifier("authDataSource") DataSource authDataSource) {
        return new DataSourceTransactionManager(authDataSource);
    }
    
    @Bean(name = "authJdbcTemplate")
    public JdbcTemplate authJdbcTemplate(@Qualifier("authDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
```

### 1.5 使用示例

```java
@Service
public class UserService {
    
    @Autowired
    @Qualifier("jdbcTemplate")
    private JdbcTemplate masterJdbcTemplate;
    
    @Autowired
    @Qualifier("authJdbcTemplate")
    private JdbcTemplate authJdbcTemplate;
    
    /**
     * 使用主数据源（默认事务管理器）
     */
    @Transactional
    public void saveUser(User user) {
        masterJdbcTemplate.update("INSERT INTO users ...", user.getName());
    }
    
    /**
     * 使用权限数据源（指定事务管理器）
     */
    @Transactional(value = "authTransactionManager")
    public void saveUserAuth(UserAuth userAuth) {
        authJdbcTemplate.update("INSERT INTO user_auth ...", userAuth.getUserId());
    }
}
```

### 1.6 HikariCP 数据源参数配置详解

| 属性名称 | 默认值 | 说明 | 验证重置规则 |
|---------|--------|------|-------------|
| `minimum-idle` | 10 | 最小空闲连接数 | 如果 minIdle<0 或 minIdle>maxPoolSize，则重置为 maxPoolSize |
| `maximum-pool-size` | 10 | 最大连接数 | 如果 maxPoolSize<1，会被重置 |
| `max-lifetime` | 1800000 | 连接最大存活时间(毫秒) | 不等于0且小于30秒会被重置为30分钟 |
| `connection-timeout` | 30000 | 连接超时时间(毫秒) | 小于250毫秒会被重置为30秒 |
| `idle-timeout` | 600000 | 空闲连接超时时间(毫秒) | 复杂验证规则，详见源码 |
| `connection-test-query` | null | 连接测试查询语句 | 验证数据库连接有效性的SQL |
| `pool-name` | HikariPool-1 | 连接池名称 | 用于标识连接池 |

**重要提示：**
- 建议 `max-lifetime` 设置比 MySQL 的 `wait_timeout` 短一些
- `connection-timeout` 不宜设置过长，避免应用响应缓慢
- 生产环境建议根据实际负载调整连接池参数

## 二、SpringBoot + MyBatis-Plus 动态数据源

### 2.1 dynamic-datasource 介绍

MyBatis-Plus 官方提供的动态数据源解决方案，支持：
- 数据源分组
- 多种数据库混用
- 支持自定义注解
- 支持 spel 表达式

**官方资源：**
- [官方教程](https://baomidou.com/guides/dynamic-datasource/)
- [GitHub 仓库](https://github.com/baomidou/dynamic-datasource)

### 2.2 快速配置

```xml
<!-- 添加 dynamic-datasource 依赖 -->
<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>dynamic-datasource-spring-boot-starter</artifactId>
    <version>3.6.1</version>
</dependency>
```

```yml
spring:
  datasource:
    dynamic:
      primary: master    # 设置默认数据源
      strict: false      # 严格匹配数据源
      datasource:
        master:
          url: jdbc:mysql://localhost:3306/master_db
          username: root
          password: root
          driver-class-name: com.mysql.cj.jdbc.Driver
        slave:
          url: jdbc:mysql://localhost:3306/slave_db
          username: root
          password: root
          driver-class-name: com.mysql.cj.jdbc.Driver
```

```java
@Service
public class UserService {
    
    @DS("master")
    public List<User> selectFromMaster() {
        // 使用 master 数据源
        return userMapper.selectList(null);
    }
    
    @DS("slave")
    public List<User> selectFromSlave() {
        // 使用 slave 数据源
        return userMapper.selectList(null);
    }
}
```

## 三、SpringBoot + Druid 多数据源配置

### 3.1 Druid 简介

阿里巴巴开源的数据库连接池，提供：
- 强大的监控功能
- SQL 防火墙
- 性能统计
- Web 监控界面

### 3.2 配置示例

```xml
<dependency>
    <groupId>com.alibaba</groupId>
    <artifactId>druid-spring-boot-starter</artifactId>
    <version>1.2.16</version>
</dependency>
```

**详细配置教程：**
- [SpringBoot + Druid 配置教程](https://www.jb51.net/program/317363peb.htm)
- [验证 Druid 配置是否生效](https://www.jb51.net/program/287882m0j.htm)

## 四、AbstractRoutingDataSource 实现动态切换

### 4.1 原理介绍

通过继承 Spring 的 `AbstractRoutingDataSource` 类，结合 ThreadLocal 实现数据源的动态路由。

### 4.2 实现方案

**核心组件：**
1. **DataSourceContextHolder**: 使用 ThreadLocal 存储数据源标识
2. **DynamicDataSource**: 继承 AbstractRoutingDataSource，实现路由逻辑  
3. **@DS 注解**: 自定义注解标识数据源
4. **AOP 切面**: 拦截方法调用，切换数据源

**详细实现教程：**
- [SpringBoot + Druid + ThreadLocal + AbstractRoutingDataSource 实现](https://blog.csdn.net/a342874650/article/details/135839117)
- [CSDN](https://blog.csdn.net/catoop/article/details/50575038)

## 五、方案选择建议

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **官方多数据源** | 简单的读写分离 | 配置简单、性能好 | 不支持动态切换 |
| **dynamic-datasource** | 复杂的多数据源场景 | 功能强大、易用 | 依赖第三方库 |
| **Druid 方案** | 需要监控和统计 | 监控功能强大 | 配置相对复杂 |
| **AbstractRoutingDataSource** | 自定义路由规则 | 灵活性最高 | 开发复杂度较高 |

## 六、最佳实践

### 6.1 连接池参数调优

```yml
spring:
  datasource:
    master:
      # 根据业务量调整连接池大小
      minimum-idle: 5
      maximum-pool-size: 20
      # 连接超时不宜过长
      connection-timeout: 30000
      # 定期检查连接有效性
      connection-test-query: SELECT 1
```

### 6.2 事务管理注意事项

1. **跨数据源事务**: 使用分布式事务（如 Atomikos）
2. **事务传播**: 注意不同数据源间的事务隔离
3. **异常处理**: 确保事务回滚正确处理

### 6.3 监控和维护

1. **连接池监控**: 定期检查连接池状态
2. **慢查询监控**: 配置 SQL 执行时间监控
3. **数据源健康检查**: 实现数据源可用性检测
