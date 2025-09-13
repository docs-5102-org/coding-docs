---
title: Redis限流技术详解与实践
category:
  - 中间件
tag:
  - Redis
  - 限流
---

# Redis限流技术详解与实践

## 📚 目录

[[toc]]

---

## 1. 概念与原理

### 1.1 什么是限流？

**限流（Rate Limiting）** 是一种控制访问频率的技术手段，主要用于：
- 🛡️ **系统保护**：防止系统过载，保障服务稳定性
- 🚫 **恶意防护**：阻止恶意爬虫、DOS攻击等
- ⚖️ **资源均衡**：确保系统资源公平分配
- 💰 **成本控制**：限制API调用量，控制第三方服务费用

### 1.2 主流限流算法对比

| 算法类型 | 优点 | 缺点 | 适用场景 |
|---------|------|------|----------|
| **固定窗口** | 实现简单，性能好 | 临界问题，可能出现突发流量 | 简单场景，对精度要求不高 |
| **滑动窗口** | 流量控制平滑，精度高 | 内存占用较大，实现复杂 | 精确流量控制，防止突发 |
| **令牌桶** | 支持突发流量，灵活性好 | 参数配置复杂 | 需要允许合理突发的场景 |
| **漏桶算法** | 流量整形效果好 | 无法处理突发需求 | 严格恒定速率输出 |

---

## 2. Redis限流的优势

### 2.1 为什么选择Redis？

**🚀 性能优势**
- 内存操作，毫秒级响应时间
- 单线程模型，避免锁竞争
- 支持管道和批量操作

**🔧 功能优势**
- 丰富的数据结构（有序集合、哈希表等）
- Lua脚本支持，保证操作原子性
- 内置过期机制，自动清理历史数据

**📈 扩展性**
- 支持集群模式，水平扩展
- 主从复制，高可用部署
- 与微服务架构完美结合

### 2.2 核心数据结构应用

```redis
# 有序集合 - 滑动窗口
ZADD rate_limit:user123 1640995200000 "req_001"
ZREMRANGEBYSCORE rate_limit:user123 0 1640995140000
ZCARD rate_limit:user123

# 字符串计数 - 固定窗口  
INCR rate_limit:user123:202112311400
EXPIRE rate_limit:user123:202112311400 60

# 哈希表 - 令牌桶状态
HSET token_bucket:user123 tokens 50 last_update 1640995200
```

---

## 3. 核心限流算法实现

### 3.1 滑动窗口算法 🎯

**原理图解：**
```
时间轴: |-------|-------|-------|-------|
       t-60s   t-45s   t-30s   t-15s    t
请求:    |||     ||      ||||    ||     |
       清除   <------ 60秒窗口 ----->  当前
```

**核心优势：**
- ✅ 精确控制时间窗口内请求数
- ✅ 避免固定窗口的临界问题  
- ✅ 平滑处理流量波动

**Redis实现（Lua脚本保证原子性）：**

```lua
-- 滑动窗口限流脚本
local key = KEYS[1]              -- 限流key
local now = tonumber(ARGV[1])    -- 当前时间戳(毫秒)
local window = tonumber(ARGV[2]) -- 窗口大小(毫秒)
local limit = tonumber(ARGV[3])  -- 限流阈值
local request_id = ARGV[4]       -- 请求唯一ID

-- 添加当前请求到有序集合
redis.call('ZADD', key, now, request_id)

-- 清除窗口外的历史请求
local window_start = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

-- 统计当前窗口内请求数
local current_count = redis.call('ZCARD', key)

-- 设置key过期时间（窗口大小的2倍，确保数据及时清理）
redis.call('EXPIRE', key, math.ceil(window / 1000) * 2)

-- 判断是否超限
if current_count > limit then
    -- 超限时移除当前请求
    redis.call('ZREM', key, request_id)
    return {0, current_count, limit}
else
    return {1, current_count, limit}
end
```

### 3.2 令牌桶算法 🪣

**原理图解：**
```
令牌桶 [🪙🪙🪙🪙🪙] 容量:10
       ↑         ↓
   令牌生成器   请求消费
   2个/秒      需要令牌
```

**核心优势：**
- ✅ 允许合理的突发流量
- ✅ 长期平均速率可控
- ✅ 响应性好，令牌足够时立即通过

**Redis实现：**

