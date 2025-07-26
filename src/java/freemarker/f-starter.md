---
title: FreeMarker 快速入门指南
category:
  - java
  - 模版引擎
tag:
  - FreeMarker
---

# FreeMarker 快速入门指南

## 简介

FreeMarker 是一个用 Java 语言编写的模板引擎，它基于模板文件生成其他文本的通用工具。虽然 FreeMarker 不是 Web 应用框架，但它非常适合作为 Web 应用框架的组件使用。

### 主要特点

- **轻量级**: 无需 Servlet 环境就可以轻松嵌入到应用程序中
- **多格式支持**: 能生成各种文本格式，如 HTML、XML、Java 等
- **易于上手**: 语法与 Java 相似，学习成本低
- **功能强大**: 提供丰富的内建函数和指令

### 工作原理

```
数据模型 + 模板 = 输出
```

## 第一个 FreeMarker 程序

通过创建一个简单的代码自动生成工具来体验 FreeMarker。

### 项目结构

```
FreeMarkerStudy/
├── src/main/java/com/freemark/hello/
│   ├── templates/
│   │   └── hello.ftl
│   └── FreeMarkerDemo.java
└── pom.xml
```

### 1. Maven 配置

创建 `pom.xml` 文件：

```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.freemark</groupId>
    <artifactId>FreeMarkerStudy</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>war</packaging>

    <dependencies>
        <dependency>
            <groupId>org.FreeMarker</groupId>
            <artifactId>FreeMarker</artifactId>
            <version>2.3.32</version>
        </dependency>
    </dependencies>
</project>
```

### 2. 创建模板文件

在 `templates` 目录下创建 `hello.ftl` 文件：

```java
package ${classPath};

public class ${className} {
    
    public static void main(String[] args) {
        System.out.println("${helloWorld}");
    }
}
```

**语法说明**: `${xxx}` 是 FreeMarker 的基本语法，相当于占位符，Java 后台给变量赋值后通过 `${}` 输出。

### 3. Java 核心代码

创建 `FreeMarkerDemo.java` 文件：

```java
package com.freemark.hello;

import java.io.*;
import java.util.HashMap;
import java.util.Map;
import FreeMarker.template.Configuration;
import FreeMarker.template.Template;
import FreeMarker.template.Version;

public class FreeMarkerDemo {
    
    private static final String TEMPLATE_PATH = "src/main/java/com/freemark/hello/templates";
    private static final String CLASS_PATH = "src/main/java/com/freemark/hello";
    
    public static void main(String[] args) {
        // Step 1: 创建 FreeMarker 配置实例
        Configuration configuration = new Configuration(new Version("2.3.32"));
        Writer out = null;
        
        try {
            // Step 2: 设置模板路径
            configuration.setDirectoryForTemplateLoading(new File(TEMPLATE_PATH));
            
            // Step 3: 创建数据模型
            Map<String, Object> dataMap = new HashMap<>();
            dataMap.put("classPath", "com.freemark.hello");
            dataMap.put("className", "AutoCodeDemo");
            dataMap.put("helloWorld", "通过简单的代码自动生成程序演示 FreeMarker!");
            
            // Step 4: 加载模板文件
            Template template = configuration.getTemplate("hello.ftl");
            
            // Step 5: 生成输出文件
            File docFile = new File(CLASS_PATH, "AutoCodeDemo.java");
            out = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(docFile)));
            
            // Step 6: 处理模板并输出
            template.process(dataMap, out);
            System.out.println("AutoCodeDemo.java 文件创建成功!");
            
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (out != null) {
                    out.flush();
                    out.close();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
```

运行程序后，项目中会自动生成 `AutoCodeDemo.java` 文件。

## FreeMarker 语法详解

### 数据类型

FreeMarker 无需定义变量类型，直接赋值即可：

