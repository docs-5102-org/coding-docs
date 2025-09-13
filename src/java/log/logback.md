---
title: Logback 教程
category:
  - 日志框架
tag:
  - Logback
---

# Logback 完整教程

## 目录

[[toc]]

## Logback 简介

Logback 是由 log4j 创始人设计的另一个开源日志组件，是 SLF4J 的原生实现。它具有更好的性能、更丰富的功能和更灵活的配置方式。

### 主要特性
- 更快的执行速度
- 更丰富的配置选项
- 自动重新加载配置文件
- 更优雅的异常处理
- 支持多种输出格式

## 配置文件基础

### 根节点 `<configuration>`

Logback 配置文件的根节点是 `<configuration>`，包含以下属性：

```xml
<configuration scan="true" scanPeriod="60 seconds" debug="false">
    <!-- 其他配置 -->
</configuration>
```

**属性说明：**
- `scan`: 是否自动扫描配置文件变化，默认为 true
- `scanPeriod`: 扫描间隔时间，默认为 1 分钟
- `debug`: 是否输出 logback 内部日志信息，默认为 false

### 子节点概览

根节点 `<configuration>` 可以包含以下子节点：

```
<configuration>
├── <contextName>        # 设置上下文名称
├── <property>           # 定义变量
├── <timestamp>          # 获取时间戳
├── <appender>           # 输出目的地配置
├── <logger>             # 日志记录器配置
└── <root>              # 根日志记录器
</configuration>
```

### 设置上下文名称

```xml
<configuration>
    <contextName>myAppName</contextName>
    <!-- 其他配置 -->
</configuration>
```

### 定义变量

```xml
<configuration>
    <property name="APP_Name" value="myAppName" />
    <contextName>${APP_Name}</contextName>
    
    <!-- 也可以从外部文件加载 -->
    <property file="application.properties" />
</configuration>
```

### 获取时间戳

```xml
<configuration>
    <timestamp key="bySecond" datePattern="yyyyMMdd'T'HHmmss"/>
    <contextName>${bySecond}</contextName>
</configuration>
```

## Logger 配置详解

### Logger 节点

`<logger>` 用于设置某个包或类的日志级别和输出目的地：

```xml
<logger name="com.example.package" level="INFO" additivity="false">
    <appender-ref ref="STDOUT"/>
</logger>
```

**属性说明：**
- `name`: 包名或类名
- `level`: 日志级别（TRACE, DEBUG, INFO, WARN, ERROR, ALL, OFF）
- `additivity`: 是否向上级传递日志，默认为 true

### Root Logger

根日志记录器，所有 logger 的父级：

```xml
<root level="INFO">
    <appender-ref ref="STDOUT" />
</root>
```

### 配置示例

#### 示例1：只配置 root

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

#### 示例2：带有 Logger 的配置

```xml
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 包级别配置 -->
    <logger name="com.example" level="DEBUG"/>
    
    <!-- 类级别配置，不向上传递 -->
    <logger name="com.example.SpecialClass" level="WARN" additivity="false">
        <appender-ref ref="STDOUT"/>
    </logger>

    <root level="INFO">
        <appender-ref ref="STDOUT" />
    </root>
</configuration>
```

## Appender 详解

Appender 负责将日志输出到指定目的地，Logback 提供多种类型的 Appender。

### ConsoleAppender - 控制台输出

将日志输出到控制台：

```xml
<appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <target>System.out</target>  <!-- System.out 或 System.err -->
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger{35} - %msg %n</pattern>
    </encoder>
</appender>
```

### FileAppender - 文件输出

将日志输出到文件：

```xml
<appender name="FILE" class="ch.qos.logback.core.FileAppender">
    <file>testFile.log</file>
    <append>true</append>  <!-- 是否追加到文件末尾 -->
    <prudent>false</prudent>  <!-- 是否安全写入 -->
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger{35} - %msg%n</pattern>
    </encoder>
</appender>
```

### RollingFileAppender - 滚动文件输出

最常用的 Appender，支持文件滚动：

