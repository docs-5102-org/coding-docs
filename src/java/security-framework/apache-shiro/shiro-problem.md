---
title: Apache Shiro 常见问题
category:
  - Java 安全认证框架
tag:
  - Shiro
---

# Shiro 常见问题解决方案

## 1. 去掉登录时 URL 中的 JSESSIONID

### 问题描述
使用 Apache Shiro 进行用户认证时，登录后的 URL 会自动添加 JSESSIONID 参数，例如：
```
http://localhost:8080/app/dashboard;JSESSIONID=ABC123XYZ
```

这可能会导致以下问题：
- URL 不够简洁美观
- 可能暴露会话信息
- 在某些场景下影响用户体验

### 解决方案

#### 方法一：自定义 ShiroHttpServletResponse

通过继承 `ShiroHttpServletResponse` 并重写 `toEncoded` 方法来去掉 JSESSIONID：

```java
public class MyShiroHttpServletResponse extends ShiroHttpServletResponse {
    
    public MyShiroHttpServletResponse(HttpServletResponse wrapped, 
                                    ServletContext context, 
                                    ShiroHttpServletRequest request) {
        super(wrapped, context, request);
    }
    
    @Override
    protected String toEncoded(String url, String sessionId) {
        if ((url == null) || (sessionId == null)) {
            return (url);
        }
        
        String path = url;
        String query = "";
        String anchor = "";
        
        int question = url.indexOf('?');
        if (question >= 0) {
            path = url.substring(0, question);
            query = url.substring(question);
        }
        
        int pound = path.indexOf('#');
        if (pound >= 0) {
            anchor = path.substring(pound);
            path = path.substring(0, pound);
        }
        
        StringBuilder sb = new StringBuilder(path);
        // 注释掉添加 JSESSIONID 的代码
        // if (sb.length() > 0) {
        //     sb.append(";");
        //     sb.append(DEFAULT_SESSION_ID_PARAMETER_NAME);
        //     sb.append("=");
        //     sb.append(sessionId);
        // }
        sb.append(anchor);
        sb.append(query);
        return (sb.toString());
    }
}
```

#### 方法二：自定义 ShiroFilterFactoryBean

创建自定义的 `ShiroFilterFactoryBean` 来使用新的响应包装器：

```java
public class MyShiroFilterFactoryBean extends ShiroFilterFactoryBean {
    
    @Override
    public Class getObjectType() {
        return MySpringShiroFilter.class;
    }
    
    @Override
    protected AbstractShiroFilter createInstance() throws Exception {
        SecurityManager securityManager = getSecurityManager();
        if (securityManager == null) {
            String msg = "SecurityManager property must be set.";
            throw new BeanInitializationException(msg);
        }
        
        if (!(securityManager instanceof WebSecurityManager)) {
            String msg = "The security manager does not implement the WebSecurityManager interface.";
            throw new BeanInitializationException(msg);
        }
        
        FilterChainManager manager = createFilterChainManager();
        PathMatchingFilterChainResolver chainResolver = new PathMatchingFilterChainResolver();
        chainResolver.setFilterChainManager(manager);
        
        return new MySpringShiroFilter((WebSecurityManager) securityManager, chainResolver);
    }
    
    private static final class MySpringShiroFilter extends AbstractShiroFilter {
        
        protected MySpringShiroFilter(WebSecurityManager webSecurityManager, 
                                    FilterChainResolver resolver) {
            super();
            if (webSecurityManager == null) {
                throw new IllegalArgumentException("WebSecurityManager property cannot be null.");
            }
            setSecurityManager(webSecurityManager);
            if (resolver != null) {
                setFilterChainResolver(resolver);
            }
        }
        
        @Override
        protected ServletResponse wrapServletResponse(HttpServletResponse orig, 
                                                    ShiroHttpServletRequest request) {
            return new MyShiroHttpServletResponse(orig, getServletContext(), request);
        }
    }
}
```

#### 配置修改

在 Spring 配置文件中替换原有的 `ShiroFilterFactoryBean`：

```xml
<bean id="shiroFilter" class="com.yourpackage.util.shiro.MyShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager"/>
    <property name="loginUrl" value="/loginform"/>
    <property name="successUrl" value="/"/>
    <property name="unauthorizedUrl" value="/unauthed"/>
    <!-- 其他配置... -->
</bean>
```

或者使用 Java 配置：

```java
@Bean
public MyShiroFilterFactoryBean shiroFilter() {
    MyShiroFilterFactoryBean shiroFilter = new MyShiroFilterFactoryBean();
    shiroFilter.setSecurityManager(securityManager());
    shiroFilter.setLoginUrl("/loginform");
    shiroFilter.setSuccessUrl("/");
    shiroFilter.setUnauthorizedUrl("/unauthed");
    // 其他配置...
    return shiroFilter;
}
```

## 2. RememberMe 功能配置后不生效

### 问题描述

设置了 `rememberMe` 功能后，重新打开浏览器进入网站仍然需要输入用户名和密码登录。

### 问题分析

