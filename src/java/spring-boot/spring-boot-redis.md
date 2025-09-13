---
title: SpringBoot集成Redis
category:
  - Web框架
tag:
  - redis
---

# SpringBoot 集成Redis指南

## 概述

本文档详细介绍了在SpringBoot项目中集成Redis的完整流程，包括依赖配置、Redis配置类、消息监听器以及实用的Redis工具类。通过本指南，您可以快速在SpringBoot项目中集成Redis，并实现缓存、消息队列等功能。

## 1. 添加Maven依赖

首先，在`pom.xml`文件中添加必要的依赖：

```xml
<!-- Spring Boot 依赖 start -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- Redis 依赖 start -->
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson</artifactId>
</dependency>
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-pool2</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<!-- Redis 依赖 end -->

<!-- 工具类依赖 -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
</dependency>
```

### 依赖说明

- `spring-boot-starter-data-redis`：SpringBoot的Redis启动器，提供Redis操作的基础功能
- `commons-pool2`：连接池依赖，用于管理Redis连接
- `redisson`：Redis的Java客户端，提供分布式锁等高级功能
- `spring-boot-starter-aop`：AOP支持，用于缓存注解等功能


## 2. Redis配置文件和配置类

### 配置文件

```yml
  #  redis 的单机版配置
  redis:
    database: 0
    #host: 192.168.122.191
    host: 127.0.0.1
    port: 6379
    #password:
    timeout: 3600
    lettuce:
      pool:
        max-active: 10 #最大连接数
        max-idle: 8 #最大空闲连接 默认8
        max-wait: -1ms #默认-1 最大连接阻塞等待时间
        min-idle: 0 #最小空闲连接
```

### 配置类

创建Redis配置类`RedisConfig`，配置缓存管理器、序列化方式和消息监听器：

```java
/**
 * Redis配置类
 *
 * @author daizhao
 * @site https://miliqkdoc.motopa.cn/
 * @date 2020/08/15 10:07
 */
@Configuration
@EnableCaching
@RequiredArgsConstructor
@Slf4j
public class RedisConfig extends CachingConfigurerSupport {

    @Resource
    private LettuceConnectionFactory lettuceConnectionFactory;

    /**
     * 配置缓存管理器
     */
    @Bean
    public CacheManager cacheManager() {
        RedisCacheConfiguration configuration = RedisCacheConfiguration.defaultCacheConfig();
        configuration = configuration
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(jackson2RedisSerializer()))
                .entryTtl(Duration.ofDays(30)); // 设置@Cacheable序列化方式和过期时间

        RedisCacheManager rcm = RedisCacheManager
                .builder(lettuceConnectionFactory)
                .cacheDefaults(configuration)
                .build();
        return rcm;
    }

    /**
     * 自定义生成redis-key
     */
    @Override
    public KeyGenerator keyGenerator() {
        return (o, method, objects) -> {
            StringBuilder sb = new StringBuilder();
            sb.append(o.getClass().getName()).append(".");
            sb.append(method.getName()).append(".");
            for (Object obj : objects) {
                sb.append(obj.toString());
            }
            System.out.println("keyGenerator=" + sb.toString());
            return sb.toString();
        };
    }

    /**
     * 配置RedisTemplate
     */
    @Bean
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory lettuceConnectionFactory) {
        log.info("[redis config init]");
        Jackson2JsonRedisSerializer<?> jackson2JsonRedisSerializer = this.jackson2RedisSerializer();
        RedisTemplate<String, Object> redisTemplate = new RedisTemplate();
        
        // 注入redis数据源 采用内置的lettuce连接器
        redisTemplate.setConnectionFactory(lettuceConnectionFactory);
        
        // 配置序列化器
        RedisSerializer<String> stringSerializer = new StringRedisSerializer();
        redisTemplate.setKeySerializer(stringSerializer);
        redisTemplate.setValueSerializer(jackson2JsonRedisSerializer);
        redisTemplate.setHashKeySerializer(stringSerializer);
        redisTemplate.setHashValueSerializer(jackson2JsonRedisSerializer);
        
        redisTemplate.afterPropertiesSet();
        return redisTemplate;
    }

    /**
     * Redis消息监听容器
     */
    @Bean
    public RedisMessageListenerContainer redisContainer(RedisConnectionFactory redisConnectionFactory, 
                                                       MessageListenerAdapter commonListenerAdapter) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(redisConnectionFactory);
        container.addMessageListener(commonListenerAdapter, new ChannelTopic(JasperConstants.JASPER_DEFAULT_REDIS_TOPIC));
        return container;
    }

    /**
     * 消息监听器的适配器
     */
    @Bean
    MessageListenerAdapter commonListenerAdapter(DefaultMessageDelegate defaultMessageDelegate) {
        MessageListenerAdapter messageListenerAdapter = new MessageListenerAdapter(defaultMessageDelegate, "handleMessage");
        messageListenerAdapter.setSerializer(this.jackson2RedisSerializer());
        return messageListenerAdapter;
    }

    /**
     * Jackson2Json序列化器配置
     */
    public Jackson2JsonRedisSerializer<?> jackson2RedisSerializer() {
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(Object.class);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.enableDefaultTyping(ObjectMapper.DefaultTyping.NON_FINAL);

        jackson2JsonRedisSerializer.setObjectMapper(objectMapper);
        return jackson2JsonRedisSerializer;
    }
}
```

