---
title: Spring 拦截器讲解
category:
  - Web框架
tag:
  - 拦截器
---

# Spring MVC 拦截器完整配置指南

> 本指南详细介绍了 Spring MVC 拦截器的配置和使用，包括静态资源处理、权限管理和最佳实践。

## 目录
<!-- - [1. DispatcherServlet 配置](#1-dispatcherservlet-配置)
- [2. 静态资源处理](#2-静态资源处理)
- [3. 自定义拦截器实现](#3-自定义拦截器实现)
- [4. 进阶配置和优化](#4-进阶配置和优化)
- [5. 最佳实践](#5-最佳实践)
- [6. 常见问题及解决方案](#6-常见问题及解决方案) -->
[[toc]]

## 1. DispatcherServlet 配置

Spring MVC 使用 `DispatcherServlet` 作为统一的前端控制器，所有的请求都通过它进行分发处理。

### 1.1 基本配置

在 `web.xml` 中配置 DispatcherServlet：

```xml
<!-- Spring MVC 前端控制器配置 -->
<servlet>
    <servlet-name>springMVC</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <!-- 指定 Spring MVC 配置文件位置 -->
    <init-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath:spring-mvc.xml</param-value>
    </init-param>
    <load-on-startup>1</load-on-startup>
</servlet>

<servlet-mapping>
    <servlet-name>springMVC</servlet-name>
    <!-- 拦截所有请求，但不包括 JSP -->
    <url-pattern>/</url-pattern>
</servlet-mapping>
```

### 1.2 配置说明

- `<load-on-startup>1</load-on-startup>`：服务器启动时立即加载 Servlet
- `<url-pattern>/</url-pattern>`：拦截所有请求，但不拦截 JSP 页面
- 配置文件默认位置：`WEB-INF/[servlet-name]-servlet.xml`

## 2. 静态资源处理

当配置 DispatcherServlet 拦截所有请求（`/`）时，静态资源（JS、CSS、图片等）也会被拦截，导致无法正常访问。

### 2.1 方法一：使用默认 Servlet 处理

#### 在 web.xml 中配置

```xml
<!-- 配置静态资源由容器默认 Servlet 处理 -->
<servlet-mapping>
    <servlet-name>default</servlet-name>
    <url-pattern>/static/*</url-pattern>
    <url-pattern>/js/*</url-pattern>
    <url-pattern>/css/*</url-pattern>
    <url-pattern>/images/*</url-pattern>
    <url-pattern>/fonts/*</url-pattern>
    <url-pattern>*.ico</url-pattern>
</servlet-mapping>
```

#### 在 Spring 配置中启用

```xml
<!-- 启用默认 Servlet 处理静态资源 -->
<mvc:default-servlet-handler />

<!-- 如果容器默认 Servlet 名称不是 'default'，需要指定 -->
<mvc:default-servlet-handler default-servlet-name="resin-file" />
```

**常见容器的默认 Servlet 名称：**
- Tomcat, Jetty, JBoss, GlassFish: `default`
- Resin: `resin-file`
- WebLogic: `FileServlet`
- WebSphere: `SimpleFileServlet`

### 2.2 方法二：使用 mvc:resources（推荐）

```xml
<!-- 静态资源映射配置 -->
<mvc:resources mapping="/static/**" location="/static/" cache-period="31556926" />
<mvc:resources mapping="/js/**" location="/static/js/" cache-period="31556926" />
<mvc:resources mapping="/css/**" location="/static/css/" cache-period="31556926" />
<mvc:resources mapping="/images/**" location="/static/images/" cache-period="31556926" />
<mvc:resources mapping="/fonts/**" location="/static/fonts/" cache-period="31556926" />

<!-- 启用资源版本管理 -->
<mvc:resources mapping="/static/**" location="/static/">
    <mvc:resource-chain resource-cache="true">
        <mvc:resolvers>
            <mvc:version-resolver>
                <mvc:fixed-version-strategy version="v1.0.0" patterns="/**"/>
            </mvc:version-resolver>
        </mvc:resolvers>
    </mvc:resource-chain>
</mvc:resources>
```

### 2.3 配置参数说明

- `mapping`：URL 映射路径
- `location`：实际文件位置
- `cache-period`：缓存时间（秒），31556926 约等于一年
- `resource-cache`：启用资源缓存
- `version`：资源版本号，便于缓存管理

## 3. 自定义拦截器实现

### 3.1 拦截器配置

```xml
<!-- 拦截器配置 -->
<mvc:interceptors>
    <!-- 全局拦截器 -->
    <bean class="com.example.interceptor.GlobalInterceptor" />
    
    <!-- 特定路径拦截器 -->
    <mvc:interceptor>
        <mvc:mapping path="/admin/**" />
        <mvc:mapping path="/user/**" />
        <!-- 排除特定路径 -->
        <mvc:exclude-mapping path="/user/login" />
        <mvc:exclude-mapping path="/user/register" />
        <bean class="com.example.interceptor.AuthInterceptor" />
    </mvc:interceptor>
    
    <!-- API 拦截器 -->
    <mvc:interceptor>
        <mvc:mapping path="/api/**" />
        <bean class="com.example.interceptor.ApiInterceptor" />
    </mvc:interceptor>
</mvc:interceptors>
```

### 3.2 拦截器实现

```java
package com.example.interceptor;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

/**
 * 用户认证拦截器
 * 实现登录验证和权限控制
 */
public class AuthInterceptor implements HandlerInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthInterceptor.class);
    private static final String USER_SESSION_KEY = "currentUser";
    private static final String LAST_REQUEST_URL = "lastRequestUrl";
    
    /**
     * 预处理：在Controller方法执行前调用
     */
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        
        String requestURI = request.getRequestURI();
        String contextPath = request.getContextPath();
        String url = requestURI.substring(contextPath.length());
        
        logger.info("拦截请求: {}", url);
        
        HttpSession session = request.getSession();
        Object user = session.getAttribute(USER_SESSION_KEY);
        
        // 检查用户是否已登录
        if (user == null) {
            logger.info("用户未登录，重定向到登录页面");
            
            // 保存当前请求URL，登录后可以重定向回来
            if ("GET".equalsIgnoreCase(request.getMethod())) {
                session.setAttribute(LAST_REQUEST_URL, url);
            }
            
            // AJAX请求返回JSON响应
            if (isAjaxRequest(request)) {
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\":false,\"message\":\"请先登录\",\"code\":401}");
                return false;
            }
            
            // 普通请求重定向到登录页面
            response.sendRedirect(contextPath + "/login");
            return false;
        }
        
        // 权限验证（可选）
        if (!hasPermission(user, url)) {
            logger.warn("用户 {} 没有访问 {} 的权限", user, url);
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "没有访问权限");
            return false;
        }
        
        return true;
    }
    
    /**
     * 后处理：Controller方法执行后，视图渲染前调用
     */
    @Override
    public void postHandle(HttpServletRequest request, 
                          HttpServletResponse response, 
                          Object handler, 
                          ModelAndView modelAndView) throws Exception {
        
        if (modelAndView != null) {
            // 添加公共数据到视图
            modelAndView.addObject("currentTime", System.currentTimeMillis());
            
            HttpSession session = request.getSession();
            Object user = session.getAttribute(USER_SESSION_KEY);
            if (user != null) {
                modelAndView.addObject("currentUser", user);
            }
        }
    }
    
    /**
     * 完成处理：整个请求处理完成后调用
     */
    @Override
    public void afterCompletion(HttpServletRequest request, 
                              HttpServletResponse response, 
                              Object handler, 
                              Exception ex) throws Exception {
        
        if (ex != null) {
            logger.error("请求处理过程中发生异常", ex);
        }
        
        // 清理资源
        // 例如：清理ThreadLocal变量等
    }
    
    /**
     * 判断是否为AJAX请求
     */
    private boolean isAjaxRequest(HttpServletRequest request) {
        String xRequestedWith = request.getHeader("X-Requested-With");
        return "XMLHttpRequest".equals(xRequestedWith);
    }
    
    /**
     * 权限验证（示例实现）
     */
    private boolean hasPermission(Object user, String url) {
        // 这里实现具体的权限验证逻辑
        // 可以查询数据库或缓存中的用户权限信息
        return true;
    }
}
```

### 3.3 请求工具类

```java
package com.example.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 请求工具类
 */
public class RequestUtil {
    
    private static final String SAVED_REQUEST_URL = "savedRequestUrl";
    
    /**
     * 获取当前请求对象
     */
    public static HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attrs = 
            (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
        return attrs.getRequest();
    }
    
    /**
     * 获取当前Session
     */
    public static HttpSession getCurrentSession() {
        return getCurrentRequest().getSession();
    }
    
    /**
     * 保存请求URL
     */
    public static void saveRequestUrl() {
        HttpServletRequest request = getCurrentRequest();
        if ("GET".equalsIgnoreCase(request.getMethod())) {
            String url = request.getRequestURI();
            String queryString = request.getQueryString();
            if (queryString != null) {
                url += "?" + queryString;
            }
            request.getSession().setAttribute(SAVED_REQUEST_URL, url);
        }
    }
    
    /**
     * 获取保存的请求URL
     */
    public static String getSavedRequestUrl() {
        HttpSession session = getCurrentSession();
        String url = (String) session.getAttribute(SAVED_REQUEST_URL);
        session.removeAttribute(SAVED_REQUEST_URL);
        return url;
    }
    
    /**
     * 获取客户端IP地址
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        String[] headerNames = {
            "X-Forwarded-For",
            "Proxy-Client-IP", 
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
        };
        
        for (String header : headerNames) {
            String ip = request.getHeader(header);
            if (ip != null && ip.length() != 0 && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0];
            }
        }
        
        return request.getRemoteAddr();
    }
}
```

## 4. 进阶配置和优化

### 4.1 多环境配置

```xml
<!-- 开发环境配置 -->
<beans profile="dev">
    <mvc:resources mapping="/static/**" location="/static/" cache-period="0" />
    <mvc:interceptor>
        <mvc:mapping path="/**" />
        <bean class="com.example.interceptor.DevInterceptor" />
    </mvc:interceptor>
</beans>

<!-- 生产环境配置 -->
<beans profile="prod">
    <mvc:resources mapping="/static/**" location="/static/" cache-period="31556926" />
    <mvc:interceptor>
        <mvc:mapping path="/**" />
        <bean class="com.example.interceptor.ProdInterceptor" />
    </mvc:interceptor>
</beans>
```

### 4.2 异步处理支持

```java
@Component
public class AsyncInterceptor implements AsyncHandlerInterceptor {
    
    @Override
    public void afterConcurrentHandlingStarted(HttpServletRequest request, 
                                             HttpServletResponse response, 
                                             Object handler) throws Exception {
        // 异步处理开始后的逻辑
        logger.info("异步处理开始");
    }
}
```

### 4.3 性能监控拦截器

```java
@Component
public class PerformanceInterceptor implements HandlerInterceptor {
    
    private static final String START_TIME = "startTime";
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        request.setAttribute(START_TIME, System.currentTimeMillis());
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, 
                              HttpServletResponse response, 
                              Object handler, 
                              Exception ex) throws Exception {
        Long startTime = (Long) request.getAttribute(START_TIME);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            logger.info("请求 {} 处理耗时: {}ms", request.getRequestURI(), duration);
            
            // 记录慢请求
            if (duration > 2000) {
                logger.warn("慢请求警告: {} 耗时 {}ms", request.getRequestURI(), duration);
            }
        }
    }
}
```

## 5. 最佳实践

### 5.1 拦截器设计原则

1. **单一职责**：每个拦截器只负责一种类型的处理
2. **最小影响**：避免在拦截器中进行重量级操作
3. **异常处理**：妥善处理异常，避免影响正常请求
4. **性能考虑**：避免在 preHandle 中进行数据库操作

### 5.2 推荐的拦截器层次结构

```xml
<mvc:interceptors>
    <!-- 1. 全局日志拦截器 -->
    <bean class="com.example.interceptor.LoggingInterceptor" />
    
    <!-- 2. 性能监控拦截器 -->
    <bean class="com.example.interceptor.PerformanceInterceptor" />
    
    <!-- 3. 认证授权拦截器 -->
    <mvc:interceptor>
        <mvc:mapping path="/admin/**" />
        <mvc:mapping path="/user/**" />
        <mvc:exclude-mapping path="/user/login" />
        <bean class="com.example.interceptor.AuthInterceptor" />
    </mvc:interceptor>
    
    <!-- 4. 业务特定拦截器 -->
    <mvc:interceptor>
        <mvc:mapping path="/api/**" />
        <bean class="com.example.interceptor.ApiRateLimitInterceptor" />
    </mvc:interceptor>
</mvc:interceptors>
```

### 5.3 缓存配置优化

```xml
<!-- 启用HTTP缓存 -->
<mvc:annotation-driven>
    <mvc:message-converters>
        <bean class="org.springframework.http.converter.json.MappingJackson2HttpMessageConverter">
            <property name="objectMapper" ref="objectMapper"/>
        </bean>
    </mvc:message-converters>
</mvc:annotation-driven>

<!-- 静态资源缓存策略 -->
<mvc:resources mapping="/static/**" location="/static/">
    <mvc:cache-control max-age="31536000" cache-public="true"/>
</mvc:resources>
```

## 6. 常见问题及解决方案

### 6.1 静态资源无法访问

**问题**：配置了 `/` 拦截后，CSS、JS 等静态资源无法加载。

**解决方案**：
1. 使用 `<mvc:resources>` 配置静态资源映射
2. 确保静态资源路径正确
3. 检查是否被拦截器误拦截

### 6.2 拦截器不生效

**问题**：配置了拦截器但没有被执行。

**解决方案**：
1. 检查路径映射是否正确
2. 确认拦截器类是否正确实现接口
3. 查看是否被其他拦截器提前返回 false

### 6.3 循环重定向

**问题**：登录拦截器导致无限重定向。

**解决方案**：
```java
// 排除登录相关页面
if (url.equals("/login") || url.equals("/doLogin")) {
    return true;
}
```

### 6.4 AJAX请求处理

**问题**：AJAX请求被拦截后页面无响应。

**解决方案**：
```java
if (isAjaxRequest(request)) {
    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType("application/json;charset=UTF-8");
    response.getWriter().write("{\"success\":false,\"message\":\"请先登录\"}");
    return false;
}
```

### 6.5 编码配置

```xml
<!-- 字符编码过滤器 -->
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
```

## 🔗 Spring MVC 官方文档链接

### 核心官方文档

#### 1. Spring Framework 官方文档
- **拦截器配置**: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html
- **Handler 拦截器**: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html

#### 2. Spring Framework 完整文档
- **Spring Web MVC 完整参考**: https://docs.spring.io/spring-framework/docs/current/reference/html/web.html

#### 3. Spring Boot 静态资源
- **Spring Boot Web 应用开发**: https://docs.spring.io/spring-boot/docs/current/reference/html/web.html

### 权威教程和指南

#### 1. Spring 官方指南
- **Spring.io 官方指南**: https://spring.io/guides
- **Spring Boot 静态内容服务**: https://spring.io/blog/2013/12/19/serving-static-web-content-with-spring-boot

#### 2. 权威第三方文档
- **Baeldung 拦截器教程**: https://www.baeldung.com/spring-mvc-handlerinterceptor
- **Baeldung 静态资源教程**: https://www.baeldung.com/spring-mvc-static-resources

### 快速参考我已经为您更新了文档，添加了官方文档链接部分。以下是主要的官方资源：

## 📚 重要官方资源

### 1. **Spring Framework 核心文档**
- **拦截器配置**: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html
- **Handler 拦截器**: https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-servlet/handlermapping-interceptor.html

### 2. **Spring Boot 文档**
- **Web 应用开发**: https://docs.spring.io/spring-boot/docs/current/reference/html/web.html

### 3. **Spring 官方指南**
- **所有指南**: https://spring.io/guides
- **静态内容服务**: https://spring.io/blog/2013/12/19/serving-static-web-content-with-spring-boot

### 4. **权威教程**
- **Baeldung 拦截器详解**: https://www.baeldung.com/spring-mvc-handlerinterceptor
- **Baeldung 静态资源配置**: https://www.baeldung.com/spring-mvc-static-resources
