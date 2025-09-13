---
title:  Tomcat 集群配置
category:
  - Web容器
tag:
  - Tomcat  
---

# Tomcat 集群配置教程

## 目录

[[toc]]

## 概述

Tomcat 集群是一种高可用性和负载均衡的解决方案，通过将多个 Tomcat 实例组合在一起工作，可以提高应用程序的性能、可靠性和可扩展性。本教程将详细介绍如何配置和部署 Tomcat 集群。

## 集群架构

典型的 Tomcat 集群架构包含以下组件：

- **负载均衡器**：Apache HTTP Server 或 Nginx
- **多个 Tomcat 实例**：运行在不同端口或不同服务器上
- **会话复制机制**：确保会话数据在集群间同步
- **共享存储**（可选）：用于静态资源和配置文件

## 环境准备

### 系统要求

- Java 8 或更高版本
- Tomcat 8.5 或更高版本
- 至少 2 台服务器（或单台服务器多端口）
- 网络互通的环境

### 服务器规划

假设我们使用两台服务器：

| 服务器 | IP地址 | 角色 | Tomcat端口 |
|--------|---------|------|------------|
| Server1 | 192.168.1.10 | Tomcat Node 1 | 8080 |
| Server2 | 192.168.1.11 | Tomcat Node 2 | 8080 |
| LB Server | 192.168.1.5 | 负载均衡器 | 80/443 |

## 第一步：安装和配置 Tomcat

### 1.1 安装 Tomcat

在每台服务器上安装 Tomcat：

```bash
# 下载 Tomcat
cd /opt
wget https://downloads.apache.org/tomcat/tomcat-9/v9.0.80/bin/apache-tomcat-9.0.80.tar.gz

# 解压
tar -zxvf apache-tomcat-9.0.80.tar.gz
mv apache-tomcat-9.0.80 tomcat

# 设置权限
chmod +x /opt/tomcat/bin/*.sh
```

### 1.2 配置环境变量

在 `/etc/profile` 中添加：

```bash
export CATALINA_HOME=/opt/tomcat
export CATALINA_BASE=/opt/tomcat
export PATH=$PATH:$CATALINA_HOME/bin
```

## 第二步：配置集群

### 2.1 修改 server.xml

在每个 Tomcat 实例的 `conf/server.xml` 文件中进行以下配置：

#### Server1 配置 (192.168.1.10)

```xml
<Server port="8005" shutdown="SHUTDOWN">
  <!-- 其他配置保持默认 -->
  
  <Service name="Catalina">
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
    
    <Engine name="Catalina" defaultHost="localhost" jvmRoute="tomcat1">
      
      <!-- 集群配置 -->
      <Cluster className="org.apache.catalina.ha.tcp.SimpleTcpCluster"
               channelSendOptions="8">
        
        <Manager className="org.apache.catalina.ha.session.DeltaManager"
                 expireSessionsOnShutdown="false"
                 notifyListenersOnReplication="true"/>
        
        <Channel className="org.apache.catalina.tribes.group.GroupChannel">
          <Membership className="org.apache.catalina.tribes.membership.McastService"
                      address="228.0.0.4"
                      port="45564"
                      frequency="500"
                      dropTime="3000"/>
          
          <Receiver className="org.apache.catalina.tribes.transport.nio.NioReceiver"
                    address="192.168.1.10"
                    port="4000"
                    autoBind="100"
                    selectorTimeout="5000"
                    maxThreads="6"/>
          
          <Sender className="org.apache.catalina.tribes.transport.ReplicationTransmitter">
            <Transport className="org.apache.catalina.tribes.transport.nio.PooledParallelSender"/>
          </Sender>
          
          <Interceptor className="org.apache.catalina.tribes.group.interceptors.TcpFailureDetector"/>
          <Interceptor className="org.apache.catalina.tribes.group.interceptors.MessageDispatchInterceptor"/>
        </Channel>
        
        <Valve className="org.apache.catalina.ha.tcp.ReplicationValve"
               filter=""/>
        <Valve className="org.apache.catalina.ha.session.JvmRouteBinderValve"/>
        
        <Deployer className="org.apache.catalina.ha.deploy.FarmWarDeployer"
                  tempDir="/tmp/war-temp/"
                  deployDir="/tmp/war-deploy/"
                  watchDir="/tmp/war-listen/"
                  watchEnabled="false"/>
        
        <ClusterListener className="org.apache.catalina.ha.session.JvmRouteSessionIDBinderListener"/>
        <ClusterListener className="org.apache.catalina.ha.session.ClusterSessionListener"/>
      </Cluster>
      
      <Host name="localhost" appBase="webapps"
            unpackWARs="true" autoDeploy="true">
        <!-- Host配置 -->
      </Host>
    </Engine>
  </Service>
</Server>
```

