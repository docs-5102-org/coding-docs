---
title: SpringBoot 集成Shiro应用指南
category:
  - Java 安全框架
  - Spring Boot
tag:
  - Shiro
---

# SpringBoot 集成Shiro应用指南

## 目录

[[toc]]

## 1. 简介

Apache Shiro是一个功能强大且易于使用的Java安全框架，提供了认证、授权、密码学和会话管理功能。与Spring Security相比，Shiro更加简洁易懂，适合中小型项目的权限管理需求。

### 1.1 Shiro核心功能
- **Authentication**：用户身份认证（登录）
- **Authorization**：访问权限控制
- **Session Management**：会话管理
- **Cryptography**：密码加密

### 1.2 Shiro架构
```
Subject --> SecurityManager --> Realm
```
- **Subject**：当前用户（可以是人或程序）
- **SecurityManager**：安全管理器，Shiro核心
- **Realm**：安全数据源，连接数据库等

## 2. 环境准备

- JDK 8+
- Spring Boot 2.x+
- Maven 3.6+
- MySQL 5.7+

## 3. 项目依赖配置

### 3.1 Maven依赖

在`pom.xml`中添加以下依赖：

```xml
<dependencies>
    <!-- Spring Boot Web Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot Data JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- MySQL连接器 -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Shiro Spring Boot Starter -->
    <dependency>
        <groupId>org.apache.shiro</groupId>
        <artifactId>shiro-spring-boot-web-starter</artifactId>
        <version>1.9.1</version>
    </dependency>
    
    <!-- Thymeleaf模板引擎 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    
    <!-- Thymeleaf Shiro标签 -->
    <dependency>
        <groupId>com.github.theborakompanioni</groupId>
        <artifactId>thymeleaf-extras-shiro</artifactId>
        <version>2.1.0</version>
    </dependency>
</dependencies>
```

### 3.2 配置文件

`application.yml`：
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/shiro_demo?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=UTC
    username: root
    password: 123456
    driver-class-name: com.mysql.cj.jdbc.Driver
    
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

# Shiro配置
shiro:
  loginUrl: /login
  successUrl: /index
  unauthorizedUrl: /unauthorized
  web:
    enabled: true
```

## 4. Shiro核心组件

### 4.1 实体类

**用户实体**：
```java
@Entity
@Table(name = "sys_user")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String username;
    
    private String password;
    
    private String salt;
    
    private Boolean enabled;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "user_role",
               joinColumns = @JoinColumn(name = "user_id"),
               inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();
}
```

**角色实体**：
```java
@Entity
@Table(name = "sys_role")
@Data
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    private String description;
    
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "role_permission",
               joinColumns = @JoinColumn(name = "role_id"),
               inverseJoinColumns = @JoinColumn(name = "permission_id"))
    private Set<Permission> permissions = new HashSet<>();
}
```

**权限实体**：
```java
@Entity
@Table(name = "sys_permission")
@Data
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    private String permission;
    
    private String url;
}
```

### 4.2 Repository接口

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
}

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
}
```

## 5. 配置Shiro

### 5.1 自定义Realm

```java
@Component
public class UserRealm extends AuthorizingRealm {
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 授权
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        String username = (String) principals.getPrimaryPrincipal();
        User user = userRepository.findByUsername(username);
        
        SimpleAuthorizationInfo authorizationInfo = new SimpleAuthorizationInfo();
        
        // 添加角色
        for (Role role : user.getRoles()) {
            authorizationInfo.addRole(role.getName());
            
            // 添加权限
            for (Permission permission : role.getPermissions()) {
                authorizationInfo.addStringPermission(permission.getPermission());
            }
        }
        
        return authorizationInfo;
    }
    
    /**
     * 认证
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        
        UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
        String username = usernamePasswordToken.getUsername();
        
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UnknownAccountException("用户不存在");
        }
        
        if (!user.getEnabled()) {
            throw new DisabledAccountException("账户被禁用");
        }
        
        // 返回认证信息
        return new SimpleAuthenticationInfo(
            user.getUsername(),
            user.getPassword(),
            ByteSource.Util.bytes(user.getSalt()),
            getName()
        );
    }
}
```

