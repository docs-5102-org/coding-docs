---
title: Java 编程技巧汇总一
category:
  - Java
tag:
  - Map初始化
  - StringBuilder
---

# Java 编程技巧汇总一

## 1. Map 初始化的几种方式

### 方式一：静态块初始化
```java
public class Demo {
    private static final Map<String, String> myMap;
    static {
        myMap = new HashMap<String, String>();
        myMap.put("a", "b");
        myMap.put("c", "d");
    }
}
```
**适用场景**：静态常量 Map，程序启动时初始化一次

### 方式二：双括号初始化（匿名内部类）
```java
HashMap<String, String> h = new HashMap<String, String>() {{
    put("a", "b");
    put("c", "d");
}};
```
**注意事项**：慎用！非静态内部类/匿名内部类包含外围实例引用，可能导致内存泄露

### 方式三：Guava 库
```java
// 方式 3.1：直接构建
Map<String, Integer> left = ImmutableMap.of("a", 1, "b", 2, "c", 3);

// 方式 3.2：Builder 模式
Map<String, String> test = ImmutableMap.<String, String>builder()
    .put("k1", "v1")
    .put("k2", "v2")
    .build();
```
**优点**：代码简洁，创建不可变 Map，线程安全

### Map 初始化推荐
- **静态 Map**：使用静态块初始化
- **局部 Map**：使用普通构造函数 + put
- **不可变 Map**：使用 Guava 的 ImmutableMap
- **避免**：双括号初始化（内存泄露风险）

## 2. StringBuilder 清空的三种方法

### 方式一：重新实例化
```java
StringBuilder sb = new StringBuilder();
sb = new StringBuilder();
```
**特点**：简单直接，但会产生新对象

### 方式二：setLength(0)
```java
StringBuilder sb = new StringBuilder("hello");
sb.setLength(0);
```
**特点**：性能最好，直接重置长度，推荐使用

### 方式三：delete(0, length())
```java
StringBuilder sb = new StringBuilder("hello");
sb.delete(0, sb.length());
```
**特点**：功能完整，但性能略低于 setLength(0)

### StringBuilder 清空推荐
- **首选**：`setLength(0)` - 性能最佳
- **备选**：`delete(0, length())` - 功能完整
- **避免**：重新实例化 - 产生不必要的对象

