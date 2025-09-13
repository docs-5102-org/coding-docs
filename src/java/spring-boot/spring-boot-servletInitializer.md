---
title: SpringBootServletInitializer原理分析
category:
  - Web框架
tag:
  - Spring Boot
---

# SpringBoot SpringBootServletInitializer原理分析

## 概述

在Spring Boot应用部署到传统的Servlet容器（如Tomcat）时，需要启动类继承`SpringBootServletInitializer`类，这样才能正常部署运行。本文将深入分析`SpringBootServletInitializer`的工作原理，以及它是如何替代传统`web.xml`配置文件的作用。

## 传统Web应用的启动流程

在传统的Java Web应用中，`web.xml`文件承担着配置各种Servlet、Filter、Listener等组件的重要作用，如：
- `Log4jConfigListener`
- `OpenSessionInViewFilter` 
- `CharacterEncodingFilter`
- `DispatcherServlet`

这些配置在容器启动时被加载并初始化。

## SpringBootServletInitializer核心机制

### 1. 核心接口实现

`SpringBootServletInitializer`实现了`WebApplicationInitializer`接口：

```java
public abstract class SpringBootServletInitializer implements WebApplicationInitializer {
    
    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        this.logger = LogFactory.getLog(super.getClass());
        WebApplicationContext rootAppContext = createRootApplicationContext(servletContext); 
        
        if (rootAppContext != null) {
            servletContext.addListener(new ContextLoaderListener(rootAppContext) {
                public void contextInitialized(ServletContextEvent event) {
                    // 上下文初始化逻辑
                }
            });
        } else {
            this.logger.debug("No ContextLoaderListener registered, as createRootApplicationContext() did not return an application context");
        }
    }
}
```

### 2. Servlet 3.0+ 的SPI机制

关键在于Servlet 3.0+引入的`ServletContainerInitializer`接口，Spring提供了`SpringServletContainerInitializer`实现：

```java
@HandlesTypes({ WebApplicationInitializer.class })
public class SpringServletContainerInitializer implements ServletContainerInitializer {
    
    @Override
    public void onStartup(Set<Class<?>> webAppInitializerClasses, ServletContext servletContext)
            throws ServletException {
        List<WebApplicationInitializer> initializers = new LinkedList<>();

        // 扫描所有WebApplicationInitializer实现类
        if (webAppInitializerClasses != null) {
            for (Class<?> waiClass : webAppInitializerClasses) {
                if (!(waiClass.isInterface()) && 
                    !(Modifier.isAbstract(waiClass.getModifiers())) &&
                    WebApplicationInitializer.class.isAssignableFrom(waiClass)) {
                    try {
                        initializers.add((WebApplicationInitializer) waiClass.newInstance());
                    } catch (Throwable ex) {
                        throw new ServletException("Failed to instantiate WebApplicationInitializer class", ex);
                    }
                }
            }
        }

        if (initializers.isEmpty()) {
            servletContext.log("No Spring WebApplicationInitializer types detected on classpath");
            return;
        }

        // 按@Order注解排序并执行
        servletContext.log(initializers.size() + " Spring WebApplicationInitializers detected on classpath");
        AnnotationAwareOrderComparator.sort(initializers);
        for (WebApplicationInitializer initializer : initializers) {
            initializer.onStartup(servletContext);
        }
    }
}
```

## 加载机制详解

### 1. 自动发现机制

- 容器启动时自动扫描`ServletContainerInitializer`实现类
- 通过`@HandlesTypes(WebApplicationInitializer.class)`注解，自动收集所有`WebApplicationInitializer`实现类
- 将这些实现类注入到`onStartup`方法的参数中

### 2. 执行顺序

- 所有`WebApplicationInitializer`实现类按`@Order`注解值进行排序
- 依次调用每个实现类的`onStartup`方法

## 自定义扩展示例

### 1. 自定义WebApplicationInitializer

```java
@Order(1)
public class MyWebApplicationInitializer implements WebApplicationInitializer {
    private Logger logger = LoggerFactory.getLogger(MyWebApplicationInitializer.class); 

    @Override
    public void onStartup(ServletContext servletContext) throws ServletException {
        logger.info("启动加载自定义的MyWebApplicationInitializer");
        
        // 可以在这里注册Servlet、Filter、Listener等
        ServletRegistration.Dynamic servlet = servletContext.addServlet("myServlet", MyServlet.class);
        servlet.addMapping("/myServlet");
        servlet.setLoadOnStartup(1);
    }
}
```

### 2. 自定义ServletContainerInitializer

如果需要更底层的控制，可以实现`ServletContainerInitializer`：

```java
public class MyServletContainerInitializer implements ServletContainerInitializer {
    
    @Override
    public void onStartup(Set<Class<?>> set, ServletContext servletContext) throws ServletException {
        // 注册自定义Servlet
        ServletRegistration.Dynamic servlet = servletContext.addServlet("customServlet", CustomServlet.class);
        servlet.setLoadOnStartup(1);
        servlet.addMapping("/customServlet");
    }
}
```

**注意**: 需要在`META-INF/services/javax.servlet.ServletContainerInitializer`文件中声明实现类的全路径名。

## SPI配置机制

Servlet 3.0+使用SPI（Service Provider Interface）机制来发现`ServletContainerInitializer`实现：

1. 在JAR包的`META-INF/services/`目录下创建文件`javax.servlet.ServletContainerInitializer`
2. 文件内容为实现类的全路径名
3. 容器启动时会自动加载并执行这些实现类

例如，Spring Web包中的配置文件内容为：
```
org.springframework.web.SpringServletContainerInitializer
```

## 重要限制

这种基于`ServletContainerInitializer`的机制有一个重要限制：

**仅在部署到外部Servlet容器时生效**，使用内嵌容器（如Spring Boot的jar包运行方式）时不会执行这些初始化器。

## 总结

`SpringBootServletInitializer`通过以下机制实现了`web.xml`的功能：

1. **实现WebApplicationInitializer接口**: 提供容器启动时的回调机制
2. **利用Servlet 3.0+ SPI机制**: 通过`ServletContainerInitializer`自动发现并加载初始化器
3. **编程式配置**: 在Java代码中完成Servlet、Filter、Listener等组件的注册
4. **有序执行**: 支持通过`@Order`注解控制多个初始化器的执行顺序

这种机制既保持了与传统Servlet容器的兼容性，又提供了更灵活的编程式配置方式，是Spring Boot实现"约定优于配置"理念的重要体现。