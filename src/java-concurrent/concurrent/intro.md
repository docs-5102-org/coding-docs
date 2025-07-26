---
title: 概述
category:
  - Java并发编程
tag:
  - java.util.concurrent
---

# Java并发编程：概述

## 目录

[[toc]]

## 简介

Java平台5.0版本引入了高级并发特性，这些特性大多通过`java.util.concurrent`包实现，为开发者提供了强大的并发编程工具。



## 一、Executor框架核心优势

Executor框架通过以下特性提升并发编程体验：

### 任务与执行解耦
- 只需实现`Runnable`任务，无需关心线程创建/销毁
- 传统方式与Executor框架对比：

```java
// 传统线程创建方式
new Thread(new RunnableTask()).start();

// 使用Executor框架
Executor executor = Executors.newFixedThreadPool(10);
executor.execute(new RunnableTask());
```

### 线程池管理
提供自动化的线程生命周期管理，避免频繁创建和销毁线程的开销。

### Callable接口增强
- 支持返回值（替代无返回的Runnable）
- 通过`Future`对象管理任务状态

## 二、Executor接口体系

`java.util.concurrent`包定义了三级接口层次：

### 1. Executor 基础接口

```java
public interface Executor {
    void execute(Runnable command);
}
```

- **核心方法**：提交Runnable任务
- **实现类**：`ThreadPoolExecutor`等

### 2. ExecutorService 扩展接口

```java
public interface ExecutorService extends Executor {
    <T> Future<T> submit(Callable<T> task);
    void shutdown();
    // ...其他生命周期管理方法
}
```

- 支持提交Callable任务
- 提供任务生命周期管理（关闭、等待终止等）

### 3. ScheduledExecutorService 定时任务接口

```java
public interface ScheduledExecutorService extends ExecutorService {
    ScheduledFuture<?> schedule(Runnable command, long delay, TimeUnit unit);
    ScheduledFuture<?> scheduleAtFixedRate(Runnable command, long initialDelay, long period, TimeUnit unit);
}
```

- 支持延迟执行和周期性任务
- 返回`ScheduledFuture`对象

## 三、Future与Callable接口

### 1. Callable接口

```java
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception;
}
```

- 替代Runnable的有返回值任务
- 允许抛出受检异常

### 2. Future接口

```java
public interface Future<V> {
    V get() throws InterruptedException, ExecutionException;
    boolean cancel(boolean mayInterruptIfRunning);
    // ...其他状态查询方法
}
```

- 管理异步任务结果
- 支持取消任务和超时控制

## 四、Executors工厂类

提供便捷的线程池创建方法：

| 方法名称 | 描述 |
|---------|------|
| `newSingleThreadExecutor()` | 创建单线程线程池，确保任务按顺序执行 |
| `newFixedThreadPool(int n)` | 创建固定大小的线程池，重用线程处理新任务 |
| `newCachedThreadPool()` | 缓存型线程池，根据负载动态调整线程数量 |
| `newScheduledThreadPool(int n)` | 创建支持定时任务的线程池，适用于周期性执行场景 |

## 五、核心实现示例

### 1. 基础任务提交

```java
ExecutorService executor = Executors.newFixedThreadPool(5);
executor.execute(() -> System.out.println("Runnable task executed"));
```

### 2. Callable任务与Future

```java
ExecutorService executor = Executors.newSingleThreadExecutor();
Future<String> future = executor.submit(() -> {
    Thread.sleep(1000);
    return "Task completed";
});

try {
    String result = future.get(2, TimeUnit.SECONDS); // 带超时的获取结果
    System.out.println("Result: " + result);
} catch (TimeoutException e) {
    future.cancel(true); // 超时后取消任务
}
```

### 3. 定时任务示例

```java
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
scheduler.scheduleAtFixedRate(
    () -> System.out.println("Scheduled task executed"),
    0,  // 初始延迟
    1,  // 执行间隔
    TimeUnit.SECONDS
);
```

## 六、最佳实践建议

### 优先使用工厂方法
通过`Executors`创建线程池，避免直接使用`ThreadPoolExecutor`构造函数。

### 合理配置线程池参数
- **CPU密集型任务**：线程数≈CPU核心数
- **I/O密集型任务**：线程数可适当增加

### 正确关闭ExecutorService

```java
executor.shutdown();
try {
    if (!executor.awaitTermination(60, TimeUnit.SECONDS)) {
        executor.shutdownNow();
    }
} catch (InterruptedException e) {
    executor.shutdownNow();
}
```

### 监控线程池状态
通过`ThreadPoolExecutor`的`getActiveCount()`等方法监控运行状态。

## 总结

通过掌握Java并发编程的核心工具和最佳实践，开发者可以在保证线程安全的同时显著提升应用性能，简化多线程编程的复杂度。