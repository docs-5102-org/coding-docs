---
title: FFCC区别
category:
  - Java并发编程
tag:
  - Future
  - FutureTask
  - CompletionService
  - CompletableFuture
  - java.util.concurrent
---

# Future、FutureTask、CompletionService、CompletableFuture区别

在Java多线程编程中，当我们需要并发执行任务并获取结果时，有多种实现方案可供选择。本文详细分析了四种主要方案的原理、使用方式和适用场景。

## 目录

[[toc]]

## 1. Future

### 原理
Future接口是JDK最基础的异步结果获取接口，封装了取消、获取线程结果以及状态判断（是否取消、是否完成）等核心方法。

### 核心特性
- **异步结果获取**：通过`get()`方法获取任务执行结果
- **状态检查**：支持`isDone()`、`isCancelled()`等状态查询
- **任务取消**：支持`cancel()`方法取消任务执行

### 使用方式
```java
ExecutorService executor = Executors.newFixedThreadPool(10);
List<Future<Integer>> futureList = new ArrayList<>();

// 提交任务
for (int i = 0; i < 10; i++) {
    futureList.add(executor.submit(new CallableTask(i + 1)));
}

// 结果归集 - 轮询方式
List<Integer> results = new ArrayList<>();
while (!futureList.isEmpty()) {
    Iterator<Future<Integer>> iterator = futureList.iterator();
    while (iterator.hasNext()) {
        Future<Integer> future = iterator.next();
        if (future.isDone() && !future.isCancelled()) {
            results.add(future.get());
            iterator.remove();
        } else {
            Thread.sleep(1); // 避免CPU高速运转
        }
    }
}
```

### 优缺点
**优点：**
- 接口简单，易于理解
- JDK原生支持，兼容性好
- 支持按任务完成顺序获取结果

**缺点：**
- 需要手动轮询，CPU消耗较大
- 异常处理需要自己实现
- 代码相对冗长

### 适用场景
适合简单的多任务并发场景，对性能要求不高的情况下可以使用。

---

## 2. FutureTask

### 原理
FutureTask是`RunnableFuture`接口的唯一实现类，该接口继承了`Future<V>`和`Runnable`接口，因此既可以作为任务执行，又可以获取执行结果。

### 核心特性
- **双重特性**：既是Runnable（可执行），又是Future（可获取结果）
- **灵活性**：可以单独创建线程执行，也可以提交到线程池
- **控制能力**：可以在任务执行前后插入其他业务逻辑

### 使用方式

#### 单任务场景
```java
// 创建FutureTask
FutureTask<Integer> futureTask = new FutureTask<>(new CallableTask());
Thread thread = new Thread(futureTask);
thread.start();

// 执行其他业务逻辑
System.out.println("执行其他业务...");
Thread.sleep(5000);

// 根据业务逻辑决定是否继续执行
if (shouldCancel()) {
    futureTask.cancel(true);
} else {
    Integer result = futureTask.get(); // 阻塞获取结果
}
```

#### 多任务并发场景
```java
ExecutorService executor = Executors.newFixedThreadPool(10);
List<FutureTask<Integer>> futureList = new ArrayList<>();

// 创建并提交任务
for (int i = 0; i < 10; i++) {
    FutureTask<Integer> futureTask = new FutureTask<>(new CallableTask(i + 1));
    executor.submit(futureTask);
    futureList.add(futureTask);
}

// 结果归集（类似Future的轮询方式）
List<Integer> results = new ArrayList<>();
while (!futureList.isEmpty()) {
    Iterator<FutureTask<Integer>> iterator = futureList.iterator();
    while (iterator.hasNext()) {
        FutureTask<Integer> futureTask = iterator.next();
        if (futureTask.isDone() && !futureTask.isCancelled()) {
            results.add(futureTask.get());
            iterator.remove();
        } else {
            Thread.sleep(1);
        }
    }
}
```

### 优缺点
**优点：**
- 任务执行和结果获取分离，提供更大的灵活性
- 可以在任务执行过程中插入其他业务逻辑
- 支持任务取消机制

