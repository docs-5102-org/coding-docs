---
title: Maven 集成老版Tomcat插件
category:
  - Maven
---

# Maven 集成老版Tomcat插件完整指南

## 目录

[[toc]]

## 概述

Maven已经是Java项目管理的标配工具，在JavaEE开发中如何使用Maven调用Web应用是很多开发者关心的问题。Maven Tomcat插件主要有两个版本：`tomcat-maven-plugin`（适用于Tomcat 6）和`tomcat7-maven-plugin`（适用于Tomcat 7），它们的使用方式基本相同。

本文将详细介绍如何配置和使用这些插件来实现热部署和调试功能。

## 插件版本对比

| 插件名称 | 适用版本 | 官方地址 |
|---------|---------|----------|
| tomcat-maven-plugin | Tomcat 6.x | http://mojo.codehaus.org/tomcat-maven-plugin/plugin-info.html |
| tomcat7-maven-plugin | Tomcat 7.x | http://tomcat.apache.org/maven-plugin.html |

## Tomcat 6 插件配置

### 1. POM.xml 插件配置

在项目的 `pom.xml` 文件中添加以下插件：

```xml
<plugin>
    <groupId>org.codehaus.mojo</groupId>
    <artifactId>tomcat-maven-plugin</artifactId>
    <version>1.1</version>
    <configuration>
        <path>/wp</path>
        <port>8080</port>
        <uriEncoding>UTF-8</uriEncoding>
        <url>http://localhost:8080/manager/html</url>
        <server>tomcat6</server>
    </configuration>
</plugin>
```

**配置参数说明：**
- `path`：访问应用的路径
- `port`：Tomcat的端口号
- `uriEncoding`：URL按UTF-8进行编码，解决中文参数乱码问题
- `server`：指定Tomcat名称

### 2. 用于热部署的高级配置

如果需要实现热部署功能，可以使用以下配置：

```xml
<plugin>
    <groupId>org.apache.tomcat.maven</groupId>
    <artifactId>tomcat6-maven-plugin</artifactId>
    <version>2.0-beta-1</version>
    <configuration>
        <url>http://localhost:8080/manager</url>
        <server>tomcat</server>
        <username>admin</username>
        <password>admin</password>
        <path>/fastdev_web</path>
        <contextReloadable>true</contextReloadable>
    </configuration>
</plugin>
```

### 3. Tomcat 用户权限配置

在 `%TOMCAT6_PATH%/conf/tomcat-users.xml` 文件中添加具有管理权限的用户：

```xml
<?xml version='1.0' encoding='utf-8'?>
<tomcat-users>
    <role rolename="admin"/>
    <role rolename="admin-gui"/>
    <role rolename="manager"/>
    <role rolename="manager-script"/>
    <role rolename="manager-gui"/>
    <role rolename="manager-jmx"/>
    <role rolename="manager-status"/>
    
    <user username="admin" password="admin" 
          roles="admin,manager,manager-gui,admin-gui,manager-script,manager-jmx,manager-status"/>
</tomcat-users>
```

### 4. Maven 认证配置

在 `%MAVEN_PATH%/conf/settings.xml` 文件中添加服务器认证信息：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings>
    <servers>
        <server>
            <id>tomcat</id>
            <username>admin</username>
            <password>admin</password>
        </server>
    </servers>
</settings>
```

### 5. 常用命令

| 命令 | 描述 |
|------|------|
| `tomcat:deploy` | 部署一个web war包 |
| `tomcat:reload` | 重新加载web war包 |
| `tomcat:start` | 启动tomcat |
| `tomcat:stop` | 停止tomcat |
| `tomcat:undeploy` | 停止一个war包 |
| `tomcat:run` | 启动嵌入式tomcat，并运行当前项目 |

**热部署命令：**
- 非远程模式（Tomcat未启动）：
  - 运行：`clean tomcat6:run`
  - 重新部署：`clean tomcat6:redeploy`
  - 清除部署：`tomcat6:undeploy`

- 远程服务器模式（Tomcat必须启动）：
  - 部署：`clean tomcat6:deploy`
  - 重新部署：`clean tomcat6:redeploy`
  - 清除部署：`tomcat6:undeploy`

## Tomcat 7 插件配置

### 1. POM.xml 插件配置

```xml
<plugin>
    <groupId>org.apache.tomcat.maven</groupId>
    <artifactId>tomcat7-maven-plugin</artifactId>
    <version>2.1</version>
    <configuration>
        <port>9090</port>
        <path>/mgr</path>
        <uriEncoding>UTF-8</uriEncoding>
        <finalName>mgr</finalName>
        <server>tomcat7</server>
    </configuration>
