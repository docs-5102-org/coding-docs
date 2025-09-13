---
title: SQL性能分析
category:
  - 数据库
tag:
  - MySQL
  - SQL
  - explain
---

# MySQL SQL性能分析完整指南

## 目录

[[toc]]

## 性能分析概述

### 为什么需要性能分析？
- **识别慢查询**：找出执行时间过长的SQL语句
- **优化查询计划**：了解MySQL如何执行查询
- **合理设计索引**：根据查询模式创建合适的索引
- **提升系统性能**：降低数据库负载，提高响应速度

### 性能问题的常见症状
- 查询执行时间过长
- CPU使用率过高
- 磁盘I/O频繁
- 内存使用率高
- 并发连接数过多

## EXPLAIN语句详解

### 基本语法
```sql
EXPLAIN [FORMAT=JSON|TREE] SELECT语句;
EXPLAIN ANALYZE SELECT语句;  -- MySQL 8.0+
```

### EXPLAIN输出字段详解

#### 1. id字段
- **含义**：SELECT查询的序列号，标识执行顺序
- **规则**：
  - 数字越大越先执行
  - 相同id从上往下执行
  - NULL表示结果集，通常是UNION操作

```sql
-- 示例：子查询执行顺序
EXPLAIN SELECT * FROM users WHERE id IN 
  (SELECT user_id FROM orders WHERE status = 'completed');
```

#### 2. select_type字段
- **SIMPLE**：简单查询，不包含子查询或UNION
- **PRIMARY**：最外层查询
- **SUBQUERY**：子查询中的第一个SELECT
- **DERIVED**：派生表(FROM子句的子查询)
- **UNION**：UNION操作的第二个或后续SELECT
- **DEPENDENT SUBQUERY**：依赖外部查询的子查询

#### 3. table字段
- 显示数据来源的表名
- 可能的值：
  - 实际表名
  - `<derivedN>`：派生表
  - `<unionM,N>`：UNION结果

#### 4. partitions字段
- 显示查询涉及的分区
- 主要用于分区表的性能分析

#### 5. type字段（重要性能指标）

**性能从好到坏的排序：**
```
system > const > eq_ref > ref > fulltext > ref_or_null 
> index_merge > unique_subquery > index_subquery 
> range > index > ALL
```

| 类型 | 说明 | 性能 | 示例 |
|------|------|------|------|
| **system** | 系统表，只有一行数据 | 最优 | 系统配置表 |
| **const** | 通过主键或唯一索引访问，最多返回一行 | 极优 | `WHERE id = 1` |
| **eq_ref** | 唯一索引扫描，对于每个索引键值，表中只有一条记录匹配 | 优秀 | JOIN中使用主键 |
| **ref** | 非唯一性索引扫描 | 良好 | `WHERE name = 'John'` |
| **range** | 索引范围扫描 | 可接受 | `WHERE id BETWEEN 1 AND 100` |
| **index** | 索引全扫描 | 需优化 | 扫描整个索引树 |
| **ALL** | 全表扫描 | 最差 | 没有使用任何索引 |

#### 6. possible_keys字段
- 显示查询可能使用的索引
- 如果为NULL，说明没有可用索引，需要考虑创建索引

#### 7. key字段
- 显示MySQL实际使用的索引
- 如果为NULL，表示没有使用索引

#### 8. key_len字段
- 显示索引使用的字节长度
- 可以判断复合索引使用了几个字段
- **计算规则**：
  - INT: 4字节
  - BIGINT: 8字节
  - CHAR(n): n字节
  - VARCHAR(n): n字节 + 2字节长度
  - 允许NULL: +1字节

#### 9. ref字段
- 显示与索引比较的字段或常量
- 常见值：const、字段名、func

#### 10. rows字段
- 预估需要扫描的行数
- 数值越小越好
- 注意：InnoDB中这个值不完全准确

#### 11. Extra字段（关键优化信息）

| Extra值 | 含义 | 优化建议 |
|---------|------|----------|
| **Using index** | 覆盖索引，只需访问索引 | 很好，无需优化 |
| **Using where** | 使用WHERE条件过滤 | 正常情况 |
| **Using temporary** | 使用临时表 | 需要优化，考虑添加索引 |
| **Using filesort** | 文件排序，没有使用索引排序 | 需要优化，添加ORDER BY索引 |
| **Using index condition** | 索引条件下推 | 好的优化特性 |
| **Using join buffer** | 使用连接缓冲区 | 考虑添加索引优化JOIN |

## 性能分析工具

### 1. 慢查询日志
```sql
-- 启用慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;  -- 记录超过2秒的查询
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- 查看慢查询日志位置
SHOW VARIABLES LIKE 'slow_query_log_file';
```

