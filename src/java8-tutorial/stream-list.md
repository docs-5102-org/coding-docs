---
title: Java 8 Stream List分批处理
category:
  - Java
  - 流处理
tag:
  - stream
  - 大数据量List分批
---

# Java 8 Stream大数据量List分批处理指南

## 概述

在处理大数据量的List时，为了避免内存溢出和提高处理效率，我们通常需要将大的List切割成多个小的批次进行处理。本文介绍了多种实现List分批处理的方法，包括原生Java 8 Stream、第三方库以及自定义实现。

## 方法一：使用Java 8 Stream进行分批处理

### 基本实现

```java
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class StreamBatchProcessor {
    // 每批处理的最大数量
    private static final Integer MAX_NUMBER = 3;
    
    /**
     * 计算需要切分的次数
     * @param size 原始List大小
     * @return 切分次数
     */
    private static Integer countStep(Integer size) {
        return (size + MAX_NUMBER - 1) / MAX_NUMBER;
    }
    
    public static void main(String[] args) {
        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7);
        int limit = countStep(list.size());
        
        // 方法一：使用流遍历操作
        List<List<Integer>> mglist = new ArrayList<>();
        Stream.iterate(0, n -> n + 1)
            .limit(limit)
            .forEach(i -> {
                mglist.add(list.stream()
                    .skip(i * MAX_NUMBER)
                    .limit(MAX_NUMBER)
                    .collect(Collectors.toList()));
            });
        System.out.println("方法一结果：" + mglist);
        
        // 方法二：获取分割后的集合（并行处理）
        List<List<Integer>> splitList = Stream.iterate(0, n -> n + 1)
            .limit(limit)
            .parallel()
            .map(a -> list.stream()
                .skip(a * MAX_NUMBER)
                .limit(MAX_NUMBER)
                .parallel()
                .collect(Collectors.toList()))
            .collect(Collectors.toList());
        System.out.println("方法二结果：" + splitList);
    }
}
```

### 输出结果
```
方法一结果：[[1, 2, 3], [4, 5, 6], [7]]
方法二结果：[[1, 2, 3], [4, 5, 6], [7]]
```

### 优缺点分析

**优点：**
- 使用原生Java 8 API，无需引入第三方依赖
- 支持并行处理，提高性能
- 代码简洁，易于理解

**缺点：**
- 对于大数据量，多次skip操作可能影响性能
- 代码相对复杂，需要手动计算分割次数

## 方法二：使用Google Guava库

### 依赖引入

```xml
<dependency>
    <groupId>com.google.guava</groupId>
    <artifactId>guava</artifactId>
    <version>31.1-jre</version>
</dependency>
```

### 实现代码

```java
import com.google.common.collect.Lists;
import java.util.List;

public class GuavaBatchProcessor {
    public static void main(String[] args) {
        // 模拟大数据量List
        List<User> users = userService.findAll();
        
        // 按每50个一组分割
        List<List<User>> parts = Lists.partition(users, 50);
        
        // 并行处理每个批次
        parts.parallelStream().forEach(batch -> {
            processBatch(batch);
        });
    }
    
    private static void processBatch(List<User> batch) {
        // 具体的批处理逻辑
        System.out.println("处理批次，大小：" + batch.size());
    }
}
```

### 优缺点分析

**优点：**
- 代码简洁，一行代码完成分割
- 性能优异，内部实现经过优化
- 支持不同类型的List

**缺点：**
- 需要引入第三方依赖
- 增加了项目的复杂度

## 方法三：使用Apache Commons Collections

### 依赖引入

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-collections4</artifactId>
    <version>4.4</version>
</dependency>
```

### 实现代码

```java
import org.apache.commons.collections4.ListUtils;
import java.util.List;

public class ApacheCommonsBatchProcessor {
    public static void main(String[] args) {
        List<Integer> intList = Lists.newArrayList(1, 2, 3, 4, 5, 6, 7, 8);
        
        // 按每3个一组分割
        List<List<Integer>> subs = ListUtils.partition(intList, 3);
        
        // 处理每个批次
        subs.forEach(batch -> {
            System.out.println("处理批次：" + batch);
        });
    }
}
```

### 优缺点分析

**优点：**
- 使用简单，API清晰
- 性能稳定可靠
- Apache开源项目，社区支持良好

**缺点：**
- 需要引入第三方依赖
- 功能相对单一

## 方法四：自定义分割方法

### 平均分配实现

```java
public class CustomBatchProcessor {
    
