---
title: Maven Settings.xml配置详解
category:
  - Maven
---

# Maven Settings.xml 配置详解

## 目录

[[toc]]

## 概述

Maven settings.xml 是 Maven 的全局配置文件，用于配置 Maven 的运行环境、仓库、插件、认证信息等。该文件控制着 Maven 在构建过程中的行为，是 Maven 项目管理的核心配置文件。

## 配置文件位置

Maven settings.xml 文件可以存放在两个位置：

### User Level（用户级别）
- **位置**：`${user.home}/.m2/settings.xml`
- **作用范围**：仅影响当前用户
- **优先级**：高（会覆盖全局配置）
- **命令行覆盖**：`-s /path/to/user/settings.xml`

### Global Level（全局级别）
- **位置**：`${maven.home}/conf/settings.xml`
- **作用范围**：影响所有用户和所有项目
- **优先级**：低
- **命令行覆盖**：`-gs /path/to/global/settings.xml`

## 基本配置结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 
          http://maven.apache.org/xsd/settings-1.0.0.xsd">
  
  <!-- 本地仓库路径 -->
  <localRepository/>
  
  <!-- 是否与用户交互 -->
  <interactiveMode/>
  
  <!-- 是否离线模式 -->
  <offline/>
  
  <!-- 插件组 -->
  <pluginGroups/>
  
  <!-- 代理配置 -->
  <proxies/>
  
  <!-- 服务器认证 -->
  <servers/>
  
  <!-- 镜像配置 -->
  <mirrors/>
  
  <!-- 配置文件 -->
  <profiles/>
  
  <!-- 激活的配置文件 -->
  <activeProfiles/>
  
</settings>
```

## 核心配置详解

### 1. 本地仓库配置（localRepository）

本地仓库是 Maven 存储项目依赖和插件的本地目录。

```xml
<localRepository>/path/to/local/repo</localRepository>
```

**配置说明：**
- **默认位置**：`~/.m2/repository`
- **作用**：指定存储Maven要用到jar包的本地仓库位置
- **建议**：配置到具有足够空间的磁盘分区，避免使用中文和特殊字符

### 2. 交互模式配置（interactiveMode）

指定当需要输入时，Maven是否提示用户。

```xml
<interactiveMode>true</interactiveMode>
```

**配置说明：**
- **默认值**：`true`
- **false**：Maven会使用合理的默认值，可能基于其他设置
- **true**：需要用户输入时会提示

### 3. 离线模式配置（offline）

指定在构建时是否需要Maven连接网络。

```xml
<offline>false</offline>
```

**配置说明：**
- **默认值**：`false`
- **true**：离线模式，不会连接网络下载依赖
- **false**：在线模式，可以连接网络下载依赖

### 4. 插件组配置（pluginGroups）

定义Maven搜索插件时的groupId列表。

```xml
<pluginGroups>
  <pluginGroup>com.your.plugins</pluginGroup>
  <pluginGroup>org.sonarsource.scanner.maven</pluginGroup>
</pluginGroups>
```

**配置说明：**
- **作用**：当执行命令`mvn prefix:goal`时，Maven会自动搜索这些group
- **默认包含**：`org.apache.maven.plugins` 和 `org.codehaus.mojo`
- **使用场景**：添加自定义插件组或第三方插件组

### 5. 代理配置（proxies）

当无法直接连接中央仓库时使用代理设置。

```xml
<proxies>
  <proxy>
    <id>my-proxy</id>
    <active>true</active>
    <protocol>http</protocol>
    <username>proxyuser</username>
    <password>proxypass</password>
    <host>proxy.host.net</host>
    <port>80</port>
    <nonProxyHosts>local.net|some.host.com</nonProxyHosts>
  </proxy>
