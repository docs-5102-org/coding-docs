---
title: SpringBoot实现超时通知
category:
  - Web框架
tag:
  - Redis实现超时通知方案
---

# SpringBoot + Redis实现超时通知

## 概述

在实际业务场景中，我们经常需要处理各种超时任务，如订单超时取消、会话超时提醒、任务超时处理等。本文将介绍如何使用SpringBoot结合Redis的过期事件通知机制来实现高效的超时通知功能。

## 技术原理

### Redis键过期事件
Redis提供了键过期事件通知功能，当设置了TTL的键过期时，Redis会发布一个过期事件到特定的频道。通过监听这些事件，我们可以实现超时通知机制。

### 实现方案
1. **Redis过期事件监听**：监听Redis的过期事件
2. **任务调度**：结合定时任务处理超时逻辑
3. **消息队列**：使用Redis Stream或List实现异步处理

## 环境准备

### 依赖配置

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-json</artifactId>
    </dependency>
    
    <dependency>
        <groupId>org.redisson</groupId>
        <artifactId>redisson-spring-boot-starter</artifactId>
        <version>3.23.4</version>
    </dependency>
</dependencies>
```

### Redis配置

```yaml
spring:
  redis:
    host: localhost
    port: 6379
    password: 
    database: 0
    timeout: 5000ms
    lettuce:
      pool:
        max-active: 8
        max-wait: -1ms
        max-idle: 8
        min-idle: 0

# Redis过期事件通知配置
redis:
  keyspace-notifications: Ex
```

### Redis服务端配置
在redis.conf中启用键过期事件通知：
```bash
notify-keyspace-events Ex
```

## 核心实现

### 1. Redis配置类

```java
@Configuration
@EnableConfigurationProperties(RedisProperties.class)
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // 设置序列化方式
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        return container;
    }
}
```

### 2. 超时任务实体

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class TimeoutTask {
    private String taskId;
    private String taskType;
    private String businessId;
    private Map<String, Object> taskData;
    private Long createTime;
    private Long expireTime;
    private String notifyUrl;
    private Integer retryCount;
    
    public enum TaskType {
        ORDER_TIMEOUT("ORDER_TIMEOUT", "订单超时"),
        SESSION_TIMEOUT("SESSION_TIMEOUT", "会话超时"),
        PAYMENT_TIMEOUT("PAYMENT_TIMEOUT", "支付超时"),
        CUSTOM_TIMEOUT("CUSTOM_TIMEOUT", "自定义超时");
        
        private final String code;
        private final String description;
        
        TaskType(String code, String description) {
            this.code = code;
            this.description = description;
        }
        
        // getter methods...
    }
}
```

### 3. Redis键过期事件监听器

```java
@Component
@Slf4j
public class RedisKeyExpiredListener implements MessageListener {

    private static final String TIMEOUT_KEY_PREFIX = "timeout:";
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private TimeoutNotificationService timeoutNotificationService;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        String expiredKey = message.toString();
        log.info("接收到过期键事件: {}", expiredKey);
        
        if (expiredKey.startsWith(TIMEOUT_KEY_PREFIX)) {
            handleTimeoutEvent(expiredKey);
        }
    }

    private void handleTimeoutEvent(String expiredKey) {
        try {
            // 从过期键中提取任务信息
            String taskId = expiredKey.substring(TIMEOUT_KEY_PREFIX.length());
            
            // 从备份键中获取任务详细信息
            String backupKey = "timeout:backup:" + taskId;
            TimeoutTask task = (TimeoutTask) redisTemplate.opsForValue().get(backupKey);
            
            if (task != null) {
                log.info("处理超时任务: {}", task);
                timeoutNotificationService.handleTimeout(task);
                
                // 清理备份数据
                redisTemplate.delete(backupKey);
            }
        } catch (Exception e) {
            log.error("处理超时事件异常: {}", expiredKey, e);
        }
    }
}
```

### 4. 超时通知服务

