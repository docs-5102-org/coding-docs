---
title: SpringCloud 面试题（下）
category:
  - SpringCloud 面试题
date: 2025-11-28
---

# SpringCloud 面试题（下）

本篇基于JDK1.8，提供相关的SpringCloud技术栈面试题

```
Spring Boot 2.7.x (JDK 1.8)
└── Spring Cloud Alibaba 2021.0.x
    ├── 注册/配置  → Nacos 1.4.x ~ 2.0.x
    ├── 网关       → Spring Cloud Gateway (2021.x)
    ├── 调用       → OpenFeign / Dubbo 2.7.x
    ├── 负载均衡   → Spring Cloud LoadBalancer / Ribbon
    ├── 熔断限流   → Sentinel 1.8.x
    ├── 分布式事务 → Seata 1.6.x
    ├── 消息       → RocketMQ 4.x / Kafka
    ├── 链路追踪   → SkyWalking / Zipkin
    └── ORM        → MyBatis-Plus 3.5.x
```

---

## 一、Spring Boot 2.7.x 基础

### 1. Spring Boot 自动装配原理是什么？

**答：**

Spring Boot 自动装配的核心流程如下：

1. `@SpringBootApplication` 包含 `@EnableAutoConfiguration`
2. `@EnableAutoConfiguration` 通过 `AutoConfigurationImportSelector` 读取 `META-INF/spring.factories` 文件
3. 该文件中列出所有候选的自动配置类（`XxxAutoConfiguration`）
4. 通过 `@ConditionalOnClass`、`@ConditionalOnMissingBean` 等条件注解过滤，按需装配

```java
// 关键流程伪代码
SpringApplication.run()
  → refreshContext()
  → invokeBeanFactoryPostProcessors()
  → AutoConfigurationImportSelector.selectImports()
  → 读取 spring.factories → 条件过滤 → 注册 Bean
```

