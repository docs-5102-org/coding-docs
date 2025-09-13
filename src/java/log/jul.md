---
title: jul 教程
category:
  - 日志框架
tag:
  - java.util.logging
---

# JUL (Java Util Logging) 详细指南

## 概述

JUL (Java Util Logging) 是Java SE平台内置的日志框架，从JDK 1.4开始引入。它提供了一套完整的日志记录功能，无需额外依赖第三方库，是Java标准库的一部分。

## 核心组件

### 1. Logger (日志记录器)
Logger是JUL框架的核心组件，负责记录日志消息。

#### 获取Logger实例
```java
import java.util.logging.Logger;

// 获取Logger实例
Logger logger = Logger.getLogger("MyLogger");

// 通常使用类名作为Logger名称
Logger logger = Logger.getLogger(MyClass.class.getName());

// 获取全局Logger
Logger globalLogger = Logger.getGlobal();
```

#### Logger层次结构
JUL采用树形层次结构来组织Logger：
- 根Logger：`""`（空字符串）
- 父子关系：通过点号分隔，如`com.example.MyClass`的父Logger是`com.example`

```java
Logger rootLogger = Logger.getLogger("");
Logger comLogger = Logger.getLogger("com");
Logger exampleLogger = Logger.getLogger("com.example");
Logger classLogger = Logger.getLogger("com.example.MyClass");
```

### 2. Handler (处理器)
Handler负责将日志记录输出到不同的目的地。

#### 内置Handler类型

| Handler类型 | 描述 | 输出目标 |
|------------|------|----------|
| ConsoleHandler | 控制台处理器 | System.err |
| FileHandler | 文件处理器 | 文件 |
| SocketHandler | 网络套接字处理器 | 网络socket |
| MemoryHandler | 内存处理器 | 内存缓冲区 |
| StreamHandler | 流处理器 | OutputStream |

#### Handler使用示例
```java
import java.util.logging.*;
import java.io.IOException;

Logger logger = Logger.getLogger("MyLogger");

// 添加控制台处理器
ConsoleHandler consoleHandler = new ConsoleHandler();
logger.addHandler(consoleHandler);

// 添加文件处理器
try {
    FileHandler fileHandler = new FileHandler("app.log");
    logger.addHandler(fileHandler);
} catch (IOException e) {
    e.printStackTrace();
}

// 设置不使用父Handler（避免重复输出）
logger.setUseParentHandlers(false);
```

### 3. Level (日志级别)
JUL定义了7个标准日志级别，按严重程度排序：

| 级别 | 数值 | 描述 | 使用场景 |
|------|------|------|----------|
| SEVERE | 1000 | 严重错误 | 系统崩溃、严重异常 |
| WARNING | 900 | 警告 | 潜在问题、不推荐的用法 |
| INFO | 800 | 信息 | 一般信息性消息 |
| CONFIG | 700 | 配置 | 配置信息 |
| FINE | 500 | 细节 | 跟踪信息 |
| FINER | 400 | 更细节 | 详细跟踪信息 |
| FINEST | 300 | 最细节 | 非常详细的跟踪信息 |

#### 特殊级别
- `Level.OFF`：关闭所有日志记录
- `Level.ALL`：启用所有级别的日志记录

#### 设置日志级别
```java
Logger logger = Logger.getLogger("MyLogger");

// 设置Logger级别
logger.setLevel(Level.INFO);

// 设置Handler级别
ConsoleHandler handler = new ConsoleHandler();
handler.setLevel(Level.WARNING);
logger.addHandler(handler);
```

### 4. Formatter (格式化器)
Formatter负责格式化日志记录的输出格式。

#### 内置Formatter类型

| Formatter类型 | 描述 | 输出格式 |
|--------------|------|----------|
| SimpleFormatter | 简单格式化器 | 人类可读的文本格式 |
| XMLFormatter | XML格式化器 | XML格式 |

#### 自定义Formatter
```java
import java.util.logging.Formatter;
import java.util.logging.LogRecord;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CustomFormatter extends Formatter {
    private final DateTimeFormatter dateFormatter = 
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    @Override
    public String format(LogRecord record) {
        return String.format("[%s] %s - %s: %s%n",
            LocalDateTime.now().format(dateFormatter),
            record.getLevel(),
            record.getLoggerName(),
            record.getMessage()
        );
    }
}

// 使用自定义Formatter
ConsoleHandler handler = new ConsoleHandler();
handler.setFormatter(new CustomFormatter());
logger.addHandler(handler);
```

### 5. Filter (过滤器)
Filter用于更精确地控制哪些日志记录应该被发布。

```java
import java.util.logging.Filter;
import java.util.logging.LogRecord;

public class CustomFilter implements Filter {
    @Override
    public boolean isLoggable(LogRecord record) {
        // 只记录包含"ERROR"的消息
        return record.getMessage().contains("ERROR");
    }
}

// 应用过滤器
logger.setFilter(new CustomFilter());
```

