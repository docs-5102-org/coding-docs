---
title: Apache Shiro 入门教程
category:
  - Java 安全框架
tag:
  - Shiro
---

# Apache Shiro 入门教程

## 目录

[[toc]]

## Apache Shiro 简介

Apache Shiro 是一个功能强大且易于使用的 Java 安全框架，它执行身份验证、授权、加密和会话管理。相比其他安全框架（如 Spring Security），Shiro 的设计理念是简单易用，同时提供强大的安全功能。

### 主要特性

- **身份验证** - 验证用户身份，通常被称为用户"登录"
- **授权** - 访问控制的过程，决定"谁"能够访问"什么"
- **会话管理** - 在任何环境下管理特定于用户的会话，即使没有 Web 容器
- **加密** - 使用加密算法保护或隐藏数据防止被偷窥
- **支持多种数据源** - LDAP、JDBC、Active Directory 等
- **单点登录 (SSO)** 功能
- **"记住我"** 服务

### 为什么选择 Shiro

1. **易于使用** - 易于理解的 API，快速掌握
2. **全面性** - 涵盖应用安全的各个方面
3. **灵活性** - 可以在任何应用环境中工作
4. **Web 能力** - 支持 Web 应用安全
5. **可插拔** - Realm 实现允许连接如 LDAP 和 Active Directory 这样的数据源
6. **缓存支持** - Apache Shiro 对缓存有第一级的支持
7. **并发性** - Apache Shiro 利用它的并发特性来支持多线程应用程序
8. **测试** - 测试支持的存在来帮助您编写单元测试和集成测试
9. **"运行方式"** - 允许一个用户假设另一个用户的身份（如果允许）的功能

## 核心概念

### Subject (主体)

Subject 代表了当前"用户"，这个用户不一定是一个具体的人，与当前应用交互的任何东西都是 Subject，如网络爬虫、机器人等。所有 Subject 都绑定到 SecurityManager，与 Subject 的所有交互都会委托给 SecurityManager。

### SecurityManager (安全管理器)

SecurityManager 是 Shiro 架构的心脏，它就像是一个"保护伞"，协调其内部的各种安全组件形成一个完整的对象图。

### Realm (域)

Realm 充当了 Shiro 与应用安全数据间的"桥梁"或者"连接器"。它封装了数据源的连接细节，并在需要时将相关数据提供给 Shiro。

### 核心组件关系图

```
Subject (主体)
    |
    v
SecurityManager (安全管理器)
    |
    +-- Authenticator (认证器)
    |       |
    |       +-- AuthenticationStrategy (认证策略)
    |
    +-- Authorizer (授权器)
    |
    +-- SessionManager (会话管理器)
    |
    +-- CacheManager (缓存管理器)
    |
    +-- Realm (域)
            |
            +-- AccountRealm
            +-- JdbcRealm
            +-- LdapRealm
            +-- ... (自定义 Realm)
```

## 环境搭建

### 系统要求

- Java 11+ (Shiro 2.x)
- Java 8+ (Shiro 1.x)
- Maven 3.3+ 或 Gradle 4+

### Maven 依赖

```xml
<dependencies>
    <!-- Shiro 核心包 -->
    <dependency>
        <groupId>org.apache.shiro</groupId>
        <artifactId>shiro-core</artifactId>
        <version>2.0.5</version>
    </dependency>
    
    <!-- Web 支持 (可选) -->
    <dependency>
        <groupId>org.apache.shiro</groupId>
        <artifactId>shiro-web</artifactId>
        <version>2.0.5</version>
    </dependency>
    
    <!-- Spring Boot 集成 (可选) -->
    <dependency>
        <groupId>org.apache.shiro</groupId>
        <artifactId>shiro-spring-boot-starter</artifactId>
        <version>2.0.5</version>
    </dependency>
    
    <!-- 日志支持 -->
    <dependency>
        <groupId>org.slf4j</groupId>
        <artifactId>slf4j-simple</artifactId>
        <version>1.7.32</version>
    </dependency>
</dependencies>
```

### Gradle 依赖

```gradle
dependencies {
    implementation 'org.apache.shiro:shiro-core:2.0.5'
    implementation 'org.apache.shiro:shiro-web:2.0.5'
    implementation 'org.apache.shiro:shiro-spring-boot-starter:2.0.5'
    implementation 'org.slf4j:slf4j-simple:1.7.32'
}
```

## 快速开始

