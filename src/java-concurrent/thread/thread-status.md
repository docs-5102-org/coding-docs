---
title: Thread类
category:
  - java线程
tag:
  - Thread
  - 线程状态
---

# Java线程状态详解

## 目录

[[toc]]

## 概述

Java线程在其生命周期中会经历不同的状态转换。理解这些状态对于多线程编程和问题排查至关重要。Java中的线程在任意时刻都只能处于以下6种状态之一。

## 线程状态类型

### 状态枚举对照表

| 状态名称 | 英文名称 | 描述 |
|---------|---------|------|
| 新建 | NEW | 线程已创建但尚未启动 |
| 运行 | RUNNABLE | 线程正在Java虚拟机中执行，可能正在运行也可能在等待CPU调度 |
| 阻塞 | BLOCKED | 线程因为监视器锁被阻塞 |
| 等待 | WAITING | 线程无限期等待另一个线程执行某个特定动作 |
| 超时等待 | TIMED_WAITING | 线程在指定时间内等待另一个线程执行某个动作 |
| 终止 | TERMINATED | 线程已退出 |

### 详细状态说明

#### 1. NEW（新建）
- **定义**：线程对象已创建，但还未调用`start()`方法
- **特点**：此时线程不会出现在线程转储中
- **示例**：`Thread thread = new Thread();`

#### 2. RUNNABLE（运行）
- **定义**：线程正在Java虚拟机中运行，包含了操作系统中的运行和就绪两种状态
- **特点**：可能正在执行，也可能正在等待CPU时间片
- **包含状态**：
  - Running：正在执行
  - Ready：等待CPU调度

#### 3. BLOCKED（阻塞）
- **定义**：线程被阻塞等待监视器锁的释放
- **触发场景**：
  - 等待进入`synchronized`代码块或方法
  - 调用`Object.wait()`后被唤醒，重新等待锁
- **解除条件**：获得所需的监视器锁

#### 4. WAITING（等待）
- **定义**：线程无限期等待，直到被其他线程明确唤醒
- **触发方法**：
  - `Object.wait()`（无参数）
  - `Thread.join()`（无参数）
  - `LockSupport.park()`
- **解除条件**：
  - `Object.notify()`/`notifyAll()`
  - 被join的线程执行完毕
  - `LockSupport.unpark()`

#### 5. TIMED_WAITING（超时等待）
- **定义**：线程在指定时间内等待，超时后自动返回
- **触发方法**：
  - `Thread.sleep(long)`
  - `Object.wait(long)`
  - `Thread.join(long)`
  - `LockSupport.parkNanos()`
  - `LockSupport.parkUntil()`
- **解除条件**：时间到期或被提前唤醒

#### 6. TERMINATED（终止）
- **定义**：线程执行完毕或因异常退出
- **特点**：线程不能再次启动

## 状态转换图

```
NEW ──start()──> RUNNABLE ──────────────────> TERMINATED
                    ↑  ↓                         ↑
                    │  │sleep()/wait(timeout)    │
                    │  ↓                         │
                    │  TIMED_WAITING ────────────┤
                    │  ↑                         │
                    │  │notify()/timeout        │
                    │  ↓                         │
                    │  WAITING ──────────────────┤
                    │  ↑                         │
                    │  │notify()                 │
                    │  ↓                         │
                    └─ BLOCKED ───────────────────┘
                       ↑      获得锁
                       │
                    等待锁
```

## 实战示例

### 完整演示代码

