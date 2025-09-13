---
title: Java中的锁介绍
category:
  - Java并发编程
tag:
  - Lock
  - java.util.concurrent
---

# Java中的锁介绍

## 目录

[[toc]]

## 1. 锁的基本概念

在多线程环境中，锁（Lock）是一种同步机制，用于控制对共享资源的访问。Java提供了多种类型的锁，每种锁都有其特定的使用场景和特性。

## 2. 锁的分类

### 2.1 按锁的获取方式分类
- **悲观锁**：假设会发生并发冲突，屏蔽一切可能违反数据完整性的操作
- **乐观锁**：假设不会发生并发冲突，只在提交操作时检查是否违反数据完整性

### 2.2 按锁的共享性分类
- **排他锁（独占锁）**：同一时间只能被一个线程持有
- **共享锁**：同一时间可以被多个线程持有

### 2.3 按锁的可重入性分类
- **可重入锁**：同一线程可以多次获取同一把锁
- **不可重入锁**：同一线程不能多次获取同一把锁

## 3. 常见锁类型详解

### 3.1 synchronized（内置锁/监视器锁）

`synchronized` 是Java内置的关键字，提供了最基本的同步机制。

#### 特性
- 可重入锁
- 排他锁
- 悲观锁
- 非公平锁

#### 使用方式
```java
// 1. 同步方法
public synchronized void synchronizedMethod() {
    // 临界区代码
}

// 2. 同步代码块
public void method() {
    synchronized (this) {
        // 临界区代码
    }
}

// 3. 静态同步方法
public static synchronized void staticSynchronizedMethod() {
    // 临界区代码
}
```

#### 示例代码
```java
public class SynchronizedExample {
    private int count = 0;
    
    // 同步方法
    public synchronized void increment() {
        count++;
    }
    
    // 同步代码块
    public void decrement() {
        synchronized (this) {
            count--;
        }
    }
    
    public synchronized int getCount() {
        return count;
    }
    
    public static void main(String[] args) throws InterruptedException {
        SynchronizedExample example = new SynchronizedExample();
        
        // 创建多个线程进行测试
        Thread t1 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                example.increment();
            }
        });
        
        Thread t2 = new Thread(() -> {
            for (int i = 0; i < 1000; i++) {
                example.decrement();
            }
        });
        
        t1.start();
        t2.start();
        
        t1.join();
        t2.join();
        
        System.out.println("最终count值: " + example.getCount());
    }
}
```

### 3.2 ReentrantLock（可重入锁）

`ReentrantLock` 是Java并发包中提供的显式锁，功能比synchronized更强大。

#### 特性
- 可重入锁
- 排他锁
- 悲观锁
- 支持公平锁和非公平锁
- 支持可中断的锁获取操作
- 支持超时的锁获取操作

#### 示例代码
```java
import java.util.concurrent.locks.ReentrantLock;

public class ReentrantLockExample {
    private final ReentrantLock lock = new ReentrantLock();
    private int count = 0;
    
    public void increment() {
        lock.lock();
        try {
            count++;
            System.out.println(Thread.currentThread().getName() + " increment: " + count);
        } finally {
            lock.unlock();
        }
    }
    
    public void decrement() {
        lock.lock();
        try {
            count--;
            System.out.println(Thread.currentThread().getName() + " decrement: " + count);
        } finally {
            lock.unlock();
        }
    }
    
    // 演示可重入特性
    public void reentrantMethod() {
        lock.lock();
        try {
            System.out.println("外层方法获取锁");
            innerMethod();
        } finally {
            lock.unlock();
        }
    }
    
    private void innerMethod() {
        lock.lock();
        try {
            System.out.println("内层方法获取锁");
        } finally {
            lock.unlock();
        }
    }
    
    public static void main(String[] args) {
        ReentrantLockExample example = new ReentrantLockExample();
        
        // 测试基本功能
        Thread t1 = new Thread(example::increment, "Thread-1");
        Thread t2 = new Thread(example::decrement, "Thread-2");
        
        t1.start();
        t2.start();
        
        // 测试可重入特性
        example.reentrantMethod();
    }
}
```

### 3.3 ReadWriteLock（读写锁）

`ReadWriteLock` 维护了一对关联的锁，一个用于只读操作，一个用于写入操作。

#### 特性
- 读锁是共享锁，写锁是排他锁
- 读锁之间不互斥
- 读锁与写锁互斥，写锁与写锁互斥

#### 示例代码
```java
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

public class ReadWriteLockExample {
    private final ReadWriteLock lock = new ReentrantReadWriteLock();
    private String data = "初始数据";
    
    // 读操作
    public String read() {
        lock.readLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 正在读取数据: " + data);
            Thread.sleep(1000); // 模拟读取耗时
            return data;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        } finally {
            lock.readLock().unlock();
        }
    }
    
    // 写操作
    public void write(String newData) {
        lock.writeLock().lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 正在写入数据: " + newData);
            Thread.sleep(1000); // 模拟写入耗时
            this.data = newData;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            lock.writeLock().unlock();
        }
    }
    
    public static void main(String[] args) {
        ReadWriteLockExample example = new ReadWriteLockExample();
        
        // 创建多个读线程
        for (int i = 1; i <= 3; i++) {
            new Thread(() -> example.read(), "Reader-" + i).start();
        }
        
        // 创建写线程
        new Thread(() -> example.write("新数据"), "Writer-1").start();
        
        // 再创建读线程
        new Thread(() -> example.read(), "Reader-4").start();
    }
}
```

