---
title:  Resin 3.1 Pro版本配置指南
category:
  - Web容器
tag:
  - resin  
---

# Resin 3.1 Pro版本配置指南

## 目录

[[toc]]

## 概述

Resin是一个高性能的Java应用服务器，支持集群、负载均衡和企业级功能。本文档详细介绍了Resin 3.1 Pro版本的配置方法，包括基础配置、集群部署和负载均衡的实现。

## 基础配置结构

### 配置文件结构
```xml
<resin xmlns="http://caucho.com/ns/resin" xmlns:resin="http://caucho.com/ns/resin/core">
  <!-- 基础配置 -->
</resin>
```

### 类加载器配置
```xml
<!-- 加载resin/lib下的所有.jar文件 -->
<class-loader>
  <tree-loader path="${resin.home}/lib"/>
  <tree-loader path="${resin.root}/lib"/>
</class-loader>
```

### 管理和日志配置
```xml
<!-- 管理配置 -->
<management path="${resin.root}/admin"/>

<!-- JDK日志接口的配置 -->
<log name="" path="stdout:" timestamp="[%H:%M:%S.%s] "/>

<!-- 日志级别配置 -->
<!-- 'info' 生产环境 'fine' 开发环境 'finer' 调试环境 -->
<logger name="com.caucho" level="info"/>
<logger name="com.caucho.java" level="config"/>
<logger name="com.caucho.loader" level="config"/>
```

### 系统属性配置
```xml
<!-- 邮件服务器配置 -->
<system-property mail.smtp.host="127.0.0.1"/>
<system-property mail.smtp.port="25"/>

<!-- Java编译器设置 -->
<javac compiler="internal" args="-source 1.5"/>

<!-- 环境检测时间间隔 -->
<!-- 生产环境建议设置为600s(10分钟) -->
<dependency-check-interval>2s</dependency-check-interval>
```

## 集群与负载均衡配置

### 双层架构设计

Resin支持Web层和应用层的分离架构：
- **Web层**：负载均衡器层，处理HTTP请求分发
- **应用层**：应用服务器集群，处理具体业务逻辑

### Web层配置（负载均衡器）

```xml
<!-- Web层/负载均衡器配置 -->
<cluster id="web-tier">
  <server-default>
    <!-- HTTP端口 -->
    <http address="*" port="80"/>
  </server-default>
  
  <server id="web-a" address="127.0.0.1" port="6700"/>
  
  <!-- 缓存配置 -->
  <cache path="cache" memory-size="64M"/>
  
  <host id="">
    <web-app id="/">
      <rewrite-dispatch>
        <!-- 将请求转发到应用层集群 -->
        <load-balance regexp="" cluster="app-tier"/>
      </rewrite-dispatch>
    </web-app>
  </host>
</cluster>
```

### 应用层集群配置

```xml
<cluster id="app-tier">
  <!-- 设置集群根目录 -->
  <root-directory>.</root-directory>
  
  <server-default>
    <!-- HTTP服务端口 -->
    <http address="*" port="8080"/>
    
    <!-- JVM参数设置 -->
    <jvm-arg>-Xmx256m</jvm-arg>
    <jvm-arg>-Xss1m</jvm-arg>
    <jvm-arg>-Xdebug</jvm-arg>
    <jvm-arg>-Dcom.sun.management.jmxremote</jvm-arg>
    
    <!-- 性能参数 -->
    <memory-free-min>1M</memory-free-min>
    <thread-max>256</thread-max>
    <socket-timeout>65s</socket-timeout>
    <keepalive-max>128</keepalive-max>
    <keepalive-timeout>15s</keepalive-timeout>
  </server-default>
  
  <!-- 定义集群服务器节点 -->
  <server id="a" address="127.0.0.1" port="6800"/>
  <server id="b" address="127.0.0.1" port="6801"/>
  
  <!-- 持久化存储配置（Pro版功能） -->
  <persistent-store type="cluster">
    <init path="cluster"/>
  </persistent-store>
  
  <!-- Session配置 -->
  <web-app-default>
    <session-config>
      <use-persistent-store/>
    </session-config>
  </web-app-default>
</cluster>
```

### 启动集群服务器

使用以下命令启动应用层的多个服务器节点：

```bash
# 启动服务器节点A
D:\resin-pro-3.1.3\httpd.exe -conf conf/resin1.conf -server a

# 启动服务器节点B
D:\resin-pro-3.1.3\httpd.exe -conf conf/resin1.conf -server b
```

