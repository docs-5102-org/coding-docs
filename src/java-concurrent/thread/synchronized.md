---
title: 同步机制
category:
  - java线程
tag:
  - synchronized
  - 同步
  - volatile
---

# Java多线程同步机制详解

## 目录

[[toc]]

## 概述

在Java多线程编程中，当多个线程同时访问共享资源时，可能出现数据不一致和竞态条件等问题。Java提供了多种同步机制来解决这些问题，确保线程安全。

本文将详细介绍Java中的同步机制，包括基本概念、使用方法、最佳实践和常见陷阱。

## 为什么需要同步

### 线程不安全的示例

```java
class UnsafeCounter {
    private int count = 0;
    
    public void increment() {
        count++; // 非原子操作：读取 -> 计算 -> 写入
    }
    
    public int getCount() {
        return count;
    }
}

public class UnsafeExample {
    public static void main(String[] args) throws InterruptedException {
        UnsafeCounter counter = new UnsafeCounter();
        
        // 创建两个线程同时执行增量操作
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) {
                counter.increment();
            }
        });
        
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 10000; i++) {
                counter.increment();
            }
        });
        
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        
        System.out.println("期望结果: 20000");
        System.out.println("实际结果: " + counter.getCount());
    }
}
```

**可能的输出结果：**
```
期望结果: 20000
实际结果: 18756  // 结果可能小于20000
```

### 问题分析

`count++` 操作实际包含三个步骤：
1. 从内存读取count的当前值
2. 将值加1
3. 将新值写回内存

当多个线程同时执行这些步骤时，可能出现以下情况：
- 线程A读取count值为100
- 线程B也读取count值为100（此时线程A还未写回）
- 线程A计算101并写回
- 线程B计算101并写回
- 结果：两次increment操作，count只增加了1

## synchronized关键字

`synchronized`是Java中最基本的同步机制，它通过监视器锁（monitor lock）来实现互斥访问。

### 核心概念

- **监视器锁**：每个Java对象都有一个内置锁（也称为监视器锁或内在锁）
- **互斥性**：同一时间只有一个线程可以持有特定对象的锁
- **可见性**：获取锁时会从主内存刷新变量值，释放锁时会将变量值同步到主内存

## 同步方法

### 实例方法同步

```java
class SafeCounter {
    private int count = 0;
    
    public synchronized void increment() {
        count++; // 现在是线程安全的
    }
    
    public synchronized int getCount() {
        return count;
    }
    
    // 非同步方法可以与同步方法并发执行
    public void doSomethingElse() {
        System.out.println("这个方法不需要同步");
    }
}
```

**特点：**
- 锁定的是当前对象实例（this）
- 同一对象的所有同步方法之间互斥
- 同步方法与非同步方法可以并发执行

### 完整示例

```java
public class SynchronizedMethodExample {
    public static void main(String[] args) throws InterruptedException {
        SafeCounter counter = new SafeCounter();
        
        Runnable task = () -> {
            for (int i = 0; i < 10000; i++) {
                counter.increment();
            }
        };
        
        Thread t1 = new Thread(task, "Thread-1");
        Thread t2 = new Thread(task, "Thread-2");
        
        t1.start();
        t2.start();
        t1.join();
        t2.join();
        
        System.out.println("最终计数: " + counter.getCount()); // 输出: 20000
    }
}
```

## 同步代码块

同步代码块提供了更细粒度的同步控制，可以指定锁对象并缩小同步范围。

### 基本语法

```java
public void method() {
    // 非同步代码
    synchronized (lockObject) {
        // 同步代码块
    }
    // 非同步代码
}
```

### 不同锁对象的使用

```java
public class SynchronizedBlockExample {
    private int count1 = 0;
    private int count2 = 0;
    
    // 使用不同的锁对象实现独立同步
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();
    
    public void incrementCount1() {
        synchronized (lock1) {
            count1++;
        }
    }
    
    public void incrementCount2() {
        synchronized (lock2) {
            count2++;
        }
    }
    
    // 这两个方法可以并发执行，因为使用不同的锁
    public void batchIncrement1() {
        synchronized (lock1) {
            for (int i = 0; i < 1000; i++) {
                count1++;
            }
        }
    }
    
    public void batchIncrement2() {
        synchronized (lock2) {
            for (int i = 0; i < 1000; i++) {
                count2++;
            }
        }
    }
}
```

