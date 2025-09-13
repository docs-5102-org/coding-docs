---
title: Maven SCM 使用指南
category:
  - Maven
---

# Maven SCM 使用指南 - SVN 配置详解

## 目录

[[toc]]

## 概述

Maven SCM（Software Configuration Management，软件配置管理）插件为 Maven 项目提供了统一的版本控制操作接口。该插件支持多种版本控制系统，包括 SVN、CVS、Git 等，截至 1.8.1 版本，共支持 18 个命令。

## 支持的 SCM 命令

### 核心命令列表

Maven SCM 插件提供以下 18 个命令：

| 命令 | 功能描述 |
|------|----------|
| `scm:branch` | 创建项目分支 |
| `scm:validate` | 校验 POM 中的 SCM 配置信息 |
| `scm:add` | 添加文件到版本控制 |
| `scm:unedit` | 停止编辑当前工作副本 |
| `scm:export` | 导出全新的代码副本 |
| `scm:bootstrap` | 检出并构建项目 |
| `scm:changelog` | 显示源码修订历史 |
| `scm:list` | 列出项目文件清单 |
| `scm:checkin` | 提交代码变更 |
| `scm:checkout` | 检出源代码 |
| `scm:status` | 显示工作副本的 SCM 状态 |
| `scm:update` | 从服务器获取最新版本 |
| `scm:diff` | 比较本地与远程代码差异 |
| `scm:update-subprojects` | 更新多模块项目中的子项目 |
| `scm:edit` | 开始编辑工作副本 |
| `scm:tag` | 为特定版本创建标签 |

### 常用命令

在日常开发中，最常用的两个命令是：

- **`scm:checkin`** - 提交代码变更到版本控制系统
- **`scm:update`** - 从服务器获取最新版本的代码

## POM 配置

### 基础 SCM 配置

在 `pom.xml` 文件中添加 SCM 配置：

```xml
<project>
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.example</groupId>
    <artifactId>scm-sample-project</artifactId>
    <packaging>jar</packaging>
    <version>1.0-SNAPSHOT</version>
    <name>SCM Sample Project</name>
    <url>http://somecompany.com</url>
    
    <scm>
        <connection>scm:svn:http://somerepository.com/svn_repo/trunk</connection>
        <developerConnection>scm:svn:https://somerepository.com/svn_repo/trunk</developerConnection>
        <url>http://somerepository.com/view.cvs</url>
    </scm>
</project>
```

### SCM 插件配置

配置 Maven SCM 插件：

```xml
<project>
    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-scm-plugin</artifactId>
                <version>1.8.1</version>
                <configuration>
                    <connectionType>connection</connectionType>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## 连接类型

Maven SCM 支持两种连接类型：

### 1. connection
- 用于只读访问
- 通常使用 HTTP 协议
- 适用于匿名访问或只需读取权限的场景

### 2. developerConnection
- 用于读写访问
- 通常使用 HTTPS 或 SSH 协议
- 适用于需要提交代码的开发者

### 连接类型配置示例

**使用 connection 连接类型：**

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-scm-plugin</artifactId>
    <version>1.8.1</version>
    <configuration>
        <connectionType>connection</connectionType>
    </configuration>
</plugin>
```

**使用 developerConnection 连接类型：**

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-scm-plugin</artifactId>
    <version>1.8.1</version>
    <configuration>
        <connectionType>developerConnection</connectionType>
    </configuration>
</plugin>
```

## 常用命令操作

### 提交代码变更

```bash
mvn -Dmessage="提交说明信息" scm:checkin
```

### 获取最新版本

```bash
mvn scm:update
```

### 查看工作副本状态

```bash
mvn scm:status
```

### 查看代码差异

```bash
mvn scm:diff
```

## 最佳实践

1. **统一 SCM 操作**：使用 Maven SCM 插件可以统一不同版本控制系统的操作命令，提高开发效率。

2. **合理选择连接类型**：
   - 开发者应使用 `developerConnection` 获得完整的读写权限
   - 持续集成系统可以使用 `connection` 进行只读访问

3. **版本管理**：建议将 SCM 插件版本固定在 POM 中，确保团队使用一致的插件版本。

4. **提交信息**：使用 `-Dmessage` 参数提供有意义的提交说明，便于后续代码审查和维护。

## 注意事项

- 确保 SCM 配置信息正确，可以使用 `scm:validate` 命令进行验证
- 在执行 SCM 操作前，建议先检查工作副本状态
- 对于多模块项目，可以使用 `scm:update-subprojects` 命令统一更新所有子模块

通过合理配置和使用 Maven SCM 插件，可以有效简化版本控制操作，提高开发团队的协作效率。