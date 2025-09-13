---
title: 缓存注解应用
category:
  - Web框架
tag:
  - Spring Boot
  - '@CachePut'
  - '@CacheEvict'
---

# SpringBoot 缓存注解应用指南

## 概述

Spring Boot为缓存提供了强大的支持，通过Spring定义的`org.springframework.cache.CacheManager`和`org.springframework.cache.Cache`接口来统一不同的缓存技术。Spring Boot提供了自动配置多个CacheManager实现，在不使用任何额外配置的情况下，默认使用SimpleCacheConfiguration。

## 缓存注解详解

### 核心缓存注解

Spring Boot提供了几个关键的缓存注解来管理缓存操作：

#### @Cacheable
用于查询操作，如果缓存中存在数据则直接返回缓存结果，否则执行方法并将结果缓存。

**特点：**
- 首次调用时执行方法并缓存结果
- 后续调用直接从缓存中获取数据
- 支持条件缓存和自定义key

**示例：**
```java
@Cacheable(value="guavaDemo", key="#id + 'dataMap'")
public String query(Long id) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    System.out.println(sdf.format(new Date()) + " : query id is " + id);
    return dataMap.get(id);
}
```

#### @CachePut
用于更新缓存，无论缓存中是否存在数据都会执行方法，并将结果更新到缓存中。

**特点：**
- 总是执行方法
- 将方法返回值更新到缓存
- 常用于数据的插入和更新操作

**示例：**
```java
@CachePut(value="guavaDemo", key="#id + 'dataMap'")
public String put(Long id, String value) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    System.out.println(sdf.format(new Date()) + " : add data, id is " + id);
    dataMap.put(id, value);
    return value;
}
```

#### @CacheEvict
用于删除缓存中的数据。

**特点：**
- 删除指定的缓存条目
- 可以删除单个缓存项或清空整个缓存
- 支持条件删除

**示例：**
```java
@CacheEvict(value="guavaDemo", key="#id + 'dataMap'")
public void remove(Long id) {
    SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
    System.out.println(sdf.format(new Date()) + " : remove id is " + id + " data");
    dataMap.remove(id);
}
```

#### @EnableCaching
启用缓存功能的配置注解，需要在配置类上添加。

**示例：**
```java
@SpringBootApplication
@EnableCaching
public class App {
    // 应用启动类
}
```

## 缓存注解对比表格

| 注解 | 作用 | 执行时机 | 返回值处理 | 典型用途 | 关键特性 |
|------|------|----------|------------|----------|----------|
| `@Cacheable` | 缓存查询结果 | 缓存不存在时执行方法 | 将返回值存入缓存 | 查询操作 | 缓存命中时不执行方法 |
| `@CachePut` | 更新缓存数据 | 总是执行方法 | 将返回值更新到缓存 | 插入/更新操作 | 无论缓存是否存在都执行 |
| `@CacheEvict` | 删除缓存数据 | 执行方法后删除缓存 | 不缓存返回值 | 删除操作 | 支持删除单个或全部缓存 |
| `@EnableCaching` | 启用缓存支持 | 应用启动时 | - | 配置类 | 必须添加才能使用缓存功能 |

## Redis缓存实战应用

### 项目依赖配置

在`pom.xml`中添加必要的依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <version>1.3.5.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-cache</artifactId>
        <version>1.3.5.RELEASE</version>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-redis</artifactId>
        <version>1.3.5.RELEASE</version>
    </dependency>
</dependencies>
```

### Redis配置

在`application.yml`中配置Redis连接信息：

```yaml
spring:
  cache:
    cache-names: redisDemo
  # Redis配置
  redis:
    host: localhost          # Redis服务器地址
    port: 6379              # Redis服务器端口
    pool.max-idle: 8        # 连接池最大空闲连接数
    pool.min-idle: 1        # 连接池最小空闲连接数
    pool.max-active: 8      # 连接池最大活跃连接数
    pool.max-wait: -1       # 连接池最大等待时间（-1表示无限等待）
```

### 缓存服务实现

```java
@Component
public class RedisDataCache {
    
    private Map<Long, String> dataMap = new HashMap<>();
    
    @PostConstruct
    public void init() {
        dataMap.put(1L, "张三");
        dataMap.put(2L, "李四");
        dataMap.put(3L, "王五");
    }
    
