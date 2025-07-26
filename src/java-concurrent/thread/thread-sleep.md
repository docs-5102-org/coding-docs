---
title: Thread中的sleep方法
category:
  - java线程
tag:
  - Thread
  - sleep
---

# Java多线程教程：Thread中的sleep方法

Java中的`sleep`方法用于暂停当前线程的执行指定时间。该方法属于Thread类，允许临时挂起线程而不终止它。`sleep`方法可能抛出`InterruptedException`，因此必须使用`try-catch`块处理。

## 目录

[[toc]]


## 1. sleep方法变体

### sleep(long millis)

暂停当前线程执行指定毫秒数。

```java
public static void sleep(long millis) throws InterruptedException
```

### sleep(long millis, int nanos)

暂停当前线程执行指定毫秒数+纳秒数。

```java
public static void sleep(long millis, int nanos) throws InterruptedException
```

## 2. 使用sleep(long millis)方法示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 设置线程名称
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，迭代次数：" + i);
            try {
                Thread.sleep(1000); // 休眠1000毫秒（1秒）
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread("线程-1");
        MyThread thread2 = new MyThread("线程-2");
        thread1.start(); // 启动线程1
        thread2.start(); // 启动线程2
    }
}
```

**输出：**
```
线程-1正在运行，迭代次数：0
线程-2正在运行，迭代次数：0
线程-1正在运行，迭代次数：1
线程-2正在运行，迭代次数：1
...（后续每隔1秒输出一次）
```

## 3. 使用sleep(long millis, int nanos)方法示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name);
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，迭代次数：" + i);
            try {
                // 休眠1000毫秒+500000纳秒（0.5毫秒）
                Thread.sleep(1000, 500000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread("线程-1");
        MyThread thread2 = new MyThread("线程-2");
        thread1.start();
        thread2.start();
    }
}
```

**输出：**
```
线程-1正在运行，迭代次数：0
线程-2正在运行，迭代次数：0
...（后续每隔1.0005秒输出一次）
```

## 4. 处理InterruptedException

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name);
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + "正在运行，迭代次数：" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + "被中断！");
                return; // 中断后退出run方法
            }
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread("线程-1");
        thread1.start();

        try {
            Thread.sleep(3000); // 主线程休眠3秒
            thread1.interrupt(); // 中断线程1
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

**输出：**
```
线程-1正在运行，迭代次数：0
线程-1正在运行，迭代次数：1
线程-1正在运行，迭代次数：2
线程-1被中断！
```

## 5. 结论

Java的`sleep`方法用于控制线程执行流程。通过`sleep(long millis)`和`sleep(long millis, int nanos)`方法，可精确控制线程暂停时间。处理`InterruptedException`至关重要，确保程序能优雅处理中断。