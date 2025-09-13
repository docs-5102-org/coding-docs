---
title: Maven 入门教程
category:
  - Maven
---

# Maven 入门教程

## 目录

[[toc]]

## 什么是 Maven？

Apache Maven 是一个软件项目管理和理解工具。基于项目对象模型（POM）的概念，Maven 可以从一个中心信息片段管理项目的构建、报告和文档。

Maven 的主要功能包括：
- **依赖管理**：自动下载和管理项目所需的第三方库
- **项目构建**：提供标准的项目结构和构建生命周期
- **项目信息管理**：生成项目文档、报告等
- **多模块项目支持**：管理复杂的多模块项目

## Maven 核心概念

### 1. POM（Project Object Model）
POM 是 Maven 项目的核心，通过 `pom.xml` 文件描述项目信息、依赖关系、构建配置等。

### 2. 坐标（Coordinates）
Maven 使用三个坐标来唯一标识一个项目：
- **groupId**：组织或公司的唯一标识符
- **artifactId**：项目的唯一标识符
- **version**：项目版本号

### 3. 仓库（Repository）
- **本地仓库**：存储在本地计算机上的仓库
- **中央仓库**：Maven 官方提供的远程仓库
- **私有仓库**：组织内部搭建的仓库

### 4. 生命周期（Lifecycle）
Maven 有三个标准生命周期：
- **default**：处理项目的构建和部署
- **clean**：清理项目
- **site**：生成项目站点文档

## Maven 安装配置

### Windows 和 Mac 安装

#### 前提条件
确保已安装 Java JDK 8 或更高版本，并设置好 `JAVA_HOME` 环境变量。

