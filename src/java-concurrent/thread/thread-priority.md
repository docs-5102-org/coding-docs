---
title: 线程优先级
category:
  - java线程
tag:
  - Thread
  - 线程优先级
---

# Java多线程教程：Thread线程优先级

在Java中，每个线程都被赋予一个优先级，帮助线程调度器决定线程的执行顺序。线程优先级是一个整数，范围从`Thread.MIN_PRIORITY`（1）到`Thread.MAX_PRIORITY`（10）。默认优先级是`Thread.NORM_PRIORITY`（5）。线程调度器根据这些优先级决定各线程何时运行。但需注意，线程优先级不保证执行顺序，它仅仅是对线程调度器的一个建议。

## 目录

[[toc]]


## 1. 设置线程优先级

可以通过`Thread`类的`setPriority(int newPriority)`方法设置线程优先级。新优先级必须在`Thread.MIN_PRIORITY`和`Thread.MAX_PRIORITY`范围内。

**语法：**
```java
public final void setPriority(int newPriority)
```

## 2. 获取线程优先级

可以通过`Thread`类的`getPriority()`方法获取线程优先级。该方法返回线程优先级的整数值。

**语法：**
```java
public final int getPriority()
```

## 3. 示例：设置和获取线程优先级

通过以下示例演示如何设置和获取线程优先级：

**示例代码：**
```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 调用父类构造函数设置线程名
    }

    @Override
    public void run() {
        for (int i = 0; i < 3; i++) {
            System.out.println(Thread.currentThread().getName() + " 优先级为 " +
                Thread.currentThread().getPriority() + " 正在运行。");
        }
    }

    public static void main(String[] args) {
        MyThread thread1 = new MyThread("线程-1");
        MyThread thread2 = new MyThread("线程-2");
        MyThread thread3 = new MyThread("线程-3");

        // 设置优先级
        thread1.setPriority(Thread.MIN_PRIORITY); // 优先级1
        thread2.setPriority(Thread.NORM_PRIORITY); // 优先级5
        thread3.setPriority(Thread.MAX_PRIORITY); // 优先级10

        // 启动线程
        thread1.start();
        thread2.start();
        thread3.start();

        // 显示优先级
        System.out.println(thread1.getName() + " 优先级：" + thread1.getPriority());
        System.out.println(thread2.getName() + " 优先级：" + thread2.getPriority());
        System.out.println(thread3.getName() + " 优先级：" + thread3.getPriority());
    }
}
```

**输出结果：**
```
线程-1 优先级：1
线程-2 优先级：5
线程-3 优先级：10
线程-3 优先级为 10 正在运行。
线程-3 优先级为 10 正在运行。
线程-3 优先级为 10 正在运行。
线程-2 优先级为 5 正在运行。
线程-2 优先级为 5 正在运行。
线程-2 优先级为 5 正在运行。
线程-1 优先级为 1 正在运行。
线程-1 优先级为 1 正在运行。
线程-1 优先级为 1 正在运行。
```

**代码解释：**

- `MyThread`类继承自`Thread`类，并调用父类构造函数设置线程名。
- `run`方法打印当前线程的名称和优先级。
- 在`main`方法中：
  - 创建三个自定义名称的`MyThread`对象。
  - 使用`setPriority`方法设置线程优先级。
  - 使用`start`方法启动线程。
  - 使用`getPriority`方法打印线程优先级。

## 4. 结论

Java线程优先级是一个实用功能，可帮助线程调度器决定线程执行顺序。通过设置和获取线程优先级，您可以影响程序中线程的执行行为。但请记住：线程优先级仅仅是对调度器的建议，并不保证执行顺序。本指南通过示例演示了Java中设置和获取线程优先级的方法。