---
title: CountDownLatch应用
category:
  - Java并发编程
tag:
  - CountDownLatch
  - java.util.concurrent
---

# CountDownLatch 并发工具源码分析

## 目录

[[toc]]

## 概述

`java.util.concurrent.CountDownLatch` 是Java并发包中的一个重要同步工具类，它是一个并发构造，允许一个或多个线程等待其他线程完成特定操作后再继续执行。CountDownLatch基于AQS（AbstractQueuedSynchronizer）实现，提供了一种灵活的线程同步机制。

## 核心特性

- **一次性使用**：CountDownLatch是一次性的，计数器减到0后无法重置
- **线程安全**：支持多线程环境下的安全操作
- **灵活性**：可以用于线程间同步，也可以用于单线程内的步骤同步
- **超时支持**：提供带超时的等待机制

## 应用场景

### 典型场景：Excel多Sheet解析

假设有这样一个需求：需要解析一个Excel文件中的多个Sheet数据，可以考虑使用多线程，每个线程解析一个Sheet，等到所有Sheet都解析完成后，主线程才提示解析完成。

### 传统解决方案：join()方法

```java
public class JoinCountDownLatchTest {
    public static void main(String[] args) throws InterruptedException {
        Thread parser1 = new Thread(new Runnable() {
            @Override
            public void run() {
                // 解析Sheet1的逻辑
            }
        });
        
        Thread parser2 = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("parser2 finish");
                // 解析Sheet2的逻辑
            }
        });
        
        parser1.start();
        parser2.start();
        parser1.join();
        parser2.join();
        System.out.println("all parser finish");
    }
}
```

#### join()方法原理

join()方法用于让当前执行线程等待join线程执行结束。其实现原理是不停检查join线程是否存活，如果join线程存活则让当前线程永远等待：

```java
while (isAlive()) {
    wait(0);  // wait(0)表示永远等待下去
}
```

当join线程中止后，线程的`this.notifyAll()`方法会被调用（在JVM层面实现）。

## CountDownLatch实现方案

### 基本用法示例

```java
public class CountDownLatchTest {
    static CountDownLatch c = new CountDownLatch(2);
    
    public static void main(String[] args) throws InterruptedException {
        new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println(1);
                c.countDown();  // 计数器减1
                System.out.println(2);
                c.countDown();  // 计数器再减1
            }
        }).start();
        
        c.await();  // 等待计数器变为0
        System.out.println("3");
    }
}
```

### 核心API

#### 1. 构造函数
```java
public CountDownLatch(int count)
```
- **参数**：`count` - 初始计数值
- **说明**：如果想等待N个点完成，这里就传入N

#### 2. countDown()方法  
```java
public void countDown()
```
- **功能**：使计数器减1
- **特点**：可以在任何地方调用，N个点可以是N个线程，也可以是1个线程里的N个执行步骤

#### 3. await()方法
```java
public void await() throws InterruptedException
public boolean await(long timeout, TimeUnit unit) throws InterruptedException
```
- **功能**：阻塞当前线程，直到计数器变成0
- **超时版本**：等待指定时间后不再阻塞，返回false表示超时

## CountDownLatch vs join()

| 特性 | CountDownLatch | join() |
|-----|----------------|--------|
| **灵活性** | 高，可用于任意场景 | 低，只能等待线程结束 |
| **粒度控制** | 支持步骤级控制 | 只支持线程级控制 |
| **超时支持** | 支持带超时的await | 支持带超时的join |
| **重用性** | 一次性使用 | 每个线程可重复join |
| **性能** | 基于AQS，性能较好 | 基于wait/notify |

## 实际应用建议

### 1. 多线程任务协调
使用CountDownLatch协调多个工作线程和主线程：

```java
CountDownLatch latch = new CountDownLatch(workThreadCount);
// 在每个工作线程完成时调用latch.countDown()
// 主线程调用latch.await()等待所有工作完成
```

### 2. 处理超时场景
对于可能处理较慢的任务，建议使用带超时的await方法：

```java
if (!latch.await(30, TimeUnit.SECONDS)) {
    // 处理超时情况
    System.out.println("任务执行超时");
}
```

### 3. 异常处理
在使用CountDownLatch时，需要确保在异常情况下也能正确调用countDown()：

```java
try {
    // 执行业务逻辑
} finally {
    latch.countDown();  // 确保计数器能够正确递减
}
```

## 总结

CountDownLatch是Java并发编程中的重要工具，相比传统的join()方法，它提供了更灵活的线程同步机制。通过合理使用CountDownLatch，可以优雅地解决多线程协调问题，特别适用于主线程需要等待多个工作线程完成任务的场景。

在实际使用中，需要注意CountDownLatch的一次性特点，以及在异常处理时确保countDown()方法的正确调用，避免造成线程永久阻塞。