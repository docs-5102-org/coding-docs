---
title: JVM 常用调优参数
category:
  - Java
tag:
  - JVM
---

# JVM 常用调优参数

## 一、概述

JVM调优是Java应用性能优化的重要环节，合理的JVM参数配置可以显著提升应用性能、减少垃圾回收停顿时间，并避免内存溢出等问题。本文档详细介绍了生产环境中常用的JVM调优参数及其使用场景。

## 二、内存相关参数

### 2.1 堆内存配置

| 参数 | 说明 | 示例值 | 使用场景 | 注意事项 |
|------|------|--------|----------|----------|
| `-Xms` | 初始堆内存大小 | `-Xms2g` | 所有Java应用 | 建议与-Xmx设置为相同值，避免堆扩容开销 |
| `-Xmx` | 最大堆内存大小 | `-Xmx2g` | 所有Java应用 | 不要超过物理内存的75%，预留系统内存 |
| `-Xmn` | 新生代内存大小 | `-Xmn2g` | 高频创建对象的应用 | 一般设置为堆内存的1/3到1/2 |
| `-Xss` | 线程栈内存大小 | `-Xss128k` | 高并发应用 | 默认1M，可根据线程数和递归深度调整 |

### 2.2 元空间配置

| 参数 | 说明 | 示例值 | 使用场景 | 注意事项 |
|------|------|--------|----------|----------|
| `-XX:MetaspaceSize` | 元空间初始大小 | `-XX:MetaspaceSize=256m` | JDK8+应用 | 避免频繁的元空间扩容 |
| `-XX:MaxMetaspaceSize` | 元空间最大大小 | `-XX:MaxMetaspaceSize=256m` | JDK8+应用 | 防止元空间无限增长 |
| `-XX:MaxDirectMemorySize` | 最大直接内存 | `-XX:MaxDirectMemorySize=2g` | NIO密集型应用 | 默认与堆内存相同 |

## 三、垃圾收集器配置

### 3.1 G1垃圾收集器（推荐）

| 参数 | 说明 | 示例值 | 适用场景 | 优势 |
|------|------|--------|----------|------|
| `-XX:+UseG1GC` | 启用G1收集器 | `-XX:+UseG1GC` | 大内存应用（>4G） | 低延迟，适合实时应用 |
| `-XX:MaxGCPauseMillis` | 最大GC停顿时间 | `-XX:MaxGCPauseMillis=200` | 延迟敏感应用 | G1会尽力达到此目标 |
| `-XX:G1HeapRegionSize` | G1区域大小 | `-XX:G1HeapRegionSize=16m` | 超大堆内存 | 1MB-32MB，影响并发标记效率 |
| `-XX:G1NewSizePercent` | 新生代最小比例 | `-XX:G1NewSizePercent=20` | 需要精确控制新生代 | 默认5% |
| `-XX:G1MaxNewSizePercent` | 新生代最大比例 | `-XX:G1MaxNewSizePercent=40` | 需要精确控制新生代 | 默认60% |

### 3.2 CMS垃圾收集器（传统选择）

| 参数 | 说明 | 示例值 | 适用场景 | 注意事项 |
|------|------|--------|----------|----------|
| `-XX:+UseConcMarkSweepGC` | 启用CMS收集器 | `-XX:+UseConcMarkSweepGC` | 中等大小堆内存 | JDK9已废弃 |
| `-XX:+UseParNewGC` | 新生代使用ParNew | `-XX:+UseParNewGC` | 配合CMS使用 | 与CMS搭配使用 |
| `-XX:+UseCMSCompactAtFullCollection` | Full GC时压缩 | `-XX:+UseCMSCompactAtFullCollection` | 减少内存碎片 | 默认开启 |
| `-XX:CMSInitiatingOccupancyFraction` | CMS启动阈值 | `-XX:CMSInitiatingOccupancyFraction=80` | 控制GC频率 | 老年代使用率达到阈值时启动CMS |

### 3.3 并行收集器配置

