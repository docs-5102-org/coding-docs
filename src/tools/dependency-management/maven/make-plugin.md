---
title: Maven 插件制作完整指南
category:
  - Maven
---

# Maven 插件制作完整指南

## 目录

[[toc]]

## 概述

Maven 插件是 Maven 构建系统的核心组件，允许开发者扩展 Maven 的功能。本指南将详细介绍如何从零开始创建一个简单的 Maven 插件。

## 前提条件

- Java 开发环境
- Maven 构建工具
- IDE（推荐使用 IntelliJ IDEA）

## 创建插件项目

### 1. 项目初始化

首先创建一个新的 Maven 项目。推荐使用 IntelliJ IDEA 创建项目，它会自动配置插件相关设置。

<img :src="$withBase('/assets/images/maven/m1.png')" 
  alt="图片"
  width="800px" 
  height="auto">

### 2. 配置 POM 文件

#### 现代版本配置（推荐）

```xml
<project>
    <!-- 项目基本信息 -->
    <groupId>com.example</groupId>
    <artifactId>my-maven-plugin</artifactId>
    <version>1.0.0</version>
    <packaging>maven-plugin</packaging>

    <!-- 项目依赖 -->
    <dependencies>
        <dependency>
            <groupId>org.apache.maven</groupId>
            <artifactId>maven-plugin-api</artifactId>
            <version>3.9.5</version>
        </dependency>
        <dependency>
            <groupId>org.apache.maven.plugin-tools</groupId>
            <artifactId>maven-plugin-annotations</artifactId>
            <version>3.2</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <!-- 插件配置 -->
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-plugin-plugin</artifactId>
                <version>3.10.2</version>
                <configuration>
                    <skipErrorNoDescriptorsFound>true</skipErrorNoDescriptorsFound>
                </configuration>
                <executions>
                    <execution>
                        <id>mojo-descriptor</id>
                        <goals>
                            <goal>descriptor</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

#### 兼容老版本配置

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>my-maven-plugin</artifactId>
    <packaging>maven-plugin</packaging>
    <version>1.0.0</version>
    <name>My Maven Plugin</name>
    <url>http://maven.apache.org</url>

    <dependencies>
        <!-- 老版本依赖方式 -->
        <dependency>
            <groupId>org.apache.maven</groupId>
            <artifactId>maven-plugin-api</artifactId>
            <version>2.0</version>
        </dependency>
        <dependency>
            <groupId>org.apache.maven.plugin-tools</groupId>
            <artifactId>maven-plugin-annotations</artifactId>
            <version>3.2</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>3.8.1</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-plugin-plugin</artifactId>
                <version>3.2</version>
                <configuration>
                    <skipErrorNoDescriptorsFound>true</skipErrorNoDescriptorsFound>
                </configuration>
                <executions>
                    <execution>
                        <id>mojo-descriptor</id>
                        <goals>
                            <goal>descriptor</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

## 创建 Mojo 类

### 什么是 Mojo？

Mojo（Maven Old Java Object）代表一个 Maven 插件的目标（goal）。每个 Mojo 类定义了插件的具体行为。

### 基础 Mojo 实现

```java
package com.example;

import org.apache.maven.plugin.AbstractMojo;
import org.apache.maven.plugin.MojoExecutionException;
import org.apache.maven.plugins.annotations.LifecyclePhase;
import org.apache.maven.plugins.annotations.Mojo;
import org.apache.maven.plugins.annotations.Parameter;

import java.util.List;

@Mojo(name = "my-goal", defaultPhase = LifecyclePhase.PACKAGE)
public class MyMojo extends AbstractMojo {
    
    @Parameter(property = "message", defaultValue = "Hello, World!")
    private String message;

    @Parameter(property = "names")
    private List<String> names;

