---
title: ExecutorService接口
category:
  - Java并发编程
tag:
  - ExecutorService
  - java.util.concurrent
---

# Java并发编程：ExecutorService接口

## 目录

[[toc]]

## 概述

`ExecutorService`是Java并发编程中管理线程池和异步任务执行的核心接口，属于`java.util.concurrent`包。它将任务提交与具体执行机制解耦，简化了多线程编程的复杂度。

### 核心功能

`ExecutorService`是`Executor`的子接口，提供以下核心功能：

- **任务管理**：提交Runnable/Callable任务并获取结果
- **生命周期控制**：优雅关闭线程池
- **批量任务处理**：`invokeAll()`、`invokeAny()`等方法

### 关键方法

| 方法名 | 描述 |
|--------|------|
| `submit()` | 提交任务并返回Future对象 |
| `shutdown()` | 优雅关闭，不再接受新任务 |
| `shutdownNow()` | 立即关闭，尝试中断执行中的任务 |
| `awaitTermination()` | 阻塞等待线程池终止 |

## 创建ExecutorService

通过`Executors`工厂类创建不同类型的线程池：

```java
// 固定大小线程池（推荐）
ExecutorService fixedPool = Executors.newFixedThreadPool(10);

// 缓存型线程池（动态扩展）
ExecutorService cachedPool = Executors.newCachedThreadPool();

// 单线程执行器
ExecutorService singlePool = Executors.newSingleThreadExecutor();
```

## 提交任务

### 提交Runnable任务

```java
ExecutorService executor = Executors.newFixedThreadPool(2);
executor.submit(() -> {
    System.out.println("Runnable任务执行于 " + Thread.currentThread().getName());
});
```

### 提交Callable任务

```java
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "Callable任务结果";
});

// 获取结果（带异常处理）
try {
    String result = future.get(2, TimeUnit.SECONDS); // 超时控制
    System.out.println(result);
} catch (TimeoutException e) {
    future.cancel(true); // 超时后取消任务
}
```

## 关闭服务

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

## 完整示例

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

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

public class ExecutorDemo {
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

### 输出示例：

```
任务T1由pool-1-thread-1执行
任务T2由pool-1-thread-2执行
任务T3由pool-1-thread-3执行
任务T4由pool-1-thread-1执行
任务T5由pool-1-thread-2执行
所有任务完成
```

## 处理Callable和Future

```java
class CallableTask implements Callable<String> {
    private final String name;
    
    public CallableTask(String name) { 
        this.name = name; 
    }
    
    @Override
    public String call() throws Exception {
        System.out.println("任务" + name + "执行中");
        Thread.sleep(2000);
        return "结果：" + name;
    }
}

// 使用示例
ExecutorService executor = Executors.newFixedThreadPool(2);
Future<String> future = executor.submit(new CallableTask("订单处理"));

try {
    System.out.println(future.get()); // 阻塞直到结果返回
} catch (ExecutionException e) {
    System.out.println("任务异常: " + e.getCause());
}
```

## 定时任务

```java
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

// 延迟5秒执行
scheduler.schedule(() -> System.out.println("延迟任务执行"), 5, TimeUnit.SECONDS);

// 每3秒执行一次
scheduler.scheduleAtFixedRate(
    () -> System.out.println("定时任务执行"),
    0,  // 初始延迟
    3,  // 执行间隔
    TimeUnit.SECONDS
);
```

## 总结

### 优势
- **线程复用**：避免频繁创建和销毁线程
- **任务解耦**：将任务提交与执行机制分离
- **生命周期管理**：提供完整的线程池管理功能

### 最佳实践
- 优先使用工厂方法创建线程池
- 始终调用`shutdown()`关闭线程池
- 对耗时操作使用`Future`处理异步结果
- 监控线程池状态（`getActiveCount()`等方法）

通过合理使用`ExecutorService`，可以显著提升Java应用的并发性能和可维护性。