---
title: Shiro 密码模块应用指南
category:
  - Java 安全认证框架
tag:
  - Shiro
---

# Shiro 密码模块应用指南

## 概述

Apache Shiro 是一个功能强大且灵活的开源安全框架，其四大核心特征包括：
- **认证**（Authentication）
- **授权**（Authorization）  
- **加密**（Cryptography）
- **会话管理**（Session Management）

本文重点介绍 Shiro 的密码服务模块，通过实际案例展示如何提高应用系统的安全性。

## 1. Shiro 加密工具类概览

Shiro 提供了丰富的加密工具类，主要包括：

### 编码工具
- `Base64` - Base64 编解码
- `Hex` - 十六进制编解码  
- `H64` - Shiro 专用编码格式
- `CodecSupport` - 编解码支持类

### 加密工具
- `Md5Hash` - MD5 哈希算法
- `AesCipherService` - AES 对称加密服务
- `SecureRandomNumberGenerator` - 安全随机数生成器

## 2. 密码加密工具类实现

以下是一个完整的加密工具类示例：

```java
package com.util;

import com.domain.User;
import com.google.common.base.Preconditions;
import com.google.common.base.Strings;
import org.apache.shiro.codec.Base64;
import org.apache.shiro.codec.Hex;
import org.apache.shiro.crypto.AesCipherService;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.crypto.hash.Md5Hash;
import java.security.Key;

/**
 * Shiro 加密解密工具类封装
 */
public final class EndecryptUtils {
    
    /**
     * Base64 加密
     */
    public static String encrytBase64(String password) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(password), "密码不能为空");
        byte[] bytes = password.getBytes();
        return Base64.encodeToString(bytes);
    }
    
    /**
     * Base64 解密
     */
    public static String decryptBase64(String cipherText) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(cipherText), "密文不能为空");
        return Base64.decodeToString(cipherText);
    }
    
    /**
     * 十六进制加密
     */
    public static String encrytHex(String password) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(password), "密码不能为空");
        byte[] bytes = password.getBytes();
        return Hex.encodeToString(bytes);
    }
    
    /**
     * 十六进制解密
     */
    public static String decryptHex(String cipherText) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(cipherText), "密文不能为空");
        return new String(Hex.decode(cipherText));
    }
    
    /**
     * 生成 AES 密钥
     */
    public static String generateKey() {
        AesCipherService aesCipherService = new AesCipherService();
        Key key = aesCipherService.generateNewKey();
        return Base64.encodeToString(key.getEncoded());
    }
    
    /**
     * MD5 密码加密，返回包含密文和盐的 User 对象
     * @param username 用户名
     * @param password 原始密码
     * @return 包含加密密码和盐的 User 对象
     */
    public static User md5Password(String username, String password) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(username), "用户名不能为空");
        Preconditions.checkArgument(!Strings.isNullOrEmpty(password), "密码不能为空");
        
        // 生成安全随机盐
        SecureRandomNumberGenerator secureRandomNumberGenerator = new SecureRandomNumberGenerator();
        String salt = secureRandomNumberGenerator.nextBytes().toHex();
        
        // 使用用户名+盐，进行2次迭代MD5加密
        String passwordCipherText = new Md5Hash(password, username + salt, 2).toHex();
        
        User user = new User();
        user.setPassword(passwordCipherText);
        user.setSalt(salt);
        user.setUsername(username);
        
        return user;
    }
    
    /**
     * MD5 密码校验
     * @param username 用户名
     * @param password 原始密码
     * @param salt 盐值
     * @param md5cipherText 存储的密文
     * @return 校验结果
     */
    public static boolean checkMd5Password(String username, String password, 
                                         String salt, String md5cipherText) {
        Preconditions.checkArgument(!Strings.isNullOrEmpty(username), "用户名不能为空");
        Preconditions.checkArgument(!Strings.isNullOrEmpty(password), "密码不能为空");
        Preconditions.checkArgument(!Strings.isNullOrEmpty(md5cipherText), "密文不能为空");
        
        // 使用相同规则加密输入的密码
        String passwordCipherText = new Md5Hash(password, username + salt, 2).toHex();
        return md5cipherText.equals(passwordCipherText);
    }
}
```

## 3. 缓存工具类实现

为了实现登录失败次数限制功能，我们需要一个缓存工具类：

```java
package com.util.cache;

import net.sf.ehcache.Cache;
import net.sf.ehcache.CacheManager;
import net.sf.ehcache.Element;
import net.sf.ehcache.config.CacheConfiguration;
import net.sf.ehcache.store.MemoryStoreEvictionPolicy;

/**
 * EhCache 缓存工具类
 */
public final class EhcacheUtil {
    
    private static final CacheManager cacheManager = CacheManager.getInstance();
    
    // 创建系统缓存，有效期1小时
    private static Cache cache = new Cache(
        new CacheConfiguration("systemCache", 5000)
            .memoryStoreEvictionPolicy(MemoryStoreEvictionPolicy.FIFO)
            .timeoutMillis(300)
            .timeToLiveSeconds(60 * 60)
    );
    
    static {
        cacheManager.addCache(cache);
    }
    
    public static void putItem(String key, Object item) {
        if (cache.get(key) != null) {
            cache.remove(key);
        }
        Element element = new Element(key, item);
        cache.put(element);
    }
    
    public static void removeItem(String key) {
        cache.remove(key);
    }
    
    public static void updateItem(String key, Object value) {
        putItem(key, value);
    }
    
    public static Object getItem(String key) {
        Element element = cache.get(key);
        if (null != element) {
            return element.getObjectValue();
        }
        return null;
    }
}
```

