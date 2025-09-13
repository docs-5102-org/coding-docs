---
title: 分库分表与主从配置教程
category:
  - 数据库
tag:
  - MySQL
  - 分库分表
---

# MySQL 分库分表与主从配置教程

## 目录

[[toc]]

## 概述

### 为什么需要分库分表？
当单表数据量达到几百万甚至几千万时，会遇到以下问题：
- 查询速度急剧下降
- 表锁定和行锁定导致并发性能差
- 备份和维护时间过长
- 单机存储容量限制

### 核心解决方案
- **主从复制**：解决读写分离，提升查询性能
- **垂直分库**：按业务模块划分数据库
- **水平分表**：按一定规则将数据分散到多个表
- **读写分离**：通过中间件实现查询负载均衡

## 主从复制配置

### 环境准备
```
主服务器：192.168.1.100 (Master)
从服务器：192.168.1.101 (Slave)
MySQL版本：5.7+ (建议主从版本一致或从库版本更高)
```

### 1. 主服务器配置

#### 1.1 修改配置文件 `/etc/my.cnf`
```ini
[mysqld]
# 服务器ID，必须唯一
server-id = 1

# 启用二进制日志
log-bin = mysql-bin

# 需要同步的数据库
binlog-do-db = test
binlog-do-db = production

# 忽略同步的数据库
binlog-ignore-db = mysql
binlog-ignore-db = information_schema
binlog-ignore-db = performance_schema

# 日志文件存储路径
log-bin = /var/log/mysql/mysql-bin

# 二进制日志格式
binlog-format = ROW
```

#### 1.2 重启MySQL服务
```bash
sudo systemctl restart mysql
```

#### 1.3 创建复制用户
```sql
-- 登录MySQL
mysql -u root -p

-- 创建复制用户
GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* 
TO 'replication'@'192.168.1.101' IDENTIFIED BY 'replica_password';

-- 刷新权限
FLUSH PRIVILEGES;

-- 查看主服务器状态
SHOW MASTER STATUS;
```

记录返回的 `File` 和 `Position` 值，稍后配置从服务器时需要使用。

### 2. 从服务器配置

#### 2.1 修改配置文件 `/etc/my.cnf`
```ini
[mysqld]
# 服务器ID，必须与主服务器不同
server-id = 2

# 中继日志
relay-log = relay-bin

# 只读模式（可选）
read-only = 1

# 需要同步的数据库
replicate-do-db = test
replicate-do-db = production

# 忽略同步的数据库
replicate-ignore-db = mysql
replicate-ignore-db = information_schema
replicate-ignore-db = performance_schema
```

#### 2.2 重启MySQL服务并配置同步
```sql
-- 重启服务
sudo systemctl restart mysql

-- 登录MySQL
mysql -u root -p

-- 配置主从同步（使用主服务器的File和Position值）
CHANGE MASTER TO
    MASTER_HOST='192.168.1.100',
    MASTER_USER='replication',
    MASTER_PASSWORD='replica_password',
    MASTER_LOG_FILE='mysql-bin.000001',  -- 替换为实际值
    MASTER_LOG_POS=154;                  -- 替换为实际值

-- 启动从服务器
START SLAVE;

-- 检查同步状态
SHOW SLAVE STATUS\G
```

#### 2.3 验证同步状态
确保以下两项都显示为 `Yes`：
- `Slave_IO_Running: Yes`
- `Slave_SQL_Running: Yes`

### 3. 双主复制配置

对于需要双向同步的场景：

#### 3.1 在原从服务器上添加主服务器配置
```ini
# 在从服务器的/etc/my.cnf中添加
log-bin = mysql-bin
binlog-do-db = test
binlog-ignore-db = mysql
```

#### 3.2 在原主服务器上添加从服务器配置
```ini
# 在主服务器的/etc/my.cnf中添加
master-host = 192.168.1.101
master-user = replication
master-password = replica_password
master-port = 3306
replicate-do-db = test
```

## 读写分离实现

### 1. 使用MySQL Proxy实现读写分离