```java
@Service
@Slf4j
public class TimeoutNotificationService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Autowired
    private ApplicationEventPublisher eventPublisher;

    /**
     * 创建超时任务
     */
    public void createTimeoutTask(TimeoutTask task) {
        String timeoutKey = "timeout:" + task.getTaskId();
        String backupKey = "timeout:backup:" + task.getTaskId();
        
        // 计算超时秒数
        long timeoutSeconds = (task.getExpireTime() - System.currentTimeMillis()) / 1000;
        
        if (timeoutSeconds <= 0) {
            log.warn("任务已过期，立即处理: {}", task.getTaskId());
            handleTimeout(task);
            return;
        }
        
        try {
            // 设置超时键
            redisTemplate.opsForValue().set(timeoutKey, task.getTaskId(), 
                Duration.ofSeconds(timeoutSeconds));
            
            // 备份任务详细信息（设置更长的过期时间）
            redisTemplate.opsForValue().set(backupKey, task, 
                Duration.ofSeconds(timeoutSeconds + 300));
            
            log.info("创建超时任务成功: {}, 超时时间: {}秒", task.getTaskId(), timeoutSeconds);
        } catch (Exception e) {
            log.error("创建超时任务失败: {}", task.getTaskId(), e);
            throw new RuntimeException("创建超时任务失败", e);
        }
    }

    /**
     * 取消超时任务
     */
    public boolean cancelTimeoutTask(String taskId) {
        String timeoutKey = "timeout:" + taskId;
        String backupKey = "timeout:backup:" + taskId;
        
        try {
            Long deleted1 = redisTemplate.delete(Arrays.asList(timeoutKey, backupKey));
            log.info("取消超时任务: {}, 删除键数量: {}", taskId, deleted1);
            return deleted1 > 0;
        } catch (Exception e) {
            log.error("取消超时任务失败: {}", taskId, e);
            return false;
        }
    }

    /**
     * 处理超时事件
     */
    public void handleTimeout(TimeoutTask task) {
        log.info("开始处理超时任务: {}", task);
        
        try {
            // 发布应用内事件
            eventPublisher.publishEvent(new TimeoutEvent(this, task));
            
            // HTTP回调通知
            if (StringUtils.hasText(task.getNotifyUrl())) {
                sendHttpNotification(task);
            }
            
            // 根据任务类型执行特定逻辑
            executeBusinessLogic(task);
            
            log.info("超时任务处理完成: {}", task.getTaskId());
        } catch (Exception e) {
            log.error("处理超时任务异常: {}", task.getTaskId(), e);
            // 可以考虑重试机制
            handleRetry(task, e);
        }
    }

    private void sendHttpNotification(TimeoutTask task) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> notification = new HashMap<>();
            notification.put("taskId", task.getTaskId());
            notification.put("taskType", task.getTaskType());
            notification.put("businessId", task.getBusinessId());
            notification.put("expireTime", task.getExpireTime());
            notification.put("timestamp", System.currentTimeMillis());
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(notification, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(
                task.getNotifyUrl(), request, String.class);
            
            log.info("HTTP通知发送成功: {}, 响应: {}", task.getTaskId(), response.getStatusCode());
        } catch (Exception e) {
            log.error("HTTP通知发送失败: {}", task.getTaskId(), e);
        }
    }

    private void executeBusinessLogic(TimeoutTask task) {
        switch (TimeoutTask.TaskType.valueOf(task.getTaskType())) {
            case ORDER_TIMEOUT:
                handleOrderTimeout(task);
                break;
            case PAYMENT_TIMEOUT:
                handlePaymentTimeout(task);
                break;
            case SESSION_TIMEOUT:
                handleSessionTimeout(task);
                break;
            case CUSTOM_TIMEOUT:
                handleCustomTimeout(task);
                break;
            default:
                log.warn("未知的任务类型: {}", task.getTaskType());
        }
    }

    private void handleOrderTimeout(TimeoutTask task) {
        log.info("处理订单超时: {}", task.getBusinessId());
        // 订单取消逻辑
    }

    private void handlePaymentTimeout(TimeoutTask task) {
        log.info("处理支付超时: {}", task.getBusinessId());
        // 支付超时处理逻辑
    }

    private void handleSessionTimeout(TimeoutTask task) {
        log.info("处理会话超时: {}", task.getBusinessId());
        // 会话清理逻辑
    }

    private void handleCustomTimeout(TimeoutTask task) {
        log.info("处理自定义超时: {}", task.getBusinessId());
        // 自定义处理逻辑
    }

    private void handleRetry(TimeoutTask task, Exception e) {
        if (task.getRetryCount() > 0) {
            task.setRetryCount(task.getRetryCount() - 1);
            // 延迟重试
            createTimeoutTask(task);
            log.info("超时任务重试: {}, 剩余重试次数: {}", task.getTaskId(), task.getRetryCount());
        } else {
            log.error("超时任务处理失败，重试次数已用完: {}", task.getTaskId(), e);
        }
    }
}
```

### 5. 超时事件

```java
public class TimeoutEvent extends ApplicationEvent {
    private final TimeoutTask task;

    public TimeoutEvent(Object source, TimeoutTask task) {
        super(source);
        this.task = task;
    }

    public TimeoutTask getTask() {
        return task;
    }
}
```

### 6. 事件监听器

```java
@Component
@Slf4j
public class TimeoutEventListener {

    @EventListener
    @Async
    public void handleTimeoutEvent(TimeoutEvent event) {
        TimeoutTask task = event.getTask();
        log.info("接收到超时事件: {}", task.getTaskId());
        
        // 可以在这里执行额外的业务逻辑
        // 如发送邮件、短信通知等
        sendEmailNotification(task);
    }

    private void sendEmailNotification(TimeoutTask task) {
        // 邮件通知逻辑
        log.info("发送邮件通知: {}", task.getTaskId());
    }
}
```

### 7. 控制器

