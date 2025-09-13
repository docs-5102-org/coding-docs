---
title: Runner详解
category:
  - Web框架
tag:
  - Spring Boot
  - CommandLineRunner
  - ApplicationRunner
---

# SpringBoot CommandLineRunner和ApplicationRunner详解

## 目录

[[toc]]

## 概述

在SpringBoot应用程序中，有时我们需要在应用启动完成后立即执行一些初始化任务，比如数据预加载、缓存预热、定时任务启动等。SpringBoot提供了两个非常有用的接口来实现这个需求：`CommandLineRunner`和`ApplicationRunner`。

## CommandLineRunner接口

### 定义和作用

`CommandLineRunner`是SpringBoot提供的一个函数式接口，用于在SpringBoot应用程序启动完成后执行一些代码。

```java
@FunctionalInterface
public interface CommandLineRunner {
    void run(String... args) throws Exception;
}
```

### 基本用法

#### 1. 实现CommandLineRunner接口

```java
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class MyCommandLineRunner implements CommandLineRunner {
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("CommandLineRunner执行中...");
        System.out.println("接收到的参数: " + Arrays.toString(args));
        
        // 执行初始化任务
        initializeData();
    }
    
    private void initializeData() {
        System.out.println("执行数据初始化任务");
        // 具体的初始化逻辑
    }
}
```

#### 2. 使用@Bean注解方式

```java
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RunnerConfig {
    
    @Bean
    public CommandLineRunner commandLineRunner() {
        return args -> {
            System.out.println("通过@Bean方式创建的CommandLineRunner");
            System.out.println("参数: " + Arrays.toString(args));
        };
    }
}
```

#### 3. Lambda表达式方式

```java
@SpringBootApplication
public class Application {
    
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
    
    @Bean
    public CommandLineRunner demo() {
        return (args) -> {
            System.out.println("Lambda方式的CommandLineRunner");
            // 执行任务
        };
    }
}
```

## ApplicationRunner接口

### 定义和作用

`ApplicationRunner`与`CommandLineRunner`类似，但提供了更加结构化的参数处理方式。

```java
@FunctionalInterface
public interface ApplicationRunner {
    void run(ApplicationArguments args) throws Exception;
}
```

### 基本用法

#### 1. 实现ApplicationRunner接口

```java
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class MyApplicationRunner implements ApplicationRunner {
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("ApplicationRunner执行中...");
        
        // 获取非选项参数
        System.out.println("非选项参数: " + args.getNonOptionArgs());
        
        // 获取选项参数
        System.out.println("选项参数名: " + args.getOptionNames());
        
        // 检查特定选项是否存在
        if (args.containsOption("debug")) {
            System.out.println("debug选项的值: " + args.getOptionValues("debug"));
        }
        
        // 获取原始参数
        System.out.println("原始参数: " + Arrays.toString(args.getSourceArgs()));
    }
}
```

#### 2. 使用@Bean注解方式

```java
@Configuration
public class RunnerConfig {
    
    @Bean
    public ApplicationRunner applicationRunner() {
        return args -> {
            System.out.println("ApplicationRunner通过Bean方式执行");
            args.getOptionNames().forEach(optionName -> {
                System.out.println(optionName + "=" + args.getOptionValues(optionName));
            });
        };
    }
}
```

## 参数处理对比

### CommandLineRunner参数处理

```java
@Component
public class CommandLineRunnerExample implements CommandLineRunner {
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("CommandLineRunner接收到参数:");
        for (int i = 0; i < args.length; i++) {
            System.out.println("args[" + i + "] = " + args[i]);
        }
    }
}
```

### ApplicationRunner参数处理

```java
@Component
public class ApplicationRunnerExample implements ApplicationRunner {
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("ApplicationRunner参数处理:");
        
        // 处理非选项参数
        List<String> nonOptionArgs = args.getNonOptionArgs();
        System.out.println("非选项参数: " + nonOptionArgs);
        
        // 处理选项参数
        Set<String> optionNames = args.getOptionNames();
        for (String optionName : optionNames) {
            System.out.println("选项 --" + optionName + " 的值: " + args.getOptionValues(optionName));
        }
        
        // 原始参数
        System.out.println("原始参数: " + Arrays.toString(args.getSourceArgs()));
    }
}
```

