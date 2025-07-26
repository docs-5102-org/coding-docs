---
title: 原子变量
category:
  - Java8
  - 核心特性
tag:
  - 原子变量
---



# Java 8 并发教程：原子变量和ConcurrentMap

## 引言

Java 8引入了许多新特性，其中lambda表达式和函数式编程的支持大大改进了并发编程的体验。本教程将深入探讨Java 8并发API中的两个重要组件：原子变量（Atomic Variables）和ConcurrentMap。这些工具能够帮助开发者编写更高效、更安全的多线程代码。

## 原子变量 (Atomic Variables)

### 什么是原子操作？

原子操作是指能够在多线程环境中同时且安全地执行的操作，无需使用`synchronized`关键字或锁机制。原子操作的本质依赖于比较与交换（[CAS](./atomic-integer.md)，Compare-And-Swap），这是现代CPU直接支持的原子指令，通常比同步块更快。

### AtomicInteger

`AtomicInteger`是最常用的原子类之一，提供了线程安全的整数操作。

#### 基本用法

```java
AtomicInteger atomicInt = new AtomicInteger(0);

ExecutorService executor = Executors.newFixedThreadPool(2);

IntStream.range(0, 1000)
    .forEach(i -> executor.submit(atomicInt::incrementAndGet));

stop(executor);

System.out.println(atomicInt.get());    // => 1000
```

通过使用`AtomicInteger`代替普通的`Integer`，我们可以线程安全地并发增加数值，而不需要同步访问变量。`incrementAndGet()`方法是原子操作，可以在多个线程中安全调用。

#### 使用Lambda表达式

`updateAndGet()`方法接受lambda表达式，允许在整数上执行任意操作：

```java
AtomicInteger atomicInt = new AtomicInteger(0);

ExecutorService executor = Executors.newFixedThreadPool(2);

IntStream.range(0, 1000)
    .forEach(i -> {
        Runnable task = () ->
            atomicInt.updateAndGet(n -> n + 2);
        executor.submit(task);
    });

stop(executor);

System.out.println(atomicInt.get());    // => 2000
```

#### 累加操作

`accumulateAndGet()`方法接受`IntBinaryOperator`类型的lambda表达式，可以执行更复杂的累加操作：

```java
AtomicInteger atomicInt = new AtomicInteger(0);

ExecutorService executor = Executors.newFixedThreadPool(2);

IntStream.range(0, 1000)
    .forEach(i -> {
        Runnable task = () ->
            atomicInt.accumulateAndGet(i, (n, m) -> n + m);
        executor.submit(task);
    });

stop(executor);

System.out.println(atomicInt.get());    // => 499500
```

#### AtomicInteger 实战示例

[实战示例](./atomic-integer.md)

### 其他原子类

Java并发包还提供了其他实用的原子类：
- `AtomicBoolean`：原子布尔值操作
- `AtomicLong`：原子长整数操作
- `AtomicReference`：原子引用操作



## 高性能原子类

### LongAdder

`LongAdder`是`AtomicLong`的高性能替代品，专门用于频繁的数值累加操作。

```java
LongAdder adder = new LongAdder();

ExecutorService executor = Executors.newFixedThreadPool(2);

IntStream.range(0, 1000)
    .forEach(i -> executor.submit(adder::increment));

stop(executor);

System.out.println(adder.sumThenReset());   // => 1000
```

`LongAdder`的优势在于它内部维护一系列变量来减少线程之间的争用，而不是对单一结果进行求和计算。当多线程的更新比读取更频繁时，性能优于传统的原子数值类。缺点是较高的内存开销。

### LongAccumulator

`LongAccumulator`是`LongAdder`的通用版本，可以执行自定义的累加操作：

```java
LongBinaryOperator op = (x, y) -> 2 * x + y;
LongAccumulator accumulator = new LongAccumulator(op, 1L);

ExecutorService executor = Executors.newFixedThreadPool(2);

IntStream.range(0, 10)
    .forEach(i -> executor.submit(() -> accumulator.accumulate(i)));

stop(executor);

System.out.println(accumulator.getThenReset());     // => 2539
```