**缺点：**
- 多任务并发场景下，相比直接使用Future没有明显优势
- 仍然需要轮询机制，CPU消耗问题依然存在
- 代码复杂度相对较高

### 适用场景
特别适合有条件执行的场景，例如某个耗时任务的执行依赖于其他业务逻辑的结果。

---

## 3. CompletionService

### 原理
CompletionService内部通过**阻塞队列 + FutureTask**实现，核心优势是任务按照**完成顺序**排序，而不是提交顺序。最先完成的任务可以最先被获取。

### 核心特性
- **完成顺序获取**：通过内部阻塞队列，按任务完成先后顺序获取结果
- **阻塞机制**：`take()`方法会阻塞等待，直到有任务完成
- **高效性**：避免了轮询机制，减少CPU消耗

### 使用方式
```java
ExecutorService executor = Executors.newFixedThreadPool(5);
CompletionService<Integer> completionService = new ExecutorCompletionService<>(executor);

int taskCount = 10;
List<Future<Integer>> futureList = new ArrayList<>();

// 提交任务
for (int i = 0; i < taskCount; i++) {
    futureList.add(completionService.submit(new CallableTask(i + 1)));
}

// 结果归集 - 按完成顺序获取
List<Integer> results = new ArrayList<>();
for (int i = 0; i < taskCount; i++) {
    try {
        // take()方法会阻塞等待任务完成
        Integer result = completionService.take().get();
        results.add(result);
        System.out.println("任务完成，结果: " + result);
    } catch (Exception e) {
        e.printStackTrace();
    }
}
```

### 优缺点
**优点：**
- 按任务完成顺序获取结果，效率更高
- 避免了轮询机制，大大减少CPU消耗
- 使用简单，代码清晰
- 支持阻塞等待，不会遗漏任务结果

**缺点：**
- 异常处理仍需要手动处理
- 功能相对单一，扩展性有限

### 适用场景
非常适合需要按完成顺序处理结果的场景，是JDK 8之前最推荐的多任务并发结果归集方案。

---

## 4. CompletableFuture

### 原理
CompletableFuture是JDK 8引入的强大异步编程工具，实现了`Future<T>`和`CompletionStage<T>`两个接口，支持函数式编程和流式操作。

### 核心特性
- **函数式编程**：支持链式调用和流式处理
- **异步执行**：提供`supplyAsync()`、`runAsync()`等异步执行方法
- **结果组合**：支持`thenCombine()`、`thenCompose()`等组合操作
- **异常处理**：原生支持异常处理，每个任务的异常都可以被捕获
- **完成回调**：支持`whenComplete()`等完成时回调

### 使用方式

#### 基本异步执行
```java
// 有返回值的异步任务
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 执行业务逻辑
    return "Hello World";
});

// 无返回值的异步任务
CompletableFuture<Void> future2 = CompletableFuture.runAsync(() -> {
    // 执行业务逻辑
    System.out.println("异步执行");
});
```

#### 多任务并发执行和结果归集
```java
ExecutorService executor = Executors.newFixedThreadPool(10);
List<Integer> taskList = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
List<String> results = new ArrayList<>();

// 方式一：流式处理 + allOf组合
CompletableFuture<Void> allFutures = CompletableFuture.allOf(
    taskList.stream()
        .map(i -> CompletableFuture
            .supplyAsync(() -> calc(i), executor)
            .thenApply(result -> Integer.toString(result))
            .whenComplete((result, ex) -> {
                if (ex == null) {
                    System.out.println("任务" + result + "完成");
                    results.add(result);
                } else {
                    System.err.println("任务执行异常: " + ex.getMessage());
                }
            }))
        .toArray(CompletableFuture[]::new)
);

// 等待所有任务完成
allFutures.join();

// 方式二：sequence方法封装
public static <T> CompletableFuture<List<T>> sequence(List<CompletableFuture<T>> futures) {
    CompletableFuture<Void> allDone = CompletableFuture.allOf(
        futures.toArray(new CompletableFuture[0])
    );
    return allDone.thenApply(v -> 
        futures.stream()
            .map(CompletableFuture::join)
            .collect(Collectors.toList())
    );
}
```

