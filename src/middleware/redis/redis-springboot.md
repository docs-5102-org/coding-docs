---
title: 实战：SpringBoot集成Redis教程
category:
  - 中间件
tag:
  - Redis
---

# 实战：SpringBoot集成Redis教程

## 1. 项目依赖配置

首先在 `pom.xml` 中添加必要的依赖：

```xml
<dependencies>
    <!-- SpringBoot Starter Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- SpringBoot Redis Starter (包含spring-data-redis) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <!-- Lettuce连接池 -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-pool2</artifactId>
    </dependency>
    
    <!-- JSON序列化支持 -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
    
    <!-- Kryo序列化支持(可选) -->
    <dependency>
        <groupId>com.esotericsoftware</groupId>
        <artifactId>kryo</artifactId>
        <version>5.4.0</version>
    </dependency>
</dependencies>
```

## 2. application.yml 配置

```yaml
spring:
  redis:
    # Redis服务器地址
    host: localhost
    # Redis服务器端口
    port: 6379
    # Redis数据库索引（默认为0）
    database: 0
    # Redis服务器连接密码（默认为空）
    password: 
    # 连接超时时间
    timeout: 10000ms
    
    # Lettuce连接池配置
    lettuce:
      pool:
        # 连接池最大连接数
        max-active: 20
        # 连接池最大阻塞等待时间（使用负值表示没有限制）
        max-wait: -1ms
        # 连接池中的最大空闲连接
        max-idle: 10
        # 连接池中的最小空闲连接
        min-idle: 5
        
    # 集群配置（如果使用集群）
    # cluster:
    #   nodes:
    #     - 127.0.0.1:7001
    #     - 127.0.0.1:7002
    #     - 127.0.0.1:7003
    #   max-redirects: 3
```

## 3. Redis配置类 - 多种序列化方式

```java
package com.example.config;

import com.fasterxml.jackson.annotation.JsonAutoDetect;
import com.fasterxml.jackson.annotation.PropertyAccessor;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.serializer.*;

/**
 * Redis配置类 - 提供多种序列化方式的RedisTemplate
 */
@Configuration
public class RedisConfig {

    /**
     * 默认的RedisTemplate配置 - 使用Jackson序列化
     */
    @Bean
    @Primary
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // 使用Jackson2JsonRedisSerializer来序列化和反序列化redis的value值
        Jackson2JsonRedisSerializer<Object> jackson2JsonRedisSerializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        objectMapper.activateDefaultTyping(LaissezFaireSubTypeValidator.instance, ObjectMapper.DefaultTyping.NON_FINAL);
        jackson2JsonRedisSerializer.setObjectMapper(objectMapper);

        // 使用StringRedisSerializer来序列化和反序列化redis的key值
        StringRedisSerializer stringRedisSerializer = new StringRedisSerializer();
        
        // 设置key采用String的序列化方式
        template.setKeySerializer(stringRedisSerializer);
        // 设置hash的key也采用String的序列化方式
        template.setHashKeySerializer(stringRedisSerializer);
        // 设置value采用Jackson的序列化方式
        template.setValueSerializer(jackson2JsonRedisSerializer);
        // 设置hash的value也采用Jackson的序列化方式
        template.setHashValueSerializer(jackson2JsonRedisSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * String类型专用的RedisTemplate
     */
    @Bean
    public StringRedisTemplate stringRedisTemplate(RedisConnectionFactory connectionFactory) {
        return new StringRedisTemplate(connectionFactory);
    }

    /**
     * 使用JDK序列化的RedisTemplate
     */
    @Bean("jdkRedisTemplate")
    public RedisTemplate<String, Object> jdkRedisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // JDK序列化方式
        JdkSerializationRedisSerializer jdkSerializer = new JdkSerializationRedisSerializer();
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(jdkSerializer);
        template.setHashValueSerializer(jdkSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * 使用GenericJackson2JsonRedisSerializer的RedisTemplate
     * 优点：不需要指定具体类型，序列化时会保存类型信息
     */
    @Bean("genericJacksonRedisTemplate")
    public RedisTemplate<String, Object> genericJacksonRedisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        GenericJackson2JsonRedisSerializer genericSerializer = new GenericJackson2JsonRedisSerializer();
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(genericSerializer);
        template.setHashValueSerializer(genericSerializer);
        
        template.afterPropertiesSet();
        return template;
    }

    /**
     * 使用FastJson序列化的RedisTemplate（需要添加FastJson依赖）
     */
    @Bean("fastJsonRedisTemplate")
    public RedisTemplate<String, Object> fastJsonRedisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // 自定义FastJson序列化器
        GenericFastJsonRedisSerializer fastJsonSerializer = new GenericFastJsonRedisSerializer();
        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        
        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(fastJsonSerializer);
        template.setHashValueSerializer(fastJsonSerializer);
        
        template.afterPropertiesSet();
        return template;
    }
}
```

