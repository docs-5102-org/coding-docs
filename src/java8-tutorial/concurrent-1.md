---
title: CompletableFuture
category:
  - Java8
tag:
  - CompletableFuture
---

# Java 8 并发教程-CompletableFuture

## 1. CompletableFuture 简介

CompletableFuture 是 Java 8 中引入的一个强大的异步编程工具，它主要用于提供新的方式来完成异步处理，包括合成和组合事件的非阻塞方式。CompletableFuture 类实现了 `CompletionStage` 和 `Future` 接口，为异步编程提供了更加丰富和灵活的 API。

### 1.1 传统 Future 的局限性

在 Java 5 中引入的 `Future` 接口用来描述一个异步计算的结果，但是获取结果的方法较为有限：

- 通过轮询 `isDone()` 确认完成后，调用 `get()` 获取值
- 调用 `get()` 设置一个超时时间

这种 `get()` 方法会阻塞调用线程，这种阻塞方式显然与异步编程的初衷相违背。

### 1.2 CompletableFuture 的优势

为了解决传统 Future 的问题，JDK 吸收了 Guava 的设计思想，加入了 Future 的诸多扩展功能形成了 CompletableFuture。

CompletableFuture 提供的主要特性：

1. **组合异步计算**：将两个异步计算的结果组合成一个结果，两个异步计算相互独立在不同线程中执行
2. **依赖处理**：第二个计算可以依赖第一个计算的结果
3. **等待所有任务完成**：等待所有异步任务的完成
4. **等待任意任务完成**：等待所有异步任务中任意一个完成并获得计算结果
5. **编程式完成**：手动提供一个结果来完成异步任务
6. **事件响应**：异步任务完成时的响应事件处理

## 2. 创建 CompletableFuture

### 2.1 静态工厂方法

```java
// 创建一个已经完成的CompletableFuture
CompletableFuture<String> future = CompletableFuture.completedFuture("Hello");

// 创建一个空的CompletableFuture
CompletableFuture<String> future = new CompletableFuture<>();
```

### 2.2 异步执行方法

```java
// 异步执行无返回值的任务
CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
    System.out.println("Running in: " + Thread.currentThread().getName());
});

// 异步执行有返回值的任务
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return "Hello World";
});

// 使用自定义线程池
ExecutorService executor = Executors.newFixedThreadPool(3);
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return "Hello World";
}, executor);
```

## 3. 结果处理

### 3.1 thenApply - 转换结果

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "Hello")
    .thenApply(s -> s + " World")
    .thenApply(String::toUpperCase);

System.out.println(future.get()); // 输出: HELLO WORLD
```

### 3.2 thenAccept - 消费结果

```java
CompletableFuture.supplyAsync(() -> "Hello World")
    .thenAccept(System.out::println); // 输出: Hello World
```

### 3.3 thenRun - 执行动作

```java
CompletableFuture.supplyAsync(() -> "Hello World")
    .thenRun(() -> System.out.println("Task completed"));
```

### 3.4 异步版本

```java
// 异步版本，会在不同线程中执行
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "Hello")
    .thenApplyAsync(s -> s + " World");
```

## 4. 组合操作

### 4.1 thenCompose - 串行组合

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "Hello")
    .thenCompose(s -> CompletableFuture.supplyAsync(() -> s + " World"));

System.out.println(future.get()); // 输出: Hello World
```

### 4.2 thenCombine - 并行组合

```java
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");

CompletableFuture<String> result = future1.thenCombine(future2, (s1, s2) -> s1 + " " + s2);
System.out.println(result.get()); // 输出: Hello World
```

### 4.3 allOf - 等待所有完成

```java
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");
CompletableFuture<String> future3 = CompletableFuture.supplyAsync(() -> "!");

CompletableFuture<Void> allFutures = CompletableFuture.allOf(future1, future2, future3);

// 等待所有任务完成
allFutures.get();

// 获取所有结果
List<String> results = Stream.of(future1, future2, future3)
    .map(CompletableFuture::join)
    .collect(Collectors.toList());
```



```java
# 添加一个List到join里
CompletableFuture.allOf(completableFutures.toArray(new CompletableFuture[completableFutures.size()])).join();
```

### 4.4 anyOf - 等待任意一个完成

```java
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> {
    sleep(1000);
    return "Hello";
});

CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> {
    sleep(500);
    return "World";
});

CompletableFuture<Object> anyFuture = CompletableFuture.anyOf(future1, future2);
System.out.println(anyFuture.get()); // 输出: World (因为future2更快完成)
```

## 5. 异常处理