```java
@RestController
@RequestMapping("/timeout")
@Slf4j
public class TimeoutController {

    @Autowired
    private TimeoutNotificationService timeoutNotificationService;

    @PostMapping("/create")
    public ResponseEntity<String> createTimeout(@RequestBody CreateTimeoutRequest request) {
        try {
            TimeoutTask task = new TimeoutTask();
            task.setTaskId(UUID.randomUUID().toString());
            task.setTaskType(request.getTaskType());
            task.setBusinessId(request.getBusinessId());
            task.setTaskData(request.getTaskData());
            task.setCreateTime(System.currentTimeMillis());
            task.setExpireTime(System.currentTimeMillis() + request.getTimeoutSeconds() * 1000L);
            task.setNotifyUrl(request.getNotifyUrl());
            task.setRetryCount(request.getRetryCount());

            timeoutNotificationService.createTimeoutTask(task);

            return ResponseEntity.ok(task.getTaskId());
        } catch (Exception e) {
            log.error("创建超时任务失败", e);
            return ResponseEntity.status(500).body("创建失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/cancel/{taskId}")
    public ResponseEntity<String> cancelTimeout(@PathVariable String taskId) {
        boolean success = timeoutNotificationService.cancelTimeoutTask(taskId);
        return success ? ResponseEntity.ok("取消成功") : ResponseEntity.notFound().build();
    }

    @Data
    public static class CreateTimeoutRequest {
        private String taskType;
        private String businessId;
        private Map<String, Object> taskData;
        private Long timeoutSeconds;
        private String notifyUrl;
        private Integer retryCount = 0;
    }
}
```

### 8. 配置Redis监听器

```java
@Configuration
public class RedisListenerConfig {

    @Bean
    public RedisKeyExpiredListener redisKeyExpiredListener() {
        return new RedisKeyExpiredListener();
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(
            RedisConnectionFactory connectionFactory,
            RedisKeyExpiredListener expiredListener) {
        
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(connectionFactory);
        
        // 监听过期事件
        container.addMessageListener(expiredListener, 
            new PatternTopic("__keyevent@*__:expired"));
        
        return container;
    }
}
```

## 使用示例

### 创建超时任务

```java
@Service
public class OrderService {

    @Autowired
    private TimeoutNotificationService timeoutNotificationService;

    public void createOrder(String orderId) {
        // 创建订单逻辑...
        
        // 创建30分钟超时任务
        TimeoutTask task = new TimeoutTask();
        task.setTaskId("order_timeout_" + orderId);
        task.setTaskType(TimeoutTask.TaskType.ORDER_TIMEOUT.name());
        task.setBusinessId(orderId);
        task.setCreateTime(System.currentTimeMillis());
        task.setExpireTime(System.currentTimeMillis() + 30 * 60 * 1000L); // 30分钟后
        task.setRetryCount(3);
        
        Map<String, Object> taskData = new HashMap<>();
        taskData.put("orderId", orderId);
        taskData.put("action", "cancel");
        task.setTaskData(taskData);
        
        timeoutNotificationService.createTimeoutTask(task);
    }

    public void payOrder(String orderId) {
        // 支付成功后取消超时任务
        timeoutNotificationService.cancelTimeoutTask("order_timeout_" + orderId);
    }
}
```

### API调用示例

```bash
# 创建超时任务
curl -X POST http://localhost:8080/timeout/create \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "ORDER_TIMEOUT",
    "businessId": "ORDER123456",
    "timeoutSeconds": 1800,
    "notifyUrl": "http://your-service.com/notify",
    "retryCount": 3,
    "taskData": {
      "orderId": "ORDER123456",
      "userId": "USER789"
    }
  }'

# 取消超时任务
curl -X DELETE http://localhost:8080/timeout/cancel/order_timeout_ORDER123456
```

## 注意事项与最佳实践

### 1. Redis配置优化
- 确保Redis服务器启用了键过期事件通知
- 合理设置Redis内存策略
- 监控Redis性能和内存使用

### 2. 可靠性保障
- 实现重试机制防止处理失败
- 使用备份键存储完整任务信息
- 考虑Redis主从切换对过期事件的影响

### 3. 性能优化
- 批量处理超时任务
- 使用异步处理避免阻塞
- 合理设置线程池大小

### 4. 监控告警
- 监控超时任务创建和处理数量
- 设置异常告警
- 记录详细日志便于排查

### 5. 容错处理
- 处理Redis连接异常
- 实现优雅降级
- 考虑分布式环境下的数据一致性

## 总结

使用SpringBoot + Redis实现超时通知是一种高效、可靠的解决方案。通过Redis的键过期事件机制，我们可以实现精确的时间控制，结合SpringBoot的事件驱动架构，能够构建出灵活、可扩展的超时处理系统。

这种方案的优势包括：
- **精确性**：基于Redis的过期机制，时间精度高
- **可靠性**：支持重试和异常处理
- **扩展性**：易于添加新的超时任务类型
- **性能好**：Redis的高性能保证了系统响应速度

在实际应用中，还需要根据具体业务场景进行适当调整和优化。