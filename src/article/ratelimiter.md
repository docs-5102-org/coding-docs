---
title: Java 限流详解
category:
  - Java
tag:
  -  限流
  -  令牌桶
  -  Guava RateLimiter
---

# Java 限流详解

## 概述

限流是保护系统稳定性的重要技术手段，通过控制请求的处理速率来防止系统过载。在Java开发中，限流技术广泛应用于高并发场景，确保系统在流量激增时依然能够稳定运行。

## 使用场景

系统使用下游资源时，需要考虑下游资源的限制和处理能力。在下游资源无法短时间内提升处理性能的情况下，可以使用限流器或者类似保护机制，避免下游服务崩溃造成整体服务的不可用。

限流的典型应用场景包括：
- API接口保护
- 防止恶意攻击
- 资源消耗控制
- 下游服务保护

## 常用算法

### 漏桶算法 (Leaky Bucket)

#### 核心思想

漏桶算法基于"漏水桶"的抽象模型：
- 桶以恒定的速率往下漏水
- 上方时快时慢地有水进入桶中
- 当桶未满时，上方的水可以加入
- 一旦水满，上方的水就无法加入

#### 关键参数
1. **桶漏水的速率** - 控制处理请求的恒定速度
2. **桶的大小** - 控制能够缓存的请求数量

#### 处理方式

桶满水后的两种常见处理方式：

**Traffic Shaping（流量整形）**
- 核心理念：等待
- 暂时拦截住上方水的向下流动，等待桶中的一部分水漏走后，再放行

**Traffic Policing（流量监管）**  
- 核心理念：丢弃
- 溢出的上方水直接抛弃

### 令牌桶算法 (Token Bucket)

#### 核心思想

令牌桶算法基于以下场景模拟：
- 有一个装有token且token数量固定的桶
- Token以固定速率添加到桶中
- 请求到达时检查桶中是否有足够的token
- 有足够token则消费掉token处理请求，否则根据策略处理（阻塞或拒绝）

#### 算法特点
- 允许一定程度的突发流量
- 长期平均速率不超过设定值
- 实现相对简单

## Guava RateLimiter 实现

Google Guava提供的RateLimiter基于令牌桶算法实现，是Java中最常用的限流工具之一。

### 核心实现原理

#### 关键变量
- **nextFreeTicketMicros**: 下一次允许补充许可的时间
- **maxPermits**: 最大许可数  
- **storedPermits**: 存储的许可数，不能超过最大许可数

#### 重同步机制

```java
void resync(long nowMicros) {
    // 如果当前时间超过了nextFreeTicketMicros，进行同步：
    // 1. 计算新增的可用许可数
    // 2. 更新存储的许可数
    // 3. 同步下一次允许补充许可时间
}
```

#### 初始化过程

```java
static RateLimiter create(SleepingStopwatch stopwatch, double permitsPerSecond) {
    // nextFreeTicketMicros = 当前时间
    // maxPermits = 每秒允许的许可数
    // storedPermits = 0
}
```

### 主要方法说明

| 方法 | 描述 |
|------|------|
| `acquire()` | 获取一个许可，会阻塞直到获取成功 |
| `acquire(int permits)` | 获取指定数量许可，会阻塞直到获取成功 |
| `tryAcquire()` | 尝试获取许可，立即返回结果 |
| `tryAcquire(long timeout, TimeUnit unit)` | 在指定时间内尝试获取许可 |
| `create(double permitsPerSecond)` | 创建指定速率的RateLimiter |
| `setRate(double permitsPerSecond)` | 动态更新限流速率 |

### 实际应用示例

#### 1. 基础限流服务

```java
@Service
public class AccessLimitService {
    // 每秒5个令牌
    private RateLimiter rateLimiter = RateLimiter.create(5.0);
    
    /**
     * 尝试获取令牌
     * @return true:获取成功，false:获取失败
     */
    public boolean tryAcquire() {
        return rateLimiter.tryAcquire();
    }
}
```

#### 2. Controller层应用

```java
@Controller
public class AccessLimitController {
    
    @Autowired
    private AccessLimitService accessLimitService;
    
    @RequestMapping("/test")
    public String test() {
        if (accessLimitService.tryAcquire()) {
            // 获取令牌成功，执行业务逻辑
            return "SUCCESS";
        } else {
            // 获取令牌失败，返回限流信息  
            return "RATE LIMITED";
        }
    }
}
```

#### 3. 完整应用示例

```java
public class RateLimiterExample {
    public static void main(String[] args) {
        // 创建限流器：每秒2个许可
        RateLimiter limiter = RateLimiter.create(2.0);
        
        // 模拟任务处理
        for (int i = 0; i < 10; i++) {
            // 阻塞式获取许可
            double waitTime = limiter.acquire();
            System.out.println("获取许可，等待时间：" + waitTime + "秒");
            
            // 执行任务
            processTask();
        }
    }
    
    private static void processTask() {
        System.out.println("处理任务：" + System.currentTimeMillis());
    }
}
```

#### 4. 带预热的限流器

```java
// 创建带预热功能的限流器
// 最大QPS为1000，预热时间为10秒
RateLimiter limiter = RateLimiter.create(1000, 10, TimeUnit.SECONDS);
```

### Maven依赖

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>31.1-jre</version>
</dependency>
```

## 注意事项

### 1. 预热问题
初始化时`storedPermits`为0，第一个请求可能会导致后续请求获取令牌失败。在高并发场景下建议进行预热处理。

### 2. 令牌数量
通过`RateLimiter.create(5.0)`配置每秒5个令牌，但实际测试中可能会发现实际数量比配置的大1，这是实现机制导致的正常现象。

### 3. 分布式限流
Guava RateLimiter只适用于单机限流，分布式环境下需要考虑使用Redis等实现分布式限流。

### 4. 突发流量处理
令牌桶算法允许一定的突发流量，这在某些场景下是优势，但在严格限流场景下需要注意。

## 最佳实践

1. **合理设置限流阈值**：基于系统实际处理能力设定
2. **监控和告警**：对限流情况进行监控，及时发现异常
3. **优雅降级**：被限流的请求应该有合适的降级策略
4. **动态调整**：根据系统负载动态调整限流参数
5. **分层限流**：在网关、应用、数据库等多个层面设置限流

## 总结

限流是保障系统稳定性的重要手段，通过合理使用漏桶算法和令牌桶算法，可以有效控制系统流量。Guava RateLimiter提供了简单易用的限流实现，在单机场景下表现优秀。在实际应用中，需要结合业务特点选择合适的限流策略，并配合监控和降级机制，构建完整的系统保护体系。