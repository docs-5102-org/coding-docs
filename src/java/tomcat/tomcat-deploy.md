---
title:  Tomcat 部署项目
category:
  - Web容器
tag:
  - Tomcat  
---

# Tomcat 项目部署完整指南

## 目录

[[toc]]

## 1. 环境准备

### 1.1 系统要求
- Linux 操作系统（CentOS、Ubuntu、RHEL等）
- 足够的磁盘空间（建议至少2GB）
- 网络连接正常

### 1.2 用户权限
建议创建专门的tomcat用户来运行服务：
```bash
# 创建tomcat用户组和用户
sudo groupadd tomcat
sudo useradd -g tomcat -d /opt/tomcat -s /bin/bash tomcat
```

## 2. JDK 安装配置

### 2.1 下载安装JDK
```bash
# 方式1：使用包管理器安装（推荐）
# CentOS/RHEL
sudo yum install java-1.8.0-openjdk java-1.8.0-openjdk-devel

# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-8-jdk

# 方式2：手动安装Oracle JDK
# 下载JDK安装包到 /opt 目录
wget https://download.oracle.com/java/17/latest/jdk-17_linux-x64_bin.tar.gz
sudo tar -xzf jdk-17_linux-x64_bin.tar.gz -C /opt/
```

### 2.2 配置环境变量
```bash
# 编辑系统环境变量
sudo vim /etc/profile

# 添加以下内容到文件末尾
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk
# 或者如果是手动安装：export JAVA_HOME=/opt/jdk-17
export CLASSPATH=.:$JAVA_HOME/lib/tools.jar
export PATH=$JAVA_HOME/bin:$PATH

# 使环境变量生效
source /etc/profile

# 验证安装
java -version
javac -version
```

## 3. Tomcat 安装配置

### 3.1 下载安装Tomcat
```bash
# 下载Tomcat（以Tomcat 9为例）
cd /opt
sudo wget https://downloads.apache.org/tomcat/tomcat-9/v9.0.82/bin/apache-tomcat-9.0.82.tar.gz

# 解压
sudo tar -xzf apache-tomcat-9.0.82.tar.gz

# 重命名为tomcat
sudo mv apache-tomcat-9.0.82 tomcat

# 设置权限
sudo chown -R tomcat:tomcat /opt/tomcat
sudo chmod +x /opt/tomcat/bin/*.sh
```

### 3.2 配置Tomcat环境变量
```bash
# 编辑catalina.sh文件
sudo vim /opt/tomcat/bin/catalina.sh

# 在文件开头添加以下内容
export JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk
export CATALINA_HOME=/opt/tomcat
export CATALINA_BASE=/opt/tomcat
export CATALINA_TMPDIR=/opt/tomcat/temp
export JRE_HOME=$JAVA_HOME
export CLASSPATH=.:$JAVA_HOME/lib/tools.jar:$CATALINA_HOME/lib/*
```

### 3.3 创建系统服务
```bash
# 创建systemd服务文件
sudo vim /etc/systemd/system/tomcat.service

# 添加以下内容
[Unit]
Description=Apache Tomcat Web Application Container
After=network.target

[Service]
Type=forking
Environment=JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk
Environment=CATALINA_PID=/opt/tomcat/temp/tomcat.pid
Environment=CATALINA_HOME=/opt/tomcat
Environment=CATALINA_BASE=/opt/tomcat
Environment="CATALINA_OPTS=-Xms512M -Xmx1024M -server -XX:+UseParallelGC"
Environment="JAVA_OPTS=-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom"

ExecStart=/opt/tomcat/bin/startup.sh
ExecStop=/opt/tomcat/bin/shutdown.sh
ExecReload=/bin/kill -s HUP $MAINPID
RemainAfterExit=yes

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target

# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动并启用服务
sudo systemctl start tomcat
sudo systemctl enable tomcat

# 检查服务状态
sudo systemctl status tomcat
```

### 3.4 配置防火墙
```bash
# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=8080/tcp
sudo firewall-cmd --reload

# Ubuntu (ufw)
sudo ufw allow 8080/tcp
```

## 4. 普通 Web 项目部署

### 4.1 WAR包部署（推荐方式）

#### 热部署方式
```bash
# 1. 将WAR包复制到webapps目录
sudo cp /path/to/your/project.war /opt/tomcat/webapps/

# 2. Tomcat会自动解压和部署
# 访问地址：http://your-server-ip:8080/project/
```

#### 手动部署方式
```bash
# 1. 停止Tomcat
sudo systemctl stop tomcat

# 2. 清理旧版本（如果存在）
sudo rm -rf /opt/tomcat/webapps/project
sudo rm -f /opt/tomcat/webapps/project.war

# 3. 复制新的WAR包
sudo cp /path/to/your/project.war /opt/tomcat/webapps/

# 4. 启动Tomcat
sudo systemctl start tomcat

# 5. 检查部署日志
tail -f /opt/tomcat/logs/catalina.out
```

