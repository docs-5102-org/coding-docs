---
title: JustAuth授权登录应用指南
category:
  - 认证授权
tag:
  - JustAuth
---

# JustAuth授权登录应用指南

## 目录

[[toc]]


## 简介

JustAuth 是一个第三方授权登录的工具类库，它集成了众多第三方平台的授权登录SDK，为开发者提供了简单易用、功能完善的第三方登录解决方案。

### 主要特性

- **多平台支持**：支持国内外数十种第三方平台登录
- **简单易用**：统一的API接口，降低学习成本
- **高度可扩展**：支持自定义平台扩展
- **Spring Boot集成**：提供官方Spring Boot Starter
- **开源免费**：完全开源，社区活跃

## 相关资源

- **官网**：https://justauth.wiki/
- **Spring Boot插件**：https://github.com/justauth/justauth-spring-boot-starter
- **快速开始文档**：https://justauth.wiki/quickstart/how-to-use.html
- **统一认证开源项目**：https://gitee.com/fujieid/jap

## 快速开始

### 1. 添加依赖

#### Maven
```xml
<dependency>
    <groupId>me.zhyd.oauth</groupId>
    <artifactId>JustAuth</artifactId>
    <version>最新版本</version>
</dependency>
```

#### Gradle
```gradle
implementation 'me.zhyd.oauth:JustAuth:最新版本'
```

#### Spring Boot Starter（推荐）
```xml
<dependency>
    <groupId>com.xkcoding</groupId>
    <artifactId>justauth-spring-boot-starter</artifactId>
    <version>最新版本</version>
</dependency>
```

### 2. 配置第三方应用

在各个第三方平台创建应用并获取相应的配置信息：

- **Client ID**：应用标识
- **Client Secret**：应用密钥
- **Redirect URI**：回调地址

### 3. 创建授权配置

```java
// 创建授权配置
AuthConfig authConfig = AuthConfig.builder()
    .clientId("your_client_id")
    .clientSecret("your_client_secret")
    .redirectUri("http://localhost:8080/oauth/callback")
    .build();
```

### 4. 初始化授权服务

```java
// 以GitHub为例
AuthRequest authRequest = new AuthGithubRequest(authConfig);
```

## 核心功能

### 授权登录流程

#### 1. 获取授权URL
```java
@GetMapping("/oauth/render/{source}")
public String renderAuth(@PathVariable("source") String source) {
    AuthRequest authRequest = getAuthRequest(source);
    String authorizeUrl = authRequest.authorize(AuthStateUtils.createState());
    return "redirect:" + authorizeUrl;
}
```

#### 2. 处理回调
```java
@GetMapping("/oauth/callback/{source}")
public AuthResponse login(@PathVariable("source") String source, AuthCallback callback) {
    AuthRequest authRequest = getAuthRequest(source);
    AuthResponse response = authRequest.login(callback);
    return response;
}
```

### 支持的第三方平台

#### 国外平台
- GitHub
- Google
- Facebook
- Twitter
- Microsoft
- LinkedIn
- 等等...

#### 国内平台
- 微信
- QQ
- 微博
- 支付宝
- 钉钉
- 企业微信
- 等等...

## Spring Boot集成

### 1. 配置文件

```yaml
justauth:
  enabled: true
  type:
    github:
      client-id: your_github_client_id
      client-secret: your_github_client_secret
      redirect-uri: http://localhost:8080/oauth/callback/github
    wechat:
      client-id: your_wechat_app_id
      client-secret: your_wechat_app_secret
      redirect-uri: http://localhost:8080/oauth/callback/wechat
```

### 2. 自动配置

Spring Boot Starter会自动配置JustAuth相关的Bean：

```java
@Autowired
private AuthRequestFactory factory;

@GetMapping("/oauth/login/{type}")
public String login(@PathVariable String type) {
    AuthRequest authRequest = factory.get(type);
    return "redirect:" + authRequest.authorize(AuthStateUtils.createState());
}
```

## 高级用法

### 自定义HttpConfig

```java
AuthConfig authConfig = AuthConfig.builder()
    .clientId("clientId")
    .clientSecret("clientSecret")
    .redirectUri("redirectUri")
    .httpConfig(HttpConfig.builder()
        .timeout(15000)
        .proxy(new Proxy(Proxy.Type.HTTP, new InetSocketAddress("127.0.0.1", 10080)))
        .build())
    .build();
```

### 自定义缓存

```java
// 实现AuthStateCache接口
public class CustomStateCache implements AuthStateCache {
    @Override
    public void cache(String key, String value) {
        // 自定义缓存逻辑
    }
    
    @Override
    public String get(String key) {
        // 自定义获取逻辑
        return null;
    }
    
    @Override
    public boolean containsKey(String key) {
        // 自定义判断逻辑
        return false;
    }
}

// 使用自定义缓存
AuthRequest authRequest = new AuthGithubRequest(authConfig, new CustomStateCache());
```

## 最佳实践

### 1. 安全考虑

- **使用HTTPS**：生产环境必须使用HTTPS协议
- **State参数**：使用随机state参数防止CSRF攻击
- **密钥保护**：妥善保管客户端密钥，不要硬编码在代码中

### 2. 错误处理

```java
@GetMapping("/oauth/callback/{source}")
public ResponseEntity<?> callback(@PathVariable String source, AuthCallback callback) {
    try {
        AuthRequest authRequest = getAuthRequest(source);
        AuthResponse response = authRequest.login(callback);
        
        if (response.ok()) {
            AuthUser user = response.getData();
            // 处理用户信息
            return ResponseEntity.ok(user);
        } else {
            // 处理错误
            return ResponseEntity.badRequest().body(response.getMsg());
        }
    } catch (Exception e) {
        // 异常处理
        return ResponseEntity.status(500).body("登录失败：" + e.getMessage());
    }
}
```

### 3. 用户信息处理

```java
if (response.ok()) {
    AuthUser authUser = response.getData();
    
    // 获取用户基本信息
    String userId = authUser.getUuid();
    String username = authUser.getUsername();
    String nickname = authUser.getNickname();
    String avatar = authUser.getAvatar();
    String email = authUser.getEmail();
    
    // 业务逻辑处理
    User user = userService.findOrCreateUser(authUser);
    // 生成JWT token等
}
```

## 常见问题

### Q: 如何添加新的第三方平台支持？
A: 可以通过继承`AuthDefaultRequest`类来实现自定义平台支持，或者向官方提交PR。

### Q: 回调地址配置错误怎么办？
A: 确保第三方平台配置的回调地址与代码中的`redirectUri`完全一致。

### Q: 如何在分布式环境下使用？
A: 建议使用Redis等分布式缓存来实现`AuthStateCache`接口。

## 总结

JustAuth为开发者提供了便捷的第三方授权登录解决方案，通过统一的API接口大大简化了集成多个第三方登录平台的复杂度。结合Spring Boot Starter，可以快速实现功能完善的第三方登录系统。

更多详细信息和最新功能，请访问官方文档：https://justauth.wiki/