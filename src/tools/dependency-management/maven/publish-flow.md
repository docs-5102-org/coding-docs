---
title: Maven 发布流程
category:
  - Maven
---

---

# 2025 年 Maven Central 要求的标准 parent POM 模板

##  Maven Central 对 POM 的硬性要求

发布到 Maven Central 必须满足以下条件：提供 Javadoc 和 Sources jar、用 GPG/PGP 对所有文件签名、填写必要的 POM 元数据。具体来说元数据必须包含：`<name>`、`<description>`、`<url>`、`<licenses>`、`<developers>`、`<scm>`。

从 2025 年起发布到 Maven Central 需要使用 `central-publishing-maven-plugin`，当前最新版本是 0.9.0。

---

## 完整的标准 parent POM 模板

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <!-- ① 坐标：groupId 必须是你拥有的域名反写 -->
    <groupId>com.yourcompany</groupId>
    <artifactId>your-library</artifactId>
    <version>${revision}</version>
    <packaging>jar</packaging>  <!-- 多模块用 pom -->

    <!-- ② Maven Central 必填元数据 -->
    <name>Your Library Name</name>
    <description>A brief description of what this library does</description>
    <url>https://github.com/yourname/your-library</url>
    <inceptionYear>2025</inceptionYear>

    <!-- ③ License（必填，推荐 Apache 2.0） -->
    <licenses>
        <license>
            <name>Apache License, Version 2.0</name>
            <url>https://www.apache.org/licenses/LICENSE-2.0.txt</url>
            <distribution>repo</distribution>
        </license>
    </licenses>

    <!-- ④ 开发者信息（必填至少一个） -->
    <developers>
        <developer>
            <id>your-github-id</id>
            <name>Your Name</name>
            <email>you@yourcompany.com</email>
            <url>https://github.com/yourname</url>
        </developer>
    </developers>

    <!-- ⑤ SCM 信息（必填） -->
    <scm>
        <url>https://github.com/yourname/your-library</url>
        <connection>scm:git:git://github.com/yourname/your-library.git</connection>
        <developerConnection>scm:git:ssh://git@github.com/yourname/your-library.git</developerConnection>
        <tag>HEAD</tag>
    </scm>

    <!-- ⑥ 属性：统一管理版本和编码 -->
    <properties>
        <revision>1.0.0-SNAPSHOT</revision>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <project.reporting.outputEncoding>UTF-8</project.reporting.outputEncoding>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
        <maven.compiler.release>${java.version}</maven.compiler.release>

        <!-- 插件版本 -->
        <maven-compiler-plugin.version>3.14.0</maven-compiler-plugin.version>
        <maven-source-plugin.version>3.3.1</maven-source-plugin.version>
        <maven-javadoc-plugin.version>3.11.2</maven-javadoc-plugin.version>
        <maven-gpg-plugin.version>3.2.7</maven-gpg-plugin.version>
        <maven-surefire-plugin.version>3.5.3</maven-surefire-plugin.version>
        <maven-enforcer-plugin.version>3.6.2</maven-enforcer-plugin.version>
        <flatten-maven-plugin.version>1.7.0</flatten-maven-plugin.version>
        <central-publishing-plugin.version>0.9.0</central-publishing-plugin.version>
    </properties>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>${maven-compiler-plugin.version}</version>
                    <configuration>
                        <release>${java.version}</release>
                        <!-- 保留方法参数名，方便框架反射 -->
                        <compilerArgs>
                            <arg>-parameters</arg>
                        </compilerArgs>
                    </configuration>
                </plugin>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-surefire-plugin</artifactId>
                    <version>${maven-surefire-plugin.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>

        <plugins>
            <!-- ⑦ 强制约束：避免环境不一致导致的玄学问题 -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-enforcer-plugin</artifactId>
                <version>${maven-enforcer-plugin.version}</version>
                <executions>
                    <execution>
                        <id>enforce</id>
                        <goals><goal>enforce</goal></goals>
                        <configuration>
                            <rules>
                                <requireJavaVersion>
                                    <version>[17,)</version>
                                </requireJavaVersion>
                                <requireMavenVersion>
                                    <version>[3.9.1,)</version>
                                </requireMavenVersion>
                                <banDuplicatePomDependencyVersions/>
                            </rules>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

            <!-- ⑧ CI-friendly 版本号：支持 -Drevision=1.2.3 覆盖 -->
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>flatten-maven-plugin</artifactId>
                <version>${flatten-maven-plugin.version}</version>
                <configuration>
                    <updatePomFile>true</updatePomFile>
                    <flattenMode>resolveCiFriendliesOnly</flattenMode>
                </configuration>
                <executions>
                    <execution>
                        <id>flatten</id>
                        <phase>process-resources</phase>
                        <goals><goal>flatten</goal></goals>
                    </execution>
                    <execution>
                        <id>flatten.clean</id>
                        <phase>clean</phase>
                        <goals><goal>clean</goal></goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>

    <!-- ⑨ 发布配置：放在 profile 里，日常开发不触发 -->
    <profiles>
        <profile>
            <id>release</id>
            <build>
                <plugins>
                    <!-- 生成 sources.jar（Maven Central 必须） -->
                    <plugin>
                        <groupId>org.apache.maven.plugins</groupId>
                        <artifactId>maven-source-plugin</artifactId>
                        <version>${maven-source-plugin.version}</version>
                        <executions>
                            <execution>
                                <id>attach-sources</id>
                                <phase>package</phase>
                                <goals><goal>jar-no-fork</goal></goals>
                            </execution>
                        </executions>
                    </plugin>

                    <!-- 生成 javadoc.jar（Maven Central 必须） -->
                    <plugin>
                        <groupId>org.apache.maven.plugins</groupId>
                        <artifactId>maven-javadoc-plugin</artifactId>
                        <version>${maven-javadoc-plugin.version}</version>
                        <configuration>
                            <doclint>none</doclint>
                            <source>${java.version}</source>
                        </configuration>
                        <executions>
                            <execution>
                                <id>attach-javadocs</id>
                                <phase>package</phase>
                                <goals><goal>jar</goal></goals>
                            </execution>
                        </executions>
                    </plugin>

                    <!-- GPG 签名（Maven Central 必须） -->
                    <plugin>
                        <groupId>org.apache.maven.plugins</groupId>
                        <artifactId>maven-gpg-plugin</artifactId>
                        <version>${maven-gpg-plugin.version}</version>
                        <executions>
                            <execution>
                                <id>sign-artifacts</id>
                                <phase>verify</phase>
                                <goals><goal>sign</goal></goals>
                                <configuration>
                                    <!-- CI 环境用环境变量传入，避免密码进 pom -->
                                    <gpgArguments>
                                        <arg>--pinentry-mode</arg>
                                        <arg>loopback</arg>
                                    </gpgArguments>
                                </configuration>
                            </execution>
                        </executions>
                    </plugin>

                    <!-- 推送到 Maven Central（2025 新方式） -->
                    <plugin>
                        <groupId>org.sonatype.central</groupId>
                        <artifactId>central-publishing-maven-plugin</artifactId>
                        <version>${central-publishing-plugin.version}</version>
                        <extensions>true</extensions>
                        <configuration>
                            <publishingServerId>central</publishingServerId>
                            <!-- true=自动发布，false=上传后需手动点击 Publish -->
                            <autoPublish>false</autoPublish>
                        </configuration>
                    </plugin>
                </plugins>
            </build>
        </profile>
    </profiles>
</project>
```

---

## 关键设计决策解释

**为什么不继承 `spring-boot-starter-parent`？**
你的库不是 Spring Boot 应用，不需要它带来的打包行为（可执行 jar）、资源过滤、测试配置等。直接从零写更干净，依赖也按需引入。

**为什么发布插件放在 `<profile id="release">` 里？**
日常 `mvn test` 或 `mvn package` 不应该触发 GPG 签名和上传，只有显式执行 `mvn deploy -Prelease` 时才走发布流程，这也是 SCA 官方的做法。

**`flatten-maven-plugin` 是干什么的？**
让你可以在 POM 里用 `${revision}` 做版本占位符，CI 时通过 `-Drevision=1.2.3` 注入，发布出去的 POM 里版本号会被自动替换成真实值，不会包含 `${revision}` 字面量。

**`~/.m2/settings.xml` 里需要配什么？**
```xml
<servers>
    <server>
        <id>central</id>
        <username>你的 Sonatype Token 用户名</username>
        <password>你的 Sonatype Token 密码</password>
    </server>
</servers>
```
Token 从 [central.sonatype.com](https://central.sonatype.com) 账户页面生成，**绝对不要写进 pom.xml**。

**发布命令：**
```bash
mvn deploy -Prelease -Drevision=1.0.0
```