---
title: Redisson入门教程
category:
  - 中间件
tag:
  - Redisson
---

# Redisson入门教程

## 1. 简介

Redisson是一个在Redis的基础上实现的Java驻内存数据网格（In-Memory Data Grid）。它不仅提供了一系列的分布式的Java常用对象，还提供了许多分布式服务。其中包括(BitSet, Set, Multimap, SortedSet, Map, List, Queue, BlockingQueue, Deque, BlockingDeque, Semaphore, Lock, AtomicLong, CountDownLatch, Publish / Subscribe, Bloom filter, Remote service, Spring cache, Executor service, Live Object, Scheduler service) Redisson提供了使用Redis的最简单和最便捷的方法。

## 2. 环境准备

### 2.1 添加依赖

在`pom.xml`中添加Redisson依赖：

```xml
<dependency>
    <groupId>org.redisson</groupId>
    <artifactId>redisson</artifactId>
    <version>3.12.5</version>
</dependency>
```

> **注意**: 建议使用3.12.5或更高版本，早期版本（如3.6.5）在多线程并发操作时可能会出现`RedisTimeoutException`等问题。

### 2.2 Redis服务准备

确保Redis服务器已启动并可访问。

## 3. 基础配置

### 3.1 创建Redisson客户端

```java
import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;

public class RedissonConfig {
    
    public RedissonClient getRedissonClient() {
        Config config = new Config();
        config.useSingleServer()
              .setAddress("redis://127.0.0.1:6379")
              .setPassword("your-password") // 如果有密码
              .setDatabase(0);
        
        return Redisson.create(config);
    }
}
```

### 3.2 集群配置示例

```java
Config config = new Config();
config.useClusterServers()
      .addNodeAddress("redis://127.0.0.1:7000")
      .addNodeAddress("redis://127.0.0.1:7001")
      .addNodeAddress("redis://127.0.0.1:7002");

RedissonClient redisson = Redisson.create(config);
```

## 4. 基本数据结构操作

### 4.1 字符串操作

```java
RedissonClient redisson = getRedissonClient();

// 获取字符串对象
RBucket<String> bucket = redisson.getBucket("mykey");

// 设置值
bucket.set("Hello Redisson");

// 获取值
String value = bucket.get();
System.out.println(value); // 输出: Hello Redisson

// 设置过期时间
bucket.set("Hello", 10, TimeUnit.SECONDS);
```

> **注意**: 如果遇到存储字符串时出现多余双引号的问题，通常是序列化配置导致的，可以通过设置合适的编解码器来解决。

### 4.2 Map操作

```java
RMap<String, String> map = redisson.getMap("mymap");

// 添加键值对
map.put("key1", "value1");
map.put("key2", "value2");

// 获取值
String value = map.get("key1");

// 批量操作
Map<String, String> data = new HashMap<>();
data.put("key3", "value3");
data.put("key4", "value4");
map.putAll(data);
```

### 4.3 List操作

```java
RList<String> list = redisson.getList("mylist");

// 添加元素
list.add("item1");
list.add("item2");

// 获取元素
String firstItem = list.get(0);

// 移除元素
list.remove("item1");
```

## 5. 分布式队列

Redisson提供了多种分布式队列实现：

### 5.1 普通队列

```java
RQueue<String> queue = redisson.getQueue("myqueue");

// 添加元素
queue.offer("task1");
queue.offer("task2");

// 获取并移除元素
String task = queue.poll();
```

### 5.2 阻塞队列

```java
RBlockingQueue<String> blockingQueue = redisson.getBlockingQueue("myblockingqueue");

// 生产者
blockingQueue.offer("message");

// 消费者（会阻塞直到有元素）
String message = blockingQueue.take();
```

### 5.3 延迟队列

```java
RDelayedQueue<String> delayedQueue = redisson.getDelayedQueue(blockingQueue);

// 延迟10秒执行
delayedQueue.offer("delayed-task", 10, TimeUnit.SECONDS);

// 消费者
String delayedTask = blockingQueue.take();
```

### 5.4 优先级队列

```java
RPriorityQueue<Integer> priorityQueue = redisson.getPriorityQueue("mypriority");
priorityQueue.trySetComparator(new MyComparator()); // 设置比较器

priorityQueue.add(3);
priorityQueue.add(1);
priorityQueue.add(2);

Integer value = priorityQueue.poll(); // 返回优先级最高的元素
```

