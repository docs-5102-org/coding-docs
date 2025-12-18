---
title: Redisson 限流器详解
category:
  - 中间件
tag:
  - Redisson
---

# Redisson 限流器详解

## 核心概念

这段代码使用 **Redisson 的分布式限流器（RRateLimiter）** 来保护热点 Key，防止瞬间大量请求打到 Redis 或数据库（缓存穿透）。

## 逐行解析

```java
@Service
public class HotKeyLimitService {
    
    @Autowired
    private RedissonClient redissonClient;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    public Object getWithRateLimit(String key) {
        // 1. 获取或创建一个限流器
        // 为每个 key 创建独立的限流器，实现细粒度控制
        RRateLimiter rateLimiter = redissonClient.getRateLimiter("limiter:" + key);
        
        // 2. 设置限流规则
        // trySetRate: 只在限流器不存在时设置，已存在则不修改
        // 参数解释：
        //   - RateType.OVERALL: 全局限流模式（所有客户端共享配额）
        //   - 10000: 速率值（permits）
        //   - 1: 时间窗口长度
        //   - RateIntervalUnit.SECONDS: 时间单位（秒）
        // 含义：1秒内最多允许 10000 次访问
        rateLimiter.trySetRate(RateType.OVERALL, 10000, 1, RateIntervalUnit.SECONDS);
        
        // 3. 尝试获取许可（令牌）
        // tryAcquire(1): 尝试获取 1 个许可，不等待
        //   - 如果有配额，返回 true，计数器 -1
        //   - 如果无配额，返回 false，不阻塞
        if (rateLimiter.tryAcquire(1)) {
            // 获取成功，正常访问 Redis
            return redisTemplate.opsForValue().get(key);
        } else {
            // 获取失败，触发降级
            // 返回本地缓存或默认值，避免穿透到数据库
            return getFromLocalCache(key);
        }
    }
    
    private Object getFromLocalCache(String key) {
        // 降级逻辑：从本地缓存获取
        return localCache.getIfPresent(key);
    }
}
```

## RateType 详解

```java
public enum RateType {
    
    /**
     * OVERALL - 全局限流
     * 所有应用实例共享配额
     * 适用场景：保护 Redis、数据库等共享资源
     */
    OVERALL,
    
    /**
     * PER_CLIENT - 每客户端限流
     * 每个应用实例独立配额
     * 适用场景：限制单个应用实例的请求速率
     */
    PER_CLIENT
}

// 示例对比
@Service
public class RateLimitComparison {
    
    public void overallExample() {
        RRateLimiter limiter = redissonClient.getRateLimiter("api:limit");
        // 全局 1秒内最多 1000 次（3个实例共享）
        limiter.trySetRate(RateType.OVERALL, 1000, 1, RateIntervalUnit.SECONDS);
        
        // 实例 A: 获取 400 次
        // 实例 B: 获取 400 次
        // 实例 C: 获取 200 次
        // 总计: 1000 次，全局配额用完
    }
    
    public void perClientExample() {
        RRateLimiter limiter = redissonClient.getRateLimiter("api:limit");
        // 每个实例 1秒内最多 1000 次
        limiter.trySetRate(RateType.PER_CLIENT, 1000, 1, RateIntervalUnit.SECONDS);
        
        // 实例 A: 最多 1000 次
        // 实例 B: 最多 1000 次
        // 实例 C: 最多 1000 次
        // 总计: 3000 次（每个实例独立配额）
    }
}
```

## 完整使用示例

### 1. 基础限流