</plugin>
```

### 2. 用于部署的高级配置

```xml
<plugin>
    <groupId>org.apache.tomcat.maven</groupId>
    <artifactId>tomcat7-maven-plugin</artifactId>
    <version>2.2</version>
    <configuration>
        <url>http://localhost:8080/manager/text</url>
        <server>TomcatServer</server>
        <path>/yiibaiWebApp</path>
    </configuration>
</plugin>
```

### 3. Tomcat 用户权限配置

在 `%TOMCAT7_PATH%/conf/tomcat-users.xml` 文件中配置：

```xml
<?xml version='1.0' encoding='utf-8'?>
<tomcat-users>
    <role rolename="manager-gui"/>
    <role rolename="manager-script"/>
    <user username="admin" password="password" 
          roles="manager-gui,manager-script" />
</tomcat-users>
```

### 4. Maven 认证配置

在 `%MAVEN_PATH%/conf/settings.xml` 中配置：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings>
    <servers>
        <server>
            <id>TomcatServer</id>
            <username>admin</username>
            <password>password</password>
        </server>
    </servers>
</settings>
```

### 5. 常用命令

**注意：** Tomcat 7 插件的命令前缀是 `tomcat7:`

- `mvn tomcat7:deploy` - 部署应用
- `mvn tomcat7:undeploy` - 卸载应用
- `mvn tomcat7:redeploy` - 重新部署应用
- `mvn tomcat7:run` - 运行嵌入式Tomcat

## Eclipse 集成使用

### 1. 运行配置

如果Eclipse安装了Maven插件，可以通过以下步骤运行：

1. 选择 `pom.xml` 文件
2. 右键选择 `Run As` → `Maven build`
3. 在Goals框中输入相应命令，如：`tomcat:run` 或 `tomcat7:run`

### 2. 首次运行设置

第一次运行时会弹出对话框，在Goals框中添加以下命令：
- 对于Tomcat 6：`tomcat:run`
- 对于Tomcat 7：`tomcat7:run`

## 部署示例

### Tomcat 6 部署示例

```bash
> mvn tomcat6:deploy

[INFO] Deploying war to http://localhost:8080/yiibaiWebApp
Uploading: http://localhost:8080/manager/deploy?path=%2FyiibaiWebApp
Uploaded: http://localhost:8080/manager/deploy?path=%2FyiibaiWebApp (13925 KB at 32995.5 KB/sec)

[INFO] BUILD SUCCESS
[INFO] Total time: 22.652 s
```

### Tomcat 7 部署示例

```bash
> mvn tomcat7:deploy

[INFO] Deploying war to http://localhost:8080/yiibaiWebApp
Uploading: http://localhost:8080/manager/text/deploy?path=%2FyiibaiWebApp&update=true
Uploaded: http://localhost:8080/manager/text/deploy?path=%2FyiibaiWebApp&update=true (13925 KB at 35250.9 KB/sec)

[INFO] tomcatManager status code:200, ReasonPhrase:OK
[INFO] OK - Deployed application at context path /yiibaiWebApp
[INFO] BUILD SUCCESS
[INFO] Total time: 8.507 s
```

## 常见问题与解决方案

### 1. Maven项目无法直接部署到Tomcat

**问题：** Maven项目，特别是Maven模块项目默认情况下无法直接通过Tomcat等容器部署。

**原因：** Maven项目的目录结构不是标准的Web目录结构，web.xml项目描述符不在Tomcat所能识别的目录下。

**解决方案：** 使用tomcat-maven-plugin插件来解决这个问题。

### 2. URL配置差异

**重要提示：** Tomcat 6 和 Tomcat 7 的管理URL不同：
- Tomcat 6：`http://localhost:8080/manager`
- Tomcat 7：`http://localhost:8080/manager/text`

### 3. 热部署配置要点

为了实现热部署功能，需要确保：
1. `contextReloadable` 设置为 `true`
2. 正确配置用户权限
3. Maven settings.xml 中的server id与pom.xml中的配置一致

## 总结

Maven Tomcat插件为Java Web开发提供了便捷的部署和调试解决方案。通过正确配置这些插件，开发者可以：

1. 避免每次修改都需要手动打包部署的麻烦
2. 实现代码修改的实时生效
3. 提高开发效率
4. 简化项目的部署流程

选择合适的插件版本（tomcat-maven-plugin用于Tomcat 6，tomcat7-maven-plugin用于Tomcat 7），并按照本文的配置步骤进行设置，即可享受便捷的Maven集成开发体验。