## 6. 发布订阅

### 6.1 基本发布订阅

```java
// 订阅者
RTopic topic = redisson.getTopic("mytopic");
topic.addListener(String.class, new MessageListener<String>() {
    @Override
    public void onMessage(CharSequence channel, String message) {
        System.out.println("收到消息: " + message);
    }
});

// 发布者
topic.publish("Hello World!");
```

### 6.2 对象消息队列

```java
// 定义消息对象
public class Message {
    private String content;
    private Date timestamp;
    // getter和setter...
}

// 发布对象消息
RTopic topic = redisson.getTopic("objectTopic");
Message msg = new Message();
msg.setContent("Hello Object");
msg.setTimestamp(new Date());
topic.publish(msg);

// 订阅对象消息
topic.addListener(Message.class, new MessageListener<Message>() {
    @Override
    public void onMessage(CharSequence channel, Message message) {
        System.out.println("收到对象消息: " + message.getContent());
    }
});
```

## 7. 分布式锁

### 7.1 可重入锁

```java
RLock lock = redisson.getLock("mylock");

try {
    // 尝试加锁，最多等待100秒，上锁以后10秒自动解锁
    boolean res = lock.tryLock(100, 10, TimeUnit.SECONDS);
    if (res) {
        // 执行业务逻辑
        doSomething();
    }
} catch (InterruptedException e) {
    e.printStackTrace();
} finally {
    lock.unlock();
}
```

### 7.2 公平锁

```java
RLock fairLock = redisson.getFairLock("myfairlock");
// 使用方式与可重入锁相同
```

### 7.3 读写锁

```java
RReadWriteLock rwlock = redisson.getReadWriteLock("myreadwritelock");

// 读锁
RLock rLock = rwlock.readLock();
// 写锁
RLock wLock = rwlock.writeLock();
```

## 8. 最佳实践

### 8.1 连接管理

```java
@Configuration
public class RedissonConfiguration {
    
    @Bean(destroyMethod = "shutdown")
    public RedissonClient redissonClient() {
        Config config = new Config();
        config.useSingleServer()
              .setAddress("redis://127.0.0.1:6379")
              .setConnectionPoolSize(64)
              .setConnectionMinimumIdleSize(10);
        
        return Redisson.create(config);
    }
}
```

### 8.2 错误处理

```java
public void robustOperation() {
    RedissonClient redisson = getRedissonClient();
    RLock lock = redisson.getLock("mylock");
    
    try {
        if (lock.tryLock(10, 30, TimeUnit.SECONDS)) {
            try {
                // 执行业务逻辑
                performBusinessLogic();
            } finally {
                // 确保锁被释放
                if (lock.isHeldByCurrentThread()) {
                    lock.unlock();
                }
            }
        } else {
            throw new RuntimeException("无法获取锁");
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        throw new RuntimeException("操作被中断", e);
    }
}
```

### 8.3 性能优化

1. **合理设置连接池大小**: 根据应用并发量调整连接池参数
2. **使用批量操作**: 对于大量数据操作，使用批量方法提高性能
3. **设置合适的超时时间**: 避免长时间等待导致的性能问题
4. **监控Redis性能**: 定期检查Redis服务器性能指标

## 9. 常见问题

### 9.1 版本兼容性问题

如果遇到`RedisTimeoutException`等超时异常，建议升级到3.12.5或更高版本，早期版本在多线程并发操作时存在稳定性问题。

### 9.2 序列化问题(存储字符串多双引号问题)

如果存储字符串时出现多余的双引号，可以配置合适的编解码器：

```java
import org.redisson.config.Config;
Config config = new Config();
config.setCodec(new StringCodec());
```

### 9.3 内存泄漏

确保在应用关闭时正确关闭Redisson客户端：

```java
@PreDestroy
public void destroy() {
    if (redisson != null) {
        redisson.shutdown();
    }
}
```

## 10. 总结

Redisson为Java开发者提供了强大的Redis操作能力，通过其丰富的分布式数据结构和服务，可以轻松实现分布式应用中的各种需求。在使用过程中要注意版本选择、连接管理和错误处理，确保应用的稳定性和性能。

## 参考资料

- [Redisson官方文档](https://github.com/redisson/redisson/wiki)
- [Redisson实战教程](https://my.oschina.net/LucasZhu/blog/1816320)