    /**
     * 将List平均分配到n个子List中
     * @param source 原始List
     * @param n 分割数量
     * @return 分割后的List集合
     */
    public static <T> List<List<T>> averageAssign(List<T> source, int n) {
        List<List<T>> result = new ArrayList<>();
        
        // 计算余数
        int remainder = source.size() % n;
        // 计算商
        int number = source.size() / n;
        // 偏移量
        int offset = 0;
        
        for (int i = 0; i < n; i++) {
            List<T> value;
            if (remainder > 0) {
                value = source.subList(i * number + offset, (i + 1) * number + offset + 1);
                remainder--;
                offset++;
            } else {
                value = source.subList(i * number + offset, (i + 1) * number + offset);
            }
            result.add(value);
        }
        return result;
    }
    
    /**
     * 按固定大小分割List
     * @param source 原始List
     * @param batchSize 每批大小
     * @return 分割后的List集合
     */
    public static <T> List<List<T>> partition(List<T> source, int batchSize) {
        List<List<T>> result = new ArrayList<>();
        
        for (int i = 0; i < source.size(); i += batchSize) {
            int endIndex = Math.min(i + batchSize, source.size());
            result.add(source.subList(i, endIndex));
        }
        
        return result;
    }
    
    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);
        
        // 平均分配到3个批次
        List<List<Integer>> avgResult = averageAssign(numbers, 3);
        System.out.println("平均分配结果：" + avgResult);
        
        // 按每4个一组分割
        List<List<Integer>> partResult = partition(numbers, 4);
        System.out.println("固定大小分割结果：" + partResult);
    }
}
```

### 输出结果
```
平均分配结果：[[1, 2, 3, 4], [5, 6, 7], [8, 9, 10]]
固定大小分割结果：[[1, 2, 3, 4], [5, 6, 7, 8], [9, 10]]
```

### 优缺点分析

**优点：**
- 完全自定义，可以根据需求调整
- 无第三方依赖，减少项目复杂度
- 性能可控，可以针对特定场景优化

**缺点：**
- 需要自己实现和维护
- 可能存在边界情况的bug
- 代码量相对较多

## 实际应用场景

### 数据库批量操作

```java
public class DatabaseBatchProcessor {
    private static final int BATCH_SIZE = 1000;
    
    public void batchInsertUsers(List<User> users) {
        // 使用Guava分割
        List<List<User>> batches = Lists.partition(users, BATCH_SIZE);
        
        batches.forEach(batch -> {
            // 批量插入数据库
            userDao.batchInsert(batch);
            
            // 可选：添加延时避免数据库压力过大
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });
    }
}
```

### 文件处理

```java
public class FileBatchProcessor {
    private static final int BATCH_SIZE = 500;
    
    public void processLargeFile(List<String> lines) {
        Lists.partition(lines, BATCH_SIZE)
            .parallelStream()
            .forEach(batch -> {
                // 并行处理每个批次
                processLineBatch(batch);
            });
    }
    
    private void processLineBatch(List<String> lines) {
        // 具体的行处理逻辑
        lines.forEach(line -> {
            // 处理单行数据
            System.out.println("处理行：" + line);
        });
    }
}
```

## 性能对比

| 方法 | 内存消耗 | 执行速度 | 代码复杂度 | 第三方依赖 |
|------|----------|----------|------------|------------|
| Java 8 Stream | 中等 | 中等 | 高 | 无 |
| Google Guava | 低 | 高 | 低 | 有 |
| Apache Commons | 低 | 高 | 低 | 有 |
| 自定义实现 | 低 | 高 | 中等 | 无 |

## 最佳实践建议

1. **选择合适的批次大小**：通常建议在100-1000之间，需要根据实际数据大小和处理复杂度调整。

2. **考虑内存限制**：对于超大数据量，建议使用流式处理而不是一次性加载所有数据。

3. **错误处理**：在批处理过程中要妥善处理异常，避免部分批次失败影响整体处理。

4. **监控和日志**：添加适当的日志记录，便于监控处理进度和排查问题。

5. **并行处理**：对于CPU密集型任务，可以考虑使用并行流提高处理效率。

## 总结

根据不同的应用场景，可以选择最适合的List分批处理方法：

- **简单场景**：推荐使用Google Guava的`Lists.partition()`
- **无第三方依赖要求**：使用自定义实现或Java 8 Stream
- **高性能要求**：结合并行流和合适的批次大小
- **复杂业务逻辑**：可以基于自定义实现进行扩展

选择合适的方法不仅能提高程序性能，还能提升代码的可维护性和可读性。