## 4. 限制重试次数的密码匹配器

```java
package com.util;

import com.util.cache.EhcacheUtil;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.ExcessiveAttemptsException;
import org.apache.shiro.authc.credential.HashedCredentialsMatcher;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 限制登录重试次数的密码匹配器
 * 连续5次密码错误将锁定账户1小时
 */
public class LimitRetryHashedMatcher extends HashedCredentialsMatcher {
    
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        String username = (String) token.getPrincipal();
        
        // 获取重试次数并递增
        Object element = EhcacheUtil.getItem(username);
        if (element == null) {
            EhcacheUtil.putItem(username, 1);
            element = 0;
        } else {
            int count = Integer.parseInt(element.toString()) + 1;
            element = count;
            EhcacheUtil.putItem(username, element);
        }
        
        AtomicInteger retryCount = new AtomicInteger(Integer.parseInt(element.toString()));
        
        // 超过5次重试，抛出异常
        if (retryCount.incrementAndGet() > 5) {
            throw new ExcessiveAttemptsException();
        }
        
        // 执行密码匹配
        boolean matches = super.doCredentialsMatch(token, info);
        
        // 如果匹配成功，清除重试计数
        if (matches) {
            EhcacheUtil.removeItem(username);
        }
        
        return matches;
    }
}
```

## 5. Spring 配置

在 Spring 配置文件中配置认证数据源和密码校验器：

```xml
<!-- 自定义 Realm -->
<bean id="myRealm" class="com.util.MysqlJdbcRealM">
    <property name="credentialsMatcher" ref="passwordMatcher"></property>
</bean>

<!-- 密码匹配器配置 -->
<bean id="passwordMatcher" class="com.util.LimitRetryHashedMatcher">
    <property name="hashAlgorithmName" value="md5"></property>
    <property name="hashIterations" value="2"></property>
    <property name="storedCredentialsHexEncoded" value="true"></property>
</bean>
```

## 6. 用户注册与登录实现

### 用户注册

```java
/**
 * 用户注册
 */
@Override
public ResponseEntity<Map> createSubmit(User entity) {
    // 加密用户输入的密码，得到密码的摘要和盐
    User user = EndecryptUtils.md5Password(entity.getUsername(), entity.getPassword());
    entity.setPassword(user.getPassword());
    entity.setSalt(user.getSalt());
    
    Map<String, Object> map = Maps.newHashMap();
    try {
        boolean createResult = service.modify(entity, OperationType.create);
        map.put("success", createResult);
    } catch (Exception e) {
        e.printStackTrace();
    }
    return new ResponseEntity<Map>(map, HttpStatus.OK);
}
```

### 用户登录

```java
@RequestMapping(value = "login", method = RequestMethod.POST)
public ResponseEntity<Message> loginSubmit(String username, String password, 
                                         String vcode, HttpServletRequest request) {
    message.setSuccess();
    validateLogin(message, username, password, vcode);
    
    try {
        if (message.isSuccess()) {
            Subject subject = SecurityUtils.getSubject();
            subject.login(new UsernamePasswordToken(username, password, false));
            
            if (subject.isAuthenticated()) {
                message.setMsg("登录成功");
            } else {
                message.setCode(AppConstant.USERNAME_NOTEXIST);
                message.setMsg("用户名/密码错误");
            }
        }
    } catch (ExcessiveAttemptsException ex) {
        message.setCode(AppConstant.USERNAME_NOTEXIST);
        message.setMsg("账号被锁定1小时");
        ex.printStackTrace();
    } catch (AuthenticationException ex) {
        message.setCode(AppConstant.USERNAME_NOTEXIST);
        message.setMsg("用户名/密码错误");
        ex.printStackTrace();
    } finally {
        return new ResponseEntity<Message>(message, HttpStatus.OK);
    }
}
```

### Realm 认证方法

```java
//登录认证
@Override
protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken token) 
    throws AuthenticationException {
    
    UsernamePasswordToken usernamePasswordToken = (UsernamePasswordToken) token;
    String username = String.valueOf(usernamePasswordToken.getUsername());
    User user = userService.findByUserName(username);
    
    SimpleAuthenticationInfo authenticationInfo = null;
    if (null != user) {
        // 密码校验交给 Shiro 的 CredentialsMatcher 处理
        authenticationInfo = new SimpleAuthenticationInfo(
            user.getUsername(), 
            user.getPassword(), 
            getName()
        );
        // 设置盐值
        authenticationInfo.setCredentialsSalt(
            ByteSource.Util.bytes(username + user.getSalt())
        );
    }
    
    return authenticationInfo;
}
```

## 7. 安全特性总结

通过本案例实现的安全特性：

1. **密码哈希存储**：使用 MD5 + 盐值 + 迭代次数的方式存储密码
2. **随机盐值**：每个用户使用不同的随机盐值
3. **登录重试限制**：连续5次密码错误锁定账户1小时
4. **缓存管理**：使用 EhCache 管理登录失败计数
5. **多种加密选择**：支持 Base64、Hex、AES 等多种加密方式

## 8. 最佳实践建议

1. **盐值管理**：为每个用户生成唯一的随机盐值
2. **迭代次数**：适当增加哈希迭代次数提高安全性
3. **缓存策略**：合理设置缓存过期时间
4. **异常处理**：妥善处理各种认证异常情况
5. **日志记录**：记录登录失败和锁定事件用于安全审计