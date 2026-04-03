---
title: SpringCloud 面试题
category:
  - SpringCloud 面试题
date: 2025-11-28
---

# SpringCloud 面试题

## 一、基础概念

### 1. 什么是 Spring Cloud？

Spring Cloud 是一个基于 Spring Boot 的微服务开发框架，它提供了一整套分布式系统开发的工具集。Spring Cloud 为开发者提供了快速构建分布式系统中一些常见模式的工具，例如配置管理、服务发现、断路器、智能路由、微代理、控制总线、全局锁、分布式会话和集群状态管理等。

**核心特点：**
- 基于 Spring Boot，开发便捷
- 提供了丰富的分布式系统开发组件
- 支持多种服务治理方案
- 易于集成和扩展

### 2. Spring Cloud 与 Spring Boot 的关系？

- **Spring Boot** 专注于快速开发单个微服务个体
- **Spring Cloud** 关注全局的微服务协调治理框架，它将 Spring Boot 开发的一个个单体微服务整合并管理起来
- Spring Cloud 依赖于 Spring Boot，而 Spring Boot 可以独立使用

### 3. Spring Cloud 与 Dubbo 的区别？

| 对比项 | Spring Cloud | Dubbo |
|--------|-------------|-------|
| 服务注册中心 | Eureka、Consul、Nacos | Zookeeper、Nacos |
| 服务调用方式 | REST API (HTTP) | RPC (基于 TCP) |
| 服务网关 | Zuul、Gateway | 无，需要整合第三方 |
| 断路器 | Hystrix、Resilience4j、Sentinel | 不完善，需要整合 |
| 分布式配置 | Config、Nacos | 无，需要整合 |
| 性能 | 较低（HTTP协议） | 较高（TCP协议） |
| 社区活跃度 | Spring 社区支持 | 阿里巴巴维护 |

## 二、服务注册与发现

### 4. 什么是服务注册与发现？

**服务注册：**服务提供者在启动时，将自己的服务信息（如 IP 地址、端口、服务名称等）注册到注册中心。

**服务发现：**服务消费者从注册中心获取服务提供者的地址信息，然后通过这些信息调用服务。

**优势：**
- 动态管理服务实例
- 实现服务的自动扩缩容
- 服务故障自动摘除

### 5. Eureka 的工作原理？

**核心概念：**
- **Eureka Server**：服务注册中心
- **Eureka Client**：服务提供者和消费者

**工作流程：**
1. Eureka Server 启动，等待服务注册
2. 服务提供者启动时，向 Eureka Server 注册自己的信息
3. 服务消费者启动时，从 Eureka Server 获取服务列表
4. 服务提供者每 30 秒发送一次心跳续约
5. 服务消费者每 30 秒从 Eureka Server 拉取一次服务列表
6. 如果服务提供者 90 秒内没有发送心跳，Eureka Server 将其剔除

### 6. Eureka 的自我保护机制是什么？

**触发条件：**
当 Eureka Server 在短时间内丢失过多客户端心跳时（默认 15 分钟内低于 85%），会进入自我保护模式。

**保护措施：**
- 不会剔除任何服务实例
- 继续接受新服务注册和查询请求
- 保护注册表中的信息不被误删

**为什么需要自我保护：**
- 防止网络分区故障导致大量服务被误剔除
- 宁可保留错误的服务信息，也不盲目剔除健康服务

**如何关闭：**
```yaml
eureka:
  server:
    enable-self-preservation: false  # 关闭自我保护
    eviction-interval-timer-in-ms: 4000  # 清理间隔（默认60秒）
```

:::tip

#### Eureka Server 心跳计算

Eureka Server 每分钟收到的心跳续约数
  < 期望心跳数 × 85%

期望心跳数 = 注册实例数 × 2
（默认每个实例每30秒发一次心跳，每分钟2次）

例如：注册了100个实例
  期望心跳 = 100 × 2 = 200次/分钟
  触发阈值 = 200 × 85% = 170次/分钟
  实际低于170次 → 触发自我保护

:::

### 7. Nacos 与 Eureka 的区别？

