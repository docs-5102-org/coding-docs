---
title: 配置监控组件
category:
  - Web框架
tag:
  - Spring Boot
  - Actuator
  - Micrometer
  - Prometheus
---

# Spring Boot 监控组件指南

## 目录

[[toc]]

## 概述

Spring Boot提供了强大的监控能力，通过集成Actuator、Micrometer、Prometheus等组件，可以实现对应用程序的全面监控。本文将介绍如何配置和使用这些监控组件来监控Spring Boot应用。

## 核心监控组件

### 1. Spring Boot Actuator

Spring Boot Actuator是Spring Boot的核心监控组件，提供了生产级的监控和管理功能。

**主要功能：**
- 应用健康检查
- 指标收集
- 端点暴露
- 应用信息展示

### 2. Micrometer

Micrometer为Java平台上的性能数据收集提供了一个通用的API，支持多种监控系统的集成。

### 3. Prometheus

Prometheus是一个开源的监控和警报工具，通过Micrometer可以将Spring Boot应用的指标数据导出到Prometheus。

## 依赖配置

### Maven依赖

在`pom.xml`中添加以下依赖：

```xml
<!-- Spring Boot Actuator -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

<!-- Micrometer Prometheus Registry -->
<!-- micrometer 为 Java 平台上的性能数据收集提供了一个通用的 API 结合spring-boot-starter-actuator -->
<!-- Spring Boot 与相关的版本对应关系 https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.2-Release-Notes -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
    <version>1.3.1</version>
</dependency>

<!-- 用于获取jvm/os 信息工具包 @see https://gitee.com/hejun5448/oshi -->
<dependency>
   <groupId>com.github.oshi</groupId>
   <artifactId>oshi-core</artifactId>
   <version>5.7.5</version>
</dependency>

<!-- oshi-core 依赖包 当前系统仓库默认的版本是4.5 所以需要重新导入符合版本的依赖 并刷新工程 -->
<dependency>
    <groupId>net.java.dev.jna</groupId>
    <artifactId>jna</artifactId>
    <version>5.8.0</version>
</dependency>

<!-- oshi-core 依赖包 当前系统仓库默认的版本是4.5 所以需要重新导入符合版本的依赖 并刷新工程 -->
<dependency>
    <groupId>net.java.dev.jna</groupId>
    <artifactId>jna-platform</artifactId>
    <version>5.8.0</version>
</dependency>
```

## 配置说明

### application.yml配置

在`application-local.yml`中添加监控端点配置：

```yaml
# 暴露端点服务
management:
  metrics:
    export:
      # 开启 prometheus访问
      prometheus:
        enabled: true
    tags:
      # 暴露的数据中添加application label
      application: ${spring.application.name}
  endpoints:
    web:
      exposure:
        # * 在YAML中有特殊含义，所以若是要包含（或排除）全部端点，请务必添加引号，如下示例中所示 "*"
        # include: "*"
        # 访问 http://127.0.0.1:9330/actuator/metrics/ 查看所有参数名数组
        # 访问 http://127.0.0.1:9330/actuator/metrics/jvm.gc.memory.allocated 追加参数名即可获取对应的信息节点数据
        include: metrics,httptrace
```

### 配置说明

- `management.metrics.export.prometheus.enabled: true`：启用Prometheus指标导出
- `management.metrics.tags.application`：为指标添加应用标签
- `management.endpoints.web.exposure.include`：指定要暴露的端点

## 监控端点访问

### 常用监控端点

1. **查看所有可用指标**
   ```
   GET http://127.0.0.1:9330/actuator/metrics/
   ```

2. **查看具体指标信息**
   ```
   GET http://127.0.0.1:9330/actuator/metrics/jvm.gc.memory.allocated
   ```

3. **健康检查端点**
   ```
   GET http://127.0.0.1:9330/actuator/health
   ```

4. **Prometheus指标端点**
   ```
   GET http://127.0.0.1:9330/actuator/prometheus
   ```

## 实现组件

### MonitorController

创建监控控制器来提供自定义的监控接口：

```java
@RestController
@RequestMapping("/api/monitor")
public class MonitorController {
    
    @Autowired
    private MonitorService monitorService;
    
    @GetMapping("/system")
    public ResponseEntity<?> getSystemInfo() {
        return ResponseEntity.ok(monitorService.getSystemInfo());
    }
    
    @GetMapping("/jvm")
    public ResponseEntity<?> getJvmInfo() {
        return ResponseEntity.ok(monitorService.getJvmInfo());
    }
}
```

### MonitorService

创建监控服务来收集系统和JVM信息：

```java
@Service
public class MonitorService {
    
    public SystemInfo getSystemInfo() {
        SystemInfo systemInfo = new SystemInfo();
        // 使用 oshi-core 获取系统信息
        return systemInfo;
    }
    
    public JvmInfo getJvmInfo() {
        // 获取JVM相关信息
        return new JvmInfo();
    }
}
```

## OSHI-Core工具包

OSHI是一个免费的基于JNA的（本机）操作系统和硬件信息库，用于获取系统信息。

**主要功能：**
- 获取JVM信息
- 操作系统信息
- 硬件信息
- 内存使用情况
- CPU使用率

## Spring Boot Admin集成

Spring Boot Admin提供了一个用于管理和监控Spring Boot应用程序的管理界面。

### 版本对应关系

确保Spring Boot与Micrometer版本兼容：
- 详见：[Spring Boot 2.2 Release Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-2.2-Release-Notes)

## 参考链接

### 技术文档
- [SpringBoot - Actuator指标监控](https://blog.csdn.net/aixiaoyang168/article/details/100866159)
- [SpringBoot Actuator详解](https://blog.csdn.net/qq_29718835/article/details/120779672)
- [SpringBoot Actuator使用指南](https://www.cnblogs.com/caoweixiong/p/15325382.html)
- [SpringBoot Actuator介绍](http://blog.battcn.com/2018/05/24/springboot/v2-actuator-introduce/)

### 版本兼容性
- [Springboot集成micrometer版本对应关系](https://blog.csdn.net/linzhiji/article/details/112425193)

### Spring Boot Admin
- [Spring Boot Admin监控应用](https://blog.csdn.net/m0_66876551/article/details/124064593)
- [Spring Boot Admin使用教程](http://c.biancheng.net/view/5509.html)

### 系统信息获取
- [oshi-core获取JVM信息](https://blog.csdn.net/m0_64355285/article/details/121718370)
- [OSHI项目地址](https://gitee.com/hejun5448/oshi)

## 最佳实践

1. **安全考虑**：生产环境中应该限制监控端点的访问权限
2. **性能监控**：定期监控应用性能指标，设置合理的告警阈值
3. **日志管理**：结合日志系统进行全面的应用监控
4. **自定义指标**：根据业务需求添加自定义的监控指标

## 总结

通过集成Spring Boot Actuator、Micrometer、Prometheus等监控组件，可以构建完整的应用监控体系。结合OSHI-Core工具包和Spring Boot Admin，能够实现对应用程序运行状态的全方位监控，为生产环境的稳定运行提供有力保障。