---
title: Java 8 Stream教程
category:
  - Java
  - 流处理
tag:
  - stream
  - 集合处理
  - 函数式编程
  - java8-map转换list
  - java8-list转换map
---

# Java 8 Stream教程

## 什么是 Stream？

Stream 可以被定义为**元素集合从源支持聚合操作**。在Java 8中，Stream被设计成大多数流操作只返回Stream，这有助于创建各种流操作链，称为**流水线式操作（pipelining）**。

### Stream vs Collections 的区别

- **Collections**：内存中的数据结构，保存所有当前值，必须先计算每个元素
- **Streams**：概念上固定的数据结构，元素按需计算，采用生产者-消费者模式

### Stream 的特征

- 不是数据结构
- 专为lambdas设计
- 不支持下标访问
- 可以容易地作为数组或列表输出
- 支持懒访问
- 可并行

## 构建 Stream 的方式

### 1. 使用 Stream.of()

```java
// 方式1：直接传入值
Stream<Integer> stream1 = Stream.of(1, 2, 3, 4, 5, 6, 7, 8, 9);
stream1.forEach(System.out::println);

// 方式2：传入数组
Stream<Integer> stream2 = Stream.of(new Integer[]{1, 2, 3, 4, 5, 6, 7, 8, 9});
stream2.forEach(System.out::println);
```

### 2. 使用 Collection.stream()

```java
List<Integer> list = new ArrayList<>();
for(int i = 1; i < 10; i++){
    list.add(i);
}
Stream<Integer> stream = list.stream();
stream.forEach(System.out::println);
```

### 3. 使用 Stream.generate() 或 Stream.iterate()

```java
// 无限流生成
Stream<Date> stream = Stream.generate(() -> new Date());
stream.limit(5).forEach(System.out::println);

// 迭代生成
Stream<Integer> iterateStream = Stream.iterate(0, n -> n + 2);
iterateStream.limit(10).forEach(System.out::println);
```

### 4. 使用字符串或字符

```java
// 字符流
IntStream charStream = "12345_abcdefg".chars();
charStream.forEach(System.out::println);

// 字符串分割
Stream<String> stringStream = Stream.of("A$B$C".split("\\$"));
stringStream.forEach(System.out::println);
```

## Stream 转换为 Collections

### 转换为 List

```java
List<Integer> list = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9);
List<Integer> evenNumbers = list.stream()
    .filter(i -> i % 2 == 0)
    .collect(Collectors.toList());
System.out.println(evenNumbers); // [2, 4, 6, 8]
```

### list转换为map

```java

// 测试数据
public class Apple {
    private Integer id;
    private String name;
    private BigDecimal money;
    private Integer num;
    public Apple(Integer id, String name, BigDecimal money, Integer num) {
        this.id = id;
        this.name = name;
        this.money = money;
        this.num = num;
    }
}

List<Apple> appleList = new ArrayList<>();//存放apple对象集合
Apple apple1 =  new Apple(1,"苹果1",new BigDecimal("3.25"),10);
Apple apple12 = new Apple(1,"苹果2",new BigDecimal("1.35"),20);
Apple apple2 =  new Apple(2,"香蕉",new BigDecimal("2.89"),30);
Apple apple3 =  new Apple(3,"荔枝",new BigDecimal("9.99"),40);
appleList.add(apple1);
appleList.add(apple12);
appleList.add(apple2);
appleList.add(apple3);

/**
* List -> Map
* 需要注意的是：
* toMap 如果集合对象有重复的key，会报错Duplicate key ....
*  apple1,apple12的id都为1。
*  如果有重复的key, 可以用 (k1,k2)->k1 来设置, 则保留k1, 舍弃k2, 反之保k2舍k1
*/
Map<Integer, Apple> appleMap = appleList.stream().collect(Collectors.toMap(Apple::getId, a -> a, (k1,k2)->k1));

//example1
//集合没有重复key, 返回对象作为value
Map<String, Goods> goodsMap = list.stream().collect(Collectors.toMap(Goods::getGoodsCode, goods->goods));

//example2
//有时候，希望得到的map的值不是对象，而是对象的某个属性，那么可以用下面的方式：
Map<Long, String> maps = userList.stream().collect(Collectors.toMap(User::getId, User::getAge, (key1, key2) -> key2));
```