```lua
-- 令牌桶限流脚本
local bucket_key = KEYS[1]       -- 令牌数量key
local timestamp_key = KEYS[2]    -- 最后更新时间key

local capacity = tonumber(ARGV[1])      -- 桶容量
local tokens_per_sec = tonumber(ARGV[2]) -- 令牌生成速率
local current_time = tonumber(ARGV[3])   -- 当前时间
local tokens_requested = tonumber(ARGV[4]) -- 请求令牌数

-- 获取当前令牌数和最后更新时间
local current_tokens = tonumber(redis.call('GET', bucket_key) or capacity)
local last_update = tonumber(redis.call('GET', timestamp_key) or current_time)

-- 计算新增令牌数
local elapsed = current_time - last_update
local new_tokens = math.min(capacity, current_tokens + elapsed * tokens_per_sec)

-- 检查令牌是否足够
if new_tokens >= tokens_requested then
    -- 扣除令牌
    new_tokens = new_tokens - tokens_requested
    
    -- 更新状态（1小时过期）
    redis.call('SETEX', bucket_key, 3600, new_tokens)
    redis.call('SETEX', timestamp_key, 3600, current_time)
    
    return {1, new_tokens, capacity}
else
    -- 令牌不足，只更新时间戳
    redis.call('SETEX', bucket_key, 3600, new_tokens)
    redis.call('SETEX', timestamp_key, 3600, current_time)
    
    return {0, new_tokens, capacity}
end
```

### 3.3 固定窗口算法 ⏱️

**适用场景：** 对精度要求不高，追求极致性能的场景

```lua
-- 固定窗口限流脚本
local key = KEYS[1]
local window_size = tonumber(ARGV[1])  -- 窗口大小(秒)
local limit = tonumber(ARGV[2])        -- 限流阈值
local current_time = tonumber(ARGV[3])

-- 计算当前窗口key（按窗口大小取整）
local window_key = key .. ":" .. math.floor(current_time / window_size)

-- 原子性递增计数
local current_count = redis.call('INCR', window_key)

-- 首次访问时设置过期时间
if current_count == 1 then
    redis.call('EXPIRE', window_key, window_size)
end

-- 返回结果
if current_count <= limit then
    return {1, current_count, limit}
else
    return {0, current_count, limit}
end
```

---

## 4. 生产环境实践

### 4.1 架构设计原则

**🏗️ 分层设计**
```
┌─────────────────┐
│   API Gateway   │ ← 全局限流
├─────────────────┤
│  Service Layer  │ ← 业务限流  
├─────────────────┤
│   Redis Cluster │ ← 限流存储
└─────────────────┘
```

**🔧 配置管理**
- 动态配置：支持运行时调整限流参数
- 分级配置：用户级、IP级、接口级多维度限流
- 熔断机制：Redis不可用时的降级策略

### 4.2 关键技术细节

**时间戳精度选择：**
```python
# 毫秒级精度 - 推荐用于高并发场景
timestamp_ms = int(time.time() * 1000)

# 秒级精度 - 适用于低频场景
timestamp_s = int(time.time())
```

**唯一ID生成策略：**
```python
import uuid
import time

# 方案1: 时间戳 + UUID (推荐)
request_id = f"{int(time.time()*1000)}:{uuid.uuid4()}"

# 方案2: 时间戳 + 线程ID + 计数器
request_id = f"{timestamp}:{thread_id}:{counter}"
```

**内存优化技巧：**
```redis
# 合理设置TTL，避免内存泄漏
EXPIRE rate_limit:user123 120  # 窗口大小的2倍

# 定期清理过期数据
SCAN 0 MATCH rate_limit:* COUNT 100
```

### 4.3 错误处理与降级

```python
class RateLimiterError(Exception):
    """限流器异常基类"""
    pass

class RedisConnectionError(RateLimiterError):
    """Redis连接异常"""
    pass

def rate_limit_with_fallback(func):
    """限流装饰器，包含降级逻辑"""
    def wrapper(*args, **kwargs):
        try:
            # 尝试限流检查
            if not rate_limiter.is_allowed(key):
                return {"error": "Rate limit exceeded"}
        except RedisConnectionError:
            # Redis不可用时的降级策略
            logger.warning("Redis unavailable, bypassing rate limit")
            # 可选：使用本地缓存、返回默认值等
        
        return func(*args, **kwargs)
    return wrapper
```

---

## 5. 性能优化与监控

