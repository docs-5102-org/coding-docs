---
title: ConcurrentMap
category:
  - Java8
  - 核心特性
tag:
  - ConcurrentMap
---



# Java 8 并发教程：ConcurrentMap

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