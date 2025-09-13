---
title: 主从配置与集群部署指南
category:
  - 中间件
tag:
  - Redis
---


# Redis主从配置与集群部署完全指南

## 目录

[[toc]]

## Redis配置文件详解

### 基础配置选项

```bash
# 守护进程配置
daemonize no                    # 是否后台运行，生产环境建议设为yes
pidfile /var/run/redis.pid     # PID文件位置

# 网络配置
port 6379                      # 监听端口
bind 127.0.0.1                # 绑定IP地址，生产环境需配置具体IP
timeout 300                    # 客户端空闲超时时间（秒）

# 数据持久化
dbfilename dump.rdb            # RDB文件名
dir /var/lib/redis/            # 数据文件存储目录
save 900 1                     # 900秒内至少1个键被修改则保存
save 300 10                    # 300秒内至少10个键被修改则保存
save 60 10000                  # 60秒内至少10000个键被修改则保存

# 日志配置
loglevel notice               # 日志级别：debug/verbose/notice/warning
logfile /var/log/redis/redis-server.log  # 日志文件路径

# 内存配置
maxmemory 2gb                 # 最大内存使用量
maxmemory-policy allkeys-lru  # 内存淘汰策略
```

### 安全配置

```bash
# 密码认证
requirepass your_strong_password

# 重命名危险命令
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command KEYS ""
rename-command CONFIG "CONFIG_09f911029d74e35bd84156c5635688c0"
```

## 主从复制配置

### 2.1 环境准备

**服务器规划：**
- Master: 192.168.1.10:6379
- Slave1: 192.168.1.11:6379  
- Slave2: 192.168.1.12:6379

### 2.2 主服务器配置

**Master服务器 (redis-master.conf)：**

```bash
# 基础配置
daemonize yes
port 6379
bind 192.168.1.10
pidfile /var/run/redis-master.pid

# 数据持久化
dbfilename dump-master.rdb
dir /data/redis/
save 900 1
save 300 10
save 60 10000

# AOF持久化（推荐开启）
appendonly yes
appendfilename "appendonly-master.aof"
appendfsync everysec

# 日志配置
loglevel notice
logfile /var/log/redis/redis-master.log

# 安全配置
requirepass master_password

# 主从复制配置
# 允许从服务器在与主服务器连接断开期间继续处理查询请求
replica-serve-stale-data yes

# 从服务器只读模式
replica-read-only yes

# 复制积压缓冲区大小
repl-backlog-size 1mb
repl-backlog-ttl 3600

# 最少从服务器数量和延迟配置（可选）
min-replicas-to-write 1
min-replicas-max-lag 10
```

### 2.3 从服务器配置

**Slave服务器 (redis-slave.conf)：**

```bash
# 基础配置
daemonize yes
port 6379
bind 192.168.1.11  # 根据实际从服务器IP调整
pidfile /var/run/redis-slave.pid

# 主从复制核心配置
replicaof 192.168.1.10 6379
masterauth master_password

# 数据持久化
dbfilename dump-slave.rdb
dir /data/redis/
save 900 1
save 300 10  
save 60 10000

# AOF持久化
appendonly yes
appendfilename "appendonly-slave.aof"
appendfsync everysec

# 日志配置
loglevel notice
logfile /var/log/redis/redis-slave.log

# 从服务器特定配置
replica-serve-stale-data yes
replica-read-only yes
replica-priority 100

# 当从服务器与主服务器断开连接时的行为
replica-serve-stale-data yes
```

### 2.4 启动和测试

**启动服务：**

```bash
# 启动主服务器
redis-server /etc/redis/redis-master.conf

# 启动从服务器
redis-server /etc/redis/redis-slave.conf

# 检查进程
ps aux | grep redis
```

**测试主从同步：**

