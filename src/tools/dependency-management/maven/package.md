---
title: Maven 项目依赖打包
category:
  - Maven
---

# Maven项目依赖打包完整指南

在项目发布时，经常需要将自研代码和第三方依赖库（如log4j等）打包到同一个JAR文件中，形成"胖JAR"（Fat JAR）。Maven提供了多种方式来实现这一需求，本文详细介绍两种主要方法。

## 方法一：使用maven-assembly-plugin插件（推荐）

### 配置说明

maven-assembly-plugin是Maven官方推荐的打包插件，功能强大且配置简单。

```xml
<build>
    <plugins>
        <!-- 编译插件配置 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>8</source>
                <target>8</target>
                <encoding>${project.build.sourceEncoding}</encoding>
            </configuration>
        </plugin>
        
        <!-- Assembly插件配置 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-assembly-plugin</artifactId>
            <version>3.3.0</version>
            <configuration>
                <descriptorRefs>
                    <descriptorRef>jar-with-dependencies</descriptorRef>
                </descriptorRefs>
                <archive>
                    <manifest>
                        <mainClass>com.example.MainClass</mainClass>
                    </manifest>
                </archive>
            </configuration>
            <executions>
                <execution>
                    <id>make-assembly</id>
                    <phase>package</phase>
                    <goals>
                        <goal>single</goal>
                    </goals>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

### 使用方法

```bash
# 执行打包命令
mvn clean package

# 或者单独执行assembly插件
mvn assembly:single
```

### 特点分析

**优点：**
- 配置简单，开箱即用
- 支持多种打包格式（jar、zip、tar.gz等）
- Maven官方维护，稳定可靠
- 自动处理依赖冲突

**缺点：**
- 生成的JAR包名带有`-jar-with-dependencies`后缀
- 所有依赖的class文件会被解压后重新打包，可能导致某些签名信息丢失
- JAR包较大

**生成的JAR结构：**
```
your-project-1.0-jar-with-dependencies.jar
├── com/
│   └── example/         # 项目代码
├── org/
│   └── apache/          # 第三方依赖的class文件
├── META-INF/
│   └── MANIFEST.MF
└── ...
```

## 方法二：使用maven-dependency-plugin + maven-jar-plugin

### 配置说明

这种方法将依赖JAR文件作为独立文件嵌入到主JAR中，保持依赖的完整性。

```xml
<build>
    <plugins>
        <!-- 编译插件配置 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <version>3.8.1</version>
            <configuration>
                <source>8</source>
                <target>8</target>
                <encoding>${project.build.sourceEncoding}</encoding>
            </configuration>
        </plugin>
        
        <!-- JAR插件配置 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-jar-plugin</artifactId>
            <version>3.2.0</version>
            <configuration>
                <archive>
                    <manifest>
                        <addClasspath>true</addClasspath>
                        <classpathPrefix>lib/</classpathPrefix>
                        <mainClass>com.example.MainClass</mainClass>
                    </manifest>
                </archive>
            </configuration>
        </plugin>
        
        <!-- 依赖复制插件配置 -->
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-dependency-plugin</artifactId>
            <version>3.2.0</version>
            <executions>
                <execution>
                    <id>copy-dependencies</id>
                    <phase>prepare-package</phase>
                    <goals>
                        <goal>copy-dependencies</goal>
                    </goals>
                    <configuration>
                        <outputDirectory>${project.build.directory}/classes/lib</outputDirectory>
                        <excludeTransitive>false</excludeTransitive>
                        <stripVersion>false</stripVersion>
                        <includeScope>runtime</includeScope>
                    </configuration>
                </execution>
            </executions>
        </plugin>
    </plugins>
</build>
```

### 关键配置参数说明

| 参数 | 说明 |
|------|------|
| `outputDirectory` | 依赖JAR的输出目录，设置为`classes/lib`使其打包到主JAR中 |
| `excludeTransitive` | 是否排除传递依赖，`false`表示包含所有依赖 |
| `stripVersion` | 是否去除版本号，建议保留版本信息 |
| `includeScope` | 包含的依赖范围，`runtime`排除test依赖 |

### 特点分析

**优点：**
- 保持依赖JAR的完整性和签名
- 可以精确控制包含的依赖范围
- JAR包结构清晰

**缺点：**
- 配置相对复杂
- 需要处理classpath路径问题

**生成的JAR结构：**
```
your-project-1.0.jar
├── com/
│   └── example/         # 项目代码
├── lib/
│   ├── log4j-1.2.17.jar    # 完整的依赖JAR
│   ├── commons-lang-2.6.jar
│   └── ...
├── META-INF/
│   └── MANIFEST.MF
└── ...
```

## 方法三：使用maven-shade-plugin（高级选项）

对于需要更高级控制的场景，推荐使用maven-shade-plugin：

```xml
<plugin>
    <groupId>org.apache.maven.plugins</groupId>
    <artifactId>maven-shade-plugin</artifactId>
    <version>3.2.4</version>
    <executions>
        <execution>
            <phase>package</phase>
            <goals>
                <goal>shade</goal>
            </goals>
            <configuration>
                <transformers>
                    <transformer implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                        <mainClass>com.example.MainClass</mainClass>
                    </transformer>
                </transformers>
                <filters>
                    <filter>
                        <artifact>*:*</artifact>
                        <excludes>
                            <exclude>META-INF/*.SF</exclude>
                            <exclude>META-INF/*.DSA</exclude>
                            <exclude>META-INF/*.RSA</exclude>
                        </excludes>
                    </filter>
                </filters>
            </configuration>
        </execution>
    </executions>
</plugin>
```

## 最佳实践建议

### 1. 选择合适的方法

- **简单项目**：使用maven-assembly-plugin
- **需要保持JAR完整性**：使用dependency + jar plugin组合
- **复杂依赖处理**：使用maven-shade-plugin

### 2. 常见问题及解决方案

**问题1：test依赖被意外包含**
```xml
<configuration>
    <includeScope>runtime</includeScope>
    <excludeScope>test</excludeScope>
</configuration>
```

**问题2：资源文件冲突**
```xml
<!-- 在shade插件中使用资源转换器 -->
<transformer implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
```

**问题3：签名验证失败**
```xml
<filters>
    <filter>
        <artifact>*:*</artifact>
        <excludes>
            <exclude>META-INF/*.SF</exclude>
            <exclude>META-INF/*.DSA</exclude>
            <exclude>META-INF/*.RSA</exclude>
        </excludes>
    </filter>
</filters>
```

### 3. 性能优化建议

- 使用`<stripVersion>true</stripVersion>`减少文件名长度
- 排除不必要的依赖：`<excludeArtifactIds>junit,mockito-core</excludeArtifactIds>`
- 对于大型项目，考虑使用模块化打包

### 4. 验证打包结果

```bash
# 查看JAR内容
jar -tf target/your-project-1.0.jar

# 运行打包后的JAR
java -jar target/your-project-1.0.jar

# 查看MANIFEST.MF文件
jar -xf target/your-project-1.0.jar META-INF/MANIFEST.MF
cat META-INF/MANIFEST.MF
```

## 总结

根据项目需求选择合适的打包方式：

1. **maven-assembly-plugin**：适合大多数场景，配置简单
2. **dependency + jar plugin**：适合需要保持依赖完整性的场景
3. **maven-shade-plugin**：适合复杂项目，提供最大灵活性

无论选择哪种方式，都要注意测试打包后的JAR文件，确保所有依赖都能正确加载和运行。