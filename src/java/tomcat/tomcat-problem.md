---
title:  Tomcat 常见问题
category:
  - Web容器
tag:
  - Tomcat  
---

# Tomcat 常见问题解决指南

## 1. 警告：couldn't clear tomcat cache 问题

### 问题描述
在使用 Tomcat 8 时，可能会遇到以下警告信息：

```
警告: couldn't clear tomcat cache
java.lang.NoSuchFieldException: resourceEntries
    at java.lang.Class.getDeclaredField(Unknown Source)
    at com.opensymphony.xwork2.util.LocalizedTextUtil.clearMap(LocalizedTextUtil.java:735)
    at com.opensymphony.xwork2.util.LocalizedTextUtil.clearTomcatCache(LocalizedTextUtil.java:719)
    ...
```

### 问题原因
该问题主要是由于 Tomcat 8 中移除了 `resourceEntries` 属性，而旧版本的 Struts2 框架仍然尝试访问这个不存在的属性。

### 解决方案

#### 方案一：降级 Tomcat 版本（不推荐）
- 从 Tomcat 8 降级到 Tomcat 7
- **缺点**：版本倒退，不建议采用

#### 方案二：升级 Struts2 版本（推荐）
- 将 Struts2 从 2.0.9 升级到 2.3.20 或更高版本
- **优点**：完美解决问题，保持技术栈的先进性
- **步骤**：
  1. 下载最新版本的 Struts2
  2. 替换项目中的 Struts2 相关 JAR 包
  3. 更新配置文件（如有必要）

## 2. Tomcat 启动时 startup.bat 一闪而过问题

### 问题描述
运行 `startup.bat` 后，命令行窗口快速关闭，无法看到错误信息。

### 问题原因
Tomcat 启动时需要读取环境变量信息，主要是 `CATALINA_HOME` 和 `JAVA_HOME`。如果这些环境变量配置不正确，Tomcat 会启动失败。

### 调试方法
1. 右键点击 `startup.bat`，选择编辑
2. 在文件末尾添加 `pause`
3. 保存后重新运行，窗口将保持打开状态显示错误信息

### 解决方案

#### 配置环境变量
1. **设置 JAVA_HOME**：
   - 变量名：`JAVA_HOME`
   - 变量值：JDK 安装目录（注意是主目录，不是 bin 目录）
   - 示例：`C:\Program Files\Java\jdk1.8.0_291`

#### 常见错误及解决方法

**错误一：Neither the JAVA_HOME nor the JRE_HOME environment variable is defined**

解决方法：在 `setclasspath.bat` 文件开头添加：
```batch
set JAVA_HOME=C:\Program Files\Java\jdk1.6.0_20
set JRE_HOME=C:\Program Files\Java\jre6
```

**错误二：Cannot find "d:\apache-tomcat-6.0.32\bin\setclasspath.bat"**

解决方法：
1. 检查是否有 `setenv.bat` 文件写死了 `CATALINA_HOME` 路径
2. 删除或修正该文件中的路径配置
3. 检查 `catalina.bat` 中的配置

## 3. IDEA 中 Tomcat 部署问题

### War 与 War Exploded 部署方式区别

#### War 模式
- **特点**：将 WEB 工程打包成 war 文件后上传到服务器
- **适用场景**：生产环境发布
- **优点**：便于传输和部署
- **缺点**：不支持热部署，每次修改需要重新打包

#### War Exploded 模式
- **特点**：直接将文件夹、JSP 页面、classes 等移到 Tomcat 部署目录
- **适用场景**：开发环境调试
- **优点**：支持热部署，修改后可以立即生效
- **缺点**：文件较多，部署相对复杂

### 开发环境推荐配置
1. 使用 War Exploded 模式进行开发
2. 启用热部署功能
3. 配置 Tomcat 相关设置以支持实时更新

## 4. IDEA 中 Tomcat 日志乱码问题

### 问题描述
在 IDEA 中启动 Tomcat 后，Server 日志或 Catalina Log 出现中文乱码。

### 解决思路
1. 检查 IDEA 的编码设置
2. 配置 Tomcat 的字符编码
3. 设置 JVM 参数中的字符编码

## 5. 预防措施与最佳实践

### 环境配置最佳实践
1. **标准化环境变量配置**
   - 统一配置 JAVA_HOME 和 CATALINA_HOME
   - 避免路径中包含空格和中文字符
   - 定期检查环境变量的有效性

2. **版本兼容性管理**
   - 保持 Tomcat、JDK、框架版本的兼容性
   - 及时升级到稳定的新版本
   - 建立版本兼容性文档

3. **开发环境配置**
   - 开发环境使用 War Exploded 模式
   - 启用热部署以提高开发效率
   - 配置合适的字符编码避免乱码问题

### 故障排除步骤
1. 查看详细的错误日志
2. 检查环境变量配置
3. 验证版本兼容性
4. 搜索相关错误信息和解决方案
5. 在测试环境验证修复方案

### 维护建议
- 定期更新 Tomcat 和相关组件
- 建立问题知识库，记录常见问题及解决方案
- 制定标准的环境配置流程
- 定期检查和清理 Tomcat 缓存和临时文件

---

通过遵循以上指南，可以有效解决 Tomcat 在日常使用中遇到的常见问题，提高开发和部署效率。

