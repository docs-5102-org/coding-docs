---
title: MySQL Enum用法
category:
  - 数据库
tag:
  - MySQL
---

## MySQL ENUM 类型完整教程

### 什么是 ENUM 类型

ENUM 是一个字符串对象，其值通常选自一个允许值列表中，该列表在表创建时的列规格说明中被明确地列举。

ENUM 类型适用于存储固定的、预定义的字符串值，例如：状态（启用/禁用）、性别（男/女）、颜色（红/绿/蓝）等。

---

## 基本语法

### 创建 ENUM 字段

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    gender ENUM('male', 'female', 'other'),
    status ENUM('active', 'inactive', 'pending')
);
```

### 插入数据

```sql
-- 正常插入
INSERT INTO users (name, gender, status) 
VALUES ('Alice', 'female', 'active');

-- 插入其他枚举值
INSERT INTO users (name, gender, status) 
VALUES ('Bob', 'male', 'pending');
```

---

## ENUM 的索引机制

### 索引值规则

每个枚举值均有一个索引值，在列说明中列表值所允许的成员值被从 1 开始编号。

例如：`ENUM('one', 'two', 'three')`

| 值 | 索引值 |
|------|--------|
| `NULL` | `NULL` |
| `""` (空字符串/错误值) | `0` |
| `"one"` | `1` |
| `"two"` | `2` |
| `"three"` | `3` |

### 使用索引值

```sql
-- 创建测试表
CREATE TABLE test_enum (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('pending', 'processing', 'completed', 'failed')
);

-- 使用字符串插入
INSERT INTO test_enum (status) VALUES ('pending');

-- 使用索引值插入（1 对应 'pending'）
INSERT INTO test_enum (status) VALUES (1);

-- 查询索引值
SELECT status, status+0 AS index_value FROM test_enum;
```

**输出结果**：
```
+----------+-------------+
| status   | index_value |
+----------+-------------+
| pending  |           1 |
| pending  |           1 |
+----------+-------------+
```

---

## 特殊值处理

### NULL 值

```sql
-- 允许 NULL
CREATE TABLE test1 (
    flag ENUM('yes', 'no') NULL DEFAULT NULL
);

INSERT INTO test1 (flag) VALUES (NULL);
SELECT * FROM test1;  -- 返回 NULL
```

### 空字符串（错误值）

如果将一个无效值插入一个 ENUM（即，一个不在允许值列表中的字符串），空字符串将作为一个特殊的错误值被插入，索引值为 0。

```sql
CREATE TABLE test2 (
    status ENUM('active', 'inactive')
);

-- 插入无效值
INSERT INTO test2 (status) VALUES ('invalid');

-- 查询错误记录（索引值为 0）
SELECT * FROM test2 WHERE status = 0;
-- 或
SELECT * FROM test2 WHERE status = '';
```

---

## ENUM 的重要特性

### 1. 大小写不敏感（插入时）

```sql
CREATE TABLE test_case (
    color ENUM('Red', 'Green', 'Blue')
);

-- 以下插入都有效，但存储的值保持原定义的大小写
INSERT INTO test_case (color) VALUES ('red');    -- 存储为 'Red'
INSERT INTO test_case (color) VALUES ('RED');    -- 存储为 'Red'
INSERT INTO test_case (color) VALUES ('Red');    -- 存储为 'Red'

SELECT * FROM test_case;
-- 所有结果都显示为 'Red'
```

### 2. 自动去除尾部空格

```sql
-- MySQL 3.23.51+ 会自动删除枚举值尾部的空格
CREATE TABLE test_space (
    value ENUM('test ', 'demo ')  -- 尾部空格会被自动删除
);
```

### 3. 排序规则

ENUM 值依照列规格说明中的列表顺序进行排序，即依照索引号排序。

```sql
CREATE TABLE test_sort (
    priority ENUM('low', 'medium', 'high')
);

INSERT INTO test_sort VALUES ('high'), ('low'), ('medium');

-- 按索引顺序排序（不是字母顺序）
SELECT * FROM test_sort ORDER BY priority;
```

**结果**：
```
+----------+
| priority |
+----------+
| low      |  -- 索引 1
| medium   |  -- 索引 2
| high     |  -- 索引 3
+----------+
```

**按字母顺序排序**：
```sql
-- 使用 CONCAT 转换为字符串后排序
SELECT * FROM test_sort ORDER BY CONCAT(priority);
```

---

## 实际应用示例

### 示例 1：用户状态管理

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入数据
INSERT INTO users (username, email, status) 
VALUES 
    ('alice', 'alice@example.com', 'active'),
    ('bob', 'bob@example.com', 'inactive'),
    ('charlie', 'charlie@example.com', 'banned');

-- 查询活跃用户
SELECT * FROM users WHERE status = 'active';

-- 查询所有非活跃用户（使用索引）
SELECT * FROM users WHERE status IN (2, 3);  -- inactive, banned
```

### 示例 2：订单状态追踪