| 对比项 | Nacos | Eureka |
|--------|-------|--------|
| 服务健康检查 | 支持 TCP/HTTP/MySQL | 基于心跳（客户端主动） |
| 负载均衡策略 | 权重/元数据/Selector | Ribbon |
| 一致性协议 | CP + AP | AP |
| 配置管理 | 支持 | 不支持 |
| 控制台 | 功能丰富 | 相对简单 |
| 雪崩保护 | 支持 | 支持（自我保护） |
| 访问协议 | HTTP/gRPC/DNS | HTTP |
| 社区活跃度 | 阿里维护，国内活跃 | Netflix已停止维护 |

**Nacos 的优势：**
- 同时支持 CP 和 AP 模式（可切换）
- 内置配置中心功能
- 支持更丰富的健康检查方式
- 更好的控制台体验

## 三、负载均衡

### 8. Ribbon 的负载均衡策略有哪些？

**常用策略：**

1. **RoundRobinRule（轮询）**：默认策略，按顺序循环选择服务器
2. **RandomRule（随机）**：随机选择一个可用服务器
3. **WeightedResponseTimeRule（响应时间加权）**：根据服务器响应时间分配权重，响应时间越短权重越大
4. **BestAvailableRule（最低并发）**：选择并发请求数最小的服务器
5. **RetryRule（重试）**：在指定时间内重试选择可用服务器
6. **AvailabilityFilteringRule（可用过滤）**：过滤掉故障服务器和高并发服务器
7. **ZoneAvoidanceRule（区域权衡）**：综合判断服务器所在区域的性能和可用性

**自定义配置：**
```java
@Configuration
public class RibbonConfig {
    @Bean
    public IRule ribbonRule() {
        return new RandomRule();  // 使用随机策略
    }
}
```

### 9. Spring Cloud LoadBalancer 与 Ribbon 的区别？

Spring Cloud LoadBalancer 是 Spring Cloud 官方推出的负载均衡器，用于替代 Netflix Ribbon（已进入维护模式）。

**主要区别：**
- **维护状态**：LoadBalancer 官方维护，Ribbon 停止更新
- **依赖性**：LoadBalancer 更轻量，无 Netflix 依赖
- **性能**：LoadBalancer 性能略优
- **功能**：Ribbon 功能更丰富，LoadBalancer 更简洁

## 四、服务调用

### 10. Feign 的工作原理？

Feign 是一个声明式的 HTTP 客户端，它使得编写 HTTP 客户端变得更简单。

**工作流程：**
1. 启动时，扫描带有 `@FeignClient` 注解的接口
2. 使用 JDK 动态代理生成代理对象
3. 调用接口方法时，根据注解信息构造 HTTP 请求
4. 通过 Ribbon 实现负载均衡
5. 通过 Hystrix 实现熔断降级
6. 发送 HTTP 请求并解析响应

**使用示例：**
```java
@FeignClient(name = "user-service", fallback = UserServiceFallback.class)
public interface UserServiceClient {
    @GetMapping("/user/{id}")
    User getUserById(@PathVariable("id") Long id);
}
```

### 11. OpenFeign 与 Feign 的区别？

- **Feign**：Netflix 开发的声明式 HTTP 客户端
- **OpenFeign**：Spring Cloud 对 Feign 的增强版本

**OpenFeign 的优势：**
- 支持 Spring MVC 注解（`@RequestMapping`、`@GetMapping` 等）
- 集成了 Ribbon 和 Hystrix
- 支持 Sentinel 熔断降级
- 更好的 Spring Boot 集成

## 五、服务熔断与降级

### 12. 什么是服务雪崩？

**定义：**在微服务架构中，由于某个服务的故障或延迟，导致调用该服务的其他服务也出现故障，进而引发整个系统的连锁反应，最终导致整个系统不可用。

**原因：**
- 服务之间的依赖关系复杂
- 故障服务占用大量线程资源
- 请求积压导致系统崩溃

**解决方案：**
- 服务熔断
- 服务降级
- 服务限流
- 服务隔离

### 13. Hystrix（/hɪs'trɪks/ 中文近似音："嗨斯崔克斯"） 的工作原理？

#### 服务隔离

Hystrix 提供两种隔离方式：

```
线程池隔离（默认）        信号量隔离
─────────────────        ─────────────
每个服务独立线程池          同一线程，计数器控制
支持超时控制               不支持超时
开销较大                   开销极小
适合：外部服务调用          适合：内部逻辑、高并发
```

