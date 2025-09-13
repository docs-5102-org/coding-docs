---
title: Maven 构建多模块指南
category:
  - Maven
---

# Maven构建多模块指南

## 目录

[[toc]]

## 概述

Maven多模块项目是一种将大型项目拆分为多个相互关联的小模块的架构模式。每个模块都有自己的`pom.xml`文件，同时由一个父模块统一管理依赖版本、插件配置和构建流程。

### 适用场景
- 大型企业级应用开发
- 微服务架构项目
- 需要模块化管理的复杂系统
- 多团队协作开发项目

## 多模块项目的优势

### 1. 模块化管理
- **职责分离**：每个模块负责特定的业务功能
- **代码复用**：公共模块可被多个子模块引用
- **独立开发**：不同团队可以并行开发不同模块

### 2. 依赖管理
- **版本统一**：父POM统一管理依赖版本，避免版本冲突
- **依赖传递**：子模块自动继承父模块的依赖配置
- **选择性依赖**：子模块可以选择性地引入需要的依赖

### 3. 构建效率
- **增量构建**：只构建发生变化的模块
- **并行构建**：Maven支持多线程并行构建模块
- **统一打包**：一键构建整个项目的所有模块

## 项目结构设计

### 典型的多模块项目结构

```
my-project/
├── pom.xml                    # 父POM文件
├── my-project-common/         # 公共模块
│   ├── src/
│   └── pom.xml
├── my-project-dao/           # 数据访问层模块
│   ├── src/
│   └── pom.xml
├── my-project-service/       # 业务逻辑层模块
│   ├── src/
│   └── pom.xml
├── my-project-web/          # Web层模块
│   ├── src/
│   └── pom.xml
└── my-project-app/          # 应用启动模块
    ├── src/
    └── pom.xml
```

### 模块划分原则

1. **按业务功能划分**：用户模块、订单模块、支付模块等
2. **按技术层次划分**：DAO层、Service层、Controller层等
3. **按部署单元划分**：不同的微服务模块
4. **公共模块独立**：工具类、常量、配置等

## 父POM配置

### 基础父POM示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>my-project</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>pom</packaging>

    <name>My Project</name>
    <description>多模块项目示例</description>

    <!-- 子模块列表 -->
    <modules>
        <module>my-project-common</module>
        <module>my-project-dao</module>
        <module>my-project-service</module>
        <module>my-project-web</module>
        <module>my-project-app</module>
    </modules>

    <!-- 属性配置 -->
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        
        <!-- 依赖版本管理 -->
        <spring.boot.version>2.7.2</spring.boot.version>
        <mysql.version>8.0.29</mysql.version>
        <mybatis.version>3.5.10</mybatis.version>
        <junit.version>5.8.2</junit.version>
    </properties>

    <!-- 依赖管理 -->
    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot BOM -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
            
            <!-- 项目内部模块依赖 -->
            <dependency>
                <groupId>${project.groupId}</groupId>
                <artifactId>my-project-common</artifactId>
                <version>${project.version}</version>
            </dependency>
            <dependency>
                <groupId>${project.groupId}</groupId>
                <artifactId>my-project-dao</artifactId>
                <version>${project.version}</version>
            </dependency>
            <dependency>
                <groupId>${project.groupId}</groupId>
                <artifactId>my-project-service</artifactId>
                <version>${project.version}</version>
            </dependency>
            
            <!-- 第三方依赖 -->
            <dependency>
                <groupId>mysql</groupId>
                <artifactId>mysql-connector-java</artifactId>
                <version>${mysql.version}</version>
            </dependency>
            <dependency>
                <groupId>org.mybatis</groupId>
                <artifactId>mybatis</artifactId>
                <version>${mybatis.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <!-- 插件管理 -->
    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring.boot.version}</version>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.8.1</version>
                    <configuration>
                        <source>${maven.compiler.source}</source>
                        <target>${maven.compiler.target}</target>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### 父POM关键配置说明

1. **packaging类型必须是pom**：`<packaging>pom</packaging>`
2. **modules标签**：列出所有子模块
3. **dependencyManagement**：统一管理依赖版本，子模块无需指定版本号
4. **pluginManagement**：统一管理插件配置
5. **properties**：定义全局属性和版本号

## 子模块配置

### 公共模块示例（my-project-common）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- 继承父POM -->
    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-project</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>my-project-common</artifactId>
    <packaging>jar</packaging>

    <name>My Project Common</name>
    <description>公共工具模块</description>

    <dependencies>
        <!-- 常用工具依赖 -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-lang3</artifactId>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>
    </dependencies>