```bash
# 在主服务器上操作
redis-cli -h 192.168.1.10 -p 6379 -a master_password
127.0.0.1:6379> set test_key "hello world"
127.0.0.1:6379> set counter 100
127.0.0.1:6379> lpush mylist item1 item2 item3

# 在从服务器上验证
redis-cli -h 192.168.1.11 -p 6379
127.0.0.1:6379> get test_key
"hello world"
127.0.0.1:6379> get counter
"100"
127.0.0.1:6379> lrange mylist 0 -1
1) "item3"
2) "item2"  
3) "item1"

# 查看复制信息
127.0.0.1:6379> info replication
```

## 高可用性配置

### 3.1 Redis Sentinel 配置

Redis Sentinel 为Redis提供高可用性解决方案，能够监控主从服务器并在主服务器故障时自动进行故障转移。

**Sentinel配置文件 (sentinel.conf)：**

```bash
# Sentinel基础配置
port 26379
daemonize yes
pidfile /var/run/redis-sentinel.pid
logfile /var/log/redis/sentinel.log
dir /tmp

# 监控主服务器配置
sentinel monitor mymaster 192.168.1.10 6379 2

# 主服务器密码
sentinel auth-pass mymaster master_password

# 故障转移配置
sentinel down-after-milliseconds mymaster 30000
sentinel parallel-syncs mymaster 1
sentinel failover-timeout mymaster 180000

# 通知脚本（可选）
sentinel notification-script mymaster /var/redis/notify.sh
sentinel client-reconfig-script mymaster /var/redis/reconfig.sh
```

**启动Sentinel：**

```bash
# 在至少3台机器上启动Sentinel（推荐奇数个）
redis-sentinel /etc/redis/sentinel.conf
```

### 3.2 连接字符串配置

在应用程序中使用Sentinel连接Redis：

```python
# Python示例
import redis.sentinel

sentinel = redis.sentinel.Sentinel([
    ('192.168.1.10', 26379),
    ('192.168.1.11', 26379), 
    ('192.168.1.12', 26379)
])

# 获取主服务器连接
master = sentinel.master_for('mymaster', socket_timeout=0.1)

# 获取从服务器连接（用于读操作）
slave = sentinel.slave_for('mymaster', socket_timeout=0.1)
```

## Redis集群配置

### 4.1 集群概述

Redis Cluster是Redis的分布式实现，提供：
- 数据自动分片到多个节点
- 部分节点故障时继续处理能力
- 无需代理的去中心化架构

### 4.2 集群节点配置

**集群节点规划（最少6个节点）：**
- Node1: 192.168.1.10:7000 (Master)
- Node2: 192.168.1.11:7000 (Master)  
- Node3: 192.168.1.12:7000 (Master)
- Node4: 192.168.1.10:7001 (Slave)
- Node5: 192.168.1.11:7001 (Slave)
- Node6: 192.168.1.12:7001 (Slave)

**集群节点配置文件 (redis-cluster.conf)：**

```bash
# 基础配置
port 7000  # 每个节点使用不同端口
daemonize yes
pidfile /var/run/redis-cluster-7000.pid
dir /data/redis-cluster/7000/

# 集群配置
cluster-enabled yes
cluster-config-file nodes-7000.conf
cluster-node-timeout 15000
cluster-require-full-coverage no

# 数据持久化
dbfilename dump-cluster-7000.rdb
appendonly yes
appendfilename "appendonly-cluster-7000.aof"

# 网络配置
bind 192.168.1.10  # 根据实际IP调整
protected-mode no

# 日志配置
loglevel notice
logfile /var/log/redis/redis-cluster-7000.log
```

### 4.3 创建集群

**启动所有节点：**

```bash
# 在每台服务器上启动对应的节点
redis-server /etc/redis/redis-cluster-7000.conf
redis-server /etc/redis/redis-cluster-7001.conf
```

**创建集群：**

```bash
# 使用redis-cli创建集群
redis-cli --cluster create \
192.168.1.10:7000 192.168.1.11:7000 192.168.1.12:7000 \
192.168.1.10:7001 192.168.1.11:7001 192.168.1.12:7001 \
--cluster-replicas 1

# 检查集群状态
redis-cli -c -h 192.168.1.10 -p 7000 cluster nodes
redis-cli -c -h 192.168.1.10 -p 7000 cluster info
```