### 5.1 性能优化策略

**🚀 批量操作优化**
```python
# 使用pipeline批量处理
pipe = redis.pipeline()
for user_id in user_list:
    pipe.eval(rate_limit_script, 1, f"rate_limit:{user_id}", ...)
results = pipe.execute()
```

**📦 连接池配置**
```python
import redis

# 优化的连接池配置
pool = redis.ConnectionPool(
    host='localhost',
    port=6379,
    max_connections=100,    # 最大连接数
    retry_on_timeout=True,  # 超时重试
    socket_keepalive=True,  # 保持连接
    socket_keepalive_options={},
    health_check_interval=30  # 健康检查间隔
)
```

**⚡ Lua脚本预编译**
```python
class OptimizedRateLimiter:
    def __init__(self, redis_client):
        self.redis = redis_client
        # 预编译Lua脚本，避免重复传输
        self.sliding_window_sha = redis_client.script_load(sliding_window_script)
        self.token_bucket_sha = redis_client.script_load(token_bucket_script)
    
    def check_limit(self, key, *args):
        # 使用预编译脚本
        return self.redis.evalsha(self.sliding_window_sha, 1, key, *args)
```

### 5.2 监控指标设计

**📊 核心指标**
```python
# 限流统计指标
metrics = {
    "total_requests": 0,      # 总请求数
    "blocked_requests": 0,    # 被限流请求数  
    "block_rate": 0.0,        # 限流率
    "avg_response_time": 0.0, # 平均响应时间
    "redis_errors": 0,        # Redis错误数
}

# 业务维度统计
business_metrics = {
    "top_limited_users": [],   # 被限流最多的用户
    "top_limited_apis": [],    # 被限流最多的接口
    "hourly_distribution": {}, # 小时级分布
}
```

**⚠️ 告警策略**
```yaml
# 告警规则示例
alerts:
  - name: "高限流率告警"
    condition: "block_rate > 10%"
    duration: "5m"
    severity: "warning"
  
  - name: "Redis连接异常"
    condition: "redis_errors > 100/min"
    duration: "1m"  
    severity: "critical"
```

---

## 6. 完整代码示例

### 6.1 Python实现（生产级）

