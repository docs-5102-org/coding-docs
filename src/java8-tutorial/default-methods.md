---
title: Java 8 default默认方法
category:
  - Java
  - 核心特性
tag:
  - 接口
  - 默认方法
  - 向后兼容
---

# Java 8 default默认方法

## 概述

Java 8 引入了**默认方法（Default Methods）**这一重要特性，允许在接口中定义具有默认实现的非抽象方法。这些方法必须使用 `default` 关键字修饰。

## 引入背景

默认方法的引入主要有以下两个目的：

1. **支持 Lambda 表达式**：为函数式编程提供更好的支持
2. **向后兼容性**：允许在现有接口中添加新方法，而不会破坏已有的实现类

## 语法格式

```java
public interface InterfaceName {
    default 返回类型 方法名(参数列表) {
        // 默认实现
    }
}
```

## 实际示例

### 基础用法

```java
public interface Moveable {
    default void move() {
        System.out.println("I am moving");
    }
}
```

### 实现类的使用

实现该接口的类有两种选择：

#### 1. 直接使用默认实现

```java
public class Animal implements Moveable {
    public static void main(String[] args) {
        Animal tiger = new Animal();
        tiger.move(); // 输出: I am moving
    }
}
```

#### 2. 覆写默认方法

```java
public class Car implements Moveable {
    @Override
    public void move() {
        System.out.println("Car is driving on the road");
    }
    
    public static void main(String[] args) {
        Car car = new Car();
        car.move(); // 输出: Car is driving on the road
    }
}
```

## 核心优势

### 1. 向后兼容性
- 在现有接口中添加新方法时，不会破坏已有的实现类
- 避免了"接口污染"问题

### 2. 代码复用
- 提供通用的默认实现，减少重复代码
- 实现类可以选择性地覆写需要定制的方法

### 3. 更好的 API 设计
- 支持接口的渐进式演进
- 为函数式编程提供基础支持

## 使用注意事项

1. **多重继承冲突**：当一个类实现多个包含相同默认方法的接口时，必须显式覆写该方法
2. **静态方法**：Java 8 同时支持在接口中定义静态方法
3. **抽象方法优先**：如果接口中同时存在抽象方法和默认方法，实现类必须实现所有抽象方法

## 最佳实践

- 默认方法应该提供合理的通用实现
- 避免在默认方法中包含复杂的业务逻辑
- 优先考虑组合而非继承来解决复杂的多重继承问题

## 参考资料

- [Java 8 官方文档](https://docs.oracle.com/javase/8/docs/api/)
- [HowToDoInJava - Java 8 Tutorial](https://howtodoinjava.com/java-8-tutorial/)
- [Internal vs External Iteration](https://howtodoinjava.com/java-8/java-8-tutorial-internal-vs-external-iteration/)