### 1. 创建 shiro.ini 配置文件

在 `src/main/resources` 目录下创建 `shiro.ini` 文件：

```ini
[users]
# 用户名=密码,角色1,角色2,...
root = secret, admin
guest = guest, guest
user1 = password1, user

[roles]
# 角色=权限1,权限2,...
admin = *
guest = read
user = read,write
```

### 2. 编写第一个 Shiro 应用

```java
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.config.IniSecurityManagerFactory;
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Tutorial {

    private static final transient Logger log = LoggerFactory.getLogger(Tutorial.class);

    public static void main(String[] args) {
        log.info("我的第一个Apache Shiro应用!");

        // 1. 加载INI配置
        IniSecurityManagerFactory factory = new IniSecurityManagerFactory("classpath:shiro.ini");

        // 2. 创建SecurityManager
        SecurityManager securityManager = factory.getInstance();

        // 3. 设置SecurityManager
        SecurityUtils.setSecurityManager(securityManager);

        // 4. 获取当前的用户对象Subject
        Subject currentUser = SecurityUtils.getSubject();

        // 5. 测试登录
        if (!currentUser.isAuthenticated()) {
            // 把用户名和密码封装为UsernamePasswordToken
            UsernamePasswordToken token = new UsernamePasswordToken("root", "secret");
            token.setRememberMe(true);
            try {
                currentUser.login(token);
            } catch (UnknownAccountException uae) {
                log.info("用户名不存在：" + token.getPrincipal());
            } catch (IncorrectCredentialsException ice) {
                log.info("密码错误：" + token.getPrincipal() + "对应的密码不正确");
            } catch (LockedAccountException lae) {
                log.info("用户被锁定：" + token.getPrincipal() + " 被锁定");
            } catch (AuthenticationException ae) {
                log.info("认证失败：" + ae.getMessage());
            }
        }

        log.info("用户 [" + currentUser.getPrincipal() + "] 登录成功");

        // 6. 测试角色
        if (currentUser.hasRole("admin")) {
            log.info("有admin角色");
        } else {
            log.info("没有admin角色");
        }

        // 7. 测试权限
        if (currentUser.isPermitted("lightsaber:*")) {
            log.info("有lightsaber:*权限");
        } else {
            log.info("没有lightsaber:*权限");
        }

        // 8. 退出
        currentUser.logout();

        System.exit(0);
    }
}
```

## 身份验证 (Authentication)

身份验证是验证用户身份的过程。在身份验证过程中，用户需要提交他们的身份和凭据给应用程序，应用程序验证这些信息以确保它们是正确的。

### 认证流程

1. 收集用户身份和凭据
2. 提交身份和凭据
3. 如果正确，允许访问，否则重新认证或阻止访问

### 自定义 Realm

```java
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;

import java.util.HashSet;
import java.util.Set;

public class MyRealm extends AuthorizingRealm {

    /**
     * 授权
     */
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        String username = (String) principals.getPrimaryPrincipal();
        
        // 从数据库或其他数据源获取用户权限和角色
        Set<String> roles = new HashSet<>();
        Set<String> permissions = new HashSet<>();
        
        if ("admin".equals(username)) {
            roles.add("admin");
            permissions.add("user:create");
            permissions.add("user:update");
            permissions.add("user:delete");
            permissions.add("user:view");
        } else if ("user".equals(username)) {
            roles.add("user");
            permissions.add("user:view");
        }
        
        SimpleAuthorizationInfo authorizationInfo = new SimpleAuthorizationInfo();
        authorizationInfo.setRoles(roles);
        authorizationInfo.setStringPermissions(permissions);
        
        return authorizationInfo;
    }

    /**
     * 认证
     */
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) throws AuthenticationException {
        String username = (String) token.getPrincipal();
        
        // 从数据库或其他数据源获取用户信息
        // 这里为了演示，使用硬编码
        String password = null;
        if ("admin".equals(username)) {
            password = "admin123";
        } else if ("user".equals(username)) {
            password = "user123";
        } else {
            throw new UnknownAccountException("用户不存在!");
        }
        
        return new SimpleAuthenticationInfo(username, password, getName());
    }
}
```

### 使用自定义 Realm

```ini
[main]
# 声明一个realm
myRealm = com.example.MyRealm

# 将realm设置到securityManager
securityManager.realms = $myRealm
```

## 授权 (Authorization)

授权，也叫访问控制，即在应用中控制谁能够访问哪些资源（如访问页面/编辑数据/页面操作等）。