### 配置说明

- `@EnableCaching`：启用Spring缓存功能
- `CacheManager`：配置缓存管理器，设置序列化方式和默认过期时间
- `KeyGenerator`：自定义缓存key生成策略
- `RedisTemplate`：配置Redis操作模板，设置序列化器
- 消息监听相关配置：支持Redis发布订阅功能

## 3. 消息监听器

创建消息委托类`DefaultMessageDelegate`，处理Redis消息订阅：

```java
/**
 * 消息的委托类
 */
@Component
@Slf4j
@NoArgsConstructor
@EqualsAndHashCode
public class DefaultMessageDelegate {

    public void handleMessage(Map message) {
        Object handlerName = message.get("handlerName");
        RedisMessageDelegate redisMessageDelegate = SpringContextUtil.getBean(handlerName.toString(), RedisMessageDelegate.class);
        if (ObjectUtil.isNotEmpty(redisMessageDelegate)) {
            redisMessageDelegate.handleMessage(message);
        } else {
            log.error("没有找到订阅者！");
        }
    }
}
```

这个类负责处理Redis消息队列中的消息，根据消息中的`handlerName`动态获取对应的处理器进行消息处理。

## 4. Redis工具类

创建功能完善的Redis工具类`RedisUtil`，封装常用的Redis操作：

```java
/**
 * Redis工具类
 * @Author Scott
 */
@Component
public class RedisUtil {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    // ============================通用操作=============================
    
    /**
     * 指定缓存失效时间
     */
    public boolean expire(String key, long time) {
        try {
            if (time > 0) {
                redisTemplate.expire(key, time, TimeUnit.SECONDS);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 根据key获取过期时间
     */
    public long getExpire(String key) {
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }

    /**
     * 判断key是否存在
     */
    public boolean hasKey(String key) {
        try {
            return redisTemplate.hasKey(key);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 删除缓存
     */
    @SuppressWarnings("unchecked")
    public void del(String... key) {
        if (key != null && key.length > 0) {
            if (key.length == 1) {
                redisTemplate.delete(key[0]);
            } else {
                redisTemplate.delete(Arrays.asList(key));
            }
        }
    }

    // ============================String操作=============================
    
    /**
     * 普通缓存获取
     */
    public Object get(String key) {
        return key == null ? null : redisTemplate.opsForValue().get(key);
    }

    /**
     * 普通缓存放入
     */
    public boolean set(String key, Object value) {
        try {
            redisTemplate.opsForValue().set(key, value);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 普通缓存放入并设置时间
     */
    public boolean set(String key, Object value, long time) {
        try {
            if (time > 0) {
                redisTemplate.opsForValue().set(key, value, time, TimeUnit.SECONDS);
            } else {
                set(key, value);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 递增操作
     */
    public long incr(String key, long delta) {
        if (delta < 0) {
            throw new RuntimeException("递增因子必须大于0");
        }
        return redisTemplate.opsForValue().increment(key, delta);
    }

    /**
     * 递减操作
     */
    public long decr(String key, long delta) {
        if (delta < 0) {
            throw new RuntimeException("递减因子必须大于0");
        }
        return redisTemplate.opsForValue().increment(key, -delta);
    }

    // ================================Hash操作=================================
    
    /**
     * Hash获取
     */
    public Object hget(String key, String item) {
        return redisTemplate.opsForHash().get(key, item);
    }

    /**
     * 获取hashKey对应的所有键值
     */
    public Map<Object, Object> hmget(String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    /**
     * Hash设置
     */
    public boolean hmset(String key, Map<String, Object> map) {
        try {
            redisTemplate.opsForHash().putAll(key, map);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Hash设置并设置时间
     */
    public boolean hmset(String key, Map<String, Object> map, long time) {
        try {
            redisTemplate.opsForHash().putAll(key, map);
            if (time > 0) {
                expire(key, time);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ============================Set操作=============================
    
    /**
     * 根据key获取Set中的所有值
     */
    public Set<Object> sGet(String key) {
        try {
            return redisTemplate.opsForSet().members(key);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 将数据放入set缓存
     */
    public long sSet(String key, Object... values) {
        try {
            return redisTemplate.opsForSet().add(key, values);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    // ===============================List操作=================================
    
    /**
     * 获取list缓存的内容
     */
    public List<Object> lGet(String key, long start, long end) {
        try {
            return redisTemplate.opsForList().range(key, start, end);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 将list放入缓存
     */
    public boolean lSet(String key, Object value) {
        try {
            redisTemplate.opsForList().rightPush(key, value);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ============================高级操作=============================
    
    /**
     * 使用scan命令获取指定前缀的key
     * 替代keys命令，避免阻塞Redis
     */
    public List<String> scan(String pattern) {
        ScanOptions options = ScanOptions.scanOptions().match(pattern).count(1000).build();
        List<String> keys = new ArrayList<>();
        try (Cursor<String> cursor = redisTemplate.scan(options)) {
            while (cursor.hasNext()) {
                keys.add(cursor.next());
            }
        }
        return keys;
    }

    /**
     * 删除指定前缀的一系列key
     */
    public void removeAll(String keyPrefix) {
        try {
            Set<String> keys = keys(keyPrefix);
            redisTemplate.delete(keys);
        } catch (Throwable e) {
            e.printStackTrace();
        }
    }

    /**
     * 获取指定前缀的key集合
     */
    private Set<String> keys(String keyPrefix) {
        String realKey = keyPrefix + "*";
        try {
            return redisTemplate.execute((RedisCallback<Set<String>>) connection -> {
                Set<String> binaryKeys = new HashSet<>();
                Cursor<byte[]> cursor = connection.scan(
                    ScanOptions.scanOptions().match(realKey).count(Integer.MAX_VALUE).build());
                while (cursor.hasNext()) {
                    binaryKeys.add(new String(cursor.next()));
                }
                return binaryKeys;
            });
        } catch (Throwable e) {
            e.printStackTrace();
        }
        return null;
    }
}
```

