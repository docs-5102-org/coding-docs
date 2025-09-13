---
title: Maven 依赖范围Scope详解
category:
  - Maven
---

# Maven 依赖范围（Scope）详解

## 目录

[[toc]]

## 概述

Maven 中使用 `scope` 来指定当前包的依赖范围和依赖的传递性。scope 主要用在 pom.xml 文件中的依赖定义部分，控制依赖在不同阶段的可用性。

## Scope 取值对照表

| Scope 取值 | 有效范围 | 依赖传递 | 是否打入jar包 | 典型例子 | 使用场景 |
|-----------|----------|----------|---------------|----------|----------|
| **compile** | 编译、测试、运行 | 是 | 是 | spring-core | 默认范围，项目运行时必需的依赖 |
| **provided** | 编译、测试 | 否 | 否 | servlet-api | 容器或JDK已提供的依赖 |
| **runtime** | 测试、运行 | 是 | 是 | JDBC驱动 | 运行时才需要的具体实现 |
| **test** | 测试 | 否 | 否 | JUnit | 仅测试时需要的依赖 |
| **system** | 编译、测试 | 是 | 否* | 本地jar包 | 引用本地文件系统的jar包 |
| **import** | dependencyManagement | 是 | 不适用 | BOM文件 | 导入其他POM的依赖管理配置 |

*注：system 范围的依赖默认不打包，但可通过插件配置强制打包

## 详细说明

### 1. compile（默认范围）

**特点：**
- 这是 Maven 的默认依赖范围
- 在项目的编译、测试、运行阶段都有效
- 支持依赖传递
- 会被打包到最终的 jar/war 文件中

**使用示例：**
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.21</version>
    <!-- 不指定scope，默认为compile -->
</dependency>
```

**适用场景：**
- 项目运行时必需的核心依赖
- 业务逻辑相关的第三方库

### 2. provided（已提供）

**特点：**
- 在编译和测试时有效，运行时无效
- 不支持依赖传递
- 不会被打包到最终的 jar/war 文件中
- 假设运行环境（如Web容器、JDK）已经提供了该依赖

**使用示例：**
```xml
<dependency>
    <groupId>javax.servlet</groupId>
    <artifactId>javax.servlet-api</artifactId>
    <version>4.0.1</version>
    <scope>provided</scope>
</dependency>
```

**适用场景：**
- Servlet API（Web容器已提供）
- JDK内置的API扩展
- 应用服务器提供的库

**与 optional 的区别：**
- `provided`：目标容器中已经提供了这个依赖
- `optional=true`：表示某个依赖可选，不影响服务运行

### 3. runtime（运行时）

**特点：**
- 在运行和测试时有效，编译时无效
- 支持依赖传递
- 会被打包到最终的 jar/war 文件中
- 编译时不需要，但运行时必须

**使用示例：**
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
    <scope>runtime</scope>
</dependency>
```

**适用场景：**
- 数据库驱动（编译时只需要JDBC接口，运行时需要具体实现）
- 日志实现（如 logback-classic）

### 4. test（测试）

**特点：**
- 只在测试阶段有效（包括测试代码的编译和执行）
- 不支持依赖传递
- 不会被打包到最终的 jar/war 文件中

**使用示例：**
```xml
<dependency>
    <groupId>junit</groupId>
    <artifactId>junit</artifactId>
    <version>4.13.2</version>
    <scope>test</scope>
</dependency>
```

**适用场景：**
- 单元测试框架（JUnit、TestNG）
- 测试辅助库（Mockito、AssertJ）
- 测试专用的配置和工具

### 5. system（系统）

**特点：**
- 类似于 provided，但依赖来自本地文件系统
- 在编译和测试时有效
- 支持依赖传递
- 默认不打包（可通过插件配置强制打包）
- 必须配合 `systemPath` 标签使用

**使用示例：**
```xml
<dependency>
    <groupId>com.mycompany</groupId>
    <artifactId>custom-lib</artifactId>
    <version>1.0</version>
    <scope>system</scope>
    <systemPath>${project.basedir}/lib/custom-lib-1.0.jar</systemPath>
</dependency>
```

**注意事项：**
- 可能造成构建的不可移植性
- 不推荐使用，应优先考虑将jar安装到本地仓库
- 如需打包，需在maven-compiler-plugin中配置：
```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-compiler-plugin</artifactId>
    <configuration>
        <includeSystemScope>true</includeSystemScope>
    </configuration>
</plugin>
```

### 6. import（导入）

**特点：**
- 只能在 `<dependencyManagement>` 中使用
- 用于导入其他 POM 文件的依赖管理配置
- 支持依赖传递
- 实现多重继承的效果

**使用示例：**

传统的单一继承方式：
```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>2.7.0</version>
</parent>
```

使用 import 实现多重继承：
```xml
<dependencyManagement>
    <dependencies>
        <!-- 导入 Spring Boot 依赖管理 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>2.7.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        
        <!-- 导入公司标准依赖管理 -->
        <dependency>
            <groupId>com.company</groupId>
            <artifactId>company-bom</artifactId>
            <version>1.0.0</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

**适用场景：**
- 需要继承多个父 POM 的依赖管理
- 使用 BOM（Bill of Materials）管理版本
- 企业级项目的依赖版本统一管理

## 最佳实践

### 1. 合理选择 Scope
- **compile**：项目核心依赖，如业务框架
- **provided**：容器提供的API，如 servlet-api
- **runtime**：运行时实现，如数据库驱动
- **test**：测试相关，如 JUnit、Mockito
- **避免使用 system**：影响项目可移植性

### 2. 依赖传递考虑
- 需要传递给下游项目：使用 compile、runtime
- 不需要传递：使用 provided、test
- 可选依赖：使用 `<optional>true</optional>`

### 3. 打包优化
- 减小打包体积：合理使用 provided 排除容器已有依赖
- 避免冲突：了解哪些依赖会被打包

### 4. 版本管理
- 使用 import scope 统一管理依赖版本
- 结合 dependencyManagement 避免版本冲突

## 常见问题

### Q1: provided 和 optional 的区别？
- **provided**: 运行环境已提供，不需要打包
- **optional**: 可选依赖，使用方可以选择是否引入

### Q2: 为什么 runtime 依赖编译时不可用？
- 设计理念：编译时应该面向接口编程，运行时才需要具体实现
- 典型例子：JDBC API（接口）vs 具体数据库驱动（实现）

### Q3: import scope 和 parent 继承有什么区别？
- **parent**: 只能继承一个父 POM
- **import**: 可以导入多个 POM 的依赖管理配置

通过合理使用这些依赖范围，可以更好地控制项目的依赖管理，优化构建过程和最终产物。