### 5.2 Shiro配置类

```java
@Configuration
public class ShiroConfig {
    
    @Autowired
    private UserRealm userRealm;
    
    /**
     * 安全管理器
     */
    @Bean
    public SecurityManager securityManager() {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(userRealm);
        securityManager.setSessionManager(sessionManager());
        securityManager.setCacheManager(cacheManager());
        return securityManager;
    }
    
    /**
     * Shiro过滤器
     */
    @Bean
    public ShiroFilterFactoryBean shiroFilterFactoryBean(SecurityManager securityManager) {
        ShiroFilterFactoryBean filterFactoryBean = new ShiroFilterFactoryBean();
        filterFactoryBean.setSecurityManager(securityManager);
        
        // 设置登录、成功、未授权跳转页面
        filterFactoryBean.setLoginUrl("/login");
        filterFactoryBean.setSuccessUrl("/index");
        filterFactoryBean.setUnauthorizedUrl("/unauthorized");
        
        // 配置过滤链
        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        
        // 公开资源
        filterChainDefinitionMap.put("/static/**", "anon");
        filterChainDefinitionMap.put("/login", "anon");
        filterChainDefinitionMap.put("/doLogin", "anon");
        filterChainDefinitionMap.put("/register", "anon");
        filterChainDefinitionMap.put("/logout", "logout");
        
        // 需要特定权限的资源
        filterChainDefinitionMap.put("/admin/**", "roles[admin]");
        filterChainDefinitionMap.put("/user/**", "perms[user:view]");
        
        // 需要认证的资源
        filterChainDefinitionMap.put("/**", "authc");
        
        filterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        return filterFactoryBean;
    }
    
    /**
     * 密码匹配器
     */
    @Bean
    public HashedCredentialsMatcher hashedCredentialsMatcher() {
        HashedCredentialsMatcher matcher = new HashedCredentialsMatcher();
        matcher.setHashAlgorithmName("MD5");
        matcher.setHashIterations(1024);
        matcher.setStoredCredentialsHexEncoded(true);
        return matcher;
    }
    
    /**
     * 会话管理器
     */
    @Bean
    public SessionManager sessionManager() {
        DefaultWebSessionManager sessionManager = new DefaultWebSessionManager();
        sessionManager.setGlobalSessionTimeout(1800000); // 30分钟
        sessionManager.setDeleteInvalidSessions(true);
        sessionManager.setSessionValidationSchedulerEnabled(true);
        return sessionManager;
    }
    
    /**
     * 缓存管理器
     */
    @Bean
    public CacheManager cacheManager() {
        return new MemoryConstrainedCacheManager();
    }
    
    /**
     * 开启Shiro注解支持
     */
    @Bean
    public AuthorizationAttributeSourceAdvisor authorizationAttributeSourceAdvisor(
            SecurityManager securityManager) {
        AuthorizationAttributeSourceAdvisor advisor = new AuthorizationAttributeSourceAdvisor();
        advisor.setSecurityManager(securityManager);
        return advisor;
    }
    
    @Bean
    @ConditionalOnMissingBean
    public DefaultAdvisorAutoProxyCreator defaultAdvisorAutoProxyCreator() {
        DefaultAdvisorAutoProxyCreator proxyCreator = new DefaultAdvisorAutoProxyCreator();
        proxyCreator.setProxyTargetClass(true);
        return proxyCreator;
    }
}
```

## 6. 实现用户认证

### 6.1 登录控制器

```java
@Controller
public class LoginController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping("/login")
    public String login() {
        return "login";
    }
    
    @PostMapping("/doLogin")
    @ResponseBody
    public ResponseEntity<String> doLogin(@RequestParam String username,
                                         @RequestParam String password,
                                         @RequestParam(defaultValue = "false") boolean rememberMe) {
        try {
            Subject subject = SecurityUtils.getSubject();
            UsernamePasswordToken token = new UsernamePasswordToken(username, password, rememberMe);
            subject.login(token);
            
            return ResponseEntity.ok("登录成功");
        } catch (UnknownAccountException e) {
            return ResponseEntity.badRequest().body("用户不存在");
        } catch (IncorrectCredentialsException e) {
            return ResponseEntity.badRequest().body("密码错误");
        } catch (DisabledAccountException e) {
            return ResponseEntity.badRequest().body("账户被禁用");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("登录失败");
        }
    }
    
    @GetMapping("/logout")
    public String logout() {
        Subject subject = SecurityUtils.getSubject();
        subject.logout();
        return "redirect:/login";
    }
    
    @GetMapping("/unauthorized")
    public String unauthorized() {
        return "unauthorized";
    }
}
```

