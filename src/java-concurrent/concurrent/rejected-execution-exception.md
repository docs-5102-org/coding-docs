---
title: RejectedExecutionException产生的原因
category:
  - Java并发编程
tag:
  - java.util.concurrent
  - RejectedExecutionException
---

# RejectedExecutionException产生的原因

## 概述

`RejectedExecutionException` 是Java并发编程中常见的运行时异常，发生在线程池无法接受新任务时。理解其产生原因对于编写稳定的多线程应用程序至关重要。

## 主要产生原因

### 1. 线程池已关闭

当线程池调用 `shutdown()` 或 `shutdownNow()` 方法后，再向其提交新任务时会抛出此异常。

**触发条件：**
- 线程池状态为SHUTDOWN或STOP
- 拒绝策略为 `ThreadPoolExecutor.AbortPolicy`（默认策略）

**示例代码：**
```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;

public class ShutdownExample {
    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        
        // 提交第一个任务
        executor.execute(() -> {
            System.out.println("Task 1 executing");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
        
        // 关闭线程池
        executor.shutdown();
        
        // 尝试提交新任务 - 将抛出RejectedExecutionException
        try {
            executor.execute(() -> System.out.println("Task 2 executing"));
        } catch (RejectedExecutionException e) {
            System.err.println("任务被拒绝：线程池已关闭");
        }
    }
}
```

### 2. 线程池资源耗尽

当线程池的工作线程数达到最大值且任务队列已满时，新提交的任务会被拒绝。

**触发条件：**
- 活跃线程数 = maximumPoolSize
- 任务队列已满（有界队列）
- 拒绝策略为 `ThreadPoolExecutor.AbortPolicy`

**示例代码：**
```java
import java.util.concurrent.*;

public class PoolExhaustionExample {
    public static void main(String[] args) {
        // 创建自定义线程池：核心线程2，最大线程3，使用SynchronousQueue
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
            2, 3, 60L, TimeUnit.SECONDS,
            new SynchronousQueue<>(), // 容量为0的队列
            new ThreadPoolExecutor.AbortPolicy()
        );
        
        // 提交多个长时间运行的任务
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            try {
                executor.execute(() -> {
                    System.out.println("Task " + taskId + " started");
                    try {
                        Thread.sleep(5000); // 模拟长时间任务
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                    System.out.println("Task " + taskId + " completed");
                });
                System.out.println("Task " + taskId + " submitted successfully");
            } catch (RejectedExecutionException e) {
                System.err.println("Task " + taskId + " rejected: " + e.getMessage());
            }
        }
        
        executor.shutdown();
    }
}
```

## 四种拒绝策略详解

Java提供了四种内置的拒绝策略：

### 1. AbortPolicy（默认策略）
抛出 `RejectedExecutionException` 异常

```java
new ThreadPoolExecutor.AbortPolicy()
```

### 2. CallerRunsPolicy
由调用线程执行被拒绝的任务

```java
new ThreadPoolExecutor.CallerRunsPolicy()
```

### 3. DiscardPolicy
静默丢弃被拒绝的任务

```java
new ThreadPoolExecutor.DiscardPolicy()
```

### 4. DiscardOldestPolicy
丢弃队列中最老的任务，然后重新提交被拒绝的任务

```java
new ThreadPoolExecutor.DiscardOldestPolicy()
```

## 解决方案

### 1. 线程池生命周期管理

**方案一：避免过早关闭**
```java
public class ThreadPoolManager {
    private final ExecutorService executor;
    private volatile boolean isShuttingDown = false;
    
    public ThreadPoolManager() {
        this.executor = Executors.newFixedThreadPool(5);
    }
    
    public void submitTask(Runnable task) {
        if (!isShuttingDown && !executor.isShutdown()) {
            try {
                executor.execute(task);
            } catch (RejectedExecutionException e) {
                System.err.println("Task rejected: " + e.getMessage());
            }
        }
    }
    
    public void shutdown() {
        isShuttingDown = true;
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

**方案二：使用状态检查**
```java
if (!executor.isShutdown() && !executor.isTerminated()) {
    executor.execute(task);
}
```

### 2. 线程池容量优化

**方案一：调整线程池参数**
```java
// 增加最大线程数
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5, 20, // 核心线程5，最大线程20
    60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(100), // 有界队列，容量100
    new ThreadPoolExecutor.CallerRunsPolicy() // 使用CallerRunsPolicy
);
```

**方案二：使用无界队列**
```java
// 使用LinkedBlockingQueue（无界）
ThreadPoolExecutor executor = new ThreadPoolExecutor(
    5, 10,
    60L, TimeUnit.SECONDS,
    new LinkedBlockingQueue<>(), // 无界队列
    new ThreadPoolExecutor.AbortPolicy()
);
```

**注意：** 无界队列可能导致内存溢出，需要配合任务提交速率控制使用。

### 3. 自定义拒绝策略

```java
public class LoggingRejectedExecutionHandler implements RejectedExecutionHandler {
    private static final Logger logger = LoggerFactory.getLogger(LoggingRejectedExecutionHandler.class);
    