| 参数 | 说明 | 示例值 | 适用场景 | 说明 |
|------|------|--------|----------|------|
| `-XX:ParallelGCThreads` | 并行GC线程数 | `-XX:ParallelGCThreads=16` | 多核CPU | 一般设置为CPU核心数 |
| `-XX:ConcGCThreads` | 并发GC线程数 | `-XX:ConcGCThreads=8` | G1/CMS收集器 | 一般设置为并行线程数的1/4 |

## 四、GC调优参数

### 4.1 GC行为控制

| 参数 | 说明 | 示例值 | 作用 | 建议 |
|------|------|--------|------|------|
| `-XX:SoftRefLRUPolicyMSPerMB` | 软引用回收策略 | `-XX:SoftRefLRUPolicyMSPerMB=1000` | 控制软引用回收时机 | 值越大，软引用保留时间越长 |
| `-XX:+DisableExplicitGC` | 禁用显式GC | `-XX:+DisableExplicitGC` | 防止代码中System.gc()影响 | 生产环境建议开启 |
| `-XX:+UseStringDeduplication` | 字符串去重 | `-XX:+UseStringDeduplication` | 减少重复字符串内存占用 | G1收集器专用 |

### 4.2 内存溢出处理

| 参数 | 说明 | 示例值 | 作用 | 重要性 |
|------|------|--------|------|--------|
| `-XX:+HeapDumpOnOutOfMemoryError` | OOM时生成堆转储 | `-XX:+HeapDumpOnOutOfMemoryError` | 问题排查 | 生产环境必备 |
| `-XX:HeapDumpPath` | 堆转储文件路径 | `-XX:HeapDumpPath=/tmp/` | 指定dump文件位置 | 确保路径有足够空间 |
| `-XX:OnOutOfMemoryError` | OOM时执行命令 | `-XX:OnOutOfMemoryError="kill -9 %p"` | 自动重启应用 | 谨慎使用 |

## 五、性能监控参数

### 5.1 GC日志配置

| 参数 | 说明 | 示例值 | JDK版本 | 作用 |
|------|------|--------|---------|------|
| `-XX:+PrintGC` | 打印GC信息 | `-XX:+PrintGC` | JDK8及以下 | 基础GC日志 |
| `-XX:+PrintGCDetails` | 打印详细GC信息 | `-XX:+PrintGCDetails` | JDK8及以下 | 详细的GC日志 |
| `-XX:+PrintGCTimeStamps` | 打印GC时间戳 | `-XX:+PrintGCTimeStamps` | JDK8及以下 | 便于分析GC时间 |
| `-Xlog:gc*:gc.log` | 新版GC日志 | `-Xlog:gc*:gc.log` | JDK9+ | 统一日志框架 |

### 5.2 JVM诊断参数

| 参数 | 说明 | 示例值 | 作用 | 使用场景 |
|------|------|--------|------|----------|
| `-XX:+UnlockDiagnosticVMOptions` | 解锁诊断选项 | `-XX:+UnlockDiagnosticVMOptions` | 启用诊断功能 | 性能分析 |
| `-XX:+FlightRecorder` | 启用飞行记录器 | `-XX:+FlightRecorder` | 性能监控 | JDK11+免费 |
| `-XX:+PrintCompilation` | 打印JIT编译信息 | `-XX:+PrintCompilation` | JIT优化分析 | 性能调优 |

## 六、实际配置示例

### 6.1 高性能Web应用配置

```bash
# 适合8GB内存服务器的Web应用
JAVA_OPTS="-Xms4g -Xmx4g -Xss256k \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=100 \
-XX:G1HeapRegionSize=16m \
-XX:MetaspaceSize=256m \
-XX:MaxMetaspaceSize=512m \
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=/data/logs/heapdump/ \
-XX:+DisableExplicitGC \
-Xlog:gc*:/data/logs/gc.log"
```

一个通用的启动jar脚本程序

