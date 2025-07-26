---
title: Thread类
category:
  - java线程
tag:
  - Thread
  - wait
  - notify
---

# Thread中的wait/notify方法详解

## 目录

[[toc]]

## 1. 引言

在Java多线程编程中，线程间的协作与通信是一个核心概念。当一个线程修改了某个对象的值，而另一个线程需要感知到这种变化并做出相应操作时，就需要用到线程间的等待/通知机制。这种机制能够有效解决生产者-消费者模式中的线程协调问题。

## 2. 传统轮询方式的问题

在没有wait/notify机制之前，常见的做法是让消费者线程不断轮询检查条件：

```java
while (value != desire) {
    Thread.sleep(1000);
}
doSomething();
```

这种方式存在两个主要问题：

1. **及时性问题**：睡眠时间过长导致无法及时发现条件变化
2. **资源消耗问题**：睡眠时间过短会造成CPU资源的无端浪费

## 3. wait/notify方法概述

Java通过内置的等待/通知机制完美解决了上述矛盾。这些方法定义在`java.lang.Object`类中，因此所有Java对象都具备这些能力。

### 核心方法说明

| 方法 | 描述 |
|------|------|
| `wait()` | 使当前线程等待，直到其他线程调用此对象的notify()或notifyAll()方法 |
| `wait(long timeout)` | 使当前线程等待指定时间，超时后自动唤醒 |
| `notify()` | 唤醒在此对象监视器上等待的单个线程 |
| `notifyAll()` | 唤醒在此对象监视器上等待的所有线程 |

## 4. 工作机制详解

等待/通知机制的工作原理：
- 线程A调用对象O的`wait()`方法进入等待状态
- 线程B调用对象O的`notify()`或`notifyAll()`方法
- 线程A收到通知后从`wait()`方法返回，继续执行

## 5. 完整示例代码

```java
package com.example;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.concurrent.TimeUnit;

public class WaitNotifyDemo {
    static boolean flag = true;
    static Object lock = new Object();

    public static void main(String[] args) throws Exception {
        Thread waitThread = new Thread(new WaitTask(), "WaitThread");
        waitThread.start();
        
        TimeUnit.SECONDS.sleep(1);
        
        Thread notifyThread = new Thread(new NotifyTask(), "NotifyThread");
        notifyThread.start();
    }

    static class WaitTask implements Runnable {
        @Override
        public void run() {
            // 必须先获取对象锁
            synchronized (lock) {
                // 当条件不满足时，继续等待
                while (flag) {
                    try {
                        System.out.println(Thread.currentThread() + 
                            " flag is true. waiting @ " + 
                            new SimpleDateFormat("HH:mm:ss").format(new Date()));
                        
                        // 释放锁并等待通知
                        lock.wait();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }
                
                // 条件满足时，执行后续操作
                System.out.println(Thread.currentThread() + 
                    " flag is false. running @ " + 
                    new SimpleDateFormat("HH:mm:ss").format(new Date()));
            }
        }
    }

    static class NotifyTask implements Runnable {
        @Override
        public void run() {
            // 获取对象锁
            synchronized (lock) {
                System.out.println(Thread.currentThread() + 
                    " hold lock. notify @ " + 
                    new SimpleDateFormat("HH:mm:ss").format(new Date()));
                
                // 发送通知（注意：此时并未释放锁）
                lock.notifyAll();
                flag = false;
                
                // 模拟耗时操作
                try {
                    TimeUnit.SECONDS.sleep(3);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
            // 锁在此处被释放，等待线程才能继续执行
        }
    }
}
```

## 6. 关键注意事项

### 6.1 必须在同步块中使用
```java
// 正确用法
synchronized (lock) {
    lock.wait();
    lock.notify();
}

// 错误用法 - 会抛出IllegalMonitorStateException
lock.wait();
lock.notify();
```

### 6.2 线程状态转换
- 调用`wait()`后：线程状态从`RUNNING`变为`WAITING`，进入对象的等待队列
- 调用`notify()`后：等待线程不会立即返回，需要等通知线程释放锁
- `notify()`：将等待队列中的一个线程移到同步队列
- `notifyAll()`：将等待队列中的所有线程移到同步队列

### 6.3 使用while而非if
```java
// 推荐做法
while (condition) {
    lock.wait();
}

// 不推荐 - 可能存在虚假唤醒问题
if (condition) {
    lock.wait();
}
```

## 7. notify() vs notifyAll()

### notify()
- 只唤醒等待队列中的一个线程
- 由JVM决定唤醒哪个线程
- 适用于所有等待线程执行相同操作的场景

### notifyAll()
- 唤醒等待队列中的所有线程
- 所有线程都会竞争锁
- 更安全但可能导致不必要的竞争

## 8. 实际应用场景

### 8.1 生产者-消费者模式
```java
class Buffer {
    private final Object lock = new Object();
    private final Queue<Object> queue = new LinkedList<>();
    private final int capacity;
    
    public Buffer(int capacity) {
        this.capacity = capacity;
    }
    
    public void put(Object item) throws InterruptedException {
        synchronized (lock) {
            while (queue.size() == capacity) {
                lock.wait();  // 缓冲区满，等待消费
            }
            queue.offer(item);
            lock.notifyAll();  // 通知消费者
        }
    }
    
    public Object take() throws InterruptedException {
        synchronized (lock) {
            while (queue.isEmpty()) {
                lock.wait();  // 缓冲区空，等待生产
            }
            Object item = queue.poll();
            lock.notifyAll();  // 通知生产者
            return item;
        }
    }
}
```

### 8.2 线程顺序执行
通过wait/notify机制可以实现多线程的顺序执行，确保线程按照预定顺序运行。

## 9. 与其他同步机制的对比

| 机制 | 特点 | 适用场景 |
|------|------|----------|
| wait/notify | 基础但灵活 | 简单的等待/通知场景 |
| CountDownLatch | 一次性同步工具 | 等待多个任务完成 |
| Semaphore | 控制资源访问数量 | 限制并发访问 |
| Condition | 更精确的条件控制 | 复杂的条件等待 |

## 10. 最佳实践

1. **总是在同步块中使用**：避免`IllegalMonitorStateException`
2. **使用while循环**：防止虚假唤醒
3. **优先使用notifyAll()**：除非确定只需要唤醒一个线程
4. **正确处理中断**：在catch块中恢复中断状态
5. **避免在finally块中调用**：可能导致意外的唤醒

## 11. 总结

wait/notify机制是Java多线程编程的基础工具，它提供了一种优雅的线程协作方式。虽然现在有了更高级的并发工具类，但理解wait/notify的原理对于深入掌握Java并发编程仍然至关重要。

掌握这一机制的关键在于：
- 理解锁的获取和释放时机
- 正确处理线程状态转换
- 避免常见的陷阱和错误用法

通过合理使用wait/notify，可以构建高效、可靠的多线程应用程序。