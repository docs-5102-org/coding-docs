---
title: SpringBoot集成kafka
category:
  - Web框架
tag:
  - Spring Boot
  - kafka
---

# SpringBoot集成Kafka

## 概述

Apache Kafka 是一个分布式流处理平台，广泛用于构建实时数据管道和流应用程序。Spring Boot 为 Kafka 提供了优秀的自动配置支持，使得集成变得非常简单。

## 依赖配置

### Maven 依赖

在 `pom.xml` 文件中添加 Spring Kafka 依赖：

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
    <version>2.9.0</version>
</dependency>
```

### Gradle 依赖

```gradle
implementation 'org.springframework.kafka:spring-kafka:2.9.0'
```

## 配置属性

在 `application.properties` 或 `application.yml` 中配置 Kafka 相关属性：

### application.properties 配置

```properties
# Kafka 服务器地址
spring.kafka.bootstrap-servers=localhost:9092

# Producer 配置
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.acks=all
spring.kafka.producer.retries=3

# Consumer 配置
spring.kafka.consumer.group-id=springboot-group
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.enable-auto-commit=false

# Listener 配置
spring.kafka.listener.ack-mode=manual_immediate
```

### application.yml 配置

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.apache.kafka.common.serialization.StringSerializer
      acks: all
      retries: 3
    consumer:
      group-id: springboot-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      enable-auto-commit: false
    listener:
      ack-mode: manual_immediate
```

## 消息生产者

### 基础生产者示例

```java
package com.example.kafka.producer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;

@Service
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    public void sendMessage(String topic, String key, String message) {
        kafkaTemplate.send(topic, key, message);
    }

    public void sendMessageWithCallback(String topic, String key, String message) {
        ListenableFuture<SendResult<String, String>> future = 
            kafkaTemplate.send(topic, key, message);

        future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
            @Override
            public void onSuccess(SendResult<String, String> result) {
                System.out.println("消息发送成功: " + message + 
                    " with offset=[" + result.getRecordMetadata().offset() + "]");
            }

            @Override
            public void onFailure(Throwable ex) {
                System.out.println("消息发送失败: " + message + " due to: " + ex.getMessage());
            }
        });
    }
}
```

### REST 控制器

```java
package com.example.kafka.controller;

import com.example.kafka.producer.KafkaProducerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/kafka")
public class KafkaController {

    @Autowired
    private KafkaProducerService producerService;

    @PostMapping("/send")
    public String sendMessage(@RequestParam String topic, 
                            @RequestParam String key, 
                            @RequestParam String message) {
        producerService.sendMessage(topic, key, message);
        return "消息发送成功";
    }

    @PostMapping("/send-with-callback")
    public String sendMessageWithCallback(@RequestParam String topic, 
                                        @RequestParam String key, 
                                        @RequestParam String message) {
        producerService.sendMessageWithCallback(topic, key, message);
        return "消息发送中...";
    }
}
```

## 消息消费者

### 基础消费者示例

```java
package com.example.kafka.consumer;

import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
public class KafkaConsumerService {

    private static final Logger logger = LoggerFactory.getLogger(KafkaConsumerService.class);

    @KafkaListener(topics = "user-events", groupId = "user-service-group")
    public void consumeUserEvents(ConsumerRecord<String, String> record) {
        logger.info("接收到消息 - Topic: {}, Key: {}, Value: {}, Partition: {}, Offset: {}",
                record.topic(), record.key(), record.value(), 
                record.partition(), record.offset());
    }

    @KafkaListener(topics = "order-events", groupId = "order-service-group")
    public void consumeOrderEvents(@Payload String message,
                                 @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
                                 @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
                                 @Header(KafkaHeaders.OFFSET) long offset,
                                 Acknowledgment ack) {
        try {
            logger.info("处理订单事件 - Message: {}, Topic: {}, Partition: {}, Offset: {}",
                    message, topic, partition, offset);
            
            // 处理业务逻辑
            processOrderEvent(message);
            
            // 手动提交偏移量
            ack.acknowledge();
        } catch (Exception e) {
            logger.error("处理订单事件失败", e);
            // 可以选择不提交偏移量，让消息重新消费
        }
    }

    private void processOrderEvent(String message) {
        // 实现具体的业务逻辑
        System.out.println("处理订单: " + message);
    }
}
```

## 配置类

### Kafka 配置类

```java
package com.example.kafka.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.*;
import org.springframework.kafka.listener.ContainerProperties;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");
        configProps.put(ProducerConfig.RETRIES_CONFIG, 3);
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "default-group");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        return factory;
    }
}
```

## 高级特性

### JSON 消息序列化

```java
// 添加 JSON 依赖
// Maven: <dependency><groupId>com.fasterxml.jackson.core</groupId><artifactId>jackson-databind</artifactId></dependency>

// 配置 JSON 序列化器
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=com.example.kafka.model
```

### 用户实体类

```java
package com.example.kafka.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class User {
    @JsonProperty("id")
    private Long id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("email")
    private String email;

    // 构造函数、getter 和 setter
    public User() {}

    public User(Long id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    // getters and setters...
}
```

### JSON 消息生产和消费