#### Server2 配置 (192.168.1.11)

Server2 的配置与 Server1 类似，但需要修改以下参数：

```xml
<Engine name="Catalina" defaultHost="localhost" jvmRoute="tomcat2">
  <!-- 集群配置中修改 -->
  <Receiver className="org.apache.catalina.tribes.transport.nio.NioReceiver"
            address="192.168.1.11"  <!-- 修改为 Server2 的 IP -->
            port="4000"
            autoBind="100"
            selectorTimeout="5000"
            maxThreads="6"/>
</Engine>
```

### 2.2 应用程序配置

#### 修改 web.xml

在应用程序的 `WEB-INF/web.xml` 中添加分布式标签：

```xml
<web-app>
    <!-- 其他配置 -->
    
    <!-- 启用会话复制 -->
    <distributable/>
    
    <!-- 会话配置 -->
    <session-config>
        <session-timeout>30</session-timeout>
        <cookie-config>
            <http-only>true</http-only>
            <secure>false</secure>
        </cookie-config>
    </session-config>
</web-app>
```

#### 序列化要求

确保所有存储在会话中的对象都实现了 `Serializable` 接口：

```java
public class UserInfo implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String username;
    private String email;
    
    // getter 和 setter 方法
}
```

## 第三步：配置负载均衡器

### 3.1 使用 Apache HTTP Server

#### 安装 mod_jk

```bash
# CentOS/RHEL
yum install httpd-devel apr-devel
# 或者编译安装 mod_jk
```

#### 配置 workers.properties

创建 `/etc/httpd/conf.d/workers.properties`：

```properties
# 定义工作节点
worker.list=loadbalancer,jkstatus

# Tomcat 1
worker.tomcat1.port=8009
worker.tomcat1.host=192.168.1.10
worker.tomcat1.type=ajp13
worker.tomcat1.lbfactor=1

# Tomcat 2
worker.tomcat2.port=8009
worker.tomcat2.host=192.168.1.11
worker.tomcat2.type=ajp13
worker.tomcat2.lbfactor=1

# 负载均衡器
worker.loadbalancer.type=lb
worker.loadbalancer.balanced_workers=tomcat1,tomcat2
worker.loadbalancer.sticky_session=True

# 状态监控
worker.jkstatus.type=status
```

#### 配置 httpd.conf

在 `/etc/httpd/conf/httpd.conf` 中添加：

```apache
LoadModule jk_module modules/mod_jk.so

JkWorkersFile /etc/httpd/conf.d/workers.properties
JkLogFile /var/log/httpd/mod_jk.log
JkLogLevel info

# 映射配置
JkMount /* loadbalancer
JkMount /jkmanager/* jkstatus
```

### 3.2 使用 Nginx

#### 配置 nginx.conf

```nginx
upstream tomcat_cluster {
    server 192.168.1.10:8080 weight=1 max_fails=2 fail_timeout=30s;
    server 192.168.1.11:8080 weight=1 max_fails=2 fail_timeout=30s;
    
    # 启用会话保持
    ip_hash;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://tomcat_cluster;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 连接超时设置
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查页面
    location /health {
        access_log off;
        return 200 "healthy\n";
    }
}
```

## 第四步：启动和测试

### 4.1 启动服务

按以下顺序启动服务：

```bash
# 1. 启动 Tomcat 实例
# Server1
/opt/tomcat/bin/startup.sh

# Server2
/opt/tomcat/bin/startup.sh

# 2. 启动负载均衡器
# Apache
systemctl start httpd

# Nginx
systemctl start nginx
```

### 4.2 验证集群状态

#### 检查集群日志

查看 Tomcat 日志文件 `logs/catalina.out`，寻找类似信息：

```
INFO: Cluster is about to start
INFO: Manager [localhost#/]: start cluster 
INFO: Register manager /contexPath to cluster element Host with name localhost
INFO: Manager [localhost#/]: start cluster
INFO: Manager [localhost#/]: startInternal start
INFO: Cluster member added: org.apache.catalina.tribes.membership.MemberImpl...
```

#### 创建测试页面

创建一个简单的测试页面 `session-test.jsp`：

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="java.util.*, java.text.*" %>
<!DOCTYPE html>
<html>
<head>
    <title>集群测试页面</title>