## 基本使用

### 简单日志记录
```java
import java.util.logging.Logger;
import java.util.logging.Level;

public class JULExample {
    private static final Logger logger = 
        Logger.getLogger(JULExample.class.getName());
    
    public static void main(String[] args) {
        // 不同级别的日志记录
        logger.severe("这是一个严重错误");
        logger.warning("这是一个警告");
        logger.info("这是一般信息");
        logger.config("这是配置信息");
        logger.fine("这是细节信息");
        logger.finer("这是更细节的信息");
        logger.finest("这是最细节的信息");
        
        // 使用log方法
        logger.log(Level.INFO, "使用log方法记录信息");
        
        // 记录异常
        try {
            int result = 1 / 0;
        } catch (Exception e) {
            logger.log(Level.SEVERE, "发生异常", e);
        }
    }
}
```

### 参数化日志消息
```java
// 使用MessageFormat风格的参数
logger.info("用户 {0} 在 {1} 登录了系统");
logger.log(Level.INFO, "用户 {0} 在 {1} 登录了系统", 
           new Object[]{"张三", new Date()});

// 使用Supplier避免不必要的字符串拼接
logger.info(() -> "耗时操作结果: " + expensiveOperation());
```

## 配置管理

### 1. 程序化配置
```java
import java.util.logging.*;

public class JULConfig {
    public static void configureLogger() {
        Logger logger = Logger.getLogger("com.example");
        
        // 移除默认处理器
        Logger rootLogger = Logger.getLogger("");
        Handler[] handlers = rootLogger.getHandlers();
        for (Handler handler : handlers) {
            rootLogger.removeHandler(handler);
        }
        
        // 添加控制台处理器
        ConsoleHandler consoleHandler = new ConsoleHandler();
        consoleHandler.setLevel(Level.ALL);
        consoleHandler.setFormatter(new SimpleFormatter());
        
        // 添加文件处理器
        try {
            FileHandler fileHandler = new FileHandler("app.log", true);
            fileHandler.setLevel(Level.INFO);
            fileHandler.setFormatter(new SimpleFormatter());
            logger.addHandler(fileHandler);
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        logger.addHandler(consoleHandler);
        logger.setLevel(Level.ALL);
        logger.setUseParentHandlers(false);
    }
}
```

### 2. 配置文件配置
JUL可以通过属性文件进行配置，默认配置文件位于`$JAVA_HOME/jre/lib/logging.properties`。

#### 自定义配置文件 (logging.properties)
```properties
# 根Logger配置
.level = INFO

# 控制台处理器配置
java.util.logging.ConsoleHandler.level = ALL
java.util.logging.ConsoleHandler.formatter = java.util.logging.SimpleFormatter

# 文件处理器配置
java.util.logging.FileHandler.level = INFO
java.util.logging.FileHandler.pattern = app-%g.log
java.util.logging.FileHandler.count = 5
java.util.logging.FileHandler.maxBytes = 1000000
java.util.logging.FileHandler.formatter = java.util.logging.SimpleFormatter

# 特定Logger配置
com.example.level = FINE
com.example.handlers = java.util.logging.FileHandler

# SimpleFormatter格式配置
java.util.logging.SimpleFormatter.format = [%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS] %4$s %2$s - %5$s%6$s%n
```

#### 加载自定义配置文件
```java
import java.util.logging.LogManager;
import java.io.FileInputStream;

// 方法1: 系统属性指定
System.setProperty("java.util.logging.config.file", "my-logging.properties");

// 方法2: 程序加载
try {
    LogManager.getLogManager().readConfiguration(
        new FileInputStream("my-logging.properties"));
} catch (Exception e) {
    e.printStackTrace();
}
```

## 高级特性

### 1. 文件轮转
```java
// 创建支持文件轮转的FileHandler
// 模式: app-0.log, app-1.log, ...
// 最多保留5个文件，每个文件最大1MB
FileHandler fileHandler = new FileHandler(
    "app-%g.log",    // 文件名模式
    1024 * 1024,     // 最大字节数
    5,               // 文件数量
    true             // 追加模式
);
```

### 2. 性能优化

#### 级别检查
```java
// 避免不必要的字符串拼接
if (logger.isLoggable(Level.FINE)) {
    logger.fine("详细信息: " + expensiveToString());
}

// 使用Supplier（Java 8+）
logger.fine(() -> "详细信息: " + expensiveToString());
```

#### 异步日志记录
```java
public class AsyncHandler extends Handler {
    private final BlockingQueue<LogRecord> queue = new LinkedBlockingQueue<>();
    private final Handler target;
    private final Thread worker;
    
    public AsyncHandler(Handler target) {
        this.target = target;
        this.worker = new Thread(this::processRecords);
        this.worker.setDaemon(true);
        this.worker.start();
    }
    
    @Override
    public void publish(LogRecord record) {
        if (isLoggable(record)) {
            queue.offer(record);
        }
    }
    
    private void processRecords() {
        while (!Thread.currentThread().isInterrupted()) {
            try {
                LogRecord record = queue.take();
                target.publish(record);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
    }
    
    @Override
    public void flush() {
        target.flush();
    }
    
    @Override
    public void close() throws SecurityException {
        worker.interrupt();
        target.close();
    }
}
```

