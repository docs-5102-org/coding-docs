---
title: 防止接口被恶意请求多次的解决方案
category:
  - Web框架
tag:
  - Spring Boot
---


# SpringBoot项目中接口防止恶意请求多次、重复请求的解决方案

## 目录

[[toc]]

## 1. 概述

在Web应用开发中，防止接口被恶意多次调用或重复请求是一个重要的安全和性能考虑。本文档将介绍几种在SpringBoot项目中实现防重复请求的解决方案。

### 1.1 常见场景

- 表单重复提交
- 恶意刷接口
- 网络延迟导致的重复点击
- 订单重复创建
- 评论重复发表

### 1.2 解决方案概览

- 基于Redis的分布式锁
- 基于注解的防重复提交
- 基于Token机制
- 基于接口幂等性设计
- 基于限流算法

## 2. 方案一：基于Redis分布式锁

### 2.1 依赖配置

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

### 2.2 自定义注解

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface PreventDuplicateSubmit {
    
    /**
     * 防重复操作时间，单位秒
     */
    int timeout() default 5;
    
    /**
     * 提示信息
     */
    String message() default "操作过于频繁，请稍后再试";
    
    /**
     * 是否包含请求参数在key中
     */
    boolean includeParams() default false;
}
```

### 2.3 AOP切面实现

```java
@Aspect
@Component
@Slf4j
public class PreventDuplicateSubmitAspect {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Around("@annotation(preventDuplicateSubmit)")
    public Object around(ProceedingJoinPoint joinPoint, PreventDuplicateSubmit preventDuplicateSubmit) throws Throwable {
        String key = generateKey(joinPoint, preventDuplicateSubmit);
        
        // 尝试获取锁
        Boolean lockResult = redisTemplate.opsForValue()
            .setIfAbsent(key, "1", Duration.ofSeconds(preventDuplicateSubmit.timeout()));
        
        if (Boolean.FALSE.equals(lockResult)) {
            throw new RuntimeException(preventDuplicateSubmit.message());
        }

        try {
            // 执行原方法
            return joinPoint.proceed();
        } finally {
            // 方法执行完成后，可以选择是否立即释放锁
            // redisTemplate.delete(key);
        }
    }

    /**
     * 生成Redis Key
     */
    private String generateKey(ProceedingJoinPoint joinPoint, PreventDuplicateSubmit preventDuplicateSubmit) {
        StringBuilder keyBuilder = new StringBuilder("duplicate_submit:");
        
        // 获取用户标识（可以是用户ID、IP等）
        String userIdentifier = getCurrentUserIdentifier();
        keyBuilder.append(userIdentifier).append(":");
        
        // 获取方法名
        String methodName = joinPoint.getSignature().getName();
        keyBuilder.append(methodName);
        
        // 是否包含请求参数
        if (preventDuplicateSubmit.includeParams()) {
            Object[] args = joinPoint.getArgs();
            String params = DigestUtils.md5DigestAsHex(JSON.toJSONString(args).getBytes());
            keyBuilder.append(":").append(params);
        }
        
        return keyBuilder.toString();
    }

    private String getCurrentUserIdentifier() {
        // 从SecurityContext或Session中获取用户ID
        // 或者从HttpServletRequest中获取IP地址
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder
            .currentRequestAttributes()).getRequest();
        return request.getRemoteAddr();
    }
}
```

### 2.4 使用示例

```java
@RestController
@RequestMapping("/api")
public class OrderController {

    @PostMapping("/order")
    @PreventDuplicateSubmit(timeout = 10, message = "订单提交过于频繁")
    public Result<String> createOrder(@RequestBody OrderRequest request) {
        // 业务逻辑
        return Result.success("订单创建成功");
    }

    @PostMapping("/comment")
    @PreventDuplicateSubmit(timeout = 5, includeParams = true)
    public Result<String> addComment(@RequestBody CommentRequest request) {
        // 评论逻辑
        return Result.success("评论发表成功");
    }
}
```

## 3. 方案二：基于Token机制

### 3.1 Token服务

```java
@Service
public class TokenService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String TOKEN_PREFIX = "submit_token:";
    private static final int TOKEN_EXPIRE_TIME = 300; // 5分钟

    /**
     * 生成Token
     */
    public String generateToken() {
        String token = UUID.randomUUID().toString().replace("-", "");
        String key = TOKEN_PREFIX + token;
        redisTemplate.opsForValue().set(key, "1", Duration.ofSeconds(TOKEN_EXPIRE_TIME));
        return token;
    }

    /**
     * 验证并消费Token
     */
    public boolean validateAndConsumeToken(String token) {
        if (StringUtils.isEmpty(token)) {
            return false;
        }
        
        String key = TOKEN_PREFIX + token;
        String script = "if redis.call('get', KEYS[1]) then " +
                       "redis.call('del', KEYS[1]) " +
                       "return 1 " +
                       "else " +
                       "return 0 " +
                       "end";
        
        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);
        
        Long result = redisTemplate.execute(redisScript, Collections.singletonList(key));
        return result != null && result == 1;
    }
}
```

### 3.2 Token注解和切面

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireToken {
    String message() default "请勿重复提交";
}

@Aspect
@Component
public class TokenValidationAspect {

    @Autowired
    private TokenService tokenService;

    @Around("@annotation(requireToken)")
    public Object around(ProceedingJoinPoint joinPoint, RequireToken requireToken) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder
            .currentRequestAttributes()).getRequest();
        
        String token = request.getHeader("Submit-Token");
        if (!tokenService.validateAndConsumeToken(token)) {
            throw new RuntimeException(requireToken.message());
        }

        return joinPoint.proceed();
    }
}
```

