---
title: Shiro 前后台登录接口的实现方案
category:
  - Java 安全认证框架
tag:
  - Shiro
---

# Shiro 前后台登录接口的实现方案

## 目录

[[toc]]

## 概述

在企业级Web应用开发中，通常需要同时支持前台用户登录和后台管理员登录。Apache Shiro作为一个强大的安全框架，提供了灵活的认证和授权机制。本文档详细介绍如何基于Shiro实现前后台分离的登录功能。

## 技术架构

- **容器框架**: Spring
- **持久层**: Mybatis  
- **控制层**: SpringMVC
- **安全框架**: Apache Shiro
- **模板引擎**: Thymeleaf/JSP

## 核心设计思路

### 问题分析

Shiro默认的`ModularRealmAuthenticator`使用List循环验证所有Realm，无法区分前台和后台应该使用哪个Realm进行验证。为了解决这个问题，需要自定义认证器来根据登录类型选择对应的Realm。

### 解决方案

1. **自定义认证器**: 继承`ModularRealmAuthenticator`，使用Map存储不同类型的Realm
2. **自定义Token**: 扩展`UsernamePasswordToken`，增加登录类型标识
3. **分离Realm**: 为前台和后台创建独立的Realm实现

## 详细实现

### 1. Spring配置

```xml
<!-- 自定义认证器 -->
<bean id="defineModularRealmAuthenticator" 
      class="com.example.shiro.authenticator.DefineModularRealmAuthenticator">
    <property name="defineRealms">
        <map>
            <entry key="customerRealm" value-ref="customerRealm" />
            <entry key="adminRealm" value-ref="adminRealm" />
        </map>
    </property>
</bean>

<!-- 前端用户认证Realm -->
<bean id="customerRealm" class="com.example.shiro.realm.CustomerRealm">
    <property name="credentialsMatcher" ref="credentialsMatcher" />
    <property name="customerService" ref="customerService" />
</bean>

<!-- 后台管理员认证Realm -->
<bean id="adminRealm" class="com.example.shiro.realm.AdminRealm">
    <property name="credentialsMatcher" ref="credentialsMatcher" />
    <property name="adminService" ref="adminService" />
</bean>

<!-- 密码匹配器 -->
<bean id="credentialsMatcher" class="com.example.shiro.credentials.RetryLimitHashedCredentialsMatcher">
    <constructor-arg ref="cacheManager"/>
    <property name="hashAlgorithmName" value="md5"/>
    <property name="hashIterations" value="2"/>
    <property name="storedCredentialsHexEncoded" value="true"/>
</bean>

<!-- 安全管理器 -->
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <property name="authenticator" ref="defineModularRealmAuthenticator"/>
    <property name="realms">
        <list>
            <ref bean="customerRealm"/>
            <ref bean="adminRealm"/>
        </list>
    </property>
    <property name="cacheManager" ref="cacheManager"/>
</bean>
```

### 2. 自定义认证Token

```java
package com.example.shiro.token;

import org.apache.shiro.authc.UsernamePasswordToken;

/**
 * 扩展的认证Token，支持验证码和登录类型区分
 */
public class CaptchaAuthenticationToken extends UsernamePasswordToken {
    
    private String captcha;
    private String loginType;
    
    public CaptchaAuthenticationToken() {
        super();
    }
    
    public CaptchaAuthenticationToken(String username, String password, 
                                    boolean rememberMe, String host, 
                                    String captcha, String loginType) {
        super(username, password, rememberMe, host);
        this.captcha = captcha;
        this.loginType = loginType;
    }
    
    // Getters and Setters
    public String getCaptcha() {
        return captcha;
    }
    
    public void setCaptcha(String captcha) {
        this.captcha = captcha;
    }
    
    public String getLoginType() {
        return loginType;
    }
    
    public void setLoginType(String loginType) {
        this.loginType = loginType;
    }
}
```

### 3. 登录类型枚举

```java
package com.example.enums;

/**
 * 登录类型枚举
 */
public enum LoginType {
    CUSTOMER("customer", "前台用户"),
    ADMIN("admin", "后台管理员");
    
    private final String code;
    private final String desc;
    
    LoginType(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getDesc() {
        return desc;
    }
    
    @Override
    public String toString() {
        return this.code;
    }
}
```

### 4. 自定义认证器