```java
// 生产者
@Service
public class UserEventProducer {
    @Autowired
    private KafkaTemplate<String, User> kafkaTemplate;

    public void sendUserEvent(User user) {
        kafkaTemplate.send("user-events", user.getId().toString(), user);
    }
}

// 消费者
@Component
public class UserEventConsumer {
    @KafkaListener(topics = "user-events", groupId = "user-processor-group")
    public void handleUserEvent(User user) {
        System.out.println("处理用户事件: " + user.getName());
    }
}
```

### 错误处理

```java
@Component
public class KafkaErrorHandler {

    private static final Logger logger = LoggerFactory.getLogger(KafkaErrorHandler.class);

    @KafkaListener(topics = "error-prone-topic", groupId = "error-handling-group")
    public void handleMessage(String message) {
        try {
            // 可能抛出异常的业务逻辑
            processMessage(message);
        } catch (Exception e) {
            logger.error("处理消息失败: {}", message, e);
            // 发送到死信队列或进行其他错误处理
            sendToDeadLetterQueue(message, e);
        }
    }

    private void processMessage(String message) {
        // 业务逻辑
        if (message.contains("error")) {
            throw new RuntimeException("模拟处理错误");
        }
        System.out.println("成功处理消息: " + message);
    }

    private void sendToDeadLetterQueue(String message, Exception e) {
        // 实现死信队列逻辑
        System.out.println("发送到死信队列: " + message);
    }
}
```

## 测试

### 集成测试示例

```java
package com.example.kafka;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.KafkaMessageListenerContainer;
import org.springframework.kafka.listener.MessageListener;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.kafka.test.utils.ContainerTestUtils;
import org.springframework.kafka.test.utils.KafkaTestUtils;
import org.springframework.test.annotation.DirtiesContext;

import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

@SpringBootTest
@DirtiesContext
@EmbeddedKafka(partitions = 1, topics = {"test-topic"})
class KafkaIntegrationTest {

    @Autowired
    private EmbeddedKafkaBroker embeddedKafkaBroker;

    @Autowired
    private KafkaProducerService producerService;

    @Test
    void testSendAndReceive() throws InterruptedException {
        Map<String, Object> consumerProps = KafkaTestUtils.consumerProps("test-group", "true", embeddedKafkaBroker);
        consumerProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        DefaultKafkaConsumerFactory<String, String> consumerFactory = 
            new DefaultKafkaConsumerFactory<>(consumerProps, new StringDeserializer(), new StringDeserializer());

        ContainerProperties containerProperties = new ContainerProperties("test-topic");
        KafkaMessageListenerContainer<String, String> container = 
            new KafkaMessageListenerContainer<>(consumerFactory, containerProperties);

        BlockingQueue<ConsumerRecord<String, String>> records = new LinkedBlockingQueue<>();
        container.setupMessageListener((MessageListener<String, String>) records::add);
        container.start();
        ContainerTestUtils.waitForAssignment(container, embeddedKafkaBroker.getPartitionsPerTopic());

        // 发送消息
        producerService.sendMessage("test-topic", "test-key", "test-message");

        // 验证消息接收
        ConsumerRecord<String, String> received = records.poll(10, TimeUnit.SECONDS);
        assert received != null;
        assert "test-message".equals(received.value());
        assert "test-key".equals(received.key());

        container.stop();
    }
}
```

## 完整示例项目结构

```
src/main/java/com/example/kafka/
├── KafkaApplication.java
├── config/
│   └── KafkaConfig.java
├── controller/
│   └── KafkaController.java
├── model/
│   └── User.java
├── producer/
│   └── KafkaProducerService.java
└── consumer/
    └── KafkaConsumerService.java

src/main/resources/
└── application.yml

src/test/java/com/example/kafka/
└── KafkaIntegrationTest.java
```

## 主要配置参数说明

| 参数 | 说明 | 默认值 |
|------|------|--------|
| bootstrap-servers | Kafka 集群地址 | localhost:9092 |
| group-id | 消费者组 ID | 无 |
| auto-offset-reset | 偏移量重置策略 | latest |
| enable-auto-commit | 是否自动提交偏移量 | true |
| acks | 生产者确认模式 | 1 |
| retries | 重试次数 | 0 |

## 最佳实践

1. **生产环境配置**: 使用多个 broker 地址，设置适当的重试和确认策略
2. **监控**: 集成 JMX 指标监控 Kafka 性能
3. **错误处理**: 实现死信队列和重试机制
4. **序列化**: 根据数据类型选择合适的序列化器
5. **分区策略**: 合理设计分区键，确保消息均匀分布
6. **消费者组**: 根据业务需求设置消费者组数量

## 相关链接

- [Apache Kafka 官网](https://kafka.apache.org/)
- [Spring for Apache Kafka 文档](https://spring.io/projects/spring-kafka)
- [Spring Boot Kafka 配置](https://docs.spring.io/spring-boot/docs/current/reference/html/messaging.html#messaging.kafka)
- [Spring Kafka 参考文档](https://docs.spring.io/spring-kafka/docs/current/reference/html/)
- [Kafka 配置属性参考](https://kafka.apache.org/documentation/#configuration)

## 总结

Spring Boot 与 Kafka 的集成为构建事件驱动的微服务架构提供了强大的支持。通过合理的配置和设计模式，可以构建出高性能、可靠的消息传递系统。本指南涵盖了从基础配置到高级特性的完整内容，可以作为实际项目开发的参考。