#### 安装步骤
1. 访问 [Maven 官网](https://maven.apache.org/download.cgi) 下载最新版本
2. 解压到指定目录（如：`C:\Program Files\Apache\maven`）
3. 设置环境变量：
   - 新建 `MAVEN_HOME` 变量，值为 Maven 安装目录
   - 在 `PATH` 变量中添加 `%MAVEN_HOME%\bin`
4. 验证安装：打开命令行执行 `mvn -v`

详细安装教程可参考：[菜鸟教程 Maven 安装](https://www.runoob.com/maven/maven-setup.html)

### Linux 安装

#### 下载解压
```bash
# 下载 Maven
wget http://dlcdn.apache.org/maven/maven-3/3.8.6/binaries/apache-maven-3.8.6-bin.tar.gz

# 解压
tar -xvf apache-maven-3.8.6-bin.tar.gz

# 移动到 /usr/local/ 目录
mv apache-maven-3.8.6 /usr/local/
```

#### 设置环境变量

编辑系统环境配置文件：

```bash
vi /etc/profile
```

在文件末尾添加：
```bash
export MAVEN_HOME=/usr/local/apache-maven-3.8.6
export PATH=${PATH}:${MAVEN_HOME}/bin
```

使环境变量生效：
```bash
source /etc/profile
```

#### 验证安装
```bash
mvn -v
```

成功安装后应显示类似输出：
```
Apache Maven 3.8.6 (84538c9988a25aec085021c365c560670ad80f63)
Maven home: /usr/local/apache-maven-3.8.6
Java version: 1.8.0_341, vendor: Oracle Corporation
Default locale: zh_CN, platform encoding: UTF-8
OS name: "linux", version: "3.10.0-1062.el7.x86_64", arch: "amd64"
```

## 创建第一个 Maven 项目

### 使用命令行创建项目
```bash
mvn archetype:generate -DgroupId=com.example -DartifactId=my-first-maven-project -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false
```

### 项目目录结构
```
my-first-maven-project/
├── pom.xml
└── src/
    ├── main/
    │   └── java/
    │       └── com/
    │           └── example/
    │               └── App.java
    └── test/
        └── java/
            └── com/
                └── example/
                    └── AppTest.java
```

### pom.xml 基本结构
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>com.example</groupId>
    <artifactId>my-first-maven-project</artifactId>
    <version>1.0-SNAPSHOT</version>
    <packaging>jar</packaging>
    
    <properties>
        <maven.compiler.source>8</maven.compiler.source>
        <maven.compiler.target>8</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

## 常用 Maven 命令

### 构建相关命令
- `mvn compile`：编译项目源代码
- `mvn test`：运行单元测试
- `mvn package`：打包项目（生成 jar 或 war 文件）
- `mvn install`：将项目安装到本地仓库
- `mvn deploy`：将项目部署到远程仓库
- `mvn clean`：清理项目（删除 target 目录）

### 组合命令
- `mvn clean compile`：先清理再编译
- `mvn clean package`：先清理再打包
- `mvn clean install`：先清理再安装到本地仓库

### 其他有用命令
- `mvn dependency:tree`：查看依赖树
- `mvn help:effective-pom`：查看有效的 POM 配置
- `mvn archetype:generate`：创建新项目

## 依赖管理

### 添加依赖
在 `pom.xml` 的 `<dependencies>` 标签中添加依赖：
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.21</version>
</dependency>
```

### 依赖范围（Scope）
- `compile`：默认范围，编译、测试、运行时都需要
- `test`：仅在测试时需要
- `provided`：编译和测试时需要，运行时由容器提供
- `runtime`：运行和测试时需要，编译时不需要
- `system`：与 provided 类似，但需要显式指定 jar 路径

更详细参考：[Maven 依赖范围（Scope）详解](./scope.md)

### 依赖冲突解决
Maven 使用"最近依赖策略"解决冲突：
- 依赖路径最短的版本优先
- 相同路径长度时，先声明的优先

可以使用 `<exclusions>` 排除特定依赖：
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-core</artifactId>
    <version>5.3.21</version>
    <exclusions>
        <exclusion>
            <groupId>commons-logging</groupId>
            <artifactId>commons-logging</artifactId>
        </exclusion>
    </exclusions>
</dependency>
```

## Maven 配置

### settings.xml 配置文件
Maven 的配置文件位于：
- 全局配置：`${MAVEN_HOME}/conf/settings.xml`
- 用户配置：`${user.home}/.m2/settings.xml`

### 配置本地仓库路径
```xml
<settings>
    <localRepository>/path/to/local/repo</localRepository>
</settings>
```

### 配置镜像仓库
```xml
<mirrors>
    <mirror>
        <id>aliyun</id>
        <mirrorOf>central</mirrorOf>
        <name>Aliyun Central</name>
        <url>https://maven.aliyun.com/repository/central</url>
    </mirror>
</mirrors>
```

## 最佳实践

### 1. 项目结构规范
遵循 Maven 标准目录布局，便于团队协作和工具集成。

### 2. 版本管理
- 使用语义化版本号（如：1.2.3）
- 开发版本使用 SNAPSHOT 后缀
- 发布版本不使用 SNAPSHOT

### 3. 依赖管理
- 及时更新依赖版本，关注安全漏洞
- 使用 `dependencyManagement` 统一管理版本
- 避免使用过多的依赖

### 4. 配置管理
- 使用 profiles 管理不同环境的配置
- 敏感信息不要写在 pom.xml 中

## 常见问题解决

### 1. 依赖下载失败
- 检查网络连接
- 配置合适的镜像仓库
- 删除本地仓库中损坏的文件

### 2. 编译错误
- 检查 Java 版本配置
- 确认依赖版本兼容性
- 清理并重新构建项目

### 3. 测试失败
- 检查测试代码和配置
- 确认测试依赖是否正确
- 查看详细的错误日志

## 总结

Maven 是 Java 项目开发中不可或缺的构建工具。通过本教程，您应该已经掌握了：
- Maven 的基本概念和核心功能
- 如何在不同操作系统上安装配置 Maven
- 创建和管理 Maven 项目
- 使用常用的 Maven 命令
- 依赖管理的最佳实践

继续学习和实践，您将能够更好地利用 Maven 来管理和构建您的 Java 项目。

## 参考资料

- [Apache Maven 官网](https://maven.apache.org/)
- [Maven 中央仓库](https://mvnrepository.com/)
- [菜鸟教程 Maven 教程](https://www.runoob.com/maven/maven-tutorial.html)