## 4. 序列化方式对比说明

| 序列化方式 | 优点 | 缺点 | 适用场景 |
|-----------|------|------|----------|
| **StringRedisSerializer** | 简单直接，可读性强 | 只能处理String类型 | 存储简单的字符串数据 |
| **JdkSerializationRedisSerializer** | JDK原生，兼容性好 | 序列化后体积大，效率低 | 兼容老系统，不关心性能 |
| **Jackson2JsonRedisSerializer** | 人可读，跨语言兼容 | 需要指定具体类型 | 明确知道存储对象类型 |
| **GenericJackson2JsonRedisSerializer** | 不需要指定类型，包含类型信息 | 序列化结果包含类名信息 | 存储不同类型对象的场景 |
| **GenericFastJsonRedisSerializer** | 性能好，支持复杂类型 | 依赖FastJson库 | 对性能要求较高的场景 |

## 5. Redis工具类模版

```java
package com.example.utils;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.*;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * Redis工具类
 * 封装了Redis的常用操作
 */
@Component
public class RedisUtil {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    // =============================通用操作============================

    /**
     * 指定缓存失效时间
     * @param key 键
     * @param time 时间(秒)
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
     * @param key 键 不能为null
     * @return 时间(秒) 返回0代表为永久有效
     */
    public long getExpire(String key) {
        return redisTemplate.getExpire(key, TimeUnit.SECONDS);
    }

    /**
     * 判断key是否存在
     * @param key 键
     * @return true 存在 false不存在
     */
    public boolean hasKey(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 删除缓存
     * @param key 可以传一个值 或多个
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

    /**
     * 根据pattern获取所有的key
     * @param pattern 模式
     * @return key集合
     */
    public Set<String> keys(String pattern) {
        return redisTemplate.keys(pattern);
    }

    // ============================String=============================

    /**
     * 普通缓存获取
     * @param key 键
     * @return 值
     */
    public Object get(String key) {
        return key == null ? null : redisTemplate.opsForValue().get(key);
    }

    /**
     * 普通缓存放入
     * @param key 键
     * @param value 值
     * @return true成功 false失败
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
     * @param key 键
     * @param value 值
     * @param time 时间(秒) time要大于0 如果time小于等于0 将设置无限期
     * @return true成功 false 失败
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
     * 递增
     * @param key 键
     * @param delta 要增加几(大于0)
     */
    public long incr(String key, long delta) {
        if (delta < 0) {
            throw new RuntimeException("递增因子必须大于0");
        }
        return redisTemplate.opsForValue().increment(key, delta);
    }

    /**
     * 递减
     * @param key 键
     * @param delta 要减少几(小于0)
     */
    public long decr(String key, long delta) {
        if (delta < 0) {
            throw new RuntimeException("递减因子必须大于0");
        }
        return redisTemplate.opsForValue().increment(key, -delta);
    }

    /**
     * 批量获取
     * @param keys 键集合
     * @return 值列表
     */
    public List<Object> multiGet(Collection<String> keys) {
        return redisTemplate.opsForValue().multiGet(keys);
    }

    /**
     * 批量设置
     * @param map 键值对map
     */
    public void multiSet(Map<String, Object> map) {
        redisTemplate.opsForValue().multiSet(map);
    }

    // ================================Hash=================================

    /**
     * HashGet
     * @param key 键 不能为null
     * @param item 项 不能为null
     */
    public Object hget(String key, String item) {
        return redisTemplate.opsForHash().get(key, item);
    }

    /**
     * 获取hashKey对应的所有键值
     * @param key 键
     * @return 对应的多个键值
     */
    public Map<Object, Object> hmget(String key) {
        return redisTemplate.opsForHash().entries(key);
    }

    /**
     * HashSet
     * @param key 键
     * @param map 对应多个键值
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
     * HashSet 并设置时间
     * @param key 键
     * @param map 对应多个键值
     * @param time 时间(秒)
     * @return true成功 false失败
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

    /**
     * 向一张hash表中放入数据,如果不存在将创建
     * @param key 键
     * @param item 项
     * @param value 值
     * @return true 成功 false失败
     */
    public boolean hset(String key, String item, Object value) {
        try {
            redisTemplate.opsForHash().put(key, item, value);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 向一张hash表中放入数据,如果不存在将创建
     * @param key 键
     * @param item 项
     * @param value 值
     * @param time 时间(秒) 注意:如果已存在的hash表有时间,这里将会替换原有的时间
     * @return true 成功 false失败
     */
    public boolean hset(String key, String item, Object value, long time) {
        try {
            redisTemplate.opsForHash().put(key, item, value);
            if (time > 0) {
                expire(key, time);
            }
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 删除hash表中的值
     * @param key 键 不能为null
     * @param item 项 可以使多个 不能为null
     */
    public void hdel(String key, Object... item) {
        redisTemplate.opsForHash().delete(key, item);
    }

    /**
     * 判断hash表中是否有该项的值
     * @param key 键 不能为null
     * @param item 项 不能为null
     * @return true 存在 false不存在
     */
    public boolean hHasKey(String key, String item) {
        return redisTemplate.opsForHash().hasKey(key, item);
    }

    /**
     * hash递增 如果不存在,就会创建一个 并把新增后的值返回
     * @param key 键
     * @param item 项
     * @param by 要增加几(大于0)
     */
    public double hincr(String key, String item, double by) {
        return redisTemplate.opsForHash().increment(key, item, by);
    }

    /**
     * hash递减
     * @param key 键
     * @param item 项
     * @param by 要减少记(小于0)
     */
    public double hdecr(String key, String item, double by) {
        return redisTemplate.opsForHash().increment(key, item, -by);
    }

    // ============================Set=============================

    /**
     * 根据key获取Set中的所有值
     * @param key 键
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
     * 根据value从一个set中查询,是否存在
     * @param key 键
     * @param value 值
     * @return true 存在 false不存在
     */
    public boolean sHasKey(String key, Object value) {
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForSet().isMember(key, value));
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 将数据放入set缓存
     * @param key 键
     * @param values 值 可以是多个
     * @return 成功个数
     */
    public long sSet(String key, Object... values) {
        try {
            return redisTemplate.opsForSet().add(key, values);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * 将set数据放入缓存
     * @param key 键
     * @param time 时间(秒)
     * @param values 值 可以是多个
     * @return 成功个数
     */
    public long sSetAndTime(String key, long time, Object... values) {
        try {
            Long count = redisTemplate.opsForSet().add(key, values);
            if (time > 0) expire(key, time);
            return count;
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * 获取set缓存的长度
     * @param key 键
     */
    public long sGetSetSize(String key) {
        try {
            return redisTemplate.opsForSet().size(key);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * 移除值为value的
     * @param key 键
     * @param values 值 可以是多个
     * @return 移除的个数
     */
    public long setRemove(String key, Object... values) {
        try {
            return redisTemplate.opsForSet().remove(key, values);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    // ===============================List=================================

    /**
     * 获取list缓存的内容
     * @param key 键
     * @param start 开始
     * @param end 结束 0 到 -1代表所有值
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
     * 获取list缓存的长度
     * @param key 键
     */
    public long lGetListSize(String key) {
        try {
            return redisTemplate.opsForList().size(key);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * 通过索引 获取list中的值
     * @param key 键
     * @param index 索引 index>=0时， 0 表头，1 第二个元素，依次类推；index<0时，-1，表尾，-2倒数第二个元素，依次类推
     */
    public Object lGetIndex(String key, long index) {
        try {
            return redisTemplate.opsForList().index(key, index);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 将list放入缓存
     * @param key 键
     * @param value 值
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

    /**
     * 将list放入缓存
     * @param key 键
     * @param value 值
     * @param time 时间(秒)
     */
    public boolean lSet(String key, Object value, long time) {
        try {
            redisTemplate.opsForList().rightPush(key, value);
            if (time > 0) expire(key, time);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 将list放入缓存
     * @param key 键
     * @param value 值
     */
    public boolean lSet(String key, List<Object> value) {
        try {
            redisTemplate.opsForList().rightPushAll(key, value);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 将list放入缓存
     * @param key 键
     * @param value 值
     * @param time 时间(秒)
     */
    public boolean lSet(String key, List<Object> value, long time) {
        try {
            redisTemplate.opsForList().rightPushAll(key, value);
            if (time > 0) expire(key, time);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 根据索引修改list中的某条数据
     * @param key 键
     * @param index 索引
     * @param value 值
     */
    public boolean lUpdateIndex(String key, long index, Object value) {
        try {
            redisTemplate.opsForList().set(key, index, value);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 移除N个值为value
     * @param key 键
     * @param count 移除多少个
     * @param value 值
     * @return 移除的个数
     */
    public long lRemove(String key, long count, Object value) {
        try {
            return redisTemplate.opsForList().remove(key, count, value);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    // ===============================ZSet=================================

    /**
     * 添加到有序集合
     * @param key 键
     * @param value 值
     * @param score 分数
     * @return 是否成功
     */
    public boolean zAdd(String key, Object value, double score) {
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForZSet().add(key, value, score));
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 批量添加到有序集合
     * @param key 键
     * @param scoreMembers 分数-成员对
     * @return 添加的个数
     */
    public long zAdd(String key, Set<ZSetOperations.TypedTuple<Object>> scoreMembers) {
        try {
            return redisTemplate.opsForZSet().add(key, scoreMembers);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * 获取有序集合指定范围的元素（按分数排序）
     * @param key 键
     * @param start 开始位置
     * @param end 结束位置
     * @return 元素集合
     */
    public Set<Object> zRange(String key, long start, long end) {
        try {
            return redisTemplate.opsForZSet().range(key, start, end);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 获取有序集合指定分数范围的元素
     * @param key 键
     * @param min 最小分数
     * @param max 最大分数
     * @return 元素集合
     */
    public Set<Object> zRangeByScore(String key, double min, double max) {
        try {
            return redisTemplate.opsForZSet().rangeByScore(key, min, max);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 获取有序集合的大小
     * @param key 键
     * @return 集合大小
     */
    public long zSize(String key) {
        try {
            return redisTemplate.opsForZSet().size(key);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * 获取指定成员的分数
     * @param key 键
     * @param member 成员
     * @return 分数
     */
    public Double zScore(String key, Object member) {
        try {
            return redisTemplate.opsForZSet().score(key, member);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 删除有序集合中的成员
     * @param key 键
     * @param members 成员
     * @return 删除的个数
     */
    public long zRemove(String key, Object... members) {
        try {
            return redisTemplate.opsForZSet().remove(key, members);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    // ===============================分布式锁=================================

    /**
     * 尝试获取分布式锁
     * @param lockKey 锁的key
     * @param requestId 请求标识
     * @param expireTime 过期时间
     * @return 是否获取成功
     */
    public boolean tryGetDistributedLock(String lockKey, String requestId, long expireTime) {
        try {
            Boolean result = redisTemplate.opsForValue().setIfAbsent(lockKey, requestId, expireTime, TimeUnit.SECONDS);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 释放分布式锁
     * @param lockKey 锁的key
     * @param requestId 请求标识
     * @return 是否释放成功
     */
    public boolean releaseDistributedLock(String lockKey, String requestId) {
        try {
            String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
            DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>(script, Long.class);
            Long result = redisTemplate.execute(redisScript, Collections.singletonList(lockKey), requestId);
            return result != null && result == 1L;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ===============================位图操作=================================

    /**
     * 设置位图
     * @param key 键
     * @param offset 偏移量
     * @param value 值
     * @return 原来的值
     */
    public Boolean setBit(String key, long offset, boolean value) {
        try {
            return redisTemplate.opsForValue().setBit(key, offset, value);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 获取位图
     * @param key 键
     * @param offset 偏移量
     * @return 位值
     */
    public Boolean getBit(String key, long offset) {
        try {
            return redisTemplate.opsForValue().getBit(key, offset);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * 统计位图中为1的位数
     * @param key 键
     * @return 位数统计
     */
    public long bitCount(String key) {
        try {
            return stringRedisTemplate.execute((RedisCallback<Long>) connection -> 
                connection.bitCount(key.getBytes()));
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    // ===============================HyperLogLog=================================

    /**
     * HyperLogLog添加元素
     * @param key 键
     * @param values 值
     * @return 添加的个数
     */
    public long pfAdd(String key, Object... values) {
        try {
            return redisTemplate.opsForHyperLogLog().add(key, values);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * HyperLogLog统计基数
     * @param key 键
     * @return 基数估算值
     */
    public long pfCount(String key) {
        try {
            return redisTemplate.opsForHyperLogLog().size(key);
        } catch (Exception e) {
            e.printStackTrace();
            return 0;
        }
    }

    /**
     * HyperLogLog合并
     * @param destKey 目标key
     * @param sourceKeys 源key
     */
    public void pfMerge(String destKey, String... sourceKeys) {
        try {
            redisTemplate.opsForHyperLogLog().union(destKey, sourceKeys);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ===============================Pipeline批量操作=================================

    /**
     * 使用Pipeline批量操作
     * @param operations 操作列表
     * @return 执行结果
     */
    public List<Object> executePipelined(List<RedisCallback<Object>> operations) {
        return redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
            operations.forEach(operation -> {
                try {
                    operation.doInRedis(connection);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
            return null;
        });
    }

    // ===============================Lua脚本执行=================================

    /**
     * 执行Lua脚本
     * @param script 脚本内容
     * @param keys 键列表
     * @param args 参数列表
     * @return 执行结果
     */
    public Object executeLuaScript(String script, List<String> keys, Object... args) {
        try {
            DefaultRedisScript<Object> redisScript = new DefaultRedisScript<>(script, Object.class);
            return redisTemplate.execute(redisScript, keys, args);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
```

