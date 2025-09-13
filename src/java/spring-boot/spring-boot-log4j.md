---
title: 配置log4j
category:
  - Web框架
tag:
  - Spring Boot
  - log4j
---

# SpringBoot 配置log4j

## 概述

在SpringBoot项目中，默认使用的是logback日志框架。但在某些场景下，我们可能需要使用log4j来进行日志管理。本文档将详细介绍如何在SpringBoot项目中配置log4j日志输出。

## 配置步骤

### 1. 配置 pom.xml 父依赖

首先需要在`pom.xml`文件中配置SpringBoot的parent依赖，建议使用稳定版本：

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>1.2.5.RELEASE</version>
</parent>
```

> **版本说明**：选择1.2.5.RELEASE版本的原因是该版本包含完整的`spring-boot-starter-log4j.jar`支持。更高版本（如1.4.1.RELEASE）可能不包含此依赖包，会导致配置复杂化。

### 2. 移除默认日志依赖

SpringBoot默认集成了logback日志框架，需要移除相关依赖以避免冲突：

删除以下依赖（如果存在）：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-logging</artifactId>
</dependency>
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>log4j-over-slf4j</artifactId>
</dependency>
```

### 3. 排除默认日志并添加log4j依赖

虽然已经删除了直接的日志依赖，但SpringBoot的parent中仍然包含对`spring-boot-starter-logging`的间接依赖。需要显式排除并添加log4j支持：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-log4j</artifactId>
</dependency>
```

### 4. 创建log4j配置文件

在`src/main/resources`目录下创建`log4j.properties`文件：

```properties
# 根日志配置
log4j.rootLogger=info,ServerDailyRollingFile,stdout

# 文件输出配置 - 每日滚动日志
log4j.appender.ServerDailyRollingFile=org.apache.log4j.DailyRollingFileAppender
log4j.appender.ServerDailyRollingFile.DatePattern='.'yyyy-MM-dd
log4j.appender.ServerDailyRollingFile.File=D://test/test.log
log4j.appender.ServerDailyRollingFile.layout=org.apache.log4j.PatternLayout
log4j.appender.ServerDailyRollingFile.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} [%t] %-5p [%c] - %m%n
log4j.appender.ServerDailyRollingFile.Append=true

# 控制台输出配置
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%d yyyy-MM-dd HH:mm:ss %p [%c] %m%n
```

## 配置详解

### 日志级别说明
- `info`: 设置根日志级别为INFO，可根据需要调整为DEBUG、WARN、ERROR等
- `ServerDailyRollingFile`: 文件输出appender名称
- `stdout`: 控制台输出appender名称

### 文件输出配置说明
- **DailyRollingFileAppender**: 每日滚动文件输出器
- **DatePattern**: 日期模式，`'.'yyyy-MM-dd`表示每天创建新的日志文件
- **File**: 日志文件路径，请根据实际情况修改路径
- **ConversionPattern**: 日志输出格式
  - `%d{yyyy-MM-dd HH:mm:ss}`: 时间戳
  - `[%t]`: 线程名
  - `%-5p`: 日志级别（左对齐，占5个字符）
  - `[%c]`: 类名
  - `%m`: 日志消息
  - `%n`: 换行符

### 控制台输出配置说明
- **ConsoleAppender**: 控制台输出器
- 使用简化的输出格式便于开发调试

## 使用示例

配置完成后，在Java代码中使用日志：

```java
import org.apache.log4j.Logger;

@RestController
public class TestController {
    
    private static final Logger logger = Logger.getLogger(TestController.class);
    
    @GetMapping("/test")
    public String test() {
        logger.info("这是一条INFO级别的日志");
        logger.debug("这是一条DEBUG级别的日志");
        logger.warn("这是一条WARN级别的日志");
        logger.error("这是一条ERROR级别的日志");
        return "日志测试完成";
    }
}
```

## 注意事项

1. **版本兼容性**：不同的SpringBoot版本对log4j的支持可能有差异，建议使用经过验证的版本组合。

2. **依赖冲突**：确保完全移除了默认的日志依赖，否则可能出现日志无法正常输出的情况。

3. **文件路径**：日志文件路径需要确保应用程序有写入权限，建议使用相对路径或可配置的路径。

4. **日志级别**：生产环境建议使用INFO或WARN级别，避免DEBUG级别产生过多日志。

5. **文件大小控制**：对于高并发应用，考虑使用RollingFileAppender来控制单个日志文件的大小。

## 验证配置

完成配置后，重启SpringBoot应用，检查：

1. 控制台是否正常输出日志
2. 指定目录是否生成了日志文件
3. 日志格式是否符合预期
4. 日志级别过滤是否正常工作

配置成功后，应用程序将同时向控制台和文件输出日志，并且每天自动创建新的日志文件。