**运行示例：**
```bash
java -jar myapp.jar --server.port=8080 --debug=true nonOptionArg1 nonOptionArg2
```

输出结果：
- CommandLineRunner会接收到：`["--server.port=8080", "--debug=true", "nonOptionArg1", "nonOptionArg2"]`
- ApplicationRunner可以区分：
  - 选项参数：`server.port=[8080]`, `debug=[true]`
  - 非选项参数：`[nonOptionArg1, nonOptionArg2]`

## 执行顺序控制

### 使用@Order注解

```java
import org.springframework.core.annotation.Order;

@Component
@Order(1)
public class FirstRunner implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("第一个执行的Runner");
    }
}

@Component
@Order(2)
public class SecondRunner implements ApplicationRunner {
    @Override
    public void run(ApplicationArguments args) throws Exception {
        System.out.println("第二个执行的Runner");
    }
}

@Component
@Order(3)
public class ThirdRunner implements CommandLineRunner {
    @Override
    public void run(String... args) throws Exception {
        System.out.println("第三个执行的Runner");
    }
}
```

### 实现Ordered接口

```java
import org.springframework.core.Ordered;

@Component
public class OrderedRunner implements CommandLineRunner, Ordered {
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("通过Ordered接口控制顺序的Runner");
    }
    
    @Override
    public int getOrder() {
        return 0; // 数值越小，优先级越高
    }
}
```

## 实际应用场景

### 1. 数据库初始化

```java
@Component
@Order(1)
public class DatabaseInitializer implements ApplicationRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (args.containsOption("init-db")) {
            System.out.println("开始初始化数据库数据...");
            
            // 创建默认角色
            if (roleRepository.count() == 0) {
                Role adminRole = new Role("ADMIN", "管理员");
                Role userRole = new Role("USER", "普通用户");
                roleRepository.saveAll(Arrays.asList(adminRole, userRole));
            }
            
            // 创建默认用户
            if (userRepository.count() == 0) {
                User admin = new User("admin", "admin@example.com");
                userRepository.save(admin);
            }
            
            System.out.println("数据库初始化完成!");
        }
    }
}
```

### 2. 缓存预热

```java
@Component
@Order(2)
public class CacheWarmer implements CommandLineRunner {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private ConfigService configService;
    
    @Override
    public void run(String... args) throws Exception {
        System.out.println("开始缓存预热...");
        
        // 预加载配置信息
        Map<String, String> configs = configService.getAllConfigs();
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            redisTemplate.opsForValue().set("config:" + entry.getKey(), entry.getValue());
        }
        
        System.out.println("缓存预热完成，共加载 " + configs.size() + " 项配置");
    }
}
```

### 3. 定时任务启动

```java
@Component
@Order(3)
public class SchedulerInitializer implements ApplicationRunner {
    
    @Autowired
    private TaskScheduler taskScheduler;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!args.containsOption("disable-scheduler")) {
            System.out.println("启动定时任务...");
            
            // 启动数据清理任务
            taskScheduler.scheduleAtFixedRate(this::cleanupExpiredData, 
                Duration.ofHours(1));
            
            // 启动状态检查任务
            taskScheduler.scheduleAtFixedRate(this::healthCheck, 
                Duration.ofMinutes(5));
            
            System.out.println("定时任务启动完成!");
        }
    }
    
    private void cleanupExpiredData() {
        // 清理过期数据的逻辑
    }
    
    private void healthCheck() {
        // 健康检查的逻辑
    }
}
```

### 4. 外部系统连接测试

```java
@Component
public class ExternalSystemChecker implements ApplicationRunner {
    
    @Autowired
    private RestTemplate restTemplate;
    
    @Value("${external.api.url}")
    private String externalApiUrl;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (args.containsOption("check-external")) {
            checkExternalSystems();
        }
    }
    
    private void checkExternalSystems() {
        System.out.println("检查外部系统连接状态...");
        
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                externalApiUrl + "/health", String.class);
            
            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("外部系统连接正常");
            } else {
                System.out.println("外部系统连接异常: " + response.getStatusCode());
            }
        } catch (Exception e) {
            System.err.println("外部系统连接失败: " + e.getMessage());
        }
    }
}
```

