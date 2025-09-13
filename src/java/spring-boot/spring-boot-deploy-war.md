---
title: 打包war部署到Tomcat
category:
  - Web框架
tag:
  - Spring Boot
---

# Spring Boot 打包war部署到Tomcat

## 概述

Spring Boot项目默认使用jar包形式运行，内置了Tomcat容器。但在某些情况下，我们需要将Spring Boot项目打包成war文件，部署到外部的Tomcat容器中。本文档将详细介绍如何将Spring Boot项目打包为war包并部署到不同版本的Tomcat容器中。

## 前提条件

- JDK版本必须与Tomcat环境和Eclipse编译版本保持一致
- Maven项目结构
- Spring Boot项目

## 通用配置步骤

### 第一步：修改打包形式

在项目的`pom.xml`文件中，将打包方式修改为war：

```xml
<packaging>war</packaging>
```

### 第二步：修改启动类

将原有的启动类继承`SpringBootServletInitializer`并重写`configure`方法：

```java
@SpringBootApplication
public class SpringbootMybatisApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        // 注意这里要指向原先用main方法执行的Application启动类
        return builder.sources(SpringbootMybatisApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(SpringbootMybatisApplication.class, args);
    }
}
```

## Tomcat 8 部署配置

### 适用环境
- Tomcat 8
- JDK 1.7 或 1.8
- JDK版本必须与Eclipse编译版本一致

### 配置步骤

1. **完成通用配置步骤**（修改打包形式和启动类）

2. **版本对应检查**
   - 确保项目所使用的Java版本与Tomcat环境中的JDK版本一致
   - 在Eclipse中可以通过以下方式检查和修改Java版本：
     - 项目属性 → Java Build Path → Libraries
     - 项目属性 → Project Facets

3. **打包部署**
   - 使用Maven命令打包：`mvn clean package`
   - 或者使用Eclipse自带的打包工具
   - 将生成的war包放到Tomcat8的`webapp`目录下

4. **访问应用**
   ```
   http://localhost:端口号/打包项目名/
   ```

## Tomcat 7 部署配置

### 适用环境
- Tomcat 7
- JDK 1.7 或 1.8
- JDK版本必须与Eclipse编译版本一致

### 配置步骤

1. **完成通用配置步骤**（修改打包形式和启动类）

2. **添加Servlet依赖**

在`pom.xml`中添加以下依赖：

```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>3.0.1</version>
    <scope>provided</scope>
</dependency>
```

**依赖说明**：
- Spring Boot内置Tomcat8支持servlet 3.1
- Tomcat7支持servlet 3.0
- `<scope>provided</scope>`表示运行时使用外部容器提供的servlet API

3. **打包部署**
   - 使用Maven命令打包：`mvn clean package`
   - 将生成的war包放到Tomcat7的`webapp`目录下

4. **访问应用**
   ```
   http://localhost:端口号/打包项目名/
   ```

## 重要注意事项

### 版本兼容性
- **JDK版本一致性**：项目编译的JDK版本必须与Tomcat运行环境的JDK版本一致
- **Servlet版本**：Tomcat7使用servlet 3.0，Tomcat8使用servlet 3.1

### 常见问题及解决方案

1. **版本不匹配问题**
   - 确保Eclipse编译版本、项目JDK版本、Tomcat JDK版本三者一致
   - 检查项目的Java Build Path和Project Facets设置

2. **依赖冲突问题**
   - 对于Tomcat7部署，必须添加servlet-api依赖并设置scope为provided
   - 避免将Spring Boot内置的Tomcat相关依赖打包到war中

3. **路径访问问题**
   - 部署后访问路径为：`http://localhost:端口号/war包名/`
   - 生产环境可以通过配置去掉项目名路径

## 打包命令

### Maven命令
```bash
# 清理并打包
mvn clean package

# 跳过测试打包
mvn clean package -Dmaven.test.skip=true
```

### 打包文件位置
打包完成后，war文件位于项目的`target`目录下。

## 部署验证

1. 将war包复制到Tomcat的`webapps`目录
2. 启动Tomcat服务器
3. 观察Tomcat日志，确保应用正常启动
4. 通过浏览器访问应用验证功能

## 总结

通过以上步骤，可以成功将Spring Boot项目部署到外部Tomcat容器中。关键点在于：
- 修改打包方式为war
- 继承SpringBootServletInitializer
- 注意版本兼容性
- 针对Tomcat7需要额外添加servlet依赖

选择合适的部署方式取决于具体的项目需求和生产环境配置。