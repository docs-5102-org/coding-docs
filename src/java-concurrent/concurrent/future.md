---
title: Future接口
category:
  - Java并发编程
tag:
  - ExecutorService
  - java.util.concurrent
---

# Java并发编程：Future接口

`Future` 是Java并发编程中用于管理异步任务的核心接口，属于 `java.util.concurrent` 包。它代表异步计算的结果，提供检查任务状态、等待结果和取消任务等功能。

## 目录

[[toc]]

## 1. 概述

`Future` 接口的核心功能：

- **异步结果管理**：通过 `get()` 方法获取任务结果
- **任务状态查询**：`isDone()` 检查任务是否完成
- **任务控制**：`cancel()` 取消任务执行

### 典型使用场景

```java
ExecutorService executor = Executors.newSingleThreadExecutor();
Future<Integer> future = executor.submit(() -> {
    Thread.sleep(2000);
    return 123;
});
```

## 2. 核心方法

| 方法名 | 描述 |
|--------|------|
| `V get()` | 阻塞直到任务完成，返回结果或抛出异常 |
| `V get(long timeout, TimeUnit unit)` | 带超时的阻塞获取结果 |
| `boolean cancel(boolean mayInterrupt)` | 尝试取消任务（mayInterrupt为true时中断执行中的线程） |
| `boolean isCancelled()` | 检查任务是否在完成前被取消 |
| `boolean isDone()` | 检查任务是否完成（正常结束、异常或取消） |

## 3. 使用示例

```java
import java.util.concurrent.*;

class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        Thread.sleep(2000); // 模拟耗时操作
        return 123;
    }
}

public class FutureDemo {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<Integer> future = executor.submit(new MyCallable());
        
        System.out.println("任务已提交");
        
        try {
            int result = future.get(3, TimeUnit.SECONDS); // 等待3秒
            System.out.println("任务结果：" + result);
        } catch (TimeoutException e) {
            future.cancel(true); // 超时后取消任务
            System.out.println("任务超时，已取消");
        } catch (InterruptedException | ExecutionException e) {
            System.out.println("任务异常：" + e.getMessage());
        } finally {
            executor.shutdown();
        }
    }
}
```

**输出示例：**
```
任务已提交
任务结果：123
```

## 4. 取消任务

```java
Future<?> future = executor.submit(() -> {
    try {
        Thread.sleep(5000);
    } catch (InterruptedException e) {
        System.out.println("任务被中断");
    }
});

// 延迟2秒后取消任务
executor.schedule(() -> {
    if (!future.isDone()) {
        future.cancel(true);
    }
}, 2, TimeUnit.SECONDS);
```

**输出示例：**
```
任务被中断
```

## 5. 异常处理

```java
Future<String> future = executor.submit(() -> {
    throw new RuntimeException("模拟业务异常");
});

try {
    String result = future.get();
} catch (ExecutionException e) {
    System.out.println("捕获任务异常：" + e.getCause().getMessage());
}
```

**输出示例：**
```
捕获任务异常：模拟业务异常
```

## 6. 总结

- **适用场景**：异步计算、非阻塞IO操作
- **最佳实践**：
  - 始终设置 `get()` 方法的超时时间
  - 对可取消任务调用 `cancel(true)`
  - 使用 `isDone()` 避免不必要的阻塞
  - 优先使用 `CompletableFuture` 替代原始Future

通过合理使用 `Future` 接口，可以显著提升Java应用的异步编程能力。