---
title: Log4j 教程
category:
  - 日志框架
tag:
  - Log4j
---

# Log4j 教程

## 目录

[[toc]]

## 1. 简介

Log4j（Log For Java）是 Apache 的一个开源项目，它是一个功能强大且灵活的日志记录框架。通过 Log4j，我们可以灵活地记录日志信息，并且可以通过配置文件灵活配置日志的记录格式、记录级别、输出格式，而不需要修改已有的日志记录代码。

## 2. Log4j 核心组件

Log4j 主要由三个核心组件构成：

### 2.1 Logger（日志记录器）
- **功能**: 完成日志信息的处理
- **作用**: 定义输出的层次和决定信息是否输出
- **级别**: DEBUG < INFO < WARN < ERROR < FATAL

### 2.2 Appender（输出目的地）
设置日志信息的去向，常用的 Appender 包括：

- `org.apache.log4j.ConsoleAppender` - 控制台输出
- `org.apache.log4j.FileAppender` - 文件输出
- `org.apache.log4j.DailyRollingFileAppender` - 每天产生一个日志文件
- `org.apache.log4j.RollingFileAppender` - 文件大小到达指定尺寸时产生新文件
- `org.apache.log4j.WriterAppender` - 将日志以流格式发送到指定地方
- `org.apache.log4j.JdbcAppender` - 将日志保存到数据库中

### 2.3 Layout（输出格式）
设置日志信息的输出样式，包括：

- `org.apache.log4j.HTMLLayout` - 以HTML表格形式布局
- `org.apache.log4j.SimpleLayout` - 包含日志级别和信息字符串
- `org.apache.log4j.TTCCLayout` - 包含时间、线程、类别等信息
- `org.apache.log4j.PatternLayout` - 可灵活指定布局格式

## 3. 日志级别

Log4j 定义了以下日志级别（从低到高）：

1. **DEBUG** - 调试信息
2. **INFO** - 一般信息
3. **WARN** - 警告信息
4. **ERROR** - 错误信息
5. **FATAL** - 致命错误

还有两个特殊级别：
- **OFF** - 关闭所有日志输出
- **ALL** - 输出所有级别的日志

## 4. rootLogger 与 rootCategory

- **rootLogger**: 新的使用名称，对应 Logger 类
- **rootCategory**: 旧的使用名称，对应原来的 Category 类

由于 Logger 类是 Category 类的子类，因此 rootCategory 是旧的用法，不推荐使用。建议使用 rootLogger。

## 5. 配置文件

Log4j 支持两种配置文件格式：

### 5.1 Properties 格式配置（log4j.properties）

```properties
# 根日志配置：日志级别为INFO，输出到控制台(A1)和文件(A2)
log4j.rootLogger=INFO, A1, A2

# 为特定包配置日志级别
log4j.logger.com.jjm.util=INFO, A1, A2
log4j.logger.com.jjm.dao=DEBUG, A1

# 控制台输出配置
log4j.appender.A1=org.apache.log4j.ConsoleAppender
log4j.appender.A1.layout=org.apache.log4j.PatternLayout
log4j.appender.A1.layout.ConversionPattern=[%d{yyyy-MM-dd HH:mm:ss}][%C-%M]%m%n

# 文件输出配置
log4j.appender.A2=org.apache.log4j.RollingFileAppender
log4j.appender.A2.File=sshdemo.log
log4j.appender.A2.MaxFileSize=500KB
log4j.appender.A2.MaxBackupIndex=1
log4j.appender.A2.layout=org.apache.log4j.PatternLayout
log4j.appender.A2.layout.ConversionPattern=[%d{yyyy-MM-dd HH:mm:ss}][%C-%M]%m%n
```

### 5.2 XML 格式配置（log4j.xml）

#### 示例1

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE log4j:configuration SYSTEM "log4j.dtd">
<log4j:configuration xmlns:log4j="http://jakarta.apache.org/log4j/">
    <!-- 文件输出配置 -->
    <appender name="A1" class="org.apache.log4j.RollingFileAppender">
        <param name="File" value="sshdemo2.log" />
        <param name="MaxFileSize" value="1MB" />
        <param name="MaxBackupIndex" value="10" />
        <layout class="org.apache.log4j.PatternLayout">
            <param name="ConversionPattern" value="[%d{yyyy-MM-dd HH:mm:ss}][%C-%M]%m%n" />
        </layout>
    </appender>
    
    <!-- 控制台输出配置 -->
    <appender name="A2" class="org.apache.log4j.ConsoleAppender">
        <layout class="org.apache.log4j.PatternLayout">
            <param name="ConversionPattern" value="[%d{yyyy-MM-dd HH:mm:ss}][%C-%M]%m%n" />
        </layout>
    </appender>
    
    <!-- 特定 Logger 配置 -->
    <logger name="com.jjm.dao">
        <level value="DEBUG" />
        <appender-ref ref="A1" />
    </logger>
    
    <!-- 根 Logger 配置 -->
    <root>
        <priority value="DEBUG" />
        <appender-ref ref="A2" />
    </root>
