---
title: Spring 加载XML方式汇总
category:
  - Web框架
tag:
  - ClassPathXmlApplicationContext
  - XmlBeanFactory
  - FileSystemXmlApplicationContext
  - XmlWebApplicationContext
---

# Spring 加载XML方式汇总

## 概述

Spring框架提供了多种方式来加载XML配置文件，以实现IoC容器的初始化和Bean的装配。本文将详细介绍各种加载方式的使用方法、适用场景和注意事项。

## 一、Spring容器类型简介

Spring主要提供以下几种支持XML配置的容器：

- **XmlBeanFactory** - 基础的Bean工厂（已过时，不推荐使用）
- **ClassPathXmlApplicationContext** - 基于类路径的应用上下文
- **FileSystemXmlApplicationContext** - 基于文件系统的应用上下文
- **XmlWebApplicationContext** - Web应用专用的应用上下文

## 二、各种加载方式详解

### 1. XmlBeanFactory方式（已废弃）

> **注意**：XmlBeanFactory在Spring 3.1版本后已被标记为过时，建议使用ApplicationContext替代。

```java
// 基本用法（不推荐）
Resource resource = new ClassPathResource("applicationContext.xml");
BeanFactory factory = new XmlBeanFactory(resource);

// 获取Bean
MyBean bean = (MyBean) factory.getBean("myBean");
```

**限制**：
- 不支持多个配置文件相互引用
- 功能相对简单，缺少ApplicationContext的高级特性
- 已被废弃，不建议在新项目中使用

### 2. ClassPathXmlApplicationContext方式

这是最常用的加载方式，适用于从类路径加载配置文件。

#### 2.1 单文件加载

```java
// 方式1：直接指定文件名（默认从classpath根路径查找）
ApplicationContext context = new ClassPathXmlApplicationContext("applicationContext.xml");

// 方式2：明确指定classpath前缀
ApplicationContext context = new ClassPathXmlApplicationContext("classpath:applicationContext.xml");

// 方式3：指定子目录下的配置文件
ApplicationContext context = new ClassPathXmlApplicationContext("conf/userConfig.xml");

// 方式4：使用file协议指定绝对路径
ApplicationContext context = new ClassPathXmlApplicationContext("file:G:/Test/src/applicationContext.xml");
```

#### 2.2 多文件加载

```java
// 加载多个配置文件
String[] configLocations = {
    "applicationContext.xml",
    "user-spring.xml",
    "data-source.xml"
};
ApplicationContext context = new ClassPathXmlApplicationContext(configLocations);

// 使用通配符加载
ApplicationContext context = new ClassPathXmlApplicationContext("classpath*:spring/*.xml");
```

#### 2.3 获取Bean

```java
// 方式1：根据Bean名称获取
MyService myService = (MyService) context.getBean("myService");

// 方式2：根据类型获取（推荐）
MyService myService = context.getBean(MyService.class);

// 方式3：根据名称和类型获取
MyService myService = context.getBean("myService", MyService.class);
```

### 3. FileSystemXmlApplicationContext方式

适用于从文件系统加载配置文件，支持相对路径和绝对路径。

```java
// 方式1：相对路径（相对于当前工作目录）
ApplicationContext context = new FileSystemXmlApplicationContext("src/applicationContext.xml");

// 方式2：使用classpath前缀
ApplicationContext context = new FileSystemXmlApplicationContext("classpath:applicationContext.xml");

// 方式3：使用file协议的绝对路径
ApplicationContext context = new FileSystemXmlApplicationContext("file:G:/Test/src/applicationContext.xml");

// 方式4：直接使用绝对路径
ApplicationContext context = new FileSystemXmlApplicationContext("G:/Test/src/applicationContext.xml");

// 多文件加载
String[] configLocations = {
    "src/applicationContext.xml",
    "src/user-spring.xml"
};
ApplicationContext context = new FileSystemXmlApplicationContext(configLocations);
```

### 4. XmlWebApplicationContext方式

专为Web应用设计，通常与Spring MVC结合使用。

#### 4.1 通过ServletContext获取

```java
// 在Servlet中获取WebApplicationContext
ServletContext servletContext = request.getSession().getServletContext();
ApplicationContext context = WebApplicationContextUtils.getWebApplicationContext(servletContext);

// 获取必需的WebApplicationContext（如果不存在会抛出异常）
ApplicationContext context = WebApplicationContextUtils.getRequiredWebApplicationContext(servletContext);
```

#### 4.2 Web.xml配置方式

```xml
<!-- 配置ContextLoaderListener -->
<listener>
    <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>

<!-- 配置Spring配置文件位置 -->
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>
        /WEB-INF/applicationContext.xml,
        /WEB-INF/user-spring.xml
    </param-value>
</context-param>

<!-- 或使用通配符 -->
<context-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>/WEB-INF/spring/*.xml</param-value>
</context-param>
```

#### 4.3 DispatcherServlet配置