### map转换list

```java
Map<String, String> map = new HashMap<>();

// Convert all Map keys to a List
List<String> result = new ArrayList(map.keySet());

// Convert all Map values to a List
List<String> result2 = new ArrayList(map.values());

// Java 8, Convert all Map keys to a List
List<String> result3 = map.keySet().stream().collect(Collectors.toList());

// Java 8, Convert all Map values to a List
List<String> result4 = map.values().stream().collect(Collectors.toList());
```

### 转换为数组

```java
Integer[] evenNumbersArr = list.stream()
    .filter(i -> i % 2 == 0)
    .toArray(Integer[]::new);
System.out.println(Arrays.toString(evenNumbersArr)); // [2, 4, 6, 8]
```

### 转换为 Set

```java
Set<Integer> evenNumbersSet = list.stream()
    .filter(i -> i % 2 == 0)
    .collect(Collectors.toSet());
```

## Stream 核心操作

### 中间操作（Intermediate Operations）

#### 1. filter() - 过滤

```java
List<String> names = Arrays.asList("Amitabh", "Shekhar", "Aman", "Rahul", "Shahrukh");

names.stream()
    .filter(s -> s.startsWith("A"))
    .forEach(System.out::println);
// 输出: Amitabh, Aman
```

#### 2. map() - 转换

```java
names.stream()
    .filter(s -> s.startsWith("A"))
    .map(String::toUpperCase)
    .forEach(System.out::println);
// 输出: AMITABH, AMAN
```

#### 3. sorted() - 排序

[Java 8 Stream sorted(排序)](./stream-sorted.md)


#### 4. distinct() - 去重

```java
List<Integer> numbers = Arrays.asList(1, 2, 2, 3, 3, 4, 5);
numbers.stream()
    .distinct()
    .forEach(System.out::println);
// 输出: 1, 2, 3, 4, 5
```

```java
// 根据id去重
 List<Person> unique = appleList
        .stream()
        .collect(collectingAndThen(toCollection(() -> new TreeSet<>(comparingLong(Apple::getId))), ArrayList::new));

```

#### 5. limit() 和 skip()

```java
// limit - 限制元素数量
numbers.stream()
    .limit(3)
    .forEach(System.out::println);

// skip - 跳过前n个元素
numbers.stream()
    .skip(2)
    .forEach(System.out::println);
```

#### 6. 分组

```java
//List 以ID分组 Map<Integer,List<Apple>>
Map<Integer, List<Apple>> groupBy = appleList.stream().collect(Collectors.groupingBy(Apple::getId));
//=================分割线==================
System.err.println("groupBy:"+groupBy);
{1=[Apple{id=1, name='苹果1', money=3.25, num=10}, Apple{id=1, name='苹果2', money=1.35, num=20}], 2=[Apple{id=2, name='香蕉', money=2.89, num=30}], 3=[Apple{id=3, name='荔枝', money=9.99, num=40}]}
```

### 终端操作（Terminal Operations）

#### 1. forEach() - 遍历

```java
names.forEach(System.out::println);
```

#### 2. collect() - 收集

```java
List<String> upperCaseNames = names.stream()
    .map(String::toUpperCase)
    .collect(Collectors.toList());

// 收集到Map
Map<String, Integer> nameToLength = names.stream()
    .collect(Collectors.toMap(
        name -> name,
        String::length
    ));
```

#### 3. match() - 匹配

```java
// anyMatch - 任意匹配
boolean hasA = names.stream()
    .anyMatch(s -> s.startsWith("A"));
System.out.println(hasA); // true

// allMatch - 全部匹配
boolean allStartWithA = names.stream()
    .allMatch(s -> s.startsWith("A"));
System.out.println(allStartWithA); // false

// noneMatch - 全部不匹配
boolean noneStartWithZ = names.stream()
    .noneMatch(s -> s.startsWith("Z"));
System.out.println(noneStartWithZ); // true
```