#### 基于时间的滚动策略

```xml
<appender name="ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>logFile.log</file>
    
    <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
        <!-- 每天生成一个日志文件 -->
        <fileNamePattern>logFile.%d{yyyy-MM-dd}.log</fileNamePattern>
        <!-- 保留30天的日志文件 -->
        <maxHistory>30</maxHistory>
        <!-- 总大小限制 -->
        <totalSizeCap>3GB</totalSizeCap>
    </rollingPolicy>
    
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger{35} - %msg%n</pattern>
    </encoder>
</appender>
```

#### 基于大小的滚动策略

```xml
<appender name="SIZE_ROLLING_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
    <file>test.log</file>
    
    <rollingPolicy class="ch.qos.logback.core.rolling.FixedWindowRollingPolicy">
        <fileNamePattern>tests.%i.log.zip</fileNamePattern>
        <minIndex>1</minIndex>
        <maxIndex>3</maxIndex>
    </rollingPolicy>
    
    <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">
        <maxFileSize>5MB</maxFileSize>
    </triggeringPolicy>
    
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger{35} - %msg%n</pattern>
    </encoder>
</appender>
```

### SiftingAppender - 分离输出

根据 MDC (Mapped Diagnostic Context) 将日志分离到不同文件：

```xml
<appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
    <discriminator>
        <key>userid</key>
        <defaultValue>unknown</defaultValue>
    </discriminator>
    <sift>
        <appender name="FILE-${userid}" class="ch.qos.logback.core.FileAppender">
            <file>logs/user-${userid}.log</file>
            <encoder>
                <pattern>%d [%thread] %level %mdc %logger{35} - %msg%n</pattern>
            </encoder>
        </appender>
    </sift>
</appender>
```

### `Encoder` 和 `Pattern`

`Encoder` 负责将日志事件转换为字节数组，`PatternLayoutEncoder` 是最常用的编码器。

#### 常用转换符

| 转换符 | 作用 | 示例 |
|--------|------|------|
| `%d{pattern}` | 日期时间 | `%d{yyyy-MM-dd HH:mm:ss.SSS}` |
| `%thread` | 线程名 | `MAIN` |
| `%level` | 日志级别 | `INFO` |
| `%logger{length}` | Logger名称 | `%logger{36}` |
| `%msg` | 日志消息 | 实际的日志内容 |
| `%n` | 换行符 | 平台相关的换行符 |
| `%p` | 日志级别 | `INFO` |
| `%c{length}` | 类名 | `%c{10}` |
| `%M` | 方法名 | `methodName` |
| `%L` | 行号 | `123` |
| `%F` | 文件名 | `MyClass.java` |


#### 格式修饰符

- `-`: 左对齐
- 数字: 最小宽度
- `.数字`: 最大宽度

示例：
```
%-5level    # 左对齐，最小宽度5
%30logger   # 右对齐，最小宽度30
%.30logger  # 最大宽度30，超出部分截断
%-5.30logger # 左对齐，最小宽度5，最大宽度30
```

### 彩色输出配置

在控制台输出中使用颜色：

```xml
<appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
        <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %highlight(%-5level) [%thread] %cyan(%logger{36}) - %msg%n</pattern>
    </encoder>
</appender>
```

颜色转换符：
- `%highlight()`: 根据日志级别高亮显示
- `%red()`, `%green()`, `%yellow()`, `%blue()`, `%magenta()`, `%cyan()`, `%white()`: 指定颜色

## `Filter` 过滤器

过滤器可以对日志进行精细化控制，返回三种结果：
- `ACCEPT`: 接受日志
- `DENY`: 拒绝日志
- `NEUTRAL`: 交给下一个过滤器处理

### LevelFilter - 级别过滤器

只处理指定级别的日志：

```xml
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <filter class="ch.qos.logback.classic.filter.LevelFilter">
        <level>INFO</level>
        <onMatch>ACCEPT</onMatch>
        <onMismatch>DENY</onMismatch>
    </filter>
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger{30} - %msg%n</pattern>
    </encoder>
</appender>
```

