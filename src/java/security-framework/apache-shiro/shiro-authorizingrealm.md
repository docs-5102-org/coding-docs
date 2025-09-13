---
title: Shiro AuthorizingRealm详解
category:
  - Java 安全认证框架
tag:
  - Shiro
---

# Shiro AuthorizingRealm详解

## 概述

Apache Shiro是一个功能强大且易于使用的Java安全框架，提供身份验证、授权、加密和会话管理功能。在Shiro的安全架构中，`AuthorizingRealm`是一个核心组件，它继承自`AuthenticatingRealm`，提供了完整的身份验证和权限授权功能。

## AuthorizingRealm的核心方法

### 1. doGetAuthenticationInfo() - 身份验证方法

`doGetAuthenticationInfo(AuthenticationToken token)`方法负责处理用户的登录验证，这是用户身份认证的核心逻辑。

**作用：**
- 验证用户的登录凭据（用户名/密码）
- 从数据源获取用户信息
- 返回认证信息供Shiro框架验证

**调用时机：**
当执行用户登录操作时会触发此方法：

```java
Subject subject = SecurityUtils.getSubject();
subject.login(token);  // 此时会调用doGetAuthenticationInfo方法
token.clear();
SysmanUser user = (SysmanUser) subject.getPrincipal();
```

### 2. doGetAuthorizationInfo() - 权限授权方法

`doGetAuthorizationInfo(PrincipalCollection principals)`方法负责获取用户的权限信息，实现细粒度的权限控制。

**作用：**
- 根据用户身份获取其拥有的权限
- 返回权限信息供Shiro进行权限判断
- 支持角色权限和字符串权限两种模式

**调用时机：**
当进行权限验证时会触发此方法：

```java
// 权限校验，判断是否包含权限
Subject subject = SecurityUtils.getSubject();
// 具体响应ShiroDbRealm.doGetAuthorizationInfo，判断是否包含此url的响应权限
boolean isPermitted = subject.isPermitted(url);
if(isPermitted == true) {
    result = new Result(true, "包含权限");
} else {
    result = new Result(false, "不包含权限");
}
```

## 两个方法的区别

| 方法 | doGetAuthenticationInfo | doGetAuthorizationInfo |
|------|------------------------|------------------------|
| **用途** | 身份验证（登录验证） | 权限验证（授权验证） |
| **触发时机** | 用户登录时 | 权限检查时 |
| **主要功能** | 验证用户名密码是否正确 | 获取用户的权限信息 |
| **返回值** | AuthenticationInfo | AuthorizationInfo |
| **调用频率** | 登录时调用一次 | 每次权限检查都可能调用 |

## 实际应用场景

### 登录验证流程
1. 用户提交登录表单
2. 系统创建AuthenticationToken
3. 调用`subject.login(token)`
4. Shiro框架调用`doGetAuthenticationInfo()`方法
5. 验证用户凭据并返回认证信息
6. 登录成功或失败

### 权限验证流程
1. 用户访问受保护的资源
2. 系统调用`subject.isPermitted(url)`
3. Shiro框架调用`doGetAuthorizationInfo()`方法
4. 获取用户权限信息
5. 判断是否有访问权限
6. 允许或拒绝访问

## 自定义AuthorizingRealm实现示例

```java
public class CustomAuthorizingRealm extends AuthorizingRealm {
    
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        // 获取用户标识
        String username = (String) principals.getPrimaryPrincipal();
        
        // 从数据库获取用户权限
        Set<String> permissions = getUserPermissions(username);
        Set<String> roles = getUserRoles(username);
        
        // 构建权限信息
        SimpleAuthorizationInfo authorizationInfo = new SimpleAuthorizationInfo();
        authorizationInfo.setStringPermissions(permissions);
        authorizationInfo.setRoles(roles);
        
        return authorizationInfo;
    }
    
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
            throws AuthenticationException {
        
        // 获取用户名和密码
        String username = (String) token.getPrincipal();
        String password = new String((char[]) token.getCredentials());
        
        // 从数据库查询用户
        User user = getUserFromDatabase(username);
        
        if (user == null) {
            throw new UnknownAccountException("用户不存在");
        }
        
        // 验证密码
        if (!password.equals(user.getPassword())) {
            throw new IncorrectCredentialsException("密码错误");
        }
        
        // 返回认证信息
        return new SimpleAuthenticationInfo(username, password, getName());
    }
}
```

## 最佳实践

### 1. 缓存优化
由于权限验证可能频繁调用，建议启用缓存：

```java
@Override
protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
    // 实现缓存逻辑，避免频繁查询数据库
}
```

### 2. 异常处理
在认证和授权方法中要妥善处理异常：

```java
@Override
protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
        throws AuthenticationException {
    try {
        // 认证逻辑
    } catch (Exception e) {
        throw new AuthenticationException("认证失败", e);
    }
}
```

### 3. 权限粒度控制
支持多种权限验证方式：

```java
// URL权限
subject.isPermitted("/admin/users");

// 功能权限
subject.isPermitted("user:create");

// 角色权限
subject.hasRole("admin");
```

## 注意事项

1. **方法调用时机**：`doGetAuthenticationInfo`在登录时调用，`doGetAuthorizationInfo`在权限检查时调用
2. **性能考虑**：权限信息获取可能频繁调用，建议使用缓存
3. **异常处理**：要正确抛出Shiro定义的异常类型
4. **线程安全**：Realm实例可能被多线程访问，注意线程安全
5. **权限设计**：合理设计权限模型，支持动态权限控制

通过正确理解和实现`AuthorizingRealm`的两个核心方法，可以构建出安全、高效的权限管理系统，实现细粒度的访问控制。