### 授权方式

1. **编程式** - 通过写if/else授权代码块完成
2. **注解式** - 通过在执行的Java方法上放置相应的注解完成
3. **JSP/GSP标签** - 在JSP/GSP页面通过相应的标签完成

### 编程式授权

```java
Subject currentUser = SecurityUtils.getSubject();

if (currentUser.hasRole("admin")) {
    // 显示admin按钮
} else {
    // 不显示按钮
}

if (currentUser.isPermitted("user:create")) {
    // 创建用户
}

if (currentUser.isPermittedAll("user:view", "user:create")) {
    // 有查看和创建用户权限
}
```

### 注解式授权

```java
@RequiresAuthentication
public void updateAccount(Account userAccount) {
    // 该方法只有在当前用户登录时才能访问
}

@RequiresRoles("admin")
public void deleteUser(String userId) {
    // 该方法只有拥有admin角色的用户才能访问
}

@RequiresPermissions("user:create")
public User createUser(User user) {
    // 该方法只有拥有user:create权限的用户才能访问
    return user;
}
```

### 权限字符串通配符

Shiro 支持多级的权限控制，通过简单的通配符，用户可以实现灵活的权限控制。

```
用户管理权限：user:*
用户查看权限：user:view
用户创建权限：user:create
用户更新权限：user:update
用户删除权限：user:delete

多级权限：
user:view:1    (查看id为1的用户)
user:edit:1    (编辑id为1的用户)
user:*:1       (对id为1的用户拥有所有权限)
```

## 会话管理 (Session Management)

Shiro 提供了独特的会话管理功能，即使在非Web或EJB应用程序中也可以使用会话。

### 会话操作

```java
import org.apache.shiro.session.Session;

public class SessionExample {
    
    public void sessionOperations() {
        Subject currentUser = SecurityUtils.getSubject();
        Session session = currentUser.getSession();
        
        // 获取会话ID
        Serializable sessionId = session.getId();
        
        // 获取会话主机
        String host = session.getHost();
        
        // 获取/设置会话属性
        session.setAttribute("someKey", "someValue");
        String value = (String) session.getAttribute("someKey");
        
        // 获取会话创建时间和最后访问时间
        Date start = session.getStartTimestamp();
        Date timestamp = session.getLastAccessTime();
        
        // 获取会话超时时间
        session.getTimeout();
        
        // 设置会话超时时间
        session.setTimeout(30000); // 30秒
        
        // 使会话失效
        session.stop();
    }
}
```

### 会话监听器

```java
import org.apache.shiro.session.Session;
import org.apache.shiro.session.SessionListener;

public class MySessionListener implements SessionListener {

    @Override
    public void onStart(Session session) {
        System.out.println("会话创建：" + session.getId());
    }

    @Override
    public void onStop(Session session) {
        System.out.println("会话停止：" + session.getId());
    }

    @Override
    public void onExpiration(Session session) {
        System.out.println("会话过期：" + session.getId());
    }
}
```

## 加密服务 (Cryptography)

### 哈希算法

```java
import org.apache.shiro.crypto.hash.Md5Hash;
import org.apache.shiro.crypto.hash.Sha256Hash;

public class HashExample {
    
    public void hashPasswords() {
        String password = "myPassword";
        String salt = "mySalt";
        
        // MD5 哈希
        String md5Hash = new Md5Hash(password, salt, 1024).toHex();
        
        // SHA-256 哈希
        String sha256Hash = new Sha256Hash(password, salt, 1024).toHex();
        
        // 使用默认构造器
        Md5Hash hash = new Md5Hash(password);
        String hex = hash.toHex();
        String base64 = hash.toBase64();
    }
}
```

### 密码匹配器

```java
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;

public class CredentialsMatcherExample {
    
    public void setupCredentialsMatcher() {
        HashedCredentialsMatcher matcher = new HashedCredentialsMatcher();
        matcher.setHashAlgorithmName(Sha256Hash.ALGORITHM_NAME);
        matcher.setHashIterations(1024);
        matcher.setStoredCredentialsHexEncoded(true);
        
        // 在Realm中使用
        MyRealm realm = new MyRealm();
        realm.setCredentialsMatcher(matcher);
    }
}
```

## Web 集成

### 配置 web.xml

