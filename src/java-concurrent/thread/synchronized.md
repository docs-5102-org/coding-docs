---
title: 同步机制
category:
  - java线程
tag:
  - synchronized
  - 同步
  - volatile
---

# Java多线程教程：多线程同步机制详解

## 概述

Java中的同步机制是一种强大的工具，用于控制多个线程对共享资源的访问。它确保同一时间只有一个线程可以访问资源，防止数据不一致和竞态条件。这在多线程环境中尤为重要，因为线程经常共享变量、数组或对象等资源。

## 目录

[[toc]]

## 同步概述

在Java中，`synchronized`关键字用于同步对代码临界区的访问。主要有两种同步方式：

- **同步方法**：整个方法标记为`synchronized`，确保同一时间只有一个线程执行该方法
- **同步块**：方法内的特定代码块标记为`synchronized`，提供更细粒度的同步控制

### 同步的必要性

```java
// 不安全的计数器示例
class UnsafeCounter {
    private int count = 0;
    
    public void increment() {
        count++; // 非原子操作：读取 -> 计算 -> 写入
    }
    
    public int getCount() {
        return count;
    }
}
```

在多线程环境中，上述代码可能产生竞态条件，导致计数结果不准确。

## 同步方法

同步方法确保同一对象实例上的该方法同一时间只能被一个线程执行。锁由调用该方法的对象实例持有。

### 语法

```java
public synchronized void synchronizedMethod() {
    // 同步代码
}
```

### 特性

- 获取对象实例锁（monitor lock）
- 方法执行期间，其他线程无法执行该对象的任何同步方法
- 可以与非同步方法并发执行

## 同步块

同步块是方法内针对特定对象的同步代码块。它允许只锁定代码的关键部分而非整个方法。

### 语法

```java
public void method() {
    synchronized (this) {
        // 同步代码
    }
}
```

### 锁对象选择

```java
public class SynchronizedBlock {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();
    
    public void method1() {
        synchronized (lock1) {
            // 使用lock1的同步代码
        }
    }
    
    public void method2() {
        synchronized (lock2) {
            // 使用lock2的同步代码，可与method1并发执行
        }
    }
}
```

## 静态同步

静态同步确保获取的是类级锁，所有类实例共享同一把锁。

### 同步静态方法

```java
public static synchronized void staticSynchronizedMethod() {
    // 同步代码
}
```

### 静态同步块

```java
public static void staticMethod() {
    synchronized (ClassName.class) {
        // 同步代码
    }
}
```

### 示例

```java
public class StaticSyncExample {
    private static int staticCount = 0;
    
    public static synchronized void incrementStatic() {
        staticCount++;
    }
    
    public static void incrementWithBlock() {
        synchronized (StaticSyncExample.class) {
            staticCount++;
        }
    }
    
    public static int getStaticCount() {
        return staticCount;
    }
}
```

## 示例：同步方法

```java
class Counter {
    private int count = 0;
    
    public synchronized void increment() {
        count++;
    }
    
    public synchronized int getCount() {
        return count;
    }
}

public class SynchronizedMethodExample {
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                counter.increment();
            }
        };
        
        Thread thread1 = new Thread(task);
        Thread thread2 = new Thread(task);
        
        thread1.start();
        thread2.start();
        
        thread1.join();
        thread2.join();
        
        System.out.println("最终计数: " + counter.getCount());
    }
}
```

**输出结果：**
```
最终计数: 2000
```

### 代码解释

- `Counter`类的`increment`方法被声明为`synchronized`
- 两个线程各执行1000次`increment`操作
- 最终计数为2000，说明同步机制避免了竞态条件

## 示例：同步块

```java
class Counter {
    private int count = 0;
    private static final Object lock = new Object();
    
    public void increment() {
        synchronized (lock) {
            count++;
        }
    }
    
    public int getCount() {
        synchronized (lock) {
            return count;
        }
    }
}

public class SynchronizedBlockExample {
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) {
                counter.increment();
            }
        };
        
        Thread thread1 = new Thread(task);
        Thread thread2 = new Thread(task);
        
        thread1.start();
        thread2.start();
        
        thread1.join();
        thread2.join();
        
        System.out.println("最终计数: " + counter.getCount());
    }
}
```

**输出结果：**
```
最终计数: 2000
```

### 优势

- 更细粒度的控制
- 可以选择不同的锁对象
- 减少锁持有时间，提高并发性能

## 可重入同步

Java的同步锁是可重入的。如果线程已持有某个对象的锁，它可以再次进入该对象的任何同步方法或块。

```java
class ReentrantExample {
    public synchronized void method1() {
        System.out.println("进入 method1");
        method2(); // 可重入调用
    }
    
    public synchronized void method2() {
        System.out.println("进入 method2");
        method3(); // 继续可重入调用
    }
    
    public synchronized void method3() {
        System.out.println("进入 method3");
    }
    
    public static void main(String[] args) {
        ReentrantExample example = new ReentrantExample();
        example.method1();
    }
}
```

**输出结果：**
```
进入 method1
进入 method2
进入 method3
```

### 可重入的原理

- 每个锁都有一个计数器，记录获取锁的次数
- 同一线程每次获取锁时计数器加1
- 释放锁时计数器减1，直到为0才真正释放锁

## 同步与性能

### 性能开销

