---
title: Spring Boot + RabbitMQ 死信队列完整指南
category:
  - 中间件
tag:
  - RabbitMQ
---

# Spring Boot + RabbitMQ 死信队列完整指南

## 📋 目录

1. [概述](#概述)
2. [环境准备](#环境准备)
3. [项目配置](#项目配置)
4. [核心组件实现](#核心组件实现)
5. [使用示例](#使用示例)
6. [测试验证](#测试验证)
7. [最佳实践](#最佳实践)
8. [常见问题](#常见问题)

---

## 概述

### 什么是死信队列(DLX)

死信队列(Dead Letter Exchange)是RabbitMQ的一种消息处理机制,用于处理无法被正常消费的消息。当消息在业务队列中出现异常情况时,会被转发到死信队列进行特殊处理。

### 消息成为死信的三种情况

1. **消息被拒绝** - 消费者调用 `basic.reject` 或 `basic.nack` 且 `requeue=false`
2. **消息过期** - 消息超过设置的TTL(Time To Live)时间
3. **队列满** - 队列达到最大长度限制

### 应用场景

- 消息重试失败后的兜底处理
- 延迟队列实现(结合TTL)
- 异常消息的监控和告警
- 人工介入处理的消息暂存

---

## 环境准备

### 1. 系统要求

- JDK 8+
- Spring Boot 2.x / 3.x
- RabbitMQ 3.8+
- Maven / Gradle

### 2. 添加依赖

在 `pom.xml` 中添加:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>

<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### 3. 安装RabbitMQ

**Docker方式(推荐)**:

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  rabbitmq:3-management
```

访问管理界面: http://localhost:15672 (guest/guest)

---

## 项目配置

### application.yml

```yaml
spring:
  rabbitmq:
    host: localhost
    port: 5672
    username: guest
    password: guest
    # 开启发送异步确认，保证消息的可靠性
    publisher-confirm-type: correlated
    # 开启发送失败退回
    publisher-returns: true
    listener:
      simple:
        # 手动ACK确认消息
        acknowledge-mode: manual
        prefetch: 1                # 每次只取一条，处理完再取下一条
        # 消费者最小数量
        concurrency: 1
        # 消费者最大数量
        max-concurrency: 10
        # 每次从队列获取的消息数
        prefetch: 1
```

### 配置参数说明

| 参数 | 说明 | 可选值 |
|------|------|--------|
| `acknowledge-mode` | 消息确认模式 | `none`(自动), `auto`(自动), `manual`(手动) |
| `publisher-confirm-type` | 发布确认类型 | `none`, `simple`, `correlated` |
| `publisher-returns` | 是否启用发布返回 | `true`, `false` |
| `prefetch` | 预取数量 | 整数,建议1-10 |


:::tip

# 开启 Confirm 机制（确认消息到达 Exchange）
yamlspring:
  rabbitmq:
    publisher-confirm-type: correlated  # 异步确认
    publisher-returns: true             # 开启 Return 机制
    template:
      mandatory: true                   # 消息路由失败时返回，而不是丢弃

:::


---

## 核心组件实现

### 1. RabbitMQ配置类

```java
import org.springframework.amqp.core.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ========== 业务队列相关配置 ==========
    public static final String BUSINESS_EXCHANGE = "business.exchange";
    public static final String BUSINESS_QUEUE = "business.queue";
    public static final String BUSINESS_ROUTING_KEY = "business.route";

    // ========== 死信队列相关配置 ==========
    public static final String DLX_EXCHANGE = "dlx.exchange";
    public static final String DLX_QUEUE = "dlx.queue";
    public static final String DLX_ROUTING_KEY = "dlx.route";

    // ========== 1. 声明死信交换机 ==========
    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(DLX_EXCHANGE, true, false);
    }

    // ========== 2. 声明死信队列 ==========
    @Bean
    public Queue dlxQueue() {
        return QueueBuilder
                .durable(DLX_QUEUE)
                .build();
    }

    // ========== 3. 绑定死信队列到死信交换机 ==========
    @Bean
    public Binding dlxBinding(Queue dlxQueue, DirectExchange dlxExchange) {
        return BindingBuilder
                .bind(dlxQueue)
                .to(dlxExchange)
                .with(DLX_ROUTING_KEY);
    }

    // ========== 4. 声明业务交换机 ==========
    // Exchange 持久化（durable = true）
    @Bean
    public DirectExchange businessExchange() {
        return new DirectExchange(BUSINESS_EXCHANGE, true, false);
    }

    // ========== 5. 声明业务队列(配置死信交换机) ==========
    // Queue 持久化（durable = true）
    @Bean
    public Queue businessQueue() {
        return QueueBuilder
                .durable(BUSINESS_QUEUE)
                // 配置死信交换机
                .deadLetterExchange(DLX_EXCHANGE)
                // 配置死信路由键
                .deadLetterRoutingKey(DLX_ROUTING_KEY)
                // 可选: 设置消息TTL(毫秒)
                .ttl(10000)  // 10秒
                // 可选: 设置队列最大长度
                .maxLength(10)
                .build();
    }

    // ========== 6. 绑定业务队列到业务交换机 ==========
    @Bean
    public Binding businessBinding(Queue businessQueue, DirectExchange businessExchange) {
        return BindingBuilder
                .bind(businessQueue)
                .to(businessExchange)
                .with(BUSINESS_ROUTING_KEY);
    }
}
```

### 2. 消息生产者

```java
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageProducer {

    private final RabbitTemplate rabbitTemplate;

    /**
     * 发送普通消息
     */
    public void sendMessage(String message) {
        log.info("发送消息: {}", message);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.BUSINESS_EXCHANGE,
                RabbitMQConfig.BUSINESS_ROUTING_KEY,
                message
        );
    }

    /**
     * 发送带过期时间的消息
     */
    public void sendMessageWithTTL(String message, long ttl) {
        log.info("发送消息(TTL={}ms): {}", ttl, message);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.BUSINESS_EXCHANGE,
                RabbitMQConfig.BUSINESS_ROUTING_KEY,
                message,
                msg -> {
                    // 设置消息过期时间
                    msg.getMessageProperties().setExpiration(String.valueOf(ttl));
                    return msg;
                }
        );
    }
    
    /**
     * 发送带自定义头信息的消息
     */
    public void sendMessageWithHeaders(String message, Map<String, Object> headers) {
        log.info("发送消息(带头信息): {}", message);
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.BUSINESS_EXCHANGE,
                RabbitMQConfig.BUSINESS_ROUTING_KEY,
                message,
                msg -> {
                    headers.forEach((key, value) -> 
                        msg.getMessageProperties().setHeader(key, value)
                    );
                    return msg;
                }
        );
    }

    /**
     * 发送消息时设置持久化
     */
    public void sendMessageWitDeliveryMode(String message, long ttl) {
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.BUSINESS_EXCHANGE,
                RabbitMQConfig.BUSINESS_ROUTING_KEY,
                message,
                msg -> {
                    // 设置消息持久化，Broker 重启后消息不丢失
                    msg.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    return msg;
                }
        );
    }
}
```

### 3. 业务队列消费者

```java
import com.rabbitmq.client.Channel;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class BusinessConsumer {

    private static final int MAX_RETRY_COUNT = 3;

    @RabbitListener(queues = RabbitMQConfig.BUSINESS_QUEUE)
    public void handleMessage(String content, Message message, Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        
        try {
            log.info("收到业务消息: {}", content);
            
            // 模拟业务处理
            processBusinessLogic(content);
            
            // 手动确认消息
            channel.basicAck(deliveryTag, false);
            log.info("消息处理成功");
            
        } catch (Exception e) {
            log.error("消息处理失败: {}", e.getMessage());
            
            // 判断是否已经重试过
            Integer retryCount = (Integer) message.getMessageProperties()
                    .getHeaders().get("x-retry-count");
            
            if (retryCount == null) {
                retryCount = 0;
            }
            
            if (retryCount < MAX_RETRY_COUNT) {
                // 重新入队,稍后重试
                log.info("消息重新入队,重试次数: {}", retryCount + 1);
                channel.basicNack(deliveryTag, false, true);
            } else {
                // 拒绝消息,进入死信队列
                log.warn("消息重试次数已达上限,进入死信队列");
                channel.basicNack(deliveryTag, false, false);
            }
        }
    }

    private void processBusinessLogic(String content) throws Exception {
        // 模拟业务处理
        if (content.contains("error")) {
            throw new RuntimeException("业务处理异常");
        }
        // 正常业务逻辑
        Thread.sleep(100);
    }
}
```

### 4. 死信队列消费者

```java
import com.rabbitmq.client.Channel;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class DeadLetterConsumer {

    @RabbitListener(queues = RabbitMQConfig.DLX_QUEUE)
    public void handleDeadLetter(String content, Message message, Channel channel) throws Exception {
        long deliveryTag = message.getMessageProperties().getDeliveryTag();
        
        try {
            log.warn("======== 死信队列收到消息 ========");
            log.warn("消息内容: {}", content);
            
            // 获取死信相关信息
            Map<String, Object> headers = message.getMessageProperties().getHeaders();
            log.warn("死信原因: {}", headers.get("x-first-death-reason"));
            log.warn("原队列: {}", headers.get("x-first-death-queue"));
            log.warn("原交换机: {}", headers.get("x-first-death-exchange"));
            log.warn("死亡时间: {}", headers.get("x-first-death-timestamp"));
            
            // 处理死信消息(告警、记录日志、人工介入等)
            handleDeadLetterLogic(content, message);
            
            // 确认消息
            channel.basicAck(deliveryTag, false);
            
        } catch (Exception e) {
            log.error("死信消息处理失败: {}", e.getMessage());
            // 死信队列处理失败也可以选择确认,避免无限循环
            channel.basicAck(deliveryTag, false);
        }
    }

    private void handleDeadLetterLogic(String content, Message message) {
        // 1. 记录到数据库
        saveToDatabase(content, message);
        
        // 2. 发送告警通知
        sendAlert(content);
        
        // 3. 人工介入处理
        log.warn("执行死信处理逻辑...");
    }
    
    private void saveToDatabase(String content, Message message) {
        // TODO: 保存到数据库
        log.info("保存死信消息到数据库");
    }
    
    private void sendAlert(String content) {
        // TODO: 发送告警(邮件、短信、企业微信等)
        log.warn("发送死信告警通知");
    }
}
```

### 5. 测试控制器

```java
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
public class TestController {

    private final MessageProducer producer;

    @GetMapping("/send")
    public String sendNormalMessage(@RequestParam String msg) {
        producer.sendMessage(msg);
        return "消息已发送: " + msg;
    }

    @GetMapping("/send-ttl")
    public String sendTTLMessage(@RequestParam String msg, @RequestParam long ttl) {
        producer.sendMessageWithTTL(msg, ttl);
        return "带TTL的消息已发送: " + msg + ", TTL=" + ttl + "ms";
    }

    @GetMapping("/send-error")
    public String sendErrorMessage() {
        producer.sendMessage("error-message");
        return "错误消息已发送(会进入死信队列)";
    }
    
    @GetMapping("/send-batch")
    public String sendBatchMessages(@RequestParam(defaultValue = "10") int count) {
        for (int i = 0; i < count; i++) {
            producer.sendMessage("batch-message-" + i);
        }
        return "批量发送 " + count + " 条消息";
    }
}
```

---

## 使用示例

### 1. 发送普通消息

```bash
curl "http://localhost:8080/test/send?msg=hello"
```

### 2. 发送带TTL的消息

```bash
# 5秒后过期
curl "http://localhost:8080/test/send-ttl?msg=delay-message&ttl=5000"
```

### 3. 发送会失败的消息

```bash
curl "http://localhost:8080/test/send-error"
```

### 4. 批量发送消息

```bash
curl "http://localhost:8080/test/send-batch?count=20"
```

---

## 测试验证

### 测试场景一: 消息重试后进入死信队列

**步骤**:

1. 发送错误消息: `curl "http://localhost:8080/test/send-error"`
2. 观察日志,消息会重试3次
3. 重试失败后进入死信队列
4. 死信队列消费者接收并处理

**预期日志**:

```
收到业务消息: error-message
消息处理失败: 业务处理异常
消息重新入队,重试次数: 1
...
消息重试次数已达上限,进入死信队列
======== 死信队列收到消息 ========
消息内容: error-message
死信原因: rejected
```

### 测试场景二: 消息过期进入死信队列

**步骤**:

1. 停止消费者服务
2. 发送带TTL消息: `curl "http://localhost:8080/test/send-ttl?msg=test&ttl=3000"`
3. 等待3秒后重启消费者
4. 消息直接进入死信队列

**预期日志**:

```
======== 死信队列收到消息 ========
消息内容: test
死信原因: expired
```

### 测试场景三: 队列长度限制

**配置**: 业务队列 `maxLength(10)`

**步骤**:

1. 停止消费者
2. 批量发送15条消息
3. 前10条进入业务队列,后5条因队列满被拒绝进入死信队列

---

## 最佳实践

### 1. 消息确认模式选择

| 模式 | 适用场景 | 优缺点 |
|------|----------|--------|
| **手动确认** | 需要精确控制消息处理 | 灵活但复杂 |
| **自动确认** | 简单的消息处理 | 简单但可能丢消息 |

**推荐**: 生产环境使用手动确认

### 2. 重试策略

```java
// 建议使用指数退避算法
private long calculateRetryDelay(int retryCount) {
    return (long) Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
}
```

### 3. 死信队列监控

```java
@Component
public class DeadLetterMonitor {
    
    @Scheduled(fixedRate = 60000) // 每分钟检查
    public void checkDeadLetterQueue() {
        // 检查死信队列长度
        // 超过阈值发送告警
    }
}
```

### 4. 消息幂等性

```java
@Component
public class IdempotentConsumer {
    
    private final Set<String> processedMessageIds = new ConcurrentHashSet<>();
    
    public void handleMessage(String messageId, String content) {
        if (processedMessageIds.contains(messageId)) {
            log.warn("重复消息,跳过处理: {}", messageId);
            return;
        }
        
        // 处理消息
        processMessage(content);
        
        // 记录已处理
        processedMessageIds.add(messageId);
    }
}
```

### 5. 消息持久化配置

```java
// 确保消息不丢失
@Bean
public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
    RabbitTemplate template = new RabbitTemplate(connectionFactory);
    // 消息持久化
    template.setMandatory(true);
    return template;
}
```

---

## 常见问题

### Q1: 消息在死信队列中会被再次消费吗?

**A**: 死信队列的消息也需要消费者主动消费。如果没有消费者监听死信队列,消息会一直保存在队列中。

### Q2: 死信队列的消息可以重新发回业务队列吗?

**A**: 可以。在死信队列消费者中,可以选择重新发送消息到业务队列:

```java
public void handleDeadLetter(String content) {
    // 判断是否需要重新处理
    if (shouldRetry(content)) {
        producer.sendMessage(content);
    }
}
```

### Q3: 如何设置合理的TTL时间?

**A**: 根据业务特点:

- 实时性要求高: 1-5秒
- 普通业务: 30秒-5分钟
- 延迟任务: 按需设置

### Q4: 消息重试次数设置多少合适?

**A**: 建议3-5次,避免过多重试占用资源。

### Q5: 死信队列也可能消费失败怎么办?

**A**: 两种方案:

1. 死信队列消费失败也确认消息,避免无限循环
2. 为死信队列再配置一个二级死信队列

### Q6: 如何监控死信队列?

**A**: 

```java
@Component
public class RabbitMQMonitor {
    
    @Autowired
    private RabbitAdmin rabbitAdmin;
    
    public int getQueueMessageCount(String queueName) {
        Properties properties = rabbitAdmin.getQueueProperties(queueName);
        return (int) properties.get("QUEUE_MESSAGE_COUNT");
    }
}
```

---

## 总结

### 核心要点

1. **死信队列是消息异常处理的最后防线**
2. **合理设置重试次数和TTL时间**
3. **必须监听死信队列并做好告警机制**
4. **生产环境建议使用手动确认模式**
5. **注意消息幂等性设计**

### 架构图

```
[生产者] -> [业务交换机] -> [业务队列] -> [消费者]
                                  ↓ (失败/过期/队列满)
                           [死信交换机] -> [死信队列] -> [死信消费者]
                                                            ↓
                                                    [告警/日志/人工处理]
```