```java
package com.example.shiro.authenticator;

import java.util.Map;
import org.apache.commons.lang3.StringUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.UnknownAccountException;
import org.apache.shiro.authc.pam.ModularRealmAuthenticator;
import org.apache.shiro.authc.pam.UnsupportedTokenException;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.util.CollectionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.enums.LoginType;
import com.example.exception.CaptchaException;
import com.example.shiro.token.CaptchaAuthenticationToken;

/**
 * 自定义认证器，支持前后台分离认证
 */
public class DefineModularRealmAuthenticator extends ModularRealmAuthenticator {
    
    private static final Logger logger = LoggerFactory.getLogger(DefineModularRealmAuthenticator.class);
    
    private Map<String, Object> defineRealms;
    
    @Override
    protected AuthenticationInfo doAuthenticate(AuthenticationToken authenticationToken) 
            throws AuthenticationException {
        assertRealmsConfigured();
        
        CaptchaAuthenticationToken token = (CaptchaAuthenticationToken) authenticationToken;
        String loginType = token.getLoginType();
        
        if (StringUtils.isBlank(loginType)) {
            throw new AuthenticationException("登录类型不能为空");
        }
        
        Realm realm = null;
        
        // 根据登录类型选择对应的Realm
        switch (loginType) {
            case "customer":
                realm = (Realm) defineRealms.get("customerRealm");
                break;
            case "admin":
                realm = (Realm) defineRealms.get("adminRealm");
                break;
            default:
                throw new AuthenticationException("未知的登录类型: " + loginType);
        }
        
        if (realm == null) {
            throw new AuthenticationException("找不到对应的认证Realm");
        }
        
        return doSingleRealmAuthentication(realm, authenticationToken);
    }
    
    @Override
    protected AuthenticationInfo doSingleRealmAuthentication(Realm realm, 
                                                           AuthenticationToken token) {
        if (!realm.supports(token)) {
            String msg = String.format("Realm [%s] 不支持认证Token [%s]", 
                                     realm.getClass().getName(), 
                                     token.getClass().getName());
            throw new UnsupportedTokenException(msg);
        }
        
        AuthenticationInfo info = null;
        try {
            info = realm.getAuthenticationInfo(token);
            if (info == null) {
                String msg = String.format("Realm [%s] 无法找到Token [%s] 对应的账户信息", 
                                         realm.getClass().getName(), token);
                throw new UnknownAccountException(msg);
            }
        } catch (CaptchaException | AuthenticationException e) {
            throw e;
        } catch (Throwable throwable) {
            if (logger.isDebugEnabled()) {
                logger.debug("Realm [{}] 认证过程中发生异常", realm.getClass().getName(), throwable);
            }
            throw new AuthenticationException("认证过程发生异常", throwable);
        }
        
        return info;
    }
    
    @Override
    protected void assertRealmsConfigured() throws IllegalStateException {
        defineRealms = getDefineRealms();
        if (CollectionUtils.isEmpty(defineRealms)) {
            throw new IllegalStateException("配置错误：没有配置任何Realm，至少需要配置一个Realm来执行认证");
        }
    }
    
    // Getters and Setters
    public Map<String, Object> getDefineRealms() {
        return defineRealms;
    }
    
    public void setDefineRealms(Map<String, Object> defineRealms) {
        this.defineRealms = defineRealms;
    }
}
```

### 5. 前台用户Realm实现