    /**
     * 查询数据 - 使用Redis缓存
     */
    @Cacheable(value="redisDemo", key="#id + 'dataMap'")
    public String query(Long id) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println(sdf.format(new Date()) + " : 从数据库查询 id = " + id);
        return dataMap.get(id);
    }
    
    /**
     * 更新数据 - 同时更新Redis缓存
     */
    @CachePut(value="redisDemo", key="#id + 'dataMap'")
    public String update(Long id, String value) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println(sdf.format(new Date()) + " : 更新数据 id = " + id);
        dataMap.put(id, value);
        return value;
    }
    
    /**
     * 删除数据 - 同时删除Redis缓存
     */
    @CacheEvict(value="redisDemo", key="#id + 'dataMap'")
    public void delete(Long id) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        System.out.println(sdf.format(new Date()) + " : 删除数据 id = " + id);
        dataMap.remove(id);
    }
    
    /**
     * 清空所有缓存
     */
    @CacheEvict(value="redisDemo", allEntries=true)
    public void clearAll() {
        System.out.println("清空所有缓存");
        dataMap.clear();
    }
}
```

### 控制器实现

```java
@SpringBootApplication
@RestController
@EnableCaching
public class App {
    
    @Autowired
    private RedisDataCache redisDataCache;
    
    public static void main(String[] args) {
        SpringApplication.run(App.class, args);
    }
    
    @RequestMapping("/get")
    public String query(@RequestParam Long id) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return sdf.format(new Date()) + " : value is " + redisDataCache.query(id);
    }
    
    @RequestMapping("/put")
    public String update(@RequestParam Long id, @RequestParam String value) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        return sdf.format(new Date()) + " : updated value is " + redisDataCache.update(id, value);
    }
    
    @RequestMapping("/delete")
    public String delete(@RequestParam Long id) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        redisDataCache.delete(id);
        return sdf.format(new Date()) + " : deleted successfully";
    }
    
    @RequestMapping("/clear")
    public String clearAll() {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
        redisDataCache.clearAll();
        return sdf.format(new Date()) + " : cleared all cache";
    }
}
```

## 最佳实践和注意事项

### 1. 缓存策略选择
- **读多写少场景**：优先使用`@Cacheable`
- **实时性要求高**：使用`@CachePut`确保数据一致性
- **数据变更频繁**：合理使用`@CacheEvict`清理过期数据

### 2. 缓存Key设计
```java
// 推荐：使用有意义的key组合
@Cacheable(value="userCache", key="#userId + ':' + #type")
public User getUserInfo(Long userId, String type) {
    // 业务逻辑
}

// 推荐：使用SpEL表达式
@Cacheable(value="productCache", key="T(String).valueOf(#product.id).concat(':').concat(#product.category)")
public Product getProduct(Product product) {
    // 业务逻辑
}
```

### 3. 缓存配置优化（Spring Boot 2.7.18）
```yaml
spring:
  cache:
    redis:
      time-to-live: 600000      # 缓存过期时间（毫秒）
      cache-null-values: false  # 是否缓存空值
      key-prefix: "myapp:"      # 缓存key前缀
      use-key-prefix: true      # 是否使用前缀
  data:
    redis:
      timeout: 2000ms           # 连接超时时间
      lettuce:                  # Lettuce连接池配置
        pool:
          max-active: 20        # 最大连接数
          max-idle: 10          # 最大空闲连接
          min-idle: 5           # 最小空闲连接
          max-wait: 2000ms      # 最大等待时间
```

### 4. 多缓存实现切换
如果项目中同时存在多种缓存实现（如Guava和Redis），可以通过配置指定使用的缓存类型：

```yaml
spring:
  cache:
    type: redis  # 或者 guava、caffeine等
```

### 5. 异常处理
```java
@Cacheable(value="dataCache", key="#id", unless="#result == null")
public String queryWithNullCheck(Long id) {
    // 业务逻辑，避免缓存null值
}

@CacheEvict(value="dataCache", key="#id", beforeInvocation=true)
public void deleteBeforeExecution(Long id) {
    // 在方法执行前就清除缓存，避免方法执行失败导致缓存不一致
}
```

## 总结

Spring Boot的缓存注解提供了简单而强大的缓存解决方案。通过合理使用`@Cacheable`、`@CachePut`和`@CacheEvict`注解，结合Redis等缓存实现，可以显著提升应用性能。在实际应用中，需要根据业务特点选择合适的缓存策略，并注意缓存一致性和异常处理等问题。