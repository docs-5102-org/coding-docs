---
title: Java中equals()和hashCode()方法详解
category:
  - java
tag:
  - equals
  - hashCode
---

# Java中equals()和hashCode()方法详解

## 概述

在Java编程中，正确理解和实现`equals()`和`hashCode()`方法是面向对象编程的重要基础。本文将深入分析这两个方法的关系、重写规则以及实际应用场景。

## equals()方法基础

### 默认行为
`Object`类中的`equals(Object obj)`方法默认实现：
- 对于任何非空引用值x和y，当且仅当x和y引用同一个对象时，`x.equals(y)`才返回`true`
- 本质上等同于使用`==`操作符比较对象引用

### 重写目的
重写`equals()`方法的主要目的是**比较对象的值相等性而非引用相等性**：
- 未重写：比较对象引用是否指向同一块内存地址
- 重写后：比较两个对象的内容值是否相等

## hashCode()方法的作用

### 核心功能
`hashCode()`方法返回对象的哈希码值，主要用于：
- 散列数据的快速存取
- 在`HashSet`、`HashMap`、`Hashtable`等散列集合中判断对象是否相同

### 性能优化
散列集合通过hashCode进行快速定位，避免逐一比较所有元素，大大提升查找效率。

## equals()与hashCode()的协定

### 核心规则

当重写`equals()`方法时，**必须同时重写`hashCode()`方法**，以维护以下协定：

1. **一致性规则**：如果`obj1.equals(obj2)`为`true`，则`obj1.hashCode() == obj2.hashCode()`必须为`true`
2. **逆否规则**：如果`obj1.hashCode() != obj2.hashCode()`，则`obj1.equals(obj2)`必须为`false`

### 违反协定的后果

如果只重写`equals()`而不重写`hashCode()`：
- 两个内容相同的对象，`equals()`返回`true`
- 但它们的`hashCode()`可能不同
- 在散列集合中会被视为不同对象，导致重复存储

## 实例分析

### 问题代码示例

```java
import java.util.*;

public class HelloWorld {
    public static void main(String[] args) {
        Name n1 = new Name("01");
        Name n2 = new Name("01");
        
        Collection c = new HashSet();
        c.add(n1);
        System.out.println("添加n1后集合大小: " + c.size());
        
        c.add(n2);
        System.out.println("添加n2后集合大小: " + c.size());
        
        System.out.println("n1.equals(n2): " + n1.equals(n2));
        System.out.println("n1.hashCode(): " + n1.hashCode());
        System.out.println("n2.hashCode(): " + n2.hashCode());
        System.out.println("集合内容: " + c);
    }
}

class Name {
    private String id;
    
    public Name(String id) {
        this.id = id; 
    }
    
    @Override
    public String toString() {
        return this.id;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Name) {
            Name name = (Name) obj;
            System.out.println("调用equals比较: " + name.id);
            return id.equals(name.id);
        }
        return super.equals(obj);
    }
    
    @Override
    public int hashCode() {
        System.out.println("调用hashCode: " + this.id);
        return id.hashCode();
    }
}
```

### 执行流程分析

1. **添加n1时**：
   - 调用`n1.hashCode()`计算哈希值
   - 将n1存入HashSet

2. **添加n2时**：
   - 调用`n2.hashCode()`计算哈希值
   - 如果哈希值相同，再调用`equals()`进行最终确认
   - 如果`equals()`返回`true`，则不添加重复元素

3. **结果验证**：
   - `n1.equals(n2)`返回`true`（内容相同）
   - 由于正确重写了`hashCode()`，两对象哈希值相同
   - HashSet只包含一个元素

## 特殊情况说明

### 包装类和String类
以下类型已经正确重写了`equals()`和`hashCode()`方法：
- 八大基本类型的包装类（Integer、Double、Boolean等）
- String类
- 使用时默认比较的是值而不是引用

### 自定义类的最佳实践

```java
public class Person {
    private String name;
    private int age;
    
    // 构造方法、getter、setter等...
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        
        Person person = (Person) obj;
        return age == person.age && 
               Objects.equals(name, person.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
}
```

## 总结

### 重写原则
- **自定义类**：重写`equals()`方法进行等值比较
- **散列集合**：必须同时重写`hashCode()`方法
- **排序需求**：实现`Comparable`接口或重写`compareTo()`方法

### 关键要点
1. `equals()`和`hashCode()`必须同时重写，保持契约一致性
2. 相等的对象必须有相同的哈希码
3. 散列集合的正确工作依赖于这两个方法的正确实现
4. 使用IDE工具或`Objects.hash()`可以简化实现过程

通过正确理解和实现这两个方法，能够确保自定义类在各种集合框架中的正确行为，避免难以调试的逻辑错误。