#### 1.1 安装MySQL Proxy
```bash
# 下载MySQL Proxy
wget http://dev.mysql.com/get/Downloads/MySQL-Proxy/mysql-proxy-0.8.5-linux-glibc2.3-x86-64bit.tar.gz

# 解压安装
tar -zxf mysql-proxy-0.8.5-linux-glibc2.3-x86-64bit.tar.gz
mv mysql-proxy-0.8.5-linux-glibc2.3-x86-64bit /opt/mysql-proxy
```

#### 1.2 配置读写分离脚本
创建启动脚本 `/opt/mysql-proxy/init.d/mysql-proxy`：
```bash
#!/bin/bash
PROXY_PATH=/opt/mysql-proxy/bin
PROXY_OPTIONS="--admin-username=admin \
--admin-password=admin123 \
--proxy-read-only-backend-addresses=192.168.1.101:3306 \
--proxy-backend-addresses=192.168.1.100:3306 \
--proxy-lua-script=/opt/mysql-proxy/share/doc/mysql-proxy/rw-splitting.lua"

case "$1" in
start)
    echo "Starting MySQL Proxy..."
    $PROXY_PATH/mysql-proxy $PROXY_OPTIONS --daemon \
    --pid-file=/var/run/mysql-proxy.pid \
    --user=mysql \
    --log-level=info \
    --log-file=/var/log/mysql-proxy.log
    ;;
stop)
    echo "Stopping MySQL Proxy..."
    killall mysql-proxy
    ;;
restart)
    $0 stop
    sleep 2
    $0 start
    ;;
*)
    echo "Usage: $0 {start|stop|restart}"
    exit 1
    ;;
esac
```

### 2. 应用层实现读写分离

#### 2.1 PHP示例
```php
<?php
class DatabaseRouter {
    private $writeDB;
    private $readDB;
    
    public function __construct() {
        // 写库连接（主库）
        $this->writeDB = new PDO(
            'mysql:host=192.168.1.100;dbname=test', 
            'username', 
            'password'
        );
        
        // 读库连接（从库）
        $this->readDB = new PDO(
            'mysql:host=192.168.1.101;dbname=test', 
            'username', 
            'password'
        );
    }
    
    public function query($sql) {
        // 判断是否为读操作
        if (preg_match('/^\s*(SELECT|SHOW|EXPLAIN)\s+/i', trim($sql))) {
            return $this->readDB->query($sql);
        } else {
            return $this->writeDB->query($sql);
        }
    }
}
?>
```

## 分库分表策略

### 1. 垂直分库

按业务模块划分数据库：
```
用户系统数据库: user_db
商品系统数据库: product_db  
订单系统数据库: order_db
日志系统数据库: log_db
```

### 2. 水平分表

#### 2.1 预先分表策略
```php
<?php
function getHashTable($table, $userId) {
    // 使用用户ID的哈希值确定表名
    $hash = crc32($userId) % 100;  // 分成100张表
    return sprintf("%s_%02d", $table, abs($hash));
}

// 示例使用
$tableName = getHashTable('user_message', 'user12345');
// 结果可能是: user_message_23
?>
```

#### 2.2 按时间分表策略
```sql
-- 按月份分表
CREATE TABLE user_log_202401 (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE user_log_202402 LIKE user_log_202401;
CREATE TABLE user_log_202403 LIKE user_log_202401;
```

#### 2.3 使用MERGE存储引擎
```sql
-- 创建子表
CREATE TABLE user_message_1 (
    id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=MyISAM;

CREATE TABLE user_message_2 LIKE user_message_1;

-- 创建MERGE表
CREATE TABLE user_message (
    id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(id)
) ENGINE=MERGE UNION=(user_message_1, user_message_2) 
INSERT_METHOD=LAST;
```

### 3. 分片路由算法

#### 3.1 取模算法
```python
def get_shard_table(user_id, shard_count=8):
    """根据用户ID取模确定分片"""
    shard_id = hash(user_id) % shard_count
    return f"user_data_{shard_id:02d}"

def get_shard_database(user_id, db_count=4):
    """根据用户ID确定数据库分片"""
    db_id = hash(user_id) % db_count
    return f"shard_db_{db_id}"
```

