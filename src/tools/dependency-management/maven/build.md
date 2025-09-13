---
title: Maven build标签详解
category:
  - Maven
---

# Maven build标签详解

## 目录

[[toc]]

## 概述

Maven的`<build>`标签是项目构建配置的核心部分，它定义了项目的构建过程、资源处理、插件配置等重要信息。通过合理配置build标签，可以实现项目的自定义构建需求，包括打包外部jar文件、处理资源文件、配置编译参数等。

## build标签结构详解

### 1. 基本结构

```xml
<build>
  <!-- 构建配置内容 -->
</build>
```

### 2. finalName - 指定打包文件名称

`<finalName>`标签用于指定最终生成文件的名称，可以用于去除jar文件的版本号。

```xml
<build>
  <finalName>maven-build-demo</finalName>
</build>
```

**作用：**
- 自定义输出文件名
- 去除版本号，便于部署
- 统一命名规范

### 3. filters - 过滤资源目录

`<filters>`标签用于指定资源过滤文件，实现配置文件的动态替换。

```xml
<build>
  <filters>
    <filter>${basedir}/profiles/test/test.properties</filter>
  </filters>
</build>
```

**功能：**
- 定义过滤资源文件路径
- 支持占位符替换
- 实现环境配置分离

### 4. resources - 项目资源配置

`<resources>`标签是资源管理的核心，可以配置多个资源目录。

```xml
<build>
  <resources>
    <resource>
      <!-- 资源目录 -->
      <directory>src/main/resources</directory>
      
      <!-- 包含的文件类型 -->
      <includes>
        <include>*.properties</include>
        <include>*.xml</include>
        <include>*.json</include>
      </includes>
      
      <!-- 排除的文件类型 -->
      <excludes>
        <exclude>*.txt</exclude>
      </excludes>
      
      <!-- 输出目录 -->
      <targetPath>${build.outputDirectory}</targetPath>
      
      <!-- 是否开启资源过滤 -->
      <filtering>true</filtering>
    </resource>
  </resources>
</build>
```

**详细说明：**

- **directory**: 指定资源文件所在目录，编译时会将该目录内容复制到输出目录
- **includes**: 指定要包含的文件模式，只有匹配的文件才会被复制
- **excludes**: 指定要排除的文件模式，匹配的文件不会被复制
- **targetPath**: 指定输出目录，默认为`${build.outputDirectory}`（即target/classes）
- **filtering**: 是否开启资源过滤
  - `true`: 使用filters中定义的文件替换资源中的占位符（${Xxxx}）
  - `false`: 不进行过滤替换操作

### 5. plugins - 插件配置

`<plugins>`标签用于配置项目构建过程中需要使用的插件。

```xml
<build>
  <plugins>
    <!-- Spring Boot插件 -->
    <plugin>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-maven-plugin</artifactId>
      <configuration>
        <executable>true</executable>
      </configuration>
      <executions>
        <execution>
          <goals>
            <goal>repackage</goal>
          </goals>
        </execution>
      </executions>
    </plugin>
    
    <!-- 资源插件 -->
    <plugin>
      <groupId>org.apache.maven.plugins</groupId>
      <artifactId>maven-resources-plugin</artifactId>
      <executions>
        <execution>
          <id>copy-resources</id>
          <phase>validate</phase>
          <goals>
            <goal>copy-resources</goal>
          </goals>
          <configuration>
            <outputDirectory>${basedir}/target/classes/</outputDirectory>
            <resources>
              <resource>
                <directory>${basedir}/../profiles</directory>
                <filtering>false</filtering>
                <includes>
                  <include>**/*.xml</include>
                  <include>*.json</include>
                </includes>
              </resource>
            </resources>
          </configuration>
        </execution>
      </executions>
    </plugin>
  </plugins>
</build>
```

**插件配置要素：**

- **groupId、artifactId**: 插件的Maven坐标
- **configuration**: 插件配置参数
- **executions**: 执行配置
  - **id**: 执行标识ID
  - **phase**: 执行阶段（如validate、compile、package等）
  - **goals**: 执行目标

## 实际应用场景

### 场景1：引入外部Jar文件到jar包中

当项目依赖一些无法通过Maven仓库获取的第三方jar包时，可以通过以下配置将外部jar文件打入最终的jar包中：