## 6. 使用示例

### 6.1 基础使用示例

```java
package com.example.service;

import com.example.utils.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class UserService {

    @Autowired
    private RedisUtil redisUtil;

    /**
     * 缓存用户信息
     */
    public void cacheUser(String userId, User user) {
        // 缓存30分钟
        redisUtil.set("user:" + userId, user, 30 * 60);
    }

    /**
     * 获取缓存的用户信息
     */
    public User getCachedUser(String userId) {
        Object obj = redisUtil.get("user:" + userId);
        return obj != null ? (User) obj : null;
    }

    /**
     * 用户签到示例（位图应用）
     */
    public void userSignIn(String userId, int day) {
        String key = "signin:" + userId + ":" + getYearMonth();
        redisUtil.setBit(key, day - 1, true);
        // 设置过期时间为下个月
        redisUtil.expire(key, 32 * 24 * 3600);
    }

    /**
     * 检查用户是否签到
     */
    public boolean isUserSignedIn(String userId, int day) {
        String key = "signin:" + userId + ":" + getYearMonth();
        Boolean result = redisUtil.getBit(key, day - 1);
        return Boolean.TRUE.equals(result);
    }

    /**
     * 统计用户本月签到天数
     */
    public long getUserSignInCount(String userId) {
        String key = "signin:" + userId + ":" + getYearMonth();
        return redisUtil.bitCount(key);
    }

    /**
     * 使用HyperLogLog统计独立访客
     */
    public void addUniqueVisitor(String date, String userId) {
        redisUtil.pfAdd("uv:" + date, userId);
    }

    /**
     * 获取独立访客数
     */
    public long getUniqueVisitorCount(String date) {
        return redisUtil.pfCount("uv:" + date);
    }

    /**
     * 排行榜功能（有序集合应用）
     */
    public void updateUserScore(String userId, double score) {
        redisUtil.zAdd("leaderboard", userId, score);
    }

    /**
     * 获取排行榜前N名
     */
    public Set<Object> getTopUsers(int topN) {
        return redisUtil.zRange("leaderboard", 0, topN - 1);
    }

    /**
     * 分布式锁应用示例
     */
    public boolean processOrder(String orderId) {
        String lockKey = "order_lock:" + orderId;
        String requestId = UUID.randomUUID().toString();
        
        // 尝试获取锁，10秒超时
        if (redisUtil.tryGetDistributedLock(lockKey, requestId, 10)) {
            try {
                // 处理订单逻辑
                doProcessOrder(orderId);
                return true;
            } finally {
                // 释放锁
                redisUtil.releaseDistributedLock(lockKey, requestId);
            }
        }
        return false;
    }

    private void doProcessOrder(String orderId) {
        // 具体的订单处理逻辑
        System.out.println("Processing order: " + orderId);
    }

    private String getYearMonth() {
        Calendar cal = Calendar.getInstance();
        return String.format("%d%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1);
    }
}
```