```java
@Service
public class BasicRateLimitService {
    
    @Autowired
    private RedissonClient redissonClient;
    
    /**
     * 简单限流：1秒内最多 100 次
     */
    public boolean simpleLimit(String apiName) {
        RRateLimiter limiter = redissonClient.getRateLimiter("limit:" + apiName);
        limiter.trySetRate(RateType.OVERALL, 100, 1, RateIntervalUnit.SECONDS);
        return limiter.tryAcquire();
    }
    
    /**
     * 复杂限流：不同操作消耗不同令牌
     */
    public boolean complexLimit(String operation) {
        RRateLimiter limiter = redissonClient.getRateLimiter("ops:limit");
        limiter.trySetRate(RateType.OVERALL, 1000, 1, RateIntervalUnit.SECONDS);
        
        // 根据操作类型消耗不同令牌
        int permits = getPermitsByOperation(operation);
        return limiter.tryAcquire(permits);
    }
    
    private int getPermitsByOperation(String operation) {
        switch (operation) {
            case "read": return 1;      // 读操作消耗 1 个令牌
            case "write": return 10;    // 写操作消耗 10 个令牌
            case "batch": return 100;   // 批量操作消耗 100 个令牌
            default: return 1;
        }
    }
}
```

### 2. 阻塞式限流

```java
@Service
public class BlockingRateLimitService {
    
    @Autowired
    private RedissonClient redissonClient;
    
    /**
     * 阻塞式获取：等待直到获取到令牌
     */
    public Object blockingAcquire(String key) {
        RRateLimiter limiter = redissonClient.getRateLimiter("limiter:" + key);
        limiter.trySetRate(RateType.OVERALL, 1000, 1, RateIntervalUnit.SECONDS);
        
        try {
            // acquire(): 阻塞等待，直到获取到令牌
            limiter.acquire(1);
            return redisTemplate.opsForValue().get(key);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("限流等待被中断", e);
        }
    }
    
    /**
     * 带超时的阻塞获取
     */
    public Object timeoutAcquire(String key) {
        RRateLimiter limiter = redissonClient.getRateLimiter("limiter:" + key);
        limiter.trySetRate(RateType.OVERALL, 1000, 1, RateIntervalUnit.SECONDS);
        
        try {
            // tryAcquire(permits, timeout, unit): 等待最多 3 秒
            boolean acquired = limiter.tryAcquire(1, 3, TimeUnit.SECONDS);
            if (acquired) {
                return redisTemplate.opsForValue().get(key);
            } else {
                // 等待超时，降级处理
                return getFromLocalCache(key);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return getFromLocalCache(key);
        }
    }
}
```

### 3. 多级限流策略

```java
@Service
public class MultiLevelRateLimitService {
    
    @Autowired
    private RedissonClient redissonClient;
    
    /**
     * 多级限流：秒级 + 分钟级 + 小时级
     */
    public Object multiLevelLimit(String key) {
        // 第一级：秒级限流（防止瞬时高并发）
        RRateLimiter secondLimiter = redissonClient.getRateLimiter("limit:second:" + key);
        secondLimiter.trySetRate(RateType.OVERALL, 100, 1, RateIntervalUnit.SECONDS);
        
        if (!secondLimiter.tryAcquire(1)) {
            log.warn("秒级限流触发: {}", key);
            return handleRateLimit("second");
        }
        
        // 第二级：分钟级限流（防止持续高流量）
        RRateLimiter minuteLimiter = redissonClient.getRateLimiter("limit:minute:" + key);
        minuteLimiter.trySetRate(RateType.OVERALL, 5000, 1, RateIntervalUnit.MINUTES);
        
        if (!minuteLimiter.tryAcquire(1)) {
            log.warn("分钟级限流触发: {}", key);
            return handleRateLimit("minute");
        }
        
        // 第三级：小时级限流（防止恶意攻击）
        RRateLimiter hourLimiter = redissonClient.getRateLimiter("limit:hour:" + key);
        hourLimiter.trySetRate(RateType.OVERALL, 200000, 1, RateIntervalUnit.HOURS);
        
        if (!hourLimiter.tryAcquire(1)) {
            log.warn("小时级限流触发: {}", key);
            return handleRateLimit("hour");
        }
        
        // 通过所有限流检查，正常访问
        return redisTemplate.opsForValue().get(key);
    }
    
    private Object handleRateLimit(String level) {
        // 根据触发的限流级别，采取不同降级策略
        switch (level) {
            case "second":
                return getFromLocalCache();  // 轻微限流，返回本地缓存
            case "minute":
                return getDefaultValue();    // 中度限流，返回默认值
            case "hour":
                throw new RateLimitException("访问过于频繁，请稍后再试");
            default:
                return null;
        }
    }
}
```

