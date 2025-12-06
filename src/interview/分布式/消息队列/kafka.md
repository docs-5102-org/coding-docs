---
title: Kafka面试题
category:
  - 面试题
tag:
  - kafka
  - 消息队列
date: 2025-12-01
---

# Kafka常见问题总结

## Kafka 基础

### Kafka 是什么？主要应用场景有哪些？

Kafka 是一个由领英（LinkedIn）开发并开源的分布式流处理平台。这到底是什么意思呢？

流平台具有三个关键功能：

**消息队列**：发布和订阅消息流,这个功能类似于消息队列,这也是 Kafka 也被归类为消息队列的原因。

**容错的持久方式存储记录消息流**：Kafka 会把消息持久化到磁盘,有效避免了消息丢失的风险。

**流式处理平台**：在消息发布的时候进行处理,Kafka 提供了一个完整的流式处理类库。

Kafka 主要有两大应用场景：

**消息队列**：建立实时流数据管道,以可靠地在系统或应用程序之间获取数据。

**数据处理**：构建实时的流数据处理程序来转换或处理数据流。

### 和其他消息队列相比,Kafka 的优势在哪里？

我们现在经常提到 Kafka 的时候就已经默认它是一个非常优秀的消息队列了,我们也会经常拿它跟 RocketMQ、RabbitMQ 对比。我觉得 Kafka 相比其他消息队列主要的优势如下：

**极致的性能**：基于 Scala 和 Java 语言开发,设计中大量使用了批量处理和异步的思想,最高可以每秒处理千万级别的消息。

**生态系统兼容性无可匹敌**：Kafka 与周边生态系统的兼容性是最好的没有之一,尤其在大数据和流计算领域。

实际上在早期的时候 Kafka 并不是一个合格的消息队列,早期的 Kafka 在消息队列领域就像是一个衣衫褴褛的孩子一样,功能不完备并且有一些小问题比如丢失消息、不保证消息可靠性等等。当然,这也和 LinkedIn 最早开发 Kafka 用于处理海量的日志有很大关系,哈哈哈,人家本来最开始就不是为了作为消息队列滴,谁知道后面误打误撞在消息队列领域占据了一席之地。

随着后续的发展,这些短板都被 Kafka 逐步修复完善。所以,**Kafka 作为消息队列不可靠这个说法已经过时！**

### 队列模型了解吗？Kafka 的消息模型知道吗？

**队列模型：早期的消息模型**

使用队列（Queue）作为消息通信载体,满足生产者与消费者模式,一条消息只能被一个消费者使用,未被消费的消息在队列中保留直到被消费或超时。

比如：我们生产者发送 100 条消息的话,两个消费者来消费一般情况下两个消费者会按照消息发送的顺序各自消费一半（也就是你一个我一个的消费。）

**队列模型存在的问题：**

假如我们存在这样一种情况：我们需要将生产者产生的消息分发给多个消费者,并且每个消费者都能接收到完整的消息内容。

这种情况,队列模型就不好解决了。很多比较杠精的人就说：我们可以为每个消费者创建一个单独的队列,让生产者发送多份。这是一种非常愚蠢的做法,浪费资源不说,还违背了使用消息队列的目的。

**发布-订阅模型:Kafka 消息模型**

发布-订阅模型主要是为了解决队列模型存在的问题。

发布订阅模型（Pub-Sub）使用**主题（Topic）**作为消息通信载体,类似于**广播模式**；发布者发布一条消息,该消息通过主题传递给所有的订阅者,**在一条消息广播之后才订阅的用户则是收不到该条消息的**。

**在发布-订阅模型中,如果只有一个订阅者,那它和队列模型就基本是一样的了。所以说,发布-订阅模型在功能层面上是可以兼容队列模型的。**

<img src="/assets/images/message-queue/kafka-1764636258814.png" style="width: 800px;"></img>

**Kafka 采用的就是发布-订阅模型。**

## Kafka 核心概念

### 什么是 Producer、Consumer、Broker、Topic、Partition？

Kafka 将生产者发布的消息发送到 **Topic（主题）**中,需要这些消息的消费者可以订阅这些 **Topic（主题）**。

如下图所示：

<img src="/assets/images/message-queue/kafka-architecture.png" style="width: 800px;"></img>

Kafka 比较重要的几个概念：

**Producer（生产者）**：产生消息的一方。

**Consumer（消费者）**：消费消息的一方。

**Broker（代理）**：可以看作是一个独立的 Kafka 实例。多个 Kafka Broker 组成一个 Kafka Cluster。

同时,你一定也注意到每个 Broker 中又包含了 Topic 以及 Partition 这两个重要的概念：

