---
title: 动态代理
category:
  - Java
tag:
  -  动态代理
---

# Java 动态代理教程

## 1. 代理模式概述

代理模式是Java中常用的设计模式，其核心特征是代理类与委托类实现相同的接口。代理类主要负责：

- 为委托类预处理消息
- 过滤消息
- 把消息转发给委托类
- 事后处理消息

代理类对象本身并不真正实现服务，而是通过调用委托类对象的相关方法来提供特定服务。

## 2. 代理类型

按照代理的创建时期，代理类可以分为两种：

### 静态代理
- 由程序员创建或特定工具自动生成源代码
- 在程序运行前，代理类的.class文件就已经存在

### 动态代理
- 在程序运行时，运用反射机制动态创建而成
- 字节码在程序运行时动态生成

## 3. 静态代理示例

### 3.1 接口定义
```java
package net.battier.dao;

/**
 * 定义一个账户接口
 */
public interface Count {
    // 查看账户方法
    public void queryCount();
    
    // 修改账户方法
    public void updateCount();
}
```

### 3.2 委托类实现
```java
package net.battier.dao.impl;

import net.battier.dao.Count;

/**
 * 委托类(包含业务逻辑)
 */
public class CountImpl implements Count {
    
    @Override
    public void queryCount() {
        System.out.println("查看账户方法...");
    }
    
    @Override
    public void updateCount() {
        System.out.println("修改账户方法...");
    }
}
```

### 3.3 代理类实现
```java
package net.battier.dao.impl;

import net.battier.dao.Count;

/**
 * 这是一个代理类（增强CountImpl实现类）
 */
public class CountProxy implements Count {
    private CountImpl countImpl;
    
    /**
     * 覆盖默认构造器
     */
    public CountProxy(CountImpl countImpl) {
        this.countImpl = countImpl;
    }
    
    @Override
    public void queryCount() {
        System.out.println("事务处理之前");
        // 调用委托类的方法
        countImpl.queryCount();
        System.out.println("事务处理之后");
    }
    
    @Override
    public void updateCount() {
        System.out.println("事务处理之前");
        // 调用委托类的方法
        countImpl.updateCount();
        System.out.println("事务处理之后");
    }
}
```

### 3.4 测试类
```java
package net.battier.test;

import net.battier.dao.impl.CountImpl;
import net.battier.dao.impl.CountProxy;

/**
 * 测试Count类
 */
public class TestCount {
    public static void main(String[] args) {
        CountImpl countImpl = new CountImpl();
        CountProxy countProxy = new CountProxy(countImpl);
        countProxy.updateCount();
        countProxy.queryCount();
    }
}
```

### 静态代理的问题

- 每一个代理类只能为一个接口服务
- 程序开发中必然会产生过多的代理
- 所有代理操作除了调用的方法不一样外，其他操作都一样，产生重复代码

## 4. JDK动态代理

JDK动态代理通过反射机制动态生成代理类，解决了静态代理的问题。

### 4.1 核心组件

#### InvocationHandler接口
```java
public interface InvocationHandler {
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable;
}
```

参数说明：
- `Object proxy`：指被代理的对象
- `Method method`：要调用的方法
- `Object[] args`：方法调用时所需要的参数

#### Proxy类
```java
public static Object newProxyInstance(ClassLoader loader, 
                                    Class<?>[] interfaces, 
                                    InvocationHandler h)
```

参数说明：
- `ClassLoader loader`：类加载器
- `Class<?>[] interfaces`：得到全部的接口
- `InvocationHandler h`：得到InvocationHandler接口的子类实例

### 4.2 类加载器说明

Java中主要有三种类加载器：

- **Bootstrap ClassLoader**：采用C++编写，一般开发中看不到
- **Extension ClassLoader**：用来进行扩展类的加载，对应jre/lib/ext目录中的类
- **AppClassLoader**：(默认)加载classpath指定的类，最常使用的加载器

### 4.3 JDK动态代理示例

#### 4.3.1 业务接口
```java
package net.battier.dao;

public interface BookFacade {
    public void addBook();
}
```

#### 4.3.2 业务实现类
```java
package net.battier.dao.impl;

import net.battier.dao.BookFacade;

public class BookFacadeImpl implements BookFacade {
    
    @Override
    public void addBook() {
        System.out.println("增加图书方法。。。");
    }
}
```

