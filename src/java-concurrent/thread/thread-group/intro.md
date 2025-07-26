---
title: 线程组
category:
  - java线程
tag:
  - Thread
  - ThreadGroup
---

# Java多线程教程：Thread Group线程组

Java中的`ThreadGroup`类提供了一种将线程分组管理的机制。一个`ThreadGroup`可以包含多个线程甚至其他线程组，形成树状结构。这使得可以对一组线程进行统一管理和控制。

## 目录

[[toc]]


## 1. ThreadGroup类概述

`ThreadGroup`类属于`java.lang`包，提供以下功能：

- 创建线程组
- 设置组内所有线程的最大优先级
- 处理组内所有线程的未捕获异常
- 中断、挂起或恢复组内所有线程

**核心方法：**

- `activeCount()`：返回组内活动线程的估计数量。
- `activeGroupCount()`：返回组内活动子组的估计数量。
- `enumerate(Thread[] list)`：将组内所有活动线程复制到指定数组。
- `getMaxPriority()`：返回组的最大优先级。
- `interrupt()`：中断组内所有线程。
- `setMaxPriority(int pri)`：设置组的最大优先级。
- `uncaughtException(Thread t, Throwable e)`：处理线程未捕获异常。

## 2. 创建线程组

通过指定名称或父组+名称创建线程组：

```java
ThreadGroup group1 = new ThreadGroup("Group 1");
ThreadGroup parentGroup = new ThreadGroup("Parent Group");
ThreadGroup group2 = new ThreadGroup(parentGroup, "Group 2");
```

## 3. 向线程组添加线程

创建线程时指定所属线程组：

```java
ThreadGroup group = new ThreadGroup("Group");
Thread thread1 = new Thread(group, () -> {
    for (int i = 0; i < 5; i++) {
        System.out.println(Thread.currentThread().getName() + " in " + group.getName());
        try { 
            Thread.sleep(500); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
    }
}, "Thread 1");
```

## 4. 管理线程组

对组内所有线程进行统一操作：

```java
group.setMaxPriority(Thread.NORM_PRIORITY); // 设置最大优先级
group.interrupt(); // 中断所有线程
```

## 5. ThreadGroup方法详解

### activeCount()

```java
int activeThreads = group.activeCount();
System.out.println("活动线程数: " + activeThreads);
```

### activeGroupCount()

```java
int activeGroups = group.activeGroupCount();
System.out.println("活动子组数: " + activeGroups);
```

### enumerate(Thread[] list)

```java
Thread[] threads = new Thread[group.activeCount()];
group.enumerate(threads);
for (Thread t : threads) { 
    System.out.println(t.getName()); 
}
```

### getMaxPriority()

```java
int maxPriority = group.getMaxPriority();
System.out.println("最大优先级: " + maxPriority);
```

### interrupt()

```java
group.interrupt(); // 中断所有线程
```

### setMaxPriority(int pri)

```java
group.setMaxPriority(Thread.MAX_PRIORITY); // 设置最大优先级为10
```

### uncaughtException(Thread t, Throwable e)

```java
group.uncaughtException(thread1, new Exception("测试异常"));
```

## 6. 示例：创建和管理线程组

```java
public class ThreadGroupExample {
    public static void main(String[] args) {
        ThreadGroup group = new ThreadGroup("Group 1");
        
        Thread thread1 = new Thread(group, () -> {
            for (int i = 0; i < 5; i++) {
                System.out.println(Thread.currentThread().getName() + " in " + group.getName());
                try { 
                    Thread.sleep(500); 
                } catch (InterruptedException e) {
                    System.out.println(Thread.currentThread().getName() + " 被中断");
                }
            }
        }, "Thread 1");
        
        thread1.start();
        
        System.out.println("活动线程数: " + group.activeCount());
        
        try { 
            Thread.sleep(2000); 
        } catch (InterruptedException e) { 
            e.printStackTrace(); 
        }
        
        group.interrupt(); // 中断所有线程
    }
}
```

**输出：**
```
Thread 1 in Group 1
活动线程数: 1
Thread 1 in Group 1
Thread 1 in Group 1
Thread 1 in Group 1 被中断
```

## 7. 线程组层次结构

线程组可以嵌套形成层级结构，根节点是系统线程组：

```java
ThreadGroup parent = new ThreadGroup("Parent");
ThreadGroup child = new ThreadGroup(parent, "Child");

new Thread(parent, () -> System.out.println("父组线程")).start();
new Thread(child, () -> System.out.println("子组线程")).start();
```

## 8. 优缺点

**优点：**

- 集中管理：统一操作组内所有线程
- 组织性强：按功能分组管理线程
- 异常处理：统一处理组内未捕获异常

**缺点：**

- 部分方法已过时（如`suspend()`、`resume()`）
- 功能有限：不如`java.util.concurrent`包强大

## 9. 结论

`ThreadGroup`提供了一种将线程分组管理的机制，适合需要统一控制一组线程的场景。但需注意其局限性，建议优先使用`ExecutorService`等现代并发工具进行复杂线程管理。