> 📌 参考：[Spring Boot 自动装配原理](https://docs.spring.io/spring-boot/docs/2.7.x/reference/html/using.html#using.auto-configuration)

---

### 2. Spring Boot 2.7.x 与 Spring Boot 3.x 的主要区别？

| 对比项 | Spring Boot 2.7.x | Spring Boot 3.x |
|--------|------------------|----------------|
| JDK 最低版本 | JDK 8 | JDK 17 |
| Spring Framework | 5.3.x | 6.x |
| Jakarta EE | javax.* | jakarta.* |
| GraalVM 原生镜像 | 实验性 | 正式支持 |
| 维护状态 | 已停止维护（2023.11） | 活跃维护 |

> 📌 参考：[Spring Boot 版本发布说明](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.7-Release-Notes)

---

## 二、Nacos（注册中心 + 配置中心）

### 3. Nacos 和 Eureka 的区别是什么？

| 对比项 | Nacos | Eureka |
|--------|-------|--------|
| CAP 模型 | 支持 AP + CP 切换 | AP |
| 健康检查 | 支持主动 + 被动 | 客户端心跳 |
| 配置中心 | 内置支持 | 需额外组件（Spring Cloud Config） |
| 控制台 | 功能完善 | 基础 |
| 维护状态 | 活跃 | Eureka 2.x 停止开源 |
| 服务下线 | 实时通知 | 有延迟（依赖缓存刷新） |

**核心区别：** Nacos 默认 AP 模式，适合注册中心场景；可切换 CP 模式（Raft协议），适合配置中心强一致场景。

> 📌 参考：[Nacos 官方文档](https://nacos.io/zh-cn/docs/what-is-nacos.html)  
> 📌 参考：[Nacos vs Eureka 对比](https://nacos.io/zh-cn/docs/nacos-vs-eureka.html)

---

### 4. Nacos 配置中心如何实现动态刷新？

**答：**

Nacos 配置动态刷新有两种方式：

**方式一：`@RefreshScope`（推荐）**
```java
@RestController
@RefreshScope  // 标注后，配置变更时该 Bean 会被重新创建
public class ConfigController {
    @Value("${app.timeout:5000}")
    private Integer timeout;
}
```

**方式二：`@ConfigurationProperties`**
```java
@Component
@ConfigurationProperties(prefix = "app")
// 无需 @RefreshScope，自动刷新
public class AppConfig {
    private Integer timeout;
}
```

**原理：** Nacos 客户端通过长轮询（Long Polling，默认30s）监听服务端配置变更，变更后发布 `RefreshEvent` 事件触发 Bean 刷新。

> 📌 参考：[Nacos Spring Cloud 配置管理](https://nacos.io/zh-cn/docs/quick-start-spring-cloud.html)

---

### 5. Nacos 服务注册的心跳机制是怎样的？

**答：**

- 客户端默认每 **5秒** 发送一次心跳给 Nacos Server
- Nacos Server 若 **15秒** 未收到心跳，将实例标记为"不健康"（unhealthy）
- 若 **30秒** 未收到心跳，将实例从注册列表中删除
- 临时实例（ephemeral=true，默认）走心跳机制；永久实例（ephemeral=false）由服务端主动探测

> 📌 参考：[Nacos 服务发现原理](https://nacos.io/zh-cn/docs/architecture.html)

---

## 三、Spring Cloud Gateway（网关）

### Spring Cloud Gateway 的核心概念是什么？

**答：**

Gateway 三大核心概念：

| 概念 | 说明 |
|------|------|
| **Route（路由）** | 基本构建单元，包含 ID、URI、断言集合、过滤器集合 |
| **Predicate（断言）** | 匹配 HTTP 请求的条件（Path、Header、Method 等） |
| **Filter（过滤器）** | 对请求/响应进行修改，分为 GatewayFilter 和 GlobalFilter |

**请求流程：**
```
客户端请求 → Gateway Handler Mapping（断言匹配）
           → Gateway Web Handler（过滤器链）
           → Pre Filter → 代理请求到下游服务
           → Post Filter → 返回响应给客户端
```

> 📌 参考：[Spring Cloud Gateway 官方文档](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/)
> Spring Cloud Gateway 需要 Spring Boot 和 Spring Webflux 提供的 Netty 运行时环境。它无法在传统的 Servlet 容器中运行，也无法以 WAR 包的形式构建。

---

### Gateway 如何实现限流？

**答：**

Gateway 内置 `RequestRateLimiterGatewayFilterFactory`，基于 Redis + Lua 实现令牌桶算法限流：

**添加依赖**

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis-reactive</artifactId>
</dependency>
```

注意必须是 **reactive** 版本，Gateway 是响应式的。

**3. 完整配置**

```yaml
spring:
  redis:
    host: localhost
    port: 6379
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/api/user/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
                key-resolver: "#{@ipKeyResolver}"
```

```java
@Bean
public KeyResolver ipKeyResolver() {
    return exchange -> Mono.just(
        exchange.getRequest().getRemoteAddress().getAddress().getHostAddress()
    );
}
```

> 📌 参考：[Gateway 限流过滤器](https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/#the-requestratelimiter-gatewayfilter-factory)

---

### Gateway 和 Nginx 的区别与配合方式？

| 对比项 | Nginx | Spring Cloud Gateway |
|--------|-------|---------------------|
| 定位 | 反向代理 / 静态资源 / 负载均衡 | 微服务 API 网关 |
| 服务发现 | 静态配置 | 动态（集成 Nacos） |
| 鉴权 / 过滤 | 有限（Lua 扩展） | 灵活（Java 代码） |
| 性能 | 更高（C语言） | 略低（JVM） |
| 维护成本 | 低 | 与 Java 生态统一 |

**典型部署架构：**
```
用户 → Nginx（入口，SSL卸载，静态资源）
      → Spring Cloud Gateway（鉴权，限流，路由）
      → 各微服务
```

---

## 四、OpenFeign / Dubbo（服务调用）

### 9. OpenFeign 的工作原理是什么？

**答：**

1. `@EnableFeignClients` 扫描所有 `@FeignClient` 注解接口
2. 通过 JDK 动态代理生成代理对象
3. 调用时由 `ReflectiveFeign` 拦截，将方法调用转换为 HTTP 请求
4. 通过 `LoadBalancerClient`（结合 Nacos）选择服务实例
5. 使用底层 HTTP 客户端（默认 URLConnection，可替换为 OkHttp/HttpClient）发送请求

```java
@FeignClient(name = "order-service", fallback = OrderFallback.class)
public interface OrderFeignClient {
    @GetMapping("/order/{id}")
    OrderDTO getOrder(@PathVariable Long id);
}
```

> 📌 参考：[Spring Cloud OpenFeign 文档](https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/)

---

### 10. OpenFeign 超时配置和重试机制如何设置？

**答：**

```yaml
feign:
  client:
    config:
      default:                    # 全局配置
        connectTimeout: 5000      # 连接超时（ms）
        readTimeout: 10000        # 读取超时（ms）
      order-service:              # 针对特定服务
        connectTimeout: 3000
        readTimeout: 5000
  okhttp:
    enabled: true                 # 推荐替换为 OkHttp
```

**重试配置：**
```java
@Bean
public Retryer feignRetryer() {
    // 初始间隔100ms，最大间隔1s，最多重试3次
    return new Retryer.Default(100, 1000, 3);
}
```

⚠️ **注意：** POST 接口不建议开启重试（幂等性问题）。

---

### 11. Dubbo 和 OpenFeign 如何选择？

| 对比项 | OpenFeign | Dubbo 2.7.x |
|--------|-----------|-------------|
| 协议 | HTTP/REST | Dubbo 协议（TCP）/ Triple（HTTP2） |
| 性能 | 中 | 高（序列化更高效） |
| 服务治理 | 依赖 Spring Cloud | 内置完善 |
| 接口约束 | 无（HTTP接口） | 需共享接口 jar |
| 适用场景 | 对外 API、服务间简单调用 | 内部高性能 RPC |

**实际选择建议：**
- 对外暴露 REST API → OpenFeign
- 内部服务高频调用、性能敏感 → Dubbo

> 📌 参考：[Dubbo 官方文档](https://cn.dubbo.apache.org/zh-cn/overview/what/overview/)

---

## 五、负载均衡（LoadBalancer / Ribbon）

### 12. Spring Cloud LoadBalancer 和 Ribbon 的区别？

| 对比项 | Ribbon | Spring Cloud LoadBalancer |
|--------|--------|--------------------------|
| 维护状态 | 停止维护（Netflix） | Spring 官方维护 |
| 响应式支持 | 不支持 | 支持（WebFlux） |
| 扩展性 | 较复杂 | 更简洁 |
| 默认策略 | 轮询（ZoneAvoidance） | 轮询（Round Robin） |
| Spring Boot 2.7.x | 可用（兼容） | 推荐使用 |

**自定义负载均衡策略（LoadBalancer）：**
```java
@Bean
public ReactorLoadBalancer<ServiceInstance> randomLoadBalancer(
        Environment environment,
        LoadBalancerClientFactory factory) {
    String name = environment.getProperty(LoadBalancerClientFactory.PROPERTY_NAME);
    return new RandomLoadBalancer(factory.getLazyProvider(name, ServiceInstanceListSupplier.class), name);
}
```

> 📌 参考：[Spring Cloud LoadBalancer 文档](https://docs.spring.io/spring-cloud-commons/docs/current/reference/html/#spring-cloud-loadbalancer)

---

### 13. 常见的负载均衡算法有哪些？

| 算法 | 说明 | 适用场景 |
|------|------|---------|
| 轮询（Round Robin） | 依次分发请求 | 服务器性能均等 |
| 随机（Random） | 随机选择实例 | 简单场景 |
| 加权轮询 | 按权重比例分发 | 服务器性能不均 |
| 最少连接（Least Connection） | 选连接数最少的 | 长连接场景 |
| IP Hash | 同一IP固定到同一服务 | Session 保持 |
| 一致性哈希 | 减少扩缩容时的迁移 | 缓存场景 |

---

## 六、Sentinel（熔断限流）

### 14. Sentinel 的核心功能和工作原理？

**答：**

Sentinel 核心功能：

| 功能 | 说明 |
|------|------|
| 流量控制 | 基于 QPS / 并发线程数限流 |
| 熔断降级 | 慢调用比例 / 异常比例 / 异常数 |
| 系统保护 | 基于系统负载、CPU、入口 QPS 等自适应保护 |
| 热点参数限流 | 针对参数级别的精细化限流 |
| 黑白名单 | 基于调用来源控制访问 |

**工作原理（责任链模式）：**
```
请求进来
    │
    ▼
NodeSelectorSlot     → 第1步：确定调用路径，建树状结构
    │
    ▼
ClusterBuilderSlot   → 第2步：初始化统计节点（ClusterNode）
    │
    ▼
StatisticSlot        → 第3步：统计实时数据（QPS、RT、线程数...）
    │
    ▼
FlowSlot             → 第4步：限流检查（依赖第3步的统计数据）
    │
    ▼
AuthoritySlot        → 第5步：黑白名单检查
    │
    ▼
DegradeSlot          → 第6步：熔断降级检查
    │
    ▼
SystemSlot           → 第7步：系统整体保护检查
    │
    ▼
  通过，执行业务代码
```

> 📌 参考：[Sentinel 官方文档](https://sentinelguard.io/zh-cn/docs/introduction.html)  
> 📌 参考：[Sentinel GitHub Wiki](https://github.com/alibaba/Sentinel/wiki)

---

### 15. Sentinel 熔断策略有哪几种？

**答：**

Sentinel 1.8.x 支持三种熔断策略：

| 策略 | 触发条件 | 说明 |
|------|---------|------|
| **慢调用比例** | 响应时间 > 最大RT 的比例超阈值 | 慢请求占比过高时熔断 |
| **异常比例** | 异常请求占总请求比例超阈值 | 出错率过高时熔断 |
| **异常数** | 单位时间内异常数超阈值 | 适合低流量场景 |

**熔断状态机：**
```
CLOSED（关闭）→ 触发阈值 → OPEN（熔断）
OPEN → 休眠窗口结束 → HALF_OPEN（半开）
HALF_OPEN → 探测成功 → CLOSED
HALF_OPEN → 探测失败 → OPEN
```

---

### 16. Sentinel 和 Hystrix 的区别？

| 对比项 | Hystrix | Sentinel |
|--------|---------|---------|
| 维护状态 | 停止维护 | 活跃维护 |
| 限流 | 不支持 | 支持（QPS/线程数） |
| 熔断策略 | 异常比例 | 慢调用/异常比例/异常数 |
| 隔离方式 | 线程池 / 信号量 | 信号量 |
| 实时控制台 | 需 Hystrix Dashboard | 内置（sentinel-dashboard） |
| 规则持久化 | 不支持 | 支持（Nacos/ZK/Apollo） |
| 性能开销 | 线程池开销较大 | 较小 |

---

## 七、Seata（分布式事务）

### 17. 分布式事务有哪些常见方案？

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| 2PC（两阶段提交） | 协调者统一提交/回滚 | 强一致 | 性能差，单点问题 |
| TCC | Try-Confirm-Cancel | 性能好，灵活 | 业务侵入大 |
| Saga | 长事务拆分补偿 | 适合长流程 | 中间态可见 |
| 本地消息表 | 消息+本地事务 | 实现简单 | 依赖消息队列 |
| **AT 模式（Seata默认）** | 自动生成反向SQL | 业务无侵入 | 依赖数据库，有全局锁 |

> 📌 参考：[Seata 官方文档](https://seata.apache.org/zh-cn/docs/overview/what-is-seata/)

---

### 18. Seata AT 模式的原理是什么？

**答：**

AT 模式（Automatic Transaction）是 Seata 默认模式，核心是**自动生成 undo_log 实现回滚**：

**两阶段流程：**

- **一阶段：** 拦截业务 SQL → 解析SQL生成前镜像（before image）→ 执行业务 SQL → 生成后镜像（after image）→ 将镜像数据写入 `undo_log` 表 → 获取**本地行锁**和**全局锁**后提交本地事务
- **二阶段提交：** 异步删除 `undo_log`，释放全局锁
- **二阶段回滚：** 用 `undo_log` 的前镜像生成反向 SQL 执行回滚

**关键组件：**
```
TC（Transaction Coordinator）：Seata Server，协调全局事务
TM（Transaction Manager）：发起全局事务的服务（@GlobalTransactional）
RM（Resource Manager）：参与事务的各微服务
```

> 📌 参考：[Seata AT 模式原理](https://seata.apache.org/zh-cn/docs/dev/mode/at-mode/)

---

### 19. Seata 使用时需要注意什么？

**答：**

1. **每个参与事务的数据库需要创建 `undo_log` 表**
2. **全局锁会影响并发性能**，高并发场景慎用 AT 模式，考虑 TCC
3. **不支持跨数据库类型**（如 MySQL 和 Oracle 混用）
4. **`@GlobalTransactional` 只能加在 TM 服务的入口方法**
5. **不要在事务内做耗时操作**（文件上传、调用第三方等），避免长事务

```java
@GlobalTransactional(timeoutMills = 30000, rollbackFor = Exception.class)
public void createOrder(OrderDTO dto) {
    orderService.save(dto);         // RM1
    inventoryService.deduct(dto);   // RM2（Feign调用）
    accountService.debit(dto);      // RM3（Feign调用）
}
```

---

## 八、消息队列（RocketMQ / Kafka）

### 20. RocketMQ 和 Kafka 如何选择？

| 对比项 | RocketMQ 4.x | Kafka |
|--------|-------------|-------|
| 定位 | 业务消息（事务/延迟/顺序） | 日志流/大数据 |
| 延迟消息 | 原生支持 | 不支持 |
| 事务消息 | 原生支持 | 不支持 |
| 顺序消息 | 支持 | 分区内有序 |
| 吞吐量 | 较高（10万+/s） | 极高（百万+/s） |
| 消息堆积 | 支持（文件存储） | 支持（高效） |
| 运维复杂度 | 中 | 依赖 Zookeeper，较高 |
| 国内生态 | 活跃（阿里开源） | 成熟 |

**选型建议：**
- 业务系统（订单/支付/通知）→ RocketMQ
- 日志收集 / 大数据 Pipeline → Kafka

> 📌 参考：[RocketMQ 官方文档](https://rocketmq.apache.org/zh/docs/)

---

### 21. 如何保证消息不丢失？

**答：** 分三个阶段分析：

**① 生产者阶段**
```java
// RocketMQ 同步发送，确认 Broker 接收成功
SendResult result = producer.send(message);
if (result.getSendStatus() != SendStatus.SEND_OK) {
    // 重试或告警
}
```
- 使用同步发送（sync），而非异步/单向
- 开启重试：`producer.setRetryTimesWhenSendFailed(3)`

**② Broker 阶段**
- 同步刷盘（`flushDiskType=SYNC_FLUSH`）：性能较低但不丢
- 主从同步复制（`brokerRole=SYNC_MASTER`）：主宕机不丢消息

**③ 消费者阶段**
- 业务处理完成后再返回 `ConsumeConcurrentlyStatus.CONSUME_SUCCESS`
- 处理失败返回 `RECONSUME_LATER`，触发重试

---

### 22. RocketMQ 如何实现延迟消息？

**答：**

RocketMQ 4.x 支持 **18个固定延迟级别**（不支持任意时间延迟）：

```
1s 5s 10s 30s 1m 2m 3m 4m 5m 6m 7m 8m 9m 10m 20m 30m 1h 2h
```

```java
Message message = new Message("order-topic", "cancel", body);
message.setDelayTimeLevel(3); // 对应 10s 延迟（第3级）
producer.send(message);
```

**应用场景：** 订单超时未支付自动取消、定时提醒等。

⚠️ 任意延迟时间需升级到 **RocketMQ 5.x** 的定时消息功能。

> 📌 参考：[RocketMQ 延迟消息](https://rocketmq.apache.org/zh/docs/featureBehavior/06delayMessage)

---

## 九、链路追踪（SkyWalking / Zipkin）

### 23. 分布式链路追踪的核心概念是什么？

**答：**

| 概念 | 说明 |
|------|------|
| **Trace** | 一次完整请求的调用链路，有全局唯一 TraceId |
| **Span** | 调用链路中的一个操作单元（如一次服务调用、SQL执行） |
| **TraceId** | 贯穿整个调用链的唯一标识，通过 HTTP Header 或 RPC 附加传递 |
| **SpanId** | 当前 Span 的 ID |
| **ParentSpanId** | 父 Span 的 ID，用于构建调用树 |

---

### 24. SkyWalking 和 Zipkin 如何选择？

| 对比项 | Zipkin | SkyWalking |
|--------|--------|-----------|
| 接入方式 | 代码侵入（Sleuth）| 探针无侵入（Java Agent）|
| 功能 | 基础链路追踪 | 链路+性能分析+告警+拓扑图 |
| 存储 | 内存/MySQL/ES | ES/H2/MySQL/TiDB |
| 控制台 | 简单 | 功能完善 |
| 性能开销 | 低 | 低（Agent方式） |
| 适用场景 | 轻量级、快速接入 | 生产级、完整APM |

**推荐：** 生产环境优先选 **SkyWalking**，通过 Java Agent 接入，对业务代码零侵入：

```bash
# JVM 启动参数添加 SkyWalking Agent
-javaagent:/path/to/skywalking-agent.jar
-Dskywalking.agent.service_name=order-service
-Dskywalking.collector.backend_service=127.0.0.1:11800
```

> 📌 参考：[SkyWalking 官方文档](https://skywalking.apache.org/docs/)  
> 📌 参考：[Zipkin 官方文档](https://zipkin.io/pages/quickstart.html)

---

## 十、MyBatis-Plus 3.5.x

### 25. MyBatis-Plus 的核心功能有哪些？

**答：**

| 功能 | 说明 |
|------|------|
| 通用 CRUD | `BaseMapper<T>` 内置18个常用方法，无需写 XML |
| 条件构造器 | `QueryWrapper` / `LambdaQueryWrapper` 链式构建查询 |
| 分页插件 | `PaginationInnerInterceptor` 物理分页 |
| 逻辑删除 | `@TableLogic` 自动软删除 |
| 自动填充 | `@TableField(fill = INSERT)` 自动填充创建时间等 |
| 多租户 | `TenantLineInnerInterceptor` |
| 乐观锁 | `@Version` 注解 |

---

### 26. LambdaQueryWrapper 和 QueryWrapper 的区别？

```java
// QueryWrapper：字符串列名，有拼写错误风险
QueryWrapper<User> wrapper = new QueryWrapper<>();
wrapper.eq("user_name", "张三")
       .gt("age", 18)
       .orderByDesc("create_time");

// LambdaQueryWrapper：Lambda引用，编译期检查，推荐使用
LambdaQueryWrapper<User> lambdaWrapper = new LambdaQueryWrapper<>();
lambdaWrapper.eq(User::getUserName, "张三")
             .gt(User::getAge, 18)
             .orderByDesc(User::getCreateTime);
```

**推荐使用 `LambdaQueryWrapper`**，避免字段名拼写错误，重构时自动跟随属性名变化。

> 📌 参考：[MyBatis-Plus 官方文档](https://baomidou.com/guides/wrapper/)

---

### 27. MyBatis-Plus 如何防止全表更新/删除？

**答：**

配置 `BlockAttackInnerInterceptor` 防止无条件的 UPDATE/DELETE：

```java
@Bean
public MybatisPlusInterceptor mybatisPlusInterceptor() {
    MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
    // 分页插件
    interceptor.addInnerInterceptor(new PaginationInnerInterceptor(DbType.MYSQL));
    // 防全表更新删除插件
    interceptor.addInnerInterceptor(new BlockAttackInnerInterceptor());
    return interceptor;
}
```

执行 `update(entity, new UpdateWrapper<>())` 无条件时将抛出异常。

---

## 十一、综合架构题

### 28. 微服务拆分的原则是什么？

**答：**

| 原则 | 说明 |
|------|------|
| **单一职责** | 每个服务只负责一个业务领域 |
| **高内聚低耦合** | 服务内部高度相关，服务间依赖最小化 |
| **按业务边界拆分（DDD）** | 以领域驱动设计的限界上下文为边界 |
| **数据库独立** | 每个服务独立数据库，禁止跨服务直接访问数据库 |
| **粒度适中** | 不宜过细（运维复杂）也不宜过粗（失去微服务意义）|

---

### 29. 如何解决微服务中的雪崩问题？

**答：**

雪崩：服务 A 调用 B，B 调用 C，C 不可用导致 B 积压，进而 A 也崩溃。

解决方案：

1. **熔断（Sentinel/Hystrix）：** 检测到异常率过高，快速失败，不等待超时
2. **降级：** 熔断后返回兜底数据（缓存数据/默认值/提示信息）
3. **限流：** 控制进入系统的流量总量
4. **超时控制：** 设置合理的调用超时时间，避免线程阻塞
5. **舱壁隔离：** 线程池/信号量隔离，不同服务使用独立资源池
6. **服务降级预案：** 核心链路保障，非核心功能直接降级

---

### 30. 分布式系统中如何保证接口幂等性？

**答：**

| 方案 | 实现方式 | 适用场景 |
|------|---------|---------|
| 唯一索引 | 数据库唯一约束 | 简单插入场景 |
| Token机制 | 请求前获取Token，使用后删除（Redis） | 表单提交 |
| 状态机 | 判断当前状态是否允许操作 | 订单等有状态业务 |
| 乐观锁 | `version` 字段 CAS 更新 | 更新操作 |
| 全局唯一ID | 请求携带业务ID，Redis去重 | 通用方案 |

**Token 机制示例：**
```java
// 1. 获取 token
String token = UUID.randomUUID().toString();
redis.setex("idempotent:" + token, 300, "1");

// 2. 请求时校验并删除（原子操作，使用Lua脚本）
String script = "if redis.call('get', KEYS[1]) then " +
                "return redis.call('del', KEYS[1]) else return 0 end";
Long result = redis.execute(script, key);
if (result == 0) throw new DuplicateRequestException("重复请求");
```

---

## 参考资料汇总

| 技术 | 官方文档 |
|------|---------|
| Spring Boot 2.7.x | https://docs.spring.io/spring-boot/docs/2.7.x/reference/html/ |
| Spring Cloud Alibaba | https://sca.aliyun.com/zh-cn/ |
| Nacos | https://nacos.io/zh-cn/docs/what-is-nacos.html |
| Spring Cloud Gateway | https://docs.spring.io/spring-cloud-gateway/docs/current/reference/html/ |
| OpenFeign | https://docs.spring.io/spring-cloud-openfeign/docs/current/reference/html/ |
| Sentinel | https://sentinelguard.io/zh-cn/docs/introduction.html |
| Seata | https://seata.apache.org/zh-cn/docs/overview/what-is-seata/ |
| RocketMQ | https://rocketmq.apache.org/zh/docs/ |
| SkyWalking | https://skywalking.apache.org/docs/ |
| MyBatis-Plus | https://baomidou.com/ |
| Dubbo | https://dubbo.apache.org/zh/docs/ |