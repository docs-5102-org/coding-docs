---
title: Maven 常用命令
category:
  - Maven
---

# Maven 常用命令

## 目录

[[toc]]

## 依赖查询
- **Maven仓库搜索**: [https://mvnrepository.com/](https://mvnrepository.com/)
- **Maven中央仓库**: [https://search.maven.org/](https://search.maven.org/)

## 项目创建

### 创建普通Java项目
```bash
# 使用create命令（较老版本）
mvn archetype:create -DgroupId=com.example -DartifactId=my-project

# 使用generate命令（推荐）
mvn archetype:generate -DgroupId=com.example -DartifactId=my-project -DarchetypeArtifactId=maven-archetype-quickstart -DinteractiveMode=false
```

### 创建Web项目
```bash
# 默认仓库配置
mvn archetype:generate -DgroupId=com.example -DartifactId=my-webapp -DarchetypeArtifactId=maven-archetype-webapp -DinteractiveMode=false

# 使用自定义仓库配置
mvn archetype:generate -s /path/to/settings.xml -DgroupId=com.example -DartifactId=my-webapp -DarchetypeArtifactId=maven-archetype-webapp

```

## 核心生命周期命令

### 编译相关
```bash
mvn compile                 # 编译源代码
mvn test-compile           # 编译测试代码
mvn generate-sources       # 生成额外源代码
```

### 测试相关
```bash
mvn test                   # 运行测试
mvn test -Dtest=TestClass  # 运行指定测试类
mvn install -Dmaven.test.skip=true  # 跳过测试
```

### 打包与安装
```bash
mvn package               # 打包项目（生成jar/war）
mvn install              # 安装到本地仓库
mvn deploy               # 部署到远程仓库
```

### 清理
```bash
mvn clean                # 清理生成的文件
mvn clean compile        # 清理后编译
mvn clean install        # 清理后安装
```

## IDE集成

### Eclipse项目
```bash
mvn eclipse:eclipse       # 生成Eclipse项目文件
mvn eclipse:clean        # 清除Eclipse配置
mvn -Dwtpversion=1.0 eclipse:eclipse  # 生成Web项目配置
```

### IDEA项目
```bash
mvn idea:idea            # 生成IntelliJ IDEA项目文件
```

## 依赖管理

### 依赖分析
```bash
mvn dependency:tree       # 显示依赖树
mvn dependency:resolve    # 列出已解决的依赖
mvn dependency:analyze    # 分析依赖使用情况
mvn dependency:copy-dependencies # 导出项目依赖到默认目录 `targed/dependency`
mvn dependency:copy-dependencies -DoutputDirectory=lib  # 导出项目依赖到自定义目录
mvn dependency:copy-dependencies -DoutputDirectory=lib  -DincludeScope=compile # 导出项目依赖到自定义目录，通常使用compile级别
```

### 手动安装依赖
```bash
# 安装第三方jar到本地仓库
mvn install:install-file \
  -DgroupId=com.example \
  -DartifactId=my-library \
  -Dversion=1.0.0 \
  -Dpackaging=jar \
  -Dfile=/path/to/library.jar

# 部署到远程仓库
mvn deploy:deploy-file \
  -DgroupId=com.example \
  -DartifactId=my-library \
  -Dversion=1.0.0 \
  -Dpackaging=jar \
  -Dfile=/path/to/library.jar \
  -DrepositoryId=my-repo \
  -Durl=http://repo.example.com/maven2
```

## 帮助与信息

### 版本与帮助
```bash
mvn -version              # 显示Maven版本
mvn -v                   # 版本信息简写
mvn -h                   # 显示帮助信息
```

### 插件帮助
```bash
mvn help:describe -Dplugin=compiler           # 查看编译器插件信息
mvn help:describe -Dplugin=compiler -Dfull    # 详细信息
mvn help:describe -Dplugin=compiler -Dmojo=compile -Dfull  # 查看特定目标
```

### 项目信息
```bash
mvn help:effective-pom    # 查看有效POM
mvn help:effective-settings  # 查看有效配置
mvn site                 # 生成项目站点
```

## 常用插件命令

### Web开发
```bash
mvn jetty:run            # 在Jetty中运行Web项目
mvn tomcat7:run          # 在Tomcat中运行（需配置插件）
```

### 执行Java程序
```bash
mvn exec:java -Dexec.mainClass=com.example.Main
mvn exec:java -Dexec.mainClass=com.example.Main -Dexec.args="arg1 arg2"
```

### 打包Assembly
```bash
mvn assembly:assembly     # 创建分发包
mvn install assembly:assembly  # 安装后创建分发包
```

### 数据库相关
```bash
mvn hibernate3:hbm2ddl   # 使用Hibernate生成数据库结构
mvn flyway:migrate       # 数据库迁移（需配置Flyway插件）
```

## 高级用法

### 配置文件
```bash
mvn -s /path/to/settings.xml install  # 使用指定配置文件
mvn -P profile-name install           # 激活指定profile
```

### 调试与详细输出
```bash
mvn -X install           # 调试模式，显示详细信息
mvn -e install           # 显示详细错误信息
mvn -q install           # 静默模式
```

### 离线模式
```bash
mvn -o install           # 离线模式运行
```

### 多模块项目
```bash
mvn -pl module1,module2 install      # 只构建指定模块
mvn -am install                      # 同时构建依赖模块
mvn -amd install                     # 同时构建依赖此模块的模块
```

## 常用组合命令

```bash
# 完整构建流程
mvn clean compile test package install

# 快速打包（跳过测试）
mvn clean package -DskipTests

# 发布准备
mvn clean verify

# 强制更新依赖
mvn clean install -U

# 并行构建
mvn -T 4 clean install
```

## 配置示例

### 多仓库配置
```xml
<repositories>
    <repository>
        <id>central</id>
        <name>Maven Central</name>
        <url>https://repo1.maven.org/maven2</url>
    </repository>
    <repository>
        <id>aliyun</id>
        <name>Aliyun Maven</name>
        <url>https://maven.aliyun.com/repository/public</url>
    </repository>
</repositories>
```

## 常见问题解决

### 清理问题
```bash
mvn dependency:purge-local-repository  # 清理本地仓库损坏文件
mvn clean install -Dmaven.repo.local=/tmp/repo  # 使用临时本地仓库
```

### 强制更新
```bash
mvn clean install -U     # 强制检查更新
mvn clean install -Dmaven.test.failure.ignore=true  # 忽略测试失败
```

---

> **提示**: 在日常开发中，最常用的命令组合是 `mvn clean install`，它会清理、编译、测试并安装项目到本地仓库。对于快速验证，可以使用 `mvn clean package -DskipTests` 跳过测试直接打包。