### 6.2 用户服务

```java
@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }
    
    public User save(User user) {
        // 生成盐值
        String salt = UUID.randomUUID().toString();
        user.setSalt(salt);
        
        // 密码加密
        String hashedPassword = new Md5Hash(user.getPassword(), salt, 1024).toHex();
        user.setPassword(hashedPassword);
        
        return userRepository.save(user);
    }
}
```

## 7. 实现权限授权

### 7.1 控制器权限验证

```java
@RestController
@RequestMapping("/admin")
public class AdminController {
    
    @GetMapping("/users")
    @RequiresRoles("admin")
    public List<User> getUsers() {
        // 管理员才能访问
        return userService.findAll();
    }
    
    @PostMapping("/users")
    @RequiresPermissions("user:create")
    public User createUser(@RequestBody User user) {
        // 需要user:create权限
        return userService.save(user);
    }
    
    @PutMapping("/users/{id}")
    @RequiresPermissions("user:update")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        // 需要user:update权限
        return userService.update(id, user);
    }
    
    @DeleteMapping("/users/{id}")
    @RequiresPermissions("user:delete")
    public void deleteUser(@PathVariable Long id) {
        // 需要user:delete权限
        userService.delete(id);
    }
}
```

### 7.2 编程式权限验证

```java
@Controller
public class UserController {
    
    @GetMapping("/profile")
    public String profile(Model model) {
        Subject subject = SecurityUtils.getSubject();
        
        // 检查权限
        if (subject.hasRole("admin")) {
            model.addAttribute("isAdmin", true);
        }
        
        if (subject.isPermitted("user:view")) {
            model.addAttribute("canViewUser", true);
        }
        
        return "profile";
    }
}
```

## 8. 会话管理

### 8.1 会话监听器

```java
@Component
public class ShiroSessionListener implements SessionListener {
    
    private final AtomicInteger sessionCount = new AtomicInteger(0);
    
    @Override
    public void onStart(Session session) {
        sessionCount.incrementAndGet();
        System.out.println("会话创建：" + session.getId() + "，当前在线用户数：" + sessionCount.get());
    }
    
    @Override
    public void onStop(Session session) {
        sessionCount.decrementAndGet();
        System.out.println("会话结束：" + session.getId() + "，当前在线用户数：" + sessionCount.get());
    }
    
    @Override
    public void onExpiration(Session session) {
        sessionCount.decrementAndGet();
        System.out.println("会话过期：" + session.getId() + "，当前在线用户数：" + sessionCount.get());
    }
    
    public int getSessionCount() {
        return sessionCount.get();
    }
}
```

### 8.2 会话管理控制器

```java
@RestController
@RequestMapping("/session")
public class SessionController {
    
    @Autowired
    private ShiroSessionListener sessionListener;
    
    @GetMapping("/count")
    public int getOnlineUserCount() {
        return sessionListener.getSessionCount();
    }
    
    @GetMapping("/info")
    public Map<String, Object> getSessionInfo() {
        Subject subject = SecurityUtils.getSubject();
        Session session = subject.getSession();
        
        Map<String, Object> info = new HashMap<>();
        info.put("sessionId", session.getId());
        info.put("host", session.getHost());
        info.put("startTime", session.getStartTimestamp());
        info.put("lastAccessTime", session.getLastAccessTime());
        info.put("timeout", session.getTimeout());
        
        return info;
    }
}
```

## 9. 密码加密

### 9.1 密码工具类