### 4.2 目录部署方式
```bash
# 1. 在webapps下创建项目目录
sudo mkdir -p /opt/tomcat/webapps/myproject

# 2. 复制项目文件
sudo cp -r /path/to/your/project/* /opt/tomcat/webapps/myproject/

# 3. 设置权限
sudo chown -R tomcat:tomcat /opt/tomcat/webapps/myproject

# 4. 重启Tomcat
sudo systemctl restart tomcat
```

### 4.3 Context配置部署
```bash
# 1. 在conf/Catalina/localhost目录下创建context配置文件
sudo vim /opt/tomcat/conf/Catalina/localhost/myproject.xml

# 添加以下内容
<?xml version="1.0" encoding="UTF-8"?>
<Context path="/myproject" docBase="/var/www/myproject" />

# 2. 重启Tomcat
sudo systemctl restart tomcat
```

## 5. SpringBoot 项目部署

### 5.1 传统WAR包部署

#### 5.1.1 修改SpringBoot项目
```java
// 1. 修改主类继承SpringBootServletInitializer
@SpringBootApplication
public class Application extends SpringBootServletInitializer {
    
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(Application.class);
    }
    
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

```xml
<!-- 2. 修改pom.xml打包方式 -->
<packaging>war</packaging>

<!-- 3. 排除内嵌Tomcat -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-tomcat</artifactId>
    <scope>provided</scope>
</dependency>
```

#### 5.1.2 构建和部署
```bash
# 1. 构建WAR包
mvn clean package

# 2. 部署到Tomcat
sudo cp target/myapp.war /opt/tomcat/webapps/

# 3. 访问应用
# http://your-server-ip:8080/myapp/
```

### 5.2 独立JAR包部署（推荐）

#### 5.2.1 构建可执行JAR
```bash
# 使用Maven构建
mvn clean package

# 使用Gradle构建
./gradlew build
```

#### 5.2.2 部署JAR包
```bash
# 1. 创建应用目录
sudo mkdir -p /opt/springboot/myapp
sudo cp target/myapp.jar /opt/springboot/myapp/

# 2. 创建启动脚本
sudo vim /opt/springboot/myapp/start.sh

#!/bin/bash
JAVA_OPTS="-Xms512m -Xmx1024m -server"
SPRING_PROFILES_ACTIVE="prod"
APP_NAME="myapp"
JAR_NAME="myapp.jar"

nohup java $JAVA_OPTS -Dspring.profiles.active=$SPRING_PROFILES_ACTIVE -jar $JAR_NAME > $APP_NAME.log 2>&1 &
echo $! > $APP_NAME.pid

# 3. 创建停止脚本
sudo vim /opt/springboot/myapp/stop.sh

#!/bin/bash
APP_NAME="myapp"
PID_FILE="$APP_NAME.pid"

if [ -f $PID_FILE ]; then
    PID=$(cat $PID_FILE)
    kill -9 $PID
    rm -f $PID_FILE
    echo "$APP_NAME stopped"
else
    echo "$APP_NAME is not running"
fi