### 6.2 实体类示例

```java
package com.example.entity;

import java.io.Serializable;
import java.util.Date;

/**
 * 用户实体类
 */
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String id;
    private String username;
    private String email;
    private Date createTime;
    
    // 构造方法
    public User() {}
    
    public User(String id, String username, String email) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.createTime = new Date();
    }
    
    // Getter和Setter方法
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public Date getCreateTime() { return createTime; }
    public void setCreateTime(Date createTime) { this.createTime = createTime; }
    
    @Override
    public String toString() {
        return "User{id='" + id + "', username='" + username + "', email='" + email + "', createTime=" + createTime + '}';
    }
}
```

### 6.3 控制器示例

```java
package com.example.controller;

import com.example.entity.User;
import com.example.service.UserService;
import com.example.utils.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/redis")
public class RedisController {

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private UserService userService;

    /**
     * 基础字符串操作测试
     */
    @PostMapping("/string/set")
    public Map<String, Object> setString(@RequestParam String key, @RequestParam String value) {
        Map<String, Object> result = new HashMap<>();
        boolean success = redisUtil.set(key, value, 300); // 5分钟过期
        result.put("success", success);
        result.put("message", success ? "设置成功" : "设置失败");
        return result;
    }

    @GetMapping("/string/get")
    public Map<String, Object> getString(@RequestParam String key) {
        Map<String, Object> result = new HashMap<>();
        Object value = redisUtil.get(key);
        result.put("key", key);
        result.put("value", value);
        result.put("exists", redisUtil.hasKey(key));
        return result;
    }

    /**
     * 用户缓存操作
     */
    @PostMapping("/user/cache")
    public Map<String, Object> cacheUser(@RequestBody User user) {
        Map<String, Object> result = new HashMap<>();
        try {
            userService.cacheUser(user.getId(), user);
            result.put("success", true);
            result.put("message", "用户信息缓存成功");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "缓存失败：" + e.getMessage());
        }
        return result;
    }

    @GetMapping("/user/cache/{userId}")
    public Map<String, Object> getCachedUser(@PathVariable String userId) {
        Map<String, Object> result = new HashMap<>();
        User user = userService.getCachedUser(userId);
        result.put("user", user);
        result.put("exists", user != null);
        return result;
    }

    /**
     * 用户签到
     */
    @PostMapping("/signin/{userId}/{day}")
    public Map<String, Object> userSignIn(@PathVariable String userId, @PathVariable int day) {
        Map<String, Object> result = new HashMap<>();
        try {
            userService.userSignIn(userId, day);
            result.put("success", true);
            result.put("message", "签到成功");
            result.put("signInCount", userService.getUserSignInCount(userId));
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "签到失败：" + e.getMessage());
        }
        return result;
    }

    @GetMapping("/signin/{userId}")
    public Map<String, Object> getSignInInfo(@PathVariable String userId) {
        Map<String, Object> result = new HashMap<>();
        long count = userService.getUserSignInCount(userId);
        result.put("userId", userId);
        result.put("signInCount", count);
        
        // 检查最近7天的签到情况
        Map<Integer, Boolean> recentSignIn = new HashMap<>();
        for (int i = 1; i <= 31; i++) {
            recentSignIn.put(i, userService.isUserSignedIn(userId, i));
        }
        result.put("monthlySignIn", recentSignIn);
        return result;
    }

    /**
     * 排行榜操作
     */
    @PostMapping("/leaderboard/{userId}/{score}")
    public Map<String, Object> updateScore(@PathVariable String userId, @PathVariable double score) {
        Map<String, Object> result = new HashMap<>();
        try {
            userService.updateUserScore(userId, score);
            result.put("success", true);
            result.put("message", "分数更新成功");
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "更新失败：" + e.getMessage());
        }
        return result;
    }

    @GetMapping("/leaderboard/top/{count}")
    public Map<String, Object> getTopUsers(@PathVariable int count) {
        Map<String, Object> result = new HashMap<>();
        Set<Object> topUsers = userService.getTopUsers(count);
        result.put("topUsers", topUsers);
        result.put("count", topUsers != null ? topUsers.size() : 0);
        return result;
    }

    /**
     * 独立访客统计
     */
    @PostMapping("/uv/{date}/{userId}")
    public Map<String, Object> addVisitor(@PathVariable String date, @PathVariable String userId) {
        Map<String, Object> result = new HashMap<>();
        try {
            userService.addUniqueVisitor(date, userId);
            result.put("success", true);
            result.put("uvCount", userService.getUniqueVisitorCount(date));
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "记录失败：" + e.getMessage());
        }
        return result;
    }

    @GetMapping("/uv/{date}")
    public Map<String, Object> getUVCount(@PathVariable String date) {
        Map<String, Object> result = new HashMap<>();
        long count = userService.getUniqueVisitorCount(date);
        result.put("date", date);
        result.put("uvCount", count);
        return result;
    }

    /**
     * Redis基础信息
     */
    @GetMapping("/info")
    public Map<String, Object> getRedisInfo() {
        Map<String, Object> result = new HashMap<>();
        try {
            // 获取所有key
            Set<String> keys = redisUtil.keys("*");
            result.put("totalKeys", keys != null ? keys.size() : 0);
            result.put("sampleKeys", keys);
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }
}
```