### synchronized方法 vs synchronized(this)

```java
public class SyncComparison {
    private int value = 0;
    
    // 方法1：同步方法
    public synchronized void method1() {
        value++;
        // 整个方法都被锁定
        doOtherWork(); // 这部分也被锁定了
    }
    
    // 方法2：同步代码块
    public void method2() {
        doPreWork(); // 这部分不需要锁定
        
        synchronized (this) {
            value++; // 只锁定关键部分
        }
        
        doPostWork(); // 这部分也不需要锁定
    }
    
    private void doPreWork() { /* 一些不需要同步的操作 */ }
    private void doOtherWork() { /* 一些不需要同步的操作 */ }
    private void doPostWork() { /* 一些不需要同步的操作 */ }
}
```

**关键点：**
- `synchronized`方法等价于`synchronized(this)`包围整个方法体
- 两者使用相同的锁（当前对象实例）
- 同步代码块提供更好的性能，因为锁的持有时间更短

## 静态同步

静态同步使用类级别的锁，所有实例共享同一把锁。

### 静态同步方法

```java
public class StaticSyncExample {
    private static int staticCount = 0;
    private int instanceCount = 0;
    
    // 静态同步方法 - 锁定类对象
    public static synchronized void incrementStatic() {
        staticCount++;
    }
    
    // 实例同步方法 - 锁定实例对象
    public synchronized void incrementInstance() {
        instanceCount++;
    }
    
    public static int getStaticCount() {
        return staticCount;
    }
    
    public int getInstanceCount() {
        return instanceCount;
    }
}
```

### 静态同步代码块

```java
public class StaticSyncBlockExample {
    private static int staticCount = 0;
    
    public static void incrementWithBlock() {
        // 其他非关键操作
        
        synchronized (StaticSyncBlockExample.class) {
            staticCount++; // 只同步关键部分
        }
        
        // 其他非关键操作
    }
    
    // 等价的写法
    public static void anotherIncrement() {
        synchronized (StaticSyncBlockExample.class) {
            staticCount++;
        }
    }
}
```

### 实例锁 vs 类锁

```java
public class LockTypesDemo {
    private static int staticValue = 0;
    private int instanceValue = 0;
    
    // 使用类锁
    public static synchronized void staticMethod1() {
        staticValue++;
    }
    
    public static void staticMethod2() {
        synchronized (LockTypesDemo.class) {
            staticValue++;
        }
    }
    
    // 使用实例锁
    public synchronized void instanceMethod1() {
        instanceValue++;
    }
    
    public void instanceMethod2() {
        synchronized (this) {
            instanceValue++;
        }
    }
    
    public static void main(String[] args) {
        LockTypesDemo obj1 = new LockTypesDemo();
        LockTypesDemo obj2 = new LockTypesDemo();
        
        // 类锁：staticMethod1和staticMethod2之间互斥
        // 实例锁：obj1和obj2的实例方法独立执行，不互斥
    }
}
```

## 锁的可重入性

Java的同步锁是可重入的（reentrant），同一线程可以多次获取已持有的锁。

### 可重入示例

```java
public class ReentrantExample {
    private int count = 0;
    
    public synchronized void outerMethod() {
        System.out.println("进入 outerMethod，当前线程: " + Thread.currentThread().getName());
        count++;
        innerMethod(); // 重入调用
    }
    
    public synchronized void innerMethod() {
        System.out.println("进入 innerMethod，当前线程: " + Thread.currentThread().getName());
        count++;
        deepMethod(); // 继续重入
    }
    
    public synchronized void deepMethod() {
        System.out.println("进入 deepMethod，当前线程: " + Thread.currentThread().getName());
        count++;
    }
    
    public synchronized int getCount() {
        return count;
    }
    
    public static void main(String[] args) {
        ReentrantExample example = new ReentrantExample();
        example.outerMethod();
        System.out.println("最终计数: " + example.getCount());
    }
}
```

**输出：**
```
进入 outerMethod，当前线程: main
进入 innerMethod，当前线程: main
进入 deepMethod，当前线程: main
最终计数: 3
```

