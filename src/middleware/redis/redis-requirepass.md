---
title: 密码认证指南
category:
  - 中间件
tag:
  - Redis
---

# Redis 密码认证指南

## 目录

[[toc]]

## 概述

Redis默认情况下是无密码访问的，这在生产环境中存在安全风险。本指南将详细介绍Redis密码认证的配置方法、最佳实践和安全建议。

## 1. Redis密码认证基础

### 1.1 密码认证的重要性

- 防止未授权访问
- 保护敏感数据安全
- 符合安全合规要求
- 防止恶意操作和数据泄露

### 1.2 密码认证机制

Redis使用`AUTH`命令进行密码验证，支持以下方式：
- 配置文件设置密码
- 运行时动态设置密码
- 客户端连接时提供密码

## 2. 密码配置方法

### 2.1 方法一：配置文件设置（推荐）

**步骤1：编辑配置文件**
```bash
# 编辑redis配置文件
vim /etc/redis/redis.conf
```

**步骤2：设置requirepass参数**
```ini
# 找到requirepass配置项（默认被注释）
# requirepass foobared

# 修改为你的密码
requirepass your_strong_password_here

# 建议使用复杂密码，例如：
requirepass Redis@2024!SecurePass
```

**步骤3：重启Redis服务**
```bash
# 使用systemctl重启（推荐）
sudo systemctl restart redis

# 或者使用service命令
sudo service redis restart

# 或者手动重启
redis-server /etc/redis/redis.conf
```

### 2.2 方法二：运行时动态设置

**查看当前密码设置：**
```bash
redis-cli -p 6379
127.0.0.1:6379> CONFIG GET requirepass
1) "requirepass"
2) (nil)  # 显示无密码
```

**动态设置密码：**
```bash
# 设置密码
127.0.0.1:6379> CONFIG SET requirepass "your_password"
OK

# 设置后需要认证才能继续操作
127.0.0.1:6379> CONFIG GET requirepass
(error) NOAUTH Authentication required.

# 进行身份认证
127.0.0.1:6379> AUTH your_password
OK

# 现在可以正常查询
127.0.0.1:6379> CONFIG GET requirepass
1) "requirepass"
2) "your_password"
```

**重要提醒：**
- 动态设置的密码重启后会失效
- 需要同时修改配置文件确保重启后生效
- 建议先修改配置文件再重启，避免运行时设置

### 2.3 配置持久化

为确保密码设置永久生效：

```bash
# 1. 修改配置文件
echo "requirepass your_password" >> /etc/redis/redis.conf

# 2. 保存当前配置到文件（可选）
127.0.0.1:6379> CONFIG REWRITE
```

## 3. 客户端连接认证

### 3.1 redis-cli连接方式

**方式1：连接时指定密码**
```bash
# 使用-a参数指定密码
redis-cli -h 127.0.0.1 -p 6379 -a "your_password"

# 指定数据库
redis-cli -h 127.0.0.1 -p 6379 -a "your_password" -n 1
```

**方式2：连接后认证**
```bash
# 先连接
redis-cli -h 127.0.0.1 -p 6379

# 再认证
127.0.0.1:6379> AUTH your_password
OK

# 验证认证状态
127.0.0.1:6379> PING
PONG
```

**方式3：使用REDISCLI_AUTH环境变量**
```bash
# 设置环境变量
export REDISCLI_AUTH="your_password"

# 直接连接（自动使用环境变量中的密码）
redis-cli -h 127.0.0.1 -p 6379
```

### 3.2 程序代码连接示例

**Python (redis-py)**
```python
import redis

# 方式1：连接时指定密码
r = redis.Redis(
    host='localhost',
    port=6379,
    password='your_password',
    db=0
)

# 方式2：连接后认证
r = redis.Redis(host='localhost', port=6379, db=0)
r.auth('your_password')

# 测试连接
try:
    r.ping()
    print("连接成功")
except redis.AuthenticationError:
    print("密码错误")
except redis.ConnectionError:
    print("连接失败")
```

