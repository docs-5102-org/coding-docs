---
title: Jedis 教程 - Java Redis 客户端指南
category:
  - 中间件
tag:
  - Redis
  - Jedis
---

# Jedis 教程 - Java Redis 客户端指南

## 简介

Jedis 是 Java 中最受欢迎的 Redis 客户端库，提供了完整的 Redis 命令支持和连接池管理功能。本教程将详细介绍如何使用 Jedis 进行 Redis 操作，包括基础操作、消息队列实现和连接池配置。

**官方链接：**
- Jedis GitHub 仓库：https://github.com/redis/jedis
- Redis 官网：https://redis.io/
- Jedis 官方文档：https://github.com/redis/jedis/wiki

## 环境准备

### Maven 依赖配置

使用最新版本的 Jedis（推荐 5.0+）：

```xml
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
    <version>5.0.2</version>
</dependency>
```

### Gradle 依赖配置

```gradle
implementation 'redis.clients:jedis:5.0.2'
```

## 基础配置

### 1. Redis 配置类

创建一个配置读取工具类：

```java
package com.redis.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class RedisConfiguration extends Properties {
    private static final long serialVersionUID = 1L;
    private static RedisConfiguration instance = null;

    public static synchronized RedisConfiguration getInstance() {
        if (instance == null) {
            instance = new RedisConfiguration();
        }
        return instance;
    }

    public String getString(String name, String defaultValue) {
        return this.getProperty(name, defaultValue);
    }

    public int getInt(String name, int defaultValue) {
        String val = this.getProperty(name);
        return (val == null || val.isEmpty()) ? defaultValue : Integer.parseInt(val);
    }

    public RedisConfiguration() {
        InputStream in = getClass().getClassLoader()
            .getResourceAsStream("redis.properties");
        try {
            if (in != null) {
                this.load(in);
                in.close();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

### 2. 现代化的 Jedis 工具类

使用新版本 Jedis API 和 try-with-resources 语法：

```java
package com.redis.util;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import redis.clients.jedis.exceptions.JedisException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

public class JedisUtil {
    private static String REDIS_HOST;
    private static int REDIS_PORT;
    private static String REDIS_PASSWORD;
    private static JedisPool jedisPool;

    static {
        RedisConfiguration config = RedisConfiguration.getInstance();
        REDIS_HOST = config.getString("redis.host", "127.0.0.1");
        REDIS_PORT = config.getInt("redis.port", 6379);
        REDIS_PASSWORD = config.getString("redis.password", null);
        
        initJedisPool();
    }

    private static void initJedisPool() {
        JedisPoolConfig poolConfig = new JedisPoolConfig();
        poolConfig.setMaxTotal(100);
        poolConfig.setMaxIdle(20);
        poolConfig.setMinIdle(5);
        poolConfig.setTestOnBorrow(true);
        poolConfig.setTestOnReturn(true);
        poolConfig.setTestWhileIdle(true);
        poolConfig.setMinEvictableIdleDuration(Duration.ofMinutes(1));
        poolConfig.setTimeBetweenEvictionRuns(Duration.ofSeconds(30));
        poolConfig.setBlockWhenExhausted(true);
        poolConfig.setMaxWait(Duration.ofSeconds(5));

        jedisPool = new JedisPool(poolConfig, REDIS_HOST, REDIS_PORT, 
                                 Protocol.DEFAULT_TIMEOUT, REDIS_PASSWORD);
    }

    // ========== 字符串操作 ==========
    
