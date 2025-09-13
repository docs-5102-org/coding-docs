---
title: 响应请求跳转JSP页面
category:
  - Web框架
tag:
  - Spring Boot
---

# SpringBoot 响应请求跳转JSP页面

## 目录

[[toc]]

## 概述

SpringBoot 默认推荐使用 Thymeleaf 作为模板引擎，但在某些项目中仍需要使用 JSP 页面。本文档详细介绍如何在 SpringBoot 项目中配置并使用 JSP 页面进行页面跳转。

## 1. 项目依赖配置

### 1.1 Maven 依赖

在 `pom.xml` 中添加必要的依赖：

```xml
<dependencies>
    <!-- Spring Boot Web Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- JSP 支持 -->
    <dependency>
        <groupId>org.apache.tomcat.embed</groupId>
        <artifactId>tomcat-embed-jasper</artifactId>
        <scope>provided</scope>
    </dependency>
    
    <!-- JSTL 标签库 -->
    <dependency>
        <groupId>javax.servlet</groupId>
        <artifactId>jstl</artifactId>
    </dependency>
</dependencies>
```

### 1.2 Gradle 依赖

如果使用 Gradle，在 `build.gradle` 中添加：

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    providedRuntime 'org.apache.tomcat.embed:tomcat-embed-jasper'
    implementation 'javax.servlet:jstl'
}
```

## 2. 应用配置

### 2.1 application.properties 配置

在 `src/main/resources/application.properties` 中配置视图解析器：

```properties
# JSP 视图解析器配置
spring.mvc.view.prefix=/WEB-INF/views/
spring.mvc.view.suffix=.jsp

# 服务器配置
server.port=8080

# 开发模式下禁用缓存
spring.mvc.view.cache=false
```

### 2.2 application.yml 配置

或者使用 YAML 格式：

```yaml
spring:
  mvc:
    view:
      prefix: /WEB-INF/views/
      suffix: .jsp
      cache: false

server:
  port: 8080
```

## 3. 项目目录结构

创建标准的 JSP 目录结构：

```
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── example/
│   │           ├── Application.java
│   │           └── controller/
│   │               └── HomeController.java
│   ├── resources/
│   │   └── application.properties
│   └── webapp/
│       └── WEB-INF/
│           └── views/
│               ├── index.jsp
│               ├── user/
│               │   ├── list.jsp
│               │   └── detail.jsp
│               └── error/
│                   └── 404.jsp
```

## 4. 控制器实现

### 4.1 基础控制器

```java
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/")
public class HomeController {

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("message", "欢迎使用 SpringBoot JSP!");
        model.addAttribute("title", "首页");
        return "index";
    }

    @GetMapping("/home")
    public String home() {
        return "index";
    }

    @GetMapping("/about")
    public String about(Model model) {
        model.addAttribute("title", "关于我们");
        model.addAttribute("description", "这是关于页面");
        return "about";
    }
}
```

### 4.2 用户管理控制器

```java
package com.example.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@Controller
@RequestMapping("/user")
public class UserController {

    @GetMapping("/list")
    public String userList(Model model) {
        List<User> users = getUserList();
        model.addAttribute("users", users);
        model.addAttribute("title", "用户列表");
        return "user/list";
    }

    @GetMapping("/detail/{id}")
    public String userDetail(@PathVariable Long id, Model model) {
        User user = getUserById(id);
        model.addAttribute("user", user);
        model.addAttribute("title", "用户详情");
        return "user/detail";
    }

    @GetMapping("/add")
    public String addUserForm(Model model) {
        model.addAttribute("title", "添加用户");
        return "user/add";
    }

    @PostMapping("/save")
    public String saveUser(@RequestParam String name, 
                          @RequestParam String email, 
                          Model model) {
        // 保存用户逻辑
        model.addAttribute("message", "用户保存成功!");
        return "redirect:/user/list";
    }

    // 模拟数据方法
    private List<User> getUserList() {
        List<User> users = new ArrayList<>();
        users.add(new User(1L, "张三", "zhangsan@example.com"));
        users.add(new User(2L, "李四", "lisi@example.com"));
        return users;
    }

    private User getUserById(Long id) {
        return new User(id, "用户" + id, "user" + id + "@example.com");
    }

    // 简单的用户实体类
    public static class User {
        private Long id;
        private String name;
        private String email;

        public User(Long id, String name, String email) {
            this.id = id;
            this.name = name;
            this.email = email;
        }

