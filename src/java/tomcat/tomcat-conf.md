---
title:  Tomcat 配置详解
category:
  - Web容器
tag:
  - Tomcat  
---

# Tomcat 配置详解

## 一、Tomcat 目录结构

在开始配置之前，我们需要了解 Tomcat 的目录结构：

| 目录名 | 简介 |
|--------|------|
| bin | 存放启动和关闭tomcat脚本 |
| conf | 包含不同的配置文件，server.xml(Tomcat的主要配置文件)和web.xml |
| work | 存放jsp编译后产生的class文件 |
| webapps | 存放应用程序示例，以后要部署的应用程序也要放到此目录 |
| logs | 存放日志文件 |
| lib/jasper/common | 这三个目录主要存放tomcat所需的jar文件 |

## 二、Server.xml 配置文件详解

Server.xml 是 Tomcat 的核心配置文件，其结构如下：

```xml
<Server>
    <Listener />
    <GlobalNamingResources>
    </GlobalNamingResources>
    <Service>
        <Connector />
        <Engine>
            <Logger />
            <Realm />
            <Host>
                <Logger />
                <Context />
            </Host>
        </Engine>
    </Service>
</Server>
```

### 2.1 Server 元素

Server 元素代表整个容器，是 Tomcat 实例的顶层元素。

```xml
<Server port="8005" shutdown="SHUTDOWN" debug="0">
```

**主要属性：**
- `port`：指定一个端口，负责监听关闭 tomcat 的请求
- `shutdown`：指定向端口发送的命令字符串
- `className`：指定实现 org.apache.catalina.Server 接口的类，默认值为 org.apache.catalina.core.StandardServer

### 2.2 Service 元素

Service 元素由 org.apache.catalina.Service 接口定义，包含一个 Engine 元素和一个或多个 Connector。

```xml
<Service name="Catalina">
```

**主要属性：**
- `name`：指定 service 的名字
- `className`：指定实现 org.apache.catalina.Service 接口的类，默认为 org.apache.catalina.core.StandardService

### 2.3 Connector 元素

Connector 元素代表与客户程序实际交互的组件，负责接收客户请求，以及向客户返回响应结果。

```xml
<Connector port="8080" 
           maxThreads="50" 
           minSpareThreads="25"  
           maxSpareThreads="75" 
           enableLookups="false" 
           redirectPort="8443"  
           acceptCount="100" 
           debug="0" 
           connectionTimeout="20000"  
           disableUploadTimeout="true" />
```

**主要属性：**

| 属性 | 解释 |
|------|------|
| port | 指定服务器端要创建的端口号，并在这个端口监听来自客户端的请求 |
| minSpareThreads | 服务器启动时创建的处理请求的线程数 |
| maxThreads | 最大可以创建的处理请求的线程数 |
| enableLookups | 如果为true，则可以通过调用request.getRemoteHost()进行DNS查询来得到远程客户端的实际主机名，若为false则不进行DNS查询，而是返回其ip地址 |
| redirectPort | 指定服务器正在处理http请求时收到了一个SSL传输请求后重定向的端口号 |
| acceptCount | 指定当所有可以使用的处理请求的线程数都被使用时，可以放到处理队列中的请求数，超过这个数的请求将不予处理 |
| connectionTimeout | 指定超时的时间数(以毫秒为单位) |

### 2.4 Engine 元素

Engine 元素处理在同一个 Service 中所有 Connector 元素接收到的客户请求。

```xml
<Engine name="Catalina" defaultHost="localhost" debug="0">
```

**主要属性：**
- `name`：定义 Engine 的名字
- `defaultHost`：指定处理客户的默认主机名，在 Engine 中的 Host 子元素中必须定义这一主机
- `className`：指定实现 Engine 接口的类，默认值为 StandardEngine

### 2.5 Host 元素

Host 元素定义了一个虚拟主机，包含了一个或多个 Web 应用。

```xml
<Host name="localhost" 
      debug="0" 
      appBase="webapps" 
      unpackWARs="true" 
      autoDeploy="true">
```

**主要属性：**