### 3.4 StampedLock（邮戳锁）

`StampedLock` 是Java 8引入的锁，提供了三种模式的锁访问。

#### 特性
- 支持写锁、读锁、乐观读
- 性能比ReadWriteLock更好
- 不支持重入

#### 示例代码
```java
import java.util.concurrent.locks.StampedLock;

public class StampedLockExample {
    private final StampedLock lock = new StampedLock();
    private double x, y;
    
    // 写操作
    public void write(double newX, double newY) {
        long stamp = lock.writeLock();
        try {
            x = newX;
            y = newY;
            System.out.println(Thread.currentThread().getName() + " 写入: x=" + x + ", y=" + y);
        } finally {
            lock.unlockWrite(stamp);
        }
    }
    
    // 乐观读
    public double distanceFromOrigin() {
        long stamp = lock.tryOptimisticRead();
        double curX = x, curY = y;
        
        if (!lock.validate(stamp)) {
            // 乐观读失败，升级为悲观读锁
            stamp = lock.readLock();
            try {
                curX = x;
                curY = y;
            } finally {
                lock.unlockRead(stamp);
            }
        }
        
        double result = Math.sqrt(curX * curX + curY * curY);
        System.out.println(Thread.currentThread().getName() + " 计算距离: " + result);
        return result;
    }
    
    // 悲观读
    public double[] getCoordinates() {
        long stamp = lock.readLock();
        try {
            System.out.println(Thread.currentThread().getName() + " 悲观读: x=" + x + ", y=" + y);
            return new double[]{x, y};
        } finally {
            lock.unlockRead(stamp);
        }
    }
    
    public static void main(String[] args) throws InterruptedException {
        StampedLockExample example = new StampedLockExample();
        
        // 写线程
        Thread writer = new Thread(() -> {
            for (int i = 1; i <= 5; i++) {
                example.write(i, i * 2);
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "Writer");
        
        // 乐观读线程
        Thread optimisticReader = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                example.distanceFromOrigin();
                try {
                    Thread.sleep(150);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "OptimisticReader");
        
        // 悲观读线程
        Thread pessimisticReader = new Thread(() -> {
            for (int i = 0; i < 3; i++) {
                example.getCoordinates();
                try {
                    Thread.sleep(200);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }, "PessimisticReader");
        
        writer.start();
        optimisticReader.start();
        pessimisticReader.start();
        
        writer.join();
        optimisticReader.join();
        pessimisticReader.join();
    }
}
```

### 3.5 自旋锁（SpinLock）

自旋锁是一种忙等待的锁，线程在获取锁时不会阻塞，而是循环检查锁是否可用。

#### 特性
- 适用于锁持有时间短的场景
- 避免线程切换的开销
- 消耗CPU资源

#### 示例代码
```java
import java.util.concurrent.atomic.AtomicReference;

public class SpinLock {
    private final AtomicReference<Thread> owner = new AtomicReference<>();
    
    public void lock() {
        Thread current = Thread.currentThread();
        // 自旋等待
        while (!owner.compareAndSet(null, current)) {
            // 空循环，消耗CPU
        }
    }
    
    public void unlock() {
        Thread current = Thread.currentThread();
        owner.compareAndSet(current, null);
    }
    
    // 使用示例
    public static class SpinLockExample {
        private final SpinLock spinLock = new SpinLock();
        private int count = 0;
        
        public void increment() {
            spinLock.lock();
            try {
                count++;
                System.out.println(Thread.currentThread().getName() + " count: " + count);
            } finally {
                spinLock.unlock();
            }
        }
        
        public static void main(String[] args) throws InterruptedException {
            SpinLockExample example = new SpinLockExample();
            
            Thread[] threads = new Thread[5];
            for (int i = 0; i < 5; i++) {
                threads[i] = new Thread(() -> {
                    for (int j = 0; j < 3; j++) {
                        example.increment();
                    }
                }, "Thread-" + i);
            }
            
            for (Thread thread : threads) {
                thread.start();
            }
            
            for (Thread thread : threads) {
                thread.join();
            }
        }
    }
}
```

