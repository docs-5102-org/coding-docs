---
title: Nexus安装
category:
  - Maven
---

# 安装企业级私有仓库Nexus完整指南

## 目录

[[toc]]

## 一、搭建Nexus服务的意义

搭建企业级私有仓库Nexus具有以下重要意义：

1. **内网统一代理**：作为内网的统一代理，团队合作开发时不用每人都去外网下载一次依赖包，提高开发效率
2. **解决网络限制**：解决部分公司内网管制无法访问外网的问题，选一台有外网权限的机器搭建服务器，其余人直接内网访问此服务
3. **依赖管理**：团队合作开发时统一解决Maven项目依赖问题，确保版本一致性
4. **提高构建速度**：本地缓存减少外网访问，大幅提升构建速度
5. **企业资产管理**：统一管理企业内部开发的组件和第三方依赖

## 二、Linux环境安装Nexus

### 2.1 下载安装包

```bash
# 下载Nexus安装包（以2.14.4版本为例）
wget https://sonatype-download.global.ssl.fastly.net/nexus/oss/nexus-2.14.4-03-bundle.tar.gz

# 也可以下载最新版本Nexus 3.x
wget https://download.sonatype.com/nexus/3/latest-unix.tar.gz
```

### 2.2 解压安装

```bash
# 创建应用目录
mkdir /data/apps
cd /data/apps

# 解压安装包
tar -zxvf ~/nexus-2.14.4-03-bundle.tar.gz

# 设置权限
chown -R nexus:nexus /data/apps/nexus-2.14.4-03
```

### 2.3 配置Nexus

编辑配置文件：

```bash
vim /data/apps/nexus-2.14.4-03/conf/nexus.properties
```

配置内容：

```properties
# Jetty section
application-port=8081      # 访问端口
application-host=0.0.0.0   # 绑定IP
nexus-webapp=${bundleBasedir}/nexus   # 指定nexus程序目录
nexus-webapp-context-path=/nexus      # 指定访问的上下文路径

# Nexus section
nexus-work=${bundleBasedir}/../sonatype-work/nexus
runtime=${bundleBasedir}/nexus/WEB-INF
```

默认访问地址：`http://your-server-ip:8081/nexus`

如果要改为根路径访问 `http://your-server-ip:8081/`，则修改：
```properties
nexus-webapp-context-path=/
```

### 2.4 启动Nexus

```bash
# 进入nexus目录
cd /data/apps/nexus-2.14.4-03

# 查看启动脚本参数
bin/nexus
# Usage: ./nexus { console | start | stop | restart | status | dump }

# 启动nexus
bin/nexus start

# 查看状态
bin/nexus status

# 停止nexus
bin/nexus stop

# 重启nexus
bin/nexus restart
```

### 2.5 设置开机自启

创建systemd服务文件：

```bash
sudo vim /etc/systemd/system/nexus.service
```

添加以下内容：

```ini
[Unit]
Description=Nexus Repository Manager
After=network.target

[Service]
Type=forking
LimitNOFILE=65536
ExecStart=/data/apps/nexus-2.14.4-03/bin/nexus start
ExecStop=/data/apps/nexus-2.14.4-03/bin/nexus stop
User=nexus
Restart=on-abort

[Install]
WantedBy=multi-user.target
```

启用服务：

```bash
sudo systemctl enable nexus
sudo systemctl start nexus
sudo systemctl status nexus
```

## 三、Windows环境安装Nexus

### 3.1 前置要求

- Java 8或更高版本
- 至少4GB可用内存
- 充足的磁盘空间用于存储构件

### 3.2 下载安装包

1. 访问Sonatype官网：https://www.sonatype.com/nexus/repository-oss
2. 下载Windows版本的Nexus Repository Manager OSS
3. 或直接下载：https://download.sonatype.com/nexus/3/latest-win64.zip

### 3.3 安装步骤

```cmd
# 1. 解压下载的zip文件到指定目录，如：
C:\nexus\

# 2. 目录结构如下：
C:\nexus\
├── nexus-3.x.x-xx\        # Nexus应用程序
└── sonatype-work\         # Nexus工作目录
```

### 3.4 配置Nexus

编辑配置文件：`C:\nexus\nexus-3.x.x-xx\etc\nexus-default.properties`

```properties
# 配置端口（默认8081）
application-port=8081

# 配置主机地址
application-host=0.0.0.0

# 配置上下文路径
nexus-context-path=/
```

### 3.5 启动Nexus

#### 方式一：命令行启动

```cmd
# 打开命令提示符，进入nexus/bin目录
cd C:\nexus\nexus-3.x.x-xx\bin

# 启动nexus
nexus.exe /run

# 或者后台启动
nexus.exe /start

# 停止服务
nexus.exe /stop

# 查看状态
nexus.exe /status
```

#### 方式二：安装为Windows服务

