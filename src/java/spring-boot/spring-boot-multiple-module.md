---
title: 多模块设计指南
category:
  - Web框架
tag:
  - Spring Boot
  - 多模块设计
---

# Spring Boot 多模块设计指南

## 目录

[[toc]]

## 1. 概述

Spring Boot 多模块项目是一种项目组织方式，通过将应用程序拆分为多个独立的模块来提高代码的可维护性、可重用性和团队协作效率。每个模块都有特定的职责，模块之间通过明确的依赖关系进行交互。

---

## 2. 多模块架构的优势

### 2.1 代码组织优势
- **职责分离**：每个模块承担特定的业务职责
- **依赖管理**：清晰的模块依赖关系，避免循环依赖
- **代码复用**：公共组件可被多个模块共享

### 2.2 开发效率优势
- **并行开发**：多个团队可以并行开发不同模块
- **独立测试**：每个模块可以独立进行单元测试
- **增量构建**：只构建发生变化的模块

### 2.3 维护优势
- **易于维护**：模块化使得代码更容易理解和修改
- **版本控制**：不同模块可以有不同的发布周期
- **技术栈灵活**：不同模块可以采用不同的技术方案

---

## 3. 典型的模块架构设计

### 3.1 标准分层架构

```
project-root/
├── pom.xml                 # 父POM文件
├── project-common/         # 公共模块
├── project-model/          # 实体模型模块
├── project-dao/            # 数据访问层模块
├── project-service/        # 业务逻辑层模块
├── project-web/            # Web控制器模块
└── project-app/            # 启动模块
```

### 3.2 模块职责说明

| 模块名称 | 职责描述 | 主要内容 |
|---------|---------|---------|
| common | 公共组件 | 工具类、常量、配置类、异常定义 |
| model | 数据模型 | 实体类、DTO、VO等数据传输对象 |
| dao | 数据访问层 | Mapper接口、Repository、数据库操作 |
| service | 业务逻辑层 | Service接口和实现类、业务逻辑处理 |
| web | 表现层 | Controller、拦截器、过滤器 |
| app | 应用启动 | 主启动类、应用配置、打包配置 |

---

## 4. 项目结构配置

### 4.1 父POM配置 (project-root/pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>multi-module-project</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>
    
    <name>Multi Module Project</name>
    <description>Spring Boot Multi Module Demo</description>
    
    <!-- 子模块声明 -->
    <modules>
        <module>project-common</module>
        <module>project-model</module>
        <module>project-dao</module>
        <module>project-service</module>
        <module>project-web</module>
        <module>project-app</module>
    </modules>
    
    <properties>
        <java.version>17</java.version>
        <spring.boot.version>3.2.0</spring.boot.version>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <!-- 统一依赖管理 -->
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
    
    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring.boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### 4.2 公共模块配置 (project-common/pom.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>com.example</groupId>
        <artifactId>multi-module-project</artifactId>
        <version>1.0.0</version>
    </parent>
    
    <artifactId>project-common</artifactId>
    <name>Project Common</name>
    <description>Common utilities and configurations</description>
    
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
        </dependency>
        <!-- 其他公共依赖 -->
    </dependencies>
</project>
```

---

## 5. 模块间依赖关系

### 5.1 依赖层次图

```
project-app
    ├── project-web
    │   ├── project-service
    │   │   ├── project-dao
    │   │   │   ├── project-model
    │   │   │   └── project-common
    │   │   └── project-common
    │   └── project-common
    └── project-common
```

### 5.2 依赖原则

1. **单向依赖**：模块依赖应该是单向的，避免循环依赖
2. **层次依赖**：上层模块可以依赖下层模块，反之不行
3. **公共依赖**：所有模块都可以依赖common模块
4. **最小依赖**：只依赖必需的模块，减少不必要的耦合

---

## 6. 实际代码示例

### 6.1 Model模块示例

```java
// project-model/src/main/java/com/example/model/User.java
package com.example.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    private LocalDateTime createdAt;
    
    // getter和setter方法
    // ...
}
```

### 6.2 DAO模块示例

```java
// project-dao/src/main/java/com/example/dao/UserRepository.java
package com.example.dao;