### 4. 动态限流配置

```java
@Service
public class DynamicRateLimitService {
    
    @Autowired
    private RedissonClient redissonClient;
    
    /**
     * 根据负载动态调整限流阈值
     */
    public Object dynamicLimit(String key) {
        RRateLimiter limiter = redissonClient.getRateLimiter("limiter:" + key);
        
        // 获取当前系统负载
        double cpuUsage = getSystemCpuUsage();
        long memoryUsage = getSystemMemoryUsage();
        
        // 根据负载动态调整限流速率
        long rateLimit = calculateRateLimit(cpuUsage, memoryUsage);
        
        // 更新限流配置（setRate 会覆盖现有配置）
        limiter.setRate(RateType.OVERALL, rateLimit, 1, RateIntervalUnit.SECONDS);
        
        if (limiter.tryAcquire(1)) {
            return redisTemplate.opsForValue().get(key);
        } else {
            return getFromLocalCache(key);
        }
    }
    
    private long calculateRateLimit(double cpuUsage, long memoryUsage) {
        // CPU 使用率 < 50%，内存充足：高速率
        if (cpuUsage < 0.5 && memoryUsage < 0.7) {
            return 10000;
        }
        // CPU 使用率 50-70%：中速率
        else if (cpuUsage < 0.7 && memoryUsage < 0.85) {
            return 5000;
        }
        // CPU 使用率 > 70%：低速率
        else {
            return 1000;
        }
    }
    
    private double getSystemCpuUsage() {
        OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
        return osBean.getSystemLoadAverage();
    }
    
    private long getSystemMemoryUsage() {
        MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        return heapUsage.getUsed() * 100 / heapUsage.getMax();
    }
}
```

### 5. 结合 AOP 实现注解式限流

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    String key() default "";                    // 限流 key
    long rate() default 100;                    // 速率
    long rateInterval() default 1;              // 时间窗口
    RateIntervalUnit timeUnit() default RateIntervalUnit.SECONDS;
    RateType type() default RateType.OVERALL;   // 限流类型
    String fallback() default "";               // 降级方法
}

@Aspect
@Component
public class RateLimitAspect {
    
    @Autowired
    private RedissonClient redissonClient;
    
    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        // 生成限流 key
        String key = generateKey(pjp, rateLimit);
        
        // 获取限流器
        RRateLimiter limiter = redissonClient.getRateLimiter("limit:" + key);
        limiter.trySetRate(
            rateLimit.type(),
            rateLimit.rate(),
            rateLimit.rateInterval(),
            rateLimit.timeUnit()
        );
        
        // 尝试获取令牌
        if (limiter.tryAcquire(1)) {
            // 获取成功，执行原方法
            return pjp.proceed();
        } else {
            // 获取失败，执行降级方法
            return executeFallback(pjp, rateLimit);
        }
    }
    
    private String generateKey(ProceedingJoinPoint pjp, RateLimit rateLimit) {
        if (StringUtils.hasText(rateLimit.key())) {
            return rateLimit.key();
        }
        
        // 默认使用 类名.方法名
        String className = pjp.getTarget().getClass().getSimpleName();
        String methodName = pjp.getSignature().getName();
        return className + "." + methodName;
    }
    
    private Object executeFallback(ProceedingJoinPoint pjp, RateLimit rateLimit) {
        if (StringUtils.hasText(rateLimit.fallback())) {
            try {
                Method fallbackMethod = pjp.getTarget().getClass()
                    .getMethod(rateLimit.fallback(), pjp.getArgs().getClass());
                return fallbackMethod.invoke(pjp.getTarget(), pjp.getArgs());
            } catch (Exception e) {
                log.error("执行降级方法失败", e);
            }
        }
        
        throw new RateLimitException("访问过于频繁，请稍后再试");
    }
}

