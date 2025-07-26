---
title: Java并发编程：Executors.newCachedThreadPool
category:
  - Java并发编程
tag:
  - java.util.concurrent
  - newCachedThreadPool
---

# Java并发编程：Executors.newCachedThreadPool

## 目录

[[toc]]

## 概述

`Executors.newCachedThreadPool()` 方法用于创建一个缓存型线程池，该线程池会根据任务负载动态调整线程数量，适用于提交大量短期异步任务的场景。

### 特点

- **动态扩展**：无任务时线程自动回收（60秒空闲后终止）
- **无界队列**：提交的任务直接分配给可用线程
- **线程复用**：优先使用已存在的线程

### 语法

```java
public static ExecutorService newCachedThreadPool()
```

## 创建缓存型线程池

```java
ExecutorService executor = Executors.newCachedThreadPool();
```

## 提交任务

```java
for (int i = 1; i <= 5; i++) {
    final int taskId = i;
    executor.submit(() -> {
        System.out.println("任务" + taskId + "由" + Thread.currentThread().getName() + "执行");
    });
}
```

**输出示例：**
```
任务1由pool-1-thread-1执行
任务2由pool-1-thread-2执行
任务3由pool-1-thread-3执行
任务4由pool-1-thread-4执行
任务5由pool-1-thread-5执行
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

public class CachedThreadPoolDemo {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newCachedThreadPool();
        
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
任务T4由pool-1-thread-4执行
任务T5由pool-1-thread-5执行
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
- 短期异步任务（如HTTP请求处理）
- 任务数量波动较大的场景

### 优势
- 自动适应负载变化
- 减少线程创建/销毁开销

### 注意事项
- 可能因任务激增导致OOM（内存溢出）
- 长期运行的任务不适合此线程池

通过合理使用 `newCachedThreadPool`，可以在任务数量波动的场景中实现高效并发处理。