### 5.1 exceptionally - 异常恢复

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new RuntimeException("Something went wrong");
    }
    return "Hello";
}).exceptionally(ex -> {
    System.out.println("Exception: " + ex.getMessage());
    return "Default Value";
});

System.out.println(future.get()); // 输出: Default Value
```

### 5.2 handle - 处理结果和异常

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    if (true) {
        throw new RuntimeException("Something went wrong");
    }
    return "Hello";
}).handle((result, ex) -> {
    if (ex != null) {
        System.out.println("Exception: " + ex.getMessage());
        return "Default Value";
    }
    return result;
});
```

### 5.3 whenComplete - 完成时回调

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "Hello")
    .whenComplete((result, ex) -> {
        if (ex == null) {
            System.out.println("Result: " + result);
        } else {
            System.out.println("Exception: " + ex.getMessage());
        }
    });
```

## 6. 实际应用示例

### 6.1 并行处理多个任务

```java
public class CompletableFutureExample {
    
    public static void main(String[] args) throws InterruptedException, ExecutionException {
        long start = System.currentTimeMillis();
        
        // 并行执行多个任务
        CompletableFuture<String> task1 = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "Task 1 completed";
        });
        
        CompletableFuture<String> task2 = CompletableFuture.supplyAsync(() -> {
            sleep(2000);
            return "Task 2 completed";
        });
        
        CompletableFuture<String> task3 = CompletableFuture.supplyAsync(() -> {
            sleep(1500);
            return "Task 3 completed";
        });
        
        // 等待所有任务完成
        CompletableFuture<Void> allTasks = CompletableFuture.allOf(task1, task2, task3);
        
        allTasks.thenRun(() -> {
            System.out.println("All tasks completed in: " + 
                (System.currentTimeMillis() - start) + "ms");
        });
        
        // 获取结果
        System.out.println(task1.get());
        System.out.println(task2.get());
        System.out.println(task3.get());
    }
    
    private static void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### 6.2 异步调用链

```java
public class AsyncChainExample {
    
    public static void main(String[] args) throws ExecutionException, InterruptedException {
        CompletableFuture<String> result = CompletableFuture
            .supplyAsync(() -> {
                // 模拟从数据库获取用户ID
                sleep(1000);
                return "user123";
            })
            .thenCompose(userId -> {
                // 根据用户ID获取用户信息
                return CompletableFuture.supplyAsync(() -> {
                    sleep(1500);
                    return "User{id=" + userId + ", name=John}";
                });
            })
            .thenApply(userInfo -> {
                // 处理用户信息
                return userInfo.toUpperCase();
            })
            .exceptionally(ex -> {
                // 异常处理
                return "Error: " + ex.getMessage();
            });
        
        System.out.println(result.get());
    }
    
    private static void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

## 7. 最佳实践

### 7.1 线程池管理

```java
// 使用自定义线程池
ExecutorService executor = Executors.newFixedThreadPool(10);

try {
    CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
        // 异步任务
        return "Result";
    }, executor);
    
    // 使用结果
    System.out.println(future.get());
} finally {
    executor.shutdown();
}
```

### 7.2 避免阻塞

```java
// 推荐：使用非阻塞方式
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> "Hello")
    .thenApply(s -> s + " World")
    .thenAccept(System.out::println);

// 不推荐：使用阻塞方式
String result = CompletableFuture.supplyAsync(() -> "Hello").get();
```

### 7.3 异常处理

```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    // 可能抛出异常的代码
    return "Result";
}).exceptionally(ex -> {
    // 记录异常
    log.error("Async task failed", ex);
    return "Default Value";
});
```

## 8. 总结

CompletableFuture 是 Java 8 中异步编程的重要工具，它提供了丰富的 API 来处理异步任务的组合、转换和异常处理。通过 CompletableFuture，我们可以：

1. **提高程序性能**：通过并行执行多个任务
2. **简化异步编程**：提供链式调用和函数式编程风格
3. **更好的异常处理**：提供多种异常处理机制
4. **灵活的任务组合**：支持串行和并行的任务组合

在实际开发中，合理使用 CompletableFuture 可以大大提高应用程序的响应性和吞吐量，特别是在处理 I/O 密集型任务时。但同时也要注意线程池的管理和异常处理，避免资源泄露和程序崩溃。

## 9. 参考资料

- [Oracle Java 8 CompletableFuture 官方文档](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CompletableFuture.html)
- [Java 8 CompletableFuture 示例代码](https://github.com/tuonioooo/java8-examples-master)
- Java 并发编程实战