```java
@HystrixCommand(
    commandProperties = {
        // 隔离方式：THREAD 或 SEMAPHORE
        @HystrixProperty(name = "execution.isolation.strategy", value = "THREAD")
    },
    threadPoolProperties = {
        @HystrixProperty(name = "coreSize", value = "10"),        // 核心线程数
        @HystrixProperty(name = "maximumSize", value = "20"),     // 最大线程数
        @HystrixProperty(name = "maxQueueSize", value = "100")    // 队列大小
    }
)
public String callServiceA() { ... }
```

```
服务A的线程池 [T1 T2 T3 ... T10]   ← 最多占用10个线程
服务B的线程池 [T1 T2 T3 ... T10]   ← 互不影响

服务A挂了 → 服务A线程池耗尽
           → 服务B线程池不受影响 ✅
```

---

#### 熔断器三种状态

```
                 失败率 > 50%
   Closed ──────────────────────→ Open
     ↑                              │
     │                              │ 等待 5s（休眠窗口）
     │                              ↓
     └────────────────────── Half-Open
          放行一个请求
          成功 → Closed
          失败 → Open
```

**Closed（关闭）— 正常状态**
```
请求 → Hystrix → 真实服务
在10秒窗口内统计：
  请求数 >= 10（requestVolumeThreshold）
  且失败率 >= 50%（errorThresholdPercentage）
  → 触发熔断，切换到 Open
```

**Open（打开）— 熔断状态**
```
请求 → Hystrix → 直接拒绝，不调用真实服务
               → 直接走 fallback 降级方法
等待 5秒（sleepWindowInMilliseconds）后 → 切换到 Half-Open
```

**Half-Open（半开）— 探测状态**
```
放行第一个请求 → 真实服务
  成功 → 恢复 Closed，清空统计
  失败 → 重新回到 Open，再等 5秒
```

---

#### 配置参数详解

```java
@HystrixCommand(
    fallbackMethod = "fallback",
    commandProperties = {

        // ① 超时时间：调用超过 3s 视为失败，触发 fallback
        @HystrixProperty(
            name  = "execution.isolation.thread.timeoutInMilliseconds",
            value = "3000"
        ),

        // ② 触发熔断的最小请求数：10秒内至少10个请求才统计失败率
        //    请求数不足时，即使全部失败也不熔断
        @HystrixProperty(
            name  = "circuitBreaker.requestVolumeThreshold",
            value = "10"
        ),

        // ③ 失败率阈值：失败率超过 50% 触发熔断
        @HystrixProperty(
            name  = "circuitBreaker.errorThresholdPercentage",
            value = "50"
        ),

        // ④ 熔断后休眠时间：Open 状态等待 5s 后进入 Half-Open
        @HystrixProperty(
            name  = "circuitBreaker.sleepWindowInMilliseconds",
            value = "5000"
        ),

        // ⑤ 统计窗口大小：在 10s 内统计请求数和失败率
        @HystrixProperty(
            name  = "metrics.rollingStats.timeInMilliseconds",
            value = "10000"
        )
    }
)
public String callService() {
    return remoteService.call();
}

// 降级方法：签名必须和原方法一致
public String fallback() {
    return "服务暂时不可用，请稍后再试";
}
```

---

#### 服务降级触发场景

```
以下情况都会触发 fallback：

1. 超时          调用时间 > timeoutInMilliseconds
2. 熔断          熔断器处于 Open 状态
3. 异常          方法抛出异常（除 HystrixBadRequestException）
4. 线程池满      线程池/信号量资源耗尽
```

```java
// HystrixBadRequestException 不触发降级，直接抛出
// 适合参数校验失败等业务异常，不应计入失败统计
public String callService(String param) {
    if (param == null) {
        throw new HystrixBadRequestException("参数不能为空");
    }
    return remoteService.call(param);
}
```

---

#### 请求缓存 & 请求合并

**请求缓存**
```java
@HystrixCommand(cacheKeyMethod = "getCacheKey")
public User getUser(Long id) {
    return userService.getById(id);  // 同一请求内，相同id只调用一次
}

private String getCacheKey(Long id) {
    return String.valueOf(id);
}
```

**请求合并**
```java
// 100ms 内的请求自动合并为一次批量调用
@HystrixCollapser(batchMethod = "getUsers")
public Future<User> getUser(Long id) { return null; }

@HystrixCommand
public List<User> getUsers(List<Long> ids) {
    return userService.getByIds(ids);  // 批量查询
}
```