```java
@Component
public class PasswordHelper {
    
    public void encryptPassword(User user) {
        // 生成随机盐
        String salt = UUID.randomUUID().toString();
        user.setSalt(salt);
        
        // 使用MD5加密，迭代1024次
        String hashedPassword = new Md5Hash(user.getPassword(), salt, 1024).toHex();
        user.setPassword(hashedPassword);
    }
    
    public boolean validatePassword(String plainPassword, User user) {
        String hashedPassword = new Md5Hash(plainPassword, user.getSalt(), 1024).toHex();
        return hashedPassword.equals(user.getPassword());
    }
}
```

### 9.2 注册功能

```java
@PostMapping("/register")
@ResponseBody
public ResponseEntity<String> register(@RequestBody User user) {
    try {
        // 检查用户是否已存在
        if (userService.findByUsername(user.getUsername()) != null) {
            return ResponseEntity.badRequest().body("用户名已存在");
        }
        
        // 设置默认属性
        user.setEnabled(true);
        
        // 保存用户（会自动加密密码）
        userService.save(user);
        
        return ResponseEntity.ok("注册成功");
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("注册失败：" + e.getMessage());
    }
}
```

## 10. 注解使用

### 10.1 常用权限注解

```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    /**
     * 要求用户已登录
     */
    @RequiresAuthentication
    @GetMapping("/profile")
    public User getProfile() {
        Subject subject = SecurityUtils.getSubject();
        String username = (String) subject.getPrincipal();
        return userService.findByUsername(username);
    }
    
    /**
     * 要求用户未登录（游客状态）
     */
    @RequiresGuest
    @GetMapping("/public")
    public String getPublicInfo() {
        return "公开信息";
    }
    
    /**
     * 要求用户已登录且未被Remember Me
     */
    @RequiresUser
    @GetMapping("/secure")
    public String getSecureInfo() {
        return "安全信息";
    }
    
    /**
     * 要求特定角色
     */
    @RequiresRoles({"admin", "manager"})
    @GetMapping("/management")
    public String getManagementInfo() {
        return "管理信息";
    }
    
    /**
     * 要求特定权限
     */
    @RequiresPermissions({"user:read", "user:write"})
    @GetMapping("/user-operations")
    public String getUserOperations() {
        return "用户操作";
    }
}
```

### 10.2 逻辑运算符

```java
// AND逻辑（默认）
@RequiresRoles({"admin", "manager"})
public void methodRequiresBothRoles() {
    // 需要同时拥有admin和manager角色
}

// OR逻辑
@RequiresRoles(value = {"admin", "manager"}, logical = Logical.OR)
public void methodRequiresEitherRole() {
    // 拥有admin或manager角色之一即可
}
```

## 11. 异常处理

### 11.1 全局异常处理

```java
@ControllerAdvice
public class ShiroExceptionHandler {
    
    @ExceptionHandler(UnauthorizedException.class)
    @ResponseBody
    public ResponseEntity<String> handleUnauthorizedException(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("权限不足");
    }
    
    @ExceptionHandler(UnauthenticatedException.class)
    @ResponseBody
    public ResponseEntity<String> handleUnauthenticatedException(UnauthenticatedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("未登录");
    }
    
    @ExceptionHandler(AuthenticationException.class)
    @ResponseBody
    public ResponseEntity<String> handleAuthenticationException(AuthenticationException e) {
        return ResponseEntity.badRequest().body("认证失败：" + e.getMessage());
    }
}
```

### 11.2 Ajax请求处理

```java
@Component
public class AjaxPermissionsAuthorizationFilter extends PermissionsAuthorizationFilter {
    
    @Override
    protected boolean onAccessDenied(ServletRequest request, ServletResponse response) throws IOException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // 判断是否为Ajax请求
        String requestType = httpRequest.getHeader("X-Requested-With");
        if ("XMLHttpRequest".equals(requestType)) {
            // Ajax请求返回JSON
            httpResponse.setStatus(HttpStatus.FORBIDDEN.value());
            httpResponse.setContentType("application/json;charset=utf-8");
            httpResponse.getWriter().write("{\"code\":403,\"message\":\"权限不足\"}");
            return false;
        }
        
        // 普通请求跳转到未授权页面
        return super.onAccessDenied(request, response);
    }
}
```

## 12. 实际应用示例

### 12.1 前端页面权限控制

使用Thymeleaf + Shiro标签：

