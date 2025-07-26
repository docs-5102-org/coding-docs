---
title: Java并发编程：Executors.newSingleThreadExecutor
category:
  - Java并发编程
tag:
  - java.util.concurrent
  - newSingleThreadExecutor
---

# Java并发编程：Executors.newSingleThreadExecutor

## 目录

[[toc]]

## 概述

`Executors.newSingleThreadExecutor()` 方法用于创建一个使用单个工作线程的 ExecutorService，任务将按提交顺序串行执行。

### 特点

- **单线程执行**：确保任务按顺序执行
- **无界队列**：未执行的任务在队列中等待
- **线程复用**：唯一线程自动回收利用

### 语法

```java
public static ExecutorService newSingleThreadExecutor()
```

## 创建单线程执行器

```java
ExecutorService executor = Executors.newSingleThreadExecutor();
```

## 提交任务

```java
for (int i = 1; i <= 5; i++) {
    final int taskId = i;
    executor.submit(() -> {
        System.out.println("任务" + taskId + "由" + Thread.currentThread().getName() + "执行");
        try { 
            Thread.sleep(1000); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
    });
}
```

**输出示例：**
```
任务1由pool-1-thread-1执行
任务2由pool-1-thread-1执行
任务3由pool-1-thread-1执行
任务4由pool-1-thread-1执行
任务5由pool-1-thread-1执行
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
            Thread.sleep(1000); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
    }
}

public class SingleThreadDemo {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        
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
任务T2由pool-1-thread-1执行
任务T3由pool-1-thread-1执行
任务T4由pool-1-thread-1执行
任务T5由pool-1-thread-1执行
所有任务完成
```

## 关闭执行器

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
- 需要保证任务顺序执行
- 资源敏感型应用（限制线程数量）

### 优势
- 自动管理线程生命周期
- 避免线程频繁创建/销毁开销

### 注意事项
- 无界队列可能导致OOM（内存溢出）
- 单线程可能成为性能瓶颈

通过合理使用 `newSingleThreadExecutor`，可以在需要顺序执行任务的场景中实现高效并发控制。