</proxies>
```

**配置参数说明：**
- **id**：代理的唯一标识
- **active**：是否激活该代理
- **protocol**：代理协议（http/https）
- **username/password**：代理认证信息
- **host/port**：代理服务器地址和端口
- **nonProxyHosts**：不使用代理的主机列表（用|分隔）

### 6. 服务器认证配置（servers）

配置连接到特定服务器时的认证信息。

```xml
<servers>
  <!-- 用户名密码认证 -->
  <server>
    <id>deploymentRepo</id>
    <username>repouser</username>
    <password>repopwd</password>
  </server>
  
  <!-- 私钥认证 -->
  <server>
    <id>siteServer</id>
    <privateKey>/path/to/private/key</privateKey>
    <passphrase>可选，如果不用的话，置空</passphrase>
  </server>
</servers>
```

**认证方式：**
- **用户名/密码**：适用于大多数Maven仓库
- **私钥/口令**：适用于SSH连接的仓库
- **注意**：确保用户名和密码配对，私钥和口令配对

### 7. 镜像配置（mirrors）

配置仓库镜像，用于替换默认的中央仓库。

```xml
<mirrors>
  <!-- 阿里云镜像 -->
  <mirror>
    <id>aliyunmaven</id>
    <mirrorOf>central</mirrorOf>
    <name>阿里云公共仓库</name>
    <url>https://maven.aliyun.com/repository/public</url>
  </mirror>
  
  <!-- 华为云镜像 -->
  <mirror>
    <id>huaweicloud</id>
    <mirrorOf>central</mirrorOf>
    <name>华为云仓库</name>
    <url>https://repo.huaweicloud.com/repository/maven/</url>
  </mirror>
  
  <!-- 镜像所有仓库 -->
  <mirror>
    <id>nexus</id>
    <mirrorOf>*</mirrorOf>
    <name>内部nexus仓库</name>
    <url>http://nexus.company.com/repository/maven-public/</url>
  </mirror>
</mirrors>
```

**mirrorOf 参数说明：**
- **central**：只镜像中央仓库
- **\***：镜像所有仓库
- **external:\***：镜像除本地仓库外的所有仓库
- **repo1,repo2**：镜像指定的仓库
- **\*,!repo1**：镜像所有仓库，除了repo1

### 8. 配置文件（profiles）

定义不同环境下的构建配置。

```xml
<profiles>
  <!-- JDK版本配置 -->
  <profile>
    <id>jdk-1.8</id>
    <activation>
      <jdk>1.8</jdk>
    </activation>
    <properties>
      <maven.compiler.source>1.8</maven.compiler.source>
      <maven.compiler.target>1.8</maven.compiler.target>
    </properties>
  </profile>
  
  <!-- 开发环境配置 -->
  <profile>
    <id>env-dev</id>
    <activation>
      <property>
        <name>target-env</name>
        <value>dev</value>
      </property>
    </activation>
    <properties>
      <tomcatPath>/path/to/tomcat/instance</tomcatPath>
      <database.url>jdbc:mysql://localhost:3306/dev_db</database.url>
    </properties>
    <repositories>
      <repository>
        <id>dev-repo</id>
        <name>开发环境仓库</name>
        <url>http://dev.repo.com/maven2</url>
        <layout>default</layout>
        <snapshots>
          <enabled>true</enabled>
          <updatePolicy>always</updatePolicy>
        </snapshots>
      </repository>
    </repositories>
  </profile>
  
  <!-- 生产环境配置 -->
  <profile>
    <id>env-prod</id>
    <activation>
      <activeByDefault>false</activeByDefault>
    </activation>
    <properties>
      <database.url>jdbc:mysql://prod.db.com:3306/prod_db</database.url>
      <log.level>WARN</log.level>
    </properties>
  </profile>
</profiles>
```

**Profile激活方式：**
- **activeByDefault**：默认激活
- **jdk**：根据JDK版本激活
- **os**：根据操作系统激活
- **property**：根据系统属性激活
- **file**：根据文件存在与否激活

### 9. 激活的配置文件（activeProfiles）

指定默认激活的profile。

```xml
<activeProfiles>
  <activeProfile>env-dev</activeProfile>
  <activeProfile>jdk-1.8</activeProfile>
