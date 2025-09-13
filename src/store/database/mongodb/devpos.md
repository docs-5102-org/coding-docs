---
title: MongoDB集群运维管理指南
category:
  - 数据库
tag:
  - MongoDB
---

# MongoDB集群运维管理指南

## 目录

[[toc]]

## 概述

MongoDB副本集集群搭建完成后，需要进行一系列的运维配置来确保集群的安全性、可靠性和性能。本文档将详细介绍集群搭建后的关键运维操作，包括认证配置、备份策略、监控设置和读写分离等。

## 1. 配置认证和安全设置

### 1.1 创建管理员用户

首先连接到主节点创建超级管理员用户：

```bash
# 连接到主节点
/usr/local/mongodb/bin/mongo 192.168.1.100:27017

# 切换到admin数据库
> use admin

# 创建超级管理员用户
> db.createUser({
    user: "admin",
    pwd: "your_strong_password",
    roles: [
        { role: "userAdminAnyDatabase", db: "admin" },
        { role: "readWriteAnyDatabase", db: "admin" },
        { role: "dbAdminAnyDatabase", db: "admin" },
        { role: "clusterAdmin", db: "admin" }
    ]
})
```

### 1.2 生成KeyFile

创建用于副本集节点间认证的KeyFile：

```bash
# 生成随机密钥文件
openssl rand -base64 756 > /data/mongodb/mongodb.key

# 设置正确的权限
chmod 600 /data/mongodb/mongodb.key
chown mongodb:mongodb /data/mongodb/mongodb.key

# 复制到所有节点
scp /data/mongodb/mongodb.key 192.168.1.101:/data/mongodb/
```

### 1.3 启用认证

修改所有节点的配置文件，取消以下两行的注释：

```conf
keyFile=/data/mongodb/mongodb.key
auth=true
```

重启所有MongoDB实例：

```bash
# 重启各节点
/usr/local/mongodb/bin/mongod -f /etc/mongodb_master.conf --shutdown
/usr/local/mongodb/bin/mongod -f /etc/mongodb_slave.conf --shutdown  
/usr/local/mongodb/bin/mongod -f /etc/mongodb_arbiter.conf --shutdown

# 启动服务
/usr/local/mongodb/bin/mongod -f /etc/mongodb_master.conf
/usr/local/mongodb/bin/mongod -f /etc/mongodb_slave.conf
/usr/local/mongodb/bin/mongod -f /etc/mongodb_arbiter.conf
```

### 1.4 创建应用用户

为具体的应用程序创建专用用户：

```javascript
// 连接时需要认证
> use admin
> db.auth("admin", "your_strong_password")

// 为特定数据库创建用户
> use myapp
> db.createUser({
    user: "appuser",
    pwd: "app_password",
    roles: [
        { role: "readWrite", db: "myapp" }
    ]
})
```

### 1.5 网络安全配置

#### 防火墙设置

```bash
# CentOS/RHEL 7+
firewall-cmd --permanent --add-port=27017/tcp
firewall-cmd --permanent --add-port=27019/tcp
firewall-cmd --reload

# Ubuntu/Debian
ufw allow 27017/tcp
ufw allow 27019/tcp
```

#### IP白名单配置

在配置文件中限制访问IP：

```conf
bind_ip=192.168.1.100,127.0.0.1  # 只允许特定IP访问
```

## 2. 设置备份策略

### 2.1 逻辑备份（mongodump）

#### 创建备份脚本

```bash
vi /opt/mongodb/backup_script.sh
```