```java
public class PerformanceComparison {
    private int count = 0;
    private final Object lock = new Object();
    
    // 无同步版本
    public void unsafeIncrement() {
        count++;
    }
    
    // 同步方法版本
    public synchronized void syncMethodIncrement() {
        count++;
    }
    
    // 同步块版本
    public void syncBlockIncrement() {
        synchronized (lock) {
            count++;
        }
    }
    
    // 减少锁粒度的版本
    public void optimizedIncrement() {
        int temp;
        synchronized (lock) {
            temp = count + 1;
        }
        // 其他非关键操作...
        synchronized (lock) {
            count = temp;
        }
    }
}
```

### 性能优化建议

1. **减少锁的粒度**：只锁定必要的代码段
2. **避免嵌套锁**：防止死锁，提高性能
3. **使用读写锁**：读多写少的场景下使用`ReadWriteLock`
4. **考虑无锁数据结构**：如`AtomicInteger`、`ConcurrentHashMap`

## 高级同步机制

### 1. volatile关键字

`volatile` 关键字用于确保多线程环境中变量的可见性。当一个变量被 `volatile` 修饰时，Java 保证该变量不会被缓存到线程本地内存，它直接从主内存读取。这样，每个线程都会看到最新的变量值，确保了 **可见性**。

::: note

在默认情况下，每个线程会将共享变量从主内存复制到自己的线程内存中，这样就可能导致多个线程中保存的副本值不一致，从而引发数据不一致问题。

:::

虽然 `volatile` 确保了变量的可见性，但它并不能保证操作的 **原子性**。因此，`volatile` 适用于简单类型的变量（如 `int`, `boolean` 等），可以确保对这些变量的简单赋值和读取操作是 **不中断的**。然而，如果变量的值依赖于它自身的前一个值（如递增操作 `x++`），`volatile` 并不能保证线程安全，此时仍需要使用 `synchronized` 或其他并发控制工具来确保 **原子性**。

总的来说，`volatile` 提供了一种轻量级的同步机制，能够提高性能，但它并不适用于所有情况。在使用时需要特别小心，不能误认为 `volatile` 可以完全代替 `synchronized`。


```java
public class VolatileExample {
    private volatile boolean flag = false;
    
    public void setFlag() {
        flag = true; // 对所有线程立即可见
    }
    
    public boolean isFlag() {
        return flag;
    }
}
```

更多参考，[volatile关键字](./volatile.md)

### 2. wait()和notify()机制

```java
public class WaitNotifyExample {
    private final Object lock = new Object();
    private boolean condition = false;
    
    public void waitForCondition() throws InterruptedException {
        synchronized (lock) {
            while (!condition) {
                lock.wait(); // 释放锁并等待
            }
            // 条件满足，继续执行
        }
    }
    
    public void setCondition() {
        synchronized (lock) {
            condition = true;
            lock.notify(); // 唤醒一个等待的线程
        }
    }
}
```

### 3. 使用java.util.concurrent包

```java
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;
    
    public void increment() {
        lock.lock();
        try {
            count++;
        } finally {
            lock.unlock(); // 确保锁被释放
        }
    }
    
    public int getCount() {
        lock.lock();
        try {
            return count;
        } finally {
            lock.unlock();
        }
    }
}
```

## 同步最佳实践

### 1. 选择合适的锁粒度

```java
public class GranularityExample {
    private final Object readLock = new Object();
    private final Object writeLock = new Object();
    
    private String data;
    
    public String read() {
        synchronized (readLock) {
            return data;
        }
    }
    
    public void write(String newData) {
        synchronized (writeLock) {
            data = newData;
        }
    }
}
```

### 2. 避免死锁

```java
public class DeadlockAvoidance {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();
    
    // 始终按照相同顺序获取锁
    public void method1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // 业务逻辑
            }
        }
    }
    
    public void method2() {
        synchronized (lock1) { // 与method1相同的顺序
            synchronized (lock2) {
                // 业务逻辑
            }
        }
    }
}
```

### 3. 使用不可变对象

```java
public final class ImmutableCounter {
    private final int count;
    
    public ImmutableCounter(int count) {
        this.count = count;
    }
    
    public int getCount() {
        return count;
    }
    
    public ImmutableCounter increment() {
        return new ImmutableCounter(count + 1);
    }
}
```

## 常见陷阱

### 1. 同步错误的对象

```java
// 错误示例
public class WrongSync {
    private Integer count = 0; // Integer是不可变的
    
    public void increment() {
        synchronized (count) { // 错误：锁对象可能改变
            count++;
        }
    }
}

// 正确示例
public class CorrectSync {
    private int count = 0;
    private final Object lock = new Object();
    
    public void increment() {
        synchronized (lock) { // 正确：使用固定的锁对象
            count++;
        }
    }
}
```

### 2. 字符串作为锁对象

```java
// 避免使用字符串字面量作为锁
public class StringLockProblem {
    private final String lock = "LOCK"; // 危险：字符串可能被其他代码复用
    
    public void method() {
        synchronized (lock) {
            // 可能与其他使用相同字符串的代码产生意外同步
        }
    }
}
```

## 结论

Java同步机制是确保多线程环境下线程安全的关键工具。通过同步方法、同步块和静态同步，可以有效控制多线程对共享资源的访问。

### 核心要点

- **正确选择同步策略**：根据具体需求选择同步方法或同步块
- **合理控制锁粒度**：在线程安全和性能之间找到平衡
- **避免常见陷阱**：如死锁、锁对象选择错误等
- **考虑现代替代方案**：如`java.util.concurrent`包中的高级同步工具

### 使用原则

- 只在必要时使用同步
- 尽可能减少同步代码的范围
- 优先考虑不可变对象和线程安全的数据结构
- 在复杂场景下考虑使用专门的并发工具类

通过谨慎使用同步机制，可以在保证线程安全的同时，最大化程序的并发性能。