---
title: Java 8 Nashorn 教程
category:
  - Java8
tag:
  - Nashorn
---

# Java 8 Nashorn 教程

## 概述

Nashorn JavaScript引擎是Java SE 8的一个重要组成部分，它允许在JVM上原生运行动态的JavaScript代码，扩展了Java的功能。Nashorn与其他独立的JavaScript引擎（如Google V8）相竞争，为Java开发者提供了强大的脚本执行能力。

本教程将通过15分钟的时间，带你了解如何在JVM上动态执行JavaScript代码，学习Java与JavaScript之间的互操作性，以及Nashorn的各种语言扩展特性。

## 基础使用

### 命令行工具 jjs

Nashorn JavaScript引擎可以通过命令行工具`jjs`使用，该工具位于`$JAVA_HOME/bin`目录中。

```bash
$ cd /usr/bin
$ ln -s $JAVA_HOME/bin/jjs jjs
$ jjs
jjs> print('Hello World');
```

### 在Java代码中使用Nashorn

在Java代码中使用Nashorn需要通过`javax.script`包创建脚本引擎：

```java
ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
engine.eval("print('Hello World!');");
```

也可以通过FileReader执行JavaScript文件：

```java
ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
engine.eval(new FileReader("script.js"));
```

### ECMAScript支持

Nashorn JavaScript基于ECMAScript 5.1标准，未来版本将支持ES6。当前策略遵循ECMAScript规范，为开发者提供标准化的JavaScript执行环境。

## Java与JavaScript的互操作

### 在Java中调用JavaScript函数

Nashorn支持从Java代码直接调用JavaScript函数，可以传递Java对象作为参数，并从函数返回数据。

**JavaScript函数示例：**

```javascript
var fun1 = function(name) {
    print('Hi there from Javascript, ' + name);
    return "greetings from javascript";
};

var fun2 = function (object) {
    print("JS Class Definition: " + Object.prototype.toString.call(object));
};
```

**Java调用代码：**

```java
ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
engine.eval(new FileReader("script.js"));

Invocable invocable = (Invocable) engine;
Object result = invocable.invokeFunction("fun1", "Peter Parker");
System.out.println(result);
System.out.println(result.getClass());

// 输出：
// Hi there from Javascript, Peter Parker
// greetings from javascript
// class java.lang.String
```

**传递Java对象：**

```java
invocable.invokeFunction("fun2", new Date());
// [object java.util.Date]

invocable.invokeFunction("fun2", LocalDateTime.now());
// [object java.time.LocalDateTime]

invocable.invokeFunction("fun2", new Person());
// [object com.winterbe.java8.Person]
```

### 在JavaScript中调用Java方法

#### 静态方法调用

**Java静态方法：**

```java
static String fun1(String name) {
    System.out.format("Hi there from Java, %s", name);
    return "greetings from java";
}
```

**JavaScript调用：**

```javascript
var MyJavaClass = Java.type('my.package.MyJavaClass');
var result = MyJavaClass.fun1('John Doe');
print(result);

// 输出：
// Hi there from Java, John Doe
// greetings from java
```

#### 类型转换

Nashorn在JavaScript和Java之间进行智能的类型转换：

```javascript
MyJavaClass.fun2(123);        // class java.lang.Integer
MyJavaClass.fun2(49.99);      // class java.lang.Double
MyJavaClass.fun2(true);       // class java.lang.Boolean
MyJavaClass.fun2("hi there"); // class java.lang.String
MyJavaClass.fun2(new Number(23)); // class jdk.nashorn.internal.objects.NativeNumber
MyJavaClass.fun2(new Date());     // class jdk.nashorn.internal.objects.NativeDate
```

#### ScriptObjectMirror

`ScriptObjectMirror`类是JavaScript对象在Java中的表示，实现了`Map`接口：

```java
static void fun3(ScriptObjectMirror mirror) {
    System.out.println(mirror.getClassName() + ": " +
        Arrays.toString(mirror.getOwnKeys(true)));
}
```

```javascript
MyJavaClass.fun3({
    foo: 'bar',
    bar: 'foo'
});
// Object: [foo, bar]
```

#### 调用JavaScript对象方法

```javascript
function Person(firstName, lastName) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.getFullName = function() {
        return this.firstName + " " + this.lastName;
    }
}
```

```java
static void fun4(ScriptObjectMirror person) {
    System.out.println("Full Name is: " + person.callMember("getFullName"));
}
```

```javascript
var person1 = new Person("Peter", "Parker");
MyJavaClass.fun4(person1);
// Full Name is: Peter Parker
```

## 语言扩展特性

### 类型数组

Nashorn支持Java的类型数组：

```javascript
var IntArray = Java.type("int[]");
var array = new IntArray(5);
array[0] = 5;
array[1] = 4;
array[2] = 3;
array[3] = 2;
array[4] = 1;

try {
    array[5] = 23;
} catch (e) {
    print(e.message); // Array index out of range: 5
}

array[0] = "17";
print(array[0]); // 17

array[0] = "wrong type";
print(array[0]); // 0

array[0] = "17.3";
print(array[0]); // 17
```

### 集合和范围遍历

#### ArrayList示例

```javascript
var ArrayList = Java.type('java.util.ArrayList');
var list = new ArrayList();
list.add('a');
list.add('b');
list.add('c');

for each (var el in list) print(el); // a, b, c
```