```python
import time
import uuid
import logging
import redis
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from enum import Enum

class LimitAlgorithm(Enum):
    """限流算法枚举"""
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    FIXED_WINDOW = "fixed_window"

@dataclass
class LimitResult:
    """限流结果"""
    allowed: bool           # 是否允许通过
    current_count: int     # 当前计数
    limit_count: int       # 限制数量
    remaining: int         # 剩余配额
    reset_time: Optional[int] = None  # 重置时间

class RedisRateLimiter:
    """Redis限流器 - 生产级实现"""
    
    # Lua脚本定义
    SLIDING_WINDOW_SCRIPT = """
        local key = KEYS[1]
        local now = tonumber(ARGV[1])
        local window = tonumber(ARGV[2])
        local limit = tonumber(ARGV[3])
        local request_id = ARGV[4]
        
        redis.call('ZADD', key, now, request_id)
        redis.call('ZREMRANGEBYSCORE', key, 0, now - window)
        local count = redis.call('ZCARD', key)
        redis.call('EXPIRE', key, math.ceil(window / 1000) * 2)
        
        if count > limit then
            redis.call('ZREM', key, request_id)
            return {0, count - 1, limit}
        else
            return {1, count, limit}
        end
    """
    
    TOKEN_BUCKET_SCRIPT = """
        local bucket_key = KEYS[1]
        local ts_key = KEYS[2]
        local capacity = tonumber(ARGV[1])
        local rate = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local requested = tonumber(ARGV[4])
        
        local tokens = tonumber(redis.call('GET', bucket_key) or capacity)
        local last_update = tonumber(redis.call('GET', ts_key) or now)
        
        local elapsed = now - last_update
        local new_tokens = math.min(capacity, tokens + elapsed * rate)
        
        if new_tokens >= requested then
            new_tokens = new_tokens - requested
            redis.call('SETEX', bucket_key, 3600, new_tokens)
            redis.call('SETEX', ts_key, 3600, now)
            return {1, new_tokens, capacity}
        else
            redis.call('SETEX', bucket_key, 3600, new_tokens)
            redis.call('SETEX', ts_key, 3600, now)
            return {0, new_tokens, capacity}
        end
    """
    
    def __init__(
        self,
        redis_client: redis.Redis,
        algorithm: LimitAlgorithm = LimitAlgorithm.SLIDING_WINDOW,
        default_limit: int = 100,
        window_size: int = 60,
        tokens_per_second: float = 1.0,
        bucket_capacity: int = 100
    ):
        """
        初始化限流器
        
        Args:
            redis_client: Redis客户端
            algorithm: 限流算法类型
            default_limit: 默认限制数量  
            window_size: 窗口大小(秒)
            tokens_per_second: 令牌生成速率(个/秒)
            bucket_capacity: 令牌桶容量
        """
        self.redis = redis_client
        self.algorithm = algorithm
        self.default_limit = default_limit
        self.window_size = window_size
        self.tokens_per_second = tokens_per_second
        self.bucket_capacity = bucket_capacity
        
        # 预编译Lua脚本
        self._sliding_window_sha = None
        self._token_bucket_sha = None
        self._load_scripts()
        
        # 配置日志
        self.logger = logging.getLogger(__name__)
        
    def _load_scripts(self) -> None:
        """预加载Lua脚本"""
        try:
            self._sliding_window_sha = self.redis.script_load(self.SLIDING_WINDOW_SCRIPT)
            self._token_bucket_sha = self.redis.script_load(self.TOKEN_BUCKET_SCRIPT)
        except Exception as e:
            self.logger.error(f"Failed to load Lua scripts: {e}")
            raise
    
    def is_allowed(
        self,
        key: str,
        limit: Optional[int] = None,
        tokens: int = 1
    ) -> LimitResult:
        """
        检查是否允许请求通过
        
        Args:
            key: 限流标识符
            limit: 自定义限制值
            tokens: 请求的令牌数量(仅令牌桶算法)
            
        Returns:
            LimitResult: 限流检查结果
        """
        effective_limit = limit or self.default_limit
        
        try:
            if self.algorithm == LimitAlgorithm.SLIDING_WINDOW:
                return self._sliding_window_check(key, effective_limit)
            elif self.algorithm == LimitAlgorithm.TOKEN_BUCKET:
                return self._token_bucket_check(key, tokens)
            else:
                raise ValueError(f"Unsupported algorithm: {self.algorithm}")
                
        except redis.RedisError as e:
            self.logger.error(f"Redis error in rate limiting: {e}")
            # 降级策略：Redis不可用时允许请求通过
            return LimitResult(
                allowed=True,
                current_count=0,
                limit_count=effective_limit,
                remaining=effective_limit
            )
    
    def _sliding_window_check(self, key: str, limit: int) -> LimitResult:
        """滑动窗口限流检查"""
        now = int(time.time() * 1000)
        window_ms = self.window_size * 1000
        request_id = f"{now}:{uuid.uuid4().hex[:8]}"
        
        redis_key = f"rate_limit:sw:{key}"
        
        result = self.redis.evalsha(
            self._sliding_window_sha,
            1,
            redis_key,
            now,
            window_ms,
            limit,
            request_id
        )
        
        allowed, current_count, limit_count = result
        remaining = max(0, limit_count - current_count)
        
        return LimitResult(
            allowed=bool(allowed),
            current_count=current_count,
            limit_count=limit_count,
            remaining=remaining,
            reset_time=now + window_ms
        )
    
    def _token_bucket_check(self, key: str, tokens: int) -> LimitResult:
        """令牌桶限流检查"""
        now = time.time()
        bucket_key = f"rate_limit:tb:{key}"
        ts_key = f"rate_limit:tb:{key}:ts"
        
        result = self.redis.evalsha(
            self._token_bucket_sha,
            2,
            bucket_key,
            ts_key,
            self.bucket_capacity,
            self.tokens_per_second,
            now,
            tokens
        )
        
        allowed, current_tokens, capacity = result
        
        return LimitResult(
            allowed=bool(allowed),
            current_count=int(capacity - current_tokens),
            limit_count=capacity,
            remaining=int(current_tokens)
        )

# 使用示例
if __name__ == "__main__":
    # 初始化Redis客户端
    redis_client = redis.Redis(
        host='localhost',
        port=6379,
        decode_responses=True,
        socket_keepalive=True,
        retry_on_timeout=True
    )
    
    # 创建限流器实例
    limiter = RedisRateLimiter(
        redis_client=redis_client,
        algorithm=LimitAlgorithm.SLIDING_WINDOW,
        default_limit=10,  # 每分钟10次
        window_size=60     # 60秒窗口
    )
    
    # 模拟请求
    user_id = "user_12345"
    
    for i in range(15):
        result = limiter.is_allowed(f"user:{user_id}")
        print(f"Request {i+1}: Allowed={result.allowed}, "
              f"Count={result.current_count}/{result.limit_count}, "
              f"Remaining={result.remaining}")
        time.sleep(0.1)
```