#### 3.2 一致性哈希算法
```python
import hashlib

class ConsistentHash:
    def __init__(self, nodes=None, replicas=3):
        self.replicas = replicas
        self.ring = {}
        self.sorted_keys = []
        
        if nodes:
            for node in nodes:
                self.add_node(node)
    
    def add_node(self, node):
        for i in range(self.replicas):
            key = self.hash(f"{node}:{i}")
            self.ring[key] = node
            self.sorted_keys.append(key)
        self.sorted_keys.sort()
    
    def remove_node(self, node):
        for i in range(self.replicas):
            key = self.hash(f"{node}:{i}")
            del self.ring[key]
            self.sorted_keys.remove(key)
    
    def get_node(self, key):
        if not self.ring:
            return None
        
        hash_key = self.hash(key)
        idx = self.binary_search(hash_key)
        return self.ring[self.sorted_keys[idx]]
    
    def hash(self, key):
        return int(hashlib.md5(key.encode()).hexdigest(), 16)
    
    def binary_search(self, key):
        left, right = 0, len(self.sorted_keys) - 1
        while left <= right:
            mid = (left + right) // 2
            if self.sorted_keys[mid] == key:
                return mid
            elif self.sorted_keys[mid] < key:
                left = mid + 1
            else:
                right = mid - 1
        return left % len(self.sorted_keys)
```

## 实际案例与最佳实践

### 1. 电商系统分库分表实践

#### 1.1 数据库架构设计
```
用户库 (user_db)
├── user_info_00 ~ user_info_99     (用户基本信息，按用户ID哈希分表)
├── user_profile_00 ~ user_profile_99 (用户详细资料)

商品库 (product_db)  
├── product_info                     (商品信息，单表)
├── product_category                 (商品分类，单表)
├── product_inventory_00 ~ product_inventory_09 (库存信息，按商品ID分表)

订单库 (order_db)
├── order_info_202401 ~ order_info_202412    (订单信息，按时间分表)
├── order_item_202401 ~ order_item_202412    (订单商品，按时间分表)

日志库 (log_db)
├── access_log_20240101 ~ access_log_20241231 (访问日志，按日期分表)
```

#### 1.2 分表中间件配置
```yaml
# 配置文件示例 (使用ShardingSphere)
dataSources:
  master_user_db:
    url: jdbc:mysql://192.168.1.100:3306/user_db
    username: root
    password: password
    
  slave_user_db:
    url: jdbc:mysql://192.168.1.101:3306/user_db
    username: root
    password: password

shardingRule:
  tables:
    user_info:
      actualDataNodes: master_user_db.user_info_0$->{0..9}
      tableStrategy:
        standard:
          shardingColumn: user_id
          shardingAlgorithm:
            type: INLINE
            props:
              algorithm.expression: user_info_$->{user_id % 10}
      
  masterSlaveRules:
    master_user_db:
      masterDataSourceName: master_user_db
      slaveDataSourceNames: [slave_user_db]
```

### 2. 监控与运维

#### 2.1 主从同步监控脚本
```bash
#!/bin/bash
# 检查主从同步状态
check_replication() {
    local slave_status=$(mysql -h192.168.1.101 -uroot -p$MYSQL_PASSWORD \
        -e "SHOW SLAVE STATUS\G" 2>/dev/null)
    
    local io_running=$(echo "$slave_status" | grep "Slave_IO_Running" | awk '{print $2}')
    local sql_running=$(echo "$slave_status" | grep "Slave_SQL_Running" | awk '{print $2}')
    local seconds_behind=$(echo "$slave_status" | grep "Seconds_Behind_Master" | awk '{print $2}')
    
    if [[ "$io_running" != "Yes" ]] || [[ "$sql_running" != "Yes" ]]; then
        echo "ERROR: Replication is not running properly!"
        echo "Slave_IO_Running: $io_running"
        echo "Slave_SQL_Running: $sql_running"
        # 发送告警
        send_alert "MySQL Replication Failed"
    elif [[ "$seconds_behind" -gt 300 ]]; then
        echo "WARNING: Replication lag is ${seconds_behind} seconds"
        send_alert "MySQL Replication Lag: ${seconds_behind}s"
    else
        echo "OK: Replication is running normally"
    fi
}

send_alert() {
    local message=$1
    # 发送邮件或短信告警
    echo "$message" | mail -s "MySQL Alert" admin@company.com
}

# 执行检查
check_replication
```