### ThresholdFilter - 临界值过滤器

过滤低于指定级别的日志：

```xml
<appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
    <!-- 过滤掉 TRACE 和 DEBUG 级别的日志(过滤掉所有低于INFO级别的日志) -->
    <filter class="ch.qos.logback.classic.filter.ThresholdFilter">
        <level>INFO</level>
    </filter>
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger{30} - %msg%n</pattern>
    </encoder>
</appender>
```

### EvaluatorFilter - 表达式过滤器

使用 Java 表达式进行复杂过滤：

```xml
<appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <filter class="ch.qos.logback.core.filter.EvaluatorFilter">      
        <evaluator>
            <expression>return message.contains("billing");</expression>
        </evaluator>
        <OnMatch>ACCEPT</OnMatch>
        <OnMismatch>DENY</OnMismatch>
    </filter>
    <encoder>
        <pattern>%-4relative [%thread] %-5level %logger - %msg%n</pattern>
    </encoder>
</appender>
```

#### 使用 Matcher 进行正则匹配

```xml
<filter class="ch.qos.logback.core.filter.EvaluatorFilter">
    <evaluator>           
        <matcher>
            <Name>odd</Name>
            <regex>statement [13579]</regex>
        </matcher>
        <expression>odd.matches(formattedMessage)</expression>
    </evaluator>
    <OnMismatch>NEUTRAL</OnMismatch>
    <OnMatch>DENY</OnMatch>
</filter>
```

#### 表达式中可用的变量

| 变量名 | 类型 | 描述 |
|--------|------|------|
| event | LoggingEvent | 日志事件对象 |
| message | String | 原始日志消息 |
| formattedMessage | String | 格式化后的日志消息 |
| logger | String | Logger 名称 |
| level | int | 日志级别对应的整数值 |
| timeStamp | long | 时间戳 |
| marker | Marker | 标记对象 |
| mdc | Map | MDC 映射表 |
| throwable | Throwable | 异常对象 |

## 高级功能

### MDC (Mapped Diagnostic Context)

MDC 允许在日志中添加上下文信息：

#### Java 代码中使用 MDC

```java
import org.slf4j.MDC;

public class UserService {
    public void processUser(String userId) {
        MDC.put("userId", userId);
        log.info("Processing user");
        // ... 业务逻辑
        MDC.clear(); // 清理MDC
    }
}
```

#### 配置文件中使用 MDC

```xml
<encoder>
    <pattern>%d [%thread] %level [%X{userId}] %logger{35} - %msg%n</pattern>
</encoder>
```

### 异步日志

使用 AsyncAppender 提高性能：

```xml
<appender name="FILE" class="ch.qos.logback.core.FileAppender">
    <file>myapp.log</file>
    <encoder>
        <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
    </encoder>
</appender>

<appender name="ASYNC" class="ch.qos.logback.classic.AsyncAppender">
    <appender-ref ref="FILE" />
    <queueSize>512</queueSize>
    <discardingThreshold>0</discardingThreshold>
    <includeCallerData>false</includeCallerData>
</appender>

<root level="INFO">
    <appender-ref ref="ASYNC" />
</root>
```

### 条件配置

根据不同环境使用不同配置：

```xml
<configuration>
    <springProfile name="dev">
        <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="DEBUG">
            <appender-ref ref="STDOUT" />
        </root>
    </springProfile>

    <springProfile name="prod">
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/application.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>logs/application.%d{yyyy-MM-dd}.log</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
            <encoder>
                <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="INFO">
            <appender-ref ref="FILE" />
        </root>
    </springProfile>
</configuration>
```

## 实用示例