## 异常处理

### 基本异常处理

```java
@Component
public class SafeRunner implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(SafeRunner.class);
    
    @Override
    public void run(String... args) throws Exception {
        try {
            // 可能抛出异常的操作
            riskyOperation();
        } catch (Exception e) {
            logger.error("Runner执行过程中发生异常", e);
            // 根据需要决定是否重新抛出异常
            // throw e; // 重新抛出会导致应用启动失败
        }
    }
    
    private void riskyOperation() throws Exception {
        // 可能失败的操作
    }
}
```

### 条件执行

```java
@Component
public class ConditionalRunner implements ApplicationRunner {
    
    @Value("${app.runner.enabled:true}")
    private boolean runnerEnabled;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!runnerEnabled) {
            System.out.println("Runner被禁用，跳过执行");
            return;
        }
        
        if (args.containsOption("skip-init")) {
            System.out.println("跳过初始化");
            return;
        }
        
        // 执行初始化逻辑
        performInitialization();
    }
    
    private void performInitialization() {
        System.out.println("执行初始化操作...");
    }
}
```

## 最佳实践

### 1. 使用日志记录

```java
@Component
public class LoggingRunner implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingRunner.class);
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("开始执行CommandLineRunner");
        
        long startTime = System.currentTimeMillis();
        try {
            // 执行业务逻辑
            performTasks();
            
            long endTime = System.currentTimeMillis();
            logger.info("CommandLineRunner执行完成，耗时: {}ms", endTime - startTime);
        } catch (Exception e) {
            logger.error("CommandLineRunner执行失败", e);
            throw e;
        }
    }
    
    private void performTasks() {
        // 业务逻辑
    }
}
```

### 2. 配置驱动

```java
@Component
@ConfigurationProperties(prefix = "app.init")
public class ConfigurableRunner implements ApplicationRunner {
    
    private boolean enabled = true;
    private List<String> tasks = new ArrayList<>();
    private int timeout = 30;
    
    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (!enabled) {
            return;
        }
        
        for (String task : tasks) {
            executeTask(task);
        }
    }
    
    private void executeTask(String task) {
        System.out.println("执行任务: " + task);
        // 任务执行逻辑
    }
    
    // Getters and Setters
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    
    public List<String> getTasks() { return tasks; }
    public void setTasks(List<String> tasks) { this.tasks = tasks; }
    
    public int getTimeout() { return timeout; }
    public void setTimeout(int timeout) { this.timeout = timeout; }
}
```

对应的配置文件：
```yaml
app:
  init:
    enabled: true
    timeout: 60
    tasks:
      - "database-migration"
      - "cache-warming"
      - "index-building"
```

## 总结

### CommandLineRunner vs ApplicationRunner

| 特性 | CommandLineRunner | ApplicationRunner |
|------|------------------|-------------------|
| 参数类型 | String[] | ApplicationArguments |
| 参数处理 | 简单字符串数组 | 结构化参数对象 |
| 选项参数解析 | 需要手动解析 | 自动解析 |
| 使用便利性 | 简单场景更方便 | 复杂参数场景更方便 |
| 功能强度 | 基础 | 更强大 |

### 选择建议

- **使用CommandLineRunner**：当你只需要简单的启动后执行逻辑，不需要复杂的参数处理时
- **使用ApplicationRunner**：当你需要处理命令行选项参数，或需要更结构化的参数访问时

### 注意事项

1. **异常处理**：Runner中抛出的异常会导致应用启动失败
2. **执行顺序**：使用@Order或Ordered接口控制多个Runner的执行顺序
3. **性能考虑**：避免在Runner中执行耗时过长的操作，会延长应用启动时间
4. **条件执行**：通过配置或命令行参数控制Runner的执行
5. **日志记录**：适当添加日志以便调试和监控

通过合理使用CommandLineRunner和ApplicationRunner，可以优雅地处理SpringBoot应用的启动后初始化需求，提高应用的可维护性和用户体验。