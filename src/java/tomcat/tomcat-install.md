---
title:  Tomcat 安装教程
category:
  - Web容器
tag:
  - Tomcat  
---

# Tomcat 安装教程

Apache Tomcat 是一个开源的Web应用服务器，实现了Java Servlet、JSP、Java EL和WebSocket技术。本教程将详细介绍在不同操作系统上安装Tomcat的方法。

## 前置要求

在安装Tomcat之前，请确保您的系统已安装Java开发工具包（JDK）：
- **Java版本要求**：Tomcat 10.x 需要 Java 11 或更高版本
- **环境变量**：确保已正确配置 `JAVA_HOME` 环境变量

验证Java安装：
```bash
java -version
javac -version
```

## 官方资源

- **官方网站**：[https://tomcat.apache.org/](https://tomcat.apache.org/)
- **下载页面**：[https://tomcat.apache.org/download-10.cgi](https://tomcat.apache.org/download-10.cgi)
- **官方文档**：[https://tomcat.apache.org/tomcat-10.1-doc/](https://tomcat.apache.org/tomcat-10.1-doc/)

## 方法一：Windows 系统安装

### 1.1 下载安装包

访问 [Tomcat官方下载页面](https://tomcat.apache.org/download-10.cgi)，下载适合Windows的版本：
- **Windows Service Installer** (.exe) - 推荐新手使用
- **Binary Distributions** (.zip) - 便携版本

### 1.2 使用Windows Service Installer安装

1. 下载 `apache-tomcat-10.x.x.exe` 文件
2. 双击运行安装程序
3. 按照安装向导完成安装：
   - 选择安装目录（默认：`C:\Program Files\Apache Software Foundation\Tomcat 10.x`）
   - 配置端口（默认：8080）
   - 设置管理员账户
4. 安装完成后，Tomcat会作为Windows服务自动启动

### 1.3 使用ZIP包安装

1. 下载 `apache-tomcat-10.x.x-windows-x64.zip`
2. 解压到目标目录，如：`C:\tomcat\`
3. 配置环境变量：
   ```cmd
   set CATALINA_HOME=C:\tomcat\apache-tomcat-10.x.x
   set PATH=%PATH%;%CATALINA_HOME%\bin
   ```
4. 启动Tomcat：
   ```cmd
   cd %CATALINA_HOME%\bin
   startup.bat
   ```

## 方法二：Linux 系统安装

### 2.1 Ubuntu/Debian 系统

#### 使用APT包管理器安装

```bash
# 更新包列表
sudo apt update

# 安装Tomcat
sudo apt install tomcat10 tomcat10-webapps tomcat10-webapps-docs

# 启动服务
sudo systemctl start tomcat10
sudo systemctl enable tomcat10

# 检查状态
sudo systemctl status tomcat10
```

#### 手动安装

```bash

#############################################
# 1. 创建 Tomcat 用户（无登录权限）
#############################################
sudo useradd -m -U -d /opt/tomcat -s /bin/false tomcat

#############################################
# 2. 下载 Tomcat
#############################################
cd /tmp
wget https://downloads.apache.org/tomcat/tomcat-10/v10.1.15/bin/apache-tomcat-10.1.15.tar.gz

#############################################
# 3. 解压到指定目录
#############################################
sudo mkdir -p /opt/tomcat
sudo tar -xf apache-tomcat-10.1.15.tar.gz -C /opt/tomcat/
sudo ln -s /opt/tomcat/apache-tomcat-10.1.15 /opt/tomcat/latest

#############################################
# 4. 设置权限
#############################################
sudo chown -R tomcat: /opt/tomcat
sudo chmod +x /opt/tomcat/latest/bin/*.sh

#############################################
# 5. 设置环境变量（系统全局）
#############################################
sudo tee /etc/profile.d/tomcat.sh > /dev/null <<'EOF'
# Java 路径（根据实际安装位置修改）
export JAVA_HOME=/opt/jdk-21
export CLASSPATH=.:$JAVA_HOME/lib:$JAVA_HOME/jre/lib
export PATH=$JAVA_HOME/bin:$JAVA_HOME/jre/bin:$PATH

# Tomcat 路径
export CATALINA_HOME=/opt/tomcat/latest
export CATALINA_BASE=/opt/tomcat/latest
EOF

# 让环境变量立即生效
source /etc/profile.d/tomcat.sh

#############################################
# 6. 测试 Tomcat
#############################################
/opt/tomcat/latest/bin/version.sh
```

### 2.2 CentOS/RHEL 系统

#### 使用YUM/DNF安装

```bash
# CentOS/RHEL 8+
sudo dnf install tomcat tomcat-webapps tomcat-admin-webapps

# CentOS/RHEL 7
sudo yum install tomcat tomcat-webapps tomcat-admin-webapps

# 启动服务
sudo systemctl start tomcat
sudo systemctl enable tomcat
```

#### 创建systemd服务文件

```bash
sudo nano /etc/systemd/system/tomcat.service
```

添加以下内容：
```ini
[Unit]
Description=Apache Tomcat Web Application Container
After=network.target

[Service]
Type=forking

Environment=JAVA_HOME=/usr/lib/jvm/java-11-openjdk
Environment=CATALINA_PID=/opt/tomcat/temp/tomcat.pid
Environment=CATALINA_HOME=/opt/tomcat/latest
Environment=CATALINA_BASE=/opt/tomcat/latest
Environment=CATALINA_OPTS=-Xms512M -Xmx1024M -server -XX:+UseParallelGC
Environment=JAVA_OPTS=-Djava.awt.headless=true -Djava.security.egd=file:/dev/./urandom

ExecStart=/opt/tomcat/latest/bin/startup.sh
ExecStop=/opt/tomcat/latest/bin/shutdown.sh

User=tomcat
Group=tomcat
UMask=0007
RestartSec=10
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 重载systemd并启动服务
sudo systemctl daemon-reload
sudo systemctl start tomcat
sudo systemctl enable tomcat
```

## 方法三：macOS 系统安装

### 3.1 使用Homebrew安装

```bash
# 安装Homebrew（如果尚未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装Tomcat
brew install tomcat

# 启动Tomcat
brew services start tomcat

# 或手动启动
catalina run
```

### 3.2 手动安装

```bash
# 下载并解压Tomcat
cd ~/Downloads
curl -O https://downloads.apache.org/tomcat/tomcat-10/v10.1.15/bin/apache-tomcat-10.1.15.tar.gz
tar -xzf apache-tomcat-10.1.15.tar.gz

# 移动到Applications目录
sudo mv apache-tomcat-10.1.15 /Applications/Tomcat

# 设置环境变量（添加到 ~/.zshrc 或 ~/.bash_profile）
echo 'export CATALINA_HOME=/Applications/Tomcat' >> ~/.zshrc
echo 'export PATH=$PATH:$CATALINA_HOME/bin' >> ~/.zshrc
source ~/.zshrc

# 启动Tomcat
catalina.sh start
```

## 方法四：Docker 安装

Docker是部署Tomcat最便捷的方式，支持快速部署和扩展。

### 4.1 基础Docker运行

```bash
# 拉取官方Tomcat镜像
docker pull tomcat:10.1-jdk11

# 运行Tomcat容器
docker run -d \
  --name my-tomcat \
  -p 8080:8080 \
  tomcat:10.1-jdk11

# 查看容器状态
docker ps
```

### 4.2 自定义Dockerfile

创建 `Dockerfile`：
```dockerfile
FROM tomcat:10.1-jdk11

# 复制WAR文件到webapps目录
COPY ./your-app.war /usr/local/tomcat/webapps/

# 复制自定义配置文件
COPY ./server.xml /usr/local/tomcat/conf/

# 设置环境变量
ENV CATALINA_OPTS="-Xmx1024m -Xms512m"

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["catalina.sh", "run"]
```

构建和运行：
```bash
# 构建镜像
docker build -t my-tomcat-app .

# 运行容器
docker run -d \
  --name my-app \
  -p 8080:8080 \
  -v /host/webapps:/usr/local/tomcat/webapps \
  my-tomcat-app
```

### 4.3 使用Docker Compose

创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  tomcat:
    image: tomcat:10.1-jdk11
    container_name: my-tomcat
    ports:
      - "8080:8080"
    volumes:
      - ./webapps:/usr/local/tomcat/webapps
      - ./conf:/usr/local/tomcat/conf
    environment:
      - CATALINA_OPTS=-Xmx1024m -Xms512m
    restart: always

  # 可选：添加数据库服务
  mysql:
    image: mysql:8.0
    container_name: my-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: myapp
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql

volumes:
  mysql-data:
```

运行：
```bash
docker-compose up -d
```

## 配置和管理

### 管理界面配置

编辑 `$CATALINA_HOME/conf/tomcat-users.xml`：
```xml
<tomcat-users>
  <role rolename="manager-gui"/>
  <role rolename="admin-gui"/>
  <user username="admin" password="admin123" roles="manager-gui,admin-gui"/>
</tomcat-users>
```

### 端口配置

编辑 `$CATALINA_HOME/conf/server.xml`：
```xml
<Connector port="8080" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443" />
```

### 内存配置

设置JVM参数：
```bash
# Linux/macOS
export CATALINA_OPTS="-Xms512m -Xmx1024m -XX:PermSize=256m"

# Windows
set CATALINA_OPTS=-Xms512m -Xmx1024m -XX:PermSize=256m
```

## 验证安装

安装完成后，通过以下方式验证：

1. **访问默认页面**：在浏览器中打开 `http://localhost:8080`
2. **查看进程**：
   ```bash
   # Linux/macOS
   ps aux | grep tomcat
   
   # Windows
   tasklist | findstr java
   ```
3. **检查日志**：查看 `$CATALINA_HOME/logs/catalina.out`

## 常见问题解决

### 端口被占用
```bash
# 查找占用8080端口的进程
netstat -tlnp | grep :8080

# 修改端口或终止占用进程
sudo kill -9 <PID>
```

### 权限问题
```bash
# 确保tomcat用户有足够权限
sudo chown -R tomcat:tomcat /opt/tomcat
```

### Java版本不兼容
- 确保使用正确的Java版本
- 检查 `JAVA_HOME` 环境变量设置

## 总结

本教程涵盖了在各种操作系统上安装Apache Tomcat的多种方法。Docker方式提供了最大的灵活性和便携性，而传统安装方式提供了更多的定制选项。选择最适合您需求的安装方式，并根据实际情况调整配置参数。

更多详细信息请参考 [Apache Tomcat官方文档](https://tomcat.apache.org/tomcat-10.1-doc/)