#### Shiro 对 Cookie 的处理
- Shiro 设置 `rememberMe=true` 后会生成一个名为 `rememberMe` 的 cookie
- Cookie 值是对用户 Principal 进行序列化后再 Base64 编码的结果
- 该 cookie 会在调用 `subject.logout()` 时自动清除

#### Shiro 的安全考量
Shiro 认为 `rememberMe` 不等同于已经完全登录，这是出于安全考虑：
- `rememberMe=true` 的用户被视为 `user` 级别，而不是 `authc` 级别
- 一般的路径拦截配置 `/** = authc` 要求完全认证，`rememberMe` 用户无法访问
- 官方建议：非敏感部分用 `user` 拦截，敏感部分仍需要用户重新登录

### 解决方案

#### 方案一：修改拦截配置（简单但不推荐）

```ini
# 将拦截级别从 authc 改为 user
/** = user
```

**问题**：
- 重新进入时 session 为空，页面可能异常
- 不适用于严格的业务系统

#### 方案二：自定义 FormAuthenticationFilter（推荐）

**前提条件**：
- 已实现自定义 Realm
- 使用用户名密码认证方式
- Principal 为 username（使用 SimpleAuthenticationInfo）

**步骤1：创建自定义过滤器**

```java
package com.example.shiro;

import javax.annotation.Resource;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import org.apache.shiro.session.Session;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.filter.authc.FormAuthenticationFilter;
import com.example.service.UserService;

public class RememberAuthenticationFilter extends FormAuthenticationFilter {
    
    @Resource
    private UserService userService;
    
    /**
     * 决定是否允许用户访问的核心方法
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) {
        Subject subject = getSubject(request, response);
        
        // 如果用户未认证但被记住了（rememberMe=true）
        if (!subject.isAuthenticated() && subject.isRemembered()) {
            
            // 检查session是否为空
            Session session = subject.getSession(true);
            
            // 检查关键session属性是否存在
            if (session.getAttribute("userId") == null) {
                // session为空时才初始化，避免每次都初始化影响性能
                
                // 获取用户名（基于前面的前提条件）
                String username = subject.getPrincipal().toString();
                
                // 初始化用户上下文（设置session等）
                userService.initUserContext(username, subject);
            }
        }
        
        // 兼容rememberMe和authenticated两种情况
        return subject.isAuthenticated() || subject.isRemembered();
    }
}
```

**步骤2：配置使用新的认证过滤器**

Spring 配置方式：
```xml
<!-- 整合了rememberMe功能的filter -->
<bean id="rememberAuthFilter" class="com.example.shiro.RememberAuthenticationFilter" />

<!-- 将原来的 /** = authc 替换为 rememberAuthFilter -->
<!-- ... -->
/** = rememberAuthFilter
```

INI 配置方式：
```ini
rememberAuthFilter = com.example.shiro.RememberAuthenticationFilter

# 将原来的 /** = authc 替换为 rememberAuthFilter
/** = rememberAuthFilter
```

### 使用示例

登录时设置 rememberMe：

```java
UsernamePasswordToken token = new UsernamePasswordToken(username, password);

// 根据用户选择设置rememberMe
if (loginForm.getRememberMe() != null && "Y".equals(loginForm.getRememberMe())) {
    token.setRememberMe(true);
}

subject.login(token);
```

### 安全风险警告

⚠️ **重要安全提醒**：

RememberMe 功能存在安全风险：
- Cookie 值可能被复制到其他浏览器使用
- 即使使用高强度加密，仍存在被伪造的风险
- 在过期时间内都有被伪造登录的可能

**建议使用场景**：
- ✅ 非敏感系统（如社交媒体、内容浏览类网站）
- ❌ 严格的业务系统（如金融、支付系统）

对于敏感系统，建议：
- 关键操作仍要求用户重新登录
- 设置较短的过期时间
- 结合其他安全措施（如IP限制、设备指纹等）

## 3. 其他常见问题

### Session 超时配置

```ini
# 设置session超时时间（毫秒）
sessionManager.globalSessionTimeout = 1800000
```

### 密码加密配置

```java
// 在Realm中配置密码加密
public class UserRealm extends AuthorizingRealm {
    
    public UserRealm() {
        // 设置密码匹配器
        setCredentialsMatcher(new HashedCredentialsMatcher("SHA-256"));
    }
    
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) {
        // 获取用户信息
        String username = (String) token.getPrincipal();
        User user = userService.findByUsername(username);
        
        if (user != null) {
            // 返回加密后的密码和盐值
            return new SimpleAuthenticationInfo(
                username, 
                user.getPassword(),  // 数据库中的加密密码
                ByteSource.Util.bytes(user.getSalt()),  // 盐值
                getName()
            );
        }
        return null;
    }
}
```

### 权限控制配置

```ini
# URL权限控制
/login = anon
/logout = logout
/admin/** = authc, roles[admin]
/user/** = authc, perms["user:read"]
/** = user
```


## 总结

通过自定义 `ShiroHttpServletResponse` 和 `ShiroFilterFactoryBean`，可以有效解决 URL 中出现 JSESSIONID 的问题。这种方法不会影响 Shiro 的核心功能，同时提供了更好的用户体验。在实施时需要注意版本兼容性和充分的测试验证。