#### 4.3.3 动态代理类
```java
package net.battier.proxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;

/**
 * JDK动态代理代理类
 */
public class BookFacadeProxy implements InvocationHandler {
    private Object target;
    
    /**
     * 绑定委托对象并返回一个代理类
     */
    public Object bind(Object target) {
        this.target = target;
        // 取得代理对象
        return Proxy.newProxyInstance(
            target.getClass().getClassLoader(),
            target.getClass().getInterfaces(), 
            this
        );
    }
    
    @Override
    /**
     * 调用方法
     */
    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
        Object result = null;
        System.out.println("事物开始");
        // 执行方法
        result = method.invoke(target, args);
        System.out.println("事物结束");
        return result;
    }
}
```

#### 4.3.4 测试类
```java
package net.battier.test;

import net.battier.dao.BookFacade;
import net.battier.dao.impl.BookFacadeImpl;
import net.battier.proxy.BookFacadeProxy;

public class TestProxy {
    
    public static void main(String[] args) {
        BookFacadeProxy proxy = new BookFacadeProxy();
        BookFacade bookProxy = (BookFacade) proxy.bind(new BookFacadeImpl());
        bookProxy.addBook();
    }
}
```

### JDK动态代理的局限性

JDK的动态代理依靠接口实现，如果有些类并没有实现接口，则不能使用JDK代理。

## 5. CGLIB动态代理

CGLIB是针对类来实现代理的，它的原理是对指定的目标类生成一个子类，并覆盖其中方法实现增强。

### 5.1 CGLIB特点

- 不需要目标类实现接口
- 通过继承目标类生成代理类
- 不能对final修饰的类进行代理

### 5.2 CGLIB动态代理示例

#### 5.2.1 目标类（无需实现接口）
```java
package net.battier.dao.impl;

/**
 * 这个是没有实现接口的实现类
 */
public class BookFacadeImpl1 {
    public void addBook() {
        System.out.println("增加图书的普通方法...");
    }
}
```

#### 5.2.2 CGLIB代理类
```java
package net.battier.proxy;

import java.lang.reflect.Method;

import net.sf.cglib.proxy.Enhancer;
import net.sf.cglib.proxy.MethodInterceptor;
import net.sf.cglib.proxy.MethodProxy;

/**
 * 使用cglib动态代理
 */
public class BookFacadeCglib implements MethodInterceptor {
    private Object target;
    
    /**
     * 创建代理对象
     */
    public Object getInstance(Object target) {
        this.target = target;
        Enhancer enhancer = new Enhancer();
        enhancer.setSuperclass(this.target.getClass());
        // 回调方法
        enhancer.setCallback(this);
        // 创建代理对象
        return enhancer.create();
    }
    
    @Override
    // 回调方法
    public Object intercept(Object obj, Method method, Object[] args,
            MethodProxy proxy) throws Throwable {
        System.out.println("事物开始");
        proxy.invokeSuper(obj, args);
        System.out.println("事物结束");
        return null;
    }
}
```

#### 5.2.3 测试类
```java
package net.battier.test;

import net.battier.dao.impl.BookFacadeImpl1;
import net.battier.proxy.BookFacadeCglib;

public class TestCglib {
    
    public static void main(String[] args) {
        BookFacadeCglib cglib = new BookFacadeCglib();
        BookFacadeImpl1 bookCglib = (BookFacadeImpl1) cglib.getInstance(new BookFacadeImpl1());
        bookCglib.addBook();
    }
}
```

## 6. JDK动态代理 vs CGLIB动态代理

| 特性 | JDK动态代理 | CGLIB动态代理 |
|------|-------------|---------------|
| 实现方式 | 基于接口 | 基于继承 |
| 要求 | 目标类必须实现接口 | 目标类不能是final |
| 性能 | 相对较慢 | 相对较快 |
| 包依赖 | JDK自带 | 需要cglib包 |
| 生成方式 | 在运行时生成接口的实现类 | 在运行时生成目标类的子类 |

## 7. 总结

动态代理是Java中非常重要的技术，它在很多框架中都有广泛应用，如Spring AOP、Hibernate等。掌握动态代理的原理和使用方法，对于理解这些框架的工作机制具有重要意义。

选择代理方式的建议：
- 如果目标类实现了接口，优先使用JDK动态代理
- 如果目标类没有实现接口，使用CGLIB动态代理
- 考虑性能要求时，CGLIB通常表现更好