### 可重入的原理

每个锁都维护：
- **持有者线程**：当前持有锁的线程
- **重入计数**：同一线程获取锁的次数

当线程获取锁时：
1. 如果锁未被持有，设置持有者并将计数设为1
2. 如果当前线程已持有锁，计数加1
3. 如果其他线程持有锁，当前线程阻塞等待

当线程释放锁时：
1. 计数减1
2. 当计数为0时，释放锁并清空持有者

## volatile关键字

`volatile`关键字确保变量的可见性，但不保证原子性。

### 基本概念

```java
public class VolatileExample {
    private volatile boolean stopFlag = false;
    private volatile int counter = 0;
    
    public void startWorking() {
        new Thread(() -> {
            while (!stopFlag) {
                // 执行工作
                counter++; // 注意：这不是原子操作
            }
            System.out.println("工作线程停止");
        }).start();
    }
    
    public void stopWorking() {
        stopFlag = true; // 立即对所有线程可见
    }
    
    public int getCounter() {
        return counter;
    }
}
```

### volatile vs synchronized

| 特性 | volatile | synchronized |
|------|----------|--------------|
| 可见性 | ✓ | ✓ |
| 原子性 | ✗ | ✓ |
| 阻塞性 | ✗ | ✓ |
| 性能开销 | 低 | 高 |
| 适用场景 | 简单状态标记 | 复杂临界区 |

### 适用场景

```java
public class VolatileUseCases {
    // 1. 状态标记
    private volatile boolean initialized = false;
    
    public void init() {
        // 执行初始化
        initialized = true; // 状态变更对所有线程可见
    }
    
    public boolean isInitialized() {
        return initialized;
    }
    
    // 2. 单例模式的双重检查锁定
    private static volatile VolatileUseCases instance;
    
    public static VolatileUseCases getInstance() {
        if (instance == null) {
            synchronized (VolatileUseCases.class) {
                if (instance == null) {
                    instance = new VolatileUseCases();
                }
            }
        }
        return instance;
    }
    
    // 3. 不适用的场景（需要原子性）
    private volatile int count = 0;
    
    public void wrongIncrement() {
        count++; // 不安全！需要使用synchronized或AtomicInteger
    }
}
```

## wait()和notify()机制

`wait()`和`notify()`提供了线程间的通信机制，必须在同步块中使用。

### 基本用法

```java
public class WaitNotifyExample {
    private final Object lock = new Object();
    private boolean condition = false;
    private String data = "";
    
    // 消费者线程
    public void consumer() throws InterruptedException {
        synchronized (lock) {
            while (!condition) {
                System.out.println("消费者等待数据...");
                lock.wait(); // 释放锁并等待
            }
            System.out.println("消费者接收到数据: " + data);
            condition = false; // 重置条件
        }
    }
    
    // 生产者线程
    public void producer(String newData) {
        synchronized (lock) {
            data = newData;
            condition = true;
            System.out.println("生产者生产数据: " + data);
            lock.notify(); // 唤醒一个等待的线程
        }
    }
}
```

### 生产者-消费者模式

```java
import java.util.LinkedList;
import java.util.Queue;

public class ProducerConsumerExample {
    private final Queue<Integer> queue = new LinkedList<>();
    private final int MAX_SIZE = 5;
    private final Object lock = new Object();
    
    public void produce(int item) throws InterruptedException {
        synchronized (lock) {
            while (queue.size() == MAX_SIZE) {
                System.out.println("队列已满，生产者等待...");
                lock.wait();
            }
            
            queue.offer(item);
            System.out.println("生产: " + item + "，队列大小: " + queue.size());
            lock.notifyAll(); // 唤醒所有等待的线程
        }
    }
    
    public int consume() throws InterruptedException {
        synchronized (lock) {
            while (queue.isEmpty()) {
                System.out.println("队列为空，消费者等待...");
                lock.wait();
            }
            
            int item = queue.poll();
            System.out.println("消费: " + item + "，队列大小: " + queue.size());
            lock.notifyAll(); // 唤醒所有等待的线程
            return item;
        }
    }
    
    public static void main(String[] args) {
        ProducerConsumerExample example = new ProducerConsumerExample();
        
        // 创建生产者线程
        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    example.produce(i);
                    Thread.sleep(100);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        // 创建消费者线程
        Thread consumer = new Thread(() -> {
            try {
                for (int i = 1; i <= 10; i++) {
                    example.consume();
                    Thread.sleep(150);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        producer.start();
        consumer.start();
    }
}
```