```java
public class SpinLock implements Lock {

    /**
     * 锁持有线程, null表示锁未被任何线程持有
     */
    private final AtomicReference<Thread> owner = new AtomicReference<Thread>();

    /**
     * owner持有锁次数
     */
    private int holdCount;

    @Override
    public void lock() {
        final AtomicReference<Thread> owner = this.owner;

        final Thread current = Thread.currentThread();
        if (owner.get() == current) { // 当前线程已持有锁, 增加持有计数即可
            ++holdCount;
            return;
        }

        while (!owner.compareAndSet(null, current)) {
        }

        holdCount = 1;
    }

    @Override
    public void lockInterruptibly() throws InterruptedException {
        final AtomicReference<Thread> owner = this.owner;

        final Thread current = Thread.currentThread();
        if (owner.get() == current) {
            ++holdCount;
            return;
        }

        while (!owner.compareAndSet(null, current)) {
            // 响应中断
            if (current.isInterrupted()) {
                current.interrupt(); // 重设中断标志
                throw new InterruptedException();
            }
        }

        holdCount = 1;
    }

    @Override
    public boolean tryLock() {
        boolean locked =  owner.compareAndSet(null, Thread.currentThread());
        if (locked) {
            holdCount = 1;
        }
        return locked;
    }

    @Override
    public boolean tryLock(long time, TimeUnit unit) throws InterruptedException {
        final AtomicReference<Thread> owner = this.owner;
        final Thread current = Thread.currentThread();
        if (owner.get() == current) {
            ++holdCount;
            return true;
        }

        final long start = System.nanoTime();
        final long timeoutNanos = unit.toNanos(time);
        while (!owner.compareAndSet(null, current)) {
            // 响应中断
            if (current.isInterrupted()) {
                current.interrupt();
                throw new InterruptedException();
            }
            // 判断是否超时
            long elapsed = System.nanoTime() - start;
            if (elapsed >= timeoutNanos) {
                return false;
            }
        }

        holdCount = 1;
        return true;
    }

    @Override
    public void unlock() {
        final AtomicReference<Thread> owner = this.owner;
        final Thread current = Thread.currentThread();

        if (owner.get() != current) {
            throw new IllegalMonitorStateException();
        }
        // 持有多少次, 就必须释放多少次
        if (--holdCount == 0) {
            owner.set(null);
        }
    }

    @Override
    public Condition newCondition() {
        throw new UnsupportedOperationException();
    }
}
```

**自旋锁适用于锁使用者保持锁时间比较短的情况下，若持锁时间太长，性能降低**

### 3.6 公平锁与非公平锁

#### 公平锁示例
```java
import java.util.concurrent.locks.ReentrantLock;

public class FairLockExample {
    // 公平锁
    private final ReentrantLock fairLock = new ReentrantLock(true);
    // 非公平锁
    private final ReentrantLock unfairLock = new ReentrantLock(false);
    
    public void fairLockMethod() {
        fairLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 获取公平锁");
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            fairLock.unlock();
        }
    }
    
    public void unfairLockMethod() {
        unfairLock.lock();
        try {
            System.out.println(Thread.currentThread().getName() + " 获取非公平锁");
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            unfairLock.unlock();
        }
    }
    
    public static void main(String[] args) {
        FairLockExample example = new FairLockExample();
        
        System.out.println("=== 公平锁测试 ===");
        for (int i = 1; i <= 5; i++) {
            new Thread(example::fairLockMethod, "Thread-" + i).start();
        }
        
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        System.out.println("\n=== 非公平锁测试 ===");
        for (int i = 1; i <= 5; i++) {
            new Thread(example::unfairLockMethod, "Thread-" + i).start();
        }
    }
}
```

## 4. 锁的选择指南

### 4.1 synchronized vs ReentrantLock

| 特性 | synchronized | ReentrantLock |
|------|-------------|---------------|
| 语法 | 关键字 | API调用 |
| 锁释放 | 自动释放 | 手动释放 |
| 公平性 | 非公平 | 可选公平/非公平 |
| 可中断性 | 不可中断 | 可中断 |
| 超时获取 | 不支持 | 支持 |
| 条件变量 | 单一条件 | 多条件变量 |

### 4.2 使用建议

1. **简单场景**：使用 `synchronized`
2. **需要高级功能**：使用 `ReentrantLock`
3. **读多写少**：使用 `ReadWriteLock`
4. **追求极致性能**：使用 `StampedLock`
5. **锁持有时间短**：考虑自旋锁

## 5. 最佳实践

### 5.1 锁的使用原则
1. **尽量减少锁的范围**
2. **避免嵌套锁**
3. **使用try-finally确保锁释放**
4. **合理选择锁的类型**

### 5.2 死锁预防
```java
public class DeadlockPrevention {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();
    
    // 避免死锁：按固定顺序获取锁
    public void method1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // 业务逻辑
            }
        }
    }
    
    public void method2() {
        synchronized (lock1) { // 与method1相同的锁顺序
            synchronized (lock2) {
                // 业务逻辑
            }
        }
    }
}
```

## 6. 总结

Java提供了丰富的锁机制来满足不同场景的并发需求。理解各种锁的特性和使用场景，能够帮助开发者编写出高效、安全的并发程序。在实际开发中，应该根据具体需求选择合适的锁类型，并遵循最佳实践来避免常见的并发问题。