    public static String get(String key) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.get(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis get operation failed", e);
        }
    }

    public static void set(String key, String value) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.set(key, value);
        } catch (JedisException e) {
            throw new RuntimeException("Redis set operation failed", e);
        }
    }

    public static void setex(String key, int seconds, String value) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.setex(key, seconds, value);
        } catch (JedisException e) {
            throw new RuntimeException("Redis setex operation failed", e);
        }
    }

    // ========== 二进制数据操作 ==========
    
    public static byte[] get(byte[] key) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.get(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis binary get operation failed", e);
        }
    }

    public static void set(byte[] key, byte[] value) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.set(key, value);
        } catch (JedisException e) {
            throw new RuntimeException("Redis binary set operation failed", e);
        }
    }

    // ========== 列表操作（队列实现）==========
    
    public static void lpush(byte[] key, byte[] value) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.lpush(key, value);
        } catch (JedisException e) {
            throw new RuntimeException("Redis lpush operation failed", e);
        }
    }

    public static void rpush(byte[] key, byte[] value) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.rpush(key, value);
        } catch (JedisException e) {
            throw new RuntimeException("Redis rpush operation failed", e);
        }
    }

    public static byte[] lpop(byte[] key) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.lpop(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis lpop operation failed", e);
        }
    }

    public static byte[] rpop(byte[] key) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.rpop(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis rpop operation failed", e);
        }
    }

    public static List<byte[]> lrange(byte[] key, long start, long stop) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.lrange(key, start, stop);
        } catch (JedisException e) {
            throw new RuntimeException("Redis lrange operation failed", e);
        }
    }

    public static long llen(byte[] key) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.llen(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis llen operation failed", e);
        }
    }

    // ========== 哈希操作 ==========
    
    public static void hset(String key, String field, String value) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.hset(key, field, value);
        } catch (JedisException e) {
            throw new RuntimeException("Redis hset operation failed", e);
        }
    }

    public static String hget(String key, String field) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.hget(key, field);
        } catch (JedisException e) {
            throw new RuntimeException("Redis hget operation failed", e);
        }
    }

    public static void hmset(String key, Map<String, String> hash) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.hmset(key, hash);
        } catch (JedisException e) {
            throw new RuntimeException("Redis hmset operation failed", e);
        }
    }

    public static List<String> hmget(String key, String... fields) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.hmget(key, fields);
        } catch (JedisException e) {
            throw new RuntimeException("Redis hmget operation failed", e);
        }
    }

    // ========== 通用操作 ==========
    
    public static void del(String key) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.del(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis del operation failed", e);
        }
    }

    public static boolean exists(String key) {
        try (Jedis jedis = jedisPool.getResource()) {
            return jedis.exists(key);
        } catch (JedisException e) {
            throw new RuntimeException("Redis exists operation failed", e);
        }
    }

    public static void expire(String key, int seconds) {
        try (Jedis jedis = jedisPool.getResource()) {
            jedis.expire(key, seconds);
        } catch (JedisException e) {
            throw new RuntimeException("Redis expire operation failed", e);
        }
    }

    // ========== 资源管理 ==========
    
    public static void close() {
        if (jedisPool != null && !jedisPool.isClosed()) {
            jedisPool.close();
        }
    }
}
```

## 对象序列化工具类

用于 Java 对象与字节数组之间的转换：

```java
package com.redis.util;

import java.io.*;

public class SerializationUtil {
    
    /**
     * 将对象序列化为字节数组
     * @param obj 需要序列化的对象
     * @return 序列化后的字节数组
     */
    public static byte[] serialize(Object obj) {
        if (obj == null) {
            return null;
        }
        
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ObjectOutputStream oos = new ObjectOutputStream(baos)) {
            
            oos.writeObject(obj);
            oos.flush();
            return baos.toByteArray();
            
        } catch (IOException e) {
            throw new RuntimeException("Object serialization failed", e);
        }
    }
    
    /**
     * 将字节数组反序列化为对象
     * @param bytes 字节数组
     * @return 反序列化后的对象
     */
    @SuppressWarnings("unchecked")
    public static <T> T deserialize(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return null;
        }
        
        try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
             ObjectInputStream ois = new ObjectInputStream(bais)) {
            
            return (T) ois.readObject();
            
        } catch (IOException | ClassNotFoundException e) {
            throw new RuntimeException("Object deserialization failed", e);
        }
    }
}
```

## Redis 消息队列实现

### 消息实体类

```java
package com.redis.queue;

import java.io.Serializable;
import java.time.LocalDateTime;

