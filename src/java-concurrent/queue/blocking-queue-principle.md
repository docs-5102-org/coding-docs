---
title: 阻塞队列原理
category:
  - java线程
tag:
  - Thread
  - BlockingQueue
---

# 阻塞队列原理

## 目录

[[toc]]

## 概述

阻塞队列是Java并发编程中的一个重要概念，它在生产者-消费者模式中发挥着关键作用。当队列为空时，消费者会一直等待；当队列已满时，生产者会被阻塞。那么，生产者和消费者是如何进行高效通信的呢？本文将从JDK源码的角度，深入分析阻塞队列的实现原理。

## 核心问题

在阻塞队列的实现中，需要解决以下关键问题：

1. **队列为空时**：消费者如何知道队列中有新元素加入？
2. **队列已满时**：生产者如何知道队列有空间可用？
3. **如何实现生产者和消费者之间的高效通信？**

## 实现原理：通知模式

JDK采用**通知模式**来实现阻塞队列：

- 当生产者往满的队列里添加元素时会阻塞住生产者
- 当消费者消费了队列中的元素后，会通知生产者当前队列可用
- 反之，当生产者添加元素后，会通知消费者队列中有可用元素

## ArrayBlockingQueue的实现机制

### 1. 条件变量的使用

ArrayBlockingQueue使用`Condition`来实现通知模式：

```java
private final Condition notFull;   // 队列不满的条件
private final Condition notEmpty;  // 队列不空的条件

public ArrayBlockingQueue(int capacity, boolean fair) {
    // 省略其他代码
    notEmpty = lock.newCondition();
    notFull = lock.newCondition();
}
```

### 2. 生产者的put方法

```java
public void put(E e) throws InterruptedException {
    checkNotNull(e);
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        while (count == items.length)  // 队列已满
            notFull.await();           // 等待队列不满
        insert(e);
    } finally {
        lock.unlock();
    }
}
```

**工作流程：**
1. 获取锁
2. 检查队列是否已满
3. 如果已满，调用`notFull.await()`阻塞等待
4. 队列有空间后，插入元素
5. 释放锁

### 3. 消费者的take方法

```java
public E take() throws InterruptedException {
    final ReentrantLock lock = this.lock;
    lock.lockInterruptibly();
    try {
        while (count == 0)      // 队列为空
            notEmpty.await();   // 等待队列不空
        return extract();
    } finally {
        lock.unlock();
    }
}
```

**工作流程：**
1. 获取锁
2. 检查队列是否为空
3. 如果为空，调用`notEmpty.await()`阻塞等待
4. 队列有元素后，提取元素
5. 释放锁

### 4. 通知机制

插入元素时的通知：

```java
private void insert(E x) {
    items[putIndex] = x;
    putIndex = inc(putIndex);
    ++count;
    notEmpty.signal();  // 通知消费者队列不空
}
```

## 底层阻塞实现：LockSupport.park

### await方法的实现

当线程需要等待时，最终会调用`LockSupport.park(this)`：

```java
public final void await() throws InterruptedException {
    if (Thread.interrupted())
        throw new InterruptedException();
    Node node = addConditionWaiter();
    int savedState = fullyRelease(node);
    int interruptMode = 0;
    while (!isOnSyncQueue(node)) {
        LockSupport.park(this);  // 阻塞当前线程
        if ((interruptMode = checkInterruptWhileWaiting(node)) != 0)
            break;
    }
    // 处理唤醒后的逻辑...
}
```

### LockSupport.park方法

```java
public static void park(Object blocker) {
    Thread t = Thread.currentThread();
    setBlocker(t, blocker);    // 保存将要阻塞的线程
    unsafe.park(false, 0L);    // 调用native方法阻塞
    setBlocker(t, null);
}
```

### native方法park

```java
public native void park(boolean isAbsolute, long time);
```

## park方法的唤醒条件

`park`方法会阻塞当前线程，只有以下4种情况之一发生时才会返回：

1. **对应的unpark执行**：包括unpark先执行再执行park的情况
2. **线程被中断**：响应中断信号
3. **超时**：等待完time参数指定的时间
4. **异常情况**：虚假唤醒等异常现象

## 操作系统层面的实现

### Linux系统实现

在Linux系统中，park方法使用`pthread_cond_wait`系统调用实现：

```c
void os::PlatformEvent::park() {
    int v;
    for (;;) {
        v = _Event;
        if (Atomic::cmpxchg(v-1, &_Event, v) == v) break;
    }
    guarantee(v >= 0, "invariant");
    if (v == 0) {
        // 进入阻塞状态
        int status = pthread_mutex_lock(_mutex);
        assert_status(status == 0, status, "mutex_lock");
        guarantee(_nParked == 0, "invariant");
        ++_nParked;
        while (_Event < 0) {
            status = pthread_cond_wait(_cond, _mutex);  // 条件等待
            if (status == ETIME) { status = EINTR; }
            assert_status(status == 0 || status == EINTR, status, "cond_wait");
        }
        --_nParked;
        _Event = 0;
        status = pthread_mutex_unlock(_mutex);
        assert_status(status == 0, status, "mutex_unlock");
    }
    guarantee(_Event >= 0, "invariant");
}
```

**关键要素：**
- `pthread_cond_wait`：多线程条件变量函数
- `_cond`：共享的条件变量
- `_mutex`：互斥量，保证线程安全

### Windows系统实现

在Windows系统中，park方法使用`WaitForSingleObject`实现，unpark方法使用`pthread_cond_signal`实现。

## 线程状态分析

当线程被阻塞队列阻塞时，线程会进入`WAITING (parking)`状态。使用`jstack`可以观察到：

```
"main" prio=5 tid=0x00007fc83c000000 nid=0x10164e000 waiting on condition [0x000000010164d000]
java.lang.Thread.State: WAITING (parking)
at sun.misc.Unsafe.park(Native Method)
parking to wait for <0x0000000140559fe8> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)
at java.util.concurrent.locks.LockSupport.park(LockSupport.java:186)
at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(AbstractQueuedSynchronizer.java:2043)
at java.util.concurrent.ArrayBlockingQueue.put(ArrayBlockingQueue.java:324)
```

## 总结

阻塞队列的实现原理可以总结为以下几个层次：

1. **应用层**：使用Condition条件变量实现等待/通知机制
2. **JVM层**：通过LockSupport.park/unpark实现线程的阻塞和唤醒
3. **操作系统层**：在Linux下使用pthread_cond_wait/pthread_cond_signal，在Windows下使用WaitForSingleObject

这种分层设计既保证了跨平台的一致性，又充分利用了操作系统提供的高效同步原语，实现了生产者和消费者之间的高效通信。通过这种机制，阻塞队列能够在保证线程安全的前提下，提供高性能的并发访问能力。