**Java (Jedis)**
```java
import redis.clients.jedis.Jedis;

// 连接时指定密码
Jedis jedis = new Jedis("localhost", 6379);
jedis.auth("your_password");

// 测试连接
String pong = jedis.ping();
System.out.println("连接状态: " + pong);
```

**Node.js (ioredis)**
```javascript
const Redis = require('ioredis');

// 方式1：连接配置中指定密码
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'your_password'
});

// 方式2：URL方式
const redis2 = new Redis('redis://:your_password@localhost:6379');

// 测试连接
redis.ping().then(result => {
  console.log('连接成功:', result);
}).catch(err => {
  console.error('连接失败:', err);
});
```

## 4. 主从复制密码配置

### 4.1 主节点配置

**master节点设置密码：**
```ini
# redis.conf
requirepass master_password
```

### 4.2 从节点配置

**slave节点配置：**
```ini
# redis.conf

# 1. 设置从节点自己的访问密码
requirepass slave_password

# 2. 设置连接主节点的密码
masterauth master_password

# 3. 指定主节点信息
replicaof 192.168.1.100 6379
```

**动态配置从节点：**
```bash
# 连接从节点
redis-cli -h slave_host -p 6379

# 设置主节点密码
127.0.0.1:6379> CONFIG SET masterauth "master_password"
OK

# 设置主从关系
127.0.0.1:6379> REPLICAOF 192.168.1.100 6379
OK
```

### 4.3 验证主从复制

```bash
# 在主节点查看从节点信息
127.0.0.1:6379> INFO replication

# 在从节点查看复制状态
127.0.0.1:6379> INFO replication
```

## 5. 哨兵模式密码配置

### 5.1 哨兵配置文件

```ini
# sentinel.conf

# 监控主节点
sentinel monitor mymaster 192.168.1.100 6379 2

# 设置主节点密码
sentinel auth-pass mymaster master_password

# 故障转移超时
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 10000
sentinel parallel-syncs mymaster 1
```

### 5.2 客户端连接哨兵

**Python示例：**
```python
from redis.sentinel import Sentinel

# 哨兵节点列表
sentinel_list = [
    ('192.168.1.101', 26379),
    ('192.168.1.102', 26379),
    ('192.168.1.103', 26379)
]

# 创建哨兵对象
sentinel = Sentinel(sentinel_list)

# 获取主节点连接
master = sentinel.master_for('mymaster', password='master_password')

# 获取从节点连接
slave = sentinel.slave_for('mymaster', password='master_password')
```

## 6. 集群模式密码配置

### 6.1 集群节点配置

```ini
# redis.conf (所有集群节点)

# 启用集群模式
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000

# 设置密码
requirepass cluster_password

# 设置节点间通信密码
masterauth cluster_password
```

### 6.2 客户端连接集群

**Python示例：**
```python
from rediscluster import RedisCluster

# 集群节点
startup_nodes = [
    {"host": "192.168.1.101", "port": "7000"},
    {"host": "192.168.1.102", "port": "7000"},
    {"host": "192.168.1.103", "port": "7000"}
]

# 连接集群
rc = RedisCluster(
    startup_nodes=startup_nodes, 
    password='cluster_password',
    decode_responses=True
)
```

## 7. 安全最佳实践

### 7.1 密码强度要求

```bash
# 推荐密码格式：
# - 长度至少16位
# - 包含大小写字母、数字、特殊字符
# - 避免使用字典词汇
# - 定期更换密码

# 好的密码示例：
requirepass Redis@Prod2024!Secure#Auth

# 避免的密码示例：
requirepass 123456        # 太简单
requirepass redis         # 默认词汇
requirepass password      # 通用密码
```

### 7.2 网络访问控制

**绑定特定IP：**
```ini
# 只允许特定IP访问
bind 192.168.1.100 127.0.0.1

# 禁用保护模式（仅在必要时）
protected-mode yes
```

**使用防火墙：**
```bash
# 限制Redis端口访问
sudo ufw allow from 192.168.1.0/24 to any port 6379
sudo ufw deny 6379
```