#### HashMap示例

```javascript
var map = new java.util.HashMap();
map.put('foo', 'val1');
map.put('bar', 'val2');

for each (var e in map.keySet()) print(e); // foo, bar
for each (var e in map.values()) print(e); // val1, val2
```

### Lambda表达式和数据流

虽然ECMAScript 5.1没有lambda表达式的箭头语法，但可以使用函数字面值：

```javascript
var list2 = new java.util.ArrayList();
list2.add("ddd2");
list2.add("aaa2");
list2.add("bbb1");
list2.add("aaa1");
list2.add("bbb3");
list2.add("ccc");
list2.add("bbb2");
list2.add("ddd1");

list2
    .stream()
    .filter(function(el) {
        return el.startsWith("aaa");
    })
    .sorted()
    .forEach(function(el) {
        print(el);
    });
// aaa1, aaa2
```

### 类的继承

使用`Java.extend`可以轻松扩展Java类型：

```javascript
var Runnable = Java.type('java.lang.Runnable');
var Printer = Java.extend(Runnable, {
    run: function() {
        print('printed from a separate thread');
    }
});

var Thread = Java.type('java.lang.Thread');
new Thread(new Printer()).start();

new Thread(function() {
    print('printed from another thread');
}).start();

// printed from a separate thread
// printed from another thread
```

### 参数重载

方法可以通过点运算符或方括号运算符调用：

```javascript
var System = Java.type('java.lang.System');
System.out.println(10);              // 10
System.out["println"](11.0);         // 11.0
System.out["println(double)"](12);   // 12.0
```

### Java Beans

可以直接使用属性名称访问Java Bean：

```javascript
var Date = Java.type('java.util.Date');
var date = new Date();
date.year += 1900;
print(date.year); // 2014
```

### 函数字面值

支持简化的单行函数语法：

```javascript
function sqr(x) x * x;
print(sqr(3)); // 9
```

### 属性绑定

可以绑定不同对象的属性：

```javascript
var o1 = {};
var o2 = { foo: 'bar'};

Object.bindProperties(o1, o2);
print(o1.foo); // bar

o1.foo = 'BAM';
print(o2.foo); // BAM
```

### 字符串处理

提供额外的字符串方法：

```javascript
print(" hehe".trimLeft());           // hehe
print("hehe ".trimRight() + "he");   // hehehe
```

### 位置信息

获取当前脚本位置信息：

```javascript
print(__FILE__, __LINE__, __DIR__);
```

### 导入作用域

使用`JavaImporter`和`with`语句批量导入Java包：

```javascript
var imports = new JavaImporter(java.io, java.lang);
with (imports) {
    var file = new File(__FILE__);
    System.out.println(file.getAbsolutePath());
    // /path/to/my/script.js
}
```

### 数组转换

#### Java集合转JavaScript数组

```javascript
var list = new java.util.ArrayList();
list.add("s1");
list.add("s2");
list.add("s3");

var jsArray = Java.from(list);
print(jsArray); // s1,s2,s3
print(Object.prototype.toString.call(jsArray)); // [object Array]
```

#### JavaScript数组转Java数组

```javascript
var javaArray = Java.to([3, 5, 7, 11], "int[]");
```

### 访问超类

Nashorn提供了访问被覆盖成员的方法：

**Java超类：**

```java
class SuperRunner implements Runnable {
    @Override
    public void run() {
        System.out.println("super run");
    }
}
```

**JavaScript继承：**

```javascript
var SuperRunner = Java.type('com.winterbe.java8.SuperRunner');
var Runner = Java.extend(SuperRunner);

var runner = new Runner() {
    run: function() {
        Java.super(runner).run();
        print('on my run');
    }
}

runner.run();
// super run
// on my run
```

### 加载外部脚本

使用`load`函数加载本地或远程脚本：

```javascript
load('http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.6.0/underscore-min.js');

var odds = _.filter([1, 2, 3, 4, 5, 6], function (num) {
    return num % 2 == 1;
});
print(odds); // 1, 3, 5
```

为避免变量名冲突，可以在新的全局上下文中加载脚本：

```javascript
loadWithNewGlobal('script.js');
```

## 命令行脚本

对于命令行脚本开发，可以使用Nake工具，这是一个基于Java 8 Nashorn的简化构建工具。你可以在项目特定的Nakefile中定义任务，然后通过命令行执行。

## 总结

Nashorn JavaScript引擎为Java开发者提供了强大的脚本执行能力，实现了Java与JavaScript之间的无缝互操作。通过本教程，你学会了：

- 如何在Java中执行JavaScript代码
- Java与JavaScript之间的双向调用
- 类型转换和对象映射
- Nashorn的各种语言扩展特性
- 实用的脚本编写技巧

Nashorn使得在Java应用中集成动态脚本变得前所未有的简单，为Java开发者打开了新的可能性。

## 相关资源

- [Oracle Nashorn官方文档](http://docs.oracle.com/javase/8/docs/technotes/guides/scripting/nashorn/)
- [Nashorn扩展特性](https://wiki.openjdk.java.net/display/Nashorn/Nashorn+extensions)
- [Nashorn Shell脚本教程](http://docs.oracle.com/javase/8/docs/technotes/guides/scripting/nashorn/shell.html)

---
