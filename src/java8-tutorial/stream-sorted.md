
title: Java 8 Stream sorted(排序)
category:
  - Java
  - 流处理
tag:
  - stream
  - 集合处理
  - 函数式编程
---

# Java 8 Stream sorted(排序)

---

### ✅ 1. **使用 `List.sort(...)` 代替 `stream().sorted()` + `collect(...)`**

对于只需自然排序、逆序的情况：

```java
list.sort(Comparator.naturalOrder());
list.sort(Comparator.reverseOrder());
list.sort(Comparator.comparing(Student::getAge));
list.sort(Comparator.comparing(Student::getAge).reversed());
```

内置 `List.sort(...)` 更简洁，同时性能更优 ([Medium][1], [springframework.guru][2])。

---

### ✅ 2. **避免重复创建 Comparator**

当在多个地方使用相同排序逻辑，可以提取为常量：

```java
public static final Comparator<Student> BY_AGE =
    Comparator.comparingInt(Student::getAge);

list.sort(BY_AGE);
list.sort(BY_AGE.reversed());
```

这样可以避免 lambda 每次分配带来的开销 。

---

### ✅ 3. **用 `comparingInt` 替代 `comparing(..., Integer)`**

对基本类型排序时使用：

```java
Comparator.comparingInt(Student::getAge);
```

比 `Comparator.comparing(Student::getAge)` 少一次装箱，提高性能 ([Baeldung][3])。

---

### ✅ 4. **链式多字段排序一行搞定**

例：先按年龄升序，再按零花钱升序：

```java
list.sort(
  Comparator.comparingInt(Student::getAge)
            .thenComparing(Student::getMoney)
);
```

例：年龄升序 + 零花钱 **倒序**：

```java
list.sort(
  Comparator.comparingInt(Student::getAge)
            .thenComparing(Student::getMoney, Comparator.reverseOrder())
);
```

更清晰、易维护，语义明确 ([Stack Abuse][4], [Reddit][5], [Baeldung][6])。

---

### ✅ 5. **几行优化总结示例**

```java
// 常量 Comparator
private static final Comparator<Student> BY_AGE = Comparator.comparingInt(Student::getAge);

students.sort(BY_AGE);                                 // 年龄升序
students.sort(BY_AGE.reversed());                       // 年龄降序

students.sort(                                          // 年龄 → 零花钱排序
    BY_AGE.thenComparing(Student::getMoney)
);

students.sort(                                          // 年龄→零花钱倒序
    BY_AGE.thenComparing(Student::getMoney, Comparator.reverseOrder())
);
```

---

### ✅ 6. **可选：并行排序优化（适合大集合）**

如果是 **百万级**以上的大数据量，并行处理可提升性能：

```java
List<Student> sorted = students.parallelStream()
    .sorted(COMPARATOR)
    .collect(Collectors.toList());
```

### ✅ 7.sort 对象接收一个 Comparator 函数式接口，可以传入一个lambda表达式

```java
employees.sort((o1, o2) -> o1.getName().compareTo(o2.getName()));
```

---