### 注意事项

1. **必须在同步块中使用**：`wait()`、`notify()`和`notifyAll()`必须在对应对象的同步块中调用
2. **使用while循环检查条件**：避免虚假唤醒问题
3. **notify() vs notifyAll()**：
   - `notify()`：唤醒一个等待的线程
   - `notifyAll()`：唤醒所有等待的线程

## 高级同步工具

Java并发包（`java.util.concurrent`）提供了更高级的同步工具。

### ReentrantLock

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
    
    // 尝试获取锁
    public boolean tryIncrement() {
        if (lock.tryLock()) {
            try {
                count++;
                return true;
            } finally {
                lock.unlock();
            }
        }
        return false; // 获取锁失败
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

### ReadWriteLock

```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ReadWriteLockExample {
    private final ReadWriteLock rwLock = new ReentrantReadWriteLock();
    private String data = "initial data";
    
    // 读操作 - 可以并发执行
    public String read() {
        rwLock.readLock().lock();
        try {
            System.out.println("读取数据: " + data);
            return data;
        } finally {
            rwLock.readLock().unlock();
        }
    }
    
    // 写操作 - 独占执行
    public void write(String newData) {
        rwLock.writeLock().lock();
        try {
            System.out.println("写入数据: " + newData);
            data = newData;
        } finally {
            rwLock.writeLock().unlock();
        }
    }
}
```

### AtomicInteger

```java
import java.util.concurrent.atomic.AtomicInteger;

public class AtomicExample {
    private final AtomicInteger count = new AtomicInteger(0);
    
    public void increment() {
        count.incrementAndGet(); // 原子操作
    }
    
    public int getCount() {
        return count.get();
    }
    
    // 比较并交换
    public boolean compareAndSet(int expected, int update) {
        return count.compareAndSet(expected, update);
    }
}
```

## 性能考虑

### 同步的性能开销

```java
public class PerformanceBenchmark {
    private int count = 0;
    private final Object lock = new Object();
    private final AtomicInteger atomicCount = new AtomicInteger(0);
    
    // 最快 - 无同步（但不安全）
    public void unsafeIncrement() {
        count++;
    }
    
    // 较慢 - 同步方法
    public synchronized void syncMethodIncrement() {
        count++;
    }
    
    // 较慢 - 同步块
    public void syncBlockIncrement() {
        synchronized (lock) {
            count++;
        }
    }
    
    // 较快 - 原子操作
    public void atomicIncrement() {
        atomicCount.incrementAndGet();
    }
    
    // 性能测试
    public static void benchmark(String name, Runnable operation, int iterations) {
        long start = System.nanoTime();
        for (int i = 0; i < iterations; i++) {
            operation.run();
        }
        long end = System.nanoTime();
        System.out.printf("%s: %.2f ms%n", name, (end - start) / 1_000_000.0);
    }
    
    public static void main(String[] args) {
        PerformanceBenchmark benchmark = new PerformanceBenchmark();
        int iterations = 10_000_000;
        
        benchmark(name: "无同步", benchmark::unsafeIncrement, iterations);
        benchmark("同步方法", benchmark::syncMethodIncrement, iterations);
        benchmark("同步块", benchmark::syncBlockIncrement, iterations);
        benchmark("原子操作", benchmark::atomicIncrement, iterations);
    }
}
```

### 性能优化策略

1. **减少锁的范围**：只锁定必要的代码
2. **选择合适的同步机制**：
   - 简单操作使用原子类
   - 读多写少使用读写锁
   - 复杂逻辑使用ReentrantLock
3. **避免锁竞争**：使用不同的锁对象
4. **考虑无锁数据结构**：如ConcurrentHashMap

## 最佳实践

### 1. 锁的选择和使用

```java
public class BestPracticesExample {
    // 1. 使用private final锁对象
    private final Object lock = new Object();
    private int value = 0;
    
    // 2. 锁的范围尽可能小
    public void goodPractice() {
        doPreparation(); // 不需要同步的预处理
        
        synchronized (lock) {
            value++; // 只同步关键部分
        }
        
        doCleanup(); // 不需要同步的后处理
    }
    
    // 3. 避免在锁内调用外部方法
    public void badPractice() {
        synchronized (lock) {
            value++;
            externalMethod(); // 危险：可能导致死锁
        }
    }
    
    // 4. 使用try-finally确保锁释放（针对显式锁）
    private final ReentrantLock explicitLock = new ReentrantLock();
    
    public void safeExplicitLock() {
        explicitLock.lock();
        try {
            // 关键代码
        } finally {
            explicitLock.unlock();
        }
    }
    
    private void doPreparation() { /* 准备工作 */ }
    private void doCleanup() { /* 清理工作 */ }
    private void externalMethod() { /* 外部方法调用 */ }
}
```

### 2. 死锁预防

```java
public class DeadlockPrevention {
    private static final Object lock1 = new Object();
    private static final Object lock2 = new Object();
    
    // 方法1：按固定顺序获取锁
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
    
    // 方法2：使用超时机制
    private final ReentrantLock lockA = new ReentrantLock();
    private final ReentrantLock lockB = new ReentrantLock();
    
    public boolean tryWithTimeout() {
        boolean acquiredA = false, acquiredB = false;
        try {
            acquiredA = lockA.tryLock(1, TimeUnit.SECONDS);
            if (acquiredA) {
                acquiredB = lockB.tryLock(1, TimeUnit.SECONDS);
                if (acquiredB) {
                    // 执行业务逻辑
                    return true;
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            if (acquiredB) lockB.unlock();
            if (acquiredA) lockA.unlock();
        }
        return false;
    }
}
```

### 3. 不可变对象

```java
public final class ImmutableCounter {
    private final int value;
    
    public ImmutableCounter(int value) {
        this.value = value;
    }
    
    public int getValue() {
        return value;
    }
    
    public ImmutableCounter increment() {
        return new ImmutableCounter(value + 1);
    }
    
    public ImmutableCounter add(int delta) {
        return new ImmutableCounter(value + delta);
    }
}

// 使用示例
public class ImmutableExample {
    private volatile ImmutableCounter counter = new ImmutableCounter(0);
    
    public void increment() {
        // 无需同步，使用CAS操作
        ImmutableCounter current, updated;
        do {
            current = counter;
            updated = current.increment();
        } while (!compareAndSet(current, updated));
    }
    
    private boolean compareAndSet(ImmutableCounter expected, ImmutableCounter update) {
        // 简化的CAS操作示例
        synchronized (this) {
            if (counter == expected) {
                counter = update;
                return true;
            }
            return false;
        }
    }
}
```

## 常见陷阱

### 1. 锁对象选择错误

```java
public class LockObjectMistakes {
    // ❌ 错误：使用可变对象作为锁
    private Integer count = 0;
    
    public void badLock() {
        synchronized (count) { // 危险：count对象可能改变
            count++;
        }
    }
    
    // ❌ 错误：使用字符串字面量作为锁
    private final String LOCK = "LOCK";
    
    public void stringLock() {
        synchronized (LOCK) { // 危险：字符串可能被其他代码复用
            // 业务逻辑
        }
    }
    
    // ✅ 正确：使用专门的锁对象
    private final Object lock = new Object();
    private int value = 0;
    
    public void correctLock() {
        synchronized (lock) {
            value++;
        }
    }
}
```

### 2. 同步方法的继承问题

```java
class Parent {
    public synchronized void method() {
        System.out.println("Parent method");
    }
}

class Child extends Parent {
    // ❌ 错误：子类方法不自动同步
    @Override
    public void method() { // 没有synchronized关键字
        System.out.println("Child method");
        super.method(); // 调用父类同步方法
    }
    
    // ✅ 正确：显式添加synchronized
    public synchronized void correctMethod() {
        System.out.println("Child synchronized method");
    }
}
```

### 3. 集合类的同步陷阱

```java
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class CollectionSyncTraps {
    // ❌ 错误：Vector是同步的，但组合操作不是原子的
    private final Vector<Integer> vector = new Vector<>();
    
    public void badVectorUsage() {
        if (!vector.isEmpty()) { // 检查
            vector.remove(0); // 操作 - 可能抛出异常
        }
    }
    
    // ✅ 正确：手动同步组合操作
    public void correctVectorUsage() {
        synchronized (vector) {
            if (!vector.isEmpty()) {
                vector.remove(0);
            }
        }
    }
    
    // ✅ 更好：使用并发集合
    private final Map<String, Integer> concurrentMap = new ConcurrentHashMap<>();
    
    public void safeConcurrentMapUsage() {
        // 原子操作：如果键不存在则添加
        concurrentMap.putIfAbsent("key", 1);
        
        // 原子操作：计算并更新
        concurrentMap.compute("key", (k, v) -> v == null ? 1 : v + 1);
    }
}
```

### 4. wait()和notify()的误用

```java
public class WaitNotifyMistakes {
    private final Object lock = new Object();
    private boolean condition = false;
    
    // ❌ 错误：使用if而不是while
    public void badWait() throws InterruptedException {
        synchronized (lock) {
            if (!condition) { // 危险：虚假唤醒
                lock.wait();
            }
            // 处理逻辑
        }
    }
    
    // ✅ 正确：使用while循环
    public void correctWait() throws InterruptedException {
        synchronized (lock) {
            while (!condition) { // 防止虚假唤醒
                lock.wait();
            }
            // 处理逻辑
        }
    }
    
    // ❌ 错误：在同步块外调用wait()
    public void wrongWaitUsage() throws InterruptedException {
        lock.wait(); // 抛出IllegalMonitorStateException
    }
}
```

### 5. 性能陷阱

```java
public class PerformanceTraps {
    // ❌ 错误：过度同步
    private final List<String> list = new ArrayList<>();
    
    public synchronized void addItem(String item) {
        list.add(item); // 整个方法被锁定
        logOperation(item); // 日志操作也被锁定了
        validateItem(item); // 验证操作也被锁定了
    }
    
    // ✅ 正确：最小化同步范围
    public void optimizedAddItem(String item) {
        validateItem(item); // 预先验证，无需同步
        
        synchronized (list) {
            list.add(item); // 只同步关键操作
        }
        
        logOperation(item); // 日志操作，无需同步
    }
    
    private void logOperation(String item) { /* 日志记录 */ }
    private void validateItem(String item) { /* 验证逻辑 */ }
}
```

## 实际应用场景

### 1. 单例模式实现

```java
// 双重检查锁定单例
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() {}
    
    public static Singleton getInstance() {
        if (instance == null) { // 第一次检查
            synchronized (Singleton.class) {
                if (instance == null) { // 第二次检查
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 枚举单例（推荐）
public enum SingletonEnum {
    INSTANCE;
    
    public void doSomething() {
        // 业务逻辑
    }
}
```

### 2. 线程安全的缓存

```java
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ThreadSafeCache<K, V> {
    private final Map<K, V> cache = new ConcurrentHashMap<>();
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    
    public V get(K key) {
        return cache.get(key);
    }
    
    public void put(K key, V value) {
        cache.put(key, value);
    }
    
    public void clear() {
        cache.clear();
    }
    
    // 复杂操作需要额外同步
    public V computeIfAbsent(K key, Function<K, V> mappingFunction) {
        return cache.computeIfAbsent(key, mappingFunction);
    }
}
```

### 3. 线程池任务管理

```java
import java.util.concurrent.*;

public class TaskManager {
    private final ExecutorService executor = Executors.newFixedThreadPool(10);
    private final Map<String, Future<?>> runningTasks = new ConcurrentHashMap<>();
    
    public void submitTask(String taskId, Runnable task) {
        Future<?> future = executor.submit(() -> {
            try {
                task.run();
            } finally {
                runningTasks.remove(taskId);
            }
        });
        
        runningTasks.put(taskId, future);
    }
    
    public boolean cancelTask(String taskId) {
        Future<?> future = runningTasks.get(taskId);
        if (future != null) {
            boolean cancelled = future.cancel(true);
            if (cancelled) {
                runningTasks.remove(taskId);
            }
            return cancelled;
        }
        return false;
    }
    
    public void shutdown() {
        // 取消所有运行中的任务
        runningTasks.values().forEach(future -> future.cancel(true));
        runningTasks.clear();
        
        executor.shutdown();
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }
}
```

## 调试和监控

### 1. 死锁检测

```java
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;

public class DeadlockDetector {
    private final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
    
    public void detectDeadlock() {
        long[] deadlockedThreads = threadBean.findDeadlockedThreads();
        if (deadlockedThreads != null) {
            System.err.println("检测到死锁！涉及线程数量: " + deadlockedThreads.length);
            for (long threadId : deadlockedThreads) {
                ThreadInfo threadInfo = threadBean.getThreadInfo(threadId);
                System.err.println("死锁线程: " + threadInfo.getThreadName());
                System.err.println("状态: " + threadInfo.getThreadState());
                System.err.println("锁信息: " + threadInfo.getLockInfo());
            }
        }
    }
    
    // 定期检查死锁
    public void startDeadlockMonitoring() {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
        scheduler.scheduleAtFixedRate(this::detectDeadlock, 0, 10, TimeUnit.SECONDS);
    }
}
```

### 2. 同步性能监控

```java
public class SyncMonitor {
    private final AtomicLong syncCount = new AtomicLong(0);
    private final AtomicLong totalWaitTime = new AtomicLong(0);
    
    public void monitoredSync(Runnable task) {
        long startTime = System.nanoTime();
        syncCount.incrementAndGet();
        
        synchronized (this) {
            long waitTime = System.nanoTime() - startTime;
            totalWaitTime.addAndGet(waitTime);
            task.run();
        }
    }
    
    public void printStatistics() {
        long count = syncCount.get();
        long totalWait = totalWaitTime.get();
        
        System.out.println("同步调用次数: " + count);
        System.out.println("总等待时间: " + totalWait / 1_000_000 + " ms");
        if (count > 0) {
            System.out.println("平均等待时间: " + (totalWait / count) / 1_000 + " μs");
        }
    }
}
```

## 总结

Java的同步机制是多线程编程的核心工具，正确使用这些机制对于构建高性能、线程安全的应用程序至关重要。

### 关键要点回顾

1. **基础同步机制**
   - `synchronized`关键字是最基本的同步工具
   - 理解实例锁vs类锁的区别
   - 掌握可重入锁的概念

2. **高级同步工具**
   - `volatile`关键字用于保证可见性
   - `wait()`/`notify()`用于线程间通信
   - `java.util.concurrent`包提供更强大的工具

3. **性能优化**
   - 最小化同步范围
   - 选择合适的同步机制
   - 考虑使用并发数据结构

4. **最佳实践**
   - 使用私有final锁对象
   - 避免在锁内调用外部方法
   - 预防死锁的发生

5. **常见陷阱**
   - 锁对象选择错误
   - 组合操作的原子性问题
   - 过度同步导致的性能问题

### 选择指南

| 场景 | 推荐方案 | 说明 |
|------|----------|------|
| 简单状态标记 | `volatile` | 轻量级，保证可见性 |
| 简单原子操作 | `AtomicXxx` | 无锁，高性能 |
| 一般同步需求 | `synchronized` | 简单易用，JVM优化良好 |
| 复杂同步逻辑 | `ReentrantLock` | 功能丰富，灵活控制 |
| 读多写少 | `ReadWriteLock` | 提高读操作并发性 |
| 线程间通信 | `wait`/`notify` 或 `BlockingQueue` | 根据复杂度选择 |
| 高并发集合 | `ConcurrentHashMap` 等 | 专门优化的并发容器 |

### 学习建议

1. **理论与实践结合**：通过编写测试程序验证同步机制的行为
2. **性能测试**：对比不同同步方案的性能差异
3. **工具使用**：学会使用JConsole、VisualVM等工具分析线程状态
4. **源码阅读**：深入了解JDK并发类的实现原理
5. **持续学习**：关注Java新版本中的并发改进

掌握Java同步机制需要大量的实践和经验积累。从简单的`synchronized`开始，逐步学习更高级的并发工具，并在实际项目中应用这些知识，才能真正掌握多线程编程的精髓。