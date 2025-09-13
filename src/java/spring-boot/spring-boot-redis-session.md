---
title: SpringBoot实现Session共享
category:
  - Web框架
tag:
  - Redis实现Session共享
---

# SpringBoot + Redis实现Session共享方案

## 目录

[[toc]]

## 1. 方案概述

在分布式系统中，多个服务实例之间共享Session数据是一个常见需求。Spring Boot结合Redis可以很好地解决这个问题，通过Spring Session将HttpSession数据存储在Redis中，实现跨服务器的Session共享。

## 2. 技术栈

- Spring Boot 2.7.18
- Spring Session Data Redis
- Redis 6.x+
- Spring Boot Starter Data Redis

## 3. 项目依赖配置

### 3.1 Maven依赖

```xml
<dependencies>
    <!-- Spring Boot Web Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Redis Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
    
    <!-- Spring Session Data Redis -->
    <dependency>
        <groupId>org.springframework.session</groupId>
        <artifactId>spring-session-data-redis</artifactId>
    </dependency>
</dependencies>
```

### 3.2 Gradle依赖（可选）

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
    implementation 'org.springframework.session:spring-session-data-redis'
}
```

## 4. Redis配置

### 4.1 Redis配置类

```java
@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800) // 30分钟过期
public class RedisSessionConfig {
    
    @Bean
    public LettuceConnectionFactory connectionFactory() {
        return new LettuceConnectionFactory(
            new RedisStandaloneConfiguration("localhost", 6379)
        );
    }
    
    @Bean
    public RedisTemplate<String, Object> redisTemplate(LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // 设置序列化器
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        return template;
    }
}
```

### 4.2 application.yml配置

```yaml
spring:
  # Redis配置
  redis:
    host: localhost
    port: 6379
    database: 0
    password: # 如果Redis设置了密码
    timeout: 10000ms
    lettuce:
      pool:
        max-active: 50
        max-wait: -1ms
        max-idle: 8
        min-idle: 0
  
  # Session配置
  session:
    store-type: redis
    redis:
      namespace: spring:session
      flush-mode: on_save
      save-mode: on_set_attribute

# 服务器配置
server:
  port: 8080
  servlet:
    session:
      timeout: 30m
```

### 4.3 application.properties配置（可选）

```properties
# Redis配置
spring.redis.host=localhost
spring.redis.port=6379
spring.redis.database=0
spring.redis.timeout=10000
spring.redis.lettuce.pool.max-active=50
spring.redis.lettuce.pool.max-wait=-1
spring.redis.lettuce.pool.max-idle=8
spring.redis.lettuce.pool.min-idle=0

# Session配置
spring.session.store-type=redis
spring.session.redis.namespace=spring:session
spring.session.redis.flush-mode=on_save
spring.session.redis.save-mode=on_set_attribute

# 服务器配置
server.port=8080
server.servlet.session.timeout=30m
```

## 5. 测试控制器

创建一个测试控制器来验证Session共享功能：

```java
@RestController
@RequestMapping("/api/session")
public class SessionController {
    