**Topic（主题）**：Producer 将消息发送到特定的主题,Consumer 通过订阅特定的 Topic(主题) 来消费消息。

**Partition（分区）**：Partition 属于 Topic 的一部分。一个 Topic 可以有多个 Partition,并且同一 Topic 下的 Partition 可以分布在不同的 Broker 上,这也就表明一个 Topic 可以横跨多个 Broker。这正如我上面所画的图一样。

划重点：**Kafka 中的 Partition（分区）实际上可以对应成为消息队列中的队列。这样是不是更好理解一点？**

### Kafka 的多副本机制了解吗？带来了什么好处？

#### 分区（Partition）与副本（Replica）概念
- **分区（Partition）**：Topic 的物理分组，是 Kafka 并行处理的基本单位
- **副本（Replica）**：每个分区的多个数据拷贝，分布在不同 Broker 上
- **副本角色**：
  - **Leader 副本**：唯一负责读写请求的副本
  - **Follower 副本**：从 leader 副本中拉取消息进行同步，不处理客户端请求

还有一点我觉得比较重要的是 Kafka 为分区（Partition）引入了多副本（Replica）机制。分区（Partition）中的多个副本之间会有一个叫做 leader 的家伙,其他副本称为 follower。我们发送的消息会被发送到 leader 副本,然后 follower 副本才能从 leader 副本中拉取消息进行同步。

生产者和消费者只与 leader 副本交互。你可以理解为其他副本只是 leader 副本的拷贝,它们的存在只是为了保证消息存储的安全性。当 leader 副本发生故障时会从 follower 中选举出一个 leader,但是 follower 中如果有和 leader 同步程度达不到要求的参加不了 leader 的竞选。

**Kafka 的多分区（Partition）以及多副本（Replica）机制有什么好处呢？**

Kafka 通过给特定 Topic 指定多个 Partition,而各个 Partition 可以分布在不同的 Broker 上,这样便能提供比较好的并发能力（负载均衡）。

Partition 可以指定对应的 Replica 数,这也极大地提高了消息存储的安全性,提高了容灾能力,不过也相应的增加了所需要的存储空间。

###  Kafka副本同步机制

#### 1. 数据流转过程
```
生产者 → Leader 副本 → Follower 副本主动拉取 → 数据同步完成
         ↓
      消费者从 Leader 读取
```

#### 2. ISR（In-Sync Replicas）机制
**ISR 集合**：与 Leader 保持同步的副本集合（包含 Leader 自身）

**同步判定标准**：
- **replica.lag.time.max.ms**（默认 10s）：Follower 超过该时间未拉取数据会被移出 ISR
- 不再使用消息条数差值判断（0.9 版本后废弃 replica.lag.max.messages）

**ISR 动态调整**：
```
正常情况: ISR = {Leader, Follower1, Follower2}
Follower2 延迟: ISR = {Leader, Follower1}
Follower2 追上: ISR = {Leader, Follower1, Follower2}
```

#### 3. Leader 选举规则
**触发场景**：
- Leader 所在 Broker 宕机
- Leader 副本损坏
- 分区重新分配（Partition Reassignment）

**选举策略**：
- **默认策略**：从 ISR 集合中选择第一个存活的副本作为新 Leader
- **unclean.leader.election.enable = false**（推荐）：
  - 只允许 ISR 中的副本参与选举，保证数据不丢失
  - 若 ISR 全部宕机，分区不可用（牺牲可用性保证一致性，类似 CP）
- **unclean.leader.election.enable = true**（高可用场景）：
  - 允许非 ISR 副本参与选举（可能丢失部分数据）
  - 保证服务可用性（类似 AP）

## Zookeeper 和 Kafka

### Zookeeper 在 Kafka 中的作用是什么？

ZooKeeper 主要为 Kafka 提供元数据的管理的功能。

Zookeeper 主要为 Kafka 做了下面这些事情：

**Broker 注册**：在 Zookeeper 上会有一个专门**用来进行 Broker 服务器列表记录**的节点。每个 Broker 在启动时,都会到 Zookeeper 上进行注册,即到 `/brokers/ids` 下创建属于自己的节点。每个 Broker 就会将自己的 IP 地址和端口等信息记录到该节点中去。

**Topic 注册**：在 Kafka 中,同一个**Topic 的消息会被分成多个分区**并将其分布在多个 Broker 上,**这些分区信息及与 Broker 的对应关系**也都是由 Zookeeper 在维护。比如我创建了一个名字为 my-topic 的主题并且它有两个分区,对应到 zookeeper 中会创建这些文件夹：
`/brokers/topics/my-topic/Partitions/0`、`/brokers/topics/my-topic/Partitions/1`

