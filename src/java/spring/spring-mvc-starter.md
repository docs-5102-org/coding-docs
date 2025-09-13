---
title: Spring MVC 基础教程
category:
  - Web框架
tag:
  - Spring MVC
---

# Spring MVC 基础教程

## 目录
1. [什么是 Spring MVC](#什么是-spring-mvc)
2. [核心概念](#核心概念)
3. [环境搭建](#环境搭建)
4. [基本配置](#基本配置)
5. [控制器开发](#控制器开发)
6. [视图解析](#视图解析)
7. [数据绑定](#数据绑定)
8. [拦截器](#拦截器)
9. [异常处理](#异常处理)
10. [RESTful API](#restful-api)
11. [官方资源](#官方资源)
12. [第三方教程](#第三方教程)

## 什么是 Spring MVC

Spring MVC 是 Spring Framework 的一个模块，是基于 Java 的 Web 框架，采用了经典的 Model-View-Controller (MVC) 设计模式。它提供了构建灵活、松耦合的 Web 应用程序的强大功能。

### 主要特点
- **松耦合**：通过依赖注入实现组件间的松耦合
- **灵活性**：支持多种视图技术（JSP、Thymeleaf、JSON等）
- **可测试性**：易于进行单元测试和集成测试
- **注解驱动**：通过注解简化配置和开发

## 核心概念

### MVC 架构模式
- **Model（模型）**：负责数据处理和业务逻辑
- **View（视图）**：负责数据展示和用户界面
- **Controller（控制器）**：负责处理用户请求，协调模型和视图

### 核心组件
- **DispatcherServlet**：前端控制器，处理所有HTTP请求
- **HandlerMapping**：处理器映射器，将请求映射到处理器
- **HandlerAdapter**：处理器适配器，调用具体的处理器
- **ViewResolver**：视图解析器，解析逻辑视图名到具体视图

## 环境搭建

### Maven 依赖
```xml
<dependencies>
    <!-- Spring MVC -->
    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-webmvc</artifactId>
        <version>5.3.21</version>
    </dependency>
    
    <!-- Servlet API -->
    <dependency>
        <groupId>javax.servlet</groupId>
        <artifactId>javax.servlet-api</artifactId>
        <version>4.0.1</version>
        <scope>provided</scope>
    </dependency>
    
    <!-- JSP 支持 (可选) -->
    <dependency>
        <groupId>javax.servlet.jsp</groupId>
        <artifactId>jsp-api</artifactId>
        <version>2.2</version>
        <scope>provided</scope>
    </dependency>
    
    <!-- JSTL (可选) -->
    <dependency>
        <groupId>jstl</groupId>
        <artifactId>jstl</artifactId>
        <version>1.2</version>
    </dependency>
</dependencies>
```

## 基本配置

### web.xml 配置
```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://xmlns.jcp.org/xml/ns/javaee 
         http://xmlns.jcp.org/xml/ns/javaee/web-app_4_0.xsd"
         version="4.0">

    <!-- 配置 DispatcherServlet -->
    <servlet>
        <servlet-name>dispatcher</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>/WEB-INF/spring-mvc.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>dispatcher</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

</web-app>
```

### Spring MVC 配置文件 (spring-mvc.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xmlns:mvc="http://www.springframework.org/schema/mvc"
       xsi:schemaLocation="
        http://www.springframework.org/schema/beans
        http://www.springframework.org/schema/beans/spring-beans.xsd
        http://www.springframework.org/schema/context
        http://www.springframework.org/schema/context/spring-context.xsd
        http://www.springframework.org/schema/mvc
        http://www.springframework.org/schema/mvc/spring-mvc.xsd">

    <!-- 启用注解驱动 -->
    <mvc:annotation-driven />
    
    <!-- 扫描控制器包 -->
    <context:component-scan base-package="com.example.controller" />
    
    <!-- 视图解析器 -->
    <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
        <property name="prefix" value="/WEB-INF/views/" />
        <property name="suffix" value=".jsp" />
    </bean>
    
    <!-- 静态资源处理 -->
    <mvc:resources mapping="/static/**" location="/static/" />

</beans>
```

### Java 配置方式
```java
@Configuration
@EnableWebMvc
@ComponentScan(basePackages = "com.example.controller")
public class WebConfig implements WebMvcConfigurer {
    
    @Bean
    public ViewResolver viewResolver() {
        InternalResourceViewResolver resolver = new InternalResourceViewResolver();
        resolver.setPrefix("/WEB-INF/views/");
        resolver.setSuffix(".jsp");
        return resolver;
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**")
                .addResourceLocations("/static/");
    }
}
```

## 控制器开发

### 基本控制器
```java
@Controller
public class HomeController {
    
    @RequestMapping("/")
    public String home() {
        return "home"; // 返回视图名称
    }
    
    @RequestMapping("/hello")
    public ModelAndView hello() {
        ModelAndView mav = new ModelAndView();
        mav.setViewName("hello");
        mav.addObject("message", "Hello, Spring MVC!");
        return mav;
    }
}
```

### RESTful 控制器
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    public List<User> getAllUsers() {
        // 返回用户列表
        return userService.findAll();
    }
    
    @GetMapping("/{id}")
    public User getUser(@PathVariable Long id) {
        return userService.findById(id);
    }
    
    @PostMapping
    public User createUser(@RequestBody User user) {
        return userService.save(user);
    }
    
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User user) {
        return userService.update(id, user);
    }
    
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}
```

## 视图解析

### JSP 视图
```jsp
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html>
<head>
    <title>Hello Page</title>
</head>
<body>
    <h1>${message}</h1>
    <c:forEach var="item" items="${items}">
        <p>${item}</p>
    </c:forEach>
</body>
</html>
```

### Thymeleaf 配置
```java
@Bean
public ViewResolver thymeleafViewResolver() {
    ThymeleafViewResolver resolver = new ThymeleafViewResolver();
    resolver.setTemplateEngine(templateEngine());
    return resolver;
}

@Bean
public TemplateEngine templateEngine() {
    SpringTemplateEngine engine = new SpringTemplateEngine();
    engine.setTemplateResolver(templateResolver());
    return engine;
}
```

## 数据绑定

### 表单数据绑定
```java
@Controller
public class FormController {
    
    @GetMapping("/form")
    public String showForm(Model model) {
        model.addAttribute("user", new User());
        return "form";
    }
    
    @PostMapping("/form")
    public String processForm(@ModelAttribute User user, BindingResult result) {
        if (result.hasErrors()) {
            return "form";
        }
        // 处理用户数据
        userService.save(user);
        return "redirect:/success";
    }
}
```

### 参数绑定
```java
@Controller
public class ParamController {
    
    @GetMapping("/search")
    public String search(@RequestParam String keyword,
                        @RequestParam(defaultValue = "1") int page,
                        @RequestParam(required = false) String category,
                        Model model) {
        // 处理搜索逻辑
        return "search-results";
    }
}
```

## 拦截器

### 创建拦截器
```java
public class LoggingInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        System.out.println("请求处理前: " + request.getRequestURI());
        return true;
    }
    
    @Override
    public void postHandle(HttpServletRequest request, 
                          HttpServletResponse response, 
                          Object handler, 
                          ModelAndView modelAndView) throws Exception {
        System.out.println("请求处理后");
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                               HttpServletResponse response, 
                               Object handler, 
                               Exception ex) throws Exception {
        System.out.println("请求完成后");
    }
}
```

### 注册拦截器
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new LoggingInterceptor())
                .addPathPatterns("/**")
                .excludePathPatterns("/static/**");
    }
}
```

## 异常处理

### 全局异常处理
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ModelAndView handleException(Exception ex) {
        ModelAndView mav = new ModelAndView();
        mav.setViewName("error");
        mav.addObject("error", ex.getMessage());
        return mav;
    }
    
    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handleUserNotFound(UserNotFoundException ex, Model model) {
        model.addAttribute("error", "用户不存在");
        return "404";
    }
}
```

## RESTful API

### JSON 响应
```java
@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/data")
    public ResponseEntity<Map<String, Object>> getData() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("data", Arrays.asList("item1", "item2", "item3"));
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("文件不能为空");
        }
        // 文件处理逻辑
        return ResponseEntity.ok("文件上传成功");
    }
}
```

## 官方资源

### Spring 官方文档
- [Spring Framework 官网](https://spring.io/projects/spring-framework)
- [Spring MVC 官方文档](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html)
- [Spring MVC 参考指南](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc)
- [Spring Boot 官方文档](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Guides](https://spring.io/guides) - 包含多个 Spring MVC 入门指南

### API 文档
- [Spring Framework API 文档](https://docs.spring.io/spring-framework/docs/current/javadoc-api/)
- [Spring Web MVC Javadoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/package-summary.html)

## 第三方教程

### 中文教程
- [菜鸟教程 - Spring MVC](https://www.runoob.com/spring/spring-mvc-tutorial.html)
- [廖雪峰的官方网站 - Spring MVC](https://www.liaoxuefeng.com/wiki/1252599548343744/1304265903570978)
- [易百教程 - Spring MVC](https://www.yiibai.com/spring_mvc/)
- [Java知音 - Spring MVC 详解](https://www.javazhiyin.com/categories/spring/)

### 英文教程
- [Baeldung - Spring MVC Guides](https://www.baeldung.com/spring-mvc)
- [Spring MVC Tutorial - TutorialsPoint](https://www.tutorialspoint.com/spring/spring_web_mvc_framework.htm)
- [Mkyong - Spring MVC Tutorials](https://mkyong.com/tutorials/spring-mvc-tutorials/)
- [JavaTpoint - Spring MVC Tutorial](https://www.javatpoint.com/spring-mvc-tutorial)

### 视频教程
- [尚硅谷 Spring MVC 教程](https://www.bilibili.com/video/BV1Ry4y1574R/)
- [黑马程序员 Spring MVC](https://www.bilibili.com/video/BV1Fi4y1S7ix/)
- [动力节点 Spring MVC 框架](https://www.bilibili.com/video/BV1sk4y167pD/)

### 实战项目
- [Spring PetClinic](https://github.com/spring-projects/spring-petclinic) - Spring 官方示例项目
- [Spring MVC Showcase](https://github.com/spring-attic/spring-mvc-showcase) - Spring MVC 功能展示
- [Spring Boot Samples](https://github.com/spring-projects/spring-boot/tree/main/spring-boot-samples) - Spring Boot 示例

### 在线学习平台
- [慕课网 Spring MVC 课程](https://www.imooc.com/learn/47)
- [极客时间 Spring 全家桶](https://time.geekbang.org/course/intro/100023501)
- [腾讯课堂 Spring 相关课程](https://ke.qq.com/)

## 总结

Spring MVC 是一个功能强大、灵活的 Web 框架，通过本文档的学习，你应该能够：

- 理解 Spring MVC 的核心概念和架构
- 搭建基本的 Spring MVC 项目
- 开发控制器处理用户请求
- 配置视图解析和数据绑定
- 实现拦截器和异常处理
- 构建 RESTful API

继续深入学习建议关注 Spring Boot，它进一步简化了 Spring MVC 的配置和开发过程。结合实际项目练习，你将能够熟练掌握 Spring MVC 的使用。