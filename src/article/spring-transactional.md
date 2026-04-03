---
title: Transactional注解详解及失效场景
category:
  - Spring
tag:
  - Transactional
Date:
  - 2025-11-28
---

# @Transactional注解详解及失效场景

## 基础用法回顾
```java
@Transactional(rollbackFor = Exception.class)
public void businessMethod() {
    // 业务逻辑
}
```

**关键点:**
* 默认只在RuntimeException时回滚
* rollbackFor = Exception.class可使非运行时异常也回滚
* 作用于类时,所有public方法都具有事务属性
* 方法级别的注解会覆盖类级别的定义

---

## 重要扩展：事务失效的几种场景

### 1. **同类方法内部调用导致事务失效** ⭐️

这是最常见的面试考点！

```java
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    /**
     * 场景1：外部直接调用 innerMethod ✅ 事务生效
     * Controller → 代理对象.innerMethod() → 事务开启
     */

    /**
     * 场景2：通过 outerMethod 间接调用 innerMethod ❌ 事务失效
     * Controller → 代理对象.outerMethod() → this.innerMethod() → 事务不生效
     */
    public void outerMethod() {
        // this 是原始对象，不是代理对象，事务失效
        innerMethod();
    }

    @Transactional
    public void innerMethod() {
        userMapper.insert(user);
    }
}
```

**失效原因：**
- Spring事务基于AOP代理实现
- 内部调用使用的是`this`,不是代理对象
- 代理对象才有事务增强功能

**调用链对比**

```
✅ 事务生效:
Controller
  → UserService代理对象.innerMethod()
      → 开启事务
      → 原始对象.innerMethod()
      → 提交/回滚事务

❌ 事务失效:
Controller
  → UserService代理对象.outerMethod()
      → 原始对象.outerMethod()        ← 代理逻辑到此结束
          → this.innerMethod()        ← this 是原始对象，没有事务
```

#### 解决方案：

```java
@Service
public class UserService {
    
    // 方案1：自己注入自己(推荐)
    // Spring AOP检查到@Transactional后会为UserService创建代理对象
    // 注入的selfService就是这个代理对象
    @Autowired
    private UserService selfService;
    
    public void outerMethod() {
        selfService.innerMethod(); // 通过代理对象调用
    }
    
    // 方案2：通过AopContext获取代理对象
    // 需要开启 @EnableAspectJAutoProxy(exposeProxy = true)
    public void outerMethod2() {
        ((UserService) AopContext.currentProxy()).innerMethod();
    }
    
    // 方案3：拆分到不同的Service类(最推荐)
    @Autowired
    private UserServiceHelper userServiceHelper;
    
    public void outerMethod3() {
        userServiceHelper.innerMethod();
    }
    
    @Transactional
    public void innerMethod() {
        userMapper.insert(user);
    }
}
```

#### 代理对象创建原理

```
Spring创建Bean的决策流程:

1. 扫描到 @Service
   ↓
2. 创建 UserService 实例
   ↓
3. Spring AOP 检查: "这个Bean需要增强吗?"
   ├─ 有 @Transactional? → 是 → 创建代理
   ├─ 有 @Async? → 是 → 创建代理
   ├─ 有 @Cacheable? → 是 → 创建代理
   ├─ 匹配到 @Aspect 切面? → 是 → 创建代理
   └─ 都没有? → 否 → 注册原始对象
   ↓
4. 注入到其他Bean时,注入的是步骤3的结果
```

**⚠️ 重要提醒:** `@Service`本身不会创建代理对象！只有存在AOP增强点(如`@Transactional`)时才会创建代理。

[CGLIB代理处理事务的核心流程分析](../../../article/cglib-handle-transactional.md)

#### 如何判断是否为代理对象

```java
@Service
public class UserService {
    
    @Autowired
    private UserService selfService;
    
    public void checkProxy() {
        // 方法1: 检查类名
        System.out.println(selfService.getClass().getName());
        // 有代理: xxx$$EnhancerBySpringCGLIB$$ 或 $Proxy
        
        // 方法2: 使用 AopUtils
        boolean isProxy = AopUtils.isAopProxy(selfService);
        boolean isCglibProxy = AopUtils.isCglibProxy(selfService);
        boolean isJdkProxy = AopUtils.isJdkDynamicProxy(selfService);
        
        System.out.println("是否代理: " + isProxy);
        System.out.println("CGLIB代理: " + isCglibProxy);
        System.out.println("JDK代理: " + isJdkProxy);
    }
    
    @Transactional
    public void innerMethod() { }
}
```

---

### 2. **方法不是public导致事务失效**

```java
@Service
public class UserService {
    
    // 事务失效!
    @Transactional
    private void privateMethod() {
        userMapper.insert(user);
    }
    
    // 事务失效!
    @Transactional
    protected void protectedMethod() {
        userMapper.insert(user);
    }
}
```

**原因：** Spring AOP默认使用JDK动态代理或CGLIB代理,只能代理public方法

---

### 3. **异常被捕获导致事务不回滚**

