---
title: 深入Java单例模式
category:
  - java
tag:
  - 单例模式
---

# 深入Java单例模式

## 引言

单例模式是GoF设计模式中最简单却最容易出错的模式之一。在现代Java开发中，随着并发编程、微服务架构和函数式编程的普及，单例模式的使用场景和实现方式都发生了重要变化。本文将深入探讨Java单例模式的各种实现方式、性能考量以及现代最佳实践。

## 什么是单例模式

单例模式确保一个类在整个应用程序中只有一个实例，并提供全局访问点。它常用于：

- 配置管理器
- 数据库连接池
- 缓存管理
- 日志记录器
- 线程池

## 实现方式演进

### 1. 饿汉式（Eager Initialization）

```java
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    
    private EagerSingleton() {}
    
    public static EagerSingleton getInstance() {
        return INSTANCE;
    }
}
```

**优点**：
- 线程安全（类加载时创建）
- 简单易懂

**缺点**：
- 不支持懒加载
- 如果实例化成本高且可能不使用，会造成资源浪费

### 2. 懒汉式（Lazy Initialization）

```java
public class LazySingleton {
    private static LazySingleton instance;
    
    private LazySingleton() {}
    
    public static LazySingleton getInstance() {
        if (instance == null) {
            instance = new LazySingleton();
        }
        return instance;
    }
}
```

**问题**：在多线程环境下不安全，可能创建多个实例。

### 3. 同步方法（Synchronized Method）

```java
public class SynchronizedSingleton {
    private static SynchronizedSingleton instance;
    
    private SynchronizedSingleton() {}
    
    public static synchronized SynchronizedSingleton getInstance() {
        if (instance == null) {
            instance = new SynchronizedSingleton();
        }
        return instance;
    }
}
```

**优点**：线程安全

**缺点**：性能开销大，每次调用都需要同步

### 4. 双重检查锁定（Double-Checked Locking）

```java
public class DoubleCheckedSingleton {
    private volatile static DoubleCheckedSingleton instance;
    
    private DoubleCheckedSingleton() {}
    
    public static DoubleCheckedSingleton getInstance() {
        if (instance == null) {
            synchronized (DoubleCheckedSingleton.class) {
                if (instance == null) {
                    instance = new DoubleCheckedSingleton();
                }
            }
        }
        return instance;
    }
}
```

**关键点**：
- `volatile` 关键字防止指令重排序
- 双重检查减少同步开销
- 适用于JDK 1.5及以上版本

### 5. 静态内部类（推荐）

```java
public class StaticInnerClassSingleton {
    private StaticInnerClassSingleton() {}
    
    private static class SingletonHolder {
        private static final StaticInnerClassSingleton INSTANCE = 
            new StaticInnerClassSingleton();
    }
    
    public static StaticInnerClassSingleton getInstance() {
        return SingletonHolder.INSTANCE;
    }
}
```

**优点**：
- 线程安全（JVM保证类加载的原子性）
- 懒加载（只有调用时才加载内部类）
- 无性能开销
- 不依赖volatile关键字

### 6. 枚举实现（最佳实践）

```java
public enum EnumSingleton {
    INSTANCE;
    
    public void doSomething() {
        System.out.println("Doing something...");
    }
}
```

**优点**：
- 天然线程安全
- 防止反序列化破坏单例
- 防止反射攻击
- 代码简洁

**使用方式**：
```java
EnumSingleton.INSTANCE.doSomething();
```

## 现代Java中的考量

### 1. 反射攻击防护

```java
public class ReflectionSafeSingleton {
    private static final ReflectionSafeSingleton INSTANCE = 
        new ReflectionSafeSingleton();
    
    private ReflectionSafeSingleton() {
        // 防止反射攻击
        if (INSTANCE != null) {
            throw new RuntimeException("Cannot create instance via reflection");
        }
    }
    
    public static ReflectionSafeSingleton getInstance() {
        return INSTANCE;
    }
}
```

### 2. 序列化安全

```java
public class SerializableSingleton implements Serializable {
    private static final SerializableSingleton INSTANCE = 
        new SerializableSingleton();
    
    private SerializableSingleton() {}
    
    public static SerializableSingleton getInstance() {
        return INSTANCE;
    }
    
    // 防止序列化破坏单例
    private Object readResolve() {
        return INSTANCE;
    }
}
```

### 3. 现代替代方案

#### 依赖注入框架
```java
// Spring Framework
@Component
@Scope("singleton")
public class SpringSingleton {
    // Spring容器管理单例
}
```

#### 函数式编程方式
```java
public class FunctionalSingleton {
    private static final Supplier<FunctionalSingleton> INSTANCE_SUPPLIER = 
        Suppliers.memoize(FunctionalSingleton::new);
    
    private FunctionalSingleton() {}
    
    public static FunctionalSingleton getInstance() {
        return INSTANCE_SUPPLIER.get();
    }
}
```

## 性能对比

| 实现方式 | 线程安全 | 懒加载 | 性能 | 推荐指数 |
|---------|---------|--------|------|---------|
| 饿汉式 | ✓ | ✗ | 高 | ★★★ |
| 懒汉式 | ✗ | ✓ | 高 | ★ |
| 同步方法 | ✓ | ✓ | 低 | ★★ |
| 双重检查 | ✓ | ✓ | 中 | ★★★ |
| 静态内部类 | ✓ | ✓ | 高 | ★★★★★ |
| 枚举 | ✓ | ✗ | 高 | ★★★★★ |

## 使用建议

### 优先选择
1. **枚举单例**：适用于简单单例，天然安全
2. **静态内部类**：适用于需要懒加载的复杂单例

### 避免使用
1. **懒汉式**：线程不安全
2. **同步方法**：性能开销大

### 现代替代方案
1. **依赖注入**：Spring等框架管理
2. **函数式编程**：使用Supplier等

## 注意事项

### 1. 类加载器问题
不同类加载器可能创建不同的单例实例。

### 2. 垃圾回收
单例对象会阻止垃圾回收，需要谨慎使用。

### 3. 测试困难
单例模式增加了单元测试的复杂性。

### 4. 违反单一职责原则
单例既管理实例创建又处理业务逻辑。

## 最佳实践

1. **优先使用枚举**实现简单单例
2. **使用静态内部类**实现复杂单例
3. **考虑依赖注入**框架替代手动单例
4. **注意序列化和反射安全**
5. **避免在单例中持有大量状态**
6. **提供清晰的API**和文档

## 总结

单例模式虽然简单，但在现代Java开发中需要考虑线程安全、性能、序列化等多个方面。推荐使用枚举或静态内部类实现，同时考虑依赖注入等现代替代方案。选择合适的实现方式，能够在保证正确性的同时获得最佳性能。