### 2. Performance Schema
```sql
-- 查看执行时间最长的语句
SELECT 
    DIGEST_TEXT,
    COUNT_STAR as exec_count,
    AVG_TIMER_WAIT/1000000000 as avg_time_sec,
    MAX_TIMER_WAIT/1000000000 as max_time_sec
FROM performance_schema.events_statements_summary_by_digest 
ORDER BY AVG_TIMER_WAIT DESC 
LIMIT 10;
```

### 3. SHOW PROFILE
```sql
-- 启用性能分析
SET profiling = 1;

-- 执行查询
SELECT * FROM users WHERE email = 'john@example.com';

-- 查看性能分析结果
SHOW PROFILES;
SHOW PROFILE FOR QUERY 1;
```

### 4. sys Schema（MySQL 5.7+）
```sql
-- 查看慢查询统计
SELECT * FROM sys.x$statements_with_runtimes_in_95th_percentile;

-- 查看全表扫描的语句
SELECT * FROM sys.statements_with_full_table_scans;
```

## 索引优化策略

### 1. 索引设计原则
- **选择性高的字段**：不同值越多越好
- **WHERE条件常用字段**：频繁查询的字段
- **ORDER BY字段**：避免文件排序
- **JOIN连接字段**：提高连接效率

### 2. 复合索引优化
```sql
-- 遵循最左前缀原则
CREATE INDEX idx_user_order ON orders(user_id, status, created_at);

-- 有效查询
SELECT * FROM orders WHERE user_id = 1;  -- 使用索引
SELECT * FROM orders WHERE user_id = 1 AND status = 'completed';  -- 使用索引
SELECT * FROM orders WHERE user_id = 1 AND status = 'completed' AND created_at > '2024-01-01';  -- 使用索引

-- 无效查询
SELECT * FROM orders WHERE status = 'completed';  -- 不使用索引
SELECT * FROM orders WHERE created_at > '2024-01-01';  -- 不使用索引
```

### 3. 覆盖索引
```sql
-- 创建覆盖索引，包含查询需要的所有字段
CREATE INDEX idx_user_email_name ON users(email, name, status);

-- 这个查询只需要访问索引，不需要回表
SELECT name, status FROM users WHERE email = 'john@example.com';
```

## 查询优化技巧

### 1. WHERE条件优化
```sql
-- 避免在WHERE子句中使用函数
-- 不好的写法
SELECT * FROM orders WHERE YEAR(created_at) = 2024;

-- 好的写法
SELECT * FROM orders WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01';
```

### 2. JOIN优化
```sql
-- 确保JOIN字段有索引
-- 小表驱动大表
SELECT u.name, o.order_no 
FROM users u 
INNER JOIN orders o ON u.id = o.user_id 
WHERE u.status = 'active';
```

### 3. 子查询优化
```sql
-- 将子查询改写为JOIN
-- 原查询（性能较差）
SELECT * FROM users WHERE id IN (
    SELECT user_id FROM orders WHERE status = 'completed'
);

-- 优化后（性能较好）
SELECT DISTINCT u.* 
FROM users u 
INNER JOIN orders o ON u.id = o.user_id 
WHERE o.status = 'completed';
```

### 4. LIMIT优化
```sql
-- 深度分页优化
-- 不好的写法
SELECT * FROM users ORDER BY id LIMIT 10000, 20;

-- 好的写法
SELECT * FROM users WHERE id > 10000 ORDER BY id LIMIT 20;
```

## 实战案例分析

### 案例1：慢查询优化

**问题SQL：**
```sql
SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;
```

**EXPLAIN分析：**
```sql
EXPLAIN SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;
```

**问题识别：**
- type: ALL（全表扫描）
- Extra: Using where; Using filesort

**优化方案：**
```sql
-- 创建复合索引
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
```

**优化后效果：**
- type: ref
- Extra: Using index condition
- 执行时间从2.5秒降低到0.01秒

### 案例2：JOIN查询优化

**问题SQL：**
```sql
SELECT u.name, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2024-01-01'
GROUP BY u.id;
```

**优化步骤：**
1. 确保JOIN字段有索引
2. WHERE条件字段添加索引
3. 考虑使用覆盖索引

```sql
-- 添加必要索引
CREATE INDEX idx_users_created ON users(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
```

## 性能监控建议

### 1. 定期检查慢查询
```sql
-- 查看慢查询统计
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```

### 2. 监控关键指标
- QPS（每秒查询数）
- 平均响应时间
- 索引使用率
- 缓存命中率

### 3. 建立性能基线
- 记录优化前的性能数据
- 设置性能阈值告警
- 定期进行性能回归测试

## 参考资料

第三方文档: <https://blog.csdn.net/weixin_32027779/article/details/113329922>

官网链接地址如下:
- 表定义说明：<https://dev.mysql.com/doc/refman/8.0/en/explain-output.html>
- 各个列的含义具体解析：<https://dev.mysql.com/doc/refman/8.0/en/explain-output.html#explain-join-types>
