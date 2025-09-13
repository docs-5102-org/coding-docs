---
title: Maven中的MANIFEST.MF文件中的Class-Path中增加当前目录(.)
category:
  - Maven
---

# Maven中的MANIFEST.MF文件中的Class-Path中增加当前目录(.)

## 概述

在Maven项目中，有时需要在生成的MANIFEST.MF文件的Class-Path中添加当前目录(.)，以确保应用程序能够正确加载类路径中的资源。

## 配置方法

通过在Maven插件配置中使用`manifestEntries`来添加当前目录到Class-Path中：

```xml
<configuration>  
 <archive>  
  <manifest>  
   <mainClass>com.dongwei.test.Main</mainClass>  
   <addClasspath>true</addClasspath>  
   <classpathPrefix>lib/</classpathPrefix>  
  </manifest>  
  <manifestEntries>  
   <Class-Path>.</Class-Path>  
  </manifestEntries>  
 </archive>  
</configuration>
```

## 配置说明

- `<mainClass>`: 指定主类
- `<addClasspath>true`: 自动添加依赖jar包到classpath
- `<classpathPrefix>lib/</classpathPrefix>`: 为依赖jar包添加lib/前缀
- `<manifestEntries>`: 手动添加MANIFEST.MF条目
- `<Class-Path>.</Class-Path>`: 在Class-Path中添加当前目录

## 使用场景

当Maven生成的MANIFEST.MF中的Class-Path缺少某些内容时，比如当前执行目录(.)，可以通过`manifestEntries`的方式来补充添加。

## 生成效果

配置后生成的MANIFEST.MF文件示例：

```
Manifest-Version: 1.0  
Archiver-Version: Plexus Archiver  
Created-By: Apache Maven  
Built-By: wei.dong  
Build-Jdk: 1.6.0_24  
Main-Class: com.dongwei.test.Main  
Class-Path: . lib/spring-core-3.0.5.RELEASE.jar lib/spring-asm-3.0.5.R  
 ELEASE.jar lib/commons-logging-1.1.1.jar lib/spring-context-3.0.5.REL  
 EASE.jar lib/spring-aop-3.0.5.RELEASE.jar lib/aopalliance-1.0.jar lib  
 /spring-expression-3.0.5.RELEASE.jar lib/spring-context-support-3.0.5  
 .RELEASE.jar lib/spring-beans-3.0.5.RELEASE.jar lib/spring-jdbc-3.0.5  
 .RELEASE.jar lib/spring-tx-3.0.5.RELEASE.jar lib/log4j-1.2.14.jar lib  
 /slf4j-nop-1.4.3.jar lib/slf4j-api-1.4.3.jar lib/commons-lang-2.5.jar  
  lib/commons-dbcp-1.2.2.jar lib/commons-pool-1.3.jar lib/commons-io-1  
 .4.jar lib/commons-digester-2.0.jar lib/commons-beanutils-1.8.0.jar l  
 ib/commons-configuration-1.6.jar lib/commons-collections-3.2.1.jar li  
 b/commons-beanutils-core-1.8.0.jar lib/quartz-1.8.4.jar lib/jta-1.1.j  
 ar lib/mysql-connector-java-5.1.12.jar
```

可以看到Class-Path的开头包含了当前目录"."，这样应用程序就能够从当前目录加载资源文件了。

## 总结

通过使用`manifestEntries`配置，可以灵活地向MANIFEST.MF文件中添加自定义的条目，解决Maven自动生成的Class-Path不完整的问题。这种方法特别适用于需要从当前目录加载配置文件或其他资源的应用场景。