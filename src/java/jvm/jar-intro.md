---
title: Java jar 命令详解
category:
  - Java
tag:
  - JVM
  - jar
---

# Java jar 命令详解

## 目录

[[toc]]

## Java jar 运行语法介绍

### 基本语法
```bash
java [options] -jar jarfile [args...]
```

### 常用参数说明

**基础参数：**
- `-jar jarfile` - 指定要运行的 jar 文件
- `args...` - 传递给应用程序主方法的参数

**内存相关参数：**
- `-Xms<size>` - 设置初始堆内存大小（如：-Xms512m）
- `-Xmx<size>` - 设置最大堆内存大小（如：-Xmx1024m）
- `-Xss<size>` - 设置线程栈大小（如：-Xss256k）

**系统属性参数：**
- `-Dproperty=value` - 设置系统属性
- `-Dfile.encoding=UTF-8` - 设置文件编码
- `-Djava.awt.headless=true` - 无头模式运行

**调试参数：**
- `-verbose:gc` - 显示 GC 信息
- `-XX:+PrintGCDetails` - 显示详细 GC 信息
- `-Djava.util.logging.config.file=logging.properties` - 指定日志配置

### 语法示例

```bash
# 基本运行
java -jar myapp.jar

# 设置内存参数运行
java -Xms256m -Xmx512m -jar myapp.jar

# 设置系统属性运行
java -Dspring.profiles.active=prod -jar myapp.jar

# 传递应用程序参数
java -jar myapp.jar --port=8080 --debug=true

# 组合使用多个参数
java -Xmx1024m -Dfile.encoding=UTF-8 -jar myapp.jar --config=/path/to/config
```

## 概述

Java jar 命令是用于运行打包好的 Java 应用程序的重要工具。然而，在使用 `java -jar` 参数运行应用时，经常会遇到 classpath 设置的问题，特别是第三方类库无法找到的 `ClassNotFoundException` 错误。

## 核心问题

当使用 `java -jar yourJarExe.jar` 运行打包应用程序时，Java 虚拟机会：
- **屏蔽所有外部 classpath**
- **只以 jar 包内部的 class 作为类的搜索范围**
- **忽略环境变量 CLASSPATH 和命令行指定的类路径**

这就是为什么无论如何设置 `-classpath` 参数都无济于事的根本原因。

## 解决方案

### 方案一：BootStrap Class 扩展（推荐）

Java 命令行提供了扩展 BootStrap 级别 class 的方法：

```bash
# 完全取代基本核心的 Java class 搜索路径（不常用）
-Xbootclasspath:

# 后缀在核心 class 搜索路径后面（常用，推荐）
-Xbootclasspath/a:

# 前缀在核心 class 搜索路径前面（不常用，避免冲突）
-Xbootclasspath/p:
```

**使用示例：**
```bash
# Unix/Linux 系统（使用冒号分隔）
java -Xbootclasspath/a:/usrhome/thirdlib.jar: -jar yourJarExe.jar

# Windows 系统（使用分号分隔）
java -Xbootclasspath/a:C:\lib\thirdlib.jar; -jar yourJarExe.jar
```

**优点：** 扩展性好，操作方便

### 方案二：Extend Class 扩展

将第三方 jar 包复制到 `{Java_home}/jre/lib/ext` 目录下。Java 在调用时会自动搜索扩展类路径。

**缺点：** 自适应性差，不推荐使用

### 方案三：User Class 扩展（Manifest 方案）

利用 jar 包的 Manifest 扩展机制来解决依赖问题。

**步骤：**

1. **放置依赖 jar 包**
   ```
   将第三方 jar 包复制到可执行 jar 所在目录或子目录下
   例如：
   /usrhome/yourJarExe.jar
   /usrhome/lib/dependency1.jar
   /usrhome/lib/dependency2.jar
   ```

2. **修改 MANIFEST.MF 文件**
   ```
   Manifest-Version: 1.0
   Main-Class: com.example.MainClass
   Class-Path: lib/dependency1.jar lib/dependency2.jar lib/log4j-1.2.14.jar
   ```

**注意事项：**
- 冒号后面必须有一个空格
- 多个 jar 文件在同一行，用空格分隔
- Windows 下子目录使用 `\\` 分割，Linux 下用 `/` 分割
- 文件最后一行必须是回车换行符

## 实际运行示例

### 单独 jar 包运行
```bash
# 无依赖的简单运行
java -jar hello.jar
```

### 有依赖的 jar 包运行

**错误方式：**
```bash
# 这种方式会报 ClassNotFoundException
java -cp log4j-1.2.14.jar -jar hello.jar
```

**正确方式一：使用 -cp 参数**
```bash
# Windows
java -cp lib\log4j-1.2.14.jar;hello.jar com.dhn.Hello

# Linux
java -cp lib/log4j-1.2.14.jar:hello.jar com.dhn.Hello
```

**正确方式二：使用 Manifest**
```bash
# 修改 MANIFEST.MF 后直接运行
java -jar hello.jar
```

## 动态加载 jar 包方案

对于需要动态加载大量 jar 包的应用，可以在程序启动时通过代码动态加载：

```java
private static class JarLoader {
    private URLClassLoader urlClassLoader;
    
    public JarLoader(URLClassLoader urlClassLoader) {
        this.urlClassLoader = urlClassLoader;
    }
    
    public void loadJar(URL url) throws Exception {
        Method addURL = URLClassLoader.class.getDeclaredMethod("addURL", URL.class);
        addURL.setAccessible(true);
        addURL.invoke(urlClassLoader, url);
    }
}

public static void main(String[] args) {
    JarLoader jarLoader = new JarLoader((URLClassLoader)ClassLoader.getSystemClassLoader());
    // 动态加载指定目录下的所有jar包
    loadjar(jarLoader, System.getProperty("user.dir")+"/lib");
}
```

**优点：** 启动命令简洁，只需 `java -jar app.jar`

## 常见问题

### jar包运行中文乱码问题

解决方案

```bash
java -Dfile.encoding=utf-8 -jar xxxxxxx.jar
```

> Linux系统环境默认是utf-8，windows默认是GBK

