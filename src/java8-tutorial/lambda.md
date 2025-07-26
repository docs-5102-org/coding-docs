---
title: Java 8 Lambda 表达式完整指南
category:
  - Java
  - 函数式编程
tag:
  - 方法引用
  - lambda
  - 代码简化
---

# Java 8 Lambda 表达式完整指南

## 概述

Java 8 引入了 Lambda 表达式，这是 Java 语言的一个重要里程碑。Lambda 表达式允许我们将函数作为参数传递，使代码更加简洁和函数式。结合方法引用，Lambda 表达式为 Java 开发者提供了强大的编程工具。

## Lambda 表达式基础

### 什么是 Lambda 表达式

Lambda 表达式是一种匿名函数，它可以简化匿名内部类的写法。基本语法为：

```
(parameters) -> expression
```

或者

```
(parameters) -> { statements; }
```

### 基本示例

传统的匿名内部类写法：

```java
// 传统写法
Runnable r1 = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello World");
    }
};

// Lambda 表达式写法
Runnable r2 = () -> System.out.println("Hello World");
```

## 函数式接口

Lambda 表达式只能用于函数式接口（Functional Interface）。函数式接口是只有一个抽象方法的接口。

### 常用的函数式接口

- `Predicate<T>` - 接受一个参数，返回 boolean
- `Consumer<T>` - 接受一个参数，无返回值
- `Function<T, R>` - 接受一个参数，返回一个结果
- `Supplier<T>` - 无参数，返回一个结果

```java
// Predicate 示例
Predicate<String> isEmpty = str -> str.isEmpty();

// Consumer 示例
Consumer<String> print = str -> System.out.println(str);

// Function 示例
Function<String, Integer> length = str -> str.length();

// Supplier 示例
Supplier<String> getString = () -> "Hello World";
```

## Stream API 与 Lambda 表达式

Stream API 是 Lambda 表达式的重要应用场景。

### 基本操作示例

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

// 过滤和转换
List<String> result = names.stream()
    .filter(name -> name.length() > 3)
    .map(name -> name.toUpperCase())
    .collect(Collectors.toList());

// 输出: [ALICE, CHARLIE, DAVID]
```

### 聚合操作

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);

// 求和
int sum = numbers.stream()
    .reduce(0, (a, b) -> a + b);

// 查找最大值
Optional<Integer> max = numbers.stream()
    .reduce((a, b) -> a > b ? a : b);
```

## 方法引用 - Lambda 表达式的简化

方法引用是 Lambda 表达式的简化形式，使用 `::` 操作符。

### 方法引用的四种类型

| 方法引用类型 | 描述 | 语法 | 示例 |
|-------------|------|------|------|
| 静态方法引用 | 引用类的静态方法 | `Class::staticMethod` | `Math::max` |
| 实例方法引用 | 引用对象的实例方法 | `object::instanceMethod` | `System.out::println` |
| 类的实例方法引用 | 引用类的实例方法 | `Class::instanceMethod` | `String::length` |
| 构造函数引用 | 引用构造函数 | `Class::new` | `ArrayList::new` |

### 1. 静态方法引用

```java
List<Integer> integers = Arrays.asList(1, 12, 433, 5);

// Lambda 表达式
Optional<Integer> max1 = integers.stream()
    .reduce((a, b) -> Math.max(a, b));

// 方法引用
Optional<Integer> max2 = integers.stream()
    .reduce(Math::max);

max2.ifPresent(value -> System.out.println(value)); // 输出: 433
```

### 2. 实例方法引用

```java
List<String> words = Arrays.asList("hello", "world", "java");

// Lambda 表达式
words.forEach(word -> System.out.println(word));

// 方法引用
words.forEach(System.out::println);
```

### 3. 类的实例方法引用

```java
List<String> strings = Arrays.asList("how", "to", "do", "in", "java", "dot", "com");

// Lambda 表达式
List<String> sorted1 = strings.stream()
    .sorted((s1, s2) -> s1.compareTo(s2))
    .collect(Collectors.toList());

// 方法引用
List<String> sorted2 = strings.stream()
    .sorted(String::compareTo)
    .collect(Collectors.toList());

System.out.println(sorted2); // 输出: [com, do, dot, how, in, java, to]
```

### 4. 构造函数引用

```java
// 创建 ArrayList
List<Integer> numbers = IntStream.range(1, 100)
    .boxed()
    .collect(Collectors.toCollection(ArrayList::new));

// 创建自定义对象
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");
List<Person> persons = names.stream()
    .map(Person::new)  // 相当于 name -> new Person(name)
    .collect(Collectors.toList());
```

## 实际应用示例

### 数据处理示例

```java
public class Employee {
    private String name;
    private int age;
    private double salary;
    
    // 构造函数、getter、setter...
}

List<Employee> employees = Arrays.asList(
    new Employee("Alice", 30, 50000),
    new Employee("Bob", 25, 45000),
    new Employee("Charlie", 35, 60000)
);

// 查找年龄大于30且薪资高于50000的员工
List<Employee> result = employees.stream()
    .filter(emp -> emp.getAge() > 30)
    .filter(emp -> emp.getSalary() > 50000)
    .collect(Collectors.toList());

// 按薪资排序
List<Employee> sortedBysalary = employees.stream()
    .sorted((e1, e2) -> Double.compare(e1.getSalary(), e2.getSalary()))
    .collect(Collectors.toList());

// 计算平均薪资
OptionalDouble averageSalary = employees.stream()
    .mapToDouble(Employee::getSalary)
    .average();
```

### 分组操作

```java
// 按年龄分组
Map<Integer, List<Employee>> groupByAge = employees.stream()
    .collect(Collectors.groupingBy(Employee::getAge));

// 按薪资区间分组
Map<String, List<Employee>> groupBySalaryRange = employees.stream()
    .collect(Collectors.groupingBy(emp -> 
        emp.getSalary() > 50000 ? "高薪" : "普通"));
```

## 最佳实践

### 1. 保持简洁

```java
// 好的做法
list.stream().filter(Objects::nonNull).collect(Collectors.toList());

// 避免过于复杂的 Lambda 表达式
list.stream().filter(item -> {
    // 很长的逻辑...
    return result;
});
```

### 2. 使用方法引用

```java
// 优先使用方法引用
list.stream().map(String::toUpperCase);

// 而不是
list.stream().map(s -> s.toUpperCase());
```

### 3. 注意性能

```java
// 对于大数据集，考虑使用并行流
list.parallelStream()
    .filter(predicate)
    .collect(Collectors.toList());
```

## 总结

Lambda 表达式和方法引用是 Java 8 的重要特性，它们：

- 使代码更加简洁和易读
- 支持函数式编程风格
- 与 Stream API 结合使用功能强大
- 提供了四种方法引用类型来简化常见操作

掌握这些特性将显著提升您的 Java 编程效率和代码质量。随着 Java 语言的不断发展，函数式编程的概念越来越重要，Lambda 表达式是现代 Java 开发的必备技能。

## 参考资料

- [Oracle Java 8 Lambda 表达式文档](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html)
- [Java 8 Stream API 指南](https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html)


