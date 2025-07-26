---
title: Callable与Future区分
category:
  - Java并发编程
tag:
  - ExecutorService
  - java.util.concurrent
---

# Java并发编程：Callable与Future

`Callable` 和 `Future` 是Java并发编程中处理异步任务的核心接口，属于 `java.util.concurrent` 包。`Callable` 类似于 `Runnable`，但支持返回结果和抛出受检异常；`Future` 则代表异步计算的结果，提供任务状态管理和结果获取功能。

## 目录

[[toc]]

## 1. Callable接口

`Callable` 是一个函数式接口，定义如下：

```java
@FunctionalInterface
public interface Callable<V> {
    V call() throws Exception;
}
```

### 特性：

- 支持返回泛型结果 `V`
- 允许抛出受检异常
- 替代无返回值的 `Runnable`

## 2. Future接口

`Future` 代表异步任务的结果，核心方法：

| 方法名 | 描述 |
|--------|------|
| `V get()` | 阻塞直到任务完成，返回结果或抛出异常 |
| `boolean cancel(boolean mayInterrupt)` | 尝试取消任务（mayInterrupt为true时中断执行线程） |
| `boolean isDone()` | 检查任务是否完成（正常结束、异常或取消） |
| `boolean isCancelled()` | 检查任务是否在完成前被取消 |

## 3. 与ExecutorService协同使用

通过 `ExecutorService` 提交 `Callable` 任务：

```java
ExecutorService executor = Executors.newFixedThreadPool(2);
Future<Integer> future = executor.submit(() -> {
    Thread.sleep(2000);
    return 123;
});
```

## 4. 基础使用示例

```java
import java.util.concurrent.*;

class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        Thread.sleep(2000); // 模拟耗时操作
        return 123;
    }
}

public class CallableFutureDemo {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<Integer> future = executor.submit(new MyCallable());
        
        System.out.println("任务已提交");
        
        try {
            int result = future.get(); // 阻塞直到结果返回
            System.out.println("任务结果：" + result);
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        } finally {
            executor.shutdown();
        }
    }
}
```

**输出：**
```
任务已提交
任务结果：123
```

## 5. 异常处理示例

```java
Future<String> future = executor.submit(() -> {
    throw new RuntimeException("业务逻辑异常");
});

try {
    String result = future.get();
} catch (ExecutionException e) {
    System.out.println("捕获任务异常：" + e.getCause().getMessage());
}
```

**输出：**
```
捕获任务异常：业务逻辑异常
```

## 6. 任务取消示例

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
        future.cancel(true); // 中断执行中的线程
    }
}, 2, TimeUnit.SECONDS);
```

**输出：**
```
任务被中断
```

## 7. 总结

- **Callable优势**：支持返回值和异常处理
- **Future功能**：
  - 异步结果获取
  - 任务状态监控
  - 超时控制与取消
- **最佳实践**：
  - 始终设置 `get()` 方法的超时时间
  - 使用 `CompletableFuture` 实现更复杂的异步编排
  - 对可取消任务调用 `cancel(true)`

通过 `Callable` 和 `Future` 的组合，开发者可以高效地管理异步任务，提升Java应用的并发性能。