**负载均衡**：上面也说过了 Kafka 通过给特定 Topic 指定多个 Partition,而各个 Partition 可以分布在不同的 Broker 上,这样便能提供比较好的并发能力。对于同一个 Topic 的不同 Partition,Kafka 会尽力将这些 Partition 分布到不同的 Broker 服务器上。当生产者产生消息后也会尽量投递到不同 Broker 的 Partition 里面。当 Consumer 消费的时候,Zookeeper 可以根据当前的 Partition 数量以及 Consumer 数量来实现动态负载均衡。

### 使用 Kafka 能否不引入 Zookeeper?

在 Kafka 2.8 之前,Kafka 最被大家诟病的就是其重度依赖于 Zookeeper。在 Kafka 2.8 之后,引入了基于 Raft 协议的 KRaft 模式,不再依赖 Zookeeper,大大简化了 Kafka 的架构,让你可以以一种轻量级的方式来使用 Kafka。

不过,要提示一下：**如果要使用 KRaft 模式的话,建议选择较高版本的 Kafka,因为这个功能还在持续完善优化中。Kafka 3.3.1 版本是第一个将 KRaft（Kafka Raft）共识协议标记为生产就绪的版本。**

## Kafka 消费顺序、消息丢失和重复消费

### Kafka 如何保证消息的消费顺序？

#### 业务场景分析

假设我们依次发送两条消息到 Kafka：
1. **消息 1**：将用户从普通会员升级为 VIP 会员
2. **消息 2**：根据用户当前会员等级计算订单价格

**正常顺序执行：**
```
用户等级：普通 → VIP
计算价格：按 VIP 折扣计算 ✅ 正确
```

**乱序执行的后果：**
```
先执行消息 2：按普通会员价格计算（此时还未升级）
后执行消息 1：用户升级为 VIP
结果：用户已是 VIP，却按普通价格付款 ❌ 业务错误
```

这会导致：
- 用户投诉（已升级 VIP 却没享受折扣）
- 财务损失（价格计算错误）
- 数据不一致（会员等级与订单价格不匹配）

#### Kafka 顺序性保障机制

1. **分区内有序**：Kafka 只保证单个 Partition 内消息的顺序性，通过 offset（偏移量）实现，**Kafka 只能为我们保证 Partition(分区) 中的消息有序。**
2. **分区间无序**：不同 Partition 之间的消息无法保证顺序
3. **消费者顺序消费**：单个消费者按 offset 顺序消费分区消息

如图所示：