public class QueueMessage implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String id;
    private String content;
    private String topic;
    private LocalDateTime timestamp;
    private int priority;

    public QueueMessage() {
        this.timestamp = LocalDateTime.now();
    }

    public QueueMessage(String id, String content) {
        this();
        this.id = id;
        this.content = content;
    }

    public QueueMessage(String id, String content, String topic) {
        this(id, content);
        this.topic = topic;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public int getPriority() { return priority; }
    public void setPriority(int priority) { this.priority = priority; }

    @Override
    public String toString() {
        return String.format("QueueMessage{id='%s', content='%s', topic='%s', timestamp=%s}", 
                           id, content, topic, timestamp);
    }
}
```

### Redis 队列管理器

```java
package com.redis.queue;

import com.redis.util.JedisUtil;
import com.redis.util.SerializationUtil;

import java.util.ArrayList;
import java.util.List;

public class RedisQueueManager {
    
    private static final String QUEUE_PREFIX = "queue:";
    
    /**
     * 向队列尾部添加消息（生产者）
     */
    public static void produce(String queueName, QueueMessage message) {
        byte[] key = getQueueKey(queueName);
        byte[] value = SerializationUtil.serialize(message);
        JedisUtil.lpush(key, value);
    }
    
    /**
     * 从队列头部消费消息（消费者）
     */
    public static QueueMessage consume(String queueName) {
        byte[] key = getQueueKey(queueName);
        byte[] data = JedisUtil.rpop(key);
        
        if (data == null) {
            return null;
        }
        
        return SerializationUtil.deserialize(data);
    }
    
    /**
     * 批量消费消息
     */
    public static List<QueueMessage> consumeBatch(String queueName, int count) {
        List<QueueMessage> messages = new ArrayList<>();
        
        for (int i = 0; i < count; i++) {
            QueueMessage message = consume(queueName);
            if (message == null) {
                break;
            }
            messages.add(message);
        }
        
        return messages;
    }
    
    /**
     * 获取队列长度
     */
    public static long getQueueSize(String queueName) {
        byte[] key = getQueueKey(queueName);
        return JedisUtil.llen(key);
    }
    
    /**
     * 查看队列中的消息（不消费）
     */
    public static List<QueueMessage> peekMessages(String queueName, int start, int end) {
        byte[] key = getQueueKey(queueName);
        List<byte[]> rawMessages = JedisUtil.lrange(key, start, end);
        
        List<QueueMessage> messages = new ArrayList<>();
        for (byte[] rawMessage : rawMessages) {
            QueueMessage message = SerializationUtil.deserialize(rawMessage);
            messages.add(message);
        }
        
        return messages;
    }
    
    private static byte[] getQueueKey(String queueName) {
        return (QUEUE_PREFIX + queueName).getBytes();
    }
}
```

## 应用示例

### 基础操作示例

```java
package com.redis.example;

import com.redis.util.JedisUtil;
import java.util.HashMap;
import java.util.Map;

public class BasicExample {
    
    public static void main(String[] args) {
        // 字符串操作
        stringOperations();
        
        // 哈希操作
        hashOperations();
        
        // 清理资源
        JedisUtil.close();
    }
    
    private static void stringOperations() {
        System.out.println("=== 字符串操作 ===");
        
        // 设置和获取
        JedisUtil.set("name", "John Doe");
        String name = JedisUtil.get("name");
        System.out.println("Name: " + name);
        
        // 设置带过期时间
        JedisUtil.setex("session:user123", 3600, "active");
        String session = JedisUtil.get("session:user123");
        System.out.println("Session: " + session);
        
        // 检查键是否存在
        boolean exists = JedisUtil.exists("name");
        System.out.println("Key 'name' exists: " + exists);
    }
    