### 4.4 集群操作示例

```bash
# 连接到集群
redis-cli -c -h 192.168.1.10 -p 7000

# 设置数据（会自动重定向到正确的节点）
127.0.0.1:7000> set user:1000 "Alice"
-> Redirected to slot [1000] located at 192.168.1.11:7000
OK

# 获取数据
192.168.1.11:7000> get user:1000
"Alice"

# 查看键的slot
192.168.1.11:7000> cluster keyslot user:1000
(integer) 1000
```

## 监控与维护

### 5.1 性能监控

**关键监控指标：**

```bash
# 内存使用情况
redis-cli info memory

# 连接数统计
redis-cli info clients

# 复制延迟监控
redis-cli --latency -h slave_ip -p 6379

# 慢查询日志
redis-cli slowlog get 10

# 实时监控命令
redis-cli monitor
```

**监控脚本示例：**

```bash
#!/bin/bash
# redis_monitor.sh
REDIS_HOST="192.168.1.10"
REDIS_PORT="6379"
REDIS_PASS="your_password"

# 获取Redis信息
INFO=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASS info)

# 提取关键指标
USED_MEMORY=$(echo "$INFO" | grep used_memory_human | cut -d: -f2 | tr -d '\r')
CONNECTED_CLIENTS=$(echo "$INFO" | grep connected_clients | cut -d: -f2 | tr -d '\r')

echo "Redis Server: $REDIS_HOST:$REDIS_PORT"
echo "Used Memory: $USED_MEMORY"
echo "Connected Clients: $CONNECTED_CLIENTS"
```

### 5.2 备份策略

**RDB备份：**

```bash
# 手动触发备份
redis-cli -h 192.168.1.10 -p 6379 -a password BGSAVE

# 定时备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/redis"
redis-cli -h 192.168.1.10 -p 6379 -a password BGSAVE
cp /data/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb
```

**AOF备份和重写：**

```bash
# AOF重写
redis-cli -h 192.168.1.10 -p 6379 -a password BGREWRITEAOF

# 备份AOF文件
cp /data/redis/appendonly.aof /backup/redis/appendonly_$(date +%Y%m%d).aof
```

## 故障排除

### 6.1 常见问题

**主从同步中断：**

```bash
# 检查主从状态
redis-cli -h master_ip info replication
redis-cli -h slave_ip info replication

# 重新同步
redis-cli -h slave_ip replicaof master_ip 6379
```

**内存不足：**

```bash
# 检查内存使用
redis-cli info memory

# 清理过期键
redis-cli --scan --pattern "*" | xargs redis-cli del

# 配置内存淘汰策略
redis-cli config set maxmemory-policy allkeys-lru
```

**连接数过多：**

```bash
# 查看当前连接
redis-cli info clients

# 设置最大连接数
redis-cli config set maxclients 10000
```

### 6.2 性能优化建议

1. **内存优化**：
   - 使用适当的数据结构
   - 设置合理的过期时间
   - 启用内存淘汰策略

2. **网络优化**：
   - 使用pipeline批量操作
   - 启用TCP_NODELAY
   - 合理设置timeout

3. **持久化优化**：
   - 根据业务需求选择RDB或AOF
   - 调整持久化频率
   - 使用SSD存储

4. **集群优化**：
   - 合理分片策略
   - 监控热点数据
   - 定期重新平衡

## 总结

Redis主从复制和集群配置为数据提供了高可用性和可扩展性。在生产环境中，建议：

1. 使用Redis Sentinel实现自动故障转移
2. 配置合适的持久化策略
3. 建立完善的监控体系
4. 定期备份重要数据
5. 根据业务需求选择主从复制或集群模式

通过合理的配置和监控，Redis可以为应用提供稳定、高效的缓存和数据存储服务。