```bash
RUN_CMD="screen -d -m $JAVA_PATH $3 -XX:+UseG1GC -Xms2g -Xmx2g -Xss128k -XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=256m -XX:SoftRefLRUPolicyMSPerMB=1000 -XX:ParallelGCThreads=16 -XX:ConcGCThreads=8 -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp/ -Dapp.path=$BASE_PATH -Dspring.profiles.active=$APP_PROFILE -jar app.jar"

```

### 6.2 大数据处理应用配置

```bash
# 适合16GB内存服务器的大数据应用
JAVA_OPTS="-Xms8g -Xmx8g -Xmn4g -Xss128k \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=200 \
-XX:ParallelGCThreads=16 \
-XX:ConcGCThreads=4 \
-XX:MetaspaceSize=512m \
-XX:MaxMetaspaceSize=1g \
-XX:MaxDirectMemorySize=2g \
-XX:+UseStringDeduplication \
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=/data/heapdump/"
```

### 6.3 微服务应用配置

```bash
# 适合2GB内存容器的微服务
JAVA_OPTS="-Xms1g -Xmx1g -Xss128k \
-XX:+UseG1GC \
-XX:MaxGCPauseMillis=50 \
-XX:G1NewSizePercent=30 \
-XX:G1MaxNewSizePercent=50 \
-XX:MetaspaceSize=128m \
-XX:MaxMetaspaceSize=256m \
-XX:+HeapDumpOnOutOfMemoryError \
-XX:HeapDumpPath=/tmp/heapdump.hprof"
```

### 6.4 一个实战脚本程序

[示例](./simple.md)

## 七、调优最佳实践

### 7.1 参数选择原则

1. **内存配置原则**
   - 堆内存不超过物理内存的75%
   - 新生代大小为堆内存的1/3到1/2
   - 元空间根据应用类加载情况设置

2. **垃圾收集器选择**
   - 堆内存 > 4GB：推荐G1GC
   - 堆内存 < 4GB：可选择Parallel GC
   - 延迟敏感应用：优选G1GC或ZGC（JDK11+）

3. **监控配置**
   - 生产环境必须配置GC日志
   - 启用OOM时堆转储
   - 合理设置日志轮转

### 7.2 常见问题和解决方案

| 问题现象 | 可能原因 | 解决方案 |
|----------|----------|----------|
| 频繁Full GC | 老年代空间不足 | 增大堆内存或优化对象生命周期 |
| GC停顿时间长 | 堆内存过大 | 使用G1GC或减小堆内存 |
| 内存溢出 | 内存泄漏或配置过小 | 分析堆转储文件，修复泄漏 |
| CPU使用率高 | GC线程数过多 | 调整ParallelGCThreads参数 |

## 八、监控和诊断工具

### 8.1 常用监控工具

| 工具 | 用途 | 命令示例 | 说明 |
|------|------|----------|------|
| `jstat` | GC统计信息 | `jstat -gc -t pid 5s` | 实时监控GC情况 |
| `jmap` | 堆内存分析 | `jmap -dump:live,format=b,file=heap.hprof pid` | 生成堆转储文件 |
| `jstack` | 线程堆栈 | `jstack pid > threads.txt` | 分析线程状态 |
| `jhsdb` | 堆分析 | `jhsdb jmap --heap --pid pid` | JDK9+的堆分析工具 |

### 8.2 第三方监控工具

- **VisualVM**：图形化JVM监控工具
- **JProfiler**：商业性能分析工具  
- **MAT**：Eclipse内存分析工具
- **GCViewer**：GC日志分析工具
- **Prometheus + Micrometer**：现代化监控方案

## 九、总结

JVM调优是一个持续的过程，需要根据应用特点和运行环境不断调整。关键要点包括：

1. **合理设置内存参数**：避免内存不足或浪费
2. **选择合适的垃圾收集器**：平衡吞吐量和延迟
3. **启用完整的监控**：便于问题排查和性能分析  
4. **持续监控和优化**：根据实际运行情况调整参数
5. **测试验证**：在生产环境应用前充分测试

通过系统的JVM调优，可以显著提升Java应用的性能和稳定性。