</log4j:configuration>
```

#### 示例2

```xml
<configuration>
    <jmxConfigurator />

    <!-- 控制台输出 -->
    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 默认日志文件，按天滚动 -->
    <appender name="rollingFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/tunnel.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/tunnel.%d{yyyy-MM-dd}.log</fileNamePattern>
        </rollingPolicy>
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- watcher 日志，按天滚动 -->
    <appender name="watcher" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/watcher.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/watcher.%d{yyyy-MM-dd}.log</fileNamePattern>
        </rollingPolicy>
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 原始数据日志，按天滚动 -->
    <appender name="orignCode" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/origncode.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/origncode.%d{yyyy-MM-dd}.log</fileNamePattern>
        </rollingPolicy>
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 业务日志，按小时+大小滚动，压缩为zip -->
    <appender name="businessLogFile" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/business-%d{yyyy-MM-dd}.%i.zip</fileNamePattern>
            <timeBasedFileNamingAndTriggeringPolicy
                class="ch.qos.logback.core.rolling.SizeAndTimeBasedFNATP">
                <maxFileSize>10MB</maxFileSize>
            </timeBasedFileNamingAndTriggeringPolicy>
        </rollingPolicy>
        <encoder>
            <pattern>%d{HH:mm:ss.SSS},%msg%n</pattern>
        </encoder>
    </appender>

    <!-- Logger 级别定义 -->
    <logger name="com.joyxsys" level="INFO" />
    <logger name="org.springframework" level="ERROR" />
    <logger name="org.hibernate" level="ERROR" />
    <logger name="com.mchange" level="ERROR" />
    <logger name="org.apache" level="ERROR" />
    <logger name="org.quartz" level="ERROR" />

    <!-- 独立业务日志，不继承 root -->
    <logger name="business" level="ERROR" additivity="false">
        <appender-ref ref="businessLogFile" />
    </logger>

    <!-- 原始通信日志（DEBUG） -->
    <logger name="com.joyxsys.projects.tunnel.core.mina.LoggerFilter" level="DEBUG" additivity="false">
        <appender-ref ref="orignCode" />
    </logger>
    <logger name="com.joyxsys.projects.tunnel.core.mina.MinaByteDecoder" level="DEBUG" additivity="false">
        <appender-ref ref="orignCode" />
    </logger>

    <!-- watcher 监控日志 -->
    <logger name="com.joyxsys.projects.tunnel.util.Watcher" level="DEBUG" additivity="false">
        <appender-ref ref="watcher" />
    </logger>

    <!-- 根日志配置 -->
    <root level="INFO">
        <appender-ref ref="console" />
        <appender-ref ref="rollingFile" />
    </root>
</configuration>

```

## 6. PatternLayout 格式化参数

当使用 PatternLayout 时，可以使用以下参数来格式化日志输出：

- `%m` - 输出代码中指定的消息
- `%M` - 输出打印该条日志的方法名
- `%p` - 输出优先级（DEBUG、INFO、WARN、ERROR、FATAL）
- `%r` - 输出自应用启动到输出该日志信息耗费的毫秒数
- `%c` - 输出所属的类目（通常是类的全名）
- `%C` - 输出类名
- `%t` - 输出产生该日志事件的线程名
- `%n` - 输出换行符
- `%d` - 输出日志时间，可指定格式如：`%d{yyyy-MM-dd HH:mm:ss,SSS}`
- `%l` - 输出日志事件的发生位置及代码行数
- `%L` - 输出行号

## 7. Logger.getLogger 与 LogFactory.getLog 的区别

### 7.1 Logger.getLogger（直接使用 Log4j）
```java
import org.apache.log4j.Logger;

// 直接使用 Log4j
Logger logger = Logger.getLogger(MyClass.class);
```

**特点：**
- 来自 log4j 自己的包
- 需要 log4j 的 jar 包
- 只能依靠 log4j，耦合度高

### 7.2 LogFactory.getLog（通过 Commons Logging）
```java
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

// 通过 Commons Logging
Log log = LogFactory.getLog(MyClass.class);
```

**特点：**
- 来自 commons-logging 包
- 提供了日志门面，增加系统灵活性
- 可以随意替换底层日志实现

**Commons Logging 选择日志实现的顺序：**
1. 查找 classpath 下的 `commons-logging.properties` 配置文件
2. 查找系统环境变量 `org.apache.commons.logging.Log`
3. 查看 classpath 中是否有 Log4j 包，有则使用 Log4j
4. 使用 JDK 自身的日志实现类（JDK1.4+）
5. 使用 commons-logging 提供的 SimpleLog

## 8. SLF4J 与 Log4j 结合使用

### 8.1 什么是 SLF4J
SLF4J（Simple Logging Facade for Java）是一个日志门面，不是具体的日志解决方案。它提供了统一的日志记录接口，允许在部署时选择具体的日志系统。

### 8.2 使用步骤

**第一步：添加依赖包**
```
1. log4j-1.2.x.jar
2. slf4j-api-1.x.x.jar
3. slf4j-log4j12-1.x.x.jar
```

**第二步：添加 log4j.properties 配置文件**

**第三步：在 web.xml 中配置（Web项目）**
```xml
<!-- log4j配置文件位置 -->
<context-param>
    <param-name>log4jConfigLocation</param-name>
    <param-value>classpath:log4j.properties</param-value>
