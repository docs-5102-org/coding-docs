---
title: Resin 入门教程
category:
  - Web容器
tag:
  - resin  
---

# Resin 入门教程

## 目录

[[toc]]

## 简介

Resin是CAUCHO公司开发的一款高性能Java应用服务器，对Servlet和JSP提供了良好的支持。Resin本身采用Java语言开发，内置了一个支持HTTP/1.1的Web服务器，具有优秀的性能表现。

**官方网站：** https://caucho.com/

### 版本区别
- **开源版本（GPL）**：免费使用，适合开发人员和低流量网站
- **专业版本**：收费版本，增加了缓存和负载均衡等生产环境特性

### 主要特性

- **高可靠性**：自动重启、死锁检测、内存管理
- **集群支持**：多服务器负载均衡
- **Session管理**：持久化和分布式Session
- **原生代码支持**：Windows和Linux系统优化
- **缓存系统**：HTTP代理缓存，提升性能
- **压缩支持**：Gzip过滤器减少带宽

## 安装与启动

### 系统要求
- JDK 1.5或更高版本
- 正确设置JAVA_HOME环境变量

### 安装步骤（Windows）

1. **下载Resin**
   - 访问 [官方下载页面](http://www.caucho.com/download/)
   - 建议下载ZIP版本，解压即可使用
   - **注意**：解压路径不能包含空格符

2. **启动Resin**
   
   方法一：使用Setup程序
   ```bash
   # 运行根目录下的setup.exe
   # 第一行填入Resin安装路径
   # 然后双击httpd.exe启动
   ```
   
   方法二：命令行启动
   ```bash
   java -jar resin-3.1.8/lib/resin.jar
   ```
   
   方法三：直接运行
   ```bash
   ./httpd.exe  # Windows
   ./httpd.sh   # Linux
   ```

3. **验证安装**
   - 打开浏览器访问：http://localhost:8080
   - 看到Resin默认页面表示安装成功

## 配置文件详解

### 核心配置文件

Resin的主要配置文件为 `conf/resin.conf`，这是一个XML格式的配置文件。

### 重要配置标签

#### 1. dependency-check-interval（依赖检查间隔）

Resin会定时检测资源变化，如果有变动会自动重启相关应用。

```xml
<!-- 生产环境建议设置为较长时间或-1禁用自动检测 -->
<dependency-check-interval>2s</dependency-check-interval>
<!-- 生产环境推荐设置 -->
<dependency-check-interval>600s</dependency-check-interval>
```

检测的资源包括：
- WEB-INF/classes下的class文件
- WEB-INF/lib下的jar文件
- WEB-INF/web.xml
- resin.conf配置文件
- 通过各种deploy配置的war文件

#### 2. server配置

一个server对应一个JVM实例：

```xml
<server-default>
    <!-- JVM参数设置 -->
    <jvm-arg>-Xmx256m</jvm-arg>
    <jvm-arg>-Xss1m</jvm-arg>
    
    <!-- HTTP服务端口 -->
    <http address="*" port="8080"/>
    
    <!-- 线程配置 -->
    <thread-max>256</thread-max>
    
    <!-- 超时设置 -->
    <socket-timeout>65s</socket-timeout>
    
    <!-- KeepAlive设置 -->
    <keepalive-max>128</keepalive-max>
    <keepalive-timeout>15s</keepalive-timeout>
</server-default>

<!-- 定义具体服务器 -->
<server id="" address="127.0.0.1" port="6800"/>
```

#### 3. 虚拟主机配置

```xml
<host id="example.com" root-directory="/var/www/example">
    <!-- 访问日志 -->
    <access-log path="logs/access.log" 
                format='%h %l %u %t "%r" %s %b "%{Referer}i" "%{User-Agent}i"'
                rollover-period="1W"/>
    
    <!-- Web应用部署目录 -->
    <web-app-deploy path="webapps"/>
</host>
```

#### 4. Web应用配置

```xml
<web-app id="/myapp" root-directory="/path/to/webapp">
    <!-- 静态资源缓存 -->
    <cache-mapping url-pattern="*.jpg" expires="60s"/>
    <cache-mapping url-pattern="*.css" expires="60s"/>
    
    <!-- Session配置 -->
    <session-config>
        <session-timeout>30</session-timeout>
        <enable-url-rewriting>false</enable-url-rewriting>
    </session-config>
</web-app>
```

## 应用部署

### 方法一：目录部署

1. 修改`resin.conf`文件，添加web-app配置：

```xml
<host id="" root-directory=".">
    <web-app id="/myapp" root-directory="D:\\workspace\\myproject\\WebRoot"/>
</host>
```

2. 重启Resin
3. 访问：http://localhost:8080/myapp

### 方法二：WAR文件部署

1. 将WAR文件放置到`webapps`目录
2. Resin会自动检测并部署应用
3. 访问：http://localhost:8080/[war文件名]

## 多实例配置

### 单机多服务

在一台机器上运行多个Resin实例：

1. **复制配置文件**
```bash
cp resin.conf resin_8081.conf
```

2. **修改端口配置**
```xml
<!-- 修改HTTP端口 -->
<http address="*" port="8081"/>
<!-- 修改管理端口 -->
<server id="server1" address="127.0.0.1" port="6801"/>
```

3. **启动指定配置**
```bash
./httpd.sh -conf conf/resin_8081.conf -server server1
```

### 集群配置

```xml
<cluster id="web-cluster">
    <server-default>
        <jvm-arg>-Xmx1024m</jvm-arg>
        <http port="8080"/>
    </server-default>
    
    <server id="web-a" address="192.168.1.10" port="6800"/>
    <server id="web-b" address="192.168.1.11" port="6800"/>
    
    <host id="">
        <web-app id="/" root-directory="webapps/ROOT"/>
    </host>
</cluster>
```

## 日志配置

### 基本日志设置

```xml
<!-- JDK日志配置 -->
<log name="" path="stdout:" timestamp="[%H:%M:%S.%s] "/>

<!-- 包级别日志控制 -->
<logger name="com.caucho" level="info"/>
<logger name="com.caucho.java" level="config"/>
```

### 详细日志配置

```xml
<host-default>
    <!-- 访问日志 -->
    <access-log path="logs/${host.name}/access.log"
               archive-format="access-%Y%m%d.log.gz"
               format='%h %l %u %t "%r" %s %b'
               rollover-size="10mb"
               rollover-period="1D"/>
    
    <!-- 标准输出日志 -->
    <stdout-log path="logs/${host.name}/stdout.log"
               archive-format="stdout-%Y%m%d.log.gz"
               rollover-size="10mb"
               rollover-period="1D"/>
    
    <!-- 错误日志 -->
    <stderr-log path="logs/${host.name}/stderr.log"
               archive-format="stderr-%Y%m%d.log.gz"
               rollover-size="10mb"
               rollover-period="1D"/>
</host-default>
```

## 数据源配置

### JNDI数据源设置

```xml
<database>
    <jndi-name>jdbc/test</jndi-name>
    <driver type="com.mysql.jdbc.Driver">
        <url>jdbc:mysql://localhost:3306/testdb</url>
        <user>username</user>
        <password>password</password>
    </driver>
    <prepared-statement-cache-size>8</prepared-statement-cache-size>
    <max-connections>20</max-connections>
    <max-idle-time>30s</max-idle-time>
</database>
```

### Java代码中使用

```java
try {
    InitialContext context = new InitialContext();
    DataSource ds = (DataSource) context.lookup("java:comp/env/jdbc/test");
    Connection conn = ds.getConnection();
    // 使用连接...
} catch (Exception e) {
    e.printStackTrace();
}
```

## 常用命令

### 启动/停止命令

```bash
# 启动
./httpd.sh start

# 停止  
./httpd.sh stop

# 重启
./httpd.sh restart

# 指定配置文件启动
./httpd.sh -conf conf/myapp.conf restart

# 指定服务器ID启动
./httpd.sh -server myserver start
```

### 服务管理

```bash
# 启动指定服务
httpd start -server web1

# 停止指定服务  
httpd stop -server web1

# 重启指定服务
httpd restart -server web1
```

## 后台管理

### 启用管理界面

1. **修改配置文件**
```xml
<web-app id="/resin-admin" root-directory="${resin.home}/php/admin">
    <prologue>
        <resin:set var="resin_admin_external" value="true"/>
        <resin:set var="resin_admin_insecure" value="true"/>
    </prologue>
</web-app>
```

2. **创建管理用户**
```xml
<management path="${resin.root}/admin">
    <user name="admin" password="21232f297a57a5a743894a0e4a801fc3"/>
</management>
```

3. **访问管理界面**
   - 地址：http://localhost:8080/resin-admin
   - 使用配置的用户名密码登录

## 性能优化建议

### 生产环境配置

1. **禁用自动重载**
```xml
<dependency-check-interval>-1</dependency-check-interval>
```

2. **优化JVM参数**
```xml
<jvm-arg>-server</jvm-arg>
<jvm-arg>-Xmx2048m</jvm-arg>
<jvm-arg>-Xms2048m</jvm-arg>
<jvm-arg>-XX:+UseG1GC</jvm-arg>
```

3. **启用压缩**
```xml
<web-app-default>
    <filter filter-name="gzip" filter-class="com.caucho.filters.GzipFilter"/>
    <filter-mapping url-pattern="*" filter-name="gzip"/>
</web-app-default>
```

4. **配置缓存**
```xml
<cache-mapping url-pattern="*.js" expires="1h"/>
<cache-mapping url-pattern="*.css" expires="1h"/>
<cache-mapping url-pattern="*.jpg" expires="1d"/>
```

## 常见问题

### 1. 端口冲突
确保HTTP端口和管理端口不被其他程序占用。

### 2. 内存不足
适当调整JVM堆内存大小：
```xml
<jvm-arg>-Xmx1024m</jvm-arg>
```

### 3. 类加载问题
检查CLASSPATH设置和jar包冲突。

### 4. 权限问题
确保Resin对日志目录和应用目录有读写权限。

## 与IDE集成

### Eclipse集成

1. **添加Server Runtime**
   - Preferences -> Server -> Runtime Environments
   - Add -> Resin
   - 指定Resin安装路径

2. **手工集成方法**
   - 将`${RESIN_HOME}/lib`添加到项目classpath
   - 创建Run Configuration
   - Main class: `com.caucho.boot.ResinBoot`（3.1.x版本）

## 总结

Resin是一款功能强大的Java应用服务器，具有高性能、高可靠性的特点。通过合理配置可以满足从开发到生产环境的各种需求。掌握基本的配置和使用方法后，可以进一步探索其集群、缓存等高级特性。

**更多信息请访问：**
- 官方网站：https://caucho.com/
- 文档中心：https://caucho.com/docs/
- 下载页面：https://caucho.com/download/