### 3.3 控制器实现

```java
@RestController
@RequestMapping("/api")
public class FormController {

    @Autowired
    private TokenService tokenService;

    @GetMapping("/token")
    public Result<String> getToken() {
        String token = tokenService.generateToken();
        return Result.success(token);
    }

    @PostMapping("/submit")
    @RequireToken(message = "表单已提交，请勿重复操作")
    public Result<String> submitForm(@RequestBody FormRequest request) {
        // 表单处理逻辑
        return Result.success("提交成功");
    }
}
```

## 4. 方案三：基于接口幂等性设计

### 4.1 幂等性注解

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Idempotent {
    
    /**
     * 幂等性key的生成策略
     */
    String keyExpression() default "";
    
    /**
     * 过期时间（秒）
     */
    int expireTime() default 3600;
    
    /**
     * 提示信息
     */
    String message() default "请勿重复操作";
}
```

### 4.2 幂等性处理器

```java
@Component
public class IdempotentHandler {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    private static final String IDEMPOTENT_PREFIX = "idempotent:";

    public boolean tryLock(String key, Object result, int expireTime) {
        String redisKey = IDEMPOTENT_PREFIX + key;
        Boolean lockResult = redisTemplate.opsForValue()
            .setIfAbsent(redisKey, result, Duration.ofSeconds(expireTime));
        return Boolean.TRUE.equals(lockResult);
    }

    public Object getResult(String key) {
        String redisKey = IDEMPOTENT_PREFIX + key;
        return redisTemplate.opsForValue().get(redisKey);
    }
}
```

### 4.3 幂等性切面

```java
@Aspect
@Component
public class IdempotentAspect {

    @Autowired
    private IdempotentHandler idempotentHandler;

    @Around("@annotation(idempotent)")
    public Object around(ProceedingJoinPoint joinPoint, Idempotent idempotent) throws Throwable {
        String key = generateKey(joinPoint, idempotent);
        
        // 检查是否已存在结果
        Object existResult = idempotentHandler.getResult(key);
        if (existResult != null) {
            return existResult;
        }

        // 执行业务逻辑
        Object result = joinPoint.proceed();
        
        // 保存结果
        idempotentHandler.tryLock(key, result, idempotent.expireTime());
        
        return result;
    }

    private String generateKey(ProceedingJoinPoint joinPoint, Idempotent idempotent) {
        if (StringUtils.hasText(idempotent.keyExpression())) {
            // 使用SpEL表达式解析key
            return parseKeyExpression(joinPoint, idempotent.keyExpression());
        } else {
            // 默认使用方法名+参数生成key
            return generateDefaultKey(joinPoint);
        }
    }

    private String parseKeyExpression(ProceedingJoinPoint joinPoint, String expression) {
        // SpEL表达式解析实现
        SpelExpressionParser parser = new SpelExpressionParser();
        Expression exp = parser.parseExpression(expression);
        
        EvaluationContext context = new StandardEvaluationContext();
        Object[] args = joinPoint.getArgs();
        String[] paramNames = getParameterNames(joinPoint);
        
        for (int i = 0; i < paramNames.length; i++) {
            context.setVariable(paramNames[i], args[i]);
        }
        
        return exp.getValue(context, String.class);
    }

    private String generateDefaultKey(ProceedingJoinPoint joinPoint) {
        String className = joinPoint.getTarget().getClass().getSimpleName();
        String methodName = joinPoint.getSignature().getName();
        String params = DigestUtils.md5DigestAsHex(JSON.toJSONString(joinPoint.getArgs()).getBytes());
        return className + ":" + methodName + ":" + params;
    }

