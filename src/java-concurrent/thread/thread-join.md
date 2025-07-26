---
title: Thread中的join方法
category:
  - java线程
tag:
  - Thread
  - join
---

# Java多线程教程：Thread中的join方法

Java中的`join`方法用于暂停当前线程的执行，直到指定线程完成执行。当需要确保某个线程完成任务后再继续程序时，这个方法特别有用。`join`方法可以在线程实例上调用，有三种重载形式：`join()`、`join(long millis)`和`join(long millis, int nanos)`。

## 目录

[[toc]]


## 1. join方法变体

### join()

暂停当前线程，直到指定线程执行完毕。

```java
public final void join() throws InterruptedException
```

### join(long millis)

暂停当前线程，等待指定毫秒数或线程完成（以先发生者为准）。

```java
public final void join(long millis) throws InterruptedException
```

### join(long millis, int nanos)

暂停当前线程，等待指定毫秒数+纳秒数或线程完成（以先发生者为准）。

```java
public final void join(long millis, int nanos) throws InterruptedException
```

## 2. 使用join()方法示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 设置线程名称
    }

    @Override
    public void run() {
        for (int i = 0; i < 3; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行");
            try {
                Thread.sleep(500); // 休眠500毫秒
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread("线程-1");
        MyThread t2 = new MyThread("线程-2");
        MyThread t3 = new MyThread("线程-3");

        t1.start(); // 启动线程1
        t2.start(); // 启动线程2
        t3.start(); // 启动线程3

        try {
            t1.join(); // 等待线程1完成
            t2.join(); // 等待线程2完成
            t3.join(); // 等待线程3完成
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("所有线程执行完毕");
    }
}
```

**输出：**
```
线程-1正在运行
线程-2正在运行
线程-3正在运行
线程-1正在运行
线程-2正在运行
线程-3正在运行
线程-1正在运行
线程-2正在运行
线程-3正在运行
所有线程执行完毕
```

## 3. 使用join(long millis)方法示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name);
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行");
            try {
                Thread.sleep(1000); // 休眠1秒
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread("线程-1");
        t1.start();

        try {
            t1.join(3000); // 等待3秒或线程完成
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("主线程继续执行");
    }
}
```

**输出：**
```
线程-1正在运行
线程-1正在运行
线程-1正在运行
主线程继续执行
线程-1正在运行
线程-1正在运行
```

## 4. 使用join(long millis, int nanos)方法示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name);
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行");
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread("线程-1");
        t1.start();

        try {
            // 等待2秒500毫秒或线程完成
            t1.join(2000, 500000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        System.out.println("主线程继续执行");
    }
}
```

**输出：**
```
线程-1正在运行
线程-1正在运行
主线程继续执行
线程-1正在运行
线程-1正在运行
线程-1正在运行
```

## 5. 示例5

```java
import java.util.concurrent.TimeUnit;

public class Join {
    public static void main(String[] args) throws Exception {
        Thread previous = Thread.currentThread();
        for (int i = 0; i < 10; i++) {
// 每个线程拥有前一个线程的引用，需要等待前一个线程终止，才能从等待中返回
            Thread thread = new Thread(new Domino(previous), String.valueOf(i));
            thread.start();
            previous = thread;
        }
        TimeUnit.SECONDS.sleep(5);
        System.out.println(Thread.currentThread().getName() + " terminate.");
    }
    static class Domino implements Runnable {
        private Thread thread;
        public Domino(Thread thread) {
            this.thread = thread;
        }
        public void run() {
            try {
                thread.join();
            } catch (InterruptedException e) {
            }
            System.out.println(Thread.currentThread().getName() + " terminate.");
        }
    }
}
```

## 6. 结论

Java的`join`方法用于控制线程执行流程。通过`join()`、`join(long millis)`和`join(long millis, int nanos)`方法，可以确保某个线程完成后再继续其他线程的执行。这有助于协调任务，确保程序在必要条件满足后再继续运行。