#### 4. count() - 计数

```java
long count = names.stream()
    .filter(s -> s.startsWith("A"))
    .count();
System.out.println(count); // 2
```

#### 5. reduce() - 归约

```java
// 字符串连接
Optional<String> reduced = names.stream()
    .reduce((s1, s2) -> s1 + "#" + s2);
reduced.ifPresent(System.out::println);
// 输出: Amitabh#Shekhar#Aman#Rahul#Shahrukh

// 数字求和
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
Optional<Integer> sum = numbers.stream()
    .reduce(Integer::sum);
sum.ifPresent(System.out::println); // 15

// 带初始值的reduce
Integer sum2 = numbers.stream()
    .reduce(0, Integer::sum);
System.out.println(sum2); // 15
```

#### 6. findFirst() 和 findAny()

```java
// findFirst - 查找第一个
Optional<String> first = names.stream()
    .filter(s -> s.startsWith("A"))
    .findFirst();
first.ifPresent(System.out::println); // Amitabh

// findAny - 查找任意一个
Optional<String> any = names.stream()
    .filter(s -> s.startsWith("A"))
    .findAny();
any.ifPresent(System.out::println);
```

#### 7. 基本类型求和

```java
int[] arr = new int[]{1,2,3};
int sum = Arrays.stream(arr).sum();
```

#### 8. Integer、Long、Double、BigDecimal求和

```java
Integer sum = scores.stream().reduce(Integer::sum).orElse(0);
Long sum = scores.stream().reduce(Long::sum).orElse(0L);
Double sum = scores.stream().reduce(Double::sum).orElse(0.00);
BigDecimal sum = scores.stream().reduce(BigDecimal::add).orElse(new BigDecimal(0.00));
```

#### 9. 泛型为实体类，进行求和

**对单个属性求和**

```java
Integer sum = sales.stream().mapToInt(Sale::getOrderNum).sum(); 
Long sum = sales.stream().mapToLong(Sale::getOrderNum).sum(); 
Double sum = sales.stream().mapToDouble(Sale::getOrderNum).sum(); 
//金额求和的方法
BigDecimal sum = sales.stream().map(Sale::getAppleSale).reduce(BigDecimal.ZERO, BigDecimal::add);
```

**对多个属性求和**

```java
// 类型为BigDecimal 
Sale result = sales.stream().reduce((x, y) -> new Sale(x.getAppleSale().add(y.getAppleSale()), x.getBananaSale().add(y.getBananaSale()), x.getGrapeSale().add(y.getGrapeSale()))).orElse(new Sale(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO)); 
// 类型为Integer、Long、Double（注：orElse中需输入对应类型初始值） 
Sale sale = sales.stream().reduce((x, y) -> new Sale(x.getAppleSale() + y.getAppleSale(), x.getBananaSale() + y.getBananaSale(), x.getGrapeSale() + y.getGrapeSale())) .orElse(new Sale(0.00, 0.00,0.00));
```

#### 10. 最大值、最小值


**Collectors.maxBy、Collectors.minBy**

```java
//查找每组的最大值
Map<Category, Optional<Dish>> maxByCategory = Dish.menu.stream()
    .collect(Collectors.groupingBy(
        Dish::getCategory,
        Collectors.maxBy(Comparator.comparingInt(Dish::getCalories))
    ));

//查找每组的最小值
Map<Category, Optional<Dish>> maxByCategory = Dish.menu.stream()
    .collect(Collectors.groupingBy(
        Dish::getCategory,
        Collectors.minBy(Comparator.comparingInt(Dish::getCalories))
    ));
```

**max、min**

```java
Dish.menu.stream()
    .max(Comparator.comparingInt(Dish::getCalories))
    .ifPresent(System.out::println);

Dish.menu.stream()
    .min(Comparator.comparingInt(Dish::getCalories))
    .ifPresent(System.out::println);
```


## 短路操作

短路操作可以在满足条件时立即返回结果，不需要处理全部元素：