```java
package com.example.shiro.realm;

import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.entity.Customer;
import com.example.service.CustomerService;
import com.example.shiro.token.CaptchaAuthenticationToken;

/**
 * 前台用户认证Realm
 */
public class CustomerRealm extends AuthorizingRealm {
    
    @Autowired
    private CustomerService customerService;
    
    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof CaptchaAuthenticationToken;
    }
    
    /**
     * 认证信息
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        
        CaptchaAuthenticationToken captchaToken = (CaptchaAuthenticationToken) token;
        String username = captchaToken.getUsername();
        
        if (username == null) {
            throw new AccountException("用户名不能为空");
        }
        
        // 验证验证码
        validateCaptcha(captchaToken);
        
        // 查询用户信息
        Customer customer = customerService.findByUsername(username);
        if (customer == null) {
            throw new UnknownAccountException("用户名或密码错误");
        }
        
        // 检查账户状态
        if (!customer.isEnabled()) {
            throw new DisabledAccountException("账户已被禁用");
        }
        
        // 返回认证信息
        SimpleAuthenticationInfo authInfo = new SimpleAuthenticationInfo(
            customer,
            customer.getPassword(),
            ByteSource.Util.bytes(customer.getSalt()),
            getName()
        );
        
        return authInfo;
    }
    
    /**
     * 授权信息
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        Customer customer = (Customer) getAvailablePrincipal(principals);
        SimpleAuthorizationInfo authInfo = new SimpleAuthorizationInfo();
        
        // 添加用户角色和权限
        authInfo.addRoles(customerService.findRoles(customer.getId()));
        authInfo.addStringPermissions(customerService.findPermissions(customer.getId()));
        
        return authInfo;
    }
    
    /**
     * 验证码校验
     */
    private void validateCaptcha(CaptchaAuthenticationToken token) {
        String captcha = token.getCaptcha();
        // 实现验证码校验逻辑
        // 可以从Session或Redis中获取正确的验证码进行比较
        if (!isValidCaptcha(captcha)) {
            throw new AuthenticationException("验证码错误");
        }
    }
    
    private boolean isValidCaptcha(String captcha) {
        // 验证码校验逻辑实现
        return true;
    }
}
```

### 6. 后台管理员Realm实现

```java
package com.example.shiro.realm;

import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.ByteSource;
import org.springframework.beans.factory.annotation.Autowired;

import com.example.entity.Admin;
import com.example.service.AdminService;
import com.example.shiro.token.CaptchaAuthenticationToken;

/**
 * 后台管理员认证Realm
 */
public class AdminRealm extends AuthorizingRealm {
    
    @Autowired
    private AdminService adminService;
    
    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof CaptchaAuthenticationToken;
    }
    
    /**
     * 认证信息
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        
        CaptchaAuthenticationToken captchaToken = (CaptchaAuthenticationToken) token;
        String username = captchaToken.getUsername();
        
        if (username == null) {
            throw new AccountException("用户名不能为空");
        }
        
        // 验证验证码
        validateCaptcha(captchaToken);
        
        // 查询管理员信息
        Admin admin = adminService.findByUsername(username);
        if (admin == null) {
            throw new UnknownAccountException("用户名或密码错误");
        }
        
        // 检查账户状态
        if (!admin.isEnabled()) {
            throw new DisabledAccountException("账户已被禁用");
        }
        
        // 检查是否为超级管理员或有后台访问权限
        if (!admin.hasBackendAccess()) {
            throw new AuthenticationException("没有后台访问权限");
        }
        
        // 返回认证信息
        SimpleAuthenticationInfo authInfo = new SimpleAuthenticationInfo(
            admin,
            admin.getPassword(),
            ByteSource.Util.bytes(admin.getSalt()),
            getName()
        );
        
        return authInfo;
    }
    
    /**
     * 授权信息
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        Admin admin = (Admin) getAvailablePrincipal(principals);
        SimpleAuthorizationInfo authInfo = new SimpleAuthorizationInfo();
        
        // 添加管理员角色和权限
        authInfo.addRoles(adminService.findRoles(admin.getId()));
        authInfo.addStringPermissions(adminService.findPermissions(admin.getId()));
        
        return authInfo;
    }
    
    /**
     * 验证码校验
     */
    private void validateCaptcha(CaptchaAuthenticationToken token) {
        String captcha = token.getCaptcha();
        if (!isValidCaptcha(captcha)) {
            throw new AuthenticationException("验证码错误");
        }
    }
    
    private boolean isValidCaptcha(String captcha) {
        // 验证码校验逻辑实现
        return true;
    }
}
```

### 7. Controller实现