## 7. 测试用例

```java
package com.example;

import com.example.entity.User;
import com.example.service.UserService;
import com.example.utils.RedisUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.UUID;

@SpringBootTest
public class RedisIntegrationTest {

    @Autowired
    private RedisUtil redisUtil;

    @Autowired
    private UserService userService;

    @Test
    public void testStringOperations() {
        String key = "test:string";
        String value = "Hello Redis!";
        
        // 设置值
        redisUtil.set(key, value, 60);
        
        // 获取值
        Object result = redisUtil.get(key);
        System.out.println("Retrieved value: " + result);
        
        // 检查是否存在
        System.out.println("Key exists: " + redisUtil.hasKey(key));
        
        // 删除
        redisUtil.del(key);
        System.out.println("After deletion, key exists: " + redisUtil.hasKey(key));
    }

    @Test
    public void testUserCaching() {
        String userId = UUID.randomUUID().toString();
        User user = new User(userId, "testuser", "test@example.com");
        
        // 缓存用户
        userService.cacheUser(userId, user);
        
        // 获取缓存的用户
        User cachedUser = userService.getCachedUser(userId);
        System.out.println("Cached user: " + cachedUser);
    }

    @Test
    public void testUserSignIn() {
        String userId = "user123";
        
        // 模拟连续签到
        for (int day = 1; day <= 7; day++) {
            userService.userSignIn(userId, day);
        }
        
        // 检查签到统计
        long signInCount = userService.getUserSignInCount(userId);
        System.out.println("Sign in count: " + signInCount);
        
        // 检查特定日期是否签到
        boolean signedIn = userService.isUserSignedIn(userId, 5);
        System.out.println("Signed in on day 5: " + signedIn);
    }

    @Test
    public void testLeaderboard() {
        // 添加一些用户分数
        userService.updateUserScore("user1", 100.0);
        userService.updateUserScore("user2", 85.5);
        userService.updateUserScore("user3", 92.3);
        userService.updateUserScore("user4", 78.9);
        
        // 获取排行榜前3名
        var topUsers = userService.getTopUsers(3);
        System.out.println("Top 3 users: " + topUsers);
    }

    @Test
    public void testUniqueVisitors() {
        String date = "2024-01-15";
        
        // 模拟不同用户访问
        for (int i = 1; i <= 1000; i++) {
            userService.addUniqueVisitor(date, "user" + i);
        }
        
        // 模拟重复访问
        for (int i = 1; i <= 100; i++) {
            userService.addUniqueVisitor(date, "user" + i);
        }
        
        // 获取独立访客数
        long uvCount = userService.getUniqueVisitorCount(date);
        System.out.println("Unique visitors: " + uvCount);
    }

    @Test
    public void testDistributedLock() {
        String orderId = "order123";
        
        // 模拟多线程环境下的订单处理
        boolean result1 = userService.processOrder(orderId);
        boolean result2 = userService.processOrder(orderId);
        
        System.out.println("First process result: " + result1);
        System.out.println("Second process result: " + result2);
    }
}
```

