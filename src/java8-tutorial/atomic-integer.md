---
title: Java 8 并发编程-AtomicInteger实战
category:
  - Java
  - 原子变量
tag:
  - AtomicInteger
---

# Java 8 并发编程-AtomicInteger实战

```java
package concurrent;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.IntStream;

/**
 * @author tuonioooo
 */
public class Atomic1 {

    private static final int NUM_INCREMENTS = 1000;

    private static AtomicInteger atomicInt = new AtomicInteger(0);

    public static void main(String[] args) {
        testIncrementOfFor();
        testIncrement();
        testAccumulate();
        testAccumulateOfFor();
        testUpdate();

    }

    private static void testUpdate() {
        atomicInt.set(0);

        ExecutorService executor = Executors.newFixedThreadPool(2);

        IntStream.range(0, NUM_INCREMENTS)
                .forEach(i -> {
                    Runnable task = () ->
                            atomicInt.updateAndGet(n -> n + 2);//每次进行+2操作
                    executor.submit(task);
                });

        ConcurrentUtils.stop(executor);

        System.out.format("Update: %d\n", atomicInt.get());
    }

    private static void testAccumulate() {
        atomicInt.set(0);

        ExecutorService executor = Executors.newFixedThreadPool(2);

        IntStream.range(0, NUM_INCREMENTS)
                .forEach(i -> {
                    Runnable task = () ->
                            atomicInt.accumulateAndGet(i, (n, m) -> n + m);//循环值之后操作
                    executor.submit(task);
                });

        ConcurrentUtils.stop(executor);

        System.out.format("Accumulate: %d\n", atomicInt.get());
    }

    private static void testIncrement() {
        atomicInt.set(0);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        long startMillis = System.currentTimeMillis();

        IntStream.range(0, NUM_INCREMENTS)
                .forEach(i -> executor.submit(atomicInt::incrementAndGet));//+1操作

        ConcurrentUtils.stop(executor);

        long endMillis = System.currentTimeMillis();

        System.out.format("totalTime=%d\n", endMillis-startMillis);
        System.out.format("Increment: Expected=%d; Is=%d\n", NUM_INCREMENTS, atomicInt.get());
        System.out.format("Increment: Expected=%d; Is=%d\n", NUM_INCREMENTS, atomicInt.getAndIncrement());


    }

    private static void testIncrementOfFor(){
        long startMillis = System.currentTimeMillis();
        for (int i = 0; i <NUM_INCREMENTS ; i++) {
            atomicInt.incrementAndGet();//+1操作
        }
        long endMillis = System.currentTimeMillis();
        System.out.format("totalTime=%d\n", endMillis-startMillis);
        System.out.format("testIncrementOfFor: Expected=%d; Is=%d\n", NUM_INCREMENTS, atomicInt.get());
        System.out.format("testIncrementOfFor: Expected=%d; Is=%d\n", NUM_INCREMENTS, atomicInt.getAndIncrement());

    }

    private static void testAccumulateOfFor(){
        int sum = 0;
        for (int i = 0; i < NUM_INCREMENTS; i++) {
            sum +=i;
        }
        System.out.println("sum = " + sum);

        long startMillis = System.currentTimeMillis();
        for (int i = 0; i <NUM_INCREMENTS ; i++) {
            atomicInt.accumulateAndGet(i, (n, m) -> n + m); // 计算 NUM_INCREMENTS循环内的值之和
        }
        long endMillis = System.currentTimeMillis();
        System.out.format("totalTime=%d\n", endMillis-startMillis);
        System.out.format("testAccumulateOfFor: Expected=%d; Is=%d\n", NUM_INCREMENTS, atomicInt.get());
        System.out.format("testAccumulateOfFor: Expected=%d; Is=%d\n", NUM_INCREMENTS, atomicInt.getAndIncrement());

    }

}
```

这段 Java 程序是一个并发编程的演示，主要通过 `AtomicInteger` 来展示原子操作在多线程环境下的行为。下面我将逐个方法进行详细讲解，帮助你更清晰地理解它的作用与意义。

---

## 🌟总体结构介绍

* 使用的是 `AtomicInteger`：线程安全的整数类，支持无锁的原子操作。
* 使用的是 `ExecutorService` 线程池（固定2个线程）模拟并发执行任务。
* 主要展示了 5 种常见原子方法的使用方式：