### 7.3 命令重命名/禁用

```ini
# redis.conf

# 重命名危险命令
rename-command FLUSHDB ""           # 禁用FLUSHDB
rename-command FLUSHALL ""          # 禁用FLUSHALL
rename-command DEBUG ""             # 禁用DEBUG
rename-command CONFIG "MY_CONFIG"   # 重命名CONFIG

# 重命名后的使用方式
# redis-cli> MY_CONFIG GET requirepass
```

### 7.4 ACL访问控制（Redis 6.0+）

**创建用户：**
```bash
# 创建只读用户
127.0.0.1:6379> ACL SETUSER readonly on >readonly_pass +@read -@write

# 创建管理员用户
127.0.0.1:6379> ACL SETUSER admin on >admin_pass +@all

# 查看用户列表
127.0.0.1:6379> ACL LIST

# 使用特定用户连接
redis-cli --user readonly --pass readonly_pass
```

**ACL配置文件：**
```ini
# redis.conf
aclfile /etc/redis/users.acl
```

```bash
# /etc/redis/users.acl
user default off
user admin on >admin_pass +@all
user readonly on >readonly_pass +@read -@write
user app on >app_pass +@all -flushdb -flushall
```

## 8. 密码管理工具

### 8.1 环境变量管理

```bash
# .env 文件
REDIS_PASSWORD=your_secure_password
REDIS_HOST=localhost
REDIS_PORT=6379

# 使用环境变量
export REDIS_PASSWORD="your_secure_password"
redis-cli -a "$REDIS_PASSWORD"
```

### 8.2 密钥管理系统

**使用HashiCorp Vault：**
```bash
# 存储密码到Vault
vault kv put secret/redis password="your_secure_password"

# 获取密码
REDIS_PASS=$(vault kv get -field=password secret/redis)
redis-cli -a "$REDIS_PASS"
```

## 9. 故障排除

### 9.1 常见错误

**错误1：NOAUTH Authentication required**
```bash
# 原因：需要密码认证
# 解决：使用AUTH命令或-a参数提供密码
127.0.0.1:6379> AUTH your_password
```

**错误2：ERR invalid password**
```bash
# 原因：密码错误
# 解决：检查密码是否正确，注意大小写和特殊字符
```

**错误3：主从同步失败**
```bash
# 原因：从节点未配置masterauth
# 解决：在从节点配置文件中添加：
masterauth master_password
```

### 9.2 密码重置

**忘记密码的解决方案：**
```bash
# 1. 停止Redis服务
sudo systemctl stop redis

# 2. 临时注释密码配置
sudo vim /etc/redis/redis.conf
# requirepass your_password  # 注释这一行

# 3. 重启Redis
sudo systemctl start redis

# 4. 连接Redis重新设置密码
redis-cli
127.0.0.1:6379> CONFIG SET requirepass "new_password"

# 5. 修改配置文件
sudo vim /etc/redis/redis.conf
requirepass new_password

# 6. 重启Redis使配置生效
sudo systemctl restart redis
```

## 10. 监控和审计

### 10.1 认证日志监控

```bash
# 查看Redis日志
tail -f /var/log/redis/redis-server.log | grep -i auth

# 监控失败的认证尝试
grep "Authentication failed" /var/log/redis/redis-server.log
```

### 10.2 连接监控

```bash
# 查看当前连接
127.0.0.1:6379> CLIENT LIST

# 监控连接数
127.0.0.1:6379> INFO clients
```

## 总结

Redis密码认证是保障数据安全的重要措施。在生产环境中，建议：

1. **必须设置强密码**：使用复杂密码并定期更换
2. **网络访问控制**：结合防火墙和bind配置限制访问
3. **使用ACL**：Redis 6.0+环境中启用细粒度权限控制
4. **监控审计**：定期检查认证日志和连接状态
5. **备份配置**：确保密码配置的持久化和备份

通过合理配置Redis密码认证，可以有效提升Redis服务的安全性，保护重要数据不被未授权访问。