## 8. 最佳实践建议

### 8.1 性能优化
- 使用连接池避免频繁创建连接
- 合理设置key的过期时间
- 使用Pipeline进行批量操作
- 避免大key的存储，考虑分片

### 8.2 数据一致性
- 使用分布式锁处理并发问题
- 合理设计缓存更新策略（Cache-Aside、Write-Through等）
- 注意缓存穿透、缓存雪崩问题

### 8.3 监控与运维
- 监控Redis的内存使用情况
- 设置合理的maxmemory策略
- 定期清理过期和无用的key
- 配置Redis慢查询日志

### 8.4 安全考虑
- 设置Redis密码
- 使用防火墙限制访问
- 定期备份数据
- 避免使用危险命令如FLUSHALL

## 9. 总结

本教程详细介绍了SpringBoot集成Redis的完整流程，包括：

1. **多种序列化方式**：提供了Jackson、JDK、FastJson等多种序列化选择
2. **完整的工具类**：封装了Redis的各种数据类型操作
3. **实战应用场景**：包括缓存、签到、排行榜、独立访客统计、分布式锁等
4. **最佳实践**：涵盖了性能优化、数据一致性、监控运维等方面

通过本教程，您可以快速掌握Redis在SpringBoot项目中的应用，并根据实际需求选择合适的序列化方式和操作策略。