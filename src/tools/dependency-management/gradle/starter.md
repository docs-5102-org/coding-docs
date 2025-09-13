---
title: Gradle 入门教程
category:
  - Gradle
---

# Gradle 入门教程

## 目录

[[toc]]

## 1. 安装与环境配置（Windows）

### 1.1 前置条件
- **JDK 8+** 已安装且 `JAVA_HOME` 已配置  
- 建议 JDK 版本与 Gradle 版本对应，参考官方[兼容矩阵](https://docs.gradle.org/current/userguide/compatibility.html)。

### 1.2 下载与安装
1. 打开[官网发布页](https://gradle.org/releases/)，选择 **binary-only** 发行版（例如 `gradle-8.5-bin.zip`）。
2. 解压到任意目录，如 `E:\gradle\gradle-8.5`。
3. 配置环境变量：
   | 变量名            | 值                            | 说明                         |
   |-----------------|---------------------------------|----------------------------|
   | `GRADLE_HOME`   | `E:\gradle\gradle-8.5`          | 解压目录                     |
   | `PATH`          | 追加 `%GRADLE_HOME%\bin`        | 命令行直接调用 `gradle`      |
   | `GRADLE_USER_HOME` | `D:\gradle\repo`（可选）      | 自定义本地仓库，默认在 `~\.gradle` |

4. 验证  
   ```powershell
   gradle -v
   ```
   输出示例：
   ```
   Gradle 8.5
   ------------------------------------------------------------
   Build time:   2023-11-29 14:08:57 UTC
   Kotlin:       1.9.20
   Groovy:       3.0.19
   JVM:          17.0.9 (Oracle 17.0.9+11-LTS-201)
   OS:           Windows 11 10.0 amd64
   ```

---

## 2. 常用命令速查表

| 场景                       | 命令示例                                          |
|--------------------------|--------------------------------------------------|
| 查看帮助                   | `gradle --help`                                  |
| 查看版本                   | `gradle -v`                                      |
| 执行指定任务               | `gradle bootRun` / `gradle clean`                |
| 完整构建                   | `gradle build`                                   |
| 跳过测试                   | `gradle build -x test`                           |
| 失败继续                   | `gradle build --continue`                        |
| 空跑（dry run）            | `gradle -m build`                                |
| 性能分析                   | `gradle build --profile`（报告在 `build/reports/profile`） |
| 查看任务依赖               | `gradle tasks --all`                             |
| 查看某配置的依赖树         | `gradle dependencies --configuration runtimeClasspath` |
| 清空构建产物               | `gradle clean`                                   |
| 指定构建文件/目录          | `gradle -b xxx.gradle task` / `gradle -p subDir task` |
| 启动 GUI                   | `gradle --gui`（已废弃，可使用 IDE 替代）         |

---

## 3. 多模块工程最佳实践

### 3.1 项目结构示例
```
universal-toolbox-manage
├── build.gradle          // 根项目配置
├── settings.gradle       // 项目包含声明
├── gradle.properties     // 全局版本管理
├── universal-toolbox-platform
│   └── build.gradle
└── universal-toolbox-common
    └── build.gradle
```

### 3.2 关键配置

#### ① `settings.gradle`
```groovy
pluginManagement {
    plugins {
        id 'org.springframework.boot' version "${springBootVersion}"
        id 'io.spring.dependency-management' version "${dependencyManagement}"
    }
}
rootProject.name = 'universal-toolbox-manage'
include 'universal-toolbox-platform', 'universal-toolbox-common'
```

#### ② `gradle.properties`
```properties
springBootVersion=2.7.18
dependencyManagement=1.1.5
```

#### ③ 根项目 `build.gradle`
```groovy
plugins {
    id 'org.springframework.boot' apply false   // 根项目不生效
}

subprojects {
    apply plugin: 'java'
    apply plugin: 'org.springframework.boot'
    apply plugin: 'io.spring.dependency-management'

    java {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    // 统一 BOM 依赖
    dependencyManagement {
        imports {
            mavenBom "org.springframework.boot:spring-boot-dependencies:${springBootVersion}"
        }
        dependencies {
            dependency "org.aspectj:aspectjweaver:1.8.13"
        }
    }

    tasks.withType(JavaCompile).configureEach {
        options.encoding = 'UTF-8'
    }

    repositories {
        mavenCentral()
    }
}

// 根项目不生成 jar
tasks.named('jar') {
    enabled = false
}
```

#### ④ 子项目示例（`universal-toolbox-platform/build.gradle`）
```groovy
dependencies {
    implementation project(':universal-toolbox-common') // 内部模块依赖
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.aspectj:aspectjweaver'          // 版本由 BOM 管理
}
```

---

## 4. 常见报错及解决方案

### 4.1 `Using insecure protocols with repositories, without explicit opt-in, is unsupported`
- **原因**：Gradle 7+ 默认强制使用 HTTPS 仓库。  
- **解决**：在 `repositories` 中显式允许 HTTP（仅限可信内网）：
  ```groovy
  repositories {
      maven {
          url "http://my-repo.com/maven2"
          allowInsecureProtocol = true
      }
  }
  ```

### 4.2 `Could not find method dependencyManagement()`
- **原因**：缺少 `io.spring.dependency-management` 插件。  
- **解决**：确保在 `subprojects` 或当前项目 `apply plugin: 'io.spring.dependency-management'`。

### 4.3 `Unsupported class file major version xx`
- **原因**：Gradle/JDK 版本不兼容。  
- **解决**：升级 Gradle 或切换至兼容 JDK 版本。

---

## 5. 推荐 IDE 配置

| IDE      | 要点说明 |
|----------|----------|
| IntelliJ IDEA | 1. 使用 **Gradle wrapper** (`./gradlew`) 保持版本一致；<br>2. `Settings -> Build Tools -> Gradle` 选择 JDK 与 `GRADLE_USER_HOME`；<br>3. 多模块导入选择 **Search for projects recursively**。 |
| VS Code | 安装 **Extension Pack for Java** 与 **Gradle for Java** 插件，按 `Ctrl+Shift+P` → `Gradle: Refresh Project`。 |

---

## 6. 延伸阅读

- 官方文档：<https://docs.gradle.org/current/userguide/userguide.html>
- Spring Boot Gradle 插件：<https://docs.spring.io/spring-boot/docs/current/gradle-plugin/reference/htmlsingle/>
- 多模块 CI/CD 模板：<https://github.com/spring-io/initializr/tree/main>

---
