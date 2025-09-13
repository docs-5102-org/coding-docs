---
title: 多模块配置文件详解
category:
  - Web框架
tag:
  - Spring Boot
  - 多模块共用配置文件
---

# Spring Boot 多模块中共用配置文件详解

## 目录

[[toc]]

## 背景问题

在Spring Boot多模块项目开发中，经常会遇到以下问题：

### 问题描述
公共模块（如 `comm` 模块）中定义了一些配置参数，其他应用模块依赖该公共模块。这种情况下，每个依赖的应用都需要在自己的配置文件中重复配置与 `comm` 模块相同的参数，否则在启动时会出现以下错误：

```
找不到配置参数，无法解析的异常
Configuration property not found
```

### 期望的解决方案
我们希望实现这样的需求：
- 公共模块 `comm` 配置了默认参数
- 应用模块 A 依赖 `comm` 模块
- 如果应用 A 中配置了相同的参数，则覆盖 `comm` 中的默认配置
- 如果应用 A 中没有配置该参数，则使用 `comm` 模块中的默认配置

## 解决方案概述

经过测试验证，**答案是肯定的**。Spring Boot 支持多模块间的配置文件共享和覆盖机制。

### 架构设计

```
├── parent-project
│   ├── comm-module (公共模块)
│   │   └── application-commdev.yml
│   └── app-module (应用模块)
│       ├── application.yml
│       └── application-dev.yml
```

### 核心机制

Spring Boot 的配置文件加载遵循以下规则：
1. **后加载的配置文件会覆盖先加载的配置文件中的相同参数**
2. **如果后加载的配置文件中没有某个参数，则使用先加载配置文件中的参数**

## 配置文件加载机制

### 基本配置示例

在应用模块的 `application.yml` 中配置：

```yaml
spring:
  profiles:
    active: dev, commdev
```

这样配置后，Spring Boot 会按顺序加载：
1. `application-commdev.yml` (公共模块配置)
2. `application-dev.yml` (应用模块配置)

### 参数覆盖规则

假设公共模块 `application-commdev.yml`：
```yaml
server:
  port: 8080
database:
  url: jdbc:mysql://localhost:3306/common_db
  username: common_user
app:
  name: common-app
  version: 1.0.0
```

应用模块 `application-dev.yml`：
```yaml
server:
  port: 8081
app:
  name: my-app
```

最终生效的配置：
```yaml
server:
  port: 8081          # 被应用模块覆盖
database:
  url: jdbc:mysql://localhost:3306/common_db    # 使用公共模块配置
  username: common_user                         # 使用公共模块配置
app:
  name: my-app        # 被应用模块覆盖
  version: 1.0.0      # 使用公共模块配置
```

## 实际应用场景

### 多模块多环境配置

假设项目结构如下：
- **DataModule**: 数据访问层模块
- **APIModule**: API 服务模块

#### 问题场景
如果要切换不同环境（开发/生产），需要设置不同的数据库地址。如果数据分布于多个数据源中，手动修改每个模块的配置文件显然不现实且容易出错。

#### 解决方案

**APIModule 配置文件结构：**
```
APIModule/
├── application.yml
├── application-development.yml
└── application-product.yml
```

**DataModule 配置文件结构：**
```
DataModule/
├── application-datadevelopment.yml
└── application-dataproduct.yml
```

**APIModule 的 application.yml 配置：**

开发环境：
```yaml
spring:
  profiles:
    active: development, datadevelopment
```

生产环境：
```yaml
spring:
  profiles:
    active: product, dataproduct
```

### 命名规则说明

为避免配置文件命名冲突，建议采用以下命名规则：
- 应用模块：`application-{environment}.yml`
- 数据模块：`application-data{environment}.yml`
- 其他模块：`application-{module}{environment}.yml`

## 最佳实践

### 1. 配置文件命名规范
```
application-{moduleName}{environment}.yml
```

示例：
- `application-commdev.yml` (公共模块开发环境)
- `application-commprod.yml` (公共模块生产环境)
- `application-dataprod.yml` (数据模块生产环境)

### 2. 配置参数组织

**公共模块配置 (application-commdev.yml):**
```yaml
# 通用数据库配置
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5

# 通用日志配置
logging:
  level:
    root: INFO
    com.yourpackage: DEBUG

# 通用业务配置
business:
  default-page-size: 10
  max-upload-size: 10MB
```

**应用模块配置 (application-dev.yml):**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/app_db
    username: app_user
    password: app_password

server:
  port: 8080

business:
  app-name: ${spring.application.name}
```

### 3. 环境切换配置

在 `application.yml` 中使用 Maven Profile 或环境变量：

```yaml
spring:
  profiles:
    active: @spring.profiles.active@
```

对应的 Maven Profile 配置：
```xml
<profiles>
  <profile>
    <id>dev</id>
    <properties>
      <spring.profiles.active>dev,commdev</spring.profiles.active>
    </properties>
  </profile>
  <profile>
    <id>prod</id>
    <properties>
      <spring.profiles.active>product,commprod</spring.profiles.active>
    </properties>
  </profile>
</profiles>
```

### 4. 配置验证

为确保配置正确加载，可以在应用启动时添加配置验证：

```java
@Component
@ConfigurationProperties(prefix = "business")
@Validated
public class BusinessConfig {
    
    @NotBlank
    private String appName;
    
    @Min(1)
    private Integer defaultPageSize;
    
    // getters and setters
}
```

## 总结

Spring Boot 多模块项目中的共用配置文件机制提供了以下优势：

1. **配置复用**：公共配置可以在多个模块间共享，减少重复配置
2. **灵活覆盖**：应用模块可以根据需要覆盖公共配置
3. **环境隔离**：通过 Profile 机制实现不同环境的配置隔离
4. **维护性强**：集中管理公共配置，降低维护成本

### 关键要点

- 配置文件加载顺序决定参数覆盖关系
- 后加载的配置覆盖先加载的相同参数
- 合理的命名规则避免配置冲突
- 使用 Maven Profile 实现环境切换
- 通过 `@ConfigurationProperties` 实现类型安全的配置绑定

通过合理运用这些机制，可以构建出既灵活又易维护的多模块Spring Boot应用。