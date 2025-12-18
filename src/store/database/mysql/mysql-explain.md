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

---列的输出如下：
select_type | table | type | possible_keys | key | key_len | ref | rows | Extra

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

```sql
explain select * from user where uid=1;

+----+-------------+-------+--------+--------------+----------+---------+-------+------+-------+
| id | select_type | table | type   | possible_keys| key      | key_len | ref   | rows | Extra |
+----+-------------+-------+--------+--------------+----------+---------+-------+------+-------+
| 1  | SIMPLE      | user  | const  | PRIMARY      | PRIMARY  | 4       | const | 1    |       |
+----+-------------+-------+--------+--------------+----------+---------+-------+------+-------+
```

- **PRIMARY**：查询中包含任何复杂的子部分，最外层查询则被标记为primary
```sql
explain select * from (select * from user where uid=1)b

+----+-------------+-----------+--------+---------------+----------+---------+-------+------+-------+
| id | select_type | table     | type   | possible_keys | key      | key_len | ref   | rows | Extra |
+----+-------------+-----------+--------+---------------+----------+---------+-------+------+-------+
| 1  | PRIMARY     | <derived2>| system |               |          |         |       | 1    |       |
+----+-------------+-----------+--------+---------------+----------+---------+-------+------+-------+
| 2  | DERIVED     | user      | const  | PRIMARY       | PRIMARY  | 4       | const | 1    |       |
+----+-------------+-----------+--------+---------------+----------+---------+-------+------+-------+
```
- **SUBQUERY**：子查询中的第一个SELECT
```sql

explain select * from groups where gid =(select gid from user where uid=1)

+----+-------------+-------+--------+---------------+----------+---------+-------+------+-------+
| id | select_type | table | type   | possible_keys | key      | key_len | ref   | rows | Extra |
+----+-------------+-------+--------+---------------+----------+---------+-------+------+-------+
| 1  | PRIMARY     | user  | const  | PRIMARY       | PRIMARY  | 4       | const | 1    |       |
+----+-------------+-------+--------+---------------+----------+---------+-------+------+-------+
| 2  | SUBQUERY    | user  | const  | PRIMARY       | PRIMARY  | 4       |       | 1    |       |
+----+-------------+-------+--------+---------------+----------+---------+-------+------+-------+
```
- **DERIVED**：派生表(FROM子句的子查询)
- **UNION**：UNION操作的第二个或后续SELECT，若union包含在from子句的子查询中，外层select将被标记为`derived`
```sql
explain select * from user where uid=1 union select * from user where uid=2

+----+--------------+-----------+-------+---------------+----------+---------+-------+------+-------+
| id | select_type  | table     | type  | possible_keys | key      | key_len | ref   | rows | Extra |
+----+--------------+-----------+-------+---------------+----------+---------+-------+------+-------+
| 1  | PRIMARY      | <derived2>| ALL   |               |          |         |       | 1    |       |
+----+--------------+-----------+-------+---------------+----------+---------+-------+------+-------+
| 2  | UNION        | user      | const | PRIMARY       | PRIMARY  | 4       | const | 1    |       |
+----+--------------+-----------+-------+---------------+----------+---------+-------+------+-------+
|    | UNION RESULT | <union1,2>| ALL   |               |          | (Null)  | (Null)|(Null)|(Null) |
+----+--------------+-----------+-------+---------------+----------+---------+-------+------+-------+
```
- **DEPENDENT SUBQUERY**：子查询中的第一个SELECT，取决于外面的查询

```sql
explain select * from user where uid in (select uid from user where uid<4)

+----+----------------------+-------+--------+-----------------+----------+---------+------+------+------------------------------+
| id | select_type          | table | type   | possible_keys   | key      | key_len | ref  | rows | Extra                        |
+----+----------------------+-------+--------+-----------------+----------+---------+------+------+------------------------------+
| 1  | PRIMARY              | user  | ALL    |                 |          |         |      | 7    | Using where                  |
+----+----------------------+-------+--------+-----------------+----------+---------+------+------+------------------------------+
| 2  | DEPENDENT SUBQUERY   | user  | eq_ref | unique_s,PRIMARY| PRIMARY  | 4       | func | 1    | Using index; Using where     |
+----+----------------------+-------+--------+-----------------+----------+---------+------+------+------------------------------+
```

- **DEPENDENT UNION**：UNION语句中的第二个SELECT，依赖于外部子查询
```sql
explain select * from user x where uid in (select uid from user y union select uid from user z where uid<5)

+----+--------------------+-----------+--------+---------------+----------+---------+------+------+------------------+
| id | select_type        | table     | type   | possible_keys | key      | key_len | ref  | rows | Extra            |
+----+--------------------+-----------+--------+---------------+----------+---------+------+------+------------------+
| 1  | PRIMARY            | x         | ALL    |               |          |         |      | 7    | Using where      |
+----+--------------------+-----------+--------+---------------+----------+---------+------+------+------------------+
| 2  | DEPENDENT SUBQUERY | y         | eq_ref | PRIMARY       | PRIMARY  | 4       | func | 1    | Using index      |
+----+--------------------+-----------+--------+---------------+----------+---------+------+------+------------------+
| 3  | DEPENDENT UNION    | z         | eq_ref | PRIMARY       | PRIMARY  | 4       | func | 1    | Using index      |
+----+--------------------+-----------+--------+---------------+----------+---------+------+------+------------------+
|    | UNION RESULT       | <union2,3>| ALL    |               |          | (Null)  |(Null)|(Null)| (Null)           |
+----+--------------------+-----------+--------+---------------+----------+---------+------+------+------------------+
```

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
  - VARCHAR(n): n字节 + 2字节长度(VARCHAR 是变长字段，必须额外存储“实际长度”，因此需要 1～2 字节；而 EXPLAIN 为了简化计算，一律用 2 字节来表示)
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

