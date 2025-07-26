---
title: Thread中断（interrupt）
category:
  - java线程
tag:
  - Thread
  - interrupt
---

# Java多线程教程：Thread中断（interrupt）

Java中的`interrupt`方法用于中断当前运行的线程。该方法将线程的中断状态设置为`true`。如果线程处于阻塞状态（如等待、睡眠或I/O阻塞），则会抛出`InterruptedException`。被中断的线程可以捕获该异常并采取相应措施。

## 目录

[[toc]]


## 1. 如何中断线程

通过调用线程实例的`interrupt`方法中断线程：

```java
public void interrupt()
```

## 2. 检查中断状态

使用`isInterrupted`方法或静态的`Thread.interrupted`方法检查中断状态：

```java
public boolean isInterrupted() // 检查中断状态但不清除
public static boolean interrupted() // 检查并清除中断状态
```

## 3. 处理InterruptedException

当线程在阻塞状态下被中断时（如睡眠或等待），会抛出`InterruptedException`，需使用`try-catch`块处理。

## 4. 中断线程示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 设置线程名称
    }

    @Override
    public void run() {
        while (!isInterrupted()) {
            System.out.println(Thread.currentThread().getName() + "正在运行");
            try {
                Thread.sleep(1000); // 休眠1秒
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + "在睡眠中被中断");
                interrupt(); // 重新设置中断状态
            }
        }
        System.out.println(Thread.currentThread().getName() + "已结束");
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread("线程-1");
        t1.start();

        try {
            Thread.sleep(3000); // 主线程休眠3秒
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        t1.interrupt(); // 中断线程1
    }
}
```

**输出：**
```
线程-1正在运行
线程-1正在运行
线程-1正在运行
线程-1在睡眠中被中断
线程-1已结束
```

## 5. 处理睡眠线程中断示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name);
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            if (isInterrupted()) {
                System.out.println(Thread.currentThread().getName() + "被中断");
                break;
            }
            System.out.println(Thread.currentThread().getName() + "运行中，迭代：" + i);
            try {
                Thread.sleep(1000); // 休眠1秒
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + "在睡眠中被中断");
                break;
            }
        }
        System.out.println(Thread.currentThread().getName() + "已结束");
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread("线程-1");
        t1.start();

        try {
            Thread.sleep(3000); // 主线程休眠3秒
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

        t1.interrupt(); // 中断线程1
    }
}
```

**输出：**
```
线程-1运行中，迭代：0
线程-1运行中，迭代：1
线程-1运行中，迭代：2
线程-1在睡眠中被中断
线程-1已结束
```

## 6. 结论

Java的`interrupt`方法用于控制线程执行流程。通过`interrupt`、`isInterrupted`和`interrupted`方法，可以优雅地处理线程中断。正确处理`InterruptedException`能确保线程在各种条件下可控地响应中断，使应用程序行为符合预期。