| 属性 | 解释 |
|------|------|
| name | 指定主机名 |
| appBase | 应用程序基本目录，即存放应用程序的目录 |
| unpackWARs | 如果为true，则tomcat会自动将WAR文件解压，否则不解压，直接从WAR文件中运行应用程序 |
| autoDeploy | 如果设为true，表示Tomcat服务处于运行状态时，能够监测appBase下的文件，如果有新的web应用加入进来，会自动发布这个WEB应用 |
| deployOnStartup | 如果设为true，表示Tomcat服务器启动时会自动发布appBase目录下所有的Web应用 |

### 2.6 Context 元素

Context 元素代表一个 web 应用，运行在某个特定的虚拟主机上。

```xml
<Context path="" docBase="mycontext" debug="0" reloadable="true"/>
```

**主要属性：**

| 属性 | 描述 |
|------|------|
| path | web应用的context路径。如果context path为空字符串（""），这个context是所属Host的缺省web应用 |
| docBase | 该web应用的文档基准目录（Document Base），或者是WAR文件的路径 |
| reloadable | 如果为true，则tomcat会自动检测应用程序的/WEB-INF/lib和/WEB-INF/classes目录的变化，自动装载新的应用程序 |
| workDir | Context提供的临时目录的路径，用于servlet的临时读/写 |
| useNaming | 如果希望Catalina为该web应用使能一个JNDI InitialContext对象，设为true |
| crossContext | 如果想在应用内调用ServletContext.getContext()来返回其他web application的request dispatcher，设为true |
| cookies | 如果想利用cookies来传递session identifier，设为true |

## 三、Context 配置详解

### 3.1 Context 配置位置

Context 元素可以配置在以下位置：

1. **在 Host 元素中直接配置**
2. **在单独的 XML 文件中配置**：放在 `$CATALINA_HOME/conf/[enginename]/[hostname]/` 目录下

### 3.2 Context 配置示例

```xml
<Host name="localhost" appBase="" unpackWARs="true" autoDeploy="true">
    <Context docBase="webapps/hello" path="/hello" reloadable="true"/>
    <Context docBase="webapps/hello" path="/" reloadable="true"/>
    <Context docBase="webapps/cas" path="/cas" reloadable="true"/>
</Host>
```

**配置说明：**
- `appBase=""` 表示不自动加载 webapps 下的所有项目
- `docBase` 可以是相对路径（相对于 tomcat）也可以是绝对路径
- `path="/"` 表示默认应用，可以直接通过域名访问
- `path="/hello"` 表示通过 `http://localhost/hello` 访问

### 3.3 避免重复加载

当 `appBase="webapps"` 且配置了具体的 Context 时，应用会被加载两次：
1. 通过 appBase 自动加载
2. 通过 Context 配置加载

**解决方案：**
- 将 appBase 设置为空值 `appBase=""`
- 或者不在 Host 中配置 Context，让 appBase 自动加载

## 四、JNDI 数据源配置

### 4.1 全局配置（推荐）

在 `tomcat/conf/context.xml` 中配置：

```xml
<Resource name="jndi/mybatis"
          auth="Container"
          type="javax.sql.DataSource"
          driverClassName="com.mysql.jdbc.Driver"
          url="jdbc:mysql://localhost:3306/appdb"
          username="root"
          password="123456"
          maxActive="20"
          maxIdle="10"
          maxWait="10000"/>
```

### 4.2 局部配置方式一（不推荐）

在 `tomcat/conf/server.xml` 的 `<Host>` 标签内添加：

```xml
<Context path="/demo_jndi" docBase="/demo_jndi">
    <Resource name="jndi/mybatis"
              type="javax.sql.DataSource"
              driverClassName="com.mysql.jdbc.Driver"
              maxIdle="2"
              maxWait="5000"
              username="root"
              password="123456"
              url="jdbc:mysql://localhost:3306/appdb"
              maxActive="4"/>
</Context>
```

### 4.3 局部配置方式二（推荐）

