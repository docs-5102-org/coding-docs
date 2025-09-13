---
title: Java Annotation 教程
category:
  - java
  - 注解
tag:
  - Annotation
---

# Java Annotation 教程

## 摘要

本教程针对Java初学者或Annotation初次使用者，全面介绍了Annotation的使用方法、定义方式和分类。通过本教程的学习，初学者可以掌握基本的Annotation编程技能，包括元数据概念、内置注解详解、自定义注解开发、元注解应用以及并发编程中的注解使用，为进一步学习高级应用打下基础。

## 目录

1. [元数据的作用](#元数据的作用)
2. [为什么使用Annotation](#为什么使用annotation)
3. [Annotation工作方式](#annotation工作方式)
4. [基本内置注解详解](#基本内置注解详解)
5. [自定义Annotation开发](#自定义annotation开发)
6. [元注解（Meta-Annotations）](#元注解meta-annotations)
7. [注解信息读取](#注解信息读取)
8. [Annotation使用方法](#annotation使用方法)
9. [Annotation分类](#annotation分类)
10. [并发编程中的注解](#并发编程中的注解)
11. [总结](#总结)

## 元数据的作用

在深入学习Annotation之前，首先需要理解元数据的概念。元数据（Metadata）是关于数据的数据，它提供了关于程序元素的额外信息。根据元数据所起的作用，可以将其分为三类：

### 1. 编写文档
通过代码里标识的元数据生成文档。这种方式可以确保文档与代码的同步性，减少维护成本。

### 2. 代码分析
通过代码里标识的元数据对代码进行分析。开发工具和静态分析工具可以利用这些信息提供更好的支持。

### 3. 编译检查
通过代码里标识的元数据让编译器能实现基本的编译检查。这可以在编译期发现潜在的问题，提高代码质量。

## 基本内置注解详解

Java提供了几个基本的内置注解，它们在日常开发中非常常用：

### @Override 注解
`@Override`注解能实现编译时检查，用于声明该方法是覆盖父类中的方法。

**作用：**
- 编译时检查方法是否真的覆盖了父类方法
- 提高代码可读性
- 防止因拼写错误导致的问题

**示例：**
```java
public class Parent {
    public void display() {
        System.out.println("Parent display");
    }
}

public class Child extends Parent {
    @Override
    public void display() {  // 正确覆盖
        System.out.println("Child display");
    }
    
    // 如果写成下面这样会编译报错
    // @Override
    // public void dispaly() {  // 拼写错误
    //     System.out.println("Child display");
    // }
}
```

### @Deprecated 注解
`@Deprecated`注解用于标记不应该再使用的方法、类或字段。

**特点：**
- 与javadoc里的`@deprecated`标记功能相同
- 编译时会显示提示信息
- 不支持参数

**注意：** 要了解详细信息，请使用 `-Xlint:deprecation` 重新编译。

**示例：**
```java
public class DeprecatedExample {
    @Deprecated
    public void oldMethod() {
        System.out.println("This method is deprecated");
    }
    
    public void newMethod() {
        System.out.println("This is the new method");
    }
    
    public static void main(String[] args) {
        DeprecatedExample example = new DeprecatedExample();
        example.oldMethod();  // 编译器会显示警告
    }
}
```

### @SuppressWarnings 注解
`@SuppressWarnings`注解用于抑制编译器警告，需要添加参数才能正确使用。

**常用参数值：**

| 参数 | 说明 |
|------|------|
| `deprecation` | 使用了过时的类或方法时的警告 |
| `unchecked` | 执行了未检查的转换时的警告，例如使用集合时没有用泛型 |
| `fallthrough` | 当Switch程序块直接通往下一种情况而没有Break时的警告 |
| `path` | 在类路径、源文件路径等中有不存在的路径时的警告 |
| `serial` | 当在可序列化的类上缺少serialVersionUID定义时的警告 |
| `finally` | 任何finally子句不能正常完成时的警告 |
| `all` | 关于以上所有情况的警告 |

**注意：** 要了解详细信息，请使用 `-Xlint:unchecked` 重新编译。

**示例：**
```java
import java.util.*;

public class SuppressWarningsExample {
    @SuppressWarnings("deprecation")
    public void useDeprecatedMethod() {
        // 使用已废弃的方法，但不显示警告
    }
    
    @SuppressWarnings({"unchecked", "serial"})
    public void useUncheckedOperations() {
        List list = new ArrayList();  // 未使用泛型
        list.add("Hello");
    }
    
    @SuppressWarnings("all")
    public void suppressAllWarnings() {
        // 抑制所有警告
    }
}
```

## 自定义Annotation开发

### 创建基本注解类型

创建自定义注解类似于创建接口，但需要使用`@interface`关键字：

```java
public @interface NewAnnotation {
    // 注解体
}
```

### 使用自定义注解

```java
public class AnnotationTest {
    @NewAnnotation
    public static void main(String[] args) {
        // 方法实现
    }
}
```

### 添加参数

注解可以包含参数，但参数类型有限制：只允许基本类型、String、Class、枚举类型等，并且参数不能为空。

```java
public @interface NewAnnotation {
    String value();  // 添加String类型参数
}
```

**使用带参数的注解：**

```java
public class AnnotationTest {
    @NewAnnotation("Just a Test.")
    public static void main(String[] args) {
        sayHello();
    }

    @NewAnnotation(value = "Hello NUMEN.")
    public static void sayHello() {
        // do something
    }
}
```

### 为参数设置默认值

```java
public @interface Greeting {
    public enum FontColor {RED, GREEN, BLUE};
    
    String name();
    String content();
    FontColor fontColor() default FontColor.BLUE;  // 设置默认值
}
```

**使用示例：**
```java
public class GreetingTest {
    @Greeting(name = "John", content = "Hello World")  // 使用默认颜色
    public void method1() {}
    
    @Greeting(name = "Jane", content = "Hi", fontColor = Greeting.FontColor.RED)
    public void method2() {}
}
```

## 元注解（Meta-Annotations）

元注解是用于注解其他注解的注解，Java提供了几个重要的元注解：

### @Target - 限定注解使用范围

`@Target`注解用于控制自定义注解的使用范围，使用`ElementType`枚举来指定：

```java
package java.lang.annotation;

public enum ElementType {
    TYPE,               // Class, interface, or enum (but not annotation)
    FIELD,              // Field (including enumerated values)
    METHOD,             // Method (does not include constructors)
    PARAMETER,          // Method parameter
    CONSTRUCTOR,        // Constructor
    LOCAL_VARIABLE,     // Local variable or catch clause
    ANNOTATION_TYPE,    // Annotation Types (meta-annotations)
    PACKAGE             // Java package
}
```

**示例：**
```java
@Target({ElementType.METHOD, ElementType.CONSTRUCTOR})
public @interface Greeting {
    String value();
}
```

### @Retention - 注解保持性策略

`@Retention`注解用于指定注解的保留策略：

```java
public enum RetentionPolicy {
    SOURCE,    // Annotation is discarded by the compiler
    CLASS,     // Annotation is stored in the class file, but ignored by the VM
    RUNTIME    // Annotation is stored in the class file and read by the VM
}
```

**示例：**
```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.CONSTRUCTOR})
public @interface Greeting {
    String value();
}
```

### @Documented - 文档化功能

`@Documented`元注解用于指定注解是否会出现在JavaDoc中：

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.CONSTRUCTOR})
public @interface Greeting {
    String value();
}
```

**注意：** 使用`@Documented`元注解时，必须设置`RetentionPolicy.RUNTIME`保持性策略。

### @Inherited - 注解继承

`@Inherited`元注解用于控制注解是否会影响到子类：

```java
@Inherited
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.CONSTRUCTOR})
public @interface Greeting {
    String value();
}
```

## 注解信息读取

要在运行时读取注解信息，需要通过反射来实现，并且注解必须标记为`@Retention(RetentionPolicy.RUNTIME)`：

```java
public class AnnotationReader {
    public static void main(String[] args) throws Exception {
        Method[] methods = Class.forName("com.example.AnnotationTest")
                .getDeclaredMethods();
        
        for (Method method : methods) {
            Annotation[] annotations = method.getAnnotations();
            for (Annotation annotation : annotations) {
                System.out.println(method.getName() + " : " 
                    + annotation.annotationType().getName());
            }
        }
    }
}
```

**读取特定注解的信息：**
```java
public class SpecificAnnotationReader {
    public static void main(String[] args) throws Exception {
        Class<?> clazz = Class.forName("com.example.AnnotationTest");
        Method[] methods = clazz.getDeclaredMethods();
        
        for (Method method : methods) {
            if (method.isAnnotationPresent(Greeting.class)) {
                Greeting greeting = method.getAnnotation(Greeting.class);
                System.out.println("Method: " + method.getName());
                System.out.println("Name: " + greeting.name());
                System.out.println("Content: " + greeting.content());
                System.out.println("FontColor: " + greeting.fontColor());
            }
        }
    }
}
```

在Java应用开发中，我们经常遇到需要使用模板代码的情况。Annotation的出现主要解决了以下问题：

### 1. 减少模板代码

例如，在编写JAX-RPC web service时，传统方式需要提供一对接口和实现作为模板代码。使用Annotation对远程访问的方法进行标注后，这些模板代码可以通过工具自动生成。

### 2. 维护附属文件

许多API需要使用与程序代码同时维护的附属文件：
- JavaBeans需要一个BeanInfo Class
- EJB需要部署描述符

使用Annotation可以在程序中直接维护这些附属文件的信息，既便利又能减少错误。

## Annotation工作方式

### 历史背景

在Java 5.0版本之前，Java平台已经具有一些临时的annotation机制：
- `transient`修饰符：标识成员变量在序列化时应被忽略
- `@deprecated` javadoc tag：说明方法已过时

### Java 5.0的正式支持

Java 5.0开始提供正式的Annotation功能，包括：
- 定义annotation类型的语法
- 描述annotation声明的语法
- 读取annotation的API
- 使用annotation修饰的class文件
- annotation处理工具（apt）

### 工作原理

- Annotation不直接影响代码语义
- 它们像程序工具或类库一样工作
- 可以反过来对运行中的程序语义产生影响
- 可以从源文件、class文件或运行时通过反射读取

## Annotation使用方法

### 1. 类型声明方式

Annotation类型声明类似于接口声明，区别是在`interface`关键字前使用`@`符号。

#### 基本语法规则：
- 方法声明定义annotation类型成员
- 方法不能有参数或异常声明
- 返回值类型限制在：primitives、String、Class、enums、annotation和这些类型的数组
- 方法可以有默认值

#### 示例：RequestForEnhancement注解

```java
/**
 * Describes the Request-For-Enhancement(RFE) that led
 * to the presence of the annotated API element.
 */
public @interface RequestForEnhancement {
    int    id();
    String synopsis();
    String engineer() default "[unassigned]"; 
    String date() default "[unimplemented]"; 
}
```

### 2. 修饰方法的annotation声明方式

Annotation是一种修饰符，使用规则：
- 习惯上放在其他修饰符前面
- 语法：`@+annotation类型+带括号的成员-值列表`
- 成员值必须是编译时常量

#### A. 完整成员声明

```java
@RequestForEnhancement(
    id       = 2868724,
    synopsis = "Enable time-travel",
    engineer = "Mr. Peabody",
    date     = "4/1/3007"
)
public static void travelThroughTime(Date destination) { 
    // 方法实现
}
```

#### B. 无成员annotation

```java
/**
 * Indicates that the specification of the annotated API element
 * is preliminary and subject to change.
 */
public @interface Preliminary { }

// 使用方式
@Preliminary 
public class TimeTravel { 
    // 类实现
}
```

#### C. 单成员annotation（value）

```java
/**
 * Associates a copyright notice with the annotated API element.
 */
public @interface Copyright {
    String value();
}

// 简化使用方式（可省略成员名和赋值号）
@Copyright("2002 Yoyodyne Propulsion Systems")
public class OscillationOverthruster { 
    // 类实现
}
```

### 3. 完整使用实例：测试框架

#### 定义测试注解

```java
import java.lang.annotation.*;

/**
 * Indicates that the annotated method is a test method.
 * This annotation should be used only on parameterless static methods.
 */
@Retention(RetentionPolicy.RUNTIME)  // 运行时保留
@Target(ElementType.METHOD)          // 只能用于方法
public @interface Test { }
```

**Meta-annotations说明：**
- `@Retention(RetentionPolicy.RUNTIME)`：注解在运行时通过反射可读取
- `@Target(ElementType.METHOD)`：注解只能用于修饰方法声明

#### 测试类示例

```java
public class Foo {
    @Test public static void m1() { }
    public static void m2() { }
    @Test public static void m3() {
        throw new RuntimeException("Boom");
    }
    public static void m4() { }
    @Test public static void m5() { }
    public static void m6() { }
    @Test public static void m7() {
        throw new RuntimeException("Crash");
    }
    public static void m8() { }
}
```

#### 测试工具实现

```java
import java.lang.reflect.*;

public class RunTests {
   public static void main(String[] args) throws Exception {
      int passed = 0, failed = 0;
      for (Method m : Class.forName(args[0]).getMethods()) {
         if (m.isAnnotationPresent(Test.class)) {
            try {
               m.invoke(null);
               passed++;
            } catch (Throwable ex) {
               System.out.printf("Test %s failed: %s %n", m, ex.getCause());
               failed++;
            }
         }
      }
      System.out.printf("Passed: %d, Failed %d%n", passed, failed);
   }
}
```

#### 运行结果

```bash
$ java RunTests Foo
Test public static void Foo.m3() failed: java.lang.RuntimeException: Boom 
Test public static void Foo.m7() failed: java.lang.RuntimeException: Crash 
Passed: 2, Failed 2
```

## Annotation分类

### 1. 内建Annotation

Java 5.0提供的常用内建Annotation：

- `@Deprecated`：标记已过时的方法
- `@Override`：标记覆盖父类的方法（非重载）
- `@SuppressWarnings`：通知编译器禁止特定编译警告

#### 内建Annotation使用示例

```java
package com.bjinfotech.practice.annotation;

import java.util.List;

public class UsingBuiltInAnnotation {
    // 食物类
    class Food{}
    
    // 干草类
    class Hay extends Food{}
    
    // 动物类
    class Animal{
        Food getFood(){
            return null;
        }
        
        // 使用@Deprecated声明过时方法
        @Deprecated
        void deprecatedMethod(){
        }
    }
    
    // 马类-继承动物类
    class Horse extends Animal{
        // 使用@Override声明覆盖方法
        @Override
        Hay getFood(){
            return new Hay();
        }
        
        // 使用@SuppressWarnings禁止警告
        @SuppressWarnings({"deprecation","unchecked"})
        void callDeprecatedMethod(List horseGroup){
            Animal an = new Animal();
            an.deprecatedMethod();
            horseGroup.add(an);
        }
    }
}
```

### 2. 开发者自定义Annotation

#### 定义自定义注解

```java
package com.bjinfotech.practice.annotation;

import java.lang.annotation.*;

/**
 * 定义annotation
 * @author cleverpig
 */
// 加载在VM中，在运行时进行映射
@Retention(RetentionPolicy.RUNTIME)
// 限定此annotation只能标示方法
@Target(ElementType.METHOD)
public @interface AnnotationDefineForTestFunction{}
```

#### 使用自定义注解

```java
package com.bjinfotech.practice.annotation;

import java.lang.reflect.*;

/**
 * 应用自定义Annotation的实例程序
 * @author cleverpig
 */
public class UsingAnnotation {
    @AnnotationDefineForTestFunction 
    public static void method01(){}
    
    public static void method02(){}
    
    @AnnotationDefineForTestFunction 
    public static void method03(){
        throw new RuntimeException("method03");
    }
    
    public static void method04(){
        throw new RuntimeException("method04");
    }
    
    public static void main(String[] argv) throws Exception{
        int passed = 0, failed = 0;
        // 被检测的类名
        String className = "com.bjinfotech.practice.annotation.UsingAnnotation";
        
        // 逐个检查此类的方法，当方法使用annotation声明时调用此方法
        for (Method m : Class.forName(className).getMethods()) {
           if (m.isAnnotationPresent(AnnotationDefineForTestFunction.class)) {
              try {
                 m.invoke(null);
                 passed++;
              } catch (Throwable ex) {
                 System.out.printf("测试 %s 失败: %s %n", m, ex.getCause());
                 failed++;
              }
           }
        }
        System.out.printf("测试结果：通过: %d, 失败： %d%n", passed, failed);
    }
}
```

### 3. 第三方Annotation

使用第三方开发的Annotation类型是开发人员常用的方式。例如：
- **Hibernate 3.0**：使用Annotation生成数据表映射配置文件，替代Xdoclet
- **Spring Framework**：大量使用Annotation进行依赖注入和配置
- **JUnit**：使用`@Test`等注解进行单元测试

## 总结

### 关键要点

1. **基础应用**：通过本教程的学习，初学者可以制作简单的annotation程序，掌握基本的使用方法、定义方式和分类。

2. **进阶学习**：对于高级应用（如使用自定义annotation生成JavaBean映射XML文件），需要进一步深入研究。

3. **运行方式**：Annotation存在两种运行方式：
   - **运行时**：本教程主要讨论的方式，通过反射机制处理
   - **编译时**：需要使用annotation processing tool（APT），适用于代码生成等场景

### 最佳实践

- 合理选择annotation的保留策略（RetentionPolicy）
- 明确annotation的作用目标（Target）
- 为annotation提供清晰的文档说明
- 在设计自定义annotation时，考虑其可复用性和扩展性

### 下一步学习

- 深入学习annotation处理器（Annotation Processor）
- 探索编译时annotation的应用
- 学习常用框架中annotation的使用模式
- 实践更复杂的annotation应用场景