---
title: interrupt()方法
category:
  - java线程
tag:
  - ThreadGroup
---

# Java并发编程：ThreadGroup的interrupt()方法

在Java中，`ThreadGroup.interrupt()` 方法用于中断线程组中的所有线程。本指南将介绍该方法的用法，解释其工作原理，并通过示例展示其功能。

## 目录

[[toc]]

## 引言

`ThreadGroup.interrupt()` 方法用于中断线程组及其子组中的所有线程。这在需要同时停止一组线程时非常有用。

## interrupt()方法语法

`interrupt()` 方法的语法如下：

```java
public void interrupt()
```

- **参数**：该方法不接受任何参数。
- **返回值**：该方法不返回任何值。

## 理解interrupt()

`interrupt()` 方法会遍历线程组及其子组中的所有活动线程，并对每个线程调用 `interrupt()`。该方法不会中断非活动状态的线程。

## 示例

### 基本用法

为展示 `interrupt()` 的基本用法，我们创建一个简单示例，在一个线程组中添加多个线程，然后中断该线程组。

```java
public class ThreadGroupInterruptExample {
    public static void main(String[] args) {
        ThreadGroup group = new ThreadGroup("ExampleGroup");
        
        Runnable task = () -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    System.out.println(Thread.currentThread().getName() + "正在运行");
                    Thread.sleep(500);
                }
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + "被中断");
            }
        };
        
        Thread thread1 = new Thread(group, task, "Thread-1");
        Thread thread2 = new Thread(group, task, "Thread-2");
        Thread thread3 = new Thread(group, task, "Thread-3");
        
        thread1.start();
        thread2.start();
        thread3.start();
        
        // 让线程运行一小段时间
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // 中断线程组中的所有线程
        group.interrupt();
    }
}
```

**输出：**
```
Thread-1正在运行
Thread-2正在运行
Thread-3正在运行
Thread-1正在运行
Thread-2正在运行
Thread-3正在运行
Thread-1被中断
Thread-2被中断
Thread-3被中断
```

### 结合子组使用interrupt()

你也可以使用 `interrupt()` 方法来中断嵌套组中的线程。

```java
public class ThreadGroupSubgroupsInterruptExample {
    public static void main(String[] args) {
        ThreadGroup parentGroup = new ThreadGroup("ParentGroup");
        ThreadGroup childGroup = new ThreadGroup(parentGroup, "ChildGroup");
        
        Runnable task = () -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    System.out.println(Thread.currentThread().getName() + "正在运行");
                    Thread.sleep(500);
                }
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + "被中断");
            }
        };
        
        Thread thread1 = new Thread(parentGroup, task, "Thread-1");
        Thread thread2 = new Thread(childGroup, task, "Thread-2");
        Thread thread3 = new Thread(childGroup, task, "Thread-3");
        
        thread1.start();
        thread2.start();
        thread3.start();
        
        // 让线程运行一小段时间
        try {
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // 中断父线程组中的所有线程（包括子组）
        parentGroup.interrupt();
    }
}
```

**输出：**
```
Thread-1正在运行
Thread-2正在运行
Thread-3正在运行
Thread-1正在运行
Thread-2正在运行
Thread-3正在运行
Thread-1被中断
Thread-2被中断
Thread-3被中断
```

## 实际应用案例

### 优雅停止一组工作线程

在多线程应用程序中，可能会有一组工作线程执行任务。使用 `ThreadGroup.interrupt()`，当满足特定条件或应用程序关闭时，你可以优雅地停止所有工作线程。

```java
public class WorkerThreadsExample {
    public static void main(String[] args) {
        ThreadGroup workerGroup = new ThreadGroup("WorkerGroup");
        
        Runnable task = () -> {
            try {
                while (!Thread.currentThread().isInterrupted()) {
                    System.out.println(Thread.currentThread().getName() + "正在处理");
                    Thread.sleep(500);
                }
            } catch (InterruptedException e) {
                System.out.println(Thread.currentThread().getName() + "被中断");
            }
        };
        
        for (int i = 0; i < 5; i++) {
            new Thread(workerGroup, task, "Worker-" + i).start();
        }
        
        // 让工作线程处理一小段时间
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        
        // 停止所有工作线程
        System.out.println("正在中断所有工作线程...");
        workerGroup.interrupt();
    }
}
```

**输出：**
```
Worker-0正在处理
Worker-1正在处理
Worker-2正在处理
Worker-3正在处理
Worker-4正在处理
Worker-0正在处理
Worker-1正在处理
Worker-2正在处理
Worker-3正在处理
Worker-4正在处理
Worker-0正在处理
Worker-1正在处理
Worker-2正在处理
Worker-3正在处理
Worker-4正在处理
正在中断所有工作线程...
Worker-0被中断
Worker-1被中断
Worker-2被中断
Worker-3被中断
Worker-4被中断
```

## 结论

Java中的 `ThreadGroup.interrupt()` 方法提供了一种中断线程组及其子组中所有线程的方式。通过使用该方法，你可以高效地管理和控制线程的执行，确保在需要时可以优雅地停止线程组。无论你处理的是简单的线程组还是复杂的线程层次结构，`ThreadGroup.interrupt()` 方法都为管理线程执行提供了可靠的工具。