在项目的 `META-INF` 目录下创建 `context.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Context>
    <Resource name="jndi/mybatis"
              auth="Container"
              type="javax.sql.DataSource"
              driverClassName="com.mysql.jdbc.Driver"
              url="jdbc:mysql://localhost:3306/appdb"
              username="root"
              password="123456"
              maxActive="20"
              maxIdle="10"
              maxWait="10000"/>    
</Context>
```

### 4.4 JNDI 测试代码

```java
public void testJNDI() throws NamingException, SQLException {
    Context ctx = new InitialContext();
    DataSource ds = (DataSource) ctx.lookup("java:comp/env/jndi/mybatis");
    Connection conn = ds.getConnection();
    System.out.println(conn.isClosed());
}
```

### 4.5 Web.xml 资源引用（可选）

在项目的 `web.xml` 中添加资源引用（Tomcat 5.x 后不再需要）：

```xml
<resource-ref>
    <description>JNDI DataSource</description>
    <res-ref-name>jndi/mybatis</res-ref-name>
    <res-type>javax.sql.DataSource</res-type>
    <res-auth>Container</res-auth>
</resource-ref>
```

## 五、Tomcat 请求处理流程

以请求 `http://localhost:8080/wsota/wsota_index.jsp` 为例：

1. **请求接收**：请求被发送到本机端口8080，被 Coyote HTTP/1.1 Connector 获得
2. **传递给Engine**：Connector 把该请求交给它所在的 Service 的 Engine 来处理
3. **Engine处理**：Engine 获得请求 localhost/wsota/wsota_index.jsp，匹配它所拥有的所有虚拟主机 Host
4. **Host匹配**：Engine 匹配到名为 localhost 的 Host
5. **Context匹配**：localhost Host 获得请求 /wsota/wsota_index.jsp，匹配它所拥有的所有 Context
6. **Context处理**：Host 匹配到路径为 /wsota 的 Context
7. **Servlet匹配**：path="/wsota" 的 Context 获得请求 /wsota_index.jsp，在 mapping table 中寻找对应的 servlet
8. **执行Servlet**：Context 匹配到 URL PATTERN 为 *.jsp 的 servlet，对应于 JspServlet 类
9. **构造对象**：构造 HttpServletRequest 对象和 HttpServletResponse 对象，调用 JspServlet 的 doGet 或 doPost 方法
10. **返回响应**：Context → Host → Engine → Connector → 客户端浏览器

## 六、管理配置

### 6.1 添加管理用户

编辑 `conf/tomcat-users.xml` 文件：

```xml
<user name="admin" password="admin" roles="standard,manager"/>
```

### 6.2 管理功能

- **应用程序列表**：`http://localhost:8080/manager/list`
- **重新装载应用程序**：`http://localhost:8080/manager/reload?path=/examples`
- **显示session信息**：`http://localhost:8080/manager/sessions?path=/examples`
- **启动应用程序**：`http://localhost:8080/manager/start?path=/examples`
- **关闭应用程序**：`http://localhost:8080/manager/stop?path=/examples`

## 七、最佳实践建议

1. **JNDI配置**：推荐使用全局配置方式，便于管理和复用
2. **Context配置**：推荐使用项目 META-INF/context.xml 的方式，不依赖 Tomcat
3. **性能优化**：
   - 设置 `enableLookups="false"` 关闭 DNS 查询
   - 合理配置线程数 `maxThreads` 和 `minSpareThreads`
   - 生产环境设置 `reloadable="false"`
4. **安全配置**：
   - 修改默认端口
   - 删除不必要的示例应用
   - 配置访问日志
5. **监控配置**：
   - 配置 JMX 监控
   - 设置合适的日志级别
   - 配置访问日志用于分析

## 八、注意事项

1. **XML格式**：注意配置文件的 XML 格式正确性，标签必须正确闭合
2. **端口冲突**：确保配置的端口没有被其他程序占用
3. **路径配置**：Context 的 path 在同一 Host 下必须唯一
4. **编码问题**：JSP 页面添加 `<%@ page contentType="text/html;charset=GB2312" %>`
5. **重启要求**：修改 server.xml 后需要重启 Tomcat 才能生效

通过以上配置详解，您应该能够熟练地配置和管理 Tomcat 服务器，根据实际需求进行优化调整。