```xml
<web-app>
    <!-- Shiro Filter -->
    <filter>
        <filter-name>ShiroFilter</filter-name>
        <filter-class>org.apache.shiro.web.servlet.ShiroFilter</filter-class>
    </filter>
    
    <filter-mapping>
        <filter-name>ShiroFilter</filter-name>
        <url-pattern>/*</url-pattern>
        <dispatcher>REQUEST</dispatcher>
        <dispatcher>FORWARD</dispatcher>
        <dispatcher>INCLUDE</dispatcher>
        <dispatcher>ERROR</dispatcher>
    </filter-mapping>
    
    <!-- Shiro ContextListener -->
    <listener>
        <listener-class>org.apache.shiro.web.env.EnvironmentLoaderListener</listener-class>
    </listener>
    
    <!-- Shiro 配置 -->
    <context-param>
        <param-name>shiroConfigLocations</param-name>
        <param-value>classpath:shiro.ini</param-value>
    </context-param>
</web-app>
```

### Web 版 shiro.ini

```ini
[main]
# 配置SessionManager
sessionManager = org.apache.shiro.web.session.mgt.DefaultWebSessionManager
# 全局会话超时时间（单位：毫秒），默认30分钟
sessionManager.globalSessionTimeout = 1800000
securityManager.sessionManager = $sessionManager

# 配置记住我
rememberMeCookie = org.apache.shiro.web.servlet.SimpleCookie
rememberMeCookie.name = rememberMe
rememberMeCookie.httpOnly = true
rememberMeCookie.maxAge = 2592000
rememberMeManager = org.apache.shiro.web.mgt.CookieRememberMeManager
rememberMeManager.cookie = $rememberMeCookie
securityManager.rememberMeManager = $rememberMeManager

[users]
admin = admin123, admin
user = user123, user

[roles]
admin = *
user = user:*

[urls]
/login.jsp = anon
/login = anon
/logout = logout
/authenticated.jsp = authc
/admin/** = authc, roles[admin]
/user/** = authc, roles[user]
/** = user
```

### 过滤器说明

| 过滤器简称 | 对应的java类 |
|-----------|-------------|
| anon | AnonymousFilter |
| authc | FormAuthenticationFilter |
| authcBasic | BasicHttpAuthenticationFilter |
| perms | PermissionsAuthorizationFilter |
| port | PortFilter |
| rest | HttpMethodPermissionFilter |
| roles | RolesAuthorizationFilter |
| ssl | SslFilter |
| user | UserFilter |
| logout | LogoutFilter |

## Spring Boot 集成

### 添加依赖

```xml
<dependency>
    <groupId>org.apache.shiro</groupId>
    <artifactId>shiro-spring-boot-starter</artifactId>
    <version>2.0.5</version>
</dependency>
```

### 配置类

```java
import org.apache.shiro.mgt.SecurityManager;
import org.apache.shiro.spring.web.ShiroFilterFactoryBean;
import org.apache.shiro.web.mgt.DefaultWebSecurityManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.LinkedHashMap;
import java.util.Map;

@Configuration
public class ShiroConfig {

    @Bean
    public MyRealm myRealm() {
        return new MyRealm();
    }

    @Bean
    public SecurityManager securityManager() {
        DefaultWebSecurityManager securityManager = new DefaultWebSecurityManager();
        securityManager.setRealm(myRealm());
        return securityManager;
    }

    @Bean
    public ShiroFilterFactoryBean shiroFilterFactoryBean() {
        ShiroFilterFactoryBean shiroFilterFactoryBean = new ShiroFilterFactoryBean();
        shiroFilterFactoryBean.setSecurityManager(securityManager());
        
        // 设置登录页面
        shiroFilterFactoryBean.setLoginUrl("/login");
        // 设置登录成功后跳转的页面
        shiroFilterFactoryBean.setSuccessUrl("/index");
        // 设置未授权页面
        shiroFilterFactoryBean.setUnauthorizedUrl("/unauthorized");

        Map<String, String> filterChainDefinitionMap = new LinkedHashMap<>();
        filterChainDefinitionMap.put("/css/**", "anon");
        filterChainDefinitionMap.put("/js/**", "anon");
        filterChainDefinitionMap.put("/login", "anon");
        filterChainDefinitionMap.put("/logout", "logout");
        filterChainDefinitionMap.put("/admin/**", "authc,roles[admin]");
        filterChainDefinitionMap.put("/**", "authc");

        shiroFilterFactoryBean.setFilterChainDefinitionMap(filterChainDefinitionMap);
        return shiroFilterFactoryBean;
    }
}
```

