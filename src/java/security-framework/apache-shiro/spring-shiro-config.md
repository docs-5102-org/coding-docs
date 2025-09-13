---
title: Spring Shiro 配置指南
category:
  - Java 安全框架
  - Spring
tag:
  - Shiro
---

# Spring Shiro 配置指南

## 一、Shiro 简介

Apache Shiro 是一个强大而灵活的开源安全框架，主要用来处理身份认证、授权、企业会话管理和加密。

### 主要功能

- 用户验证
- 用户执行访问权限控制
- 在任何环境下使用 Session API（包括 CS 程序）
- 支持多数据源（如同时使用 Oracle、MySQL）
- 单点登录（SSO）支持
- Remember Me 服务

### 与 Spring Security 对比

- **Shiro**: 灵活性强，易学易扩展，不仅可以在 Web 中使用，可以工作在任何环境中
- **Spring Security**: 灵活性较差，比较难懂，但与 Spring 整合性好

## 二、环境准备

确保项目中包含以下依赖：
- Spring Framework
- Apache Shiro
- Spring-Shiro 整合包

## 三、Web.xml 配置

在 `web.xml` 中添加 Shiro 过滤器配置：

```xml
<!-- Shiro Filter -->
<filter>
    <filter-name>shiroFilter</filter-name>
    <filter-class>
        org.springframework.web.filter.DelegatingFilterProxy
    </filter-class>
</filter>
<filter-mapping>
    <filter-name>shiroFilter</filter-name>
    <url-pattern>/*</url-pattern>
</filter-mapping>
```

## 四、Spring 配置文件

在 Spring 的 `applicationContext.xml` 中添加 Shiro 相关配置：

### 1. Shiro 过滤器配置

```xml
<!-- Shiro Filter -->
<bean id="shiroFilter" class="org.apache.shiro.spring.web.ShiroFilterFactoryBean">
    <property name="securityManager" ref="securityManager" />
    <property name="loginUrl" value="/login" />
    <property name="successUrl" value="/user/list" />
    <property name="unauthorizedUrl" value="/login" />
    <property name="filterChainDefinitions">
        <value>
            /login = anon
            /user/** = authc
            /role/edit/* = perms[role:edit]
            /role/save = perms[role:edit]
            /role/list = perms[role:view]
            /** = authc
        </value>
    </property>
</bean>
```

### 2. 安全管理器配置

```xml
<!-- SecurityManager 是 Shiro 的核心，初始化时协调各个模块运行 -->
<bean id="securityManager" class="org.apache.shiro.web.mgt.DefaultWebSecurityManager">
    <!-- 单个 realm 使用 realm，如果有多个 realm，使用 realms 属性代替 -->
    <property name="realm" ref="myRealm" />
    <property name="cacheManager" ref="shiroEhcacheManager" />
</bean>
```

### 3. 自定义 Realm 配置

```xml
<!-- Realm 配置，realm 是 shiro 的桥梁，主要用来判断 subject 是否可以登录及权限等 -->
<bean id="myRealm" class="com.example.MyRealm" />
```

### 4. 缓存管理器配置（可选）

```xml
<!-- 用户授权/认证信息 Cache，采用 EhCache 缓存 -->
<bean id="shiroEhcacheManager" class="org.apache.shiro.cache.ehcache.EhCacheManager">
    <property name="cacheManagerConfigFile" value="classpath:ehcache-shiro.xml"/>
</bean>
```

## 五、自定义 Realm 实现

创建自定义 Realm 类，继承 `AuthorizingRealm` 并重写认证和授权方法：

```java
public class MyRealm extends AuthorizingRealm {

    private AccountManager accountManager;
    
    public void setAccountManager(AccountManager accountManager) {
        this.accountManager = accountManager;
    }

    /**
     * 授权方法，在配有缓存的情况下，只加载一次
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        String username = (String) principals.fromRealm(getName()).iterator().next();
        
        if (username != null) {
            User user = accountManager.get(username);
            if (user != null && user.getRoles() != null) {
                SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
                
                // 添加角色和权限
                for (SecurityRole role : user.getRoles()) {
                    info.addRole(role.getName());
                    info.addStringPermissions(role.getPermissionsAsString());
                }
                return info;
            }
        }
        return null;
    }

    /**
     * 登录认证
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) 
            throws AuthenticationException {
        
        UsernamePasswordToken token = (UsernamePasswordToken) authcToken;
        String userName = token.getUsername();
        
        if (userName != null && !"".equals(userName)) {
            User user = accountManager.login(token.getUsername(), 
                                           String.valueOf(token.getPassword()));
            
            if (user != null) {
                return new SimpleAuthenticationInfo(
                    user.getLoginName(), user.getPassword(), getName());
            }
        }
        return null;
    }
}
```

