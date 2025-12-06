---
title: MySQL 联合索引指南
category:
  - 数据库
tag:
  - MySQL
---

# MySQL复合(联合)索引详解与最佳实践

## 一、复合索引的基本概念

复合索引（联合索引）是指在多个列上创建的索引。MySQL会按照索引定义时的列顺序来组织数据。

```sql
-- 创建复合索引示例
CREATE INDEX idx_col1_col2_col3 ON table1(col1, col2, col3);
```

## 二、最左前缀匹配原则

**核心规则**：复合索引遵循"最左前缀"原则，查询条件必须从索引的最左列开始，并且不能跳过中间列。

### 索引使用情况对比

假设有索引：`INDEX(col1, col2, col3)`

```sql
-- ✅ 会使用索引（完整匹配）
SELECT * FROM table1 WHERE col1='A' AND col2='B' AND col3='D';

-- ✅ 会使用索引（最左前缀）
SELECT * FROM table1 WHERE col1='A';
SELECT * FROM table1 WHERE col1='A' AND col2='B';

-- ✅ 会使用索引（条件顺序可以不同，优化器会调整）
SELECT * FROM table1 WHERE col2='B' AND col1='A';
SELECT * FROM table1 WHERE col3='D' AND col1='A' AND col2='B';

-- ❌ 不会使用索引（缺少最左列col1）
SELECT * FROM table1 WHERE col2='B';
SELECT * FROM table1 WHERE col3='D';
SELECT * FROM table1 WHERE col2='B' AND col3='D';

-- ⚠️ 部分使用索引（只使用col1）
SELECT * FROM table1 WHERE col1='A' AND col3='D';
```

### 原理说明

复合索引的数据结构类似于：
```
(col1='A', col2='B', col3='C')
(col1='A', col2='B', col3='D')
(col1='A', col2='C', col3='E')
(col1='B', col2='A', col3='F')
```

数据先按col1排序，col1相同时按col2排序，col2相同时按col3排序。因此：
- 缺少col1时，整个索引无序，无法使用
- 只有col1时，可以快速定位
- 跳过col2直接用col3时，col3是无序的

## 三、何时使用复合索引

### 适合场景

```sql
-- 1. 多条件联合查询
-- 用户经常按城市、年龄、性别组合查询
CREATE INDEX idx_city_age_gender ON users(city, age, gender);

-- 2. 排序优化
-- 经常需要按创建时间和状态排序
CREATE INDEX idx_status_created ON orders(status, created_at);
SELECT * FROM orders WHERE status=1 ORDER BY created_at DESC;

-- 3. 覆盖索引（避免回表）
CREATE INDEX idx_user_info ON users(user_id, name, email);
SELECT name, email FROM users WHERE user_id=100; -- 无需回表
```

### 索引设计建议

```sql
-- ❌ 不推荐：过多索引
CREATE INDEX idx1 ON table1(col1);
CREATE INDEX idx2 ON table1(col2);
CREATE INDEX idx3 ON table1(col3);
CREATE INDEX idx4 ON table1(col1, col2);
CREATE INDEX idx5 ON table1(col1, col2, col3);

-- ✅ 推荐：精简有效
CREATE INDEX idx_col1_col2_col3 ON table1(col1, col2, col3);
-- 这一个索引可以支持：
-- WHERE col1=?
-- WHERE col1=? AND col2=?
-- WHERE col1=? AND col2=? AND col3=?
```

## 四、复合索引与单列索引的选择

### 替代规则

```sql
-- 场景：经常执行 WHERE col1='A' AND col2='B'

-- 方案1：两个单列索引（不推荐）
CREATE INDEX idx_col1 ON table1(col1);
CREATE INDEX idx_col2 ON table1(col2);
-- MySQL通常只会使用其中一个索引

-- 方案2：复合索引（推荐）
CREATE INDEX idx_col1_col2 ON table1(col1, col2);
-- 同时满足：
-- - WHERE col1=? AND col2=?
-- - WHERE col1=?
-- 可以移除单独的 idx_col1
```

### 何时保留单列索引

```sql
-- 如果有以下独立查询需求：
SELECT * FROM table1 WHERE col2='B';  -- 需要单独的col2索引
SELECT * FROM table1 WHERE col1='A' AND col2='B';  -- 需要复合索引

-- 则需要保留：
CREATE INDEX idx_col2 ON table1(col2);           -- 单列索引
CREATE INDEX idx_col1_col2 ON table1(col1, col2); -- 复合索引
```

## 五、实战案例

### 案例：电商订单查询优化

```sql
-- 表结构
CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT,
    status TINYINT,
    created_at DATETIME,
    total_amount DECIMAL(10,2)
);

-- 常见查询
-- Q1: 查询用户的所有订单
SELECT * FROM orders WHERE user_id=123;

-- Q2: 查询用户指定状态的订单
SELECT * FROM orders WHERE user_id=123 AND status=1;

-- Q3: 查询用户订单并按时间排序
SELECT * FROM orders WHERE user_id=123 ORDER BY created_at DESC;

-- 索引设计
CREATE INDEX idx_user_status_time ON orders(user_id, status, created_at);

-- 这个索引可以优化所有三个查询！
```

### 性能对比

```sql
-- 使用 EXPLAIN 分析
EXPLAIN SELECT * FROM orders 
WHERE user_id=123 AND status=1 
ORDER BY created_at DESC;

-- 有索引：type=ref, rows=10
-- 无索引：type=ALL, rows=100000
```

## 六、注意事项

1. **索引不是越多越好**：每个索引都会增加写操作（INSERT/UPDATE/DELETE）的开销
2. **选择性高的列放前面**：区分度大的列作为索引前导列效果更好
3. **避免冗余索引**：`INDEX(a,b,c)` 已包含 `INDEX(a)` 和 `INDEX(a,b)` 的功能
4. **注意范围查询**：`WHERE col1>10 AND col2=20` 中，col2无法使用索引

```sql
-- 范围查询示例
CREATE INDEX idx_abc ON t(a, b, c);

-- ✅ 使用完整索引
WHERE a=1 AND b=2 AND c=3;

-- ⚠️ 只使用a、b
WHERE a=1 AND b>2 AND c=3;  -- b使用范围后，c失效
```