```
<#-- 字符串 -->
<#assign name = "FreeMarker">
<#assign specialStr = r"特殊字符(http:\www.example.com)">

<#-- 数值 -->
<#assign number = 42>
<#assign price = 19.99>

<#-- 布尔值 -->
<#assign isActive = true>

<#-- List 集合 -->
<#assign colors = ["red", "green", "blue"]>
<#assign numbers = [1..10]>

<#-- Map 集合 -->
<#assign user = {"name": "张三", "age": 25}>
```

### 字符串操作

```
<#-- 字符串输出 -->
${"Hello ${name}!"} 
${"Hello " + name + "!"}

<#-- 字符串截取 -->
${name[0]}          <!-- 获取第一个字符 -->
${name[0..2]}       <!-- 截取前三个字符 -->
```

### 算术运算

```
<#assign a = 10>
<#assign b = 3>

加法: ${a + b}      <!-- 13 -->
减法: ${a - b}      <!-- 7 -->
乘法: ${a * b}      <!-- 30 -->
除法: ${a / b}      <!-- 3.333... -->
取模: ${a % b}      <!-- 1 -->
```

### 比较运算符

```
<#if a gt b>        <!-- 大于 -->
    a 大于 b
<#elseif a lt b>    <!-- 小于 -->
    a 小于 b
<#else>
    a 等于 b
</#if>
```

**比较运算符列表**:
- `==` (等于), `!=` (不等于)
- `gt` (大于), `gte` (大于等于)
- `lt` (小于), `lte` (小于等于)

### 内建函数

```
<#assign text = "hello world">
<#assign number = 12.34>

首字母大写: ${text?cap_first}        <!-- Hello world -->
全部小写:   ${text?lower_case}        <!-- hello world -->
全部大写:   ${text?upper_case}        <!-- HELLO WORLD -->
取整:      ${number?int}              <!-- 12 -->
集合长度:   ${colors?size}            <!-- 3 -->

<#-- 时间格式化 -->
<#assign now = .now>
${now?string("yyyy-MM-dd HH:mm:ss")}
```

### 空值判断

```
<#-- 使用默认值 -->
${user.email!"暂无邮箱"}

<#-- 判断变量是否存在 -->
<#if user.email??>
    邮箱: ${user.email}
<#else>
    用户未设置邮箱
</#if>
```

### 集合操作

#### List 遍历

```
<#assign fruits = ["苹果", "香蕉", "橙子"]>

<#list fruits as fruit>
    ${fruit_index + 1}. ${fruit}
    <#sep>, </#sep>  <!-- 分隔符，最后一项不显示 -->
</#list>
```

#### Map 遍历

```
<#assign person = {"name": "李四", "age": 30, "city": "北京"}>

<#-- 遍历键值对 -->
<#list person?keys as key>
    ${key}: ${person[key]}
</#list>

<#-- 直接访问 -->
姓名: ${person.name}
年龄: ${person["age"]}
```

### 条件判断

```
<#assign score = 85>

<#if score gte 90>
    优秀
<#elseif score gte 80>
    良好
<#elseif score gte 70>
    及格
<#else>
    不及格
</#if>
```

### 宏指令 (Macro)

宏指令类似于函数，可以封装重复使用的代码：

```
<#-- 定义无参数宏 -->
<#macro greet>
    <p>欢迎访问我们的网站！</p>
</#macro>

<#-- 使用宏 -->
<@greet />

<#-- 定义带参数宏 -->
<#macro showUser name age>
    <div>
        <h3>${name}</h3>
        <p>年龄: ${age}</p>
    </div>
</#macro>

<#-- 使用带参数的宏 -->
<@showUser name="张三" age=25 />
```

### Include 指令

引入其他模板文件：

```
<#include "header.ftl" />
<#include "footer.ftl" />
```

### 命名空间

避免变量名冲突，类似 Java 的 import：

```
<#import "utils.ftl" as util>

${util.formatDate(.now)}
<@util.showMessage message="Hello" />
```

## Web 项目集成

### Spring MVC 集成

#### 1. Maven 依赖

