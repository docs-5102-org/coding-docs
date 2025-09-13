---
title: Spring MVC拦截器解决Session超时配置
category:
  - Java
  - Spring
tag:
  - 反射机制
---

# Spring MVC拦截器解决Session超时配置

## 目录

[[toc]]

## 问题背景

在使用iframe布局的Web应用中，当Session超时后，用户点击左侧系统菜单时，登录框会在iframe的右侧重新弹出，而不是在主窗口中显示。这种体验对用户来说很不友好。

## 解决方案

通过Spring MVC拦截器来检测Session状态，当Session超时时自动跳转到登录页面。

### 核心思路

1. **拦截器检测**：使用Interceptor拦截用户请求
2. **Session验证**：检查Session中是否存在用户信息
3. **统一跳转**：Session失效时统一跳转到登录主页面

## 实现步骤

### 步骤1：配置拦截器

在`applicationContext-mvc.xml`中添加拦截器配置：

```xml
<!-- Session超时拦截器配置 -->
<mvc:interceptors>
    <mvc:interceptor>
        <mvc:mapping path="/*/*" />
        <bean class="com.lenovo.lstp.mam.interceptor.SessionTimeoutInterceptor">
            <property name="allowUrls">  
                <list>  
                    <value>/login/login.do</value>  
                    <value>/common/language.do</value>  
                </list>  
            </property>  
        </bean>
    </mvc:interceptor>
</mvc:interceptors>

<!-- 异常处理器配置 -->
<bean id="handlerExceptionResolver"
      class="org.springframework.web.servlet.handler.SimpleMappingExceptionResolver">
    <property name="exceptionMappings">
        <props>
            <prop key="com.lenovo.lstp.mam.exception.SessionTimeoutException">/blank</prop>
        </props>
    </property>
</bean>
```

**配置说明：**
- `allowUrls`：配置无需拦截的URL列表
- `SessionTimeoutException`：Session超时时抛出的异常
- `/blank`：异常处理后跳转的中转页面

### 步骤2：创建拦截器实现类

```java
public class SessionTimeoutInterceptor implements HandlerInterceptor {
    
    private List<String> allowUrls;
    
    /**
     * Session超时拦截处理
     */
    @Override
    public boolean preHandle(HttpServletRequest request,
                           HttpServletResponse response, 
                           Object handler) throws Exception {
        
        String requestUrl = request.getRequestURI();
        
        // 检查是否为允许访问的URL
        for (String url : allowUrls) {
            if (requestUrl.endsWith(url)) {
                return true;
            }
        }
        
        // 检查Session中的用户信息
        String username = (String) WebUtils.getSessionAttribute(request, "username");
        if (username != null) {
            return true;
        } else {
            throw new SessionTimeoutException();
        }
    }
    
    // getter and setter methods
    public void setAllowUrls(List<String> allowUrls) {
        this.allowUrls = allowUrls;
    }
}
```

### 步骤3：创建Session超时异常类

```java
public class SessionTimeoutException extends Exception {
    private static final long serialVersionUID = 1L;
    
    public SessionTimeoutException() {
        super("Session has expired");
    }
    
    public SessionTimeoutException(String message) {
        super(message);
    }
}
```

### 步骤4：处理iframe嵌套问题

在`blank.jsp`中添加JavaScript代码，解决iframe嵌套显示问题：

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<script type="text/javascript">
    var session = "${user}";
    
    // 检查Session状态并跳转到主窗口
    if ("" == session || null == session) {
        top.location = "transfer.jsp";
    }
</script>
```

**关键点：**
- 使用`top.location`确保跳转在主窗口中执行，而不是在iframe中

### 步骤5：创建中转页面

创建`transfer.jsp`用于自动提交登录请求：

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>页面跳转中...</title>
</head>
<body>
    <form name="transfer" action="login/login.do" method="post"></form>
    
    <script type="text/javascript">
        $(document).ready(function(){
            document.transfer.submit();
        });
    </script>
</body>
</html>
```

### 步骤6：Controller中处理二次访问

在登录Controller中添加Session超时后的处理逻辑：

```java
@RequestMapping("/login")
public ModelAndView login(UserDto dto) {
    
    // Session超时后的二次访问检查
    if (dto.getUsername() == null) { 
        ModelAndView mv = new ModelAndView("login");
        return mv;
    }
    
    // 正常登录逻辑
    // ... 其他业务代码
}
```

## 配置要点

### 拦截器配置
- **路径匹配**：使用`/*/*`匹配所有需要拦截的路径
- **白名单管理**：将登录页面和公共资源加入`allowUrls`
- **异常映射**：配置异常处理器统一处理Session超时异常

### iframe处理
- **窗口定位**：使用`top.location`避免在iframe中跳转
- **自动提交**：通过JavaScript自动提交表单实现无感知跳转

## 扩展配置

如果登录页面有其他链接需要免拦截，可以在`allowUrls`中继续添加：

```xml
<property name="allowUrls">  
    <list>  
        <value>/login/login.do</value>  
        <value>/common/language.do</value>
        <value>/static/css/*</value>
        <value>/static/js/*</value>
        <value>/forgot-password.do</value>
    </list>  
</property>
```

## 总结

通过以上配置，可以有效解决iframe布局中的Session超时问题，实现：

1. **统一拦截**：所有需要登录的页面都会被拦截检查
2. **平滑跳转**：Session超时后自动跳转到登录页面
3. **用户体验**：避免在iframe中显示登录框的问题
4. **灵活配置**：可以通过白名单灵活控制哪些页面需要拦截

这个解决方案不仅解决了技术问题，也提升了用户体验。