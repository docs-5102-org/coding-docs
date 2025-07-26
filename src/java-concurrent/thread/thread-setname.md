---
title: Thread设置线程名
category:
  - java线程
tag:
  - Thread
---

# Java多线程教程：Thread设置线程名

在Java中，每个线程都有一个用于标识的名称。默认情况下，Java虚拟机（JVM）会为线程分配默认名称（如"Thread-0"、"Thread-1"），但开发者也可以自定义线程名称。设置线程名称对调试和监控非常有用，能帮助快速识别多线程应用中的不同线程。

## 目录

[[toc]]


## 1. 设置线程名称

通过`Thread`类的`setName(String name)`方法设置线程名称：

```java
public void setName(String name)
```

## 2. 获取线程名称

通过`Thread`类的`getName()`方法获取线程名称：

```java
public String getName()
```

## 3. 设置与获取线程名称示例

```java
class MyThread extends Thread {
    public MyThread(String name) {
        super(name); // 调用父类构造器设置线程名称
    }

    @Override
    public void run() {
        System.out.println("线程正在运行：" + getName());
    }

    public static void main(String[] args) {
        MyThread t1 = new MyThread("线程-A");
        MyThread t2 = new MyThread("线程-B");
        
        t1.start(); // 启动线程1
        t2.start(); // 启动线程2
        
        // 修改线程1的名称
        t1.setName("重命名-线程-A");
        System.out.println("线程1新名称：" + t1.getName());
        System.out.println("线程2名称：" + t2.getName());
    }
}
```

**输出：**
```
线程正在运行：线程-A
线程正在运行：线程-B
线程1新名称：重命名-线程-A
线程2名称：线程-B
```

## 4. 使用Lambda表达式设置线程名称

```java
public class LambdaThreadNameExample {
    public static void main(String[] args) {
        Runnable task1 = () -> System.out.println("线程正在运行：" + Thread.currentThread().getName());
        Runnable task2 = () -> System.out.println("线程正在运行：" + Thread.currentThread().getName());
        
        Thread t1 = new Thread(task1, "Lambda-线程-A");
        Thread t2 = new Thread(task2, "Lambda-线程-B");
        
        t1.start(); // 启动线程1
        t2.start(); // 启动线程2
        
        // 修改线程1的名称
        t1.setName("重命名-Lambda-线程-A");
        System.out.println("线程1新名称：" + t1.getName());
        System.out.println("线程2名称：" + t2.getName());
    }
}
```

**输出：**
```
线程正在运行：Lambda-线程-A
线程正在运行：Lambda-线程-B
线程1新名称：重命名-Lambda-线程-A
线程2名称：Lambda-线程-B
```

## 5. 结论

设置和获取线程名称是Java中简单但强大的功能，对调试和监控多线程应用非常有帮助。通过`setName`和`getName`方法，可以轻松识别和管理程序中的线程。本文通过`Thread`类和Lambda表达式两种方式展示了如何有效设置和获取线程名称。