        // getter 和 setter 方法
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }
}
```

## 5. JSP 页面实现

### 5.1 主页面 (index.jsp)

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
        .nav { margin: 20px 0; }
        .nav a { margin-right: 15px; text-decoration: none; color: #007bff; }
        .nav a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>${message}</p>
    </div>
    
    <div class="nav">
        <a href="/">首页</a>
        <a href="/about">关于</a>
        <a href="/user/list">用户列表</a>
        <a href="/user/add">添加用户</a>
    </div>
    
    <div class="content">
        <h2>SpringBoot JSP 示例</h2>
        <p>当前时间: <%= new java.util.Date() %></p>
        
        <c:if test="${not empty message}">
            <div style="color: green; font-weight: bold;">
                ${message}
            </div>
        </c:if>
    </div>
</body>
</html>
```

### 5.2 用户列表页面 (user/list.jsp)

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .btn { padding: 5px 10px; text-decoration: none; color: white; background-color: #007bff; border-radius: 3px; }
        .btn:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div>
        <a href="/" class="btn">返回首页</a>
        <a href="/user/add" class="btn" style="background-color: #28a745;">添加用户</a>
    </div>
    
    <br>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>姓名</th>
                <th>邮箱</th>
                <th>操作</th>
            </tr>
        </thead>
        <tbody>
            <c:forEach var="user" items="${users}">
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>
                        <a href="/user/detail/${user.id}" class="btn" style="background-color: #17a2b8;">查看</a>
                    </td>
                </tr>
            </c:forEach>
        </tbody>
    </table>
    
    <c:if test="${empty users}">
        <p>暂无用户数据</p>
    </c:if>
</body>
</html>
```

### 5.3 用户详情页面 (user/detail.jsp)

```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .user-info { background-color: #f8f9fa; padding: 20px; border-radius: 5px; }
        .btn { padding: 10px 15px; text-decoration: none; color: white; background-color: #007bff; border-radius: 3px; margin-right: 10px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    
    <div class="user-info">
        <h2>用户信息</h2>
        <p><strong>ID:</strong> ${user.id}</p>
        <p><strong>姓名:</strong> ${user.name}</p>
        <p><strong>邮箱:</strong> ${user.email}</p>
    </div>
    
    <br>
    
    <div>
        <a href="/user/list" class="btn">返回列表</a>
        <a href="/" class="btn">返回首页</a>
    </div>
</body>
</html>
```

## 6. 启动类配置

```java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(Application.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 7. 常见问题与解决方案

### 7.1 404 错误

**问题**: 访问页面返回 404 错误

**解决方案**:
- 检查 JSP 文件路径是否正确
- 确认 `webapp/WEB-INF/views/` 目录结构
- 验证 `application.properties` 中的视图前缀和后缀配置

### 7.2 JSP 页面无法加载

**问题**: JSP 页面显示源码或无法解析

**解决方案**:
- 确保添加了 `tomcat-embed-jasper` 依赖
- 检查 JSP 文件的字符编码设置
- 确认 Controller 返回的是视图名称而非 JSON

### 7.3 JSTL 标签不生效

**问题**: JSP 页面中 JSTL 标签无法正常使用

**解决方案**:
- 添加 JSTL 依赖
- 在 JSP 页面顶部添加正确的 taglib 声明
- 检查 JSTL 语法是否正确

## 8. 最佳实践

### 8.1 目录结构规范
- 将 JSP 文件放在 `WEB-INF/views/` 目录下
- 按功能模块创建子目录
- 统一命名规范

### 8.2 性能优化
- 在生产环境中启用 JSP 缓存
- 合理使用 EL 表达式和 JSTL 标签
- 避免在 JSP 中编写复杂的 Java 代码

### 8.3 安全考虑
- 对用户输入进行适当的转义
- 使用 JSTL 的 `<c:out>` 标签输出动态内容
- 验证和过滤用户提交的数据

## 9. 测试访问

启动应用后，可以通过以下 URL 进行测试：

- 首页: `http://localhost:8080/`
- 关于页面: `http://localhost:8080/about`
- 用户列表: `http://localhost:8080/user/list`
- 用户详情: `http://localhost:8080/user/detail/1`
- 添加用户: `http://localhost:8080/user/add`

## 10. 总结

通过本文档的指导，您可以成功在 SpringBoot 项目中配置和使用 JSP 页面。虽然 SpringBoot 推荐使用 Thymeleaf，但在需要兼容传统 JSP 项目或特定需求时，这种配置方式仍然是有效的解决方案。

关键点包括：正确添加依赖、配置视图解析器、创建规范的目录结构、以及编写合适的控制器和 JSP 页面。遵循最佳实践可以确保项目的可维护性和性能。