### 3. MDC (Mapped Diagnostic Context) 模拟
JUL本身不支持MDC，但可以通过ThreadLocal模拟：

```java
public class MDC {
    private static final ThreadLocal<Map<String, String>> contextMap = 
        ThreadLocal.withInitial(HashMap::new);
    
    public static void put(String key, String value) {
        contextMap.get().put(key, value);
    }
    
    public static String get(String key) {
        return contextMap.get().get(key);
    }
    
    public static void clear() {
        contextMap.get().clear();
    }
    
    public static Map<String, String> getCopyOfContextMap() {
        return new HashMap<>(contextMap.get());
    }
}

// 自定义Formatter支持MDC
public class MDCFormatter extends Formatter {
    @Override
    public String format(LogRecord record) {
        Map<String, String> mdc = MDC.getCopyOfContextMap();
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("[%tF %tT] ", record.getMillis(), record.getMillis()));
        sb.append(record.getLevel()).append(" ");
        sb.append(record.getLoggerName()).append(" ");
        if (!mdc.isEmpty()) {
            sb.append(mdc).append(" ");
        }
        sb.append("- ").append(record.getMessage()).append("%n");
        return sb.toString();
    }
}
```

## 与其他日志框架的集成

### 1. 桥接到SLF4J
使用`jul-to-slf4j`桥接器将JUL日志重定向到SLF4J：

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>jul-to-slf4j</artifactId>
    <version>1.7.36</version>
</dependency>
```

```java
// 安装桥接器
SLF4JBridgeHandler.removeHandlersForRootLogger();
SLF4JBridgeHandler.install();
```

### 2. 从SLF4J桥接到JUL
使用`slf4j-jdk14`将SLF4J调用重定向到JUL：

```xml
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-jdk14</artifactId>
    <version>1.7.36</version>
</dependency>
```

## 日志架构图

<iframe src="/html/log.html" width="100%" height="800"></iframe>

## 最佳实践

### 1. Logger命名
```java
// 推荐：使用类的全限定名
private static final Logger logger = Logger.getLogger(MyClass.class.getName());

// 避免：使用硬编码的名称
private static final Logger logger = Logger.getLogger("MyLogger");
```

### 2. 异常记录
```java
try {
    // 业务逻辑
} catch (Exception e) {
    // 推荐：记录异常和上下文信息
    logger.log(Level.SEVERE, "处理订单时发生异常，订单ID: " + orderId, e);
    
    // 避免：只记录异常消息
    logger.severe(e.getMessage());
}
```

### 3. 性能考虑
```java
// 推荐：使用级别检查避免不必要的计算
if (logger.isLoggable(Level.FINE)) {
    logger.fine("详细信息: " + expensiveCalculation());
}

// 推荐：使用Supplier（Java 8+）
logger.fine(() -> "详细信息: " + expensiveCalculation());

// 避免：直接拼接可能不会输出的日志
logger.fine("详细信息: " + expensiveCalculation());
```

### 4. 配置管理
```java
// 推荐：在应用启动时统一配置
public class LoggingConfig {
    public static void initializeLogging() {
        try {
            // 加载自定义配置
            LogManager.getLogManager().readConfiguration(
                LoggingConfig.class.getResourceAsStream("/logging.properties"));
        } catch (Exception e) {
            // 使用默认配置
            System.err.println("无法加载日志配置，使用默认配置: " + e.getMessage());
        }
    }
}
```

## 优缺点分析

### 优点
1. **内置支持**：无需额外依赖，JDK自带
2. **标准化**：Java官方标准，API稳定
3. **功能完整**：支持层次化Logger、多种Handler、级别控制等
4. **轻量级**：占用内存和CPU资源相对较少
5. **配置灵活**：支持编程式和配置文件两种配置方式

### 缺点
1. **性能一般**：相比现代日志框架（如Logback）性能较低
2. **功能有限**：缺少现代特性如异步日志、MDC等
3. **配置复杂**：相比其他框架配置较为繁琐
4. **格式化限制**：内置格式化器功能有限
5. **社区支持**：相比第三方框架，社区活跃度较低

## 总结

JUL作为Java标准库的一部分，为Java应用提供了基础的日志记录功能。虽然在性能和功能上可能不如现代的第三方日志框架，但其内置的特性和零依赖的优势使其在某些场景下仍然是一个不错的选择。

对于简单的应用或者不希望引入额外依赖的项目，JUL是一个可靠的选择。但对于大型企业应用，建议考虑使用SLF4J + Logback或SLF4J + Log4j2的组合以获得更好的性能和更丰富的功能。