    @Override
    public void execute() throws MojoExecutionException {
        getLog().info(message);
        if (names != null) {
            for (String name : names) {
                getLog().info("Name: " + name);
            }
        }
    }
}
```

### 注解说明

- `@Mojo`: 标识这是一个 Maven 插件目标
  - `name`: 目标名称
  - `defaultPhase`: 默认绑定的生命周期阶段
- `@Parameter`: 定义插件参数
  - `property`: 属性名称
  - `defaultValue`: 默认值

## 构建和安装插件

在项目根目录执行以下命令：

```bash
mvn clean install
```

此命令将：
1. 编译插件代码
2. 打包插件
3. 安装到本地 Maven 仓库

## 使用插件

### 在其他项目中配置插件

```xml
<project>
    <!-- 项目其他配置 -->
    <build>
        <plugins>
            <plugin>
                <groupId>com.example</groupId>
                <artifactId>my-maven-plugin</artifactId>
                <version>1.0.0</version>
                <configuration>
                    <message>Hello from my plugin!</message>
                    <names>
                        <name>Alice</name>
                        <name>Bob</name>
                        <name>Charlie</name>
                    </names>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>my-goal</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### 命令行执行

```bash
# 完整命令格式
mvn com.example:my-maven-plugin:1.0.0:my-goal
```

<img :src="$withBase('/assets/images/maven/m2.png')" 
  alt="图片"
  width="800px" 
  height="auto">

## 简化命令行调用

### 配置 goalPrefix

为了简化命令行调用，可以配置 `goalPrefix`：

#### 修改 Mojo 类

```java
@Mojo(name = "my-goal", defaultPhase = LifecyclePhase.PACKAGE)
public class MyMojo extends AbstractMojo {

    @Parameter(property = "goalPrefix", defaultValue = "my-prefix")
    private String goalPrefix;

    @Parameter(property = "message", defaultValue = "Hello, World!")
    private String message;

    @Parameter(property = "names")
    private List<String> names;

    @Override
    public void execute() throws MojoExecutionException {
        getLog().info(message);
        if (names != null) {
            for (String name : names) {
                getLog().info("Name: " + name);
            }
        }
    }
}
```

#### 修改插件 POM 配置

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-plugin-plugin</artifactId>
    <version>3.10.2</version>
    <configuration>
        <skipErrorNoDescriptorsFound>true</skipErrorNoDescriptorsFound>
        <goalPrefix>my-prefix</goalPrefix>
    </configuration>
    <executions>
        <execution>
            <id>mojo-descriptor</id>
            <goals>
                <goal>descriptor</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

### 简化后的命令行调用

重新打包插件后，可以使用简化的命令：

```bash
mvn my-prefix:my-goal
```

## IDE 运行配置

### IntelliJ IDEA 配置

1. 打开 Run/Debug Configurations
2. 创建新的 Maven 配置
3. 在 Command line 中输入：`my-prefix:my-goal`
4. 设置 Working directory 为项目根目录


<img :src="$withBase('/assets/images/maven/m3.png')" 
  alt="图片"
  width="800px" 
  height="auto">

## 最佳实践

### 1. 参数验证

```java
@Override
public void execute() throws MojoExecutionException {
    if (message == null || message.trim().isEmpty()) {
        throw new MojoExecutionException("Message parameter is required");
    }
    // 执行逻辑
}
```

### 2. 日志记录

```java
getLog().debug("Debug message");
getLog().info("Info message");
getLog().warn("Warning message");
getLog().error("Error message");
```

### 3. 文件操作

```java
@Parameter(defaultValue = "${project.build.directory}")
private File outputDirectory;

@Parameter(defaultValue = "${project}")
private MavenProject project;
```

## 常见问题

### 1. 插件无法找到
确保插件已正确安装到本地仓库：
```bash
mvn clean install
```

### 2. 参数配置无效
检查 `@Parameter` 注解的 `property` 属性是否与配置文件中的参数名称一致。

### 3. 生命周期绑定问题
确保 `defaultPhase` 设置正确，或在使用时明确指定执行阶段。

## 参考资料

https://blog.csdn.net/tuoni123/article/details/79866620

## 总结

通过以上步骤，你已经学会了如何创建一个基本的 Maven 插件。这个插件可以：

1. 接收配置参数
2. 在指定的生命周期阶段执行
3. 输出日志信息
4. 通过简化的命令行调用

进一步的功能扩展可以包括文件处理、网络请求、代码生成等更复杂的操作。