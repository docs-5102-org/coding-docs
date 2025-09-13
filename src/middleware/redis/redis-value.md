---
title: Redis 查看Value大小指南
category:
  - 中间件
---

# Redis 查看Value大小完整指南

## 目录

[[toc]]

## 概述

在Redis使用过程中，了解key-value的内存占用情况对于性能优化和内存管理至关重要。过大的value值不仅会影响网络传输效率，还可能导致内存不足等问题。本文档将介绍多种查看Redis value大小的方法，帮助开发者更好地分析和优化Redis使用。

## 方法一：使用redis-rdb-tools工具（推荐）

### 1.1 工具简介

[redis-rdb-tools](https://github.com/sripathikrishnan/redis-rdb-tools) 是一个用于解析Redis RDB文件的Python工具，可以生成详细的内存使用报告。

### 1.2 安装redis-rdb-tools

```bash
# 使用pip安装
pip install rdbtools

# 或者从源码安装
git clone https://github.com/sripathikrishnan/redis-rdb-tools.git
cd redis-rdb-tools
python setup.py install
```

### 1.3 配置Redis生成RDB文件

确保Redis配置文件（redis.conf）开启RDB备份：

```ini
# RDB保存策略
save 900 1      # 900秒内有1个key变化时保存
save 300 10     # 300秒内有10个key变化时保存  
save 60 10000   # 60秒内有10000个key变化时保存

# 启用RDB压缩
rdbcompression yes

# RDB文件名
dbfilename dump.rdb

# RDB文件保存路径
dir /var/lib/redis/
```

### 1.4 生成内存分析报告

```bash
# 生成CSV格式的内存报告
rdb -c memory dump.rdb > result.csv

# 生成JSON格式的内存报告
rdb -c memory dump.rdb --format json > result.json

# 只分析特定数据库
rdb -c memory dump.rdb -n 0 > db0_result.csv
```

### 1.5 CSV报告字段说明

生成的CSV文件包含以下字段：
- `DATABASE`: 数据库编号
- `type`: 数据类型（string、list、set、hash、zset）
- `KEY`: 键名
- `size_in_bytes`: 内存占用字节数
- `encoding`: 编码方式
- `num_elements`: 元素数量
- `len_largest_element`: 最大元素长度

### 1.6 导入MySQL进行分析

**创建表结构：**
```sql
CREATE TABLE `redis_memory_analysis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `database` int(11) DEFAULT NULL,
  `type` varchar(128) DEFAULT NULL,
  `key_name` varchar(512) DEFAULT NULL,
  `size_in_bytes` bigint(20) DEFAULT NULL,
  `encoding` varchar(128) DEFAULT NULL,
  `num_elements` int(11) DEFAULT NULL,
  `len_largest_element` varchar(128) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_size` (`size_in_bytes`),
  KEY `idx_type` (`type`),
  KEY `idx_database` (`database`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**常用查询SQL：**
```sql
-- 查找占用内存最大的前20个key
SELECT key_name, size_in_bytes, type 
FROM redis_memory_analysis 
ORDER BY size_in_bytes DESC 
LIMIT 20;

-- 按数据类型统计内存使用
SELECT type, COUNT(*) as key_count, 
       SUM(size_in_bytes) as total_bytes,
       AVG(size_in_bytes) as avg_bytes
FROM redis_memory_analysis 
GROUP BY type;

-- 查找超过1MB的key
SELECT key_name, size_in_bytes/1024/1024 as size_mb, type
FROM redis_memory_analysis 
WHERE size_in_bytes > 1048576
ORDER BY size_in_bytes DESC;
```

## 方法二：使用MEMORY命令（Redis 4.0+）

### 2.1 查看单个key的内存使用

```bash
# 查看指定key的内存占用
127.0.0.1:6379> MEMORY USAGE mykey

# 查看key的内存使用并包含采样信息
127.0.0.1:6379> MEMORY USAGE mykey SAMPLES 5
```

### 2.2 批量查看多个key

```bash
# 使用脚本批量查看
redis-cli --scan --pattern "user:*" | head -20 | while read key; do
    echo -n "$key: "
    redis-cli MEMORY USAGE "$key"
done
```

## 方法三：使用DEBUG OBJECT命令

```bash
# 查看key的编码和内存信息
127.0.0.1:6379> DEBUG OBJECT mykey

# 输出示例：
# Value at:0x7f8b8c0a0000 refcount:1 encoding:raw serializedlength:13 lru:677037 lru_seconds_idle:10
```

## 方法四：使用redis-cli的--bigkeys选项

```bash
# 扫描大key
redis-cli --bigkeys

# 扫描特定数据库的大key
redis-cli -n 2 --bigkeys

# 设置采样间隔
redis-cli --bigkeys -i 0.1
```

## 方法五：使用INFO命令查看整体内存

```bash
# 查看内存使用概况
127.0.0.1:6379> INFO memory

# 关键指标说明：
# used_memory: 实际使用内存
# used_memory_human: 人类可读格式
# used_memory_rss: 系统分配的物理内存
# used_memory_peak: 历史最大内存使用
```

## 方法六：编写自定义脚本

### 6.1 Python脚本示例

```python
import redis
import json
from collections import defaultdict

def analyze_redis_memory():
    r = redis.Redis(host='localhost', port=6379, db=0)
    
    # 获取所有key
    keys = r.keys('*')
    
    memory_stats = defaultdict(list)
    total_memory = 0
    
    for key in keys:
        try:
            # 获取key的内存使用（Redis 4.0+）
            memory_usage = r.memory_usage(key)
            key_type = r.type(key).decode()
            
            memory_stats[key_type].append({
                'key': key.decode(),
                'memory': memory_usage,
                'size_mb': round(memory_usage / 1024 / 1024, 2)
            })
            
            total_memory += memory_usage
            
        except Exception as e:
            print(f"Error analyzing key {key}: {e}")
    
    # 输出统计结果
    print(f"Total Keys: {len(keys)}")
    print(f"Total Memory: {total_memory / 1024 / 1024:.2f} MB")
    
    for data_type, keys_info in memory_stats.items():
        type_memory = sum(k['memory'] for k in keys_info)
        print(f"\n{data_type.upper()} keys:")
        print(f"  Count: {len(keys_info)}")
        print(f"  Total Memory: {type_memory / 1024 / 1024:.2f} MB")
        
        # 显示最大的5个key
        largest_keys = sorted(keys_info, key=lambda x: x['memory'], reverse=True)[:5]
        for key_info in largest_keys:
            print(f"    {key_info['key']}: {key_info['size_mb']} MB")

if __name__ == "__main__":
    analyze_redis_memory()
```

### 6.2 Shell脚本示例

```bash
#!/bin/bash

# Redis连接信息
REDIS_HOST="127.0.0.1"
REDIS_PORT="6379"
REDIS_DB="0"

echo "Redis Memory Analysis Report"
echo "============================"

# 获取总体内存信息
echo "Overall Memory Usage:"
redis-cli -h $REDIS_HOST -p $REDIS_PORT -n $REDIS_DB INFO memory | grep used_memory_human

echo ""
echo "Top 10 Largest Keys:"
echo "===================="

# 使用SCAN命令遍历所有key
redis-cli -h $REDIS_HOST -p $REDIS_PORT -n $REDIS_DB --scan | while read key; do
    # 获取key的内存使用量
    memory=$(redis-cli -h $REDIS_HOST -p $REDIS_PORT -n $REDIS_DB MEMORY USAGE "$key" 2>/dev/null)
    if [ ! -z "$memory" ]; then
        echo "$memory $key"
    fi
done | sort -nr | head -10 | while read size key; do
    size_mb=$(echo "scale=2; $size/1024/1024" | bc)
    echo "$key: ${size_mb}MB"
done
```

## 性能优化建议

### 1. 大Value处理策略

- **拆分大对象**: 将大的JSON或字符串拆分成多个smaller key
- **使用压缩**: 在应用层对大value进行压缩
- **异步处理**: 对大value的读写操作使用异步模式

### 2. 数据类型选择

```bash
# 不同数据类型的内存效率对比
# Hash vs String (存储用户信息)
# 使用Hash更节省内存
HSET user:1001 name "张三" age 25 email "zhangsan@example.com"

# 比单独存储String key更高效
SET user:1001:name "张三"
SET user:1001:age 25  
SET user:1001:email "zhangsan@example.com"
```

### 3. 监控和告警

- 设置内存使用率告警阈值（建议80%）
- 定期执行大key扫描
- 建立key过期时间管理机制

## 常见问题解决

### Q1: RDB文件过大导致分析缓慢
**解决方案**: 
- 使用`--db`参数只分析特定数据库
- 在Redis从节点上进行分析
- 使用SSD存储提高I/O性能

### Q2: MEMORY USAGE命令返回空值
**解决方案**: 
- 确认Redis版本 ≥ 4.0
- 检查key是否存在
- 验证连接的数据库是否正确

### Q3: 生产环境如何安全执行大key扫描
**解决方案**: 
- 在业务低峰期执行
- 使用`-i`参数设置扫描间隔
- 在从节点上执行扫描操作

## 总结

选择合适的方法查看Redis value大小：

1. **日常监控**: 使用`--bigkeys`和`INFO memory`
2. **详细分析**: 使用`redis-rdb-tools`生成报告
3. **实时查看**: 使用`MEMORY USAGE`命令
4. **自动化**: 编写脚本定期分析和告警

通过定期分析Redis的内存使用情况，可以及时发现并优化大value问题，提高系统性能和稳定性。