#### 任务组合
```java
CompletableFuture<Integer> future1 = CompletableFuture.supplyAsync(() -> 10);
CompletableFuture<Integer> future2 = CompletableFuture.supplyAsync(() -> 20);

// 组合两个任务的结果
CompletableFuture<Integer> combinedFuture = future1.thenCombine(future2, (result1, result2) -> result1 + result2);

// 链式组合
CompletableFuture<String> chainedFuture = CompletableFuture
    .supplyAsync(() -> "Hello")
    .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + " World"))
    .thenApply(s -> s.toUpperCase());
```

### 优缺点
**优点：**
- API极其丰富，支持各种复杂的异步编程场景
- 原生支持异常处理，每个任务的异常都可以单独处理
- 支持函数式编程和流式操作，代码简洁优雅
- 支持任务组合、链式调用等高级特性
- 性能优秀，使用ForkJoinPool作为默认线程池

**缺点：**
- 学习曲线相对陡峭，API众多
- JDK 8+才支持，有版本要求

### 适用场景
几乎适用于所有异步编程场景，特别是复杂的任务组合、链式处理、异常处理场景。是现代Java异步编程的首选方案。

---

## 5. 综合对比

| 特性 | Future | FutureTask | CompletionService | CompletableFuture |
|------|--------|------------|-------------------|-------------------|
| **基本原理** | Future接口 | RunnableFuture实现类 | 阻塞队列+FutureTask | Future+CompletionStage |
| **JDK版本** | JDK 5+ | JDK 5+ | JDK 5+ | JDK 8+ |
| **多任务并发** | ✅ 支持 | ✅ 支持 | ✅ 支持 | ✅ 支持 |
| **结果获取顺序** | 完成顺序（轮询） | 提交顺序 | 完成顺序（阻塞） | 完成顺序 |
| **异常处理** | 手动处理 | 手动处理 | 手动处理 | 原生API支持 |
| **CPU消耗** | 高（轮询） | 高（轮询） | 低（阻塞） | 低 |
| **编程模式** | 传统 | 传统 | 传统 | 函数式/流式 |
| **API丰富度** | 基础 | 基础 | 基础 | 极其丰富 |
| **任务组合** | ❌ 不支持 | ❌ 不支持 | ❌ 不支持 | ✅ 强大支持 |
| **学习成本** | 低 | 中 | 低 | 高 |
| **推荐程度** | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## 6. 使用建议

### Future
适用于简单的多任务并发场景，对性能要求不高的情况。由于需要轮询机制，CPU消耗较大，现在很少单独使用。

### FutureTask
特别适合需要灵活控制任务执行的场景，比如根据业务逻辑决定是否继续执行某个耗时任务。对于纯粹的多任务并发，不如直接使用Future。

### CompletionService
在JDK 8之前，这是最佳的多任务并发结果归集方案。避免了轮询机制，按完成顺序获取结果，效率高且使用简单。如果项目还在使用JDK 7及以下版本，强烈推荐。

### CompletableFuture
现代Java异步编程的首选方案，API极其丰富，支持函数式编程，性能优秀。适用于几乎所有异步编程场景，特别是复杂的任务组合和链式处理。JDK 8+项目强烈推荐。

## 7. 最佳实践

1. **JDK 8+项目**：优先选择CompletableFuture
2. **简单并发场景**：CompletionService是不错的选择
3. **需要条件执行**：考虑使用FutureTask
4. **性能敏感场景**：避免使用需要轮询的Future
5. **异常处理重要**：CompletableFuture提供最好的异常处理支持

总的来说，随着JDK版本的演进，异步编程的工具越来越强大和易用。CompletableFuture代表了现代Java异步编程的最佳实践，值得深入学习和使用。