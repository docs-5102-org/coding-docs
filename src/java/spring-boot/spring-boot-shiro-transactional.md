---
title: SpringBoot集成Shiro事务问题
category:
  - Web框架
tag:
  - Spring Boot
  - Shiro
---


# Spring Boot 集成 Shiro 事务问题解决方案

## 问题描述

在 Spring Boot 项目中集成 Apache Shiro 时，开发者经常遇到一个棘手的问题：**自定义 Realm 中的 `@Transactional` 注解无法生效，导致事务无法正常回滚**。

### 问题现象

- 在 Shiro 的 Realm 中使用 `@Transactional` 注解标记的方法
- 数据库操作异常时，事务无法回滚
- 其他 Spring 管理的 Bean 中事务工作正常

### 典型错误代码示例

```java
@Component
public class CustomRealm extends AuthorizingRealm {
    
    @Autowired
    private UserService userService;
    
    @Override
    @Transactional  // 这个注解无效！
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) {
        // 数据库操作
        User user = userService.findByUsername(token.getPrincipal().toString());
        
        // 更新登录信息 - 异常时无法回滚
        userService.updateLoginInfo(user.getId());
        
        return new SimpleAuthenticationInfo(user, user.getPassword(), getName());
    }
}
```

```java
@Configuration
public class ShiroConfig {
    
    @Bean(name = "securityManager")
    public SecurityManager securityManager() {
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        // 问题所在：直接设置 Realm
        manager.setRealm(customRealm()); // ❌ 导致事务失效
        return manager;
    }
    
    @Bean
    public CustomRealm customRealm() {
        return new CustomRealm();
    }
}
```

## 根本原因分析

### Spring AOP 代理机制问题

这个问题的根本原因在于 **Spring AOP 代理的创建时机**：

1. **BeanPostProcessor 执行顺序**：Shiro 的 SecurityManager 在 Spring 容器初始化早期创建
2. **AOP 代理缺失**：当 SecurityManager 创建时直接引用 Realm，此时 AOP 相关的 BeanPostProcessor 还未执行
3. **事务代理未生成**：Realm 没有被 Spring 的事务代理包装，`@Transactional` 注解失效

### Spring 官方说明

根据 Spring 官方文档：

> All BeanPostProcessors and their directly referenced beans will be instantiated on startup... Since AOP auto-proxying is implemented as a BeanPostProcessor itself, no BeanPostProcessors or directly referenced beans are eligible for auto-proxying (and thus will not have aspects 'woven' into them).

## 解决方案

### 方案一：事件监听器延迟设置（推荐）

这是最可靠和广泛使用的解决方案。

#### 1. 修改 SecurityManager 配置

```java
@Configuration
public class ShiroConfig {
    
    @Bean(name = "securityManager")
    public SecurityManager securityManager() {
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        // ✅ 不直接设置 Realm，等待 Spring 容器完全初始化后再设置
        manager.setCacheManager(new MemoryConstrainedCacheManager());
        return manager;
    }
    
    @Bean(name = "customRealm")
    public CustomRealm customRealm() {
        return new CustomRealm();
    }
}
```

#### 2. 创建事件监听器

```java
@Component
public class ShiroRealmConfigurer {
    
    @EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
        ApplicationContext context = event.getApplicationContext();
        
        // 获取已完全初始化的 Bean（包含 AOP 代理）
        DefaultWebSecurityManager securityManager = 
            (DefaultWebSecurityManager) context.getBean("securityManager");
        CustomRealm realm = context.getBean("customRealm", CustomRealm.class);
        
        // 设置凭证匹配器（如果需要）
        realm.setCredentialsMatcher(new HashedCredentialsMatcher("SHA-256"));
        
        // ✅ 此时设置 Realm，事务代理已生效
        securityManager.setRealm(realm);
        
        System.out.println("Shiro Realm 配置完成，事务支持已启用");
    }
}
```

#### 3. 多 Realm 场景

```java
@Component
public class ShiroRealmConfigurer {
    
    @EventListener
    public void handleContextRefresh(ContextRefreshedEvent event) {
        ApplicationContext context = event.getApplicationContext();
        
        DefaultWebSecurityManager securityManager = 
            (DefaultWebSecurityManager) context.getBean("securityManager");
            
        // 设置多个 Realm
        List<Realm> realms = Arrays.asList(
            context.getBean("userRealm", Realm.class),
            context.getBean("adminRealm", Realm.class),
            context.getBean("apiRealm", Realm.class)
        );
        
        securityManager.setRealms(realms);
    }
}
```

### 方案二：使用 @Lazy 注解

适用于简单场景，通过延迟初始化避免代理问题。

```java
@Configuration
public class ShiroConfig {
    
    @Bean(name = "securityManager")
    public SecurityManager securityManager(@Lazy CustomRealm customRealm) {
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        // ✅ @Lazy 确保 Realm 在需要时才创建，此时 AOP 代理已就绪
        manager.setRealm(customRealm);
        return manager;
    }
    
    @Bean
    public CustomRealm customRealm() {
        return new CustomRealm();
    }
}
```