```java
// anyMatch - 短路操作
boolean matched = names.stream()
    .anyMatch(s -> s.startsWith("A"));
System.out.println(matched); // true (找到第一个就返回)

// findFirst - 短路操作
String firstL = names.stream()
    .filter(s -> s.startsWith("L"))
    .findFirst()
    .orElse("Not found");
System.out.println(firstL);
```

## 并行流（Parallel Streams）

并行流可以利用多核处理器来并行处理数据：

```java
List<Integer> largeList = IntStream.rangeClosed(1, 1000000)
    .boxed()
    .collect(Collectors.toList());

// 串行处理
long startTime = System.currentTimeMillis();
long sum1 = largeList.stream()
    .mapToLong(Integer::longValue)
    .sum();
long endTime = System.currentTimeMillis();
System.out.println("串行处理时间: " + (endTime - startTime) + "ms");

// 并行处理
startTime = System.currentTimeMillis();
long sum2 = largeList.parallelStream()
    .mapToLong(Integer::longValue)
    .sum();
endTime = System.currentTimeMillis();
System.out.println("并行处理时间: " + (endTime - startTime) + "ms");
```

## 实际应用示例

### 1. 数据统计

```java
public class Employee {
    private String name;
    private String department;
    private int salary;
    
    // 构造函数、getter和setter省略
}

List<Employee> employees = Arrays.asList(
    new Employee("Alice", "IT", 70000),
    new Employee("Bob", "HR", 50000),
    new Employee("Charlie", "IT", 80000),
    new Employee("David", "Finance", 60000)
);

// 按部门分组
Map<String, List<Employee>> byDepartment = employees.stream()
    .collect(Collectors.groupingBy(Employee::getDepartment));

// 计算平均薪资
Double avgSalary = employees.stream()
    .collect(Collectors.averagingInt(Employee::getSalary));

// 找出薪资最高的员工
Optional<Employee> maxSalaryEmployee = employees.stream()
    .max(Comparator.comparing(Employee::getSalary));
```

### 2. 复杂数据处理

```java
List<String> sentences = Arrays.asList(
    "Java 8 streams are powerful",
    "They make code more readable",
    "Functional programming is great"
);

// 提取所有单词，去重，排序
List<String> words = sentences.stream()
    .flatMap(sentence -> Arrays.stream(sentence.split("\\s+")))
    .map(String::toLowerCase)
    .distinct()
    .sorted()
    .collect(Collectors.toList());

System.out.println(words);
```

### 3. stream 合并多个byte数组

#### 方法1

```java
public static byte[] splicingArrays(byte[]... bytes) {
        int length = 0;
        for (byte[] b : bytes) {
            length += b.length;
        }
        int interimLength = 0;
        byte[] result = new byte[length];
        for (byte[] b : bytes) {
            System.arraycopy(b, 0, result, interimLength, b.length);
            interimLength += b.length;
        }
        return result;
    }
```

#### 方法2

```java
/**
* 多个字节数组合并一个字节数组
* @param bytes
* @return
*/
private byte[] merge(List<byte[]> bytes) {
    int totalLength = bytes.stream().mapToInt(item -> item.length).sum();
    int destPos = 0;
    byte[] result = new byte[totalLength];
    for (byte[] b : bytes) {
        System.arraycopy(b, 0, result, destPos, b.length);
        destPos += b.length;
    }
    return result;
}
```

## 最佳实践

1. **优先使用Stream API**：对于集合操作，优先考虑使用Stream而不是传统的循环
2. **合理使用并行流**：只在数据量大且操作计算密集时使用并行流
3. **避免副作用**：在lambda表达式中避免修改外部变量
4. **使用方法引用**：当lambda表达式只是调用一个方法时，使用方法引用更简洁
5. **注意性能**：对于简单操作或小数据集，传统循环可能更高效

## 总结

Java 8 Stream API提供了一种强大而优雅的方式来处理集合数据。通过函数式编程的方式，我们可以写出更简洁、更易读的代码。Stream的懒加载特性和并行处理能力使得它在处理大数据集时非常有用。

掌握Stream API不仅能提高代码质量，还能让你的Java编程更加现代化和高效。


