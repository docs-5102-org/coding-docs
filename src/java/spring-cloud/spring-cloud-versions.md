---
title: 版本介绍
category:
  - 微服务
tag:
  - Spring Cloud
---

# Spring Cloud 版本介绍

## Spring Cloud 简介

Spring Cloud 为开发人员提供了快速构建分布式系统中一些常见模式的工具（例如配置管理、服务发现、断路器、智能路由、微代理、控制总线、一次性token、全局锁、领导选举、分布式会话、集群状态）。分布式系统的协调导致了样板模式，使用 Spring Cloud 开发人员可以快速建立实现这些模式的服务和应用程序。

Spring Cloud 专注于为典型用例提供良好的开箱即用体验，以及覆盖其他用例的可扩展性机制，包括：

- 分布式/版本化配置
- 服务注册和发现
- 路由
- 服务到服务调用
- 负载均衡
- 断路器
- 分布式消息传递
- 短期微服务（任务）
- 消费者驱动和生产者驱动的契约测试

## 版本命名规则

### 早期命名规则（2020年之前）
Spring Cloud 早期采用英国伦敦地铁站名作为版本代号，按字母顺序排列：
- Angel
- Brixton  
- Camden
- Dalston
- Edgware
- Finchley
- Greenwich
- Hoxton
- ...

版本号后面的 SRX（如 SR1, SR2）代表服务版本（Service Release），用于修复特定版本中的重要问题。

### 当前命名规则（2020年开始）
从 2020 年开始，Spring Cloud 采用 [日历版本控制（Calendar Versioning）](https://calver.org/)，格式为 `YYYY.MINOR.MICRO`：
- `YYYY`：年份
- `MINOR`：从0开始的递增数字
- `MICRO`：对应之前的后缀（.0 类似于 .RELEASE，.2 类似于 .SR2）

示例：`2025.0.0`、`2024.0.2`

## 当前支持的版本

Spring Cloud 遵循 VMware Tanzu OSS 支持策略：
- 主要版本至少支持3年
- 次要版本至少支持12个月

### 最新版本（2025年）

| Release Train | Spring Boot 兼容版本 | 状态 |
|--------------|-------------------|------|
| **2025.1 (Oakwood)** | Spring Boot 3.6.x | 开发中 |
| **2025.0 (Northfields)** | Spring Boot 3.5.x | 当前最新稳定版 |
| **2024.0 (Moorgate)** | Spring Boot 3.4.x | 稳定版本 |
| **2023.0 (Leyton)** | Spring Boot 3.3.x, 3.2.x | 稳定版本 |

### 历史版本

| Release Train | Spring Boot 兼容版本 | 状态 |
|--------------|-------------------|------|
| 2022.0 (Kilburn) | Spring Boot 3.0.x, 3.1.x | 生命周期结束 |
| 2021.0 (Jubilee) | Spring Boot 2.6.x, 2.7.x | 生命周期结束 |
| 2020.0 (Ilford) | Spring Boot 2.4.x, 2.5.x | 生命周期结束 |
| Hoxton | Spring Boot 2.2.x, 2.3.x | 生命周期结束 |
| Greenwich | Spring Boot 2.1.x | 生命周期结束 |
| Finchley | Spring Boot 2.0.x | 生命周期结束 |
| Edgware | Spring Boot 1.5.x | 生命周期结束 |
| Dalston | Spring Boot 1.5.x | 生命周期结束 |
| Camden | Spring Boot 1.4.x, 1.5.x | 生命周期结束 |
| Brixton | Spring Boot 1.3.x, 1.4.x | 生命周期结束 |
| Angel | Spring Boot 1.2.x | 生命周期结束 |

## Spring Cloud 与 Spring Boot 版本对应关系

| Spring Cloud Release Train | Spring Boot 兼容版本 | 发布状态 |
|---------------------------|-------------------|---------|
| 2025.1 (Oakwood) | 3.6.x | 开发中 |
| 2025.0 (Northfields) | 3.5.x | GA |
| 2024.0 (Moorgate) | 3.4.x | GA |
| 2023.0 (Leyton) | 3.3.x, 3.2.x | GA |
| 2022.0 (Kilburn) | 3.0.x, 3.1.x | EOL |
| 2021.0 (Jubilee) | 2.6.x, 2.7.x | EOL |
| 2020.0 (Ilford) | 2.4.x, 2.5.x | EOL |

## 如何选择版本

### 推荐做法
1. **使用最新稳定版本**：建议所有用户迁移到最新的 GA 版本
2. **查看兼容性**：根据你使用的 Spring Boot 版本选择对应的 Spring Cloud 版本
3. **使用最新服务版本**：选定发布系列后，使用该系列的最新服务版本

### 版本选择步骤
1. 确定你的 Spring Boot 版本
2. 查看上面的兼容性表格
3. 选择对应的 Spring Cloud 发布系列
4. 使用该系列的最新补丁版本

### 常见版本选择示例

#### Spring Boot 2.7.18 用户
如果您使用的是 **Spring Boot 2.7.18**，应该选择 **Spring Cloud 2021.0 (Jubilee)** 系列：

**Maven 配置：**
```xml
<properties>
    <spring-boot.version>2.7.18</spring-boot.version>
    <spring-cloud.version>2021.0.9</spring-cloud.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**Gradle 配置：**
```gradle
ext {
    set('springCloudVersion', "2021.0.9")
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}
```

⚠️ **重要提醒**：
- Spring Cloud 2021.0 (Jubilee) 系列已经**生命周期结束（EOL）**
- Spring Boot 2.7.x 系列也已经结束支持
- **强烈建议升级**到受支持的版本以获得安全更新

**推荐升级路径：**
```
当前：Spring Boot 2.7.18 + Spring Cloud 2021.0.9
  ↓
推荐：Spring Boot 3.2.x + Spring Cloud 2023.0.x
  ↓
最新：Spring Boot 3.5.x + Spring Cloud 2025.0.0
```

## Maven/Gradle 配置

### Maven 配置示例
```xml
<properties>
    <spring-cloud.version>2025.0.0</spring-cloud.version>
</properties>

<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### Gradle 配置示例
```gradle
ext {
    set('springCloudVersion', "2025.0.0")
}

dependencyManagement {
    imports {
        mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
    }
}
```

## 支持策略

Spring Cloud 发布系列的支持时间基于 Spring Boot 的支持时间。一般来说，在 Spring Boot 结束支持后的3个月内，相应的 Spring Cloud 发布系列中的项目也将不再受支持。

**示例**：Spring Cloud 2023.0 (Leyton) 支持 Spring Boot 3.3.x 和 3.2.x，只要 Spring Boot 3.3.x 仍受支持，就可以认为 Spring Cloud 2023.0 发布系列中的所有项目仍受支持。

## 官方链接

- **Spring Cloud 官方项目页面**：https://spring.io/projects/spring-cloud/
- **版本支持信息**：https://github.com/spring-cloud/spring-cloud-release/wiki/Supported-Versions
- **Spring Boot 支持时间线**：https://spring.io/projects/spring-boot#support
- **Spring Cloud 发布说明**：https://github.com/spring-cloud/spring-cloud-release/wiki
- **开始构建项目**：https://start.spring.io/
- **商业支持**：https://spring.io/support

## 注意事项

1. **及时升级**：定期检查并升级到受支持的版本
2. **测试兼容性**：在升级前充分测试应用程序兼容性
3. **关注安全更新**：及时应用安全补丁和关键错误修复
4. **查看发布说明**：升级前仔细阅读发布说明了解变更内容

---
*最后更新时间：2025年9月*