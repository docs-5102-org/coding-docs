---
title: Runnable接口
category:
  - java线程
tag:
  - Runnable
---

# Java多线程教程：Runnable接口

Java中的Runnable接口是一个函数式接口，用于定义可被线程执行的任务。它提供了一种定义并发执行任务的方式，常与Thread类或java.util.concurrent包中的执行器结合使用。

## 目录

[[toc]]


## 1. Runnable接口概述

Runnable接口是一个单方法接口，仅定义了run()方法，该方法包含线程要执行的任务代码。

```java
public interface Runnable {
    void run();
}
```

## 2. 实现Runnable

要创建Runnable任务，需定义一个类实现Runnable接口并实现run()方法。

示例：

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable任务正在运行。");
    }
}
```

## 3. 运行Runnable

运行Runnable任务有两种常见方式：

- 通过Thread类
- 通过java.util.concurrent包中的执行器

通过Thread类运行：

```java
public class RunnableExample {
    public static void main(String[] args) {
        MyRunnable myRunnable = new MyRunnable();
        Thread thread = new Thread(myRunnable);
        thread.start(); // 启动线程
    }
}
```

## 4. 示例：实现并运行Runnable

完整示例：

```java
class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + " 正在运行。计数：" + i);
            try {
                Thread.sleep(1000); // 通过睡眠模拟工作
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

public class RunnableExample {
    public static void main(String[] args) {
        MyRunnable myRunnable = new MyRunnable();
        Thread thread1 = new Thread(myRunnable);
        Thread thread2 = new Thread(myRunnable);
        
        thread1.start();
        thread2.start();
    }
}
```

输出：

```
Thread-0 正在运行。计数：0
Thread-1 正在运行。计数：0
Thread-0 正在运行。计数：1
Thread-1 正在运行。计数：1
...（后续计数交替输出）
```

说明：

- MyRunnable类实现Runnable接口并覆盖run()方法。
- 创建两个Thread对象，共享同一个MyRunnable实例。
- 两个线程并发执行run()方法。

## 5. 结合Executor使用Runnable

java.util.concurrent包提供ExecutorService接口和线程池实现，能更灵活高效地管理线程。

示例：

```java
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

class MyRunnable implements Runnable {
    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(Thread.currentThread().getName() + " 正在运行。计数：" + i);
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}

public class RunnableWithExecutorExample {
    public static void main(String[] args) {
        ExecutorService executorService = Executors.newFixedThreadPool(2);
        MyRunnable myRunnable = new MyRunnable();
        
        executorService.submit(myRunnable);
        executorService.submit(myRunnable);
        
        executorService.shutdown();
    }
}
```

输出：

```
pool-1-thread-1 正在运行。计数：0
pool-1-thread-2 正在运行。计数：0
pool-1-thread-1 正在运行。计数：1
pool-1-thread-2 正在运行。计数：1
...（后续计数交替输出）
```

说明：

- 创建一个包含2个线程的固定线程池。
- 提交两个MyRunnable任务到执行器。
- 线程池中的线程并发执行run()方法。

## 6. 使用Lambda表达式简化Runnable

Java 8引入Lambda表达式后，可更简洁地创建Runnable实例。

示例：

```java
public class RunnableWithLambdaExample {
    public static void main(String[] args) {
        Runnable task = () -> {
            for (int i = 0; i < 5; i++) {
                System.out.println(Thread.currentThread().getName() + " 正在运行。计数：" + i);
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
            }
        };
        
        Thread thread1 = new Thread(task);
        Thread thread2 = new Thread(task);
        
        thread1.start();
        thread2.start();
    }
}
```

输出：

```
Thread-0 正在运行。计数：0
Thread-1 正在运行。计数：0
...（后续计数交替输出）
```

说明：

- 使用Lambda表达式直接定义Runnable的run()方法。
- 创建两个Thread对象执行同一任务。

## 7. 使用Runnable的优势

- **任务与执行解耦**：任务逻辑与执行线程分离。
- **设计灵活性**：类可在实现Runnable的同时继承其他类。
- **支持线程池**：可与Executor框架结合，优化线程管理。
- **代码简洁性**：结合Lambda表达式减少冗余代码。

## 8. 结论

Runnable接口是Java多线程编程的核心工具，通过实现该接口，可定义能被线程或线程池执行的任务。结合Java 8的Lambda表达式，代码更简洁高效。掌握Runnable接口的使用对编写并发应用至关重要。