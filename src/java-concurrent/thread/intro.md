---
title: 概述
category:
  - java线程
tag:
  - Thread
---

# 概述


Java中的多线程允许多个线程并发运行，从而能够同时执行多个任务。线程是程序中的轻量级进程，它们共享相同的内存空间。本指南将介绍在Java中使用两种主要方法创建和启动线程的基础知识：扩展`Thread`类和实现`Runnable`接口。

## 目录

[[toc]]


## 1. 线程简介

线程是可以与其他线程并发运行的轻量级进程。Java通过`java.lang.Thread`类和`java.lang.Runnable`接口提供了对多线程的内置支持。多线程可以通过更好地利用系统资源来提高应用程序的性能。

线程有时被称为轻量进程(Lightweight Process，LWP），是程序执行流的最小单元

## 2. 通过扩展`Thread`类创建线程

在Java中创建线程的一种方法是扩展`Thread`类并覆盖其`run`方法。

**示例：**

```java
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("线程正在运行。");
    }

    public static void main(String[] args) {
        MyThread thread = new MyThread(); // 创建一个线程对象
        thread.start(); // 启动线程
    }
}
```

**解释：**

- `MyThread`类扩展了`Thread`类。
- `run`方法包含将由线程执行的代码。
- 在`main`方法中，创建了一个`MyThread`对象，并调用`start`方法来启动线程。

## 3. 通过实现`Runnable`接口创建线程

在Java中创建线程的另一种方法是实现`Runnable`接口，并将实现类的实例传递给`Thread`对象。

**示例：**

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("线程正在运行。");
    }

    public static void main(String[] args) {
        MyRunnable myRunnable = new MyRunnable(); // 创建一个可运行对象
        Thread thread = new Thread(myRunnable); // 将可运行对象传递给Thread对象
        thread.start(); // 启动线程
    }
}
```

**解释：**

- `MyRunnable`类实现了`Runnable`接口。
- `run`方法包含将由线程执行的代码。
- 在`main`方法中，创建了一个`MyRunnable`对象，将其传递给`Thread`对象，并调用`start`方法来启动线程。

## 4. 使用Lambda表达式创建线程

从Java 8开始，您可以使用Lambda表达式以更简洁的方式创建线程。

**示例：**

```java
public class LambdaThreadExample {
    public static void main(String[] args) {
        Runnable task = () -> System.out.println("线程正在运行。");
        Thread thread = new Thread(task);
        thread.start();
    }
}
```

**解释：**

- Lambda表达式用于定义`Runnable`接口的`run`方法。
- Lambda表达式被传递给`Thread`对象，并调用`start`方法来启动线程。

## 5. 常用线程方法

- `start()`：启动线程的执行。`run`方法由Java虚拟机（JVM）调用。
- `run()`：包含将由线程执行的代码。此方法由线程的`start`方法调用。
- `sleep(long millis)`：暂停当前线程的执行指定的毫秒数。
- `join()`：等待线程终止。此方法用于确保一个线程在另一个线程开始之前完成其执行。
- `isAlive()`：如果线程仍在运行或未终止，则返回`true`。

## 6. 示例程序

**示例1：扩展`Thread`类**

```java
class MyThread extends Thread {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println("线程运行中：" + i);
        }
    }

    public static void main(String[] args) {
        MyThread thread = new MyThread();
        thread.start();
    }
}
```

**示例2：实现`Runnable`接口**

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println("线程运行中：" + i);
        }
    }

    public static void main(String[] args) {
        MyRunnable myRunnable = new MyRunnable();
        Thread thread = new Thread(myRunnable);
        thread.start();
    }
}
```

**示例3：使用Lambda表达式**

```java
public class LambdaThreadExample {
    public static void main(String[] args) {
        Runnable task = () -> {
            for (int i = 0; i < 5; i++) {
                System.out.println("线程运行中：" + i);
            }
        };
        Thread thread = new Thread(task);
        thread.start();
    }
}
```

## 7. 结论

在Java中创建和启动线程可以通过多种方法完成，包括扩展`Thread`类、实现`Runnable`接口以及使用Lambda表达式。每种方法都有其特定的用例和优势。了解这些方法和常见的线程操作可以帮助您在Java应用程序中有效地利用多线程。