    @Override
    public void rejectedExecution(Runnable r, ThreadPoolExecutor executor) {
        logger.warn("Task {} rejected from executor {}", r, executor);
        
        // 可以选择其他处理方式：
        // 1. 记录到数据库
        // 2. 放入备用队列
        // 3. 通知监控系统
        
        // 这里选择由调用线程执行
        if (!executor.isShutdown()) {
            try {
                r.run();
            } catch (Exception e) {
                logger.error("Error executing rejected task", e);
            }
        }
    }
}
```

### 4. 生产者-消费者模式

使用生产者-消费者模式控制任务提交速率：

```java
public class TaskSubmissionController {
    private final BlockingQueue<Runnable> taskQueue;
    private final ExecutorService executor;
    private final ExecutorService submitter;
    
    public TaskSubmissionController(int queueCapacity, int threadPoolSize) {
        this.taskQueue = new LinkedBlockingQueue<>(queueCapacity);
        this.executor = Executors.newFixedThreadPool(threadPoolSize);
        this.submitter = Executors.newSingleThreadExecutor();
        
        // 启动消费者线程
        submitter.execute(this::processQueue);
    }
    
    public boolean submitTask(Runnable task) {
        return taskQueue.offer(task); // 非阻塞提交
    }
    
    private void processQueue() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                Runnable task = taskQueue.take(); // 阻塞获取任务
                executor.execute(task);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (RejectedExecutionException e) {
                // 处理拒绝情况，可能需要重新入队
                System.err.println("Task execution rejected: " + e.getMessage());
            }
        }
    }
}
```

## 最佳实践

1. **合理设置线程池参数**
   - 根据任务特性（CPU密集型 vs IO密集型）调整核心线程数和最大线程数
   - 选择合适的队列类型和容量

2. **选择合适的拒绝策略**
   - 对于重要任务：使用 `CallerRunsPolicy` 或自定义策略
   - 对于可丢弃任务：使用 `DiscardPolicy` 或 `DiscardOldestPolicy`

3. **监控线程池状态**
   ```java
   // 定期监控线程池状态
   ThreadPoolExecutor tpe = (ThreadPoolExecutor) executor;
   System.out.println("Active threads: " + tpe.getActiveCount());
   System.out.println("Pool size: " + tpe.getPoolSize());
   System.out.println("Queue size: " + tpe.getQueue().size());
   ```

4. **优雅关闭线程池**
   ```java
   executor.shutdown();
   try {
       if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
           executor.shutdownNow();
           if (!executor.awaitTermination(30, TimeUnit.SECONDS)) {
               System.err.println("Executor did not terminate");
           }
       }
   } catch (InterruptedException e) {
       executor.shutdownNow();
       Thread.currentThread().interrupt();
   }
   ```

5. **使用线程池工厂**
   ```java
   ThreadFactory threadFactory = new ThreadFactoryBuilder()
       .setNameFormat("worker-thread-%d")
       .setDaemon(true)
       .build();
   
   ThreadPoolExecutor executor = new ThreadPoolExecutor(
       5, 10, 60L, TimeUnit.SECONDS,
       new LinkedBlockingQueue<>(100),
       threadFactory,
       new ThreadPoolExecutor.CallerRunsPolicy()
   );
   ```

## 总结

`RejectedExecutionException` 的产生主要源于两个场景：线程池已关闭和线程池资源耗尽。通过合理的线程池配置、适当的拒绝策略选择、完善的生命周期管理和有效的监控机制，可以有效避免和处理这类异常，确保应用程序的稳定性和可靠性。

在实际开发中，建议根据具体的业务场景和性能要求，选择最适合的解决方案，并建立完善的监控和日志记录机制，以便及时发现和解决潜在问题。