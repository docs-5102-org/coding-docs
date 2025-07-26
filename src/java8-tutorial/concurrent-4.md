---
title: CAS原理详解
category:
  - Java8
  - 核心特性
tag:
  - CAS
---

# ✅ CAS（Compare-And-Swap）原理详解

## 🔹 一、什么是 CAS？

CAS（Compare-And-Swap）是一种 **原子操作**，用于实现无锁并发。它通过**比较内存中当前值是否为期望值**，来判断是否允许更新：

> **原子语义**：如果当前值 == 期望值，就将其更新为新值；否则什么也不做。

---

## 🔹 二、CAS 操作的三个参数

CAS 操作通常包含以下三个参数：

| 参数 | 含义              |
| -- | --------------- |
| V  | 变量当前值（来自内存）     |
| A  | 期望的旧值（Expected） |
| B  | 要更新的新值（New）     |

🔁 如果 V == A，则执行 V = B；否则 CAS 失败，等待或重试。

---

## 🔹 三、CAS 的原子性保障

CAS 的原子性由 **CPU 提供的底层指令保证**，如：

* x86：`CMPXCHG`
* ARM：`LDREX/STREX`
* Java 中通过 `Unsafe` 类、`VarHandle`、`AtomicXXX` 类调用 CPU 原语实现原子更新。

因此，**即便多个线程同时执行 CAS，最多只有一个线程成功更新，其他线程会失败并自旋重试。**

---

## 🔹 四、CAS 优点

| 优点      | 说明                        |
| ------- | ------------------------- |
| ✅ 无需加锁  | 减少上下文切换开销，提高并发性能          |
| ✅ 原子性保障 | 依赖 CPU 指令原语，更新操作不可中断      |
| ✅ 高性能   | 特别适合于低冲突的并发场景，例如计数器、标志更新等 |

---

## 🔹 五、CAS 的局限性

### ① ❗ ABA 问题

> 变量从 A → B → A，CAS 检查仍为 A，导致以为“未改动”，实际发生了变化。

🛠 解决方案：

* 使用带版本号的引用类型，例如 Java 中的 `AtomicStampedReference`
* 或使用 `VarHandle.compareAndExchange(...)` 等高级原子操作

---

### ② ❗ 自旋失败开销大

> 多线程高并发时，CAS 失败会不断自旋重试，占用 CPU。

🛠 解决方案：

* 设置最大重试次数或退避策略（Backoff）
* 使用更高级并发控制，如锁或队列

---

### ③ ❗ 只能操作一个变量

> CAS 操作通常只能保证 **单变量的原子性**，多个变量需使用 `AtomicReference` 封装对象，或使用锁机制。

---

## 🔹 六、CAS 实现示意（伪代码）

```java
boolean compareAndSwap(V, A, B) {
    if (V == A) {
        V = B;
        return true;
    }
    return false;
}
```

在 Java 中：

```java
AtomicInteger counter = new AtomicInteger(0);

// 自旋更新
int oldValue, newValue;
do {
    oldValue = counter.get();
    newValue = oldValue + 1;
} while (!counter.compareAndSet(oldValue, newValue));
```

---

## ✅ 七、总结

| 特性     | 内容                                                           |
| ------ | ------------------------------------------------------------ |
| 核心原理   | 比较当前值是否为期望值，相等则更新为新值                                         |
| 原子性保障  | 依赖 CPU 原子指令，如 CMPXCHG                                        |
| 典型应用   | Java 中的 `AtomicInteger`、`ConcurrentHashMap`、`LongAdder` 等    |
| 注意事项   | 避免 ABA、自旋过久、不能更新多个变量                                         |
| 解决方案建议 | 使用 `AtomicStampedReference`、`AtomicMarkableReference` 等扩展类支持 |

---

