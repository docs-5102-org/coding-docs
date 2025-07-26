---
title: ScheduledExecutorService接口
category:
  - Java并发编程
tag:
  - java.util.concurrent
  - ScheduledExecutorService
---

# Java并发编程：ScheduledExecutorService 接口

`ScheduledExecutorService` 是Java并发编程中用于定时任务调度的核心接口，属于 `java.util.concurrent` 包。它扩展了 `ExecutorService`，提供延迟执行和周期性任务的支持。

## 目录

[[toc]]

## 1. 概述

`ScheduledExecutorService` 提供以下核心方法：

- **延迟执行**：任务在指定时间后执行一次
- **周期性执行**：任务按固定频率或固定延迟重复执行

### 关键方法对比

| 方法名 | 描述 |
|--------|------|
| `schedule(Runnable, delay, unit)` | 单次延迟执行任务 |
| `scheduleAtFixedRate(Runnable, initialDelay, period, unit)` | 固定速率周期性执行（基于开始时间） |
| `scheduleWithFixedDelay(Runnable, initialDelay, delay, unit)` | 固定延迟周期性执行（基于结束时间） |

## 2. 创建

通过 `Executors` 工厂类创建：

```java
// 创建包含2个线程的定时任务执行器
ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
```

## 3. 延迟执行任务

```java
scheduler.schedule(() -> {
    System.out.println("延迟5秒执行的任务");
}, 5, TimeUnit.SECONDS);
```

**输出：**
```
延迟5秒执行的任务
```

## 4. 固定速率周期性任务

```java
// 初始延迟2秒，每3秒执行一次
scheduler.scheduleAtFixedRate(
    () -> System.out.println("固定速率任务执行于 " + System.currentTimeMillis()),
    2, 3, TimeUnit.SECONDS
);
```

**输出示例：**
```
固定速率任务执行于 1630000000000
固定速率任务执行于 1630000003000
固定速率任务执行于 1630000006000
```

## 5. 固定延迟周期性任务

```java
// 初始延迟2秒，每次执行结束后延迟3秒
scheduler.scheduleWithFixedDelay(
    () -> {
        System.out.println("固定延迟任务执行于 " + System.currentTimeMillis());
        try { 
            Thread.sleep(1000); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
    },
    2, 3, TimeUnit.SECONDS
);
```

**输出示例：**
```
固定延迟任务执行于 1630000000000
固定延迟任务执行于 1630000004000 （执行耗时1秒 + 延迟3秒）
固定延迟任务执行于 1630000008000 （执行耗时1秒 + 延迟3秒）
```

## 6. 完整示例

```java
import java.util.concurrent.*;

class ScheduledTask implements Runnable {
    private final String name;
    
    public ScheduledTask(String name) { 
        this.name = name; 
    }
    
    @Override
    public void run() {
        System.out.printf("任务%s由%s执行于%s%n",
            name,
            Thread.currentThread().getName(),
            System.currentTimeMillis());
    }
}

public class SchedulerDemo {
    public static void main(String[] args) throws InterruptedException {
        ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
        
        // 延迟任务
        scheduler.schedule(new ScheduledTask("单次任务"), 5, TimeUnit.SECONDS);
        
        // 固定速率任务
        scheduler.scheduleAtFixedRate(
            new ScheduledTask("固定速率任务"),
            2, 3, TimeUnit.SECONDS
        );
        
        // 固定延迟任务
        scheduler.scheduleWithFixedDelay(
            new ScheduledTask("固定延迟任务"),
            2, 3, TimeUnit.SECONDS
        );
        
        Thread.sleep(10000);
        scheduler.shutdown();
        scheduler.awaitTermination(60, TimeUnit.SECONDS);
        System.out.println("所有任务完成");
    }
}
```

## 7. 关闭执行器

```java
// 优雅关闭流程
scheduler.shutdown();
try {
    if (!scheduler.awaitTermination(60, TimeUnit.SECONDS)) {
        scheduler.shutdownNow();
    }
} catch (InterruptedException e) {
    scheduler.shutdownNow();
}
```

## 8. 总结

- **适用场景**：定时任务、心跳检测、周期性数据同步等
- **注意事项**：
  - 固定速率任务可能因执行时间过长而并发执行
  - 固定延迟任务的间隔基于任务结束时间计算
  - 始终调用 `shutdown()` 释放资源

通过合理使用 `ScheduledExecutorService`，可以轻松实现复杂的定时任务调度需求。