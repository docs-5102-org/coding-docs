---
title: CGLIB代理处理事务的核心流程分析
category:
  - Java
tag:
  - AOP
  - CGLIB
---

# CGLIB代理处理事务的核心流程分析

## 一、核心方法：`intercept()`

这是CGLIB代理的**核心拦截方法**，所有对代理对象的方法调用都会经过这里。

```java
@Override
@Nullable
public Object intercept(Object proxy, Method method, Object[] args, MethodProxy methodProxy) throws Throwable
```

---

## 二、事务处理的关键流程

### 1️⃣ **获取拦截器链（核心中的核心）**

```java
// 这是事务处理的关键！
List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);
```

**作用：**
- 获取当前方法的所有拦截器（Interceptor/Advice）
- 对于`@Transactional`方法，这个链中会包含 `TransactionInterceptor`
- 拦截器链就是实际执行事务逻辑的地方

**拦截器链示例：**
```
chain = [
    ExposeInvocationInterceptor,      // 暴露方法调用
    TransactionInterceptor,            // 🔥 事务拦截器（核心）
    其他切面拦截器...
]
```

---

### 2️⃣ **判断是否有拦截器**

```java
if (chain.isEmpty() && CglibMethodInvocation.isMethodProxyCompatible(method)) {
    // 没有拦截器，直接调用目标方法（无事务增强）
    Object[] argsToUse = AopProxyUtils.adaptArgumentsIfNecessary(method, args);
    retVal = invokeMethod(target, method, argsToUse, methodProxy);
}
```

**场景：** 
- 如果方法上没有`@Transactional`等AOP增强
- 直接通过反射调用目标方法，跳过拦截器链

---

### 3️⃣ **执行拦截器链（事务在这里执行）**

```java
else {
    // 创建方法调用对象，执行拦截器链
    retVal = new CglibMethodInvocation(proxy, target, method, args, targetClass, chain, methodProxy)
                .proceed(); // 🔥 核心：责任链模式执行
}
```

**这里是事务真正执行的地方！**

---

## 三、事务执行的责任链模式

### 执行流程图

```
调用代理方法
    ↓
intercept() 拦截
    ↓
获取拦截器链 chain
    ↓
chain.isEmpty()？
    ├─ 是 → 直接调用目标方法（无事务）
    └─ 否 → 执行拦截器链
            ↓
        CglibMethodInvocation.proceed()
            ↓
        逐个执行拦截器（责任链模式）
            ↓
        TransactionInterceptor.invoke() 🔥
            ↓
        ├─ 开启事务
        ├─ 调用目标方法
        ├─ 提交事务 / 回滚事务
        └─ 返回结果
```

---

## 四、TransactionInterceptor 核心代码

虽然源码中没有展示，但`TransactionInterceptor`才是真正处理事务的类：

```java
public class TransactionInterceptor extends TransactionAspectSupport implements MethodInterceptor {
    
    @Override
    @Nullable
    public Object invoke(MethodInvocation invocation) throws Throwable {
        // 获取目标类
        Class<?> targetClass = (invocation.getThis() != null ? 
            AopUtils.getTargetClass(invocation.getThis()) : null);

        // 核心：在事务内执行方法
        return invokeWithinTransaction(
            invocation.getMethod(), 
            targetClass, 
            invocation::proceed  // 继续执行下一个拦截器或目标方法
        );
    }
}
```

### `invokeWithinTransaction()` 方法（事务的核心逻辑）

```java
protected Object invokeWithinTransaction(Method method, @Nullable Class<?> targetClass,
        final InvocationCallback invocation) throws Throwable {

    // 1. 获取事务属性（@Transactional的配置）
    TransactionAttributeSource tas = getTransactionAttributeSource();
    final TransactionAttribute txAttr = (tas != null ? 
        tas.getTransactionAttribute(method, targetClass) : null);
    
    // 2. 获取事务管理器
    final TransactionManager tm = determineTransactionManager(txAttr);

    // 3. 创建事务信息
    TransactionInfo txInfo = createTransactionIfNecessary(tm, txAttr, joinpointIdentification);

    Object retVal;
    try {
        // 4. 🔥 执行目标方法（业务逻辑）
        retVal = invocation.proceedWithInvocation();
    }
    catch (Throwable ex) {
        // 5. 🔥 异常处理：回滚事务
        completeTransactionAfterThrowing(txInfo, ex);
        throw ex;
    }
    finally {
        cleanupTransactionInfo(txInfo);
    }
    
    // 6. 🔥 正常提交事务
    commitTransactionAfterReturning(txInfo);
    return retVal;
}
```

---

## 五、完整调用链路

```
用户调用: userService.innerMethod()
    ↓
代理对象拦截
    ↓
DynamicAdvisedInterceptor.intercept()
    ↓
获取拦截器链: [TransactionInterceptor, ...]
    ↓
CglibMethodInvocation.proceed()
    ↓
TransactionInterceptor.invoke()
    ↓
invokeWithinTransaction()
    ├─ 1. 解析 @Transactional 配置
    ├─ 2. 获取数据源连接
    ├─ 3. 开启事务: conn.setAutoCommit(false)
    ├─ 4. 执行目标方法: invocation.proceed()
    │       ↓
    │   target.innerMethod() // 真正的业务逻辑
    │       ↓
    ├─ 5. 正常返回 → conn.commit()
    └─ 6. 抛出异常 → conn.rollback()
```

---

## 六、关键代码标注

```java
public Object intercept(Object proxy, Method method, Object[] args, MethodProxy methodProxy) {
    // ... 省略其他代码
    
    // 🔥🔥🔥 核心1: 获取拦截器链（包含TransactionInterceptor）
    List<Object> chain = this.advised.getInterceptorsAndDynamicInterceptionAdvice(method, targetClass);
    
    Object retVal;
    if (chain.isEmpty()) {
        // 没有拦截器，直接调用
        retVal = invokeMethod(target, method, argsToUse, methodProxy);
    }
    else {
        // 🔥🔥🔥 核心2: 执行拦截器链（责任链模式）
        // 事务的开启、提交、回滚都在这里面的TransactionInterceptor中完成
        retVal = new CglibMethodInvocation(proxy, target, method, args, targetClass, chain, methodProxy)
                    .proceed();
    }
    
    return retVal;
}
```

---

## 七、总结

### 核心方法

| 方法 | 作用 | 重要性 |
|------|------|--------|
| `intercept()` | CGLIB代理的拦截入口 | ⭐⭐⭐⭐⭐ |
| `getInterceptorsAndDynamicInterceptionAdvice()` | 获取拦截器链 | ⭐⭐⭐⭐⭐ |
| `CglibMethodInvocation.proceed()` | 执行责任链 | ⭐⭐⭐⭐⭐ |
| `TransactionInterceptor.invoke()` | 事务的真正处理 | ⭐⭐⭐⭐⭐ |
| `invokeWithinTransaction()` | 开启/提交/回滚事务 | ⭐⭐⭐⭐⭐ |

### 一句话总结

**`intercept()`方法通过获取拦截器链并执行责任链模式，将方法调用委托给`TransactionInterceptor`，由它负责事务的开启、提交和回滚。**

### 事务处理的本质

```java
// 伪代码展示事务本质
try {
    conn.setAutoCommit(false);  // 开启事务
    targetMethod.invoke();       // 执行业务逻辑
    conn.commit();               // 提交事务
} catch (Exception e) {
    conn.rollback();             // 回滚事务
    throw e;
}
```