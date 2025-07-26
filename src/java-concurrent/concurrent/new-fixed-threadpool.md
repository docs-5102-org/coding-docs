---
title: Java并发编程：Executors.newFixedThreadPool
category:
  - Java并发编程
tag:
  - java.util.concurrent
  - newFixedThreadPool
---

# Java并发编程：Executors.newFixedThreadPool

## 目录

[[toc]]

## 概述

`Executors.newFixedThreadPool()` 方法用于创建一个固定大小的线程池，适用于需要控制并发线程数量的场景。

### 特点

- **固定线程数**：通过参数指定线程数量
- **无界队列**：未执行的任务在队列中等待
- **线程复用**：线程执行完任务后返回池中

### 语法

```java
public static ExecutorService newFixedThreadPool(int nThreads)
```

**参数说明：**
- `nThreads`：线程池中线程的数量

## 创建固定线程池

```java
ExecutorService executor = Executors.newFixedThreadPool(3); // 创建含3个线程的线程池
```

## 提交任务

```java
for (int i = 1; i <= 5; i++) {
    final int taskId = i;
    executor.submit(() -> {
        System.out.println("任务" + taskId + "由" + Thread.currentThread().getName() + "执行");
        try { 
            Thread.sleep(2000); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
    });
}
```

**输出示例：**
```
任务1由pool-1-thread-1执行
任务2由pool-1-thread-2执行
任务3由pool-1-thread-3执行
任务4由pool-1-thread-1执行
任务5由pool-1-thread-2执行
```

## 完整示例

```java
import java.util.concurrent.*;

class Task implements Runnable {
    private final String name;
    
    public Task(String name) { 
        this.name = name; 
    }
    
    @Override
    public void run() {
        System.out.println("任务" + name + "由" + Thread.currentThread().getName() + "执行");
        try { 
            Thread.sleep(2000); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
    }
}

public class FixedThreadPoolDemo {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(3);
        
        for (int i = 1; i <= 5; i++) {
            executor.submit(new Task("T" + i));
        }
        
        executor.shutdown();
        
        try {
            if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
        }
        
        System.out.println("所有任务完成");
    }
}
```

**输出：**
```
任务T1由pool-1-thread-1执行
任务T2由pool-1-thread-2执行
任务T3由pool-1-thread-3执行
任务T4由pool-1-thread-1执行
任务T5由pool-1-thread-2执行
所有任务完成
```

## 关闭线程池

### 优雅关闭流程

```java
executor.shutdown(); // 不再接受新任务

try {
    if (!executor.awaitTermination(60, TimeUnit.SECONDS)) { // 等待60秒
        executor.shutdownNow(); // 强制关闭
    }
} catch (InterruptedException e) {
    executor.shutdownNow();
}
```

## 总结

### 适用场景
- 需要控制并发线程数的计算密集型任务
- 防止资源耗尽的场景

### 优势
- 线程数量固定，避免上下文切换开销
- 无界队列自动缓冲任务

### 注意事项
- 无界队列可能导致内存溢出
- 线程数应根据硬件资源合理配置

通过 `newFixedThreadPool` 可以有效管理并发线程，提升Java应用的性能和稳定性。