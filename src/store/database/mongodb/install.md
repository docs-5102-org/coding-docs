---
title: MongoDB 安装教程
category:
  - 数据库
tag:
  - MongoDB
---

# MongoDB 安装教程

本文档将详细介绍如何在 Windows 和 Linux 系统上安装 MongoDB 数据库。

## 目录

[[toc]]

## 系统要求

### Windows 系统要求
- Windows 10/11 或 Windows Server 2016+
- 64-bit 架构
- 至少 4GB RAM
- 至少 20GB 可用磁盘空间

### Linux 系统要求
- Ubuntu 18.04+、CentOS 7+、RHEL 7+ 或其他主流 Linux 发行版
- 64-bit 架构
- 至少 4GB RAM
- 至少 20GB 可用磁盘空间

## Windows 安装

### 方法一：使用 MSI 安装包（推荐）

#### 1. 下载 MongoDB
1. 访问 [MongoDB 官方下载页面](https://www.mongodb.com/try/download/community)
2. 选择 Windows 平台和最新版本
3. 下载 `.msi` 安装包

#### 2. 运行安装程序
1. 双击下载的 `.msi` 文件
2. 选择 "Complete" 完整安装
3. 在 "Service Configuration" 页面：
   - 勾选 "Install MongoDB as a Service"
   - 选择 "Run service as Network Service user"
   - 服务名称保持默认 "MongoDB"
4. 可选择安装 MongoDB Compass（图形化管理工具）
5. 点击 "Install" 完成安装

#### 3. 配置环境变量
1. 打开系统环境变量设置
2. 在系统变量中找到 `Path`
3. 添加 MongoDB 的 bin 目录路径：
   ```
   C:\Program Files\MongoDB\Server\7.0\bin
   ```

### 方法二：使用 Chocolatey

如果已安装 Chocolatey 包管理器：

```powershell
# 以管理员身份运行 PowerShell
choco install mongodb

# 安装 MongoDB Tools
choco install mongodb-database-tools
```

### 方法三：手动安装

#### 1. 下载压缩包
1. 从官网下载 `.zip` 压缩包
2. 解压到目标目录，如 `C:\mongodb`

#### 2. 创建数据目录
```cmd
mkdir C:\data\db
```

#### 3. 启动 MongoDB
```cmd
C:\mongodb\bin\mongod.exe --dbpath C:\data\db
```

## Linux 安装

### Ubuntu/Debian 系统

#### 1. 导入公钥
```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
```

#### 2. 添加软件源
```bash
# Ubuntu 22.04
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Ubuntu 20.04
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
```

#### 3. 安装 MongoDB
```bash
sudo apt-get update
sudo apt-get install -y mongodb-org
```

#### 4. 启动服务
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### CentOS/RHEL/Fedora 系统

#### 1. 创建 yum 源文件
```bash
sudo nano /etc/yum.repos.d/mongodb-org-7.0.repo
```

添加以下内容：
```ini
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
```

#### 2. 安装 MongoDB
```bash
sudo yum install -y mongodb-org
```

#### 3. 启动服务
```bash
sudo systemctl start mongod
sudo systemctl enable mongod
```

### 手动安装（通用方法）

#### 1. 下载二进制包
```bash
# 下载最新版本（以 7.0.4 为例）
wget https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-7.0.4.tgz

# 解压
tar -zxvf mongodb-linux-x86_64-ubuntu2204-7.0.4.tgz

# 移动到目标目录
sudo mv mongodb-linux-x86_64-ubuntu2204-7.0.4 /opt/mongodb
```

#### 2. 创建必要目录
```bash
sudo mkdir -p /var/lib/mongodb
sudo mkdir -p /var/log/mongodb
```

#### 3. 创建用户
```bash
sudo useradd -r -M -s /bin/false mongodb
sudo chown mongodb:mongodb /var/lib/mongodb
sudo chown mongodb:mongodb /var/log/mongodb
```

#### 4. 添加到 PATH
```bash
echo 'export PATH="/opt/mongodb/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

#### 5. 创建配置文件
```bash
sudo nano /etc/mongod.conf
```

添加以下内容：
```yaml
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log

storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

processManagement:
  fork: true
  pidFilePath: /var/run/mongodb/mongod.pid

net:
  port: 27017
  bindIp: 127.0.0.1
```

#### 6. 创建 systemd 服务
```bash
sudo nano /etc/systemd/system/mongod.service
```

添加以下内容：
```ini
[Unit]
Description=MongoDB Database Server
Documentation=https://docs.mongodb.org/manual
After=network-online.target
Wants=network-online.target

[Service]
User=mongodb
Group=mongodb
EnvironmentFile=-/etc/default/mongod
ExecStart=/opt/mongodb/bin/mongod --config /etc/mongod.conf
PIDFile=/var/run/mongodb/mongod.pid
LimitFSIZE=infinity
LimitCPU=infinity
LimitAS=infinity
LimitNOFILE=64000
LimitNPROC=64000
LimitMEMLOCK=infinity
TasksMax=infinity
TasksAccounting=false

[Install]
WantedBy=multi-user.target
```

#### 7. 启动服务
```bash
sudo systemctl daemon-reload
sudo systemctl start mongod
sudo systemctl enable mongod
```

## 验证安装

### 检查服务状态
```bash
# Linux
sudo systemctl status mongod

# Windows (命令提示符)
sc query MongoDB
```

### 连接 MongoDB
```bash
# 使用 mongosh（推荐）
mongosh

# 或使用传统的 mongo 客户端
mongo
```

### 基本测试
在 MongoDB shell 中执行：
```javascript
// 显示数据库列表
show dbs

// 创建测试数据
use testdb
db.testcollection.insertOne({name: "test", value: 123})

// 查询数据
db.testcollection.find()
```

## 基本配置

### 配置文件位置
- **Windows**: `C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg`
- **Linux**: `/etc/mongod.conf`

### 常用配置选项

```yaml
# 网络配置
net:
  port: 27017
  bindIp: 127.0.0.1  # 仅本地访问
  # bindIp: 0.0.0.0  # 允许外部访问（需要配置安全性）

# 存储配置
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true

# 日志配置
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: rename

# 安全配置
security:
  authorization: enabled  # 启用认证
```

### 创建管理员用户
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "yourpassword",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})
```

## 常见问题

### Windows 问题

**问题 1**: 服务无法启动
- 检查防火墙设置
- 确保数据目录存在且有写权限
- 查看 Windows 事件日志

**问题 2**: 找不到 mongod 命令
- 检查环境变量 PATH 是否正确配置
- 重新启动命令提示符

### Linux 问题

**问题 1**: 权限不足
```bash
sudo chown -R mongodb:mongodb /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/log/mongodb
```

**问题 2**: SELinux 问题（CentOS/RHEL）
```bash
sudo setsebool -P mongod_can_network_connect 1
```

**问题 3**: 防火墙配置
```bash
# Ubuntu/Debian
sudo ufw allow 27017

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=27017/tcp
sudo firewall-cmd --reload
```

### 通用问题

**问题**: 连接被拒绝
1. 检查 MongoDB 服务是否运行
2. 检查配置文件中的 `bindIp` 设置
3. 检查防火墙规则
4. 检查端口是否被占用

**问题**: 磁盘空间不足
- MongoDB 需要足够的磁盘空间用于数据和日志
- 定期清理日志文件
- 考虑数据压缩选项

## 总结

MongoDB 的安装过程在不同平台上都相对简单。建议使用官方包管理器进行安装，这样可以更容易地进行后续的更新和维护。安装完成后，记得配置适当的安全设置，包括启用认证和配置防火墙规则。

更多详细信息请参考 

- [MongoDB 官方文档](https://docs.mongodb.com/manual/installation/)。
- [CSDN](https://www.cnblogs.com/xiaoqian1993/p/5936648.html)
- [CSDN](https://www.cnblogs.com/pfnie/articles/6759105.html)
- [CSDN](https://www.cnblogs.com/zhangtingzu/p/5498545.html)