```java
@Service
public class UserService {
    
    @Transactional
    public void saveUser(User user) {
        try {
            userMapper.insert(user);
            int i = 1 / 0; // 抛出异常
        } catch (Exception e) {
            // 异常被捕获了,事务不会回滚!
            log.error("error", e);
        }
    }
    
    // 正确做法1：手动回滚
    @Transactional
    public void saveUserCorrect1(User user) {
        try {
            userMapper.insert(user);
            int i = 1 / 0;
        } catch (Exception e) {
            log.error("error", e);
            TransactionAspectSupport.currentTransactionStatus()
                .setRollbackOnly(); // 手动标记回滚
        }
    }
    
    // 正确做法2：重新抛出异常
    @Transactional
    public void saveUserCorrect2(User user) {
        try {
            userMapper.insert(user);
            int i = 1 / 0;
        } catch (Exception e) {
            log.error("error", e);
            throw e; // 重新抛出
        }
    }
}
```

---

### 4. **数据库引擎不支持事务**

```sql
-- MySQL的MyISAM引擎不支持事务,必须使用InnoDB
CREATE TABLE user (
    id INT PRIMARY KEY
) ENGINE=MyISAM; -- 事务不生效!

-- 应该使用
CREATE TABLE user (
    id INT PRIMARY KEY
) ENGINE=InnoDB; -- 支持事务
```

---

### 5. **propagation设置错误**

```java
@Service
public class UserService {
    
    // NOT_SUPPORTED: 以非事务方式执行
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void method1() {
        // 事务失效!
    }
    
    // NEVER: 如果存在事务则抛异常
    @Transactional(propagation = Propagation.NEVER)
    public void method2() {
        // 事务失效!
    }
}
```

---

### 6. **类没有被Spring管理**

```java
// 忘记加@Service等注解
public class UserService {
    
    @Transactional // 事务失效!类没有被Spring管理
    public void saveUser(User user) {
        userMapper.insert(user);
    }
}
```

---

### 7. **多线程调用**

```java
@Service
public class UserService {
    
    @Transactional
    public void saveUser(User user) {
        userMapper.insert(user);
        
        // 新线程中的操作不在同一个事务中!
        new Thread(() -> {
            userMapper.update(user); // 不在事务范围内
        }).start();
    }
}
```

**原因：** Spring事务是基于ThreadLocal实现的,不同线程无法共享同一个事务

---

## 事务传播行为详解

```java
public class TransactionExample {
    
    // REQUIRED(默认): 有事务加入,没有则新建
    @Transactional(propagation = Propagation.REQUIRED)
    public void method1() {}
    
    // REQUIRES_NEW: 总是新建事务,挂起当前事务
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void method2() {}
    
    // NESTED: 嵌套事务,外层回滚影响内层,内层回滚不影响外层
    @Transactional(propagation = Propagation.NESTED)
    public void method3() {}
    
    // SUPPORTS: 有事务则加入,没有则以非事务执行
    @Transactional(propagation = Propagation.SUPPORTS)
    public void method4() {}
    
    // MANDATORY: 必须在事务中执行,否则抛异常
    @Transactional(propagation = Propagation.MANDATORY)
    public void method5() {}
}
```

---

## 是否创建代理对象对比表

| 场景 | 是否创建代理 | 注入的对象类型 |
|------|------------|----------------|
| 只有`@Service` | ❌ 否 | 原始对象 |
| `@Service` + `@Transactional` | ✅ 是 | CGLIB代理对象 |
| `@Service` + `@Async` | ✅ 是 | CGLIB代理对象 |
| `@Service` + `@Cacheable` | ✅ 是 | CGLIB代理对象 |
| `@Service` + 自定义`@Aspect`切面 | ✅ 是 | CGLIB/JDK代理 |
| `@Service` + 实现接口 + `@Transactional` | ✅ 是 | JDK动态代理(默认) |

---

## 面试常见问题总结

**Q: 为什么内部调用事务会失效?**  
A: Spring事务是基于AOP代理实现的,内部调用this调用的是目标对象而非代理对象,所以事务增强逻辑不会执行。

**Q: 如何解决内部调用事务失效?**  
A: ①自己注入自己 ②使用AopContext.currentProxy() ③拆分到不同类(最推荐)

**Q: @Transactional可以用在private方法上吗?**  
A: 不可以,必须是public方法,因为代理只能代理public方法。

**Q: 抛出什么异常才会回滚?**  
A: 默认只回滚RuntimeException和Error,使用rollbackFor = Exception.class可以回滚所有异常。

**Q: 事务方法调用另一个事务方法,事务如何传播?**  
A: 取决于propagation属性,默认REQUIRED会加入当前事务。

**Q: @Service注解会让Bean变成代理对象吗?**  
A: 不会! `@Service`只是声明Bean,真正决定是否创建代理的是AOP增强(如`@Transactional`、`@Async`等)。

**Q: 如何判断注入的对象是否为代理对象?**  
A: 使用`AopUtils.isAopProxy()`方法或查看对象类名是否包含`$$EnhancerBySpringCGLIB$$`。

---

## 核心总结

🎯 **一句话总结**

`@Service`只是声明Bean,真正决定是否创建代理的是**AOP增强点**(`@Transactional`、`@Async`、`@Aspect`等)。没有AOP增强点,注入的就是普通对象;有AOP增强点,注入的才是代理对象。