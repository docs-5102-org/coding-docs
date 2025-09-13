---
title: web.xml配置详解
category:
  - Web框架
tag:
  - Spring MVC
---

# Spring MVC web.xml配置详解

## 概述

Spring MVC是基于Spring Framework的Web MVC框架，它以DispatcherServlet作为核心，采用前端控制器模式来处理HTTP请求。作为主流的Web开发框架之一，Spring MVC提供了灵活的配置方式和强大的功能特性。要熟练掌握Spring MVC，首先需要理解其在web.xml中的配置原理和最佳实践。

## Spring MVC工作原理

Spring MVC是一个基于DispatcherServlet的MVC框架。每个HTTP请求都会首先访问DispatcherServlet，由它负责：

1. **请求分发**：将请求转发给相应的Handler（控制器）
2. **处理协调**：协调Handler处理请求
3. **视图解析**：处理返回的视图（View）和模型（Model）
4. **响应返回**：将处理结果返回给客户端

DispatcherServlet继承自HttpServlet，因此需要在web.xml中进行声明和配置。

## 核心配置详解

### 1. DispatcherServlet配置

```xml
<!-- Spring MVC核心配置 -->
<servlet>
    <servlet-name>spring</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    
    <!-- 可选：自定义配置文件位置 -->
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>/WEB-INF/spring-servlet.xml</param-value>
    </init-param>
    
    <!-- 启动优先级：1表示容器启动时立即加载 -->
    <load-on-startup>1</load-on-startup>
</servlet>

<!-- URL映射配置 -->
<servlet-mapping>
    <servlet-name>spring</servlet-name>
    <url-pattern>*.do</url-pattern>
</servlet-mapping>
```

**配置说明：**

- `servlet-name`：Servlet名称，用于标识和映射
- `servlet-class`：Spring MVC的核心Servlet类
- `contextConfigLocation`：指定Spring MVC配置文件位置（可选）
  - 默认位置：`/WEB-INF/[servlet-name]-servlet.xml`
  - 如：`/WEB-INF/spring-servlet.xml`
- `load-on-startup`：设置为1确保容器启动时立即初始化
- `url-pattern`：定义URL映射模式，如`*.do`、`/`等

### 2. Spring容器配置

```xml
<!-- Spring应用上下文监听器 -->
<listener>
    <listener-class>
        org.springframework.web.context.ContextLoaderListener
    </listener-class>
</listener>

<!-- Spring Bean配置文件位置 -->
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>classpath:config/applicationContext.xml</param-value>
</context-param>
```

**配置说明：**

- `ContextLoaderListener`：负责启动和关闭Spring的根WebApplicationContext
- `contextConfigLocation`：指定Spring主配置文件位置
  - 支持多个配置文件，用逗号分隔
  - 支持classpath和文件系统路径
  - 默认位置：`/WEB-INF/applicationContext.xml`

## 完整配置示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app version="2.5" 
         xmlns="http://java.sun.com/xml/ns/javaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://java.sun.com/xml/ns/javaee 
         http://java.sun.com/xml/ns/javaee/web-app_2_5.xsd">

    <display-name>Spring MVC Application</display-name>

    <!-- Spring容器配置 -->
    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath:config/applicationContext.xml</param-value>
    </context-param>

    <listener>
        <listener-class>
            org.springframework.web.context.ContextLoaderListener
        </listener-class>
    </listener>

    <!-- Spring MVC DispatcherServlet配置 -->
    <servlet>
        <servlet-name>springMVC</servlet-name>
        <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
        <init-param>
            <param-name>contextConfigLocation</param-name>
            <param-value>/WEB-INF/spring-servlet.xml</param-value>
        </init-param>
        <load-on-startup>1</load-on-startup>
    </servlet>

    <servlet-mapping>
        <servlet-name>springMVC</servlet-name>
        <url-pattern>/</url-pattern>
    </servlet-mapping>

    <!-- 编码过滤器 -->
    <filter>
        <filter-name>encodingFilter</filter-name>
        <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
        <init-param>
            <param-name>encoding</param-name>
            <param-value>UTF-8</param-value>
        </init-param>
        <init-param>
            <param-name>forceEncoding</param-name>
            <param-value>true</param-value>
        </init-param>
    </filter>
    
    <filter-mapping>
        <filter-name>encodingFilter</filter-name>
        <url-pattern>/*</url-pattern>
    </filter-mapping>

</web-app>
```

## 常用URL映射模式

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `*.do` | 匹配所有.do后缀请求 | 传统Action风格 |
| `*.action` | 匹配所有.action后缀请求 | Struts风格迁移 |
| `/` | 匹配所有请求（除JSP） | RESTful风格 |
| `/*` | 匹配所有请求（包括JSP） | 不推荐使用 |

## 最佳实践建议

1. **配置文件分离**：将Spring MVC配置和业务逻辑配置分开
2. **合理的URL模式**：根据项目需求选择合适的URL映射模式
3. **编码过滤器**：添加字符编码过滤器避免中文乱码
4. **启动优先级**：设置`load-on-startup`确保及时初始化
5. **异常处理**：配置全局异常处理器
6. **静态资源**：合理处理CSS、JS等静态资源访问

## 环境要求

- **JDK版本**：1.5及以上
- **Servlet容器**：Tomcat 6.0+、Jetty等
- **Spring版本**：2.5.6及以上
- **必需JAR包**：
  - spring-webmvc.jar
  - spring-context.jar
  - spring-core.jar
  - commons-logging.jar

## 相关链接

- **Spring官方网站**：https://spring.io/
- **Spring Framework文档**：https://docs.spring.io/spring-framework/docs/current/reference/html/
- **Spring MVC官方指南**：https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc
- **Spring Boot官方文档**：https://spring.io/projects/spring-boot

通过以上配置，您就可以成功搭建一个基本的Spring MVC应用环境。记住，配置只是基础，关键在于理解其背后的工作原理，这样才能在实际开发中灵活运用并解决各种问题。