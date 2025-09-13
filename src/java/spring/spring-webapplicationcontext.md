---
title: WebApplicationContext解析
category:
  - Web框架
tag:
  - WebApplicationContext
---

# Spring WebApplicationContext解析

## 一、WebApplicationContext概述

WebApplicationContext是Spring框架中实现ApplicationContext接口的子类，专门为Web应用程序设计。它在传统的ApplicationContext基础上，增加了对Web环境的特殊支持。

## 二、WebApplicationContext的主要作用

### 2.1 配置文件加载和上下文获取
- **路径加载优势**：允许从相对于Web根目录的路径中加载配置文件完成初始化工作
- **ServletContext集成**：可以获取ServletContext引用，整个Web应用上下文对象将作为属性放置在ServletContext中，使Web应用环境能够访问Spring上下文

### 2.2 扩展的Bean作用域
WebApplicationContext为Bean提供了三个新的作用域：
- **request**：Bean的生命周期与HTTP请求相同
- **session**：Bean的生命周期与HTTP会话相同  
- **globalsession**：Bean的生命周期与全局会话相同

### 2.3 HTTP请求处理支持
提供了对HTTP请求和响应的处理能力：
- **HttpServletRequest**：服务器从客户端获取数据
- **HttpServletResponse**：服务器向前台传送数据

### 2.4 WebApplicationContext 初始化的方式


`WebApplicationContext` 是 Spring Web 应用中的核心容器，它集成了 ServletContext 环境，用于管理 Web 应用中的 Bean 和依赖注入。以下是三种常见的初始化方式：

---

#### 1. 通过 `ContextLoaderListener`

这是最常见和推荐的方式：

**配置方式（web.xml）：**

```xml
<context-param>
  <param-name>contextConfigLocation</param-name>
  <param-value>/WEB-INF/applicationContext.xml</param-value>
</context-param>

<listener>
  <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
</listener>
```

**工作原理：**

* `ServletContext` 启动后，创建 `ContextLoaderListener`，触发内部的 `ContextLoader` 去初始化 `WebApplicationContext`；
* 初始化过程包括：加载配置文件、构建 Spring 容器、调用 `refresh()` 等操作；
* 初始化后的 `WebApplicationContext` 被绑定到 `ServletContext` 属性中，可供全局访问。([CSDN博客][1], [合成界][2])

**优点：**

* 启动早，生命周期与应用同步；
* 条理清晰，符合 Spring MVC 架构。

---

#### 2. 通过 `ContextLoaderServlet`

尽管不如 Listener 常用，这种方式也可实现容器初始化：

* 在 `web.xml` 中定义一个 Servlet：

```xml
<servlet>
  <servlet-name>contextLoader</servlet-name>
  <servlet-class>org.springframework.web.context.ContextLoaderServlet</servlet-class>
  <init-param>
    <param-name>contextConfigLocation</param-name>
    <param-value>/WEB-INF/applicationContext.xml</param-value>
  </init-param>
</servlet>
<servlet-mapping>
  <servlet-name>contextLoader</servlet-name>
  <url-pattern>/contextLoader</url-pattern>
</servlet-mapping>
```

* 它在 Servlet 初始化时创建 `WebApplicationContext`，相对启动稍晚一些，适用于在请求前确保容器已准备就绪的场景。([CSDN博客][3])

---

#### 3. 基于 Servlet 3.x 的编程式初始化（`WebApplicationInitializer`）

这种方式摆脱了 `web.xml`，更加现代化和灵活：

```java
public class MyWebAppInitializer implements WebApplicationInitializer {
    @Override
    public void onStartup(ServletContext sc) throws ServletException {
        AnnotationConfigWebApplicationContext ctx = new AnnotationConfigWebApplicationContext();
        ctx.register(AppConfig.class);
        ctx.setServletContext(sc);
        sc.addListener(new ContextLoaderListener(ctx));
    }
}
```

或基于 DispatcherServlet：

```java
public class MyWebAppInitializer extends AbstractDispatcherServletInitializer {
    @Override
    protected WebApplicationContext createServletApplicationContext() {
        AnnotationConfigWebApplicationContext ctx = new AnnotationConfigWebApplicationContext();
        ctx.register(WebConfig.class);
        return ctx;
    }
    @Override
    protected String[] getServletMappings() {
        return new String[]{"/"};
    }
}
```

**说明：**

* 实现 `WebApplicationInitializer` 接口后，Spring 会自动发现并在启动时装载上下文；
* 不再依赖 XML，支持 Java 配置或注解方式。

---

#### 4. 父子容器体系（Root & DispatcherServlet contexts）

Spring MVC 通常采用双层容器结构：