## ConcurrentMap

### 基本概念

`ConcurrentMap`接口继承自`Map`接口，是最实用的并发集合类型之一。Java 8通过添加新的方法，引入了函数式编程支持。

### 基本操作

```java
ConcurrentMap<String, String> map = new ConcurrentHashMap<>();
map.put("foo", "bar");
map.put("han", "solo");
map.put("r2", "d2");
map.put("c3", "p0");
```

#### forEach遍历

```java
map.forEach((key, value) -> System.out.printf("%s = %s\n", key, value));
```

#### 条件插入

```java
String value = map.putIfAbsent("c3", "p1");
System.out.println(value);    // p0
```

#### 默认值获取

```java
String value = map.getOrDefault("hi", "there");
System.out.println(value);    // there
```

#### 批量替换

```java
map.replaceAll((key, value) -> "r2".equals(key) ? "d3" : value);
System.out.println(map.get("r2"));    // d3
```

### 高级操作

#### compute操作

```java
map.compute("foo", (key, value) -> value + value);
System.out.println(map.get("foo"));   // barbar
```

还有两个变体：
- `computeIfAbsent()`：仅在键不存在时调用函数
- `computeIfPresent()`：仅在键存在时调用函数

#### merge操作

```java
map.merge("foo", "boo", (oldVal, newVal) -> newVal + " was " + oldVal);
System.out.println(map.get("foo"));   // boo was foo
```

## ConcurrentHashMap的并行操作

### 并行处理机制

`ConcurrentHashMap`使用`ForkJoinPool.commonPool()`提供的并行处理能力。该池使用基于可用核心数量的预置并行机制。

```java
System.out.println(ForkJoinPool.getCommonPoolParallelism());  // 3
```

可以通过JVM参数调整并行度：
```
-Djava.util.concurrent.ForkJoinPool.common.parallelism=5
```

### 并行forEach

```java
ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
map.put("foo", "bar");
map.put("han", "solo");
map.put("r2", "d2");
map.put("c3", "p0");

map.forEach(1, (key, value) ->
    System.out.printf("key: %s; value: %s; thread: %s\n",
        key, value, Thread.currentThread().getName()));
```

### 并行search

```java
String result = map.search(1, (key, value) -> {
    System.out.println(Thread.currentThread().getName());
    if ("foo".equals(key)) {
        return value;
    }
    return null;
});
System.out.println("Result: " + result);
```

也可以仅搜索值：

```java
String result = map.searchValues(1, value -> {
    System.out.println(Thread.currentThread().getName());
    if (value.length() > 3) {
        return value;
    }
    return null;
});
```

### 并行reduce

```java
String result = map.reduce(1,
    (key, value) -> {
        System.out.println("Transform: " + Thread.currentThread().getName());
        return key + "=" + value;
    },
    (s1, s2) -> {
        System.out.println("Reduce: " + Thread.currentThread().getName());
        return s1 + ", " + s2;
    });

System.out.println("Result: " + result);
```

## 最佳实践

1. **选择合适的原子类**：对于简单的数值操作，使用`AtomicInteger`、`AtomicLong`等；对于频繁更新的场景，考虑使用`LongAdder`或`LongAccumulator`。

2. **合理使用并行操作**：并行操作有阈值参数，只有当集合大小超过阈值时才会并行执行。

3. **避免过度同步**：原子操作和`ConcurrentMap`已经提供了线程安全性，避免额外的同步机制。

4. **注意内存开销**：高性能的原子类（如`LongAdder`）虽然性能更好，但会消耗更多内存。

## 总结

Java 8的原子变量和`ConcurrentMap`为并发编程提供了强大而优雅的解决方案。通过合理使用这些工具，开发者可以编写出既高效又安全的多线程代码。原子操作基于CAS指令，通常比传统的同步机制更快；而`ConcurrentMap`的函数式API使得并发集合操作更加简洁和强大。

掌握这些并发工具的使用方法，对于开发高性能的Java应用程序至关重要。在实际项目中，应根据具体的使用场景选择合适的并发工具，以达到最佳的性能和可维护性。