| 方法名                                    | 说明           |
| -------------------------------------- | ------------ |
| `incrementAndGet()`                    | 原子 +1        |
| `accumulateAndGet(value, accumulator)` | 累加操作，自定义操作逻辑 |
| `updateAndGet(updateFunction)`         | 更新操作，自定义操作逻辑 |
| `getAndIncrement()`                    | 先获取值，再原子 +1  |
| `set(value)`                           | 设置新值         |

---

## 🔧 公共变量

```java
private static final int NUM_INCREMENTS = 1000;
private static AtomicInteger atomicInt = new AtomicInteger(0);
```

* 设定每次循环/并发递增的次数为 1000。
* 全局 `AtomicInteger` 用于测试不同的原子方法。

---

## 1️⃣ `testIncrementOfFor()`：单线程 +1

```java
for (int i = 0; i < NUM_INCREMENTS; i++) {
    atomicInt.incrementAndGet();
}
```

* 在主线程中连续调用 1000 次 `atomicInt.incrementAndGet()`。
* 输出期望值和实际值。
* `getAndIncrement()` 会返回**旧值**，验证当前值递增前的值。

👉 用于测试原子操作在单线程中是否正常。

---

## 2️⃣ `testIncrement()`：多线程 +1

```java
IntStream.range(0, NUM_INCREMENTS)
    .forEach(i -> executor.submit(atomicInt::incrementAndGet));
```

* 提交 1000 个任务给线程池，每个任务对 `atomicInt` 执行 +1 操作。
* 使用的是 `atomicInt::incrementAndGet` 方法引用。
* 最终检查实际值是否等于 1000。

👉 用于测试多线程环境下 `incrementAndGet()` 是否线程安全。

---

## 3️⃣ `testAccumulate()`：多线程自定义累加

```java
atomicInt.accumulateAndGet(i, (n, m) -> n + m);
```

* 每次传入 `i`（也就是循环次数），然后将当前 `atomicInt` 和 `i` 相加。
* 相当于求 0 + 1 + 2 + ... + 999 的并发累加。

期望值为：

```java
sum = (0 + 999) * 1000 / 2 = 499500
```

👉 用于展示 `accumulateAndGet` 可用于自定义原子加法逻辑。

---

## 4️⃣ `testAccumulateOfFor()`：单线程自定义累加

```java
for (int i = 0; i < NUM_INCREMENTS; i++) {
    atomicInt.accumulateAndGet(i, (n, m) -> n + m);
}
```

* 与上面 `testAccumulate()` 不同之处在于：这里是单线程执行。
* 输出的 `sum` 是为了验证正确性。
* 也使用 `getAndIncrement()` 查看递增前的值。

👉 目的是验证与并发版本 `testAccumulate()` 的值是否一致。

---

## 5️⃣ `testUpdate()`：多线程原子更新（+2）

```java
atomicInt.updateAndGet(n -> n + 2);
```

* 每个任务将当前值 +2，线程安全。
* 理论上 1000 次操作后结果应该是：`0 + 2 * 1000 = 2000`

👉 演示 `updateAndGet` 用法，它允许任意更新逻辑，只要返回一个新值即可。

---

## 🧹辅助方法 `ConcurrentUtils.stop(executor)`

帮助我们**优雅关闭线程池**，代码如下：

```java
public class ConcurrentUtils {
    public static void stop(ExecutorService executor) {
        try {
            executor.shutdown();
            executor.awaitTermination(60, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            System.err.println("Tasks interrupted");
        } finally {
            if (!executor.isTerminated()) {
                System.err.println("Cancel non-finished tasks");
            }
            executor.shutdownNow();
        }
    }
}
```

---

## ✅ 总结

| 方法                    | 类型  | 功能     | 是否并发 | 结果                     |
| --------------------- | --- | ------ | ---- | ---------------------- |
| `testIncrementOfFor`  | 单线程 | 累加 +1  | 否    | 1000                   |
| `testIncrement`       | 多线程 | 并发 +1  | 是    | 1000                   |
| `testAccumulate`      | 多线程 | 并发加上索引 | 是    | 0 + ... + 999 = 499500 |
| `testAccumulateOfFor` | 单线程 | 累加索引   | 否    | 499500                 |
| `testUpdate`          | 多线程 | 每次 +2  | 是    | 2000                   |

---
