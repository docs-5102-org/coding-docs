---
title:  Tomcat session共享
category:
  - Web容器
tag:
  - Tomcat  
---

# Tomcat session共享实现方案

## 目录

[[toc]]

## 概述

在分布式系统和集群环境中，用户的session数据需要在多个Tomcat实例之间共享，以确保用户在任意服务器上都能保持登录状态和会话信息。本文档介绍了三种主要的Tomcat session共享解决方案。

## 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Filter方式 | 服务器通用性强，不限于Tomcat | 需要额外的Filter配置 | 多种Web容器混合环境 |
| SessionManager方式 | 配置简单，性能较好 | 仅支持Tomcat | 纯Tomcat集群环境 |
| Terracotta方式 | 功能强大，支持复杂场景 | 配置复杂，维护成本高 | 大型企业级应用 |

推荐使用Redis作为session存储，因为它支持数据持久化、单个对象容量大、数据类型丰富。

## 方案一：使用Filter方式存储

### 特点
- 服务器使用范围广，不仅限于Tomcat
- 在Tomcat 6和WebSphere 8测试通过
- 支持高并发场景（现网并发2000，日PV量1100万）

### 实现原理
使用Filter拦截器和缓存服务器（如Memcached/Redis）实现session共享。

### 注意事项
- 暂不支持session事件（create、destroy和attribute change）
- 需要与Spring一起使用
- 存储对象需实现Java序列化接口

## 方案二：使用Tomcat SessionManager方式

这是最常用和推荐的方案，分为Memcached和Redis两种实现。

### 2.1 基于Memcached的实现

#### 所需JAR包
```
memcached-session-manager-1.3.0.jar
msm-javolution-serializer-1.3.0.jar
javolution-5.4.3.1.jar
memcached-2.4.2.jar
```

#### 配置方法
修改Tomcat的`conf/context.xml`文件：

```xml
<Manager className="de.javakaffee.web.msm.MemcachedBackupSessionManager"   
         memcachedNodes="n1:localhost:11211,n2:localhost:11212"   
         failoverNodes="n2"   
         requestUriIgnorePattern=".*\\.(png|gif|jpg|css|js)$"   
         sessionBackupAsync="false"   
         sessionBackupTimeout="100"   
         transcoderFactoryClass="de.javakaffee.web.msm.serializer.javolution.JavolutionTranscoderFactory"   
         copyCollectionsForSerialization="false" />
```

### 2.2 基于Redis的实现

#### 所需JAR包
```
commons-pool2-2.3.jar
jedis-2.7.2.jar
tomcat-juli-8.0.23.jar
kuanrf-tomcat-redis-session-manager-1.0.jar
```

#### 单点Redis配置
修改Tomcat的`conf/context.xml`文件：

```xml
<Valve className="com.radiadesign.catalina.session.RedisSessionHandlerValve" />
<Manager className="com.radiadesign.catalina.session.RedisSessionManager"
         host="127.0.0.1"
         port="6379"
         database="0"
         maxInactiveInterval="60" />
```

#### Redis Sentinel集群配置
```xml
<Valve className="reyo.redis.session.manager.tomcat8.RedisSessionHandlerValve" />        
<Manager className="reyo.redis.session.manager.tomcat8.RedisSessionManager"
         maxInactiveInterval="60"
         sentinelMaster="mymaster"
         sentinels="127.0.0.1:26379,127.0.0.1:26380,127.0.0.1:26381,127.0.0.1:26382" />
```

## Tomcat 8支持说明

官方的tomcat-redis-session-manager在2015年前不支持Tomcat 8。解决方案是使用修改版的`reyo.redis.session.manager.tomcat8`。

### 主要修改内容
原代码：
```java
@SuppressWarnings("deprecation")
private void initializeSerializer() throws ClassNotFoundException, IllegalAccessException, InstantiationException {
    // ... 原代码使用 getContainer() 方法
    if (getContainer() != null) {
        loader = getContainer().getLoader();
    }
    // ...
}
```

修改后：
```java
private void initializeSerializer() throws ClassNotFoundException, IllegalAccessException, InstantiationException {
    // ... 修改为使用 getContext() 方法
    Context context = this.getContext();
    if (context != null) {
        loader = context.getLoader();
    }
    // ...
}
```

## 部署配置步骤

### 1. 环境准备
- JDK 8
- Tomcat 8.x
- Redis服务器

### 2. JAR包部署
将所需的JAR包复制到Tomcat的`lib`目录下。

### 3. 配置文件修改
在`conf/context.xml`的`</Context>`标签前添加相应的配置。

### 4. 启动服务
按顺序启动：
1. Redis服务
2. Tomcat实例
3. Nginx负载均衡器（如果使用）

## 测试验证

### 测试页面示例

**a.jsp**（设置session）：
```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <title>Session Test</title>
</head>
<body>
    <%String s = session.getId(); %>
    Session ID: <%=s %>
    <%
        session.setAttribute("testKey", "testValue_" + System.currentTimeMillis());   
    %>
</body>
</html>
```

**b.jsp**（读取session）：
```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html>
<head>
    <title>Session Test</title>
</head>
<body>
    <%String s = session.getId(); %>
    Session ID: <%=s %>
    <br/>
    Session Value: <%=(String)session.getAttribute("testKey")%>
</body>
</html>
```

### 验证步骤
1. 启动多个Tomcat实例
2. 访问第一个实例的a.jsp设置session
3. 访问第二个实例的b.jsp读取session
4. 验证session ID一致且能读取到数据

### Redis验证
使用Redis客户端连接：
```bash
redis-cli.exe -h 127.0.0.1 -p 6379
get [SESSION_ID]
```

## 高级配置

### Session Cookie名称自定义
```xml
<Context sessionCookieName="customSessionId">
```

或通过JVM参数：
```bash
-Dorg.apache.catalina.SESSION_COOKIE_NAME=customSessionId
```

### 禁用URL重写
```xml
<Context disableURLRewriting="true">
```

### 忽略静态资源
通过`requestUriIgnorePattern`参数排除静态资源：
```xml
requestUriIgnorePattern=".*\\.(png|gif|jpg|css|js)$"
```

## 注意事项

1. **Session持久化**：从Tomcat 6开始默认开启Session持久化，测试时建议关闭：
   ```xml
   <!-- 取消注释以禁用session持久化 -->
   <Manager pathname="" />
   ```

2. **优先级**：web.xml中的session配置优先级高于context.xml中的配置。

3. **安全考虑**：
   - 建议禁用URL重写以避免session ID泄露
   - 在生产环境中使用SSL加密传输
   - 设置合适的session超时时间

4. **性能优化**：
   - 使用连接池管理Redis连接
   - 合理配置session超时时间
   - 排除静态资源的session处理

## 与负载均衡器集成

### Nginx配置示例
```nginx
upstream tomcat_cluster {
    server 192.168.1.100:8080;
    server 192.168.1.101:8080;
}

server {
    listen 80;
    server_name example.com;
    
    location / {
        proxy_pass http://tomcat_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 总结

Redis + Tomcat SessionManager的方案是目前最成熟和稳定的session共享解决方案，具有以下优势：

- 配置简单，维护方便
- 性能优秀，支持高并发
- 支持数据持久化
- 社区支持良好

在实际部署时，建议结合具体的业务场景和性能要求选择合适的配置参数，并进行充分的测试验证。