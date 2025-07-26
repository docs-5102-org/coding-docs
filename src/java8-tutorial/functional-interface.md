---
title: Java 8 函数式接口
category:
  - Java
  - 函数式编程
tag:
  - 函数式接口
  - lambda
  - 接口设计
---

# Java 8 函数式接口


## 什么是函数式接口

函数式接口（Functional Interface）是 Java 8 引入的一个重要概念，也被称为**单抽象方法接口**（SAM Interface - Single Abstract Method Interface）。顾名思义，函数式接口只能包含一个抽象方法。

## @FunctionalInterface 注解

Java 8 提供了 `@FunctionalInterface` 注解来明确标识函数式接口。当你使用此注解时，编译器会检查接口是否符合函数式接口的规范，如果违反约定（如包含多个抽象方法），编译器会报错。

### 基本示例

```java
@FunctionalInterface
public interface MyFirstFunctionalInterface {
    void firstWork();
}
```

**重要提示：** 即使不添加 `@FunctionalInterface` 注解，只要接口只有一个抽象方法，它仍然是一个有效的函数式接口。该注解的主要作用是让编译器帮助你检查接口的合规性。

## 函数式接口的特殊规则

### 1. 默认方法不影响函数式接口
由于默认方法（default method）不是抽象方法，你可以在函数式接口中添加任意数量的默认方法：

```java
@FunctionalInterface
public interface MyFunctionalInterface {
    void abstractMethod();  // 唯一的抽象方法
    
    default void defaultMethod1() {
        System.out.println("默认方法1");
    }
    
    default void defaultMethod2() {
        System.out.println("默认方法2");
    }
}
```

### 2. Object 类方法的重写不计入抽象方法数量
如果函数式接口中声明的抽象方法是重写 `java.lang.Object` 的公共方法，这些方法不会计入抽象方法的数量统计中。这是因为任何接口的实现类都会继承 `Object` 类，这些方法会被自动实现。

```java
@FunctionalInterface
public interface MyFunctionalInterface {
    void firstWork();  // 唯一的抽象方法
    
    // 以下重写的 Object 方法不计入抽象方法数量
    @Override
    String toString();
    
    @Override
    boolean equals(Object obj);
    
    @Override
    int hashCode();
}
```

## 函数式接口的优势

1. **支持 Lambda 表达式**：函数式接口是 Lambda 表达式的基础
2. **方法引用**：可以使用方法引用来简化代码
3. **函数式编程**：支持更加简洁的函数式编程风格

## 常用的内置函数式接口

Java 8 在 `java.util.function` 包中提供了许多常用的函数式接口：

- `Function<T, R>`：接受一个参数并返回结果
- `Consumer<T>`：接受一个参数但不返回结果
- `Supplier<T>`：不接受参数但返回结果
- `Predicate<T>`：接受一个参数并返回布尔值

## 最佳实践

1. 使用 `@FunctionalInterface` 注解来明确标识函数式接口
2. 保持接口简洁，只包含一个抽象方法
3. 可以适当添加默认方法来提供通用功能
4. 优先使用 Java 8 内置的函数式接口，避免重复造轮子

---