```html
<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org" 
      xmlns:shiro="http://www.pollix.at/thymeleaf/shiro">
<head>
    <title>首页</title>
</head>
<body>
    <div>
        <!-- 已认证用户可见 -->
        <div shiro:authenticated="">
            <p>欢迎，<span shiro:principal=""></span>！</p>
            <a href="/logout">退出登录</a>
        </div>
        
        <!-- 未认证用户可见 -->
        <div shiro:notAuthenticated="">
            <a href="/login">请登录</a>
        </div>
        
        <!-- 拥有admin角色可见 -->
        <div shiro:hasRole="admin">
            <a href="/admin">管理中心</a>
        </div>
        
        <!-- 拥有user:create权限可见 -->
        <div shiro:hasPermission="user:create">
            <button onclick="createUser()">创建用户</button>
        </div>
        
        <!-- 拥有admin或manager角色可见 -->
        <div shiro:hasAnyRoles="admin,manager">
            <a href="/reports">查看报表</a>
        </div>
    </div>
</body>
</html>
```

### 12.2 完整的CRUD示例

```java
@RestController
@RequestMapping("/api/users")
@RequiresAuthentication
public class UserApiController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    @RequiresPermissions("user:view")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{id}")
    @RequiresPermissions("user:view")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }
    
    @PostMapping
    @RequiresPermissions("user:create")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User savedUser = userService.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedUser);
    }
    
    @PutMapping("/{id}")
    @RequiresPermissions("user:update")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        User existingUser = userService.findById(id);
        if (existingUser == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 检查是否只能修改自己的信息
        Subject subject = SecurityUtils.getSubject();
        String currentUsername = (String) subject.getPrincipal();
        
        if (!subject.hasRole("admin") && !existingUser.getUsername().equals(currentUsername)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        User updatedUser = userService.update(id, user);
        return ResponseEntity.ok(updatedUser);
    }
    
    @DeleteMapping("/{id}")
    @RequiresPermissions("user:delete")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        User user = userService.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

## 13. 常见问题

### 13.1 Shiro与Spring Boot的整合问题

**问题**：使用`@RequiresRoles`或`@RequiresPermissions`注解无效

**解决方案**：
1. 确保已添加`@EnableAspectJAutoProxy(proxyTargetClass = true)`
2. 配置`AuthorizationAttributeSourceAdvisor`
3. 注册`DefaultAdvisorAutoProxyCreator`

### 13.2 密码验证失败

**问题**：正确的用户名密码无法登录

**解决方案**：
1. 检查Realm中的`hashedCredentialsMatcher`配置
2. 确保加密算法、迭代次数、编码方式一致
3. 验证盐值的生成和存储

### 13.3 权限更新不及时

**问题**：修改用户权限后不立即生效

**解决方案**：
1. 清除权限缓存：`subject.getPrincipals().getRealmNames()`
2. 重新登录或手动刷新权限缓存
3. 配置合适的缓存过期时间

### 13.4 会话管理问题

**问题**：用户频繁被要求重新登录

**解决方案**：
1. 调整会话超时时间
2. 检查会话存储配置
3. 考虑使用Redis等外部会话存储

### 13.5 跨域请求问题

**问题**：前后端分离时认证失败

**解决方案**：
```java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowCredentials(true);
        corsConfiguration.addAllowedOriginPattern("*");
        corsConfiguration.addAllowedHeader("*");
        corsConfiguration.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", corsConfiguration);
        return new CorsFilter(source);
    }
}
```

## 参考资料

* [shiro+jwt实现登录](https://www.cnblogs.com/red-star/p/12121941.html)


## 总结

本指南详细介绍了SpringBoot集成Apache Shiro的完整过程，包括：

1. **项目搭建**：依赖配置和基础架构
2. **核心配置**：Realm、SecurityManager、过滤器链
3. **认证授权**：用户登录验证和权限控制
4. **会话管理**：会话监听和状态管理
5. **密码安全**：加密存储和验证机制
6. **注解支持**：声明式权限控制
7. **异常处理**：统一的错误处理机制
8. **实际应用**：完整的业务场景示例

通过本指南，您应该能够在SpringBoot项目中成功集成和使用Apache Shiro来实现完整的权限管理系统。记住要根据具体业