```
单个请求：getUser(1), getUser(2), getUser(3)  ← 100ms内
合并后：  getUsers([1, 2, 3])                 ← 一次调用 ✅
```

---

#### 现状说明

> Hystrix 已于 2018 年停止维护，Spring Cloud 生态目前推荐迁移到 **Resilience4j**，思想基本相同但更轻量，面试了解原理即可，新项目优先用 Resilience4j。

### 14. Sentinel 与 Hystrix 的区别？

| 对比项 | Sentinel | Hystrix |
|--------|----------|---------|
| 维护状态 | 阿里持续维护 | Netflix 已停止维护 |
| 隔离策略 | 信号量隔离 | 线程池隔离/信号量隔离 |
| 熔断降级 | 基于响应时间、异常比例、异常数 | 基于异常比例 |
| 实时指标 | 滑动窗口（LeapArray） | 滑动窗口（RxJava） |
| 限流 | 支持多种限流策略（QPS、并发线程数） | 仅支持线程池大小 |
| 控制台 | 功能丰富，实时监控 | 简单的 Dashboard |
| 规则配置 | 支持多种数据源（文件、Nacos、Apollo） | 配置复杂 |
| 系统负载保护 | 支持 | 不支持 |

**Sentinel 的优势：**
- 更轻量级，性能更好
- 控制台功能强大
- 支持热点参数限流
- 支持集群流控

## 六、API 网关

### 15. Zuul 的工作原理？

Zuul 是 Netflix 开源的 API 网关，基于 Servlet 实现。

**核心功能：**
- 路由转发
- 请求过滤
- 负载均衡
- 权限校验

**过滤器类型：**
1. **PRE 过滤器**：在路由之前执行（身份验证、日志记录）
2. **ROUTING 过滤器**：处理请求路由
3. **POST 过滤器**：在路由之后执行（添加响应头、统计）
4. **ERROR 过滤器**：处理异常情况

### 16. Spring Cloud Gateway 与 Zuul 的区别？

| 对比项 | Gateway | Zuul 1.x |
|--------|---------|----------|
| 技术栈 | WebFlux（Netty） | Servlet（阻塞式） |
| 性能 | 更高（异步非阻塞） | 较低（同步阻塞） |
| 限流 | 内置支持 | 需要自定义 |
| 熔断 | 集成 Hystrix/Sentinel | 集成 Hystrix |
| 动态路由 | 支持 | 相对复杂 |
| 维护状态 | Spring 官方维护 | Netflix 停止维护 |

**Gateway 的核心概念：**
- **Route（路由）**：网关的基本组件
- **Predicate（断言）**：匹配 HTTP 请求的条件
- **Filter（过滤器）**：对请求和响应进行处理

**配置示例：**
```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: user-service
          uri: lb://user-service
          predicates:
            - Path=/user/**
          filters:
            - StripPrefix=1
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10
                redis-rate-limiter.burstCapacity: 20
```

## 七、配置中心

### 17. Spring Cloud Config 的工作原理？

**架构组成：**
- **Config Server**：配置服务器，提供配置信息
- **Config Client**：配置客户端，从服务器拉取配置

**工作流程：**
1. Config Server 从 Git/SVN 仓库拉取配置文件
2. Config Client 启动时，向 Config Server 请求配置
3. Config Server 返回对应的配置信息
4. Config Client 应用配置并启动服务
5. 配置更新时，通过 Spring Cloud Bus 通知所有客户端刷新

**配置刷新方式：**
- 手动刷新：调用 `/actuator/refresh` 端点
- 自动刷新：配合 Spring Cloud Bus 实现

### 18. Nacos Config 与 Spring Cloud Config 的区别？

| 对比项 | Nacos Config | Spring Cloud Config |
|--------|--------------|---------------------|
| 配置存储 | Nacos Server（MySQL） | Git/SVN/本地文件 |
| 实时推送 | 支持（长轮询） | 需要配合 Bus |
| 配置管理界面 | 功能强大 | 无，需要 Git 界面 |
| 多环境管理 | Namespace + Group | Profile + Label |
| 配置回滚 | 支持历史版本 | Git 版本控制 |
| 灰度发布 | 支持 | 不支持 |
| 配置监听 | 实时监听 | 需要手动刷新 |