</context-param>

<!-- 利用spring来使用log4j -->
<listener>
    <listener-class>org.springframework.web.util.Log4jConfigListener</listener-class>
</listener>
```

**第四步：在代码中使用**
```java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MyClass {
    // 创建日志对象
    private static final Logger logger = LoggerFactory.getLogger(MyClass.class);
    
    public void doSomething() {
        // 使用占位符输出日志
        logger.info("测试：{}", "输出日志");
        logger.debug("调试信息");
        logger.warn("警告信息");
        logger.error("错误信息");
    }
}
```

## 9. 完整配置示例

### 9.1 详细的 properties 配置
```properties
# 根日志配置
# 日志输出级别（INFO）和输出位置（stdout，R）
log4j.rootLogger=INFO, stdout, R

# 控制台输出
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=[QC] %p [%t] %C.%M(%L) | %m%n

# 文件输出（按日期滚动）
log4j.appender.R=org.apache.log4j.DailyRollingFileAppender
log4j.appender.R.File=D:\\logs\\app.log
log4j.appender.R.layout=org.apache.log4j.PatternLayout
log4j.appender.R.layout.ConversionPattern=%d-[TS] %p %t %c - %m%n

# 特定包的日志级别配置
log4j.logger.com.alibaba=DEBUG
log4j.logger.com.opensymphony.oscache=ERROR
log4j.logger.org.springframework=DEBUG
log4j.logger.com.ibatis.db=WARN
log4j.logger.org.apache.velocity=FATAL
log4j.logger.org.hibernate=DEBUG
```

::: tip

* **log4j.rootCategory=INFO, stdout , R**

此句为将等级为INFO的日志信息输出到stdout和R这两个目的地，stdout和R的定义在下面的代码，可以任意起名。等级可分为**OFF**、**FATAL**、**ERROR**、**WARN**、**INFO**、**DEBUG**、**ALL**，如果配置OFF则不打出任何信息，如果配置为INFO这样只显示INFO, WARN, ERROR的log信息，而DEBUG信息不会被显示，具体讲解可参照第三部分定义配置文件中的logger。

* **log4j.appender.stdout=org.apache.log4j.ConsoleAppender**

此句为定义名为stdout的输出端是哪种类型，可以是org.apache.log4j.ConsoleAppender（控制台），org.apache.log4j.FileAppender（文件），org.apache.log4j.DailyRollingFileAppender（每天产生一个日志文件），org.apache.log4j.RollingFileAppender（文件大小到达指定尺寸的时候产生一个新的文件）org.apache.log4j.WriterAppender（将日志信息以流格式发送到任意指定的地方）

* **log4j.appender.stdout.layout=org.apache.log4j.PatternLayout**

此句为定义名为stdout的输出端的layout是哪种类型，可以是org.apache.log4j.HTMLLayout（以HTML表格形式布局），org.apache.log4j.PatternLayout（可以灵活地指定布局模式），org.apache.log4j.SimpleLayout（包含日志信息的级别和信息字符串），org.apache.log4j.TTCCLayout（包含日志产生的时间、线程、类别等等信息）

* **log4j.appender.stdout.layout.ConversionPattern= \[QC\] %p \[%t\] %C.%M(%L) | %m%n**

如果使用pattern布局就要指定的打印信息的具体格式ConversionPattern，打印参数如下：%m 输出代码中指定的消息；%M 输出打印该条日志的方法名；%p 输出优先级，即DEBUG，INFO，WARN，ERROR，FATAL；%r 输出自应用启动到输出该log信息耗费的毫秒数；%c 输出所属的类目，通常就是所在类的全名；%t 输出产生该日志事件的线程名；%n 输出一个回车换行符，Windows平台为"rn”，Unix平台为"n”；%d 输出日志时间点的日期或时间，默认格式为ISO8601，也可以在其后指定格式，比如：%d{yyyy-MM-dd HH:mm:ss,SSS}，输出类似：2002-10-18 22:10:28,921；%l 输出日志事件的发生位置，及在代码中的行数；[QC]是log信息的开头，可以为任意字符，一般为项目简称。输出示例[TS] DEBUG [main] AbstractBeanFactory.getBean(189) | Returning cached instance of singleton bean 'MyAutoProxy'

:::

## 10. 最佳实践

[SpringBoot 配置log4j](../spring-boot/spring-boot-log4j.md)

## 11. 日志架构图

<iframe src="/html/log.html" width="100%" height="800"></iframe>

## 12. 参考资料

[官网](https://logging.apache.org/log4j/2.x/index.html)

## 13. 总结

Log4j 是一个功能强大的日志框架，通过合理的配置可以满足各种日志记录需求。结合 SLF4J 使用可以提供更好的灵活性和可维护性。在实际项目中，应该根据具体需求选择合适的配置方案，并遵循最佳实践来使用日志系统。