![](https://oss.javaguide.cn/github/javaguide/high-performance/message-queue/KafkaTopicPartionsLayout.png)

#### 解决方案


##### 方案一：单分区方案（不推荐）

**实现方式：**
```
1 个 Topic 只设置 1 个 Partition
```

**优点：**
- 实现简单，天然保证全局有序

**缺点：**
- 完全丧失并行处理能力
- 吞吐量严重受限
- 无法水平扩展
- 单点故障风险高

**适用场景：** 仅适用于消息量极小且对性能无要求的场景

---

##### 方案二：业务 Key 路由方案（强烈推荐）

**实现方式：**
发送消息时指定具有业务意义的 key，Kafka 会将相同 key 的消息路由到同一个 Partition。

**代码示例：**
```java
// 发送消息时指定 key（订单ID）
String orderId = "ORDER_12345";
ProducerRecord<String, String> record = new ProducerRecord<>(
    "order-topic",           // topic
    orderId,                 // key（相同订单的消息会到同一分区）
    orderMessage             // value
);
producer.send(record);
```

**Key 的选择策略：**
- 订单类消息：使用 `订单ID` 作为 key
- 用户类消息：使用 `用户ID` 作为 key
- 设备类消息：使用 `设备ID` 作为 key

**优点：**
- 保证相关消息的局部有序性
- 保留并行处理能力
- 支持水平扩展
- 性能与顺序性兼顾

**注意事项：**
- Key 的分布要均匀，避免数据倾斜
- Partition 数量要合理规划
- 消费者数量不要超过 Partition 数量

---

##### 方案三：显式指定 Partition（特殊场景）

**实现方式：**
```java
// 直接指定 Partition
int partition = 2;
ProducerRecord<String, String> record = new ProducerRecord<>(
    "order-topic",
    partition,               // 显式指定分区
    orderId,
    orderMessage
);
```

**适用场景：**
- 需要将特定类型消息固定到某个分区
- 实现自定义的分区策略

---

##### 方案四：消费端保障（配合使用）

即使生产端保证了顺序，消费端也需要注意：

1. **单线程消费**：一个 Partition 只能由一个消费者线程处理
2. **关闭自动提交**：使用手动提交 offset，确保消息处理完再提交
3. **禁用消费者重试**：失败消息的重试可能打乱顺序

```java
// 消费者配置
properties.put("enable.auto.commit", "false");  // 关闭自动提交
properties.put("max.poll.records", "10");       // 控制每次拉取数量

// 按顺序处理
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        // 同步处理消息
        processMessage(record);
        // 处理成功后才提交 offset
        consumer.commitSync();
    }
}
```

### Kafka 如何保证消息不丢失？

**生产者丢失消息的情况**

生产者(Producer) 调用`send`方法发送消息之后,消息可能因为网络问题并没有发送过去。

所以,我们不能默认在调用`send`方法发送消息之后消息发送成功了。为了确定消息是发送成功,我们要判断消息发送的结果。但是要注意的是 Kafka 生产者(Producer) 使用 `send` 方法发送消息实际上是异步的操作,我们可以通过 `get()`方法获取调用结果,但是这样也让它变为了同步操作,示例代码如下：

```java
SendResult sendResult = kafkaTemplate.send(topic, o).get();
if (sendResult.getRecordMetadata() != null) {
  logger.info("生产者成功发送消息到" + sendResult.getProducerRecord().topic() + "-> " + sendResult.getProducerRecord().value().toString());
}
```

但是一般不推荐这么做！可以采用为其添加回调函数的形式,示例代码如下：

```java
ListenableFuture<SendResult<String, Object>> future = kafkaTemplate.send(topic, o);

future.addCallback(
    result -> {
        RecordMetadata metadata = result.getRecordMetadata();
        logger.info("消息发送成功 - topic: {}, partition: {}, offset: {}", 
            metadata.topic(), 
            metadata.partition(), 
            metadata.offset());
    },
    ex -> {
        logger.error("消息发送失败 - topic: {}, 错误信息: {}", topic, ex.getMessage(), ex);
        // 可以在这里添加重试逻辑或者发送到死信队列
        handleSendFailure(topic, o, ex);
    }
);
```

**进一步优化 - 使用更现代的 CompletableFuture 方式：**

```java
kafkaTemplate.send(topic, o)
    .whenComplete((result, ex) -> {
        if (ex == null) {
            RecordMetadata metadata = result.getRecordMetadata();
            logger.info("消息发送成功 - topic: {}, partition: {}, offset: {}", 
                metadata.topic(), 
                metadata.partition(), 
                metadata.offset());
        } else {
            logger.error("消息发送失败 - topic: {}, 错误信息: {}", topic, ex.getMessage(), ex);
            handleSendFailure(topic, o, ex);
        }
    });
```

**完整的生产者配置示例：**

```java
@Configuration
public class KafkaProducerConfig {
    
    @Bean
    public ProducerFactory<String, Object> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        
        // 重试配置
        configProps.put(ProducerConfig.RETRIES_CONFIG, 5);  // 重试次数
        configProps.put(ProducerConfig.RETRY_BACKOFF_MS_CONFIG, 1000);  // 重试间隔 1秒
        
        // 确保消息不丢失的配置
        configProps.put(ProducerConfig.ACKS_CONFIG, "all");  // 等待所有副本确认
        configProps.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);  // 开启幂等性
        configProps.put(ProducerConfig.MAX_IN_FLIGHT_REQUESTS_PER_CONNECTION, 5);  // 限制未确认请求数
        
        // 超时配置
        configProps.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 30000);
        configProps.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 120000);
        
        return new DefaultKafkaProducerFactory<>(configProps);
    }
}
```

**封装一个更健壮的消息发送服务：**

```java
@Service
@Slf4j
public class KafkaMessageService {
    
    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    private static final int MAX_MANUAL_RETRY = 3;
    
    /**
     * 发送消息（带手动重试）
     */
    public void sendMessage(String topic, Object message) {
        sendMessageWithRetry(topic, message, 0);
    }
    
    private void sendMessageWithRetry(String topic, Object message, int retryCount) {
        kafkaTemplate.send(topic, message)
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    RecordMetadata metadata = result.getRecordMetadata();
                    log.info("消息发送成功 - topic: {}, partition: {}, offset: {}, retryCount: {}", 
                        metadata.topic(), 
                        metadata.partition(), 
                        metadata.offset(),
                        retryCount);
                } else {
                    log.error("消息发送失败 - topic: {}, retryCount: {}, 错误: {}", 
                        topic, retryCount, ex.getMessage(), ex);
                    
                    // 手动重试逻辑
                    if (retryCount < MAX_MANUAL_RETRY) {
                        log.info("准备重试发送消息 - topic: {}, retryCount: {}", topic, retryCount + 1);
                        try {
                            Thread.sleep(2000 * (retryCount + 1)); // 递增延迟
                            sendMessageWithRetry(topic, message, retryCount + 1);
                        } catch (InterruptedException e) {
                            Thread.currentThread().interrupt();
                            log.error("重试被中断", e);
                            handleFinalFailure(topic, message, ex);
                        }
                    } else {
                        handleFinalFailure(topic, message, ex);
                    }
                }
            });
    }
    
    /**
     * 最终失败处理：可以发送到死信队列或持久化到数据库
     */
    private void handleFinalFailure(String topic, Object message, Throwable ex) {
        log.error("消息最终发送失败，已达最大重试次数 - topic: {}, message: {}", topic, message, ex);
        // 可以：
        // 1. 发送到死信队列
        // 2. 持久化到数据库等待人工处理
        // 3. 发送告警通知
    }
}
```

**主要优化点：**

1. **日志增强**：添加了 offset 信息，记录完整异常堆栈
2. **类型明确**：明确泛型类型 `ListenableFuture<SendResult<String, Object>>`
3. **失败处理**：添加了 `handleSendFailure` 方法来集中处理失败情况
4. **配置优化**：
   - `retries`: 5次（建议值）
   - `retry.backoff.ms`: 1000ms（重试间隔）
   - `acks`: all（确保消息不丢失）
   - `enable.idempotence`: true（避免重复消息）
5. **手动重试**：在自动重试失败后，还可以添加应用层的手动重试逻辑
6. **死信队列**：最终失败后可以发送到死信队列或持久化存储

这样的配置和代码可以最大程度保证消息的可靠性！

如果消息发送失败的话,我们检查失败的原因之后重新发送即可！

另外,这里推荐为 Producer 的`retries`（重试次数）设置一个比较合理的值,一般是 3,但是为了保证消息不丢失的话一般会设置比较大一点。设置完成之后,当出现网络问题之后能够自动重试消息发送,避免消息丢失。另外,建议还要设置重试间隔,因为间隔太小的话重试的效果就不明显了,网络波动一次你 3 次一下子就重试完了。

#### 消费者丢失消息的情况

我们知道消息在被追加到 Partition(分区)的时候都会分配一个特定的偏移量（offset）。偏移量（offset)表示 Consumer 当前消费到的 Partition(分区)的所在的位置。Kafka 通过偏移量（offset）可以保证消息在分区内的顺序性。