</activeProfiles>
```

## 完整配置示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.0.0 
          http://maven.apache.org/xsd/settings-1.0.0.xsd">

  <!-- 本地仓库路径 -->
  <localRepository>D:/maven/repository</localRepository>
  
  <!-- 交互模式 -->
  <interactiveMode>true</interactiveMode>
  
  <!-- 离线模式 -->
  <offline>false</offline>
  
  <!-- 插件组 -->
  <pluginGroups>
    <pluginGroup>org.sonarsource.scanner.maven</pluginGroup>
  </pluginGroups>
  
  <!-- 代理配置 -->
  <proxies>
    <proxy>
      <id>company-proxy</id>
      <active>true</active>
      <protocol>http</protocol>
      <host>proxy.company.com</host>
      <port>8080</port>
      <nonProxyHosts>localhost|127.0.0.1|*.company.com</nonProxyHosts>
    </proxy>
  </proxies>
  
  <!-- 服务器认证 -->
  <servers>
    <server>
      <id>nexus-releases</id>
      <username>deployment</username>
      <password>deployment123</password>
    </server>
    <server>
      <id>nexus-snapshots</id>
      <username>deployment</username>
      <password>deployment123</password>
    </server>
  </servers>
  
  <!-- 镜像配置 -->
  <mirrors>
    <mirror>
      <id>aliyunmaven</id>
      <mirrorOf>central</mirrorOf>
      <name>阿里云公共仓库</name>
      <url>https://maven.aliyun.com/repository/public</url>
    </mirror>
  </mirrors>
  
  <!-- Profile配置 -->
  <profiles>
    <profile>
      <id>jdk-1.8</id>
      <activation>
        <activeByDefault>true</activeByDefault>
        <jdk>1.8</jdk>
      </activation>
      <properties>
        <maven.compiler.source>1.8</maven.compiler.source>
        <maven.compiler.target>1.8</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
      </properties>
    </profile>
    
    <profile>
      <id>nexus</id>
      <repositories>
        <repository>
          <id>nexus</id>
          <name>公司Nexus仓库</name>
          <url>http://nexus.company.com/repository/maven-public/</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>true</enabled>
          </snapshots>
        </repository>
      </repositories>
      <pluginRepositories>
        <pluginRepository>
          <id>nexus</id>
          <name>公司Nexus插件仓库</name>
          <url>http://nexus.company.com/repository/maven-public/</url>
          <releases>
            <enabled>true</enabled>
          </releases>
          <snapshots>
            <enabled>true</enabled>
          </snapshots>
        </pluginRepository>
      </pluginRepositories>
    </profile>
  </profiles>
  
  <!-- 激活的Profile -->
  <activeProfiles>
    <activeProfile>jdk-1.8</activeProfile>
    <activeProfile>nexus</activeProfile>
  </activeProfiles>
  
</settings>
```

## 最佳实践

### 1. 安全性
- 避免在settings.xml中明文存储密码
- 使用Maven密码加密功能
- 限制settings.xml文件的访问权限

### 2. 性能优化
- 配置合适的本地仓库路径
- 使用距离较近的镜像仓库
- 合理设置快照更新策略

### 3. 团队协作
- 使用profile区分不同环境
- 在全局settings.xml中配置通用设置
- 在用户settings.xml中配置个人专用设置

### 4. 维护管理
- 定期清理本地仓库
- 更新镜像仓库地址
- 及时更新认证信息

## 常用命令

```bash
# 查看有效的settings.xml配置
mvn help:effective-settings

# 使用指定的settings文件
mvn -s /path/to/settings.xml compile

# 激活指定的profile
mvn -P profile-name compile

# 设置系统属性激活profile
mvn -Dtarget-env=dev compile
```

## 参考资源

- [Maven官方Settings配置文档](http://maven.apache.org/settings.html)
- [Maven仓库镜像配置指南](https://maven.apache.org/guides/mini/guide-mirror-settings.html)
- [Maven密码加密指南](https://maven.apache.org/guides/mini/guide-encryption.html)
- **目前项目已有的配置** 
链接: https://pan.baidu.com/s/11gYiuEct179WGGFYaVn1FQ 密码: v85i