### 6.2 Java实现（Spring Boot集成）

```java
@Component
@Slf4j
public class RedisRateLimiter {
    
    private final RedisTemplate<String, String> redisTemplate;
    private final DefaultRedisScript<Long> slidingWindowScript;
    
    public RedisRateLimiter(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.slidingWindowScript = new DefaultRedisScript<>();
        this.slidingWindowScript.setResultType(Long.class);
        this.slidingWindowScript.setScriptSource(new ResourceScriptSource(
            new ClassPathResource("lua/sliding_window.lua")
        ));
    }
    
    /**
     * 滑动窗口限流检查
     */
    public boolean isAllowed(String key, int limit, int windowSize) {
        long now = System.currentTimeMillis();
        long windowStart = now - windowSize * 1000L;
        String requestId = now + ":" + UUID.randomUUID().toString();
        
        Long result = redisTemplate.execute(
            slidingWindowScript,
            Collections.singletonList("rate_limit:" + key),
            String.valueOf(now),
            String.valueOf(windowStart),
            requestId,
            String.valueOf(windowSize * 2)
        );
        
        boolean allowed = result != null && result <= limit;
        
        if (!allowed) {
            log.warn("Rate limit exceeded for key: {}, current: {}, limit: {}", 
                    key, result, limit);
        }
        
        return allowed;
    }
}

/**
 * 限流注解
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    
    /**
     * 限流key的前缀
     */
    String key() default "";
    
    /**
     * 限流次数
     */
    int count() default 100;
    
    /**
     * 时间窗口大小（秒）
     */
    int time() default 60;
    
    /**
     * 限流类型
     */
    LimitType limitType() default LimitType.DEFAULT;
    
    enum LimitType {
        DEFAULT,  // 默认策略
        IP,       // IP限流
        USER      // 用户限流
    }
}

/**
 * 限流切面
 */
@Aspect
@Component
@Slf4j
public class RateLimitAspect {
    
    private final RedisRateLimiter rateLimiter;
    
    public RateLimitAspect(RedisRateLimiter rateLimiter) {
        this.rateLimiter = rateLimiter;
    }
    
    @Before("@annotation(rateLimit)")
    public void before(JoinPoint point, RateLimit rateLimit) {
        String key = generateKey(point, rateLimit);
        
        if (!rateLimiter.isAllowed(key, rateLimit.count(), rateLimit.time())) {
            throw new RateLimitException("访问频率过高，请稍后再试");
        }
    }
    
    private String generateKey(JoinPoint point, RateLimit rateLimit) {
        // 生成限流key的逻辑
        StringBuilder keyBuilder = new StringBuilder(rateLimit.key());
        
        if (rateLimit.limitType() == RateLimit.LimitType.IP) {
            keyBuilder.append(":").append(getClientIP());
        } else if (rateLimit.limitType() == RateLimit.LimitType.USER) {
            keyBuilder.append(":").append(getCurrentUserId());
        }
        
        return keyBuilder.toString();
    }
}
```

---

## 总结与最佳实践 🎯

### ✅ 推荐做法

1. **算法选择**
   - 高精度要求 → 滑动窗口
   - 允许突发流量 → 令牌桶  
   - 追求极致性能 → 固定窗口

2. **技术实现**
   - 必须使用Lua脚本保证原子性
   - 合理设置TTL避免内存泄漏
   - 预编译脚本提升性能

3. **运维监控**
   - 建立完善的监控告警体系
   - 支持动态配置调整
   - 制定Redis故障降级策略

### ❌ 避免踩坑

1. **时间戳精度不足** - 高并发下请求冲突
2. **缺少原子性保证** - 并发场景下计数不准确  
3. **内存泄漏风险** - 未设置合理的TTL
4. **硬编码配置** - 缺乏灵活性和可维护性

通过以上实践，可以构建一个高性能、高可用的Redis限流系统，有效保护你的服务免受过载和恶意攻击。