```cmd
# 以管理员身份运行命令提示符
cd C:\nexus\nexus-3.x.x-xx\bin

# 安装Windows服务
nexus.exe /install

# 启动服务
nexus.exe /start

# 停止服务
nexus.exe /stop

# 卸载服务
nexus.exe /uninstall
```

### 3.6 防火墙配置

如果启用了Windows防火墙，需要开放8081端口：

1. 打开Windows防火墙设置
2. 点击"高级设置"
3. 选择"入站规则" → "新建规则"
4. 选择"端口" → "TCP" → "特定本地端口：8081"
5. 允许连接并应用规则

## 四、Nexus管理配置

### 4.1 默认用户账号

- **管理员账号**：admin/admin123
- **部署账号**：deployment/deployment123

### 4.2 首次登录配置

1. 访问：`http://your-server:8081`
2. 点击右上角"Sign in"
3. 使用admin账号登录
4. 首次登录会提示修改默认密码

### 4.3 用户管理

1. 登录后点击左侧【Security → Users】
2. 在用户列表中选择用户，右键可更改密码
3. 在底部表格中可修改用户其他信息
4. 建议创建专门的部署用户用于CI/CD

### 4.4 仓库配置

Nexus默认包含以下仓库类型：

- **Proxy Repository**：代理仓库，代理远程仓库
- **Hosted Repository**：本地仓库，存储本地构件
- **Group Repository**：仓库组，组合多个仓库

## 五、在项目中使用Nexus

### 5.1 配置Maven使用Nexus作为插件库

在项目的`pom.xml`文件中添加：

```xml
<!-- 设定主仓库，按设定顺序进行查找 -->
<repositories>
    <repository>
        <id>nexus-public</id>
        <name>Team Nexus Repository</name>
        <url>http://your-nexus-server:8081/nexus/content/groups/public</url>
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
        <id>nexus-public</id>
        <name>Team Nexus Repository</name>
        <url>http://your-nexus-server:8081/nexus/content/groups/public</url>
        <releases>
            <enabled>true</enabled>
        </releases>
        <snapshots>
            <enabled>true</enabled>
        </snapshots>
    </pluginRepository>
</pluginRepositories>
```

### 5.2 配置Maven部署到Nexus

在`pom.xml`中添加分发管理配置：

```xml
<!-- 设定发布位置，mvn deploy时使用 -->
<distributionManagement>
    <repository>
        <id>nexus-releases</id>
        <name>Nexus Release Repository</name>
        <url>http://your-nexus-server:8081/nexus/content/repositories/releases</url>
    </repository>
    <snapshotRepository>
        <id>nexus-snapshots</id>
        <name>Nexus Snapshot Repository</name>
        <url>http://your-nexus-server:8081/nexus/content/repositories/snapshots</url>
    </snapshotRepository>
</distributionManagement>
```

### 5.3 配置Maven Settings.xml

在`~/.m2/settings.xml`（Linux/Mac）或`%USERPROFILE%\.m2\settings.xml`（Windows）中配置：

```xml
<settings>
    <!-- 配置镜像，所有请求都通过Nexus -->
    <mirrors>
        <mirror>
            <id>nexus</id>
            <mirrorOf>*</mirrorOf>
            <name>Team Nexus Repository</name>
            <url>http://your-nexus-server:8081/nexus/content/groups/public</url>
        </mirror>
    </mirrors>
    
    <!-- 配置服务器认证信息 -->
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
</settings>
```

## 六、常见问题与解决方案

### 6.1 启动失败

**问题**：Nexus启动失败
**解决方案**：
1. 检查Java版本是否满足要求
2. 检查端口8081是否被占用
3. 检查磁盘空间是否充足
4. 查看日志文件：`sonatype-work/nexus/logs/nexus.log`

### 6.2 无法访问

**问题**：无法通过浏览器访问Nexus
**解决方案**：
1. 检查防火墙设置
2. 确认绑定的IP地址配置
3. 检查端口配置是否正确

### 6.3 部署失败

**问题**：执行`mvn deploy`失败
**解决方案**：
1. 确认`distributionManagement`配置正确
2. 检查用户权限
3. 确认仓库存在且可写

### 6.4 性能优化

1. **增加JVM内存**：编辑`bin/nexus.vmoptions`文件
2. **清理旧版本构件**：定期清理快照版本
3. **配置合适的存储**：使用SSD存储提高性能

## 七、安全建议

1. **修改默认密码**：首次安装后立即修改默认管理员密码
2. **最小权限原则**：为不同用户分配最小必要权限
3. **定期更新**：保持Nexus版本更新，修复安全漏洞
4. **访问控制**：配置适当的网络访问控制
5. **备份策略**：定期备份Nexus数据和配置

## 八、总结

Nexus作为企业级私有仓库管理器，能够有效提升团队开发效率，统一管理项目依赖。通过本文档的详细指导，您可以在Linux和Windows环境中成功部署和配置Nexus服务，并在Maven项目中正确使用。正确配置后，团队成员可以享受更快的构建速度和统一的依赖管理体验。