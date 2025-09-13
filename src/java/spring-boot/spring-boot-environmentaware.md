---
title: EnvironmentAware接口实现
category:
  - Web框架
tag:
  - Spring Boot
  - EnvironmentAware
---

# Spring Boot EnvironmentAware接口实现

## 概述

EnvironmentAware是Spring框架提供的一个回调接口，用于获取应用程序的环境信息。通过实现这个接口，我们可以在Spring容器初始化bean实例之前，访问系统环境变量和application配置文件中的变量。

## 接口定义

EnvironmentAware接口只包含一个方法：

```java
public interface EnvironmentAware extends Aware {
    void setEnvironment(Environment environment);
}
```

## 核心特性

- **早期执行时机**：setEnvironment方法在Spring容器初始化bean实例之前执行
- **环境变量访问**：可以获取系统环境变量和配置文件变量
- **配置动态读取**：支持运行时读取各种配置源的属性值

## 基本实现示例

### 简单实现

```java
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class EnvironmentConfig implements EnvironmentAware {
    
    private static final Logger logger = LoggerFactory.getLogger(EnvironmentConfig.class);
    
    private Environment environment;
    
    @Override
    public void setEnvironment(Environment environment) {
        logger.info("setEnvironment====开始执行===");
        this.environment = environment;
        
        // 读取配置属性
        String appName = environment.getProperty("spring.application.name");
        String serverPort = environment.getProperty("server.port", "8080");
        
        logger.info("应用名称: {}", appName);
        logger.info("服务端口: {}", serverPort);
    }
}
```

### 结合ImportBeanDefinitionRegistrar使用

```java
import org.springframework.beans.factory.support.BeanDefinitionRegistry;
import org.springframework.context.EnvironmentAware;
import org.springframework.context.annotation.ImportBeanDefinitionRegistrar;
import org.springframework.core.env.Environment;
import org.springframework.core.type.AnnotationMetadata;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DynamicConfigRegistrar implements ImportBeanDefinitionRegistrar, EnvironmentAware {
    
    private static final Logger logger = LoggerFactory.getLogger(DynamicConfigRegistrar.class);
    
    private Environment environment;
    
    @Override
    public void setEnvironment(Environment environment) {
        logger.info("setEnvironment====开始执行===");
        this.environment = environment;
    }
    
    @Override
    public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, 
                                       BeanDefinitionRegistry registry) {
        logger.info("registerBeanDefinitions==开始执行===");
        
        // 基于环境变量动态注册Bean
        String dataSourceType = environment.getProperty("datasource.type", "hikari");
        
        if ("druid".equals(dataSourceType)) {
            // 注册Druid数据源相关Bean
            registerDruidDataSource(registry);
        } else {
            // 注册默认HikariCP数据源Bean
            registerHikariDataSource(registry);
        }
    }
    
    private void registerDruidDataSource(BeanDefinitionRegistry registry) {
        // 实现Druid数据源Bean注册逻辑
        logger.info("注册Druid数据源Bean");
    }
    
    private void registerHikariDataSource(BeanDefinitionRegistry registry) {
        // 实现HikariCP数据源Bean注册逻辑
        logger.info("注册HikariCP数据源Bean");
    }
}
```

## 高级用法示例

### 属性绑定工具类

```java
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class PropertyBindingUtil implements EnvironmentAware {
    
    private Environment environment;
    private Binder binder;
    
    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
        this.binder = Binder.get(environment);
    }
    
    /**
     * 绑定配置属性到对象
     */
    public <T> T bindProperties(String prefix, Class<T> targetClass) {
        return binder.bind(prefix, targetClass).orElse(null);
    }
    
    /**
     * 获取配置属性值
     */
    public String getProperty(String key, String defaultValue) {
        return environment.getProperty(key, defaultValue);
    }
    
    /**
     * 检查配置文件是否激活
     */
    public boolean isProfileActive(String profile) {
        return environment.acceptsProfiles(profile);
    }
}
```

### 数据源配置示例

```java
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class DataSourceConfig implements EnvironmentAware {
    
    private Environment environment;
    
    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
        initializeDataSourceConfig();
    }
    
    private void initializeDataSourceConfig() {
        // 读取数据库配置
        String url = environment.getProperty("spring.datasource.url");
        String username = environment.getProperty("spring.datasource.username");
        String password = environment.getProperty("spring.datasource.password");
        String driverClassName = environment.getProperty("spring.datasource.driver-class-name");
        
        // 验证必要配置
        if (url == null || username == null || password == null) {
            throw new IllegalStateException("数据库配置不完整");
        }
        
        // 根据环境配置初始化数据源
        String activeProfile = environment.getProperty("spring.profiles.active", "dev");
        configureDataSourceByProfile(activeProfile);
    }
    
    private void configureDataSourceByProfile(String profile) {
        switch (profile) {
            case "prod":
                configureProdDataSource();
                break;
            case "test":
                configureTestDataSource();
                break;
            default:
                configureDevDataSource();
        }
    }
    
    private void configureProdDataSource() {
        // 生产环境数据源配置
    }
    
    private void configureTestDataSource() {
        // 测试环境数据源配置
    }
    
    private void configureDevDataSource() {
        // 开发环境数据源配置
    }
}
```

## 执行时序

根据Spring容器的初始化流程，EnvironmentAware的执行时序如下：

1. **Spring容器启动**
2. **setEnvironment方法执行** - 此时可以获取环境变量
3. **Bean实例化** - 开始创建应用程序的Bean实例
4. **registerBeanDefinitions方法执行**（如果实现了ImportBeanDefinitionRegistrar）

## 使用场景

### 1. 动态配置读取
```java
@Component
public class ConfigReader implements EnvironmentAware {
    
    @Override
    public void setEnvironment(Environment environment) {
        // 读取自定义配置
        String customConfig = environment.getProperty("app.custom.config");
        // 处理配置逻辑
    }
}
```

### 2. 条件化Bean注册
```java
public class ConditionalBeanRegistrar implements ImportBeanDefinitionRegistrar, EnvironmentAware {
    
    private Environment environment;
    
    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }
    
    @Override
    public void registerBeanDefinitions(AnnotationMetadata metadata, BeanDefinitionRegistry registry) {
        boolean enableFeature = environment.getProperty("app.feature.enabled", Boolean.class, false);
        if (enableFeature) {
            // 注册特性相关的Bean
        }
    }
}
```

### 3. 环境相关初始化
```java
@Component
public class EnvironmentInitializer implements EnvironmentAware {
    
    @Override
    public void setEnvironment(Environment environment) {
        String env = environment.getProperty("spring.profiles.active", "dev");
        
        // 根据不同环境进行初始化
        if ("prod".equals(env)) {
            // 生产环境初始化
            initProdEnvironment();
        } else if ("test".equals(env)) {
            // 测试环境初始化
            initTestEnvironment();
        }
    }
    
    private void initProdEnvironment() {
        // 生产环境特殊初始化逻辑
    }
    
    private void initTestEnvironment() {
        // 测试环境特殊初始化逻辑
    }
}
```

## 注意事项

1. **执行时机早**：setEnvironment方法在Bean实例化之前执行，此时其他Bean可能还未创建
2. **避免依赖注入**：在setEnvironment方法中不能使用@Autowired等依赖注入
3. **线程安全**：如果需要在多线程环境中使用，需要考虑线程安全问题
4. **异常处理**：应该妥善处理配置读取可能出现的异常