    private String[] getParameterNames(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        return signature.getParameterNames();
    }
}
```

## 5. 方案四：基于限流算法

### 5.1 令牌桶算法实现

```java
@Component
public class RateLimiter {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    /**
     * 令牌桶限流
     * @param key 限流key
     * @param capacity 桶容量
     * @param refillRate 补充速率（每秒）
     * @param requested 请求令牌数
     * @return 是否获取成功
     */
    public boolean tryAcquire(String key, int capacity, int refillRate, int requested) {
        String script = 
            "local key = KEYS[1] " +
            "local capacity = tonumber(ARGV[1]) " +
            "local refill_rate = tonumber(ARGV[2]) " +
            "local requested = tonumber(ARGV[3]) " +
            "local now = tonumber(ARGV[4]) " +
            
            "local bucket = redis.call('hmget', key, 'tokens', 'last_refill') " +
            "local tokens = tonumber(bucket[1]) or capacity " +
            "local last_refill = tonumber(bucket[2]) or now " +
            
            "local elapsed = math.max(0, now - last_refill) " +
            "local new_tokens = math.min(capacity, tokens + elapsed * refill_rate / 1000) " +
            
            "if new_tokens >= requested then " +
                "redis.call('hmset', key, 'tokens', new_tokens - requested, 'last_refill', now) " +
                "redis.call('expire', key, 3600) " +
                "return 1 " +
            "else " +
                "redis.call('hmset', key, 'tokens', new_tokens, 'last_refill', now) " +
                "redis.call('expire', key, 3600) " +
                "return 0 " +
            "end";

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        Long result = redisTemplate.execute(redisScript, 
            Collections.singletonList(key), 
            capacity, refillRate, requested, System.currentTimeMillis());
        
        return result != null && result == 1;
    }
}
```

### 5.2 限流注解

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    
    /**
     * 限流key的前缀
     */
    String prefix() default "rate_limit";
    
    /**
     * 桶容量
     */
    int capacity() default 10;
    
    /**
     * 补充速率（每秒）
     */
    int refillRate() default 1;
    
    /**
     * 请求令牌数
     */
    int requested() default 1;
    
    /**
     * 提示信息
     */
    String message() default "访问过于频繁，请稍后再试";
}
```

### 5.3 限流切面

```java
@Aspect
@Component
public class RateLimitAspect {

    @Autowired
    private RateLimiter rateLimiter;

    @Around("@annotation(rateLimit)")
    public Object around(ProceedingJoinPoint joinPoint, RateLimit rateLimit) throws Throwable {
        String key = generateRateLimitKey(joinPoint, rateLimit);
        
        boolean acquired = rateLimiter.tryAcquire(key, 
            rateLimit.capacity(), 
            rateLimit.refillRate(), 
            rateLimit.requested());
        
        if (!acquired) {
            throw new RuntimeException(rateLimit.message());
        }

        return joinPoint.proceed();
    }

    private String generateRateLimitKey(ProceedingJoinPoint joinPoint, RateLimit rateLimit) {
        String userIdentifier = getCurrentUserIdentifier();
        String methodName = joinPoint.getSignature().getName();
        return rateLimit.prefix() + ":" + userIdentifier + ":" + methodName;
    }

    private String getCurrentUserIdentifier() {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder
            .currentRequestAttributes()).getRequest();
        // 可以根据实际情况获取用户ID或IP
        return request.getRemoteAddr();
    }
}
```

## 6. 全局异常处理

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public Result<Void> handleRuntimeException(RuntimeException e) {
        log.error("业务异常：", e);
        return Result.error(e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("系统异常：", e);
        return Result.error("系统繁忙，请稍后再试");
    }
}
```

## 7. 配置说明

### 7.1 Redis配置

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
        max-idle: 8
        min-idle: 0
        max-wait: -1ms
```

### 7.2 自定义配置

```java
@Configuration
@EnableAspectJAutoProxy
public class PreventDuplicateConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        
        Jackson2JsonRedisSerializer<Object> serializer = new Jackson2JsonRedisSerializer<>(Object.class);
        ObjectMapper mapper = new ObjectMapper();
        mapper.setVisibility(PropertyAccessor.ALL, JsonAutoDetect.Visibility.ANY);
        mapper.activateDefaultTyping(LazyInitializer.class, ObjectMapper.DefaultTyping.NON_FINAL);
        serializer.setObjectMapper(mapper);
        
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(serializer);
        
        return template;
    }
}
```

## 8. 使用建议

### 8.1 选择合适的方案

- **Redis分布式锁**：适用于分布式环境，防止短时间内的重复操作
- **Token机制**：适用于表单提交场景，安全性较高
- **接口幂等性**：适用于需要保证结果一致性的场景
- **限流算法**：适用于需要控制访问频率的场景

### 8.2 性能考虑

- 合理设置过期时间，避免Redis内存占用过高
- 对于高并发场景，考虑使用Lua脚本保证原子性
- 监控Redis性能，必要时进行集群部署

### 8.3 安全考虑

- 防止key被恶意猜测，可以加入随机盐值
- 对敏感操作增加额外的验证机制
- 记录重复请求日志，便于分析和监控

## 9. 总结

本文档介绍了多种在SpringBoot项目中防止接口重复请求的解决方案。每种方案都有其适用场景，开发者应根据具体业务需求选择合适的方案，也可以组合使用多种方案来达到最佳效果。

在实际项目中，建议：

1. 对关键业务接口实施防重复请求机制
2. 合理设置时间窗口和限制参数
3. 完善日志记录和监控机制
4. 定期评估和优化防护策略

通过合理的防护机制，可以有效提升系统的安全性和稳定性。