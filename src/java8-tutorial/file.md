---
title: Java 8 文件操作
category:
  - Java
  - 文件操作
tag:
  - 列出文件
  - 读写文件
---


# Java 8 文件操作

## 概述

`Files`工具类首次在Java 7中引入，作为NIO的一部分。JDK 8 API添加了一些额外的方法，它们可以将文件用于函数式数据流。这些新特性使得文件操作变得更加简洁和高效。

## 列出文件

`Files.list`方法将指定目录的所有路径转换为数据流，便于我们在文件系统的内容上使用类似`filter`和`sorted`的流操作。

```java
try (Stream<Path> stream = Files.list(Paths.get(""))) {
    String joined = stream
        .map(String::valueOf)
        .filter(path -> !path.startsWith("."))
        .sorted()
        .collect(Collectors.joining("; "));
    System.out.println("List: " + joined);
}
```

上面的例子列出了当前工作目录的所有文件，之后将每个路径都映射为它的字符串表示。之后结果被过滤、排序，最后连接为一个字符串。

**注意事项：**
- 数据流的创建包装在`try-with`语句中
- 数据流实现了`AutoCloseable`，需要显式关闭数据流
- 返回的数据流是`DirectoryStream`的封装
- 使用`try-with`结构确保在流式操作完成后，数据流的`close`方法被调用

## 查找文件

### 使用Files.find方法

下面的例子演示了如何查找在目录及其子目录下的文件：

```java
Path start = Paths.get("");
int maxDepth = 5;
try (Stream<Path> stream = Files.find(start, maxDepth, (path, attr) ->
        String.valueOf(path).endsWith(".js"))) {
    String joined = stream
        .sorted()
        .map(String::valueOf)
        .collect(Collectors.joining("; "));
    System.out.println("Found: " + joined);
}
```

`find`方法接受三个参数：
- `start`：目录路径，作为搜索的起始点
- `maxDepth`：定义了最大搜索深度
- 第三个参数是一个匹配谓词，定义了搜索的逻辑

上面的例子中，我们搜索了所有JavaScript文件（以`.js`结尾的文件名）。

### 使用Files.walk方法

我们可以使用`Files.walk`方法来完成相同的行为。这个方法会遍历每个文件，而不需要传递搜索谓词。

```java
Path start = Paths.get("");
int maxDepth = 5;
try (Stream<Path> stream = Files.walk(start, maxDepth)) {
    String joined = stream
        .map(String::valueOf)
        .filter(path -> path.endsWith(".js"))
        .sorted()
        .collect(Collectors.joining("; "));
    System.out.println("walk(): " + joined);
}
```

这个例子中，我们使用了流式操作`filter`来完成和上个例子相同的行为。

## 读写文件

### 基本读写操作

将文本文件读到内存，以及向文本文件写入字符串在Java 8中是简单的任务。不需要再去摆弄读写器了。

```java
List<String> lines = Files.readAllLines(Paths.get("res/nashorn1.js"));
lines.add("print('foobar');");
Files.write(Paths.get("res/nashorn1-modified.js"), lines);
```

`Files.readAllLines`从指定的文件把所有行读进字符串列表中。你可以简单地修改这个列表，并且将它通过`Files.write`写到另一个文件中。

**注意：** 这些方法对内存并不十分高效，因为整个文件都会读进内存。文件越大，所用的堆区也就越大。

### 内存高效的读取方式

你可以使用`Files.lines`方法来作为内存高效的替代。这个方法读取每一行，并使用函数式数据流来对其流式处理，而不是一次性把所有行都读进内存。

```java
try (Stream<String> stream = Files.lines(Paths.get("res/nashorn1.js"))) {
    stream
        .filter(line -> line.contains("print"))
        .map(String::trim)
        .forEach(System.out::println);
}
```

### 使用BufferedReader和BufferedWriter

如果你需要更多的精细控制，你可以构造一个新的`BufferedReader`：

```java
Path path = Paths.get("res/nashorn1.js");
try (BufferedReader reader = Files.newBufferedReader(path)) {
    System.out.println(reader.readLine());
}
```

或者，你需要写入文件时，简单地构造一个`BufferedWriter`：

```java
Path path = Paths.get("res/output.js");
try (BufferedWriter writer = Files.newBufferedWriter(path)) {
    writer.write("print('Hello World');");
}
```

### BufferedReader的流式操作

`BufferedReader`也可以访问函数式数据流。`lines`方法在它所有行上面构建数据流：

```java
Path path = Paths.get("res/nashorn1.js");
try (BufferedReader reader = Files.newBufferedReader(path)) {
    long countPrints = reader
        .lines()
        .filter(line -> line.contains("print"))
        .count();
    System.out.println(countPrints);
}
```

## 总结

Java 8的文件操作API通过引入函数式数据流，使得文件处理变得更加简洁和强大。主要特性包括：

1. **流式操作**：`Files.list`、`Files.find`、`Files.walk`等方法返回Stream，支持函数式编程
2. **资源管理**：使用try-with-resources语句确保资源正确关闭
3. **内存效率**：`Files.lines`方法提供内存高效的文件读取方式
4. **简化API**：`Files.readAllLines`和`Files.write`简化了基本的文件读写操作

这些新特性使得Java文件操作更加现代化，同时保持了良好的性能和资源管理。