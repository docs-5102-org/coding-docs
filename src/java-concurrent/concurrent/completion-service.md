---
title: CompletionService接口
category:
  - Java并发编程
tag:
  - ExecutorService
  - java.util.concurrent
---

# Java CompletionService接口详解

## 目录

[[toc]]

## 概述

CompletionService是Java 5引入的一个接口，它整合了Executor和BlockingQueue的功能，为处理多个并发任务的执行结果提供了更加便捷的方式。

## 应用场景

当向Executor提交多个任务并希望获得它们完成后的结果时，传统的FutureTask方式存在效率问题：

- **传统方式的问题**：使用FutureTask时，需要循环获取task并调用get方法获取执行结果。但如果task还未完成，获取结果的线程将阻塞直到task完成。由于不知道哪个task会优先执行完毕，这种方式效率较低。

- **CompletionService的优势**：CompletionService提供了一种更高效的方式来处理多个任务的结果获取，它能够按照任务完成的顺序返回结果，而不是按照提交的顺序。

## 实际案例

### 需求场景
计算从1到100,000,000的累加和（不使用求和公式）

### 设计思路
将1到100,000,000的数分为n段，由n个task并行执行，执行结束后合并结果求最终的和，以提高计算效率。

### 实现步骤
1. **声明task执行载体**：创建线程池executor
2. **声明CompletionService**：通过参数指定执行task的线程池和存放已完成状态task的阻塞队列（默认为LinkedBlockingQueue）
3. **提交任务**：调用submit方法提交task
4. **获取结果**：调用take方法获取已完成状态的task

<img :src="$withBase('/assets/images/concurrent/completion-service-1.png')" 
  alt="图片"
  height="auto">


## CompletionService接口详解

### 核心方法

CompletionService接口提供了五个核心方法：

1. **`Future<V> submit(Callable<V> task)`**
   - 提交Callable类型的任务

2. **`Future<V> submit(Runnable task, V result)`**
   - 提交Runnable类型的任务

3. **`Future<V> take() throws InterruptedException`**
   - 获取并移除已完成状态的任务，如果目前不存在这样的任务，则等待

4. **`Future<V> poll()`**
   - 获取并移除已完成状态的任务，如果目前不存在这样的任务，返回null

5. **`Future<V> poll(long timeout, TimeUnit unit) throws InterruptedException`**
   - 在指定等待时间内获取并移除已完成状态的任务，超时返回null

## ExecutorCompletionService实现分析

### 成员变量

ExecutorCompletionService作为CompletionService的具体实现，包含三个重要成员变量：

- **`executor`**：执行任务的线程池，创建CompletionService时必须指定
- **`aes`**：主要用于创建待执行的任务
- **`completionQueue`**：存储已完成状态的任务，默认使用LinkedBlockingQueue

### 构造方法

ExecutorCompletionService提供了两个构造方法，使用者可以根据具体的业务场景进行选择：
- 可以只指定Executor
- 也可以同时指定Executor和BlockingQueue

### 任务提交机制

**提交流程**：
1. **参数校验**：验证任务参数的合法性，不符合条件的任务将抛出异常
2. **任务封装**：将Callable或Runnable类型的任务构造成FutureTask
3. **执行任务**：将构造好的FutureTask交由线程池executor执行

**核心机制 - QueueingFuture**：
- 任务在提交到线程池时会被封装成QueueingFuture
- QueueingFuture是FutureTask的子类，重写了done()方法
- 当任务执行完成后，done()方法会自动将完成的任务添加到completionQueue中
- 这种设计实现了任务完成状态的自动管理

### 结果获取机制

**take()与poll()的区别**：

- **`take()`方法**：
  - 获取并移除已完成状态的任务
  - 如果当前没有已完成的任务，会阻塞等待直到有任务完成
  - 适用于需要确保获取到结果的场景

- **`poll()`方法**：
  - 获取并移除已完成状态的任务
  - 如果当前没有已完成的任务，立即返回null，不会阻塞
  - 适用于需要非阻塞检查任务完成状态的场景

## 使用建议

1. **选择合适的获取方法**：根据业务需求选择take()或poll()方法
2. **合理设置线程池大小**：根据任务特性和系统资源配置适当的线程池大小
3. **异常处理**：注意处理InterruptedException等异常情况
4. **资源管理**：及时关闭线程池，避免资源泄露

## 总结

CompletionService是Java并发编程中处理多任务结果获取的重要工具。它通过整合Executor和BlockingQueue的功能，提供了高效、便捷的任务结果管理机制。相比传统的FutureTask方式，CompletionService能够按照任务完成的顺序返回结果，显著提高了多任务处理的效率。