### 完整的生产环境配置

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration scan="true" scanPeriod="30 seconds">
    
    <!-- 定义变量 -->
    <property name="LOG_HOME" value="logs" />
    <property name="APP_NAME" value="myapp" />
    
    <!-- 控制台输出 -->
    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} %highlight(%-5level) [%thread] %cyan(%logger{50}) - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 文件输出 -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_HOME}/${APP_NAME}.log</file>
        
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${LOG_HOME}/${APP_NAME}.%d{yyyy-MM-dd}.%i.log.gz</fileNamePattern>
            <maxFileSize>100MB</maxFileSize>
            <maxHistory>30</maxHistory>
            <totalSizeCap>3GB</totalSizeCap>
        </rollingPolicy>
        
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 错误日志单独输出 -->
    <appender name="ERROR_FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${LOG_HOME}/${APP_NAME}-error.log</file>
        
        <filter class="ch.qos.logback.classic.filter.LevelFilter">
            <level>ERROR</level>
            <onMatch>ACCEPT</onMatch>
            <onMismatch>DENY</onMismatch>
        </filter>
        
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${LOG_HOME}/${APP_NAME}-error.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        
        <encoder>
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <!-- 异步输出 -->
    <appender name="ASYNC_FILE" class="ch.qos.logback.classic.AsyncAppender">
        <appender-ref ref="FILE"/>
        <queueSize>1024</queueSize>
        <discardingThreshold>80</discardingThreshold>
        <maxFlushTime>2000</maxFlushTime>
        <neverBlock>true</neverBlock>
    </appender>
    
    <!-- 第三方库日志级别控制 -->
    <logger name="org.springframework" level="INFO"/>
    <logger name="org.hibernate" level="WARN"/>
    <logger name="com.zaxxer.hikari" level="WARN"/>
    
    <!-- 应用日志 -->
    <logger name="com.example" level="DEBUG" additivity="false">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="ASYNC_FILE"/>
        <appender-ref ref="ERROR_FILE"/>
    </logger>
    
    <!-- 根日志配置 -->
    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
        <appender-ref ref="ASYNC_FILE"/>
        <appender-ref ref="ERROR_FILE"/>
    </root>
    
</configuration>
```

### 按用户分离日志文件

使用 SiftingAppender 为每个用户创建独立的日志文件：

```xml
<appender name="SIFT" class="ch.qos.logback.classic.sift.SiftingAppender">
    <discriminator>
        <key>userid</key>
        <defaultValue>system</defaultValue>
    </discriminator>
    <sift>
        <appender name="FILE-${userid}" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/user-${userid}.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>logs/user-${userid}.%d{yyyy-MM-dd}.log</fileNamePattern>
                <maxHistory>30</maxHistory>
            </rollingPolicy>
            <encoder>
                <pattern>%d [%thread] %level %logger{35} - %msg%n</pattern>
            </encoder>
        </appender>
    </sift>
</appender>
```

Java 代码中使用：

```java
@RestController
public class UserController {
    
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    
    @GetMapping("/user/{userId}")
    public String getUser(@PathVariable String userId) {
        MDC.put("userid", userId);
        try {
            logger.info("Getting user: {}", userId);
            // 业务逻辑
            return "User data";
        } finally {
            MDC.clear();
        }
    }
}
```

## 调用顺序

Spring boot调用logback顺序

application.yml或application.properties指定日志文件名称--->logback.xml--->logback-spring.xml--->logback-*.xml

## 日志架构图

<iframe src="/html/log.html" width="100%" height="800"></iframe>

## 最佳实践

### 1. 配置文件组织

- 使用 `logback-spring.xml` 作为 Spring Boot 项目的配置文件名
- 将不同环境的配置分离
- 使用变量定义公共配置

### 2. 性能优化

- 使用异步 Appender 提高性能
- 合理设置日志级别，避免过多的 DEBUG 日志
- 使用参数化日志消息：`log.info("User {} logged in", username)`

## 参考资料

[官网文档](https://logback.qos.ch/manual/index.html)

## 总结

Logback 是一个功能强大且灵活的日志框架，通过合理的配置可以满足各种复杂的日志需求。关键是要根据实际的应用场景选择合适的 Appender、Filter 和配置策略，同时注意性能和安全性的平衡。

掌握 Logback 的配置和使用，将大大提高应用程序的可维护性和问题排查效率。