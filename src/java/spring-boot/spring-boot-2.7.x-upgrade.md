---
title: Spring Boot 2.7.x 升级指南
category:
  - Web框架
tag:
  - Spring Boot
---

# Spring Boot 2.7.x 升级指南

本文档整理了从低版本 Spring Boot 升级到 2.7.x 版本时需要注意的关键事项和代码变更。

## 📖 官方参考文档

- **Spring Boot 2.3+ 版本发布说明**: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.3-Release-Notes
- **Spring Boot 2.6 发布说明**: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes
- **Spring Boot 官方文档**: https://spring.io/projects/spring-boot

## 🔧 主要变更事项

### 1. CORS 跨域配置修改

**问题**: 原有的 `addAllowedOrigin("*")` 方法被弃用

**解决方案**:
```java
// 旧版本写法
config.addAllowedOrigin("*"); // 已弃用

// 新版本写法
config.setAllowedOriginPatterns("*");
```

### 2. Validation 依赖独立化 (2.3+ 版本)

**问题**: `spring-boot-starter-validation` 不再自动包含

**解决方案**: 手动添加依赖
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### 3. 循环引用默认禁止 (2.6+ 版本)

**问题**: Spring Boot 2.6 开始默认禁止循环引用

**影响**: 项目中存在循环依赖会导致启动失败

**参考**: https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.6-Release-Notes

### 4. MySQL 驱动版本管理变更

**问题**: Spring Boot 2.7.8 中 `mysql-connector-java` 不再由依赖管理自动管理

**解决方案**: 手动指定版本
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.31</version>
</dependency>
```

### 5. Quartz JobStore 配置调整

**问题**: 原有的 `JobStoreTX` 配置方式变更

**旧配置**:
```properties
org.quartz.jobStore.class=org.quartz.impl.jdbcjobstore.JobStoreTX
```

**新配置**:
```properties
org.quartz.jobStore.class=org.springframework.scheduling.quartz.LocalDataSourceJobStore
```

**完整 YAML 配置示例**:
```yaml
spring:
  profiles:
    active: local
  quartz:
    job-store-type: JDBC
    jdbc:
      initialize-schema: ALWAYS
    auto-startup: true
    startup-delay: 30s
    properties:
      org:
        quartz:
          scheduler:
            instanceName: SchedulerFactoryBean
            instanceId: AUTO
          jobStore:
            class: org.springframework.scheduling.quartz.LocalDataSourceJobStore
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            tablePrefix: QRTZ_
            isClustered: true
            clusterCheckinInterval: 15000
            maxMisfiresToHandleAtATime: 1
            useProperties: false
            dataSource: master
            misfireThreshold: 60000
            selectWithLockSQL: 'SELECT * FROM {0}LOCKS UPDLOCK WHERE LOCK_NAME = ?'
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 20
            threadPriority: 5
            threadsInheritContextClassLoaderOfInitializingThread: true
```

### 6. HandlerInterceptorAdapter 弃用

**问题**: `HandlerInterceptorAdapter` 在 Spring Framework 5.0+ 被废弃

**解决方案**: 直接实现 `HandlerInterceptor` 接口
```java
public class MyInterceptor implements HandlerInterceptor {  
    @Override  
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {  
        // 请求处理前执行
        return true; // true: 继续执行, false: 中断请求  
    }  

    @Override  
    public void postHandle(HttpServletRequest request, HttpServletResponse response, Object handler, ModelAndView modelAndView) throws Exception {  
        // 请求处理后，视图渲染前执行
    }  

    @Override  
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {  
        // 请求完成后执行（用于资源清理）
    }  
}
```

### 7. Actuator 监控配置调整

#### 依赖版本升级

**升级前**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
    <version>2.2.6.Release</version>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
    <version>1.3.1</version>
</dependency>
```

**升级后**:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
    <version>2.7.18</version>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
    <version>1.9.0</version>
</dependency>
```

#### YAML 配置调整

**升级前**:
```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
  endpoints:
    web:
      exposure:
        include: metrics,httptrace
```

**升级后**:
```yaml
management:
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: ${spring.application.name}
  endpoints:
    web:
      exposure:
        include: metrics,httptrace,health,info,prometheus
```

#### JVM 信息显示问题修复

**问题**: 升级到 1.9.0 版本后，JVM、System 等信息不显示

**解决方案**: 添加配置类
```java
/**
 * Metrics 配置类
 * 解决升级到 1.9.0 版本后默认不显示 JVM 信息的问题
 * 
 * @see https://www.choupangxia.com/2021/07/27/spring-boot-actuator-metrics-no-jvm-info/
 * @see https://github.com/micrometer-metrics/micrometer/issues/513
 */
@Configuration
@RequiredArgsConstructor
public class MetricsConfig {

    @Bean
    InitializingBean forcePrometheusPostProcessor(BeanPostProcessor meterRegistryPostProcessor, PrometheusMeterRegistry registry) {
        return () -> meterRegistryPostProcessor.postProcessAfterInitialization(registry, "");
    }
}
```

## 🔍 Swagger 集成调整

Spring Boot 2.7.x 版本对 Swagger 集成有特殊要求，具体配置请参考相关文档。

## ⚠️ 注意事项

1. **版本兼容性**: 确保所有依赖库版本与 Spring Boot 2.7.x 兼容
2. **循环依赖检查**: 升级前检查并解决项目中的循环依赖问题
3. **配置文件调整**: 仔细检查配置文件中被弃用的配置项
4. **测试覆盖**: 升级后进行充分的功能测试和集成测试
5. **监控指标**: 升级后验证 Actuator 监控指标是否正常工作

## 📚 相关资源

- **Spring Boot 官网**: https://spring.io/projects/spring-boot
- **Spring Framework 文档**: https://docs.spring.io/spring-framework/docs/current/reference/html/
- **Micrometer 文档**: https://micrometer.io/docs
- **Spring Boot GitHub Wiki**: https://github.com/spring-projects/spring-boot/wiki

## 🤝 升级建议

1. **分步升级**: 建议先升级到中间版本，再升级到目标版本
2. **备份代码**: 升级前做好代码备份
3. **环境验证**: 在开发环境充分验证后再部署到生产环境
4. **文档更新**: 及时更新项目文档和部署说明

---

*最后更新时间: 2025年8月*