    private static void hashOperations() {
        System.out.println("\n=== 哈希操作 ===");
        
        // 设置哈希字段
        JedisUtil.hset("user:1001", "name", "Alice");
        JedisUtil.hset("user:1001", "email", "alice@example.com");
        JedisUtil.hset("user:1001", "age", "25");
        
        // 获取哈希字段
        String userName = JedisUtil.hget("user:1001", "name");
        String userEmail = JedisUtil.hget("user:1001", "email");
        System.out.println("User: " + userName + ", Email: " + userEmail);
        
        // 批量设置哈希
        Map<String, String> userInfo = new HashMap<>();
        userInfo.put("name", "Bob");
        userInfo.put("email", "bob@example.com");
        userInfo.put("age", "30");
        JedisUtil.hmset("user:1002", userInfo);
        
        // 批量获取哈希字段
        List<String> userFields = JedisUtil.hmget("user:1002", "name", "email", "age");
        System.out.println("User 1002: " + userFields);
    }
}
```

### 消息队列示例

```java
package com.redis.example;

import com.redis.queue.QueueMessage;
import com.redis.queue.RedisQueueManager;
import com.redis.util.JedisUtil;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

public class QueueExample {
    
    private static final String QUEUE_NAME = "chat_messages";
    
    public static void main(String[] args) {
        // 启动生产者线程
        Thread producer = new Thread(QueueExample::produceMessages);
        producer.start();
        
        // 等待一段时间让生产者产生消息
        try {
            TimeUnit.SECONDS.sleep(2);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // 启动消费者线程
        Thread consumer = new Thread(QueueExample::consumeMessages);
        consumer.start();
        
        try {
            producer.join();
            consumer.join();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        JedisUtil.close();
    }
    
    private static void produceMessages() {
        System.out.println("=== 消息生产者启动 ===");
        
        for (int i = 1; i <= 5; i++) {
            QueueMessage message = new QueueMessage(
                UUID.randomUUID().toString(),
                "这是第 " + i + " 条消息",
                "chat"
            );
            message.setPriority(i % 3);
            
            RedisQueueManager.produce(QUEUE_NAME, message);
            System.out.println("生产消息: " + message);
            
            try {
                TimeUnit.MILLISECONDS.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        System.out.println("队列当前长度: " + RedisQueueManager.getQueueSize(QUEUE_NAME));
    }
    
    private static void consumeMessages() {
        System.out.println("\n=== 消息消费者启动 ===");
        
        while (true) {
            long queueSize = RedisQueueManager.getQueueSize(QUEUE_NAME);
            if (queueSize == 0) {
                System.out.println("队列为空，消费者退出");
                break;
            }
            
            QueueMessage message = RedisQueueManager.consume(QUEUE_NAME);
            if (message != null) {
                System.out.println("消费消息: " + message);
            }
            
            try {
                TimeUnit.MILLISECONDS.sleep(800);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
}
```

### 配置文件示例

创建 `src/main/resources/redis.properties` 文件：

```properties
# Redis 服务器配置
redis.host=localhost
redis.port=6379
redis.password=
redis.database=0

# 连接池配置
redis.pool.maxTotal=100
redis.pool.maxIdle=20
redis.pool.minIdle=5
redis.pool.maxWait=5000
redis.pool.testOnBorrow=true
redis.pool.testOnReturn=true
```

## 最佳实践

### 1. 连接池管理
- 使用连接池避免频繁创建连接
- 合理配置连接池参数
- 应用关闭时记得关闭连接池

### 2. 异常处理
- 使用 try-with-resources 确保资源释放
- 对 Redis 操作异常进行适当处理
- 实现重试机制处理网络问题

### 3. 序列化优化
- 对于大对象考虑使用压缩
- 可以使用更高效的序列化方式如 Protobuf、Kryo
- 注意序列化兼容性问题

### 4. 队列设计
- 合理选择数据结构（List、Stream、Sorted Set）
- 实现消息确认机制防止丢失
- 考虑使用 Redis Streams 处理复杂场景

## 总结

本教程涵盖了 Jedis 的核心功能和实际应用场景，包括基础操作、连接池配置、消息队列实现等。通过这些示例，您可以快速上手 Jedis 并在实际项目中使用 Redis 进行缓存、会话管理、消息队列等功能。

记住在生产环境中要注意：
- 合理的连接池配置
- 完善的异常处理机制
- 适当的监控和日志记录
- 数据持久化和备份策略