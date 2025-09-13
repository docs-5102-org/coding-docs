---
title: MongoDB集群搭建指南
category:
  - 数据库
tag:
  - MongoDB
---

# MongoDB集群搭建指南

## 目录

[[toc]]

## 概述

MongoDB集群提供了高可用性、数据冗余和故障转移功能。MongoDB支持三种集群模式：
- **Replica Set（副本集）** - 提供数据冗余和高可用性
- **Sharding（分片）** - 提供水平扩展能力
- **Master-Slave（主从）** - 已废弃的模式

本文档将详细介绍Replica Set副本集的搭建过程。

## 环境准备

### 系统要求
- MongoDB版本：mongodb-linux-x86_64-2.2.6.tgz
- 操作系统：Linux x86_64

### 服务器规划

| 主机IP | 角色 | 端口 |
|--------|------|------|
| 192.168.1.100 | 主节点(Primary) | 27017 |
| 192.168.1.101 | 从节点(Secondary) | 27017 |
| 192.168.1.101 | 仲裁节点(Arbiter) | 27019 |

## 安装步骤

### 1. 下载和安装MongoDB

在每台服务器上执行以下操作：

```bash
# 下载MongoDB
wget http://fastdl.mongodb.org/linux/mongodb-linux-x86_64-2.2.6.tgz

# 解压并移动到安装目录
tar zxf mongodb-linux-x86_64-2.2.6.tgz
mv mongodb-linux-x86_64-2.2.6 /usr/local/mongodb

# 创建数据目录
mkdir -p /data/mongodb/{master,slave,arbiter}
```

### 2. 配置文件创建

#### 主节点配置 (192.168.1.100)

创建主节点配置文件：
```bash
vi /etc/mongodb_master.conf
```

配置内容：
```conf
#master.conf
dbpath=/data/mongodb/master
logpath=/data/mongodb/master.log
pidfilepath=/data/mongodb/master.pid
#keyFile=/data/mongodb/mongodb.key
directoryperdb=true
logappend=true
replSet=91db
bind_ip=192.168.1.100
port=27017
#auth=true
oplogSize=100
fork=true
noprealloc=true
#maxConns=4000
```

#### 从节点配置 (192.168.1.101)

创建从节点配置文件：
```bash
vi /etc/mongodb_slave.conf
```

配置内容：
```conf
#slave.conf
dbpath=/data/mongodb/slave
logpath=/data/mongodb/slave.log
pidfilepath=/data/mongodb/slave.pid
#keyFile=/data/mongodb/mongodb.key
directoryperdb=true
logappend=true
replSet=91db
bind_ip=192.168.1.101
port=27017
#auth=true
oplogSize=100
fork=true
noprealloc=true
#maxConns=4000
```

#### 仲裁节点配置 (192.168.1.101)

创建仲裁节点配置文件：
```bash
vi /etc/mongodb_arbiter.conf
```

配置内容：
```conf
#arbiter.conf
dbpath=/data/mongodb/arbiter
logpath=/data/mongodb/arbiter.log
pidfilepath=/data/mongodb/arbiter.pid
#keyFile=/data/mongodb/mongodb.key
directoryperdb=true
logappend=true
replSet=91db
bind_ip=192.168.1.101
port=27019
#auth=true
oplogSize=100
fork=true
noprealloc=true
#maxConns=4000
```

### 3. 配置参数说明

| 参数 | 说明 |
|------|------|
| dbpath | 数据库文件存放目录 |
| logpath | 日志文件路径 |
| pidfilepath | PID文件路径 |
| keyFile | 节点间认证密钥文件（权限需设为600） |
| directoryperdb | 是否为每个数据库创建单独目录 |
| logappend | 日志以追加方式写入 |
| replSet | 副本集名称 |
| bind_ip | 绑定的IP地址 |
| port | 服务端口 |
| auth | 是否开启认证 |
| oplogSize | Oplog大小（MB） |
| fork | 以守护进程方式运行 |
| noprealloc | 禁用数据文件预分配 |
| maxConns | 最大连接数（默认2000） |

> **注意**：keyFile和auth选项应在集群配置完成并添加认证用户后再启用。

### 4. 启动MongoDB服务

在相应的服务器上启动MongoDB实例：

```bash
# 启动主节点 (192.168.1.100)
/usr/local/mongodb/bin/mongod -f /etc/mongodb_master.conf

# 启动从节点 (192.168.1.101)
/usr/local/mongodb/bin/mongod -f /etc/mongodb_slave.conf

# 启动仲裁节点 (192.168.1.101)
/usr/local/mongodb/bin/mongod -f /etc/mongodb_arbiter.conf
```

### 5. 初始化副本集

连接到主节点并配置副本集：

```bash
# 连接到主节点
/usr/local/mongodb/bin/mongo 192.168.1.100

# 切换到admin数据库
> use admin

# 配置副本集
> cfg = {
    _id: "91db",
    members: [
        {_id: 0, host: '192.168.1.100:27017', priority: 2},
        {_id: 1, host: '192.168.1.101:27017', priority: 1},
        {_id: 2, host: '192.168.1.101:27019', arbiterOnly: true}
    ]
};

# 初始化副本集
> rs.initiate(cfg)
```

### 6. 验证集群状态

使用以下命令检查副本集状态：

```javascript
> rs.status()
```

成功配置后，输出结果中各节点的`stateStr`字段将显示相应角色：
- PRIMARY：主节点
- SECONDARY：从节点  
- ARBITER：仲裁节点

结果末尾显示`"ok" : 1`表示配置成功。

## 重要说明

1. **优先级设置**：priority值越高的节点越容易成为主节点
2. **仲裁节点**：必须设置`arbiterOnly: true`，否则主备模式不会生效
3. **端口区分**：当多个MongoDB实例运行在同一台机器上时，使用不同端口进行区分
4. **副本集名称**：配置文件中的`replSet`参数值必须与初始化时的`_id`保持一致

## 常见问题

1. **连接问题**：确保防火墙已开放相应端口
2. **权限问题**：确保MongoDB进程有权限访问数据目录和日志目录
3. **网络问题**：确保各节点间网络连通性正常

## 运维管理指南

[运维管理指南](./devpos.md)