#### 主类：ThreadState.java
```java
package com.ise.api.thread;

/**
 * 线程状态演示
 * 使用jstack工具可以观察线程的不同状态
 */
public class ThreadState {
    public static void main(String[] args) {
        // TIMED_WAITING状态演示
        new Thread(new TimeWaiting(), "TimeWaitingThread").start();
        
        // WAITING状态演示
        new Thread(new Waiting(), "WaitingThread").start();
        
        // BLOCKED状态演示：使用两个线程，一个获取锁成功，另一个被阻塞
        new Thread(new Blocked(), "BlockedThread-1").start();
        new Thread(new Blocked(), "BlockedThread-2").start();
        
        // NEW和TERMINATED状态演示
        new Thread(new ShortTask(), "ShortTaskThread").start();
    }

    /**
     * TIMED_WAITING状态：线程不断进行有时限的睡眠
     */
    static class TimeWaiting implements Runnable {
        @Override
        public void run() {
            while (true) {
                SleepUtils.second(100);  // 进入TIMED_WAITING状态
            }
        }
    }

    /**
     * WAITING状态：线程在对象上无限期等待
     */
    static class Waiting implements Runnable {
        @Override
        public void run() {
            while (true) {
                synchronized (Waiting.class) {
                    try {
                        Waiting.class.wait();  // 进入WAITING状态
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                }
            }
        }
    }

    /**
     * BLOCKED状态：线程获取锁后不释放，其他线程会被阻塞
     */
    static class Blocked implements Runnable {
        @Override
        public void run() {
            synchronized (Blocked.class) {
                while (true) {
                    SleepUtils.second(100);  // 持有锁不释放
                }
            }
        }
    }
    
    /**
     * 短任务：演示NEW -> RUNNABLE -> TERMINATED的快速转换
     */
    static class ShortTask implements Runnable {
        @Override
        public void run() {
            System.out.println("短任务执行完成");
            // 任务结束，线程进入TERMINATED状态
        }
    }
}
```

#### 工具类：SleepUtils.java
```java
package com.ise.api.thread;

import java.util.concurrent.TimeUnit;

/**
 * 睡眠工具类
 */
public class SleepUtils {
    /**
     * 使线程睡眠指定秒数
     * @param seconds 睡眠时间（秒）
     */
    public static void second(long seconds) {
        try {
            TimeUnit.SECONDS.sleep(seconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt(); // 恢复中断状态
        }
    }
}
```

## 使用jstack工具观察线程状态

### 步骤说明

1. **编译并运行程序**
   ```bash
   javac com/ise/api/thread/*.java
   java com.ise.api.thread.ThreadState
   ```

2. **查找Java进程ID**
   ```bash
   jps
   ```
   输出示例：
   ```
   611
   935 Jps
   929 ThreadState  # 这是我们的目标进程
   270
   ```

3. **使用jstack查看线程信息**
   ```bash
   jstack 929
   ```

### jstack输出分析

典型的jstack输出会显示：

```
"TimeWaitingThread" #10 prio=5 os_prio=0 tid=0x00007f8b1c00a000 nid=0x3a1 waiting on condition
   java.lang.Thread.State: TIMED_WAITING (sleeping)

"WaitingThread" #11 prio=5 os_prio=0 tid=0x00007f8b1c00b000 nid=0x3a2 in Object.wait()
   java.lang.Thread.State: WAITING (on object monitor)

"BlockedThread-1" #12 prio=5 os_prio=0 tid=0x00007f8b1c00c000 nid=0x3a3 waiting for monitor entry
   java.lang.Thread.State: BLOCKED (on object monitor)

"BlockedThread-2" #13 prio=5 os_prio=0 tid=0x00007f8b1c00d000 nid=0x3a4 runnable
   java.lang.Thread.State: RUNNABLE
```

## 实际应用场景

### 性能调优
- **BLOCKED状态过多**：可能存在锁竞争问题，考虑减少锁的粒度或使用无锁数据结构
- **WAITING/TIMED_WAITING状态过多**：可能存在线程间协调问题，检查wait/notify的使用

### 问题排查
- **死锁排查**：多个线程都处于BLOCKED状态，且相互等待对方持有的锁
- **线程泄漏**：大量线程处于WAITING状态且不会被唤醒

## 最佳实践

1. **合理使用锁**：避免长时间持有锁，减少BLOCKED状态的出现
2. **及时唤醒等待线程**：确保调用wait()的线程能够被适时唤醒
3. **设置合理的超时时间**：使用带超时参数的等待方法，避免无限期等待
4. **监控线程状态**：定期使用jstack等工具检查线程状态分布
5. **优雅关闭**：确保所有线程能够正常结束，避免僵尸线程

## 总结

理解Java线程的6种状态及其转换关系是多线程编程的基础。通过合理的状态管理和监控，可以有效提升应用程序的性能和稳定性。在实际开发中，应该根据具体业务场景选择合适的线程同步机制，并定期检查线程状态分布，及时发现和解决潜在问题。