**Nacos Config 的优势：**
- 无需额外的 Git 仓库
- 支持配置的动态刷新
- 更好的界面体验
- 与 Nacos 服务发现无缝集成

## 八、链路追踪

### 19. 什么是分布式链路追踪？

在微服务架构中，一个请求可能会经过多个服务，分布式链路追踪用于追踪请求在各个服务间的调用路径和性能指标。

**核心概念：**
- **Trace（追踪）**：一次完整的请求链路
- **Span（跨度）**：一次服务调用
- **Annotation（标注）**：记录事件的时间点

### 20. Sleuth + Zipkin 的工作原理？

#### 核心概念

**一次请求的完整结构：**

```
Trace（一条完整链路，唯一 TraceId）
│
├── Span A  网关            [SpanId: 1, ParentId: null]    耗时 150ms
│
├── Span B  订单服务        [SpanId: 2, ParentId: 1]       耗时 120ms
│   │
│   ├── Span C  库存服务   [SpanId: 3, ParentId: 2]       耗时 50ms
│   │
│   └── Span D  支付服务   [SpanId: 4, ParentId: 2]       耗时 60ms
│       │
│       └── Span E  数据库 [SpanId: 5, ParentId: 4]       耗时 20ms
```

```
TraceId  → 全局唯一，贯穿整条链路，用于找到一次请求的所有 Span
SpanId   → 当前节点唯一标识
ParentId → 父节点 SpanId，根节点为 null，用于还原调用树结构
```

---

#### Annotation 四个关键时间点

```
cs (Client Send)      → 客户端发送请求
sr (Server Receive)   → 服务端收到请求     sr - cs = 网络延迟
ss (Server Send)      → 服务端发送响应     ss - sr = 服务处理耗时
cr (Client Receive)   → 客户端收到响应     cr - cs = 总耗时

时间轴：
cs ────────── sr ──────────────── ss ────────── cr
   网络延迟         服务处理耗时        网络延迟
```

---

#### 完整工作流程

```
1. 请求进入网关
   → 生成全局唯一 TraceId
   → 创建根 Span（ParentId = null）
   → 注入请求头：X-B3-TraceId / X-B3-SpanId

2. 网关调用订单服务
   → 创建新 Span（ParentId = 根SpanId）
   → 请求头继续透传 TraceId + 新SpanId

3. 订单服务调用库存/支付服务
   → 同样创建新 Span，透传请求头

4. 每个 Span 完成后
   → 上报到收集器（Zipkin / Jaeger）
   → 包含：TraceId, SpanId, ParentId, 耗时, 状态, 标签

5. 收集器存储 + 前端展示调用链
```

---

#### Spring Cloud Sleuth + Zipkin 实战

**依赖**
```xml
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-sleuth</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-sleuth-zipkin</artifactId>
</dependency>
```

**配置**
```yaml
spring:
  zipkin:
    base-url: http://localhost:9411  # Zipkin 地址
  sleuth:
    sampler:
      probability: 1.0   # 采样率 1.0=100% 生产环境建议 0.1
```

**自动透传 TraceId，日志自动带上链路信息**
```java
@RestController
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    @Autowired
    private InventoryClient inventoryClient;

    @GetMapping("/order/{id}")
    public Order getOrder(@PathVariable Long id) {
        // 日志自动附带 [appName, traceId, spanId]
        // 输出示例：[order-service, 3e7b4f2a1c, 6f8d2a] 开始处理订单
        log.info("开始处理订单: {}", id);

        inventoryClient.check(id);  // TraceId 自动透传到库存服务
        return orderService.get(id);
    }
}
```

**自定义 Span（手动埋点）**
```java
@Autowired
private Tracer tracer;

public void processOrder(Long id) {

    // 手动创建 Span，追踪关键业务逻辑
    Span span = tracer.nextSpan().name("process-order").start();

    try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
        span.tag("orderId", String.valueOf(id));  // 打标签
        span.tag("userId", getCurrentUserId());

        doProcess(id);

    } catch (Exception e) {
        span.tag("error", e.getMessage());        // 记录异常
        throw e;
    } finally {
        span.finish();                            // 必须结束 Span
    }
}
```

---

#### 采样策略