```bash
#!/bin/bash

# 配置变量
BACKUP_DIR="/opt/mongodb/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_HOST="192.168.1.100:27017"
MONGO_USER="admin"
MONGO_PASS="your_strong_password"

# 创建备份目录
mkdir -p $BACKUP_DIR/$DATE

# 执行备份
/usr/local/mongodb/bin/mongodump \
    --host $MONGO_HOST \
    --username $MONGO_USER \
    --password $MONGO_PASS \
    --authenticationDatabase admin \
    --out $BACKUP_DIR/$DATE

# 压缩备份
cd $BACKUP_DIR
tar -czf mongodb_backup_$DATE.tar.gz $DATE/
rm -rf $DATE/

# 保留最近7天的备份
find $BACKUP_DIR -name "mongodb_backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: mongodb_backup_$DATE.tar.gz"
```

#### 设置定时备份

```bash
# 添加执行权限
chmod +x /opt/mongodb/backup_script.sh

# 设置定时任务（每日凌晨2点执行）
crontab -e
0 2 * * * /opt/mongodb/backup_script.sh >> /var/log/mongodb_backup.log 2>&1
```

### 2.2 物理备份

#### 文件系统快照备份

```bash
#!/bin/bash
# 适用于LVM或支持快照的文件系统

# 停止写入（可选，对一致性要求高时使用）
mongo --eval "db.runCommand({fsync:1, lock:1})"

# 创建快照
lvcreate -L1G -s -n mongodb_snap /dev/vg0/mongodb_lv

# 解锁
mongo --eval "db.runCommand({fsyncUnlock:1})"

# 挂载并备份快照
mkdir -p /mnt/mongodb_snap
mount /dev/vg0/mongodb_snap /mnt/mongodb_snap
tar -czf /opt/backups/mongodb_snapshot_$(date +%Y%m%d).tar.gz -C /mnt/mongodb_snap .
umount /mnt/mongodb_snap
lvremove -f /dev/vg0/mongodb_snap
```

### 2.3 增量备份（Oplog）

```bash
#!/bin/bash
# Oplog增量备份脚本

BACKUP_DIR="/opt/mongodb/oplog_backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 备份oplog
/usr/local/mongodb/bin/mongodump \
    --host 192.168.1.100:27017 \
    --username admin \
    --password your_strong_password \
    --authenticationDatabase admin \
    --db local \
    --collection oplog.rs \
    --out $BACKUP_DIR/oplog_$DATE
```

## 3. 监控集群状态

### 3.1 副本集状态监控

#### 基本状态检查脚本

```bash
vi /opt/mongodb/monitor_replica.sh
```

```bash
#!/bin/bash

MONGO_HOST="192.168.1.100:27017"
MONGO_USER="admin" 
MONGO_PASS="your_strong_password"

# 检查副本集状态
echo "=== Replica Set Status ==="
/usr/local/mongodb/bin/mongo $MONGO_HOST --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin --eval "
    rs.status().members.forEach(function(member) {
        print('Host: ' + member.name + ' - State: ' + member.stateStr + ' - Health: ' + member.health);
    });
"

# 检查主节点
echo "=== Primary Node ==="
/usr/local/mongodb/bin/mongo $MONGO_HOST --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin --eval "
    var status = rs.status();
    status.members.forEach(function(member) {
        if (member.stateStr === 'PRIMARY') {
            print('Primary: ' + member.name);
        }
    });
"

# 检查复制延迟
echo "=== Replication Lag ==="
/usr/local/mongodb/bin/mongo $MONGO_HOST --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin --eval "
    rs.printReplicationInfo();
    rs.printSlaveReplicationInfo();
"
```

### 3.2 性能监控

#### 数据库统计信息

```bash
# 数据库状态监控脚本
vi /opt/mongodb/monitor_performance.sh
```

```bash
#!/bin/bash

MONGO_HOST="192.168.1.100:27017"
MONGO_USER="admin"
MONGO_PASS="your_strong_password"

echo "=== Database Statistics ==="
/usr/local/mongodb/bin/mongo $MONGO_HOST --username $MONGO_USER --password $MONGO_PASS --authenticationDatabase admin --eval "
    print('Server Status:');
    var status = db.runCommand({serverStatus: 1});
    print('Connections - Current: ' + status.connections.current + ', Available: ' + status.connections.available);
    print('Operations - Insert: ' + status.opcounters.insert + ', Query: ' + status.opcounters.query + ', Update: ' + status.opcounters.update);
    print('Memory - Resident: ' + (status.mem.resident) + 'MB, Virtual: ' + (status.mem.virtual) + 'MB');
    print('Network - Bytes In: ' + status.network.bytesIn + ', Bytes Out: ' + status.network.bytesOut);
"
```

