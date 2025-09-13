---
title: CORS跨域配置
category:
  - Web框架
tag:
  - Spring Boot
  - CORS
---

# Spring Boot CORS 跨域配置指南

## 目录

[[toc]]

## 1. CORS 简介

CORS (Cross-Origin Resource Sharing) 是一种安全机制，允许或限制来自不同域、端口或协议的网页向服务器发送请求。在前后端分离的项目中，跨域问题非常常见。

### 什么是跨域？

当满足以下任一条件时，即为跨域请求：
- 协议不同：`http://` 与 `https://`
- 域名不同：`example.com` 与 `api.example.com`
- 端口不同：`localhost:8080` 与 `localhost:3000`

## 2. Spring Boot CORS 配置方式

### 2.1 方式一：使用 @CrossOrigin 注解

#### 2.1.1 在 Controller 类上使用

```java
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000") // 允许特定域
public class UserController {
    
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.findAll();
    }
}
```

#### 2.1.2 在方法上使用

```java
@RestController
@RequestMapping("/api")
public class UserController {
    
    @CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userService.findAll();
    }
    
    @CrossOrigin(origins = "*", maxAge = 3600) // 允许所有域，缓存预检请求1小时
    @PostMapping("/users")
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
}
```

#### 2.1.3 @CrossOrigin 常用参数

```java
@CrossOrigin(
    origins = {"http://localhost:3000", "https://example.com"}, // 允许的源
    methods = {RequestMethod.GET, RequestMethod.POST}, // 允许的HTTP方法
    allowedHeaders = {"Content-Type", "Authorization"}, // 允许的请求头
    exposedHeaders = {"Custom-Header"}, // 暴露给客户端的响应头
    allowCredentials = true, // 是否允许发送Cookie
    maxAge = 3600 // 预检请求缓存时间（秒）
)
```

### 2.2 方式二：全局配置类

#### 2.2.1 实现 WebMvcConfigurer 接口

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // 对所有路径生效
                .allowedOrigins("http://localhost:3000", "http://localhost:8081")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

#### 2.2.2 更详细的全局配置

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // API 接口的跨域配置
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*") // 允许所有域，支持通配符
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(7200);
                
        // 文件上传接口的跨域配置
        registry.addMapping("/upload/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("POST", "OPTIONS")
                .allowedHeaders("Content-Type", "Authorization")
                .maxAge(1800);
    }
}
```

### 2.3 方式三：使用 CorsConfigurationSource Bean

```java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 设置允许的源
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        // 或者使用具体域名
        // configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
        
        // 设置允许的方法
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // 设置允许的头部
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // 是否允许携带凭证
        configuration.setAllowCredentials(true);
        
        // 设置预检请求缓存时间
        configuration.setMaxAge(3600L);
        
        // 设置暴露的头部
        configuration.setExposedHeaders(Arrays.asList("Authorization", "X-Total-Count"));
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}
```

### 2.4 方式四：使用过滤器（Filter）

```java
@Component
public class CorsFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        // 设置 CORS 头部
        httpResponse.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        httpResponse.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        httpResponse.setHeader("Access-Control-Allow-Headers", 
            "Origin, Content-Type, Accept, Authorization, X-Requested-With");
        httpResponse.setHeader("Access-Control-Allow-Credentials", "true");
        httpResponse.setHeader("Access-Control-Max-Age", "3600");
        
        // 处理预检请求
        if ("OPTIONS".equalsIgnoreCase(httpRequest.getMethod())) {
            httpResponse.setStatus(HttpServletResponse.SC_OK);
            return;
        }
        
        chain.doFilter(request, response);
    }
}
```

## 3. 配置文件方式

### 3.1 application.yml 配置

```yaml
# 虽然 Spring Boot 没有直接的 CORS 配置属性，但可以通过自定义属性来管理
cors:
  allowed-origins:
    - http://localhost:3000
    - http://localhost:8081
    - https://example.com
  allowed-methods:
    - GET
    - POST
    - PUT
    - DELETE
    - OPTIONS
  allowed-headers: "*"
  allow-credentials: true
  max-age: 3600
```

### 3.2 使用配置属性

```java
@Data
@Component
@ConfigurationProperties(prefix = "cors")
public class CorsProperties {
    private List<String> allowedOrigins = new ArrayList<>();
    private List<String> allowedMethods = new ArrayList<>();
    private List<String> allowedHeaders = new ArrayList<>();
    private boolean allowCredentials = true;
    private long maxAge = 3600;
}

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Autowired
    private CorsProperties corsProperties;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(corsProperties.getAllowedOrigins().toArray(new String[0]))
                .allowedMethods(corsProperties.getAllowedMethods().toArray(new String[0]))
                .allowedHeaders(corsProperties.getAllowedHeaders().toArray(new String[0]))
                .allowCredentials(corsProperties.isAllowCredentials())
                .maxAge(corsProperties.getMaxAge());
    }
}
```

## 4. Spring Security 中的 CORS 配置

如果项目中使用了 Spring Security，需要在安全配置中处理 CORS：

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .anyRequest().authenticated()
            );
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("*"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## 5. 最佳实践

### 5.1 生产环境配置

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins) // 从配置文件读取
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("Content-Type", "Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 5.2 环境相关配置

```yaml
# application-dev.yml
app:
  cors:
    allowed-origins: 
      - http://localhost:3000
      - http://localhost:8080

# application-prod.yml
app:
  cors:
    allowed-origins:
      - https://yourdomain.com
      - https://app.yourdomain.com
```

### 5.3 安全建议

1. **避免使用通配符 `*`**：在生产环境中，明确指定允许的域名
2. **最小权限原则**：只开放必要的 HTTP 方法和请求头
3. **合理设置缓存时间**：根据实际情况设置 `maxAge`
4. **谨慎使用 `allowCredentials`**：只在需要发送 Cookie 时才开启

## 6. 常见问题和解决方案

### 6.1 预检请求失败

```java
// 确保处理 OPTIONS 请求
@RequestMapping(method = RequestMethod.OPTIONS)
public ResponseEntity<?> handleOptions() {
    return ResponseEntity.ok().build();
}
```

### 6.2 Cookie 无法携带

```java
// 确保同时设置了服务端和客户端的凭证配置
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
```

前端（JavaScript）：
```javascript
fetch('http://localhost:8080/api/users', {
    credentials: 'include' // 重要：允许携带Cookie
})
```

### 6.3 多个配置冲突

配置优先级（从高到低）：
1. 方法级别的 `@CrossOrigin`
2. 类级别的 `@CrossOrigin`
3. 全局 `WebMvcConfigurer` 配置
4. Filter 配置

## 7. 测试 CORS 配置

### 7.1 使用浏览器开发者工具

检查网络请求中的响应头：
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`

### 7.2 使用 curl 命令测试

```bash
# 测试简单请求
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8080/api/users
```