```java
// 全量采样（开发环境）
@Bean
public Sampler alwaysSampler() {
    return Sampler.ALWAYS_SAMPLE;
}

// 按比例采样（生产环境，10%）
@Bean
public Sampler rateSampler() {
    return RateLimitingSampler.create(10);  // 每秒10个
}

// 自定义采样（只采样慢请求）
@Bean
public Sampler customSampler() {
    return (context) -> context.delay() > 1000;  // 超过1s才采样
}
```

```
采样率选择：
  开发环境  →  100%  方便调试
  生产环境  →  10%   流量大时避免性能损耗
  大促活动  →  1%    超高并发场景
```

---

#### 常见问题

**TraceId 丢失场景及解决**

```java
// ❌ 新线程里 TraceId 丢失
public void process() {
    new Thread(() -> {
        log.info("这里没有 TraceId");  // TraceId 断了
    }).start();
}

// ✅ 用 Sleuth 提供的装饰器包装
@Autowired
private TraceableExecutorService traceableExecutorService;

public void process() {
    traceableExecutorService.submit(() -> {
        log.info("TraceId 正常透传");  // ✅
    });
}

// ✅ 或手动传递
Span currentSpan = tracer.currentSpan();
new Thread(tracer.currentTraceContext().wrap(() -> {
    log.info("TraceId 正常透传");     // ✅
})).start();
```

---

#### 主流工具对比

| | Zipkin | Jaeger | SkyWalking |
|--|--------|--------|------------|
| 开发者 | Twitter | Uber | Apache |
| 接入方式 | 代码侵入 | 代码侵入 | 探针无侵入 |
| 存储 | ES / MySQL | ES / Cassandra | ES / MySQL |
| UI | 简单 | 中等 | 功能丰富 |
| 适合场景 | Spring Cloud | 跨语言 | Java 生产首选 |

> **生产环境推荐 SkyWalking**：Java Agent 探针方式，代码零侵入，UI 功能最完整，支持告警、拓扑图、性能分析。

## 九、Spring Cloud Alibaba 组件

### 21. Spring Cloud Alibaba 包含哪些组件?

**核心组件：**
- **Nacos**：服务注册与配置中心
- **Sentinel**：流量控制和熔断降级
- **RocketMQ**：消息队列
- **Seata**：分布式事务解决方案
- **Dubbo**：高性能 RPC 框架
- **OSS**：对象存储服务

### 22. Seata 分布式事务的实现模式？

**四种模式：**

1. **AT 模式（自动）**：
   - 基于支持本地 ACID 事务的关系型数据库
   - 自动生成反向 SQL 实现回滚
   - 适用于大部分业务场景

2. **TCC 模式（手动）**：
   - Try-Confirm-Cancel
   - 需要业务自己实现三个阶段
   - 适用于对性能要求高的场景

3. **SAGA 模式（长事务）**：
   - 基于状态机实现
   - 适用于长事务和遗留系统改造

4. **XA 模式（强一致性）**：
   - 基于数据库的 XA 协议
   - 性能较差，不推荐

## 十、最佳实践

### 23. 微服务拆分原则？

1. **单一职责原则**：一个服务只负责一个业务功能
2. **高内聚低耦合**：服务内部关联紧密,服务之间依赖较少
3. **服务自治**：每个服务可以独立开发、部署、运维
4. **轻量级通信**：使用 REST API 或消息队列通信
5. **数据独立**：每个服务拥有独立的数据库

### 24. 如何保证微服务的高可用？

1. **服务注册与发现**：自动感知服务实例的上下线
2. **负载均衡**：请求分发到多个服务实例
3. **熔断降级**：防止故障扩散
4. **限流保护**：防止系统过载
5. **超时重试**：设置合理的超时时间和重试策略
6. **健康检查**：定期检查服务健康状态
7. **灰度发布**：逐步发布新版本
8. **监控告警**：实时监控系统状态

### 25. 微服务性能优化建议？

1. **减少远程调用**：合理设计服务边界,减少网络开销
2. **使用缓存**：Redis、本地缓存减少数据库压力
3. **异步处理**：使用消息队列处理非核心业务
4. **数据库优化**：索引优化、读写分离、分库分表
5. **连接池优化**：合理配置连接池大小
6. **使用 gRPC**：相比 HTTP 性能更好
7. **服务合并**：避免过度拆分导致的性能损耗

---

这份完善后的 Spring Cloud 面试文档涵盖了官方组件和 Spring Cloud Alibaba 生态,适合不同层次的面试准备。建议结合实际项目经验进行深入理解。