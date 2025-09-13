---
title: MetaspaceSize 详解
category:
  - Java
tag:
  - JVM
---

# MetaspaceSize 详解

## 1. 概述

从 Java 8 开始，Oracle 彻底移除了永久代（PermGen），取而代之的是元空间（Metaspace）。元空间并不在虚拟机中，而是使用本机内存，这是与永久代最重要的区别。元空间主要用于存储类的元数据信息，包括类定义、方法信息、常量池等。

## 2. MetaspaceSize 参数的真正含义

### 2.1 常见误解

很多开发者认为 `-XX:MetaspaceSize=256m` 表示元空间的初始大小为 256MB，但这是一个**常见的误解**。

### 2.2 正确理解

-XX:MetaspaceSize 参数指的是 Metaspace 扩容时触发 FullGC 的初始化阈值，也是最小的阈值。换句话说：

- **不是**元空间的初始大小
- **不是**元空间的最大限制
- **是**触发首次元空间垃圾回收的阈值

## 3. 默认值与行为

### 3.1 默认配置

对于 64位 JVM 来说，元空间的默认初始大小是 20.75MB，默认的元空间的最大值是无限。

可以通过以下命令查看默认值：
```bash
java -XX:+PrintFlagsFinal -version | grep MetaspaceSize
```

### 3.2 扩容机制

当元空间使用量达到 MetaspaceSize 设定的阈值时，会触发以下行为：

1. **触发 Full GC**：Metaspace 由于使用不断扩容到 -XX:MetaspaceSize 参数指定的量，就会发生 FGC
2. **动态调整阈值**：GC 后会重新计算下一次触发 GC 的阈值
3. **继续扩容**：之后每次 Metaspace 扩容都可能会发生 FGC

## 4. 相关参数详解

### 4.1 MaxMetaspaceSize

```bash
-XX:MaxMetaspaceSize=N
```

- **作用**：用于设置 metaspace 区域的最大值
- **默认值**：如果这个参数没有设置，那么就是通过 mxbean 拿到的最大值是 -1，表示无穷大
- **风险**：如果 MaxMetaspaceSize 设置太小，可能会导致频繁 FullGC，甚至 OOM

### 4.2 参数组合示例

```bash
-Xms128m -Xmx4096m -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m
```

这个配置的含义：
- 当元空间使用达到 256MB 时，触发第一次 Full GC
- 元空间最大不能超过 512MB
- 如果超过 512MB 且无法回收，将抛出 OutOfMemoryError

## 5. 实际案例分析

### 5.1 监控元空间使用情况

使用 `jstat` 命令监控：

```bash
# 查看垃圾回收统计信息
jstat -gcutil pid

# 查看详细的内存使用情况
jstat -gc pid 2s 3
```

使用 jstat -gcutil 的结果中的 M 代表的是元空间的使用比例。

### 5.2 实际测试案例

配置参数：`-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=256m`

测试结果显示：
- 通过 jstat -gcutil pid 查看 M 的值为 98.32，即 Meta 区使用率也达到了 98.32%
- 但是 MC，即 Metaspace Capacity 只有 55296k，并不是参数 MetaspaceSize 指定的 256m

这个案例完美说明了 MetaspaceSize 不是初始大小，而是触发 GC 的阈值。

## 6. 调优建议

### 6.1 设置原则

1. **根据应用实际需要设置**：观察应用运行时的元空间实际使用量
2. **避免频繁 GC**：MetaspaceSize 不要设置得太小
3. **防止内存溢出**：MaxMetaspaceSize 要根据系统可用内存合理设置
4. **监控和调整**：持续监控元空间使用情况，适时调整参数

### 6.2 推荐配置模式

```bash
# 小型应用
-XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=256m

# 中型应用
-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m

# 大型应用
-XX:MetaspaceSize=512m -XX:MaxMetaspaceSize=1024m
```

### 6.3 与垃圾回收器的关系

如果 Old 区配置 CMS 垃圾回收，那么扩容引起的 FGC 也会使用 CMS 算法进行回收。

## 7. 常见问题

### 7.1 为什么会频繁 Full GC？

- MetaspaceSize 设置过小
- 应用加载了大量的类（如使用大量反射、动态代理等）
- 类加载器泄露导致元空间不断增长

### 7.2 如何确定合适的 MetaspaceSize 值？

1. 运行应用一段时间后，使用 jstat 查看元空间稳定使用量
2. 将 MetaspaceSize 设置为稳定使用量的 1.2-1.5 倍
3. 根据 GC 日志调整，避免启动阶段的频繁 Full GC

### 7.3 元空间 OOM 的原因

- MaxMetaspaceSize 设置过小
- 应用存在类加载器内存泄露
- 动态生成了大量的类（如使用 CGLib、ASM 等）

## 8. 总结

MetaspaceSize 是 Java 8+ 中一个容易被误解的参数。正确理解其作用机制对于 JVM 调优至关重要：

- **核心理解**：MetaspaceSize 是触发元空间垃圾回收的阈值，不是初始大小
- **调优目标**：减少不必要的 Full GC，同时避免元空间 OOM
- **监控手段**：使用 jstat、GC 日志等工具持续观察元空间使用情况
- **最佳实践**：根据应用实际情况设置合理的 MetaspaceSize 和 MaxMetaspaceSize 值

通过深入理解 MetaspaceSize 的工作机制，可以更好地优化 Java 应用的内存管理和垃圾回收性能。