### 3.3 日志监控

#### 错误日志监控脚本

```bash
#!/bin/bash

# 监控MongoDB错误日志
LOG_FILE="/data/mongodb/master.log"
ERROR_PATTERN="ERROR|SEVERE|FATAL"

# 检查最近的错误
echo "=== Recent Errors ==="
tail -n 100 $LOG_FILE | grep -E "$ERROR_PATTERN" | tail -10

# 检查连接数告警
echo "=== Connection Warnings ==="
tail -n 100 $LOG_FILE | grep -i "connection" | grep -i "limit\|refused\|failed" | tail -5
```

### 3.4 设置监控告警

使用cron定期检查并发送告警：

```bash
# 监控告警脚本
vi /opt/mongodb/alert_monitor.sh
```

```bash
#!/bin/bash

ALERT_EMAIL="admin@company.com"
MONGO_HOST="192.168.1.100:27017"

# 检查副本集健康状态
check_replica_health() {
    local unhealthy_nodes=$(mongo $MONGO_HOST --username admin --password your_strong_password --authenticationDatabase admin --quiet --eval "
        var unhealthy = 0;
        rs.status().members.forEach(function(member) {
            if (member.health != 1) unhealthy++;
        });
        print(unhealthy);
    ")
    
    if [ "$unhealthy_nodes" -gt 0 ]; then
        echo "Alert: $unhealthy_nodes unhealthy nodes detected in replica set" | mail -s "MongoDB Alert" $ALERT_EMAIL
    fi
}

# 检查主节点状态
check_primary() {
    local primary_count=$(mongo $MONGO_HOST --username admin --password your_strong_password --authenticationDatabase admin --quiet --eval "
        var primary = 0;
        rs.status().members.forEach(function(member) {
            if (member.stateStr === 'PRIMARY') primary++;
        });
        print(primary);
    ")
    
    if [ "$primary_count" -eq 0 ]; then
        echo "Critical Alert: No primary node found in replica set" | mail -s "MongoDB Critical Alert" $ALERT_EMAIL
    fi
}

check_replica_health
check_primary
```

定时执行监控：

```bash
# 每5分钟检查一次
crontab -e
*/5 * * * * /opt/mongodb/alert_monitor.sh
```

## 4. 进行读写分离配置

### 4.1 应用层读写分离

#### Java应用示例

```java
import com.mongodb.MongoClient;
import com.mongodb.MongoClientOptions;
import com.mongodb.ReadPreference;
import com.mongodb.ServerAddress;

// 配置MongoDB连接
List<ServerAddress> seeds = Arrays.asList(
    new ServerAddress("192.168.1.100", 27017),
    new ServerAddress("192.168.1.101", 27017)
);

MongoClientOptions options = MongoClientOptions.builder()
    .readPreference(ReadPreference.secondaryPreferred())  // 优先从从节点读取
    .build();

MongoClient mongoClient = new MongoClient(seeds, options);
```

#### Python应用示例

```python
from pymongo import MongoClient
from pymongo.read_preferences import ReadPreference

# 连接副本集
client = MongoClient([
    'mongodb://192.168.1.100:27017',
    'mongodb://192.168.1.101:27017'
], 
replicaSet='91db',
read_preference=ReadPreference.SECONDARY_PREFERRED
)

# 写操作（自动路由到主节点）
db = client.myapp
collection = db.users
collection.insert_one({"name": "John", "age": 30})

# 读操作（从从节点读取）
user = collection.find_one({"name": "John"})
```

### 4.2 读取偏好设置