```sql
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(50) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') 
           DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 插入订单
INSERT INTO orders (order_no, status) VALUES ('ORD001', 'pending');

-- 更新订单状态
UPDATE orders SET status = 'paid' WHERE order_no = 'ORD001';
UPDATE orders SET status = 'shipped' WHERE order_no = 'ORD001';

-- 统计各状态订单数量
SELECT status, COUNT(*) as count 
FROM orders 
GROUP BY status;
```

---

## 查看 ENUM 定义

### 方法 1：SHOW COLUMNS

```sql
SHOW COLUMNS FROM users LIKE 'status';
```

**输出**：
```
+--------+------------------------------------------+------+-----+---------+
| Field  | Type                                     | Null | Key | Default |
+--------+------------------------------------------+------+-----+---------+
| status | enum('active','inactive','banned')       | YES  |     | active  |
+--------+------------------------------------------+------+-----+---------+
```

### 方法 2：DESCRIBE

```sql
DESCRIBE users status;
```

### 方法 3：INFORMATION_SCHEMA

```sql
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'status';
```

---

## 修改 ENUM 定义

### 添加新值

```sql
-- 在末尾添加
ALTER TABLE users 
MODIFY status ENUM('active', 'inactive', 'banned', 'suspended');

-- 在指定位置添加
ALTER TABLE users 
MODIFY status ENUM('active', 'pending', 'inactive', 'banned');
```

### 删除值（需谨慎）

```sql
-- 注意：删除值前确保没有数据使用该值
ALTER TABLE users 
MODIFY status ENUM('active', 'inactive');
-- 如果有记录的 status='banned'，它们会变为空字符串（索引0）
```

### 更改字段名和类型

```sql
ALTER TABLE users 
CHANGE status user_status ENUM('active', 'inactive', 'banned');
```

---

## ENUM 的限制与注意事项

### 1. 最大成员数

- ENUM 最多支持 **65,535** 个成员值

### 2. 存储空间

| 成员数量 | 存储字节 |
|----------|----------|
| 1-255 | 1 字节 |
| 256-65535 | 2 字节 |

### 3. 数值查询陷阱

```sql
CREATE TABLE test_trap (
    flag ENUM('0', '1', '2')
);

INSERT INTO test_trap VALUES ('1');

-- 危险：使用数字查询
SELECT * FROM test_trap WHERE flag = 1;  -- 匹配索引1，即 '0'
-- 正确：使用字符串查询
SELECT * FROM test_trap WHERE flag = '1';  -- 匹配值 '1'
```

### 4. 迁移问题

ENUM 的实现在不同数据库系统中差异较大，迁移到其他数据库（PostgreSQL、Oracle 等）时可能需要重新设计。

---

## 使用建议与最佳实践

### ✅ 适合使用 ENUM 的场景

1. **值集合固定且很少变化**
   ```sql
   gender ENUM('male', 'female', 'other')
   ```

2. **值的数量较少**（通常不超过 10-20 个）
   ```sql
   priority ENUM('low', 'medium', 'high')
   ```

3. **值有明确的业务含义**
   ```sql
   status ENUM('draft', 'published', 'archived')
   ```

### ❌ 不适合使用 ENUM 的场景

1. **值集合经常变化**
   - 例如：商品分类、地区列表
   - 建议使用单独的查找表

2. **纯数字枚举**
   ```sql
   -- 不推荐
   is_active ENUM('0', '1')
   
   -- 推荐
   is_active TINYINT(1) DEFAULT 1  -- 或 BOOLEAN
   ```

3. **需要国际化的值**
   - ENUM 存储的是固定字符串，难以实现多语言

### 推荐替代方案

#### 方案 1：使用 TINYINT + 注释

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    status TINYINT NOT NULL DEFAULT 1 COMMENT '1:active, 2:inactive, 3:banned'
);
```

**优点**：
- 存储效率高
- 易于迁移
- 修改值不影响数据

#### 方案 2：使用查找表

```sql
-- 状态表
CREATE TABLE user_statuses (
    id TINYINT PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

INSERT INTO user_statuses VALUES 
    (1, 'active', 'Active'),
    (2, 'inactive', 'Inactive'),
    (3, 'banned', 'Banned');

-- 用户表
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    status_id TINYINT,
    FOREIGN KEY (status_id) REFERENCES user_statuses(id)
);
```

**优点**：
- 灵活性最高
- 易于扩展和维护
- 支持国际化

---

## 总结对比

| 特性 | ENUM | TINYINT | 查找表 |
|------|------|---------|--------|
| 存储空间 | 1-2 字节 | 1 字节 | 1-4 字节 + 关联开销 |
| 可读性 | ★★★★★ | ★★☆☆☆ | ★★★★☆ |
| 灵活性 | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |
| 性能 | ★★★★★ | ★★★★★ | ★★★☆☆ |
| 维护成本 | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ |
| 迁移友好 | ★☆☆☆☆ | ★★★★★ | ★★★★☆ |

### 最终建议

- **小型项目 + 固定值集合**：ENUM 可以接受
- **中大型项目**：优先使用 TINYINT 或查找表
- **需要频繁变更**：必须使用查找表
- **已有 ENUM 字段**：查询时使用字符串值（加引号），避免使用索引值