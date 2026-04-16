---
title: RocketMQ面试题
category:
  - 面试题
tag:
  - RocketMQ
  - 消息队列
date: 2025-12-01
---

# RocketMQ 面试题

> 参考资料：
> - [RocketMQ 官方文档（中文）](https://rocketmq.apache.org/zh/)
> - [RocketMQ GitHub](https://github.com/apache/rocketmq)
> - [RocketMQ 中文社区](https://rocketmq.apache.org/zh/docs/)
> - [Apache RocketMQ 开发者指南（中文）](https://github.com/apache/rocketmq/tree/master/docs/cn)

---

## RocketMQ 是什么？

RocketMQ 是阿里巴巴开源的一款分布式消息中间件，2016 年捐赠给 Apache 基金会，现已成为 Apache 顶级项目。它具备低延迟、高吞吐、高可用、高可靠等特性，广泛应用于交易、金融、大数据、实时计算等场景。

RocketMQ 脱胎于阿里内部的 MetaQ，经历了阿里历年双十一大促的海量流量考验，是国内互联网公司使用最广泛的消息队列之一。

> 消息队列：就是一个使用队列来通信的组件，解耦、削峰、异步是其三大核心使用场景。

---

## RocketMQ 的特点？

- **高吞吐量**：单机可支持亿级消息堆积，吞吐量可达十万级 TPS。
- **高可用**：支持主从架构和 DLedger 模式（基于 Raft 协议），具备自动故障转移能力。
- **低延迟**：正常情况下消息投递延迟在毫秒级。
- **顺序消息**：支持全局顺序消息和局部顺序消息。
- **事务消息**：原生支持分布式事务消息，RabbitMQ 不具备此能力。
- **延迟消息**：原生支持延迟/定时消息（RabbitMQ 需借助插件或 TTL+DLX 实现）。
- **消息过滤**：支持基于 Tag 和 SQL92 表达式的服务端消息过滤。
- **消息追踪**：支持消息轨迹查询，方便排查问题。
- **多语言客户端**：支持 Java、C++、Python、Go 等主流语言。
- **管理界面**：提供 RocketMQ Dashboard 可视化控制台。

---

## RocketMQ 核心概念？

RocketMQ 的整体架构由四部分组成：**NameServer**、**Broker**、**Producer**、**Consumer**。

```
Producer  →  Broker (Master/Slave)  →  Consumer
               ↕ 注册/心跳
           NameServer 集群
```

### NameServer（注册中心）

NameServer 是 RocketMQ 的轻量级注册中心，类似 Kafka 中的 ZooKeeper（但更轻量）。

- Broker 启动后向所有 NameServer 注册自身信息（Topic 路由、地址等）
- Producer/Consumer 启动时从 NameServer 拉取路由信息
- NameServer 节点之间**不互相通信**，每个节点独立存储全量路由信息
- Broker 每 30 秒向 NameServer 发送心跳，NameServer 每 10 秒扫描一次，超过 120 秒未心跳则移除

### Broker（消息服务器）

Broker 是 RocketMQ 的核心，负责消息的存储、投递和查询。

- **Master**：处理读写请求
- **Slave**：从 Master 同步数据，处理读请求（Consumer 可从 Slave 消费）
- 一个 Broker 集群由一组 Master-Slave 组成，BrokerName 相同、BrokerId 不同（Master=0，Slave≥1）

### Topic（主题）

Topic 是消息的逻辑分类，类似 RabbitMQ 中的 Exchange+Queue 的组合概念。一个 Topic 可以分布在多个 Broker 上，每个 Broker 上的 Topic 分为多个 **MessageQueue**（消息队列）。

### MessageQueue（消息队列）

MessageQueue 是 Topic 下的物理存储单元，类似 Kafka 的 Partition。顺序消费、负载均衡都在 MessageQueue 粒度进行。

### Producer（生产者）

生产者负责创建并发送消息到 Broker。生产者通过 NameServer 获取 Topic 的路由信息，按照负载均衡策略选择 MessageQueue 发送。

RocketMQ 提供三种发送方式：

| 发送方式 | 说明 | 适用场景 |
|--------|------|--------|
| **同步发送** | 发送后等待 Broker 返回结果 | 重要通知、短信 |
| **异步发送** | 发送后通过回调处理结果 | 对 RT 敏感的链路 |
| **单向发送** | 只发送，不关心结果 | 日志收集 |

### Consumer（消费者）

消费者负责从 Broker 拉取并消费消息。RocketMQ 支持两种消费模式：

- **集群消费（Clustering）**：同一 ConsumerGroup 内的消费者共同消费，每条消息只被消费一次（类似 RabbitMQ 的轮询分发）
- **广播消费（Broadcasting）**：同一 ConsumerGroup 内的每个消费者都消费全量消息

RocketMQ 也支持两种消费方式：

- **Push 模式**：Broker 主动推送消息给消费者（实质上是 Consumer 长轮询拉取，对用户透明）
- **Pull 模式**：Consumer 主动从 Broker 拉取消息，自主控制消费进度

### ConsumerGroup（消费者组）

一组消费同一类消息的消费者集合。同一 ConsumerGroup 内的消费者共享消费进度（offset）。

---

## AMQP 与 RocketMQ 协议对比？

RocketMQ 使用自研的**私有协议**（基于 TCP 的二进制协议），而 RabbitMQ 基于 AMQP 标准协议。

| 对比项 | RocketMQ | RabbitMQ |
|-------|---------|---------|
| 协议 | 自研私有协议 | AMQP 标准协议 |
| 注册中心 | NameServer | 内置（无需额外组件） |
| 路由 | Topic + MessageQueue | Exchange + Binding + Queue |
| 事务消息 | 原生支持 | 不支持 |
| 延迟消息 | 原生支持 | 需插件或 TTL+DLX |
| 消息过滤 | 服务端过滤（Tag/SQL） | 客户端过滤 |

---

## 什么是死信队列？如何导致的？

RocketMQ 的**死信队列（Dead Letter Queue，DLQ）** 用于处理无法正常消费的消息。

消息在以下情况下会进入死信队列：

1. **消费重试次数超过上限**：默认最大重试次数为 16 次，超过后消息进入死信队列
2. **消息在重试队列中超时**：消息在重试队列中等待时间过长

死信 Topic 命名规则：`%DLQ%{ConsumerGroupName}`

```java
// 消费者重试次数配置
consumer.setMaxReconsumeTimes(16); // 默认 16 次
```

与 RabbitMQ 不同，RocketMQ 的死信机制是**基于 ConsumerGroup 粒度**的，不是队列粒度。消息进入死信队列后，需要人工介入处理（消费死信 Topic 或通过控制台重新投递）。

---

## 什么是延迟消息？RocketMQ 怎么实现延迟消息？

延迟消息指消息发送后，消费者不能立刻消费，而是在指定时间后才能消费。

**RocketMQ 4.x 实现方式**（级别延迟）：

RocketMQ 4.x 原生支持 18 个延迟级别：

```
1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
```

```java
Message msg = new Message("TopicTest", "TagA", "Hello".getBytes());
// 设置延迟级别，3 代表 10s
msg.setDelayTimeLevel(3);
producer.send(msg);
```

**实现原理**：
1. 消息发送时，Broker 将消息存入内部 Topic `SCHEDULE_TOPIC_XXXX`，按延迟级别分配到对应 MessageQueue
2. Broker 内置定时任务定期扫描，到期后将消息投递到原始 Topic
3. Consumer 从原始 Topic 消费消息

**RocketMQ 5.x 实现方式**（任意时间延迟）：

RocketMQ 5.0 开始支持任意时间精度的定时消息，不再受限于固定级别：

```java
// 设置具体投递时间戳（毫秒）
msg.setDeliverTimeMs(System.currentTimeMillis() + 10 * 1000L);
```

> 对比 RabbitMQ 需要 TTL+DLX 模拟延迟队列，RocketMQ 的延迟消息是原生能力，更简单可靠。

---

## 什么是顺序消息？

顺序消息保证消息按照发送顺序被消费，分两种：

### 全局顺序

整个 Topic 只有一个 MessageQueue，所有消息严格按顺序消费。吞吐量极低，生产环境几乎不用。

### 局部顺序（推荐）

同一业务键（如同一订单 ID）的消息路由到同一 MessageQueue，保证该业务键下的消息有序。

```java
// 生产者：通过 MessageQueueSelector 保证同一 orderId 路由到同一队列
producer.send(msg, (mqs, msg1, arg) -> {
    int orderId = (int) arg;
    int index = orderId % mqs.size();
    return mqs.get(index);
}, orderId);
```

`send` 方法有三个参数：

- `msg`：要发送的消息
- 第二个参数：`MessageQueueSelector` 接口的 Lambda 实现，决定消息发到哪个队列
- `orderId`：传给 Selector 的业务参数，对应 Lambda 里的 `arg`

Lambda 里三个入参的含义：

- `mqs`：当前 Topic 下所有可用的 MessageQueue 列表，比如 `[Queue0, Queue1, Queue2, Queue3]`
- `msg1`：消息本身（这里用不到）
- `arg`：就是外面传进来的 `orderId`

核心逻辑只有一行：

```java
int index = orderId % mqs.size();
```

用订单 ID 对队列数量取模，保证**同一个 orderId 永远落到同一个队列**。举个例子：

```
队列数量 = 4，mqs = [Queue0, Queue1, Queue2, Queue3]

orderId=1001  → 1001 % 4 = 1 → Queue1
orderId=1002  → 1002 % 4 = 2 → Queue2
orderId=1001  → 1001 % 4 = 1 → Queue1  ← 和第一条一样，保证顺序
orderId=1003  → 1003 % 4 = 3 → Queue3
```

所以订单 1001 的「创建→付款→发货」三条消息，永远都在 Queue1 里，天然有序。

---

```java
// 消费者：使用 MessageListenerOrderly 保证顺序消费
consumer.registerMessageListener((MessageListenerOrderly) (msgs, context) -> {
    // 处理消息
    return ConsumeOrderlyStatus.SUCCESS;
});
```


这里用的是 `MessageListenerOrderly`，和普通的 `MessageListenerConcurrently` 有本质区别：

#### `MessageListenerConcurrently` 的实际行为

并发消费时，RocketMQ 会**批量拉取**消息，然后把这批消息**打散分发**给线程池：

```
Queue1 拉取一批消息: [msg1, msg2, msg3, msg4, msg5]
        ↓
    线程池分发
        ↓
线程A → msg1
线程B → msg2  
线程C → msg3
线程A → msg4（msg1处理完了）
线程B → msg5
```

多条消息**同时**被不同线程处理，所以叫并发消费。顺序完全无法保证，msg3 可能比 msg1 先处理完。

对，但要补充一个细节，让描述更准确。

---

**并发消费的"并发"有两个层面：**

**层面一：多个 Queue 之间并发**（这个无论哪种模式都有）

```
Queue1 → 线程A
Queue2 → 线程B
Queue3 → 线程C
```

**层面二：单个 Queue 内部，多条消息并发**（这个才是 Concurrently 独有的）

```
Queue1 拉取一批: [msg1, msg2, msg3]
    ↓
线程A → msg1
线程B → msg2   ← 同一个 Queue1 内，三条消息同时被不同线程处理
线程C → msg3
```

---

所以 `MessageListenerConcurrently` 的并发，**既包括队列间并发，也包括队列内部并发**，吞吐量是最高的，但代价是完全无法保证顺序。

---

#### `MessageListenerOrderly` 的实际行为

顺序消费时，锁加在 **MessageQueue** 上，同一个队列同一时刻只有一个线程在跑，且**严格一条一条处理**：

```
Queue1: [msg1, msg2, msg3, msg4, msg5]
        ↓
  线程A 拿到 Queue1 的锁
        ↓
  线程A 处理 msg1 → 完成
  线程A 处理 msg2 → 完成
  线程A 处理 msg3 → 完成
  ...（串行）
        ↓
  线程A 释放锁
```

`MessageListenerOrderly` 的并发，**只有队列间并发**，单个队列内部严格串行，是在吞吐量和顺序之间取的平衡。

---

### 那并发体现在哪里？

并发体现在**多个 Queue 之间**，而不是单个 Queue 内部：

```
Queue1: [1001创建, 1001付款, 1001发货]  → 线程A 串行处理（有锁）
Queue2: [1002创建, 1002付款, 1002发货]  → 线程B 串行处理（有锁）
Queue3: [1003创建, 1003付款, 1003发货]  → 线程C 串行处理（有锁）
```

Queue1、Queue2、Queue3 之间是并发的，但每个 Queue 内部是串行的。这就是为什么叫**局部顺序**——同一业务键内有序，不同业务键之间并发，两者兼顾。

---

### 对比总结

| | `MessageListenerConcurrently` | `MessageListenerOrderly` |
|--|--|--|
| **单队列内** | 多线程并发处理 | 单线程串行处理 |
| **多队列间** | 并发 | 并发 |
| **吞吐量** | 高 | 相对低 |
| **顺序保证** | ❌ | ✅（队列内） |
| **失败影响** | 只影响当条消息 | 阻塞整个队列 |

所以我之前说的"同一时刻只有一个线程能消费某个队列"针对的是 `MessageListenerOrderly`，`MessageListenerConcurrently` 是可以多线程同时处理同一队列内不同消息的，这两者的锁策略完全不同。

---

### 失败时的行为差异

这是最需要注意的地方：

```java
// 并发消费失败 → 消息进重试队列，其他消息继续消费，互不影响
return ConsumeConcurrentlyStatus.RECONSUME_LATER;

// 顺序消费失败 → 当前队列挂起，一直重试这条消息，后面的消息全部阻塞
return ConsumeOrderlyStatus.SUSPEND_CURRENT_QUEUE_A_MOMENT;
```

所以顺序消费里一旦某条消息处理失败，**整个队列会被阻塞**，必须处理好异常，避免死循环重试：

```java
consumer.registerMessageListener((MessageListenerOrderly) (msgs, context) -> {
    try {
        for (MessageExt msg : msgs) {
            // 处理业务逻辑
            processOrder(msg);
        }
        return ConsumeOrderlyStatus.SUCCESS;
    } catch (Exception e) {
        // 记录日志，超过一定次数应跳过或人工介入
        // 不能无限重试，否则队列永久阻塞
        if (context.getAttemptTimes() >= 3) {
            log.error("消息消费失败超过最大重试次数，跳过: {}", msg.getMsgId());
            return ConsumeOrderlyStatus.SUCCESS; // 主动跳过，避免阻塞
        }
        return ConsumeOrderlyStatus.SUSPEND_CURRENT_QUEUE_A_MOMENT;
    }
});
```

---

### 整体流程串起来

```
订单创建消息 (orderId=1001)  ──┐
订单付款消息 (orderId=1001)  ──┤  Producer Selector: 1001 % 4 = 1  →  Queue1
订单发货消息 (orderId=1001)  ──┘

Queue1: [创建, 付款, 发货]
```

---

## 什么是事务消息？

事务消息是 RocketMQ 区别于 RabbitMQ 的核心特性之一，用于解决分布式事务中**消息发送与本地事务的一致性**问题。

**典型场景**：下单后扣减库存，要保证订单创建成功和消息发送同时成功或同时失败。

**实现原理（两阶段提交 + 消息回查）**：

```
1. Producer 发送 Half Message（半消息）到 Broker
   → Broker 存储但不投递给 Consumer

2. Producer 执行本地事务

3a. 本地事务成功 → 发送 Commit → Broker 将消息投递给 Consumer
3b. 本地事务失败 → 发送 Rollback → Broker 删除 Half Message

4. 若 Producer 宕机未发送 Commit/Rollback
   → Broker 主动回查 Producer 的本地事务状态（最多回查 15 次）
```

> 正常消息：Broker 收到 → 立即放入目标 Topic → Consumer 可见可消费
> 半消息：  Broker 收到 → 放入内部 Topic → Consumer 不可见不可消费

```java
TransactionMQProducer producer = new TransactionMQProducer("group");
producer.setTransactionListener(new TransactionListener() {
    @Override
    public LocalTransactionState executeLocalTransaction(Message msg, Object arg) {
        // 执行本地事务
        try {
            // 业务操作...
            return LocalTransactionState.COMMIT_MESSAGE;
        } catch (Exception e) {
            return LocalTransactionState.ROLLBACK_MESSAGE;
        }
    }

    @Override
    public LocalTransactionState checkLocalTransaction(MessageExt msg) {
        // 事务回查：检查本地事务是否执行成功
        return LocalTransactionState.COMMIT_MESSAGE;
    }
});
```

---

### RocketMQ 的事务消息**只保证生产侧**：
> 本地事务执行成功 ↔ 消息一定会被投递到 Broker

**消费侧的事务一致性，RocketMQ 本身不负责**，需要业务自己保证。

---

#### 消费侧面临的问题

```
Broker 投递消息给 Consumer
        ↓
Consumer 收到消息，开始处理
        ↓
执行本地事务（扣减库存）
        ↓
        ⚡ 宕机 / 网络异常
        ↓
消息没有 ACK → Broker 重新投递
        ↓
库存被重复扣减 ❌
```

所以消费侧的核心问题是**重复消费**，而不是丢失。

---

#### 消费侧的保证手段

##### 手段一：幂等性设计（最核心）

保证同一条消息被消费多次，结果和消费一次完全一样。

**方案：用唯一键做去重**

```java
consumer.registerMessageListener((MessageListenerConcurrently) (msgs, context) -> {
    for (MessageExt msg : msgs) {
        String msgId = msg.getMsgId(); // RocketMQ 全局唯一消息ID
        
        // 先查数据库是否已处理过
        boolean processed = orderService.isProcessed(msgId);
        if (processed) {
            log.info("消息已处理，跳过: {}", msgId);
            continue; // 直接跳过，保证幂等
        }
        
        // 处理业务逻辑 + 记录消费日志，放在同一个本地事务里
        orderService.processAndMark(msg, msgId);
    }
    return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
});
```

```sql
-- 消费记录表
CREATE TABLE mq_consume_record (
    msg_id      VARCHAR(64) PRIMARY KEY,  -- 消息唯一ID
    status      TINYINT,                  -- 0处理中 1成功
    create_time DATETIME
);
```

##### 手段二：业务操作 + 消费记录 同一本地事务

```java
@Transactional
public void processAndMark(MessageExt msg, String msgId) {
    // 1. 插入消费记录（若已存在则抛异常，事务回滚）
    consumeRecordMapper.insert(msgId); // 唯一索引保证
    
    // 2. 执行业务操作
    inventoryService.deduct(getOrderId(msg), getCount(msg));
    
    // 两步在同一事务里：要么都成功，要么都失败
}
```

这样即使消费者宕机重启，重新消费时插入消费记录会因唯一索引冲突而失败，事务回滚，业务操作也不会重复执行。

##### 手段三：消费失败重试 + 死信队列兜底

```java
consumer.registerMessageListener((MessageListenerConcurrently) (msgs, context) -> {
    try {
        process(msgs);
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS;
    } catch (Exception e) {
        log.error("消费失败，等待重试", e);
        return ConsumeConcurrentlyStatus.RECONSUME_LATER; // 触发重试
    }
    // 重试 16 次后进入死信队列 %DLQ%{ConsumerGroup}
});

// 单独起一个 Consumer 监听死信队列，告警 + 人工处理
consumer2.subscribe("%DLQ%orderConsumerGroup", "*");
```

---

#### 完整的一致性保证链路

```
Producer                    Broker                              Consumer
   |                           |                                   |
   |--- 发送半消息 -----------> |                                   |
   |                           | 存入 RMQ_SYS_TRANS_HALF_TOPIC     |
   |                           | （order_topic 里没有）             |
   |                           |                                   ✗ 看不到消息
   |--- 执行本地事务 -------    |                                   |
   |                           |                                   |
   |--- Commit --------------> |                                   |
   |                           | 取出半消息                        |
   |                           | 写入真实 order_topic              |
   |                           |                                   |
   |                           |------------- 投递 -------------> |
   |                           |                                   |-- 查去重表
   |                           |                                   |-- 执行业务
   |                           |                                   |-- 写去重表 (同一事务)
   |                           |                                   |-- ACK ✓
   |                           |                                   |
   |                           |          (失败场景)               |
   |                           |                                   |-- 异常 → RECONSUME_LATER
   |                           |<---------- 重新投递 --------------|
   |                           |                                   |
   |                           |------------- 投递 -------------> |
   |                           |                                   |-- 查去重表 → 已处理
   |                           |                                   |-- 跳过 ✓
   |                           |                                   |-- ACK ✓
   |                           |                                   |
   |                    (Producer宕机场景)                         |
   |                           |                                   |
   |                    Broker 定时回查                            |
   |<---------- checkLocalTransaction -------------------------|   |
   |--- 返回本地事务状态 -----> |                                   |
   |                           | COMMIT  → 写入 order_topic -----> |
   |                           | ROLLBACK → 丢弃半消息             |
```

---

#### 总结

| 阶段 | 保证手段 |
|-----|--------|
| 生产侧 | RocketMQ 事务消息（半消息 + 回查） |
| 消费侧 | 幂等性设计 + 业务与去重记录同事务 + 死信队列兜底 |

**生产侧保证消息不丢，消费侧保证消息不重复执行**，两者结合才是完整的分布式事务一致性方案。

---

## RocketMQ 有哪些工作模式？

| 模式 | 说明 |
|-----|------|
| **普通消息** | 最基础的发送/消费模式 |
| **顺序消息** | 保证同一 MessageQueue 内消息有序消费 |
| **延迟消息** | 消息在指定时间后才能被消费 |
| **事务消息** | 保证本地事务与消息发送的一致性 |
| **批量消息** | 单次调用发送多条消息，提升吞吐量 |
| **过滤消息** | 基于 Tag 或 SQL92 在 Broker 端过滤消息 |

---

## 如何保证消息的可靠性？

消息可靠性同样需要从三个阶段保障：**生产者→Broker**、**Broker 存储**、**Broker→消费者**。

### 一、生产者到 Broker 的可靠性

**同步发送 + 失败重试**：

```java
producer.setRetryTimesWhenSendFailed(3); // 同步发送失败重试次数
producer.setRetryTimesWhenSendAsyncFailed(3); // 异步发送失败重试次数
```

**开启 Confirm 机制**（类似 RabbitMQ 的 Publisher Confirm）：

RocketMQ 同步发送默认会等待 Broker 的 ACK，发送成功返回 `SEND_OK`，失败抛出异常，可捕获后重试或存入本地消息表。

### 二、Broker 自身的可靠性

**消息持久化**：

RocketMQ 所有消息默认持久化到磁盘（CommitLog），不存在"是否持久化"的选项，天然比 RabbitMQ 更可靠。

**同步刷盘 vs 异步刷盘**：

| 刷盘方式 | 说明 | 适用场景 |
|--------|------|--------|
| **异步刷盘**（默认） | 消息写入内存即返回，后台异步写磁盘 | 高性能场景 |
| **同步刷盘** | 消息写入磁盘后才返回 ACK | 金融、支付等高可靠场景 |

```properties
# broker.conf
flushDiskType=SYNC_FLUSH   # 同步刷盘
# flushDiskType=ASYNC_FLUSH  # 异步刷盘（默认）
```

**主从同步（同步复制 vs 异步复制）**：

| 复制方式 | 说明 |
|--------|------|
| **异步复制**（默认） | Master 写入后立即返回，Slave 异步同步 |
| **同步复制** | Master 等待 Slave 同步完成后才返回 ACK |

```properties
# broker.conf
brokerRole=SYNC_MASTER    # 同步复制
# brokerRole=ASYNC_MASTER  # 异步复制（默认）
```

> 生产环境高可靠配置：**同步刷盘 + 同步复制**，但性能有损耗，需根据业务权衡。

### 三、Broker 到消费者的可靠性

**手动 ACK + 重试机制**：

RocketMQ 消费者消费完成后需返回消费状态，失败会自动重试：

```java
consumer.registerMessageListener((MessageListenerConcurrently) (msgs, context) -> {
    try {
        // 处理消息...
        return ConsumeConcurrentlyStatus.CONSUME_SUCCESS; // 消费成功，ACK
    } catch (Exception e) {
        return ConsumeConcurrentlyStatus.RECONSUME_LATER; // 消费失败，稍后重试
    }
});
```

**重试策略**：消费失败后消息进入重试队列 `%RETRY%{ConsumerGroupName}`，按延迟级别逐步延长重试间隔（10s → 30s → 1m → ... → 2h），最多重试 16 次后进入死信队列。

**幂等性设计**：由于网络问题可能导致消息重复投递，消费者必须做幂等处理（可用 MessageId 或业务唯一键去重）。

### 四、最佳实践总结

1. **生产端**：同步发送 + 失败重试 + 本地消息表兜底
2. **Broker 端**：同步刷盘 + 同步复制（高可靠场景）
3. **消费端**：手动 ACK + 幂等性设计 + 死信队列监控告警
4. **监控**：关注消息堆积量、消费延迟、死信队列消息数

---

## 如何保证 RocketMQ 消息的顺序性？

- **局部顺序**：通过 `MessageQueueSelector` 将同一业务键（订单 ID、用户 ID 等）的消息路由到同一 MessageQueue，消费端使用 `MessageListenerOrderly` 保证单队列串行消费。
- **全局顺序**：Topic 只配置一个 MessageQueue，吞吐量极低，非必要不用。

注意事项：

- `MessageListenerOrderly` 消费失败后会**阻塞该队列**直到成功，要防止消费逻辑死循环
- Consumer 扩缩容时会触发 Rebalance，短暂期间可能出现短暂乱序，需业务层容忍

---

## 如何保证 RocketMQ 高可用？

### 主从模式（RocketMQ 4.x 经典方案）

**普通主从（异步复制）**：

- Master 处理读写，Slave 异步同步数据
- Master 宕机后，Consumer 可切换到 Slave 继续消费，但**Slave 不能自动升主**，需人工介入
- 存在数据丢失风险（未同步的消息）

**同步双写**：

- Master 等待 Slave 同步完成才返回 ACK
- 性能下降约 10%，但数据更安全

### DLedger 模式（RocketMQ 4.5+ 推荐）

基于 **Raft 协议**实现，支持自动选主，解决了普通主从无法自动故障转移的问题：

- 集群节点数建议为奇数（3、5 个），保证选举可进行
- 消息写入需超过半数节点确认（Quorum Write）
- Master 宕机后自动从 Slave 中选出新 Master

```properties
# broker.conf 开启 DLedger 模式
enableDLegerCommitLog=true
dLegerGroup=broker-a
dLegerPeers=n0-127.0.0.1:40911;n1-127.0.0.1:40912;n2-127.0.0.1:40913
dLegerSelfId=n0
```

### RocketMQ 5.x 新架构

RocketMQ 5.0 引入了存算分离架构：

- **Proxy 层**：无状态的接入层，负责协议转换和路由
- **Controller 模式**：基于 Raft 的元数据管理，替代 NameServer + DLedger 的组合

### 生产环境最佳实践

1. **NameServer**：部署 3 个以上节点，客户端随机选择连接
2. **Broker**：DLedger 模式 3 节点部署，同步刷盘
3. **Producer/Consumer**：配置多个 NameServer 地址，自动容错
4. **监控告警**：RocketMQ Dashboard + 堆积告警 + 死信队列告警

---

## 如何解决消息堆积和过期失效问题？

### 消息堆积

**原因**：消费速度跟不上生产速度，导致大量消息积压在 Broker。

**解决方案**：

1. **临时扩容消费者**：增加 ConsumerGroup 内的消费者数量（不超过 MessageQueue 数量，否则多余的消费者空跑）
2. **增加 MessageQueue 数量**：扩大 Topic 的 MessageQueue 数，再对应增加消费者
3. **消费端并行度**：提升单个消费者的线程数

```java
consumer.setConsumeThreadMin(20);
consumer.setConsumeThreadMax(64);
consumer.setConsumeMessageBatchMaxSize(32); // 批量消费
```

4. **降级处理**：高峰期暂时跳过非关键消息，峰值过后补偿

### 消息过期失效

RocketMQ 消息**默认保存 48 小时**（可配置），超时后由 Broker 定期清理：

```properties
# broker.conf
fileReservedTime=48  # 消息保留时间（小时）
```

消息过期丢失后的补救方案：和 RabbitMQ 类似，只能通过业务补偿：

1. 从业务数据库查询该时间段内未处理的数据
2. 编写临时补偿程序，将数据重新发送到 MQ
3. 等低峰期执行，避免二次冲击系统

---

## RocketMQ 消息过滤有哪些方式？

### Tag 过滤（推荐，服务端过滤）

```java
// 生产者设置 Tag
Message msg = new Message("TopicTest", "TagA", body);

// 消费者订阅指定 Tag
consumer.subscribe("TopicTest", "TagA || TagB"); // 多个 Tag 用 || 分隔
consumer.subscribe("TopicTest", "*"); // 订阅所有
```

### SQL92 过滤（基于属性）

```java
// 生产者设置用户属性
msg.putUserProperty("price", "100");

// 消费者使用 SQL 表达式过滤
consumer.subscribe("TopicTest",
    MessageSelector.bySql("price > 50 AND price < 200"));
```

> SQL92 过滤需要 Broker 开启 `enablePropertyFilter=true`，且会增加 Broker 的 CPU 消耗，Tag 过滤能满足需求时优先使用。

---

## RocketMQ 与 Kafka、RabbitMQ 横向对比

| 对比项 | RocketMQ | Kafka | RabbitMQ |
|-------|---------|-------|---------|
| **开发语言** | Java | Scala/Java | Erlang |
| **协议** | 自研 | 自研 | AMQP |
| **单机吞吐量** | 十万级 | 百万级 | 万级 |
| **消息延迟** | 毫秒级 | 毫秒级 | 微秒级 |
| **顺序消息** | 支持（局部/全局） | 支持（分区级别） | 不支持 |
| **事务消息** | 支持 | 支持 | 不支持 |
| **延迟消息** | 支持（原生） | 不支持 | 需插件 |
| **消息过滤** | 服务端 Tag/SQL | 客户端 | 客户端 |
| **消息堆积** | 支持大量堆积 | 支持大量堆积 | 堆积影响性能 |
| **适用场景** | 业务消息、金融、电商 | 日志、大数据流 | 企业级、复杂路由 |