#### 2.2 性能优化建议

**主库优化：**
```ini
[mysqld]
# 缓冲池大小（物理内存的70-80%）
innodb_buffer_pool_size = 8G

# 二进制日志刷盘策略
sync_binlog = 1

# InnoDB刷盘策略
innodb_flush_log_at_trx_commit = 1

# 连接数
max_connections = 2000

# 查询缓存（MySQL 8.0已移除）
query_cache_size = 0
```

**从库优化：**
```ini
[mysqld]
# 从库可以使用较宽松的设置提高性能
innodb_flush_log_at_trx_commit = 2
sync_binlog = 0

# 并行复制
slave_parallel_type = LOGICAL_CLOCK
slave_parallel_workers = 8
```

### 3. 常见问题处理

#### 3.1 主从同步中断修复
```sql
-- 在从库执行
STOP SLAVE;

-- 跳过一个错误事务
SET GLOBAL sql_slave_skip_counter = 1;

-- 重新开始同步
START SLAVE;

-- 检查状态
SHOW SLAVE STATUS\G
```

#### 3.2 数据迁移脚本
```python
#!/usr/bin/env python3
import pymysql
import logging

def migrate_data():
    """将单表数据迁移到分表"""
    
    # 源数据库连接
    source_conn = pymysql.connect(
        host='localhost',
        user='root',
        password='password',
        database='old_db'
    )
    
    # 目标数据库连接
    target_conn = pymysql.connect(
        host='localhost',
        user='root',
        password='password',
        database='new_db'
    )
    
    try:
        with source_conn.cursor() as cursor:
            # 分批读取源数据
            cursor.execute("SELECT COUNT(*) FROM user_message")
            total_rows = cursor.fetchone()[0]
            
            batch_size = 10000
            offset = 0
            
            while offset < total_rows:
                cursor.execute(f"""
                    SELECT id, user_id, message, created_at 
                    FROM user_message 
                    LIMIT {batch_size} OFFSET {offset}
                """)
                
                rows = cursor.fetchall()
                
                # 按分表规则插入目标表
                for row in rows:
                    user_id = row[1]
                    table_suffix = hash(str(user_id)) % 100
                    target_table = f"user_message_{table_suffix:02d}"
                    
                    with target_conn.cursor() as target_cursor:
                        target_cursor.execute(f"""
                            INSERT INTO {target_table} 
                            (id, user_id, message, created_at)
                            VALUES (%s, %s, %s, %s)
                        """, row)
                
                target_conn.commit()
                offset += batch_size
                
                logging.info(f"Migrated {offset}/{total_rows} rows")
                
    except Exception as e:
        logging.error(f"Migration failed: {e}")
        target_conn.rollback()
    finally:
        source_conn.close()
        target_conn.close()

if __name__ == "__main__":
    migrate_data()
```

## 总结

MySQL分库分表与主从配置是高并发系统的重要架构组成部分。在实施过程中需要注意：

1. **渐进式改造**：不要一次性大规模重构，建议逐步迁移
2. **业务特点分析**：根据实际业务场景选择合适的分片策略
3. **监控告警**：建立完善的监控体系，及时发现问题
4. **数据一致性**：注意处理分布式事务和数据一致性问题
5. **扩容规划**：提前考虑扩容策略，避免二次分片

通过合理的分库分表和主从配置，可以有效提升MySQL数据库的性能和可用性，支撑业务的快速发展。