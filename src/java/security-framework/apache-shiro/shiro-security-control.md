---
title: Shiro Security 安全控制指南
category:
  - Java 安全认证框架
tag:
  - Shiro
---

# Shiro Security 安全控制指南

## 概述

Apache Shiro 是一个功能强大且易于使用的Java安全框架，提供了身份验证、授权、密码学和会话管理等功能。本文档将详细介绍两个重要的安全控制功能：

1. **登录尝试次数限制** - 防止暴力破解密码
2. **并发登录人数控制** - 限制同一账户的同时登录数量

## 一、登录尝试次数限制

### 1.1 功能概述

登录尝试次数限制可以有效防止恶意用户通过多次尝试来暴力破解密码。通过在指定时间内限制用户的登录尝试次数，当超过限制后自动锁定账户一段时间。

### 1.2 实现原理

- 利用Shiro的 `CredentialsMatcher` 机制进行验证前检查
- 使用Ehcache缓存存储用户登录尝试次数信息
- 依靠Ehcache的 `timeToIdleSeconds` 属性实现自动解锁机制

### 1.3 核心实现

#### 1.3.1 自定义CredentialsMatcher

```java
public class RetryLimitCredentialsMatcher extends HashedCredentialsMatcher {
    // 集群中可能会导致出现验证多过5次的现象，因为AtomicInteger只能保证单节点并发
    private Cache<String, AtomicInteger> passwordRetryCache;
    
    public RetryLimitCredentialsMatcher(CacheManager cacheManager) {
        passwordRetryCache = cacheManager.getCache("passwordRetryCache");
    }
    
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        String username = (String)token.getPrincipal();
        
        // retry count + 1
        AtomicInteger retryCount = passwordRetryCache.get(username);
        if(null == retryCount) {
            retryCount = new AtomicInteger(0);
            passwordRetryCache.put(username, retryCount);
        }
        
        if(retryCount.incrementAndGet() > 5) {
            logger.warn("username: " + username + " tried to login more than 5 times in period");
            throw new ExcessiveAttemptsException("username: " + username + " tried to login more than 5 times in period");
        }
        
        boolean matches = super.doCredentialsMatch(token, info);
        
        if(matches) {
            // clear retry data
            passwordRetryCache.remove(username);
        }
        
        return matches;
    }
}
```

#### 1.3.2 Spring配置

**CacheManager配置：**

```xml
<bean id="springCacheManager" class="org.springframework.cache.ehcache.EhCacheCacheManager">
    <property name="cacheManager" ref="ehcacheManager"/>
</bean>

<!--ehcache-->
<bean id="ehcacheManager" class="org.springframework.cache.ehcache.EhCacheManagerFactoryBean">
    <property name="configLocation" value="classpath:ehcache/ehcache.xml"/>
</bean>
```

**Ehcache配置：**

```xml
<ehcache name="es">
    <diskStore path="java.io.tmpdir"/>
    
    <!-- 登录记录缓存 锁定100分钟 -->
    <cache name="passwordRetryCache"
           maxEntriesLocalHeap="20000"
           eternal="false"
           timeToIdleSeconds="36000"
           timeToLiveSeconds="0"
           overflowToDisk="false"
           statistics="false">
    </cache>
</ehcache>
```

**Shiro配置：**

```xml
<bean id="credentialsMatcher" class="com.cloud.service.security.credentials.RetryLimitCredentialsMatcher">
    <constructor-arg ref="springCacheManager"/>
    <property name="storedCredentialsHexEncoded" value="true"/>
</bean>

<bean id="myRealm" class="com.cloud.service.security.UserRealm">
    <property name="credentialsMatcher" ref="credentialsMatcher"/>
    <property name="cachingEnabled" value="false"/>
</bean>
```

### 1.4 关键特性

- **自动解锁**：通过 `timeToIdleSeconds=36000`（100分钟）实现账户自动解锁
- **集群注意事项**：在集群环境中，AtomicInteger只能保证单节点并发，可能出现验证次数超过5次的情况
- **成功登录重置**：登录成功后自动清除尝试次数记录

## 二、并发登录人数控制

### 2.1 功能概述

并发登录人数控制可以限制同一个账户同时登录的用户数量。当超过限制时，可以选择：
- 拒绝后来者登录
- 踢出先前登录的用户（强制退出）

### 2.2 实现方案

通过扩展Shiro Filter机制，实现 `KickoutSessionControlFilter` 来完成并发控制。

### 2.3 配置使用

#### 2.3.1 Filter配置

```xml
<bean id="kickoutSessionControlFilter" 
      class="com.github.zhangkaitao.shiro.chapter18.web.shiro.filter.KickoutSessionControlFilter">
    <property name="cacheManager" ref="cacheManager"/>
    <property name="sessionManager" ref="sessionManager"/>
    <property name="kickoutAfter" value="false"/>
    <property name="maxSession" value="2"/>
    <property name="kickoutUrl" value="/login?kickout=1"/>
</bean>
```

