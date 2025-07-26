---
title: 检测线程是否运行(isAlive)
category:
  - java线程
tag:
  - Thread
  - isAlive
---

# Java多线程教程：Thread isAlive方法

Java中的`isAlive`方法用于检查线程是否正在运行。如果线程已启动但尚未终止，返回`true`；否则返回`false`。该方法在需要等待线程执行完成后再继续其他任务时非常有用。

## 目录

[[toc]]


## 1. 使用isAlive方法

`isAlive`方法属于`Thread`类，可在任意线程实例上调用以检查其存活状态。

**语法：**
```java
public final boolean isAlive()
```

## 2. 示例：检查线程是否存活

以下示例演示如何使用`isAlive`方法判断线程是否处于运行状态：

**示例代码：**
```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 设置线程名称
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + " 正在运行。迭代次数：" + i);
            try {
                Thread.sleep(500); // 休眠500毫秒
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread("Thread-1");
        
        System.out.println("启动前，Thread-1是否存活？" + thread1.isAlive());
        
        thread1.start(); // 启动线程1
        System.out.println("启动后，Thread-1是否存活？" + thread1.isAlive());
        
        try {
            thread1.join(); // 等待线程1执行完毕
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        System.out.println("执行完毕后，Thread-1是否存活？" + thread1.isAlive());
    }
}
```

**输出结果：**
```
启动前，Thread-1是否存活？false
启动后，Thread-1是否存活？true
Thread-1 正在运行。迭代次数：0
Thread-1 正在运行。迭代次数：1
Thread-1 正在运行。迭代次数：2
Thread-1 正在运行。迭代次数：3
Thread-1 正在运行。迭代次数：4
执行完毕后，Thread-1是否存活？false
```

**代码解释：**

- `MyThread`类继承自`Thread`类并设置线程名称。
- `run`方法打印线程名称和迭代次数，每次迭代后休眠500毫秒。
- 在`main`方法中：
  - 创建线程实例并检查启动前状态。
  - 启动线程后再次检查状态。
  - 使用`join`方法等待线程执行完毕。
  - 最终检查线程状态。

## 3. 示例：使用isAlive等待线程结束

此示例演示如何通过循环调用`isAlive`方法等待线程执行完成：

**示例代码：**
```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 设置线程名称
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + " 正在运行。迭代次数：" + i);
            try {
                Thread.sleep(500); // 休眠500毫秒
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread("Thread-1");
        
        thread1.start(); // 启动线程1
        
        while (thread1.isAlive()) {
            System.out.println("正在等待Thread-1执行完毕...");
            try {
                Thread.sleep(200); // 休眠200毫秒
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
        
        System.out.println("Thread-1已执行完毕。");
    }
}
```

**输出结果：**
```
Thread-1 正在运行。迭代次数：0
正在等待Thread-1执行完毕...
Thread-1 正在运行。迭代次数：1
正在等待Thread-1执行完毕...
Thread-1 正在运行。迭代次数：2
正在等待Thread-1执行完毕...
Thread-1 正在运行。迭代次数：3
正在等待Thread-1执行完毕...
Thread-1 正在运行。迭代次数：4
Thread-1已执行完毕。
```

**代码解释：**

- `main`方法中启动线程后，通过`while`循环持续检查线程状态。
- 主线程每次循环休眠200毫秒，避免过度占用CPU资源。
- 当线程执行完毕（`isAlive`返回`false`）时，循环终止并输出完成信息。

## 4. 结论

Java的`isAlive`方法用于检查线程状态。通过该方法，您可以判断线程是否处于运行状态，并在其执行完毕后再继续后续任务。这在多线程应用中协调多个线程时尤为有用。