</head>
<body>
    <h1>Tomcat 集群测试</h1>
    
    <p><strong>服务器信息：</strong></p>
    <ul>
        <li>服务器名称: <%= request.getServerName() %>:<%= request.getServerPort() %></li>
        <li>JVM Route: <%= System.getProperty("jvmRoute", "未设置") %></li>
        <li>会话 ID: <%= session.getId() %></li>
        <li>当前时间: <%= new Date() %></li>
    </ul>
    
    <p><strong>会话测试：</strong></p>
    <%
        Integer visitCount = (Integer) session.getAttribute("visitCount");
        if (visitCount == null) {
            visitCount = 1;
        } else {
            visitCount++;
        }
        session.setAttribute("visitCount", visitCount);
    %>
    <p>访问次数: <%= visitCount %></p>
    
    <p><a href="<%= request.getRequestURI() %>">刷新页面</a></p>
</body>
</html>
```

## 第五步：性能优化

### 5.1 JVM 调优

为每个 Tomcat 实例配置合适的 JVM 参数，在 `bin/catalina.sh` 中添加：

```bash
JAVA_OPTS="$JAVA_OPTS -server -Xms2g -Xmx4g"
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC -XX:MaxGCPauseMillis=200"
JAVA_OPTS="$JAVA_OPTS -XX:+DisableExplicitGC"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8"
```

### 5.2 连接器调优

优化 Tomcat 连接器配置：

```xml
<Connector port="8080" 
           protocol="org.apache.coyote.http11.Http11NioProtocol"
           maxThreads="200" 
           minSpareThreads="10"
           maxSpareThreads="50"
           acceptCount="100"
           connectionTimeout="20000"
           enableLookups="false"
           compression="on"
           compressionMinSize="2048"
           compressableMimeType="text/html,text/xml,text/javascript,text/css,text/plain,application/javascript,application/json"/>
```

### 5.3 会话管理优化

考虑使用外部会话存储：

#### Redis 会话存储

添加 Redis 会话管理依赖并配置：

```xml
<!-- context.xml -->
<Context>
    <Manager className="de.javakaffee.web.msm.MemcachedBackupSessionManager"
             memcachedNodes="redis://192.168.1.100:6379"
             sticky="false"
             sessionBackupAsync="false"
             lockingMode="auto"
             requestUriIgnorePattern=".*\.(ico|png|gif|jpg|css|js)$"/>
</Context>
```

## 故障排除

### 常见问题及解决方案

#### 1. 集群节点无法通信

**症状**: 日志中出现连接超时或网络异常

**解决方案**:
- 检查防火墙设置，开放集群通信端口
- 验证网络连通性
- 确认 IP 地址配置正确

```bash
# 检查端口是否被占用
netstat -tulpn | grep 4000

# 测试网络连通性
telnet 192.168.1.10 4000
```

#### 2. 会话复制失败

**症状**: 会话数据在节点间不同步

**解决方案**:
- 确保应用程序中的会话对象实现了 Serializable
- 检查 `<distributable/>` 标签是否正确添加
- 验证集群配置是否一致

#### 3. 负载分配不均

**症状**: 请求都路由到同一个节点

**解决方案**:
- 检查负载均衡器配置
- 验证会话粘性配置
- 调整节点权重设置

## 监控和维护

### 监控指标

重要的监控指标包括：

- CPU 和内存使用率
- JVM 堆内存使用情况
- 垃圾回收频率和时间
- 请求响应时间
- 错误率和成功率
- 数据库连接池状态

### 日志管理

配置合适的日志级别和轮转策略：

```xml
<!-- logging.properties -->
java.util.logging.ConsoleHandler.level = INFO
java.util.logging.FileHandler.level = INFO
java.util.logging.FileHandler.pattern = /opt/tomcat/logs/catalina.%g.log
java.util.logging.FileHandler.limit = 50000000
java.util.logging.FileHandler.count = 10
```

## 最佳实践

1. **会话数据最小化**: 只在会话中存储必要的数据
2. **无状态设计**: 尽量设计无状态的应用程序
3. **健康检查**: 实现应用程序健康检查端点
4. **版本控制**: 确保集群中所有节点运行相同版本的应用程序
5. **监控告警**: 建立完善的监控和告警机制
6. **定期备份**: 定期备份配置文件和应用程序
7. **容量规划**: 根据业务增长制定容量扩展计划

## 总结

Tomcat 集群配置虽然相对复杂，但能够显著提高应用程序的可用性和性能。通过合理的架构设计、正确的配置和持续的监控维护，可以构建一个稳定可靠的 Tomcat 集群环境。

在生产环境中部署前，建议进行充分的测试，包括功能测试、性能测试和故障转移测试，确保集群能够满足业务需求。