**配置永久生效**

windows: `my.ini`
linux: `/etc/my.cnf`

```ini
[mysqld]
slow_query_log = ON
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
log_queries_not_using_indexes = ON
```

::: tip
参数说明：
general_log=1 #开启mysql执行sql的日志
general_log_file=/log/general.log #将mysql执行sql日志记录到指定文件中
slow_query_log=1 #开启mysql慢sql的日志
slow_query_log_file=/log/slow.log #将慢查询日志记录到指定文件中
log_output=table,File #日志输出会写表，也会写日志文件，为了便于程序去统计，所以最好写
long_query_time=1 #设置mysql的慢查询为超过1s的查询
#如果没有配置general_log_file，那么general_log就只会写表了
#如果没有配置slow_query_log_file，那么slow_query_log就只会写表了
:::

重启

```bash
systemctl restart mysqld
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

### 5. 查看慢查询的日志

#### 通过配置文件查看日志

```sql
mysql> select sleep(2);

+----------+
| sleep(2) |
+----------+
|    0 |
+----------+

1 row in set (2.00 sec)
```

```bash
[root@localhost data]# cat /application/mysql/data/localhost-slow.log
/application/mysql/bin/mysqld, Version: 5.5.51-log (MySQL Community Server (GPL)). started with:
Tcp port: 3306 Unix socket: /tmp/mysql.sock
Time         Id Command  Argument
/application/mysql/bin/mysqld, Version: 5.5.51-log (MySQL Community Server (GPL)). started with:
Tcp port: 3306 Unix socket: /tmp/mysql.sock
Time         Id Command  Argument

/application/mysql/bin/mysqld, Version: 5.5.51-log (MySQL Community Server (GPL)). started with:
Tcp port: 3306 Unix socket: /tmp/mysql.sock
Time         Id Command  Argument
# Time: 170605 6:37:00
# User@Host: root[root] @ localhost []
# Query_time: 2.000835 Lock_time: 0.000000 Rows_sent: 1 Rows_examined: 0
SET timestamp=1496615820;
select sleep(2);
```

#### 通过查询语句看日志

```sql
mysql> show global status like '%Slow_queries%';

+---------------+-------+

| Variable_name | Value |

+---------------+-------+

| Slow_queries | 1   |

+---------------+-------+

1 row in set (0.00 sec)
```

### 6. 日志分析工具

在生产环境中，如果要手工分析日志，查找、分析SQL，显然是个体力活，MySQL提供了日志分析工具`mysqldumpslow`

`mysqldumpslow` 用于对 **慢查询日志（slow-log）** 进行统计、去重和排序，快速定位最耗时、最频繁的 SQL。

典型用法：

```bash
/path/mysqldumpslow -s c -t 10 /database/mysql/slow-log
```

---

#### 🚀 **参数详解**

**1. -s <sort_type> — 排序方式**

`s` 的排序规则如下：

| 参数                    | 含义                              |
| --------------------- | ------------------------------- |
| **c**                 | 按出现次数排序（count）                  |
| **t**                 | 按平均查询时间排序（time）                 |
| **l**                 | 按锁等待时间排序（lock time）             |
| **r**                 | 按返回记录数排序（rows）                  |
| **ac / at / al / ar** | 对应上面排序的 **倒序（asc → ascending）** |

示例：

```bash
-s c      # 按出现次数排序（默认：降序）
-s at     # 按平均查询时间升序
```

---

**2. -t `<N>` — 输出前 N 条记录（Top N）**

```bash
-t 10     # 输出前10条
```

例如：

```bash
/path/mysqldumpslow -s c -t 10 /database/mysql/slow-log
# 输出出现次数最多的10条SQL
```

---

**3. -g <`regex`> — 正则过滤（不区分大小写）**

可以只统计包含某一关键词的 SQL。

例如统计所有含 LEFT JOIN 的慢 SQL：

```bash
/path/mysqldumpslow -s t -t 10 -g "left join" /database/mysql/slow-log
```

---

#### 📊 **常用示例**

**1. 按记录次数排序，输出前 10 条**

```bash
/path/mysqldumpslow -s c -t 10 /database/mysql/slow-log
```

**2. 返回记录集最多的 10 条 SQL**

```bash
/path/mysqldumpslow -s r -t 10 /database/mysql/slow-log
```

**3. 查看执行时间最长的 LEFT JOIN 查询（Top10）**

```bash
/path/mysqldumpslow -s t -t 10 -g "left join" /database/mysql/slow-log
```

---

#### 总结

* **-s** 排序：`c` 次数、`t` 查询时间、`l` 锁时间、`r` 返回行数
* **-t** 数量：取前 N 条
* **-g** 关键词过滤（正则，不区分大小写）
* **mysqldumpslow** 是慢日志分析最常用的工具，统计结果自动去重、归类、整理，更便于排查问题。

---

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
