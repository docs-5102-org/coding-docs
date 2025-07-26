---
title: Thread类
category:
  - java线程
tag:
  - Thread
---

# Java多线程教程：Thread类

Java中的Thread类是创建和管理线程的主要机制。每个线程代表程序中的一个独立执行路径，允许并发操作并提高应用程序的性能和响应能力。

## 目录

[[toc]]

## 1. Thread类概述

Java中的Thread类属于`java.lang`包，提供构造方法和管理线程的方法。线程通过同时执行多个任务，使程序运行更高效。

Thread类的关键方法：
- `start()`：启动线程执行
- `run()`：包含线程执行的代码
- `sleep(long millis)`：使线程休眠指定时间
- `join()`：等待线程结束
- `interrupt()`：中断线程
- `isAlive()`：检查线程是否存活
- `getName()`：获取线程名称
- `setName(String name)`：设置线程名称
- `getPriority()`：获取线程优先级
- `setPriority(int priority)`：设置线程优先级

## 2. 创建线程

### 继承Thread类

通过继承Thread类并重写`run()`方法创建线程：

```java
class MyThread extends Thread {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，计数：" + i);
            try {
                Thread.sleep(1000); // 用睡眠模拟工作
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

### 实现Runnable接口

通过实现Runnable接口创建线程（推荐用于已继承其他类的情况）：

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，计数：" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
```

## 3. 线程生命周期

线程在生命周期中会经历以下状态：

- **新建（New）**：线程已创建但未启动
- **可运行（Runnable）**：线程准备运行，等待CPU调度
- **运行（Running）**：线程正在执行
- **阻塞（Blocked）**：线程等待监视器锁
- **等待（Waiting）**：线程无限期等待其他线程操作
- **限时等待（Timed Waiting）**：线程在指定时间内等待其他线程操作
- **终止（Terminated）**：线程执行完毕

## 4. 线程方法

- `start()`：启动线程，JVM调用`run()`方法
- `run()`：线程执行体（用户自定义逻辑）
- `sleep()`：暂停当前线程指定时间
- `join()`：等待线程结束
- `interrupt()`：中断线程
- `isAlive()`：检查线程是否存活
- `getName()/setName()`：获取/设置线程名称
- `getPriority()/setPriority()`：获取/设置线程优先级（1-10，默认5）

## 5. 示例：继承Thread类

```java
class MyThread extends Thread {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，计数：" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread();
        MyThread thread2 = new MyThread();
        thread1.start();
        thread2.start();
    }
}
```

**输出：**
```
Thread-0正在运行，计数：0
Thread-1正在运行，计数：0
...（后续每隔1秒输出计数）
```

## 6. 示例：实现Runnable接口

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，计数：" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyRunnable runnable = new MyRunnable();
        Thread thread1 = new Thread(runnable);
        Thread thread2 = new Thread(runnable);
        thread1.start();
        thread2.start();
    }
}
```

## 7. 线程优先级

线程优先级决定执行顺序（1-10，默认5）：

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println(Thread.currentThread().getName() + "优先级：" + getPriority());
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread();
        MyThread t2 = new MyThread();
        t1.setPriority(Thread.MIN_PRIORITY); // 1
        t2.setPriority(Thread.MAX_PRIORITY); // 10
        t1.start();
        t2.start();
    }
}
```

**输出：**
```
Thread-0优先级：1
Thread-1优先级：10
```

## 8. 线程同步

通过`synchronized`关键字控制共享资源访问：

```java
class Counter {
    private int count = 0;

    public synchronized void increment() {
        count++;
    }

    public int getCount() {
        return count;
    }
}

public class SyncExample {
    public static void main(String[] args) throws InterruptedException {
        Counter counter = new Counter();
        Runnable task = () -> {
            for (int i = 0; i < 1000; i++) counter.increment();
        };

        Thread t1 = new Thread(task);
        Thread t2 = new Thread(task);
        t1.start();
        t2.start();
        t1.join();
        t2.join();

        System.out.println("最终计数：" + counter.getCount()); // 输出2000
    }
}
```

## 9. 线程间通信

使用`wait()`、`notify()`、`notifyAll()`实现协作：

```java
class SharedResource {
    private int data;
    private boolean available = false;

    public synchronized void produce(int value) throws InterruptedException {
        while (available) wait();
        data = value;
        available = true;
        notify();
    }

    public synchronized int consume() throws InterruptedException {
        while (!available) wait();
        available = false;
        notify();
        return data;
    }
}

public class CommunicationExample {
    public static void main(String[] args) {
        SharedResource sr = new SharedResource();

        new Thread(() -> {
            for (int i = 1; i <= 5; i++) {
                try {
                    sr.produce(i);
                    System.out.println("生产：" + i);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();

        new Thread(() -> {
            for (int i = 1; i <= 5; i++) {
                try {
                    int val = sr.consume();
                    System.out.println("消费：" + val);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        }).start();
    }
}
```

**输出：**
```
生产：1 → 消费：1 → 生产：2 → 消费：2 ...（交替执行）
```

## 10. 守护线程

守护线程是后台运行的低优先级线程（如垃圾回收）：

```java
class MyDaemonThread extends Thread {
    @Override
    public void run() {
        while (true) {
            System.out.println("守护线程运行中");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyDaemonThread daemon = new MyDaemonThread();
        daemon.setDaemon(true); // 设置为守护线程
        daemon.start();

        try {
            Thread.sleep(3000); // 主线程休眠3秒
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("主线程退出");
    }
}
```

**输出：**
```
守护线程运行中（每秒输出一次）
主线程退出（3秒后程序终止）
```

## 11. 结论

Java的Thread类提供了强大的多线程管理机制。通过继承Thread类或实现Runnable接口，开发者可以创建并发任务。理解线程生命周期、同步机制、线程间通信和守护线程等概念，是编写高效健壮多线程应用的关键。