</project>
```

### 服务层模块示例（my-project-service）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-project</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>my-project-service</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- 依赖项目内其他模块 -->
        <dependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>my-project-common</artifactId>
        </dependency>
        <dependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>my-project-dao</artifactId>
        </dependency>

        <!-- Spring相关依赖 -->
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-context</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework</groupId>
            <artifactId>spring-tx</artifactId>
        </dependency>

        <!-- 测试依赖 -->
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

### 应用启动模块示例（my-project-app）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.example</groupId>
        <artifactId>my-project</artifactId>
        <version>1.0.0-SNAPSHOT</version>
    </parent>

    <artifactId>my-project-app</artifactId>
    <packaging>jar</packaging>

    <dependencies>
        <!-- 依赖所有业务模块 -->
        <dependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>my-project-web</artifactId>
        </dependency>
        <dependency>
            <groupId>${project.groupId}</groupId>
            <artifactId>my-project-service</artifactId>
        </dependency>

        <!-- Spring Boot启动器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Spring Boot打包插件 -->
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <executions>
                    <execution>
                        <goals>
                            <goal>repackage</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

## 依赖管理策略

### 1. 版本管理策略

#### 使用BOM（Bill of Materials）
```xml
<dependencyManagement>
    <dependencies>
        <!-- 引入Spring Boot BOM -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>${spring.boot.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

#### 自定义版本属性
```xml
<properties>
    <spring.version>5.3.21</spring.version>
    <mybatis.version>3.5.10</mybatis.version>
    <jackson.version>2.13.3</jackson.version>
</properties>
```

### 2. 依赖范围管理

| 范围 | 说明 | 适用场景 |
|------|------|----------|
| compile | 默认范围，编译和运行时都需要 | 业务代码依赖 |
| provided | 编译时需要，运行时由容器提供 | Servlet API等 |
| runtime | 运行时需要，编译时不需要 | 数据库驱动 |
| test | 仅测试时需要 | JUnit等测试框架 |
| system | 系统路径依赖，不推荐使用 | - |

### 3. 可选依赖和排除依赖

#### 可选依赖
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <optional>true</optional>
</dependency>
```

#### 排除传递依赖
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
    <exclusions>
        <exclusion>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-tomcat</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

## 构建和打包

### 1. 基本构建命令

```bash
# 清理项目
mvn clean

# 编译项目
mvn compile

# 运行测试
mvn test

# 打包项目
mvn package

# 安装到本地仓库
mvn install

# 部署到远程仓库
mvn deploy

# 完整构建流程
mvn clean package
```

### 2. 指定模块构建

```bash
# 构建指定模块
mvn clean package -pl my-project-service

# 构建指定模块及其依赖
mvn clean package -pl my-project-service -am

# 构建依赖指定模块的模块
mvn clean package -pl my-project-service -amd

# 排除指定模块
mvn clean package -pl !my-project-web
```

### 3. 并行构建

```bash
# 使用多线程构建（C表示CPU核心数）
mvn clean package -T 1C

# 指定线程数
mvn clean package -T 4
```

### 4. 构建配置文件

#### 创建构建配置文件

**构建全部模块（build-all.sh）**
```bash
#!/bin/bash
echo "开始构建所有模块..."
mvn clean package -T 1C
echo "构建完成！"
```

**构建并跳过测试（build-skip-test.sh）**
```bash
#!/bin/bash
echo "构建项目（跳过测试）..."
mvn clean package -DskipTests -T 1C
echo "构建完成！"
```

## 最佳实践

### 1. 项目结构最佳实践

#### 模块命名规范
- 使用统一的命名前缀：`项目名-模块功能`
- 模块名称要清晰表达其职责
- 避免使用缩写，使用完整的英文单词

#### 目录结构规范
```
my-project/
├── docs/                     # 项目文档
├── scripts/                  # 构建脚本
├── my-project-bom/          # BOM模块（可选）
├── my-project-common/       # 公共模块
├── my-project-api/          # API定义模块
├── my-project-core/         # 核心业务模块
├── my-project-web/          # Web模块
├── my-project-app/          # 应用启动模块
└── my-project-tests/        # 集成测试模块
```

### 2. 依赖管理最佳实践

#### 版本管理原则
```xml
<properties>
    <!-- 主要框架版本 -->
    <spring.boot.version>2.7.2</spring.boot.version>
    <spring.cloud.version>2021.0.3</spring.cloud.version>
    
    <!-- 数据库相关版本 -->
    <mysql.version>8.0.29</mysql.version>
    <mybatis.spring.boot.version>2.2.2</mybatis.spring.boot.version>
    
    <!-- 工具类版本 -->
    <commons.lang3.version>3.12.0</commons.lang3.version>
    <jackson.version>2.13.3</jackson.version>
    
    <!-- 测试框架版本 -->
    <junit.version>5.8.2</junit.version>
    <mockito.version>4.6.1</mockito.version>
</properties>
```

#### 依赖分层管理
1. **基础设施层依赖**：数据库、缓存、消息队列
2. **框架层依赖**：Spring、MyBatis等框架
3. **业务层依赖**：业务相关的第三方库
4. **工具层依赖**：通用工具类

### 3. 构建性能优化

#### Maven构建优化配置
```xml
<properties>
    <!-- 跳过不必要的操作 -->
    <maven.javadoc.skip>true</maven.javadoc.skip>
    <maven.source.skip>true</maven.source.skip>
    
    <!-- 编译器优化 -->
    <maven.compiler.fork>true</maven.compiler.fork>
    <maven.compiler.maxmem>1024m</maven.compiler.maxmem>
</properties>
```

#### 使用Maven Wrapper
```bash
# 生成Maven Wrapper
mvn -N io.takari:maven:wrapper

# 使用Wrapper构建
./mvnw clean package
```

### 4. 测试策略

#### 测试模块分离
```
my-project/
├── my-project-common/
│   ├── src/main/java/
│   └── src/test/java/        # 单元测试
├── my-project-service/
│   ├── src/main/java/
│   └── src/test/java/        # 单元测试
└── my-project-integration-tests/  # 集成测试模块
    └── src/test/java/
```

#### 测试配置
```xml
<!-- 单元测试配置 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-surefire-plugin</artifactId>
    <configuration>
        <includes>
            <include>**/*Test.java</include>
            <include>**/*Tests.java</include>
        </includes>
    </configuration>
</plugin>

<!-- 集成测试配置 -->
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-failsafe-plugin</artifactId>
    <configuration>
        <includes>
            <include>**/*IT.java</include>
            <include>**/*IntegrationTest.java</include>
        </includes>
    </configuration>
</plugin>
```

## 常见问题及解决方案

### 1. 循环依赖问题

#### 问题现象
```
[ERROR] The projects in the reactor contain a cyclic reference
```

#### 解决方案
1. **重新设计模块依赖关系**：确保依赖是单向的
2. **提取公共接口**：将共同依赖的接口提取到独立模块
3. **使用事件驱动**：通过事件机制解耦模块间的直接依赖

#### 示例重构
```
// 重构前（存在循环依赖）
my-project-service → my-project-dao
my-project-dao → my-project-service

// 重构后（消除循环依赖）
my-project-service → my-project-dao
my-project-service → my-project-api
my-project-dao → my-project-api
```

### 2. 版本冲突问题

#### 问题现象
```
[WARNING] The POM for xxx:jar:1.0 is invalid
```

#### 解决方案
1. **使用dependencyManagement统一版本**
2. **使用maven-dependency-plugin分析依赖**
3. **显式排除冲突依赖**

#### 依赖分析命令
```bash
# 查看依赖树
mvn dependency:tree

# 分析依赖冲突
mvn dependency:analyze

# 查看有效POM
mvn help:effective-pom
```

### 3. 构建顺序问题

#### 问题现象
模块构建顺序错误导致找不到依赖

#### 解决方案
1. **正确配置模块顺序**：在父POM中按依赖关系排列modules
2. **使用reactor插件**：让Maven自动计算构建顺序

```xml
<!-- 正确的模块顺序 -->
<modules>
    <module>my-project-common</module>    <!-- 被其他模块依赖 -->
    <module>my-project-api</module>       <!-- 接口定义 -->
    <module>my-project-dao</module>       <!-- 数据访问层 -->
    <module>my-project-service</module>   <!-- 业务逻辑层 -->
    <module>my-project-web</module>       <!-- 表现层 -->
    <module>my-project-app</module>       <!-- 应用启动 -->
</modules>
```

### 4. 内存不足问题

#### 问题现象
```
java.lang.OutOfMemoryError: Java heap space
```

#### 解决方案
1. **增加Maven内存配置**
2. **优化构建参数**

```bash
# 设置Maven内存选项
export MAVEN_OPTS="-Xmx2048m -XX:MaxPermSize=512m"

# 或者在构建时指定
mvn clean package -Dmaven.compiler.maxmem=1024m
```

### 5. 快照版本问题

#### 问题现象
快照版本没有及时更新

#### 解决方案
```bash
# 强制更新快照版本
mvn clean package -U

# 或者删除本地仓库中的快照版本
rm -rf ~/.m2/repository/com/example/my-project
```

---

## 总结

Maven多模块项目是大型Java项目的标准组织方式，通过合理的模块划分和依赖管理，可以实现代码的高内聚、低耦合，提高开发效率和代码质量。

关键要点：
1. 合理设计模块结构和依赖关系
2. 统一管理依赖版本和插件配置
3. 遵循最佳实践和命名规范
4. 及时解决构建过程中的问题
5. 持续优化构建性能

通过遵循本指南的建议，您可以构建出结构清晰、易于维护的Maven多模块项目。