```java
package com.example.controller;

import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.subject.Subject;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import com.example.enums.LoginType;
import com.example.shiro.token.CaptchaAuthenticationToken;
import com.example.vo.LoginRequest;
import com.example.vo.Result;

/**
 * 登录控制器
 */
@Controller
@RequestMapping("/auth")
public class AuthController {
    
    /**
     * 前台用户登录
     */
    @PostMapping("/customer/login")
    @ResponseBody
    public Result customerLogin(@RequestBody LoginRequest loginRequest) {
        return doLogin(loginRequest, LoginType.CUSTOMER.toString());
    }
    
    /**
     * 后台管理员登录
     */
    @PostMapping("/admin/login")
    @ResponseBody
    public Result adminLogin(@RequestBody LoginRequest loginRequest) {
        return doLogin(loginRequest, LoginType.ADMIN.toString());
    }
    
    /**
     * 执行登录
     */
    private Result doLogin(LoginRequest loginRequest, String loginType) {
        try {
            Subject subject = SecurityUtils.getSubject();
            
            CaptchaAuthenticationToken token = new CaptchaAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword(),
                loginRequest.isRememberMe(),
                getClientIp(),
                loginRequest.getCaptcha(),
                loginType
            );
            
            subject.login(token);
            
            return Result.success("登录成功");
            
        } catch (AuthenticationException e) {
            return Result.error(e.getMessage());
        } catch (Exception e) {
            return Result.error("登录失败");
        }
    }
    
    /**
     * 登出
     */
    @PostMapping("/logout")
    @ResponseBody
    public Result logout() {
        try {
            Subject subject = SecurityUtils.getSubject();
            subject.logout();
            return Result.success("退出成功");
        } catch (Exception e) {
            return Result.error("退出失败");
        }
    }
    
    private String getClientIp() {
        // 获取客户端IP的实现
        return "127.0.0.1";
    }
}
```

### 8. 登录请求VO

```java
package com.example.vo;

import javax.validation.constraints.NotBlank;

/**
 * 登录请求参数
 */
public class LoginRequest {
    
    @NotBlank(message = "用户名不能为空")
    private String username;
    
    @NotBlank(message = "密码不能为空")
    private String password;
    
    @NotBlank(message = "验证码不能为空")
    private String captcha;
    
    private boolean rememberMe = false;
    
    // Getters and Setters
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public String getCaptcha() {
        return captcha;
    }
    
    public void setCaptcha(String captcha) {
        this.captcha = captcha;
    }
    
    public boolean isRememberMe() {
        return rememberMe;
    }
    
    public void setRememberMe(boolean rememberMe) {
        this.rememberMe = rememberMe;
    }
}
```

## 优化建议

### 1. 安全性增强

- **密码加密**: 使用BCrypt或SHA-256等强哈希算法
- **防暴力破解**: 实现登录失败次数限制
- **会话管理**: 配置合理的会话超时时间
- **CSRF防护**: 启用CSRF保护机制

### 2. 性能优化

- **缓存集成**: 使用Redis缓存用户认证信息
- **数据库连接池**: 优化数据库连接配置
- **异步日志**: 使用异步方式记录安全日志

### 3. 监控和日志

```java
// 登录成功日志
logger.info("用户登录成功 - 用户名: {}, IP: {}, 登录类型: {}", 
           username, clientIp, loginType);

// 登录失败日志
logger.warn("用户登录失败 - 用户名: {}, IP: {}, 失败原因: {}", 
           username, clientIp, exception.getMessage());
```

### 4. 异常处理

创建统一的异常处理器：

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(AuthenticationException.class)
    @ResponseBody
    public Result handleAuthenticationException(AuthenticationException e) {
        return Result.error("认证失败: " + e.getMessage());
    }
    
    @ExceptionHandler(AuthorizationException.class)
    @ResponseBody
    public Result handleAuthorizationException(AuthorizationException e) {
        return Result.error("权限不足: " + e.getMessage());
    }
}
```

## 使用示例

### 前端调用示例

```javascript
// 前台用户登录
fetch('/auth/customer/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        username: 'customer@example.com',
        password: 'password123',
        captcha: 'ABCD',
        rememberMe: true
    })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log('登录成功');
        // 跳转到用户首页
        window.location.href = '/customer/dashboard';
    } else {
        console.error('登录失败:', data.message);
    }
});

// 后台管理员登录
fetch('/auth/admin/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        username: 'admin',
        password: 'admin123',
        captcha: 'EFGH',
        rememberMe: false
    })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        console.log('管理员登录成功');
        // 跳转到管理后台
        window.location.href = '/admin/dashboard';
    } else {
        console.error('登录失败:', data.message);
    }
});
```

## 总结

本方案通过自定义认证器和Token的方式，成功实现了Shiro框架下前后台分离的登录功能。主要优势包括：

1. **清晰的职责分离**: 前台和后台使用不同的Realm，各自独立管理
2. **灵活的扩展性**: 可以轻松添加新的登录类型
3. **完整的安全机制**: 支持验证码、密码加密、会话管理等
4. **良好的可维护性**: 代码结构清晰，易于理解和维护

通过这种设计，可以为不同类型的用户提供专门的认证逻辑，同时保持系统的安全性和可扩展性。