## 六、过滤器说明

Shiro 提供了多种内置过滤器：

| 过滤器名称 | 说明 | 示例 |
|------------|------|------|
| anon | 匿名访问，无需认证 | `/login/** = anon` |
| authc | 需要认证才能访问 | `/user/** = authc` |
| authcBasic | HTTP Basic 认证 | `/api/** = authcBasic` |
| logout | 登出过滤器 | `/logout = logout` |
| perms | 权限过滤器 | `/admin/** = perms[admin:view]` |
| roles | 角色过滤器 | `/manager/** = roles[manager]` |
| user | 用户过滤器（包括记住我） | `/profile/** = user` |
| ssl | SSL 过滤器 | `/secure/** = ssl` |
| rest | REST 风格权限过滤器 | `/api/user/** = rest[user]` |

### 过滤器使用规则

- **anon**: 可以匿名访问
- **authc**: 需要认证（登录）才能访问
- **perms**: 需要指定权限才能访问
- **roles**: 需要指定角色才能访问
- **user**: 需要已登录用户（包括记住我）才能访问

## 七、控制器实现

### 登录页面

```jsp
<%@ page language="java" pageEncoding="UTF-8"%>
<html>
<body>
    <form action="${pageContext.request.contextPath}/login" method="post">
        用户名：<input id="username" name="username" />
        密码：<input id="password" type="password" name="password" />
        记住我：<input type="checkbox" name="rememberMe" />
        <input type="submit" name="submit" value="登录"/>
    </form>
</body>
</html>
```

### Spring MVC 控制器

```java
@Controller("loginAction")
@RequestMapping("/login")
public class LoginAction {
    
    @RequestMapping("")
    public ModelAndView login(HttpServletRequest request,
                             HttpServletResponse response, 
                             String username, String password) {
        
        UsernamePasswordToken token = new UsernamePasswordToken(username, password);
        token.setRememberMe(false);
        
        Subject subject = SecurityUtils.getSubject();
        
        try {
            subject.login(token);
        } catch (UnknownAccountException ex) {
            // 用户名不存在
            ex.printStackTrace();
        } catch (IncorrectCredentialsException ex) {
            // 用户名密码不匹配
            ex.printStackTrace();
        } catch (AuthenticationException e) {
            // 其他登录错误
            e.printStackTrace();
        }

        // 验证是否成功登录
        if (subject.isAuthenticated()) {
            return new ModelAndView("/main/index.jsp");
        }
        
        return new ModelAndView("/login/login.jsp");
    }

    @RequestMapping("/logout")
    public void logout() {
        Subject subject = SecurityUtils.getSubject();
        subject.logout();
    }
}
```

## 八、权限控制在代码中的使用

### 在控制器中检查权限

```java
@RequestMapping("/admin/users")
public String adminUsers() {
    Subject subject = SecurityUtils.getSubject();
    
    // 检查是否有管理员角色
    if (subject.hasRole("admin")) {
        return "admin/users";
    }
    
    // 检查是否有特定权限
    if (subject.isPermitted("user:view")) {
        return "user/list";
    }
    
    throw new UnauthorizedException("无权限访问");
}
```

### 使用注解进行权限控制

```java
@RequiresRoles("admin")
@RequestMapping("/admin/delete")
public String deleteUser() {
    // 只有 admin 角色才能访问
    return "success";
}

@RequiresPermissions("user:edit")
@RequestMapping("/user/edit")
public String editUser() {
    // 只有具有 user:edit 权限才能访问
    return "user/edit";
}
```

## 九、最佳实践

1. **权限设计**: 采用资源:操作的格式，如 `user:create`、`user:update`、`user:delete`
2. **缓存配置**: 对于频繁的权限检查，建议配置缓存提高性能
3. **密码加密**: 生产环境中应对密码进行加密存储
4. **会话管理**: 根据需要配置会话超时和并发控制
5. **异常处理**: 统一处理认证和授权异常，提供友好的用户体验

## 十、常见问题

1. **过滤器顺序**: 确保过滤器链的顺序正确，一般从具体到通用
2. **URL 匹配**: 注意 URL 匹配规则，避免权限配置冲突
3. **缓存问题**: 权限变更后注意清除相关缓存
4. **会话共享**: 集群环境下需要考虑会话共享问题

通过以上配置，您就可以在 Spring 项目中成功集成 Apache Shiro 安全框架，实现完整的认证和授权功能。