MongoDB支持多种读取偏好模式：

| 模式 | 说明 | 使用场景 |
|------|------|----------|
| primary | 只从主节点读取 | 需要强一致性的读取 |
| primaryPreferred | 优先从主节点读取，主节点不可用时从从节点读取 | 大多数情况下需要一致性 |
| secondary | 只从从节点读取 | 报表查询等对一致性要求不高的场景 |
| secondaryPreferred | 优先从从节点读取，从节点不可用时从主节点读取 | 读写分离，减轻主节点压力 |
| nearest | 从网络延迟最小的节点读取 | 跨地域部署时提高响应速度 |

### 4.3 连接字符串配置

```bash
# 基本连接字符串
mongodb://username:password@192.168.1.100:27017,192.168.1.101:27017/database?replicaSet=91db

# 带读取偏好的连接字符串
mongodb://username:password@192.168.1.100:27017,192.168.1.101:27017/database?replicaSet=91db&readPreference=secondaryPreferred

# 带读取标签的连接字符串
mongodb://username:password@192.168.1.100:27017,192.168.1.101:27017/database?replicaSet=91db&readPreference=secondary&readPreferenceTags=datacenter:east
```

### 4.4 设置从节点标签

可以为从节点设置标签，实现更精细的读取控制：

```javascript
// 连接到主节点
> use admin
> db.auth("admin", "your_strong_password")

// 为从节点设置标签
> cfg = rs.conf()
> cfg.members[1].tags = {"datacenter": "east", "usage": "reporting"}
> rs.reconfig(cfg)

// 验证配置
> rs.conf()
```

### 4.5 应用层负载均衡

#### Nginx代理配置示例

```nginx
upstream mongodb_read {
    server 192.168.1.101:27017 weight=3;  # 从节点，权重较高
    server 192.168.1.100:27017 weight=1;  # 主节点，权重较低
}

upstream mongodb_write {
    server 192.168.1.100:27017;  # 写操作只路由到主节点
}

server {
    listen 27020;  # 读取代理端口
    proxy_pass mongodb_read;
    proxy_connect_timeout 1s;
    proxy_timeout 3s;
}

server {
    listen 27021;  # 写入代理端口
    proxy_pass mongodb_write;
    proxy_connect_timeout 1s;
    proxy_timeout 3s;
}
```

## 5. 运维最佳实践

### 5.1 定期维护任务

```bash
# 创建定期维护脚本
vi /opt/mongodb/maintenance.sh
```

```bash
#!/bin/bash

# 1. 检查磁盘空间
df -h /data/mongodb

# 2. 检查日志文件大小
ls -lh /data/mongodb/*.log

# 3. 轮转日志文件
/usr/local/mongodb/bin/mongo --eval "db.runCommand({logRotate: 1})"

# 4. 清理过期数据（根据业务需求）
# mongo myapp --eval "db.logs.remove({timestamp: {\$lt: new Date(Date.now() - 30*24*60*60*1000)}})"

# 5. 检查索引使用情况
/usr/local/mongodb/bin/mongo --eval "db.runCommand({collStats: 'collection_name'})"
```

### 5.2 性能优化建议

1. **索引优化**：定期分析慢查询并创建合适的索引
2. **连接池配置**：合理设置应用的连接池大小
3. **写关注级别**：根据业务需求选择合适的写关注级别
4. **读关注级别**：设置合适的读关注级别保证数据一致性
5. **硬件配置**：SSD存储、足够内存、网络带宽

### 5.3 故障处理流程

1. **节点故障**：自动故障转移，手动修复故障节点
2. **主节点故障**：副本集自动选举新主节点
3. **网络分区**：确保大多数节点在同一网络分区
4. **数据恢复**：使用备份数据进行恢复

通过以上运维配置，MongoDB集群将具备完善的安全性、可靠性和高性能，能够满足生产环境的各种需求。定期执行监控和维护任务，确保集群的稳定运行。