```xml
<servlet>
    <servlet-name>dispatcherServlet</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>/WEB-INF/spring-mvc.xml</param-value>
    </init-param>
    <load-on-startup>1</load-on-startup>
</servlet>

<servlet-mapping>
    <servlet-name>dispatcherServlet</servlet-name>
    <url-pattern>/</url-pattern>
</servlet-mapping>
```

## 三、多配置文件管理

### 1. 使用import元素

在主配置文件中引用其他配置文件：

```xml
<!-- applicationContext.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
       http://www.springframework.org/schema/beans/spring-beans.xsd">

    <!-- 引用其他配置文件 -->
    <import resource="user-spring.xml"/>
    <import resource="data-source.xml"/>
    <import resource="classpath:service/*.xml"/>
    
    <!-- 本文件的Bean定义 -->
    <bean id="mainService" class="com.example.MainService"/>
</beans>
```

### 2. 通配符加载

```java
// 加载指定目录下的所有XML文件
ApplicationContext context = new ClassPathXmlApplicationContext("classpath*:spring/*.xml");

// 加载匹配模式的文件
ApplicationContext context = new ClassPathXmlApplicationContext("classpath*:**/*-context.xml");
```

## 四、路径解析规则

### 1. ClassPathXmlApplicationContext路径规则

| 路径格式 | 说明 | 示例 |
|---------|------|------|
| `filename.xml` | 从classpath根目录查找 | `applicationContext.xml` |
| `classpath:filename.xml` | 明确指定从classpath查找 | `classpath:config.xml` |
| `classpath*:pattern` | 从所有classpath位置查找 | `classpath*:spring/*.xml` |
| `package/filename.xml` | 从指定包路径查找 | `com/example/config.xml` |
| `file:absolute_path` | 使用绝对文件路径 | `file:/opt/config.xml` |

### 2. FileSystemXmlApplicationContext路径规则

| 路径格式 | 说明 | 示例 |
|---------|------|------|
| `filename.xml` | 相对于当前工作目录 | `config.xml` |
| `./path/filename.xml` | 相对路径 | `./src/config.xml` |
| `/absolute/path` | 绝对路径 | `/opt/config.xml` |
| `file:path` | 使用file协议 | `file:/opt/config.xml` |
| `classpath:filename.xml` | 从classpath查找 | `classpath:config.xml` |

## 五、最佳实践

### 1. 推荐使用方式

```java
// 推荐：使用ClassPathXmlApplicationContext
public class AppConfig {
    public static void main(String[] args) {
        // 单文件
        ApplicationContext context = 
            new ClassPathXmlApplicationContext("applicationContext.xml");
        
        // 多文件
        String[] configs = {
            "applicationContext.xml",
            "data-source.xml",
            "service-config.xml"
        };
        ApplicationContext context = 
            new ClassPathXmlApplicationContext(configs);
    }
}
```

### 2. 配置文件组织建议

```
src/main/resources/
├── applicationContext.xml          # 主配置文件
├── spring/
│   ├── spring-dao.xml             # 数据访问层配置
│   ├── spring-service.xml         # 服务层配置
│   └── spring-web.xml             # Web层配置
└── config/
    ├── database.properties        # 数据库配置
    └── application.properties     # 应用配置
```

### 3. 现代化替代方案

虽然XML配置仍然广泛使用，但建议考虑更现代的配置方式：

```java
// 使用Java配置类
@Configuration
@ComponentScan("com.example")
@PropertySource("classpath:application.properties")
public class AppConfig {
    // Bean定义
}

// 使用AnnotationConfigApplicationContext
ApplicationContext context = 
    new AnnotationConfigApplicationContext(AppConfig.class);
```

## 六、常见问题和注意事项

### 1. 路径问题
- 注意区分相对路径和绝对路径
- 在IDE中运行和打包部署时的路径可能不同
- 使用`classpath:`前缀确保从类路径加载

### 2. 文件引用问题
- `import`元素中的路径是相对于当前配置文件的
- 避免循环引用
- 使用通配符时注意性能影响

### 3. Web应用中的注意事项
- 区分根应用上下文和Servlet应用上下文
- 注意Bean的作用域设置
- 正确配置ContextLoaderListener

### 4. 性能考虑
- 避免加载不必要的配置文件
- 合理使用懒加载
- 考虑使用Profile进行环境区分

## 七、总结

Spring提供了多种灵活的XML配置文件加载方式，每种方式都有其适用场景：

- **ClassPathXmlApplicationContext**：最常用，适合大多数应用
- **FileSystemXmlApplicationContext**：需要从文件系统加载时使用
- **XmlWebApplicationContext**：Web应用专用
- **XmlBeanFactory**：已废弃，不推荐使用

选择合适的加载方式，合理组织配置文件，可以让Spring应用更加模块化和易维护。随着Spring框架的发展，建议在新项目中考虑使用注解配置或Java配置来替代XML配置。