### 工具类功能特点

- **完整的数据类型支持**：支持String、Hash、Set、List等Redis数据类型操作
- **性能优化**：使用scan命令替代keys命令，避免Redis阻塞
- **异常处理**：完善的异常处理机制，提高系统稳定性
- **过期时间管理**：支持设置key的过期时间
- **批量操作**：支持批量删除、批量查询等操作

## 5. 应用配置

在`application.yml`中配置Redis连接信息：

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: your_password
    database: 0
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
        max-wait: -1ms
    timeout: 3000ms
```

## 6. 使用示例

### 6.1 基本缓存操作

```java
@Service
public class UserService {
    
    @Autowired
    private RedisUtil redisUtil;
    
    public User getUserById(Long id) {
        String key = "user:" + id;
        User user = (User) redisUtil.get(key);
        if (user == null) {
            // 从数据库查询
            user = userRepository.findById(id);
            // 缓存30分钟
            redisUtil.set(key, user, 1800);
        }
        return user;
    }
}
```

### 6.2 使用注解缓存

```java
@Service
public class ProductService {
    
    @Cacheable(value = "products", key = "#id")
    public Product getProductById(Long id) {
        return productRepository.findById(id);
    }
    
    @CacheEvict(value = "products", key = "#product.id")
    public void updateProduct(Product product) {
        productRepository.save(product);
    }
}
```

### 6.3 消息发布订阅

```java
@Service
public class MessageService {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public void publishMessage(String channel, Object message) {
        redisTemplate.convertAndSend(channel, message);
    }
}
```

## 7. 注意事项

1. **序列化配置**：确保序列化器配置正确，避免数据存储和读取问题
2. **连接池配置**：根据实际业务需求调整连接池参数
3. **过期时间设置**：合理设置缓存过期时间，避免内存占用过多
4. **异常处理**：在生产环境中完善异常处理逻辑
5. **性能监控**：监控Redis性能，及时发现和解决问题

## 8. 总结

通过以上配置和实现，您可以在SpringBoot项目中完整集成Redis功能，包括：

- 基本的缓存操作
- 注解式缓存管理
- 消息发布订阅
- 分布式锁（通过Redisson）
- 性能优化的批量操作

这套配置在生产环境中经过验证，具有良好的稳定性和性能表现。根据具体业务需求，可以进一步扩展和优化相关功能。

### 参考资料

实战项目如下：

- jasper
- miliqk