### 方案三：使用 @DependsOn 注解

通过依赖关系控制 Bean 的创建顺序。

```java
@Configuration
public class ShiroConfig {
    
    @Bean(name = "securityManager")
    @DependsOn({"customRealm", "transactionManager"})
    public SecurityManager securityManager(CustomRealm customRealm) {
        DefaultWebSecurityManager manager = new DefaultWebSecurityManager();
        manager.setRealm(customRealm);
        return manager;
    }
    
    @Bean
    public CustomRealm customRealm() {
        return new CustomRealm();
    }
}
```

## 验证解决方案

### 创建测试用例

```java
@Component
public class CustomRealm extends AuthorizingRealm {
    
    @Autowired
    private UserService userService;
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        
        String username = token.getPrincipal().toString();
        
        try {
            // 查询用户
            User user = userService.findByUsername(username);
            
            // 更新登录次数
            userService.incrementLoginCount(user.getId());
            
            // 模拟异常测试事务回滚
            if ("test_rollback".equals(username)) {
                throw new RuntimeException("测试事务回滚");
            }
            
            return new SimpleAuthenticationInfo(user, user.getPassword(), getName());
            
        } catch (Exception e) {
            // 事务应该自动回滚
            throw new AuthenticationException("登录失败", e);
        }
    }
}
```

### 测试代码

```java
@SpringBootTest
class ShiroTransactionTest {
    
    @Autowired
    private SecurityManager securityManager;
    
    @Autowired
    private UserService userService;
    
    @Test
    void testTransactionRollback() {
        // 获取初始登录次数
        User user = userService.findByUsername("test_rollback");
        int initialCount = user.getLoginCount();
        
        // 执行会触发异常的登录
        try {
            Subject subject = new Subject.Builder(securityManager).buildSubject();
            UsernamePasswordToken token = new UsernamePasswordToken("test_rollback", "password");
            subject.login(token);
        } catch (AuthenticationException e) {
            // 预期的异常
        }
        
        // 验证事务回滚：登录次数应该保持不变
        User userAfter = userService.findByUsername("test_rollback");
        assertEquals(initialCount, userAfter.getLoginCount(), "事务应该已回滚");
    }
}
```

## 最佳实践建议

### 1. 推荐使用事件监听器方案

- **兼容性最好**：适用于所有 Spring Boot 版本
- **控制精确**：可以精确控制 Realm 的初始化时机
- **易于调试**：初始化过程透明，便于排查问题

### 2. 日志配置

添加相关日志以便监控初始化过程：

```yaml
logging:
  level:
    org.springframework.aop: DEBUG
    org.springframework.transaction: DEBUG
    org.apache.shiro: DEBUG
```

### 3. 配置检查

在应用启动时检查配置是否正确：

```java
@Component
public class ShiroConfigurationChecker implements ApplicationRunner {
    
    @Autowired
    private SecurityManager securityManager;
    
    @Override
    public void run(ApplicationArguments args) {
        if (securityManager instanceof DefaultWebSecurityManager) {
            DefaultWebSecurityManager manager = (DefaultWebSecurityManager) securityManager;
            Collection<Realm> realms = manager.getRealms();
            
            if (realms != null && !realms.isEmpty()) {
                for (Realm realm : realms) {
                    // 检查是否为代理对象
                    boolean isProxy = AopUtils.isAopProxy(realm);
                    System.out.println(String.format(
                        "Realm: %s, 是否为AOP代理: %s", 
                        realm.getClass().getSimpleName(), 
                        isProxy ? "✅" : "❌"
                    ));
                }
            }
        }
    }
}
```

## 版本兼容性

| Spring Boot 版本 | 兼容性 | 推荐方案 |
|---|---|---|
| 2.0.x - 2.7.x | ✅ 完全兼容 | 事件监听器 |
| 3.0.x+ | ✅ 完全兼容 | 事件监听器 |

## 常见问题

### Q1: 为什么其他 Bean 的 @Transactional 正常工作？

**A**: 因为其他 Bean 不会在 Spring 容器初始化早期被直接引用，它们有机会被 AOP 代理包装。

### Q2: 使用 @Lazy 方案有什么限制？

**A**: 在某些复杂的依赖关系中，@Lazy 可能无法完全解决问题，事件监听器方案更可靠。

### Q3: 如何确认问题已解决？

**A**: 
1. 启用 AOP 调试日志
2. 检查 Realm 是否为代理对象（使用 `AopUtils.isAopProxy()`）
3. 编写事务回滚测试用例

## 总结

Spring Boot 与 Shiro 集成时的事务问题是由 Spring AOP 代理机制的特性导致的，而非框架缺陷。通过合理的配置策略，特别是**事件监听器延迟设置 Realm** 的方案，可以完美解决这个问题。

关键要点：
- 理解问题的根本原因：AOP 代理创建时机
- 选择合适的解决方案：推荐事件监听器方案
- 添加必要的验证：确保配置正确生效
- 遵循最佳实践：保持代码的可维护性和可测试性

这个解决方案在 Spring Boot 2.7.18 及其他版本中都经过验证，可以放心使用。