![](https://oss.javaguide.cn/github/javaguide/high-performance/message-queue/kafka-offset.jpg)

当消费者拉取到了分区的某个消息之后,消费者会自动提交了 offset。自动提交的话会有一个问题,试想一下,当消费者刚拿到这个消息准备进行真正消费的时候,突然挂掉了,消息实际上并没有被消费,但是 offset 却被自动提交了。

**解决办法也比较粗暴,我们手动关闭自动提交 offset,每次在真正消费完消息之后再自己手动提交 offset。**

但是,细心的朋友一定会发现,这样会带来消息被重新消费的问题。比如你刚刚消费完消息之后,还没提交 offset,结果自己挂掉了,那么这个消息理论上就会被消费两次。

#### Kafka 弄丢了消息

我们知道 Kafka 为分区（Partition）引入了多副本（Replica）机制。分区（Partition）中的多个副本之间会有一个叫做 leader 的家伙,其他副本称为 follower。我们发送的消息会被发送到 leader 副本,然后 follower 副本才能从 leader 副本中拉取消息进行同步。生产者和消费者只与 leader 副本交互。你可以理解为其他副本只是 leader 副本的拷贝,它们的存在只是为了保证消息存储的安全性。

**试想一种情况：假如 leader 副本所在的 broker 突然挂掉,那么就要从 follower 副本重新选出一个 leader,但是 leader 的数据还有一些没有被 follower 副本的同步的话,就会造成消息丢失。**

**设置 acks = all**

解决办法就是我们设置 **acks = all**。acks 是 Kafka 生产者(Producer) 很重要的一个参数。

acks 的默认值即为 1,代表我们的消息被 leader 副本接收之后就算被成功发送。当我们配置 **acks = all** 表示只有所有 ISR 列表的副本全部收到消息时,生产者才会接收到来自服务器的响应。这种模式是最高级别的,也是最安全的,可以确保不止一个 Broker 接收到了消息。该模式的延迟会很高。

**设置 replication.factor >= 3**

为了保证 leader 副本能有 follower 副本能同步消息,我们一般会为 topic 设置 **replication.factor >= 3**。这样就可以保证每个分区(partition) 至少有 3 个副本。虽然造成了数据冗余,但是带来了数据的安全性。

**设置 min.insync.replicas > 1**

一般情况下我们还需要设置 **min.insync.replicas > 1**,这样配置代表消息至少要被写入到 2 个副本才算是被成功发送。**min.insync.replicas** 的默认值为 1,在实际生产中应尽量避免默认值 1。

但是,为了保证整个 Kafka 服务的高可用性,你需要确保 **replication.factor > min.insync.replicas**。为什么呢？

设想一下假如两者相等的话,只要是有一个副本挂掉,剩下副本数 < min.insync.replicas，整个分区不能写入，整个分区就无法正常工作了。这明显违反高可用性！一般推荐设置成 **replication.factor = min.insync.replicas + 1**。

**设置 unclean.leader.election.enable = false**

Kafka 0.11.0.0 版本开始 unclean.leader.election.enable 参数的默认值由原来的 true 改为 false。

我们最开始也说了我们发送的消息会被发送到 leader 副本,然后 follower 副本才能从 leader 副本中拉取消息进行同步。多个 follower 副本之间的消息同步情况不一样,当我们配置了 **unclean.leader.election.enable = false** 的话,当 leader 副本发生故障时就不会从 follower 副本中和 leader 同步程度达不到要求的副本中选择出 leader,这样降低了消息丢失的可能性。

### Kafka 如何保证消息不重复消费？

#### 重复消费的根本原因

Kafka 消息重复消费的核心原因是**消费位移（offset）提交与实际消费处理之间的不一致**。具体场景包括：

**1. 自动提交延迟问题**
消费者已处理消息，但在自动提交 offset 之前发生故障（如进程崩溃、网络中断），重启后会从上次提交的位置重新消费。

**2. Rebalance 触发**
消费组发生再平衡时（新消费者加入、消费者宕机、分区数变化），已消费但未提交 offset 的消息会被重新分配给其他消费者处理。

**3. 手动提交失败**
关闭自动提交后，业务处理成功但 offset 提交失败（网络异常、Coordinator 不可用等）。

#### 方案 1：业务层幂等设计（推荐）

这是最可靠的方案，通过业务逻辑保证重复消息不会产生副作用：

**常见实现方式：**
- **唯一键约束**：利用数据库主键或唯一索引，插入重复数据时自动忽略
- **Redis 去重**：使用消息 ID 作为 key，`SETNX` 命令天然幂等
- **状态机控制**：通过订单状态、版本号等机制防止重复处理
- **分布式锁**：处理消息前先获取锁，保证同一消息只被处理一次

```java
// 示例：Redis 幂等校验
public void consumeMessage(ConsumerRecord<String, String> record) {
    String messageId = record.key();
    // 使用 SETNX，返回 1 表示首次处理
    if (redisTemplate.opsForValue().setIfAbsent(
            "msg:" + messageId, "1", 24, TimeUnit.HOURS)) {
        // 业务处理
        processBusinessLogic(record.value());
    }
    // 重复消息直接忽略
}
```

#### 方案 2：精确控制 Offset 提交时机

关闭自动提交（`enable.auto.commit=false`），在代码中手动管理 offset：

**提交策略对比：**

| 提交时机 | 优点 | 缺点 | 适用场景 |
|---------|------|------|---------|
| **消息拉取后立即提交** | 避免重复消费 | 可能丢失消息 | 允许丢失的日志场景 |
| **业务处理后提交** | 避免消息丢失 | 可能重复消费 | 金融等不容丢失场景 |
| **批量提交** | 提升性能 | 故障时批量重复 | 高吞吐量场景 |

```java
// 推荐方式：业务处理后同步提交
consumer.subscribe(Arrays.asList("topic"));
while (true) {
    ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(100));
    for (ConsumerRecord<String, String> record : records) {
        try {
            // 业务处理（需保证幂等）
            processMessage(record);
            // 同步提交当前 offset
            consumer.commitSync(Collections.singletonMap(
                new TopicPartition(record.topic(), record.partition()),
                new OffsetAndMetadata(record.offset() + 1)
            ));
        } catch (Exception e) {
            // 处理失败不提交，下次重新消费
            log.error("消息处理失败", e);
        }
    }
}
```

#### 方案 3：事务性消息（Kafka 0.11+）

针对端到端精确一次语义（Exactly-Once）的场景：

```java
// 生产者开启事务
Properties props = new Properties();
props.put("transactional.id", "my-transactional-id");
producer.initTransactions();

producer.beginTransaction();
producer.send(record);
producer.commitTransaction(); // 或 abortTransaction()

// 消费者配置事务隔离级别
props.put("isolation.level", "read_committed");
```

#### 方案 4：优化消费者配置

减少 Rebalance 频率，降低重复消费概率：

```properties
# 延长会话超时时间（默认 10s）
session.timeout.ms=30000
# 增加心跳间隔（默认 3s）
heartbeat.interval.ms=3000
# 增加单次拉取最大处理时间（默认 5 分钟）
max.poll.interval.ms=600000
# 减少单次拉取消息数量
max.poll.records=100
```

#### 生产环境最佳实践

**1. 分层防护策略**
- 第一层：业务层幂等（必须）
- 第二层：精准 offset 控制
- 第三层：监控告警（检测异常重复率）

**2. 针对不同场景选择策略**
- **关键业务**（支付、订单）：幂等 + 事务消息
- **数据同步**：幂等 + 手动提交
- **日志收集**：可容忍少量重复，优先保证性能

**3. 补偿机制**
对于允许消息延迟的场景，可采用"先提交 offset + 定时任务兜底"的组合方案，在业务低峰期（如凌晨）通过对账任务修复数据。


## Kafka 重试机制

在 Kafka 如何保证消息不丢失这里，我们提到了 Kafka 的重试机制。由于这部分内容较为重要，我们这里再来详细介绍一下。

网上关于 Spring Kafka 的默认重试机制文章很多，但大多都是过时的，和实际运行结果完全不一样。以下是根据 [spring-kafka-2.9.3](https://mvnrepository.com/artifact/org.springframework.kafka/spring-kafka/2.9.3) 源码重新梳理一下。

### 消费失败会怎么样？

在消费过程中，当其中一个消息消费异常时，会不会卡住后续队列消息的消费？这样业务岂不是卡住了？

生产者代码：

```Java
 for (int i = 0; i < 10; i++) {
   kafkaTemplate.send(KafkaConst.TEST_TOPIC, String.valueOf(i))
 }
```

消费者消代码：

```Java
   @KafkaListener(topics = {KafkaConst.TEST_TOPIC},groupId = "apple")
   private void customer(String message) throws InterruptedException {
       log.info("kafka customer:{}",message);
       Integer n = Integer.parseInt(message);
       if (n%5==0){
           throw new  RuntimeException();
       }
   }
```

在默认配置下，当消费异常会进行重试，重试多次后会跳过当前消息，继续进行后续消息的消费，不会一直卡在当前消息。下面是一段消费的日志，可以看出当 `test-0@95` 重试多次后会被跳过。

```Java
2023-08-10 12:03:32.918 DEBUG 9700 --- [ntainer#0-0-C-1] o.s.kafka.listener.DefaultErrorHandler   : Skipping seek of: test-0@95
2023-08-10 12:03:32.918 TRACE 9700 --- [ntainer#0-0-C-1] o.s.kafka.listener.DefaultErrorHandler   : Seeking: test-0 to: 96
2023-08-10 12:03:32.918  INFO 9700 --- [ntainer#0-0-C-1] o.a.k.clients.consumer.KafkaConsumer     : [Consumer clientId=consumer-apple-1, groupId=apple] Seeking to offset 96 for partition test-0

```

因此，即使某个消息消费异常，Kafka 消费者仍然能够继续消费后续的消息，不会一直卡在当前消息，保证了业务的正常进行。

### 默认会重试多少次？

默认配置下，消费异常会进行重试，重试次数是多少, 重试是否有时间间隔？

看源码 `FailedRecordTracker` 类有个 `recovered` 函数，返回 Boolean 值判断是否要进行重试，下面是这个函数中判断是否重试的逻辑：

```java
	@Override
	public boolean recovered(ConsumerRecord << ? , ? > record, Exception exception,
	    @Nullable MessageListenerContainer container,
	    @Nullable Consumer << ? , ? > consumer) throws InterruptedException {

	    if (this.noRetries) {
         // 不支持重试
	        attemptRecovery(record, exception, null, consumer);
	        return true;
	    }
     // 取已经失败的消费记录集合
	    Map < TopicPartition, FailedRecord > map = this.failures.get();
	    if (map == null) {
	        this.failures.set(new HashMap < > ());
	        map = this.failures.get();
	    }
     //  获取消费记录所在的Topic和Partition
	    TopicPartition topicPartition = new TopicPartition(record.topic(), record.partition());
	    FailedRecord failedRecord = getFailedRecordInstance(record, exception, map, topicPartition);
     // 通知注册的重试监听器，消息投递失败
	    this.retryListeners.forEach(rl - >
	        rl.failedDelivery(record, exception, failedRecord.getDeliveryAttempts().get()));
	    // 获取下一次重试的时间间隔
    long nextBackOff = failedRecord.getBackOffExecution().nextBackOff();
	    if (nextBackOff != BackOffExecution.STOP) {
	        this.backOffHandler.onNextBackOff(container, exception, nextBackOff);
	        return false;
	    } else {
	        attemptRecovery(record, exception, topicPartition, consumer);
	        map.remove(topicPartition);
	        if (map.isEmpty()) {
	            this.failures.remove();
	        }
	        return true;
	    }
	}
```

其中， `BackOffExecution.STOP` 的值为 -1。

```java
@FunctionalInterface
public interface BackOffExecution {

	long STOP = -1;
	long nextBackOff();

}
```

`nextBackOff` 的值调用 `BackOff` 类的 `nextBackOff()` 函数。如果当前执行次数大于最大执行次数则返回 `STOP`，既超过这个最大执行次数后才会停止重试。

```Java
public long nextBackOff() {
  this.currentAttempts++;
  if (this.currentAttempts <= getMaxAttempts()) {
    return getInterval();
  }
  else {
    return STOP;
  }
}
```

那么这个 `getMaxAttempts` 的值又是多少呢？回到最开始，当执行出错会进入 `DefaultErrorHandler` 。`DefaultErrorHandler` 默认的构造函数是：

```Java
public DefaultErrorHandler() {
  this(null, SeekUtils.DEFAULT_BACK_OFF);
}
```

`SeekUtils.DEFAULT_BACK_OFF` 定义的是:

```Java
public static final int DEFAULT_MAX_FAILURES = 10;

public static final FixedBackOff DEFAULT_BACK_OFF = new FixedBackOff(0, DEFAULT_MAX_FAILURES - 1);
```

`DEFAULT_MAX_FAILURES` 的值是 10，`currentAttempts` 从 0 到 9，所以总共会执行 10 次，每次重试的时间间隔为 0。

最后，简单总结一下：Kafka 消费者在默认配置下会进行最多 10 次 的重试，每次重试的时间间隔为 0，即立即进行重试。如果在 10 次重试后仍然无法成功消费消息，则不再进行重试，消息将被视为消费失败。

### 如何自定义重试次数以及时间间隔?

自定义重试次数以及时间间隔,只需要在 `DefaultErrorHandler` 初始化的时候传入自定义的 `FixedBackOff` 即可。重新实现一个 `KafkaListenerContainerFactory`,调用 `setCommonErrorHandler` 设置新的自定义的错误处理器就可以实现。

```Java
@Bean
public KafkaListenerContainerFactory kafkaListenerContainerFactory(ConsumerFactory consumerFactory) {
    ConcurrentKafkaListenerContainerFactory factory = new ConcurrentKafkaListenerContainerFactory();
    // 自定义重试时间间隔以及次数
    FixedBackOff fixedBackOff = new FixedBackOff(1000, 5);
    factory.setCommonErrorHandler(new DefaultErrorHandler(fixedBackOff));
    factory.setConsumerFactory(consumerFactory);
    return factory;
}
```

### 如何在重试失败后进行告警?

自定义重试失败后逻辑,需要手动实现,重写 `DefaultErrorHandler` 的 `handleRemaining` 函数,加上自定义的告警等操作。

`DefaultErrorHandler` 只是默认的一个错误处理器,Spring Kafka 还提供了 `CommonErrorHandler` 接口。手动实现 `CommonErrorHandler` 就可以实现更多的自定义操作,有很高的灵活性。例如根据不同的错误类型,实现不同的重试逻辑以及业务逻辑等。

### 重试失败后的数据如何再次处理?

当达到最大重试次数后,数据会直接被跳过,继续向后进行。当代码修复后,如何重新消费这些重试失败的数据呢？

**死信队列（Dead Letter Queue,简称 DLQ）**是消息中间件中的一种特殊队列。它主要用于处理无法被消费者正确处理的消息,通常是因为消息格式错误、处理失败、消费超时等情况导致的消息被"丢弃"或"死亡"的情况。当消息进入队列后,消费者会尝试处理它。如果处理失败,或者超过一定的重试次数仍无法被成功处理,消息可以发送到死信队列中,而不是被永久性地丢弃。在死信队列中,可以进一步分析、处理这些无法正常消费的消息,以便定位问题、修复错误,并采取适当的措施。

`@RetryableTopic` 是 Spring Kafka 中的一个注解,它用于配置某个 Topic 支持消息重试,更推荐使用这个注解来完成重试。

```Java
// 重试 5 次,重试间隔 100 毫秒,最大间隔 1 秒
@RetryableTopic(
    attempts = "5",
    backoff = @Backoff(delay = 100, maxDelay = 1000)
)
//消费消息
@KafkaListener(topics = {KafkaConst.TEST_TOPIC}, groupId = "apple")
private void customer(String message) {
    log.info("kafka customer:{}", message);
    Integer n = Integer.parseInt(message);
    if (n % 5 == 0) {
        throw new RuntimeException();
    }
    System.out.println(n);
}
```

当达到最大重试次数后,如果仍然无法成功处理消息,消息会被发送到对应的死信队列中。对于死信队列的处理,既可以用 `@DltHandler` 处理,也可以使用 `@KafkaListener` 重新消费。