**配置参数说明：**

| 参数 | 说明 |
|------|------|
| `cacheManager` | 缓存管理器，用于缓存用户登录会话关系 |
| `sessionManager` | 会话管理器，用于根据会话ID获取会话进行踢出操作 |
| `kickoutAfter` | 是否踢出后来登录的用户，默认false（踢出先前登录的） |
| `maxSession` | 同一用户最大会话数，默认1 |
| `kickoutUrl` | 被踢出后重定向到的地址 |

#### 2.3.2 ShiroFilter配置

```xml
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/login"/>
    <property name="filters">
        <util:map>
            <entry key="authc" value-ref="formAuthenticationFilter"/>
            <entry key="sysUser" value-ref="sysUserFilter"/>
            <entry key="kickout" value-ref="kickoutSessionControlFilter"/>
        </util:map>
    </property>
    <property name="filterChainDefinitions">
        <value>
            /login = authc
            /logout = logout
            /authenticated = authc
            /** = kickout,user,sysUser
        </value>
    </property>
</bean>
```

### 2.4 核心实现逻辑

```java
protected boolean onAccessDenied(ServletRequest request, ServletResponse response) throws Exception {
    Subject subject = getSubject(request, response);
    if(!subject.isAuthenticated() && !subject.isRemembered()) {
        // 如果没有登录，直接进行之后的流程
        return true;
    }
    
    Session session = subject.getSession();
    String username = (String) subject.getPrincipal();
    Serializable sessionId = session.getId();
    
    // TODO 同步控制
    Deque<Serializable> deque = cache.get(username);
    if(deque == null) {
        deque = new LinkedList<Serializable>();
        cache.put(username, deque);
    }
    
    // 如果队列里没有此sessionId，且用户没有被踢出；放入队列
    if(!deque.contains(sessionId) && session.getAttribute("kickout") == null) {
        deque.push(sessionId);
    }
    
    // 如果队列里的sessionId数超出最大会话数，开始踢人
    while(deque.size() > maxSession) {
        Serializable kickoutSessionId = null;
        if(kickoutAfter) { // 如果踢出后者
            kickoutSessionId = deque.removeFirst();
        } else { // 否则踢出前者
            kickoutSessionId = deque.removeLast();
        }
        
        try {
            Session kickoutSession = sessionManager.getSession(new DefaultSessionKey(kickoutSessionId));
            if(kickoutSession != null) {
                // 设置会话的kickout属性表示踢出了
                kickoutSession.setAttribute("kickout", true);
            }
        } catch (Exception e) {
            // ignore exception
        }
    }
    
    // 如果被踢出了，直接退出，重定向到踢出后的地址
    if (session.getAttribute("kickout") != null) {
        // 会话被踢出了
        try {
            subject.logout();
        } catch (Exception e) {
            // ignore
        }
        saveRequest(request);
        WebUtils.issueRedirect(request, response, kickoutUrl);
        return false;
    }
    
    return true;
}
```

### 2.5 测试方法

1. 设置 `maxSession=2`
2. 使用3个不同的浏览器（如IE、Chrome、Firefox）
3. 分别访问应用进行登录
4. 刷新第一个浏览器，将会被强制退出

## 三、注意事项与优化建议

### 3.1 登录次数限制注意事项

1. **集群环境**：AtomicInteger只能保证单节点并发，集群环境下可能出现超过限制次数的情况
2. **缓存选择**：大量用户场景下，考虑将数据持久化到数据库或其他持久化缓存中
3. **锁定时间**：根据业务需求合理设置 `timeToIdleSeconds` 参数

### 3.2 并发登录控制注意事项

1. **并发控制**：当前实现没有同步控制，建议根据用户名获取锁来控制，减少锁的粒度
2. **缓存策略**：用户量大时考虑持久化用户-会话关系到数据库或分布式缓存
3. **会话清理**：需要定期清理过期的会话信息，避免缓存数据过多

### 3.3 性能优化建议

1. **缓存配置优化**：根据实际用户量调整缓存大小和过期策略
2. **异步处理**：对于踢出操作可以考虑异步处理，提高响应速度
3. **监控告警**：添加相关监控指标，如登录失败次数、并发登录数等

## 四、扩展功能

### 4.1 后台管理功能

可以参考开源项目实现后台踢出用户的功能：
- 在线用户管理
- 手动踢出指定用户
- 查看用户登录历史
- 设置用户登录限制策略

### 4.2 与Spring Security对比

Spring Security直接提供了相应的并发控制功能，而Shiro需要自己实现。但Shiro的实现更加灵活，可以根据具体业务需求进行定制。

## 总结

通过以上两种安全控制机制的实现，可以有效提升系统的安全性：

1. **登录次数限制**有效防止了暴力破解攻击
2. **并发登录控制**保证了账户的安全使用，防止账户被多人同时使用

这两种机制结合使用，能够为基于Shiro的应用提供全面的登录安全保护。在实际项目中，可以根据具体的业务需求和技术架构选择合适的实现方案。