## 高级功能配置

### 缓存配置（Pro版功能）
```xml
<resin:if test="${resin.isProfessional()}">
  <cache path="cache" memory-size="64M">
    <!-- IE浏览器的Vary头重写 -->
    <rewrite-vary-as-private/>
  </cache>
</resin:if>
```

### 健康检查配置
```xml
<resin:if test="${resin.isProfessional()}">
  <ping>
    <!-- 可选的健康检查URL -->
    <!-- <url>http://localhost:8080/test-ping.jsp</url> -->
  </ping>
</resin:if>
```

### SSL配置示例
```xml
<http address="*" port="8443">
  <openssl>
    <certificate-file>keys/server.crt</certificate-file>
    <certificate-key-file>keys/server.key</certificate-key-file>
    <password>your_password</password>
  </openssl>
</http>
```

## Web应用配置

### 默认Web应用配置
```xml
<web-app-default>
  <!-- 扩展库配置 -->
  <class-loader>
    <tree-loader path="${server.root}/ext-webapp"/>
  </class-loader>
  
  <!-- 静态资源缓存配置 -->
  <cache-mapping url-pattern="/" expires="5s"/>
  <cache-mapping url-pattern="*.gif" expires="60s"/>
  <cache-mapping url-pattern="*.jpg" expires="60s"/>
  <cache-mapping url-pattern="*.png" expires="60s"/>
  
  <!-- 启用EL表达式支持 -->
  <allow-servlet-el/>
  
  <!-- Session安全配置 -->
  <session-config>
    <enable-url-rewriting>false</enable-url-rewriting>
  </session-config>
  
  <!-- JSP配置 -->
  <jsp>
    <validate-taglib-schema>true</validate-taglib-schema>
    <fast-jstl>true</fast-jstl>
    <fast-jsf>true</fast-jsf>
  </jsp>
</web-app-default>
```

### 数据库连接池配置示例
```xml
<database>
  <jndi-name>jdbc/mysql</jndi-name>
  <driver type="org.gjt.mm.mysql.Driver">
    <url>jdbc:mysql://localhost:3306/test</url>
    <user>username</user>
    <password>password</password>
  </driver>
  <prepared-statement-cache-size>8</prepared-statement-cache-size>
  <max-connections>20</max-connections>
  <max-idle-time>30s</max-idle-time>
</database>
```

## 虚拟主机配置

### 主机默认配置
```xml
<host-default>
  <!-- 访问日志 -->
  <access-log path="logs/access.log" 
             format='%h %l %u %t "%r" %s %b "%{Referer}i" "%{User-Agent}i"' 
             rollover-period="1W"/>
  
  <!-- 应用部署目录 -->
  <web-app-deploy path="webapps"/>
  <ear-deploy path="deploy"/>
  <resource-deploy path="deploy"/>
</host-default>
```

### 默认主机配置
```xml
<host id="" root-directory=".">
  <!-- 根应用配置 -->
  <web-app id="/" root-directory="webapps/ROOT"/>
  
  <!-- 管理应用配置 -->
  <web-app id="/resin-admin" root-directory="${resin.home}/php/admin">
    <prologue>
      <resin:set var="resin_admin_user" value="admin"/>
      <resin:set var="resin_admin_password" value="md5_hash"/>
      <resin:set var="resin_admin_external" value="false"/>
    </prologue>
  </web-app>
</host>
```

## 部署和运维

### 应用部署
- **WAR文件**：放置在`webapps`目录下自动部署
- **EAR文件**：放置在`deploy`目录下自动部署
- **RAR文件**：资源适配器部署在`deploy`目录

### 监控和管理
- 访问 `/resin-admin` 进行服务器管理
- 配置JMX远程监控：`-Dcom.sun.management.jmxremote`
- 设置适当的日志级别进行问题诊断

### 性能优化建议
1. **内存配置**：根据应用需求调整`-Xmx`和`-Xss`参数
2. **线程池**：合理设置`thread-max`值
3. **连接保持**：配置适当的`keepalive`参数
4. **缓存策略**：为静态资源设置合理的过期时间
5. **监控检查**：生产环境将`dependency-check-interval`设置为10分钟以上

## 总结

Resin 3.1 Pro版本提供了强大的企业级功能，包括集群、负载均衡、缓存和监控等。通过合理的配置，可以构建高可用、高性能的Java Web应用服务器环境。在部署时，建议先在测试环境验证配置的正确性，然后逐步应用到生产环境中。