### 控制器示例

```java
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.*;
import org.apache.shiro.subject.Subject;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    @GetMapping("/login")
    public String login() {
        return "login";
    }

    @PostMapping("/login")
    public String login(@RequestParam("username") String username,
                       @RequestParam("password") String password,
                       Model model) {
        Subject subject = SecurityUtils.getSubject();
        UsernamePasswordToken token = new UsernamePasswordToken(username, password);
        
        try {
            subject.login(token);
            return "redirect:/index";
        } catch (UnknownAccountException e) {
            model.addAttribute("error", "用户名不存在");
        } catch (IncorrectCredentialsException e) {
            model.addAttribute("error", "密码错误");
        } catch (AuthenticationException e) {
            model.addAttribute("error", "登录失败");
        }
        
        return "login";
    }

    @GetMapping("/index")
    public String index(Model model) {
        Subject subject = SecurityUtils.getSubject();
        model.addAttribute("username", subject.getPrincipal());
        return "index";
    }
}
```

## 常见问题

### 1. 如何实现"记住我"功能？

```java
UsernamePasswordToken token = new UsernamePasswordToken(username, password);
token.setRememberMe(true);
subject.login(token);
```

### 2. 如何自定义登录逻辑？

实现自定义的 AuthenticationToken 和 Realm：

```java
public class MyAuthenticationToken implements AuthenticationToken {
    private String username;
    private String password;
    private String captcha;
    
    // getter 和 setter 方法...
}
```

### 3. 如何处理并发登录？

可以通过实现 SessionListener 来控制同一用户的并发登录：

```java
public class KickoutSessionControlFilter extends AccessControlFilter {
    // 实现踢出用户逻辑
}
```

### 4. 如何集成数据库？

```java
public class JdbcRealm extends AuthorizingRealm {
    @Autowired
    private UserService userService;
    
    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) {
        String username = (String) token.getPrincipal();
        User user = userService.findByUsername(username);
        // ...
    }
    
    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        String username = (String) principals.getPrimaryPrincipal();
        // 从数据库获取用户权限
        // ...
    }
}
```

### 5. 缓存配置

```java
@Bean
public CacheManager cacheManager() {
    EhCacheManager ehCacheManager = new EhCacheManager();
    ehCacheManager.setCacheManagerConfigFile("classpath:ehcache.xml");
    return ehCacheManager;
}
```

## 参考资源

### 官方资源

- **Apache Shiro 官网**: https://shiro.apache.org/
- **官方文档**: https://shiro.apache.org/documentation.html
- **官方教程**: https://shiro.apache.org/tutorial.html
- **API 文档**: https://shiro.apache.org/static/current/apidocs/
- **GitHub 仓库**: https://github.com/apache/shiro
- **下载页面**: https://shiro.apache.org/download.html

### 优质第三方教程

1. **waylau/apache-shiro-1.2.x-reference (GitHub)**
   - 地址: https://github.com/waylau/apache-shiro-1.2.x-reference
   - 特点: 《Apache Shiro 参考手册》中文翻译，包含完整示例代码

2. **javastacks/javastack (GitHub)**
   - 地址: https://github.com/javastacks/javastack/tree/master/articles/后端技术/Shrio
   - 特点: 非常详尽的 Shiro 架构解析和实战教程

3. **W3Cschool Shiro 教程**
   - 地址: https://www.w3cschool.cn/shiro/
   - 特点: 中文教程，适合初学者

4. **Docs4dev Apache Shiro 教程**
   - 地址: https://www.docs4dev.com/docs/zh/apache-shiro/
   - 特点: 中文文档，内容详尽

5. **greycode Shiro 教程**
   - 地址: https://greycode.github.io/shiro/doc/tutorial.html
   - 特点: 英文教程，讲解深入

### 实战项目参考

- **zhisheng17/spring-boot-examples**
  - Spring Boot + Shiro 完整示例
- **527515025/springBoot**
  - 包含 Shiro 安全框架集成示例
- **crossoverJie/SSM**
  - SSM 框架 + Shiro 权限管理

### 权限管理

http://www.vxzsk.com/766.html

http://www.infocool.net/kb/Apache/201609/190994.html

### 版本说明

- **当前稳定版**: 2.0.5 (支持 Java 11+)
- **历史版本**: 1.13.0 (支持 Java 8+)
- **发布频率**: 通常每季度发布一次维护版本