| 容器类型                       | 含义                        | Bean 类型                                         |
| -------------------------- | ------------------------- | ----------------------------------------------- |
| Root WebApplicationContext | 全应用级别容器                   | Service、DAO 等通用组件                               |
| DispatcherServlet Context  | 特定 DispatcherServlet 的子容器 | Controller、HandlerMapping、ViewResolver 等 MVC 组件 |

调度器容器为子容器，继承父容器中定义的 Bean，实现解耦和模块分离。

---

#### 总结对比表

| 初始化方式                                          | 描述                          | 优缺点                           |
| ---------------------------------------------- | --------------------------- | ----------------------------- |
| `ContextLoaderListener`                        | 标准方式，启动早，加载应用级 Bean         | 启动早，结构清晰，最常用                  |
| `ContextLoaderServlet`                         | Servlet 初始化时加载容器            | 启动晚，使用不如 Listener 常见，但可按需灵活使用 |
| `WebApplicationInitializer` / AnnotationConfig | 编程方式配置 Spring 容器，无需 web.xml | 更灵活、现代，适合注解/Java 配置风格         |
| 多容器模式（父子容器）                                    | Web 应用中常见结构，分层管理 Bean       | 更清晰分层结构，有利于模块化与职责划分           |


## 三、ApplicationContext与WebApplicationContext的区别

| 特性 | ApplicationContext | WebApplicationContext |
|------|-------------------|----------------------|
| 使用环境 | 通用Java应用 | Web应用专用 |
| Bean作用域 | singleton、prototype | 增加request、session、globalsession |
| 上下文获取 | 程序内部获取 | 可通过ServletContext获取 |
| 配置文件路径 | 绝对路径或类路径 | 支持相对于Web根目录的路径 |

## 四、Spring Web应用启动过程详解

### 4.1 ServletContext环境准备
1. Web应用部署在Web容器中时，容器提供一个全局上下文环境ServletContext
2. ServletContext为Spring IoC容器提供宿主环境

### 4.2 根上下文初始化
1. **监听器启动**：web.xml中配置的ContextLoaderListener监听容器初始化事件
2. **上下文创建**：contextInitialized方法被调用，Spring初始化根上下文WebApplicationContext
3. **具体实现**：实际实现类为XmlWebApplicationContext，这就是Spring的IoC容器
4. **配置指定**：Bean定义配置由web.xml中的context-param标签指定
5. **存储到ServletContext**：初始化完成后，以WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE为Key存储到ServletContext中

### 4.3 DispatcherServlet上下文初始化
1. **Servlet初始化**：ContextLoaderListener完成后，开始初始化web.xml中配置的Servlet
2. **前端控制器**：DispatcherServlet作为标准的前端控制器，负责转发、匹配、处理每个servlet请求
3. **独立上下文**：DispatcherServlet建立自己的IoC上下文，持有Spring MVC相关的Bean
4. **父子关系**：利用WebApplicationContext.ROOT_WEB_APPLICATION_CONTEXT_ATTRIBUTE从ServletContext获取根上下文作为parent
5. **策略初始化**：在initStrategies方法中完成处理器映射、视图解析等初始化工作
6. **上下文存储**：完成后以servlet相关的属性Key存储到ServletContext中

## 五、上下文层次结构

```
ServletContext (Web容器提供)
    │
    ├── WebApplicationContext (根上下文)
    │   ├── Service层Bean
    │   ├── DAO层Bean  
    │   └── 其他共享Bean
    │
    └── DispatcherServlet Context (子上下文)
        ├── Controller Bean
        ├── HandlerMapping
        ├── ViewResolver
        └── 其他MVC组件
```

### 上下文关系特点：
- **共享机制**：各个Servlet共享根上下文定义的Bean
- **独立空间**：每个Servlet拥有自己独立的Bean空间
- **父子继承**：子上下文可以访问父上下文的Bean，反之不行

## 六、总结

WebApplicationContext作为Spring在Web环境下的核心组件，不仅继承了ApplicationContext的所有功能，还针对Web应用的特点进行了专门的优化和扩展。通过理解其启动过程和上下文层次结构，可以更好地设计和配置Spring Web应用，实现组件的合理分层和资源的有效管理。

## 七、相关链接

### 官方文档
- [Spring Framework官网](https://spring.io/projects/spring-framework)
- [Spring Framework参考文档 - ApplicationContext](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-introduction)
- [Spring Framework参考文档 - Web MVC](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#mvc)
- [Spring Framework参考文档 - Web Applications](https://docs.spring.io/spring-framework/docs/current/reference/html/web.html#web-introduction)

### API文档
- [WebApplicationContext JavaDoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/context/WebApplicationContext.html)
- [DispatcherServlet JavaDoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/servlet/DispatcherServlet.html)
- [ContextLoaderListener JavaDoc](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/context/ContextLoaderListener.html)