// 使用示例
@Service
public class ProductService {
    
    @RateLimit(
        key = "getProduct",
        rate = 1000,
        rateInterval = 1,
        timeUnit = RateIntervalUnit.SECONDS,
        type = RateType.OVERALL,
        fallback = "getProductFallback"
    )
    public Product getProduct(Long productId) {
        return productMapper.selectById(productId);
    }
    
    // 降级方法
    public Product getProductFallback(Long productId) {
        // 从本地缓存获取
        return localCache.getIfPresent("product:" + productId);
    }
}
```

## 底层实现原理

### Lua 脚本实现（令牌桶算法）

```lua
-- Redisson RRateLimiter 底层使用的 Lua 脚本（简化版）

local rate = tonumber(ARGV[1])           -- 速率（每秒产生的令牌数）
local interval = tonumber(ARGV[2])       -- 时间窗口（毫秒）
local permits = tonumber(ARGV[3])        -- 需要的令牌数

local key = KEYS[1]                      -- 限流器的 key
local valueName = KEYS[2]                -- 存储当前令牌数
local lastRefillTime = KEYS[3]           -- 上次填充时间

-- 获取当前时间
local currentTime = redis.call('time')
local now = currentTime[1] * 1000 + math.floor(currentTime[2] / 1000)

-- 获取上次填充时间
local lastTime = redis.call('get', lastRefillTime)
if lastTime == false then
    lastTime = now
else
    lastTime = tonumber(lastTime)
end

-- 计算需要填充的令牌数
local timePassed = now - lastTime
local tokensToAdd = math.floor(timePassed * rate / interval)

-- 获取当前令牌数
local currentTokens = redis.call('get', valueName)
if currentTokens == false then
    currentTokens = rate
else
    currentTokens = tonumber(currentTokens)
end

-- 填充令牌（不超过最大容量）
currentTokens = math.min(currentTokens + tokensToAdd, rate)

-- 判断是否有足够的令牌
if currentTokens >= permits then
    -- 扣除令牌
    currentTokens = currentTokens - permits
    redis.call('set', valueName, currentTokens)
    redis.call('set', lastRefillTime, now)
    return 1  -- 获取成功
else
    return 0  -- 获取失败
end
```

## 性能优化建议

```java
@Service
public class OptimizedRateLimitService {
    
    @Autowired
    private RedissonClient redissonClient;
    
    // 缓存限流器对象，避免重复创建
    private final ConcurrentHashMap<String, RRateLimiter> limiterCache = 
        new ConcurrentHashMap<>();
    
    public Object optimizedLimit(String key) {
        // 从缓存获取限流器
        RRateLimiter limiter = limiterCache.computeIfAbsent(key, k -> {
            RRateLimiter newLimiter = redissonClient.getRateLimiter("limiter:" + k);
            newLimiter.trySetRate(RateType.OVERALL, 10000, 1, RateIntervalUnit.SECONDS);
            return newLimiter;
        });
        
        if (limiter.tryAcquire(1)) {
            return redisTemplate.opsForValue().get(key);
        } else {
            return getFromLocalCache(key);
        }
    }
}
```

## 总结

**核心要点**：
1. **trySetRate** 只在限流器不存在时设置，避免覆盖现有配置
2. **OVERALL** 模式适合保护共享资源（Redis/DB）
3. **tryAcquire** 非阻塞获取，适合高并发场景
4. 限流失败时应该有**降级策略**（本地缓存/默认值）

**适用场景**：
- 保护热点 Key 不被击穿
- API 接口限流
- 防止恶意刷单/刷票
- 保护下游服务

**优势**：
- 分布式环境下的精确限流
- 基于 Redis 的高性能实现
- 支持多种限流策略