    @GetMapping("/set")
    public ResponseEntity<Map<String, Object>> setSession(
            HttpServletRequest request,
            @RequestParam String key,
            @RequestParam String value) {
        
        HttpSession session = request.getSession();
        session.setAttribute(key, value);
        
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("message", "Session attribute set successfully");
        response.put("key", key);
        response.put("value", value);
        response.put("serverPort", request.getServerPort());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/get")
    public ResponseEntity<Map<String, Object>> getSession(
            HttpServletRequest request,
            @RequestParam String key) {
        
        HttpSession session = request.getSession();
        Object value = session.getAttribute(key);
        
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("key", key);
        response.put("value", value);
        response.put("serverPort", request.getServerPort());
        response.put("maxInactiveInterval", session.getMaxInactiveInterval());
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSessionInfo(HttpServletRequest request) {
        HttpSession session = request.getSession();
        
        Map<String, Object> response = new HashMap<>();
        response.put("sessionId", session.getId());
        response.put("creationTime", new Date(session.getCreationTime()));
        response.put("lastAccessedTime", new Date(session.getLastAccessedTime()));
        response.put("maxInactiveInterval", session.getMaxInactiveInterval());
        response.put("isNew", session.isNew());
        response.put("serverPort", request.getServerPort());
        
        // 获取所有session属性
        Map<String, Object> attributes = new HashMap<>();
        Enumeration<String> attributeNames = session.getAttributeNames();
        while (attributeNames.hasMoreElements()) {
            String attributeName = attributeNames.nextElement();
            attributes.put(attributeName, session.getAttribute(attributeName));
        }
        response.put("attributes", attributes);
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/invalidate")
    public ResponseEntity<Map<String, Object>> invalidateSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            String sessionId = session.getId();
            session.invalidate();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Session invalidated successfully");
            response.put("sessionId", sessionId);
            
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No active session found"));
        }
    }
}
```

## 6. 启动类配置

```java
@SpringBootApplication
public class SessionShareApplication {
    public static void main(String[] args) {
        SpringApplication.run(SessionShareApplication.class, args);
    }
}
```

## 7. 测试验证

### 7.1 启动多个实例

1. 启动第一个实例（端口8080）：
```bash
java -jar session-share-app.jar --server.port=8080
```

2. 启动第二个实例（端口8090）：
```bash
java -jar session-share-app.jar --server.port=8090
```

### 7.2 测试步骤

1. **设置Session数据**：
```bash
curl "http://localhost:8080/api/session/set?key=username&value=admin"
```

2. **从另一个实例获取Session数据**：
```bash
curl "http://localhost:8090/api/session/get?key=username" \
  -H "Cookie: SESSION=<从第一步返回的sessionId>"
```

3. **查看Session详细信息**：
```bash
curl "http://localhost:8080/api/session/info" \
  -H "Cookie: SESSION=<sessionId>"
```

### 7.3 预期结果

两个不同端口的服务实例应该返回相同的sessionId和session数据，证明Session共享成功。

## 8. 生产环境优化

### 8.1 Redis集群配置

```yaml
spring:
  redis:
    cluster:
      nodes:
        - 192.168.1.100:7001
        - 192.168.1.100:7002
        - 192.168.1.100:7003
        - 192.168.1.101:7001
        - 192.168.1.101:7002
        - 192.168.1.101:7003
      max-redirects: 3
    lettuce:
      pool:
        max-active: 100
        max-wait: -1ms
        max-idle: 20
        min-idle: 5
```

### 8.2 Session安全配置

```java
@Configuration
public class SessionSecurityConfig {
    
    @Bean
    public HttpSessionIdResolver httpSessionIdResolver() {
        return HeaderHttpSessionIdResolver.xAuthToken();
    }
    
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setCookieName("JSESSIONID");
        serializer.setCookiePath("/");
        serializer.setDomainNamePattern("^.+?\\.(\\w+\\.[a-z]+)$");
        serializer.setUseHttpOnlyCookie(true);
        serializer.setUseSecureCookie(true); // HTTPS环境下启用
        serializer.setSameSite("Strict");
        return serializer;
    }
}
```

### 8.3 监控配置

```java
@Component
public class SessionEventListener {
    
    private static final Logger logger = LoggerFactory.getLogger(SessionEventListener.class);
    
    @EventListener
    public void handleSessionCreated(SessionCreatedEvent event) {
        logger.info("Session created: {}", event.getSessionId());
    }
    
    @EventListener
    public void handleSessionDeleted(SessionDeletedEvent event) {
        logger.info("Session deleted: {}", event.getSessionId());
    }
    
    @EventListener
    public void handleSessionExpired(SessionExpiredEvent event) {
        logger.info("Session expired: {}", event.getSessionId());
    }
}
```

## 9. 总结

通过Spring Boot + Redis实现Session共享是一个成熟且高效的解决方案。它具有以下优势：

- **高可用性**：Redis支持主从复制和集群模式
- **高性能**：内存存储，访问速度快
- **易于扩展**：支持水平扩展
- **配置简单**：Spring Boot提供了开箱即用的支持

在生产环境中使用时，需要注意Redis的高可用配置、安全设置和性能监控，以确保系统的稳定性和安全性。