```xml
<dependencies>
    <!-- FreeMarker -->
    <dependency>
        <groupId>org.FreeMarker</groupId>
        <artifactId>FreeMarker</artifactId>
        <version>2.3.32</version>
    </dependency>
    
    <!-- Spring Context Support -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context-support</artifactId>
        <version>5.3.21</version>
    </dependency>
</dependencies>
```

#### 2. Spring MVC 配置

```xml
<!-- 配置 FreeMarker -->
<bean id="FreeMarkerConfig" 
      class="org.springframework.web.servlet.view.FreeMarker.FreeMarkerConfigurer">
    <property name="templateLoaderPath" value="/WEB-INF/views/templates"/>
    <property name="FreeMarkerSettings">
        <props>
            <prop key="default_encoding">UTF-8</prop>
            <prop key="locale">zh_CN</prop>
        </props>
    </property>
</bean>

<bean id="viewResolver" 
      class="org.springframework.web.servlet.view.FreeMarker.FreeMarkerViewResolver">
    <property name="prefix" value=""/>
    <property name="suffix" value=".ftl"/>
    <property name="contentType" value="text/html; charset=UTF-8"/>
    <property name="requestContextAttribute" value="request"/>
</bean>
```

#### 3. Controller 示例

```java
@Controller
public class HelloController {
    
    @RequestMapping("/hello")
    public String hello(Model model) {
        model.addAttribute("message", "Hello FreeMarker!");
        model.addAttribute("user", new User("张三", 25));
        return "hello";  // 对应 hello.ftl
    }
}
```

#### 4. FreeMarker 模板

创建 `hello.ftl` 文件：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>FreeMarker Web Demo</title>
</head>
<body>
    <h1>${message}</h1>
    <p>用户姓名: ${user.name}</p>
    <p>用户年龄: ${user.age}</p>
    
    <#-- 当前时间 -->
    <p>当前时间: ${.now?string("yyyy-MM-dd HH:mm:ss")}</p>
</body>
</html>
```

## 最佳实践

### 1. 配置建议

```java
Configuration cfg = new Configuration(Configuration.VERSION_2_3_32);
cfg.setDefaultEncoding("UTF-8");
cfg.setLocale(Locale.CHINA);
cfg.setTemplateExceptionHandler(TemplateExceptionHandler.RETHROW_HANDLER);
cfg.setLogTemplateExceptions(false);
```

### 2. 性能优化

- 复用 `Configuration` 实例
- 缓存 `Template` 对象
- 合理使用宏和包含指令
- 避免在模板中进行复杂计算

### 3. 安全考虑

- 对用户输入进行 HTML 转义: `${value?html}`
- 使用白名单验证模板路径
- 限制模板访问权限

## 常见问题

### 1. 中文乱码
设置正确的编码: `cfg.setDefaultEncoding("UTF-8")`

### 2. 模板找不到
检查模板路径配置和文件名是否正确

### 3. 变量未定义错误
使用 `!` 提供默认值或 `??` 进行判断

## 官方资源

- **官方网站**: [https://freemarker.apache.org/](https://freemarker.apache.org/)
- **官方文档**: [https://freemarker.apache.org/docs/](https://freemarker.apache.org/docs/)
- **API 参考**: [https://freemarker.apache.org/docs/api/](https://freemarker.apache.org/docs/api/)
- **GitHub 仓库**: [https://github.com/apache/freemarker](https://github.com/apache/freemarker)
- **中文手册**: [http://freemarker.foofun.cn/](http://freemarker.foofun.cn/)
- **第三方**：[http://www.sojson.com/tag_freemarker.html](http://www.sojson.com/tag_freemarker.html)

## 总结

FreeMarker 是一个功能强大且易于使用的模板引擎，特别适合：

- 代码生成工具
- Web 页面渲染  
- 邮件模板
- 报告生成
- 配置文件生成

通过掌握基本语法和最佳实践，可以大大提高开发效率，实现模板与逻辑的完美分离。