# 4. 设置执行权限
sudo chmod +x /opt/springboot/myapp/*.sh

# 5. 启动应用
cd /opt/springboot/myapp
sudo ./start.sh
```

#### 5.2.3 创建系统服务
```bash
# 创建systemd服务文件
sudo vim /etc/systemd/system/myapp.service

[Unit]
Description=My Spring Boot Application
After=network.target

[Service]
Type=simple
User=tomcat
Group=tomcat
WorkingDirectory=/opt/springboot/myapp
ExecStart=/usr/bin/java -Xms512m -Xmx1024m -jar myapp.jar --spring.profiles.active=prod
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# 启动服务
sudo systemctl daemon-reload
sudo systemctl start myapp
sudo systemctl enable myapp
```

## 6. 高级配置

### 6.1 端口配置
```xml
<!-- 修改server.xml中的端口配置 -->
<Connector port="8080" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443" />
```

### 6.2 内存优化
```bash
# 在catalina.sh中添加JVM参数
export CATALINA_OPTS="$CATALINA_OPTS -Xms1024m"
export CATALINA_OPTS="$CATALINA_OPTS -Xmx2048m"
export CATALINA_OPTS="$CATALINA_OPTS -XX:PermSize=256m"
export CATALINA_OPTS="$CATALINA_OPTS -XX:MaxPermSize=512m"
export CATALINA_OPTS="$CATALINA_OPTS -server"
```

### 6.3 SSL配置
```xml
<!-- 在server.xml中添加SSL连接器 -->
<Connector port="8443" protocol="org.apache.coyote.http11.Http11NioProtocol"
           maxThreads="150" SSLEnabled="true">
    <SSLHostConfig>
        <Certificate certificateKeystoreFile="conf/keystore.jks"
                     certificateKeystorePassword="password"
                     type="RSA" />
    </SSLHostConfig>
</Connector>
```

### 6.4 数据源配置
```xml
<!-- 在context.xml中配置数据源 -->
<Resource name="jdbc/MyDB"
          auth="Container"
          type="javax.sql.DataSource"
          maxTotal="20"
          maxIdle="5"
          maxWaitMillis="10000"
          username="dbuser"
          password="dbpass"
          driverClassName="com.mysql.cj.jdbc.Driver"
          url="jdbc:mysql://localhost:3306/mydb"/>
```

## 7. 监控与管理

### 7.1 启用Tomcat管理器
```xml
<!-- 编辑tomcat-users.xml -->
<tomcat-users>
    <role rolename="manager-gui"/>
    <role rolename="admin-gui"/>
    <role rolename="manager-script"/>
    <user username="admin" password="secure_password" 
          roles="manager-gui,admin-gui,manager-script"/>
</tomcat-users>
```

### 7.2 日志监控
```bash
# 实时查看日志
tail -f /opt/tomcat/logs/catalina.out

# 查看访问日志
tail -f /opt/tomcat/logs/localhost_access_log.$(date +%Y-%m-%d).txt

# 日志轮转配置
sudo vim /etc/logrotate.d/tomcat

/opt/tomcat/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    notifempty
    create 0644 tomcat tomcat
    postrotate
        /bin/systemctl reload tomcat > /dev/null 2>/dev/null || true
    endscript
}
```

### 7.3 性能监控脚本
```bash
#!/bin/bash
# monitor_tomcat.sh

TOMCAT_PID=$(ps aux | grep tomcat | grep -v grep | awk '{print $2}')

if [ -z "$TOMCAT_PID" ]; then
    echo "Tomcat is not running"
    exit 1
fi

echo "=== Tomcat Status ==="
echo "PID: $TOMCAT_PID"
echo "Memory Usage:"
ps -p $TOMCAT_PID -o pid,ppid,user,stat,pcpu,pmem,rss,vsz,cmd

echo -e "\n=== Port Status ==="
netstat -tlnp | grep :8080

echo -e "\n=== Log Summary ==="
tail -n 5 /opt/tomcat/logs/catalina.out
```

## 8. 故障排查

### 8.1 常见问题及解决方案

#### 问题1：Tomcat启动失败
```bash
# 检查Java环境
java -version
echo $JAVA_HOME

# 检查端口占用
netstat -tlnp | grep :8080
lsof -i :8080

# 检查权限
ls -la /opt/tomcat/bin/catalina.sh

# 查看详细错误日志
tail -100 /opt/tomcat/logs/catalina.out
```

#### 问题2：应用部署失败
```bash
# 检查WAR包完整性
file /opt/tomcat/webapps/myapp.war

# 检查解压状态
ls -la /opt/tomcat/webapps/

# 查看应用特定日志
tail -f /opt/tomcat/logs/localhost.$(date +%Y-%m-%d).log
```

#### 问题3：内存不足
```bash
# 查看JVM内存使用
jstat -gc $TOMCAT_PID

# 生成堆转储文件
jmap -dump:format=b,file=heapdump.hprof $TOMCAT_PID

# 分析GC日志
# 在CATALINA_OPTS中添加：
# -XX:+PrintGC -XX:+PrintGCDetails -XX:+PrintGCTimeStamps -Xloggc:gc.log
```

### 8.2 性能调优检查清单

1. **JVM参数调优**
   - 合理设置堆内存大小
   - 选择合适的垃圾收集器
   - 监控GC频率和耗时

2. **连接器优化**
   - 调整maxThreads参数
   - 设置合适的connectionTimeout
   - 启用压缩传输

3. **应用优化**
   - 优化数据库连接池
   - 启用应用缓存
   - 压缩静态资源

4. **系统级优化**
   - 调整系统文件描述符限制
   - 优化网络参数
   - 配置合适的swap空间

---

## 总结

本指南涵盖了从基础环境准备到高级配置优化的完整Tomcat部署流程。无论是传统的Web项目还是现代的SpringBoot应用，都可以按照相应的部署方式进行操作。

在生产环境中，建议：
- 使用反向代理（如Nginx）处理静态资源
- 配置SSL证书保证安全传输
- 建立完善的监控和告警机制
- 定期备份应用和配置文件
- 制定应急处理预案

通过遵循本指南的最佳实践，可以确保Tomcat服务的稳定运行和高效性能。