```xml
<build>
  <finalName>goptcloud</finalName>
  <plugins>
    <plugin>
      <artifactId>maven-compiler-plugin</artifactId>
      <configuration>
        <source>1.8</source>
        <target>1.8</target>
        <encoding>UTF-8</encoding>
        <compilerArguments>
          <!-- Maven版本低于3.1时使用 -->
          <extdirs>E:\dev_workspace\company_workspace\goptcloud\src\main\webapp\WEB-INF\lib</extdirs>
        </compilerArguments>
        
        <!-- Maven版本高于3.1时使用以下配置 -->
        <!--
        <compilerArgs> 
          <arg>-extdirs</arg> 
          <arg>${project.basedir}/src/main/webapp/WEB-INF/lib</arg>
        </compilerArgs> 
        -->
      </configuration>
    </plugin>
  </plugins>
</build>
```

或

```xml
<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
			</plugin>
		</plugins>
		<resources>
        <resource><!-- 将指定目录的jar包或者是静态资源，打进JAr包中 -->
            <directory>${project.basedir}/lib</directory>
            <targetPath>BOOT-INF/lib/</targetPath>
            <includes>
                <include>**/*.jar</include>
            </includes>
        </resource>
    </resources>
	</build>
```

**注意事项：**
- Maven 3.1以下版本使用`<compilerArguments>`
- Maven 3.1以上版本使用`<compilerArgs>`
- 建议使用相对路径，提高项目的可移植性

### 场景2：打包XML文件到jar文件中

默认情况下，Maven只会将src/main/resources目录下的资源文件打包。如果需要将src/main/java目录下的XML文件也打包进去，可以使用以下配置：

```xml
<build>
  <finalName>goptcloud</finalName>
  <resources>
    <resource>
      <directory>src/main/java</directory>
      <includes>
        <include>**/*.xml</include>
      </includes>
      <filtering>true</filtering>
    </resource>
  </resources>
</build>
```

**应用场景：**
- MyBatis的Mapper XML文件与Java文件放在同一目录
- Spring配置文件与Java类放在一起
- 其他需要与Java代码同目录的配置文件

## 最佳实践

### 1. 环境配置分离

```xml
<build>
  <filters>
    <filter>profiles/${env}/config.properties</filter>
  </filters>
  <resources>
    <resource>
      <directory>src/main/resources</directory>
      <filtering>true</filtering>
    </resource>
  </resources>
</build>
```

通过Maven profiles实现不同环境的配置：

```bash
mvn clean package -Denv=dev    # 开发环境
mvn clean package -Denv=test   # 测试环境
mvn clean package -Denv=prod   # 生产环境
```

### 2. 资源文件优化

```xml
<build>
  <resources>
    <!-- 主资源目录 -->
    <resource>
      <directory>src/main/resources</directory>
      <excludes>
        <exclude>**/*.bak</exclude>
        <exclude>**/*.tmp</exclude>
      </excludes>
    </resource>
    
    <!-- 特殊配置文件 -->
    <resource>
      <directory>src/main/config</directory>
      <targetPath>config</targetPath>
      <includes>
        <include>**/*.properties</include>
      </includes>
    </resource>
  </resources>
</build>
```

### 3. 多模块项目配置

对于多模块项目，可以在父pom中定义通用的build配置：

```xml
<!-- 父pom.xml -->
<build>
  <pluginManagement>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <version>3.8.1</version>
        <configuration>
          <source>1.8</source>
          <target>1.8</target>
          <encoding>UTF-8</encoding>
        </configuration>
      </plugin>
    </plugins>
  </pluginManagement>
</build>
```

## 常见问题和解决方案

### 1. 资源文件找不到

**问题**: 运行时找不到配置文件
**解决**: 检查resource配置中的directory和targetPath设置

### 2. 外部jar包依赖问题

**问题**: 外部jar包无法正确引入
**解决**: 
- 确认Maven版本，选择正确的配置方式
- 使用install-file命令将jar安装到本地仓库
- 考虑使用maven-dependency-plugin

### 3. 字符编码问题

**问题**: 打包后中文乱码
**解决**: 
```xml
<plugin>
  <groupId>org.apache.maven.plugins</groupId>
  <artifactId>maven-resources-plugin</artifactId>
  <configuration>
    <encoding>UTF-8</encoding>
  </configuration>
</plugin>
```

## 总结

Maven的build标签是项目构建配置的核心，通过合理配置可以实现：

1. **灵活的资源管理**: 通过resources配置实现资源文件的精确控制
2. **环境配置分离**: 通过filters实现不同环境的配置管理
3. **外部依赖处理**: 解决第三方jar包依赖问题
4. **自定义构建流程**: 通过plugins配置实现个性化构建需求

掌握build标签的配置方法，可以显著提高Maven项目的构建效率和灵活性，是Java开发者必备的技能之一。