import com.example.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.username = ?1 AND u.email = ?2")
    Optional<User> findByUsernameAndEmail(String username, String email);
}
```

### 6.3 Service模块示例

```java
// project-service/src/main/java/com/example/service/UserService.java
package com.example.service;

import com.example.model.User;
import com.example.dao.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public List<User> findAllUsers() {
        return userRepository.findAll();
    }
    
    public Optional<User> findUserById(Long id) {
        return userRepository.findById(id);
    }
    
    public User createUser(User user) {
        user.setCreatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    public User updateUser(User user) {
        return userRepository.save(user);
    }
    
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }
}
```

### 6.4 Web模块示例

```java
// project-web/src/main/java/com/example/web/UserController.java
package com.example.web;

import com.example.model.User;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserService userService;
    
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.findAllUsers();
        return ResponseEntity.ok(users);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        return userService.findUserById(id)
                .map(user -> ResponseEntity.ok(user))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User createdUser = userService.createUser(user);
        return ResponseEntity.ok(createdUser);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        user.setId(id);
        User updatedUser = userService.updateUser(user);
        return ResponseEntity.ok(updatedUser);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
```

### 6.5 启动模块示例

```java
// project-app/src/main/java/com/example/Application.java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.example")
@EntityScan(basePackages = "com.example.model")
@EnableJpaRepositories(basePackages = "com.example.dao")
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

---

## 7. 配置管理策略

### 7.1 配置文件分离

```yaml
# project-app/src/main/resources/application.yml
spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:mysql://localhost:3306/multimodule_db
    username: ${DB_USERNAME:root}
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        format_sql: true

# 日志配置
logging:
  level:
    com.example: DEBUG
    org.springframework: INFO
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"

# 服务器配置
server:
  port: 8080
  servlet:
    context-path: /api
```

### 7.2 环境配置分离

```yaml
# application-dev.yml
spring:
  datasource:
    password: ${DB_PASSWORD:dev_password}
  h2:
    console:
      enabled: true

# application-prod.yml
spring:
  datasource:
    password: ${DB_PASSWORD}
  jpa:
    show-sql: false
logging:
  level:
    com.example: INFO
```

---

## 8. 构建和打包

### 8.1 Maven构建命令

```bash
# 构建整个项目
mvn clean compile

# 运行测试
mvn clean test

# 打包项目
mvn clean package

# 跳过测试打包
mvn clean package -DskipTests

# 构建特定模块
mvn clean package -pl project-app -am
```

### 8.2 Docker化部署

```dockerfile
# project-app/Dockerfile
FROM openjdk:17-jdk-alpine

VOLUME /tmp

ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","/app.jar"]
```

---

## 9. 最佳实践

### 9.1 模块设计原则

1. **单一职责原则**：每个模块只负责一个特定的功能领域
2. **接口隔离原则**：模块间通过接口进行交互，减少直接依赖
3. **依赖倒置原则**：高层模块不依赖低层模块的具体实现
4. **开闭原则**：对扩展开放，对修改封闭

### 9.2 代码组织建议

- **包命名规范**：使用清晰的包命名约定
- **接口定义**：为服务层定义清晰的接口
- **异常处理**：在common模块中定义统一的异常体系
- **工具类管理**：将通用工具类放在common模块中

### 9.3 版本管理策略

- **统一版本**：所有子模块使用相同版本号
- **依赖版本**：在父POM中统一管理依赖版本
- **发布策略**：建立清晰的版本发布流程

---

## 10. 常见问题和解决方案

### 10.1 循环依赖问题

**问题**：模块间出现循环依赖，导致编译失败

**解决方案**：
- 重新设计模块职责，消除循环依赖
- 将共同依赖的部分抽取到公共模块
- 使用事件驱动机制解耦模块间通信

### 10.2 启动类扫描问题

**问题**：Spring无法扫描到其他模块的组件

**解决方案**：
```java
@SpringBootApplication(scanBasePackages = "com.example")
@EntityScan(basePackages = "com.example.model")
@EnableJpaRepositories(basePackages = "com.example.dao")
```

### 10.3 配置文件加载问题

**问题**：无法加载其他模块的配置文件

**解决方案**：
- 将配置文件统一放在启动模块中
- 使用`@PropertySource`注解指定配置文件路径
- 使用Spring Cloud Config进行配置管理

---
