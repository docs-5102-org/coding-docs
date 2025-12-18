---
title: MySQL InnoDB 如何通过 MVCC + Next-Key Lock 解决幻读
category:
  - 数据库
tag:
  - MySQL
---

# MySQL InnoDB 如何通过 MVCC + Next-Key Lock 解决幻读

## 什么是幻读

幻读（Phantom Read）是数据库并发控制中的一个经典问题，指的是**在同一个事务中，多次执行相同的范围查询，返回的结果集不同，出现了之前不存在的"幽灵"记录**。

### 典型的幻读场景

假设一个用户表初始有 `id=1, id=5, id=10` 三条记录：

```sql
-- 事务 A 开始
BEGIN;
SELECT * FROM user WHERE id > 5;  
-- 返回：id=10（1条记录）

-- 此时事务 B 插入新记录并提交
BEGIN;
INSERT INTO user (id, name) VALUES (8, 'Bob');
COMMIT;

-- 事务 A 再次查询
SELECT * FROM user WHERE id > 5;  
-- 在 READ COMMITTED 隔离级别下：返回 id=8, id=10（2条记录）
-- 出现了之前不存在的记录 id=8，这就是幻读
```

## 幻读 vs 不可重复读

很多人容易混淆这两个概念，它们的关键区别在于：

| 对比维度 | 不可重复读 | 幻读 |
|---------|-----------|------|
| **针对对象** | 已存在的记录被修改 | 新增或删除的记录 |
| **查询类型** | 精确查询（如 `WHERE id=1`） | 范围查询（如 `WHERE id>5`） |
| **现象** | 同一条记录前后值不同 | 同一范围前后记录数不同 |
| **示例** | 第一次 age=20，第二次 age=25 | 第一次1条记录，第二次3条记录 |

简单来说：**不可重复读是记录内容变了，幻读是记录数量变了**。

## MySQL InnoDB 的解决方案

MySQL InnoDB 存储引擎在 REPEATABLE READ（可重复读）隔离级别下，通过两种机制基本解决了幻读问题：

### 1. MVCC（多版本并发控制）

MVCC 用于处理**快照读**（普通的 SELECT 语句），通过保存数据的历史版本来实现一致性读取。

#### 工作原理

- 每个事务开始时创建一个 ReadView（读视图）
- 所有快照读都基于这个 ReadView 读取数据
- 即使其他事务插入了新记录，当前事务看到的仍是事务开始时的数据快照

#### 示例：快照读避免幻读

```sql
-- 事务 A
BEGIN;
SELECT * FROM user WHERE age > 20;  -- 快照读，返回3条记录

-- 事务 B 插入新记录并提交
BEGIN;
INSERT INTO user (id, age, name) VALUES (100, 25, 'Charlie');
COMMIT;

-- 事务 A 再次查询
SELECT * FROM user WHERE age > 20;  -- 快照读，仍返回3条记录
-- ✅ 没有幻读！MVCC 保证了一致性

COMMIT;
```

**关键点**：纯快照读场景下，MVCC 完全避免了幻读。

### 2. Next-Key Lock（临键锁/邻键锁）

Next-Key Lock 用于处理**当前读**（加锁的 SELECT 或 DML 语句），通过锁定范围来防止其他事务插入数据。

#### 什么是当前读

以下操作都是当前读，会读取记录的最新版本并加锁：

- `SELECT ... FOR UPDATE`
- `SELECT ... LOCK IN SHARE MODE`
- `UPDATE`
- `DELETE`
- `INSERT`

#### Next-Key Lock 的组成

Next-Key Lock = **Record Lock（记录锁）** + **Gap Lock（间隙锁）**

- **Record Lock**：锁定索引记录本身
- **Gap Lock**：锁定索引记录之间的间隙
- **Next-Key Lock**：锁定记录及其前面的间隙


#### 锁定范围示例

假设表中有索引值：`1, 5, 10, 15`

执行：`SELECT * FROM user WHERE id >= 10 FOR UPDATE;`

**加锁范围解析**：

```
第一个 Next-Key Lock: (5, 10]
  - 锁住记录 id=10
  - 锁住间隙 (5, 10)
  
第二个 Next-Key Lock: (10, 15]
  - 锁住记录 id=15
  - 锁住间隙 (10, 15)
  
Gap Lock: (15, +∞)
  - 只锁间隙，因为后面没有记录了
```

**实际效果 - 哪些操作会被阻塞**：

| 操作 | 是否阻塞 | 原因 |
|------|---------|------|
| `INSERT ... VALUES (6, ...)` | ✅ 阻塞 | 6 在间隙 (5,10) 内 |
| `INSERT ... VALUES (12, ...)` | ✅ 阻塞 | 12 在间隙 (10,15) 内 |
| `INSERT ... VALUES (20, ...)` | ✅ 阻塞 | 20 在间隙 (15,+∞) 内 |
| `UPDATE/DELETE id=10` | ✅ 阻塞 | 记录被锁 |
| `UPDATE/DELETE id=15` | ✅ 阻塞 | 记录被锁 |
| `INSERT ... VALUES (4, ...)` | ❌ 成功 | 4 不在锁定范围 |
| `UPDATE/DELETE id=5` | ❌ 成功 | id=5 记录未被锁 |

**核心理解**：
- Next-Key Lock 范围是 `(前一个值, 当前值]`，这是**左开右闭**区间
- 锁的是**索引项**，不是整张表
- 间隙锁防止在范围内插入新记录
- 记录锁防止修改/删除已有记录

#### 示例：Next-Key Lock 防止幻读

```sql
-- 表结构和数据
CREATE TABLE user (
    id INT PRIMARY KEY,
    age INT,
    INDEX idx_age(age)
);
-- 现有数据：age = 10, 20, 30

-- 事务 A
BEGIN;
SELECT * FROM user WHERE age >= 20 FOR UPDATE;  
-- 加锁范围：(10, 20], (20, 30], (30, +∞)

-- 事务 B 尝试插入
INSERT INTO user VALUES (100, 25, 'Bob');  
-- ❌ 被阻塞！因为 age=25 落在间隙 (20, 30) 中

INSERT INTO user VALUES (101, 35, 'Alice');
-- ✅ 可以插入！因为 age=35 不在锁定范围内

-- 事务 A 再次查询
SELECT * FROM user WHERE age >= 20 FOR UPDATE;
-- 结果一致，没有幻读

COMMIT;
```

**关键点**：Next-Key Lock 通过锁定范围，物理上阻止了其他事务在范围内插入数据。

## MySQL 可重复读下仍可能出现幻读的情况

虽然 InnoDB 基本解决了幻读，但在特定场景下仍可能出现：

### 场景：混用快照读和当前读

```sql
-- 事务 A
BEGIN;

-- 第一次：快照读
SELECT * FROM user WHERE age > 20;  
-- 返回：3条记录（基于 MVCC）

-- 事务 B 插入数据并提交
BEGIN;
INSERT INTO user (id, age, name) VALUES (100, 25, 'Charlie');
COMMIT;

-- 第二次：当前读（加锁）
SELECT * FROM user WHERE age > 20 FOR UPDATE;  
-- 返回：4条记录（读取最新数据，不走 MVCC）
-- ⚠️ 出现幻读！

-- 或者执行更新
UPDATE user SET status = 1 WHERE age > 20;
-- 影响了4行，也是幻读现象

COMMIT;
```

**原因分析**：

1. 快照读使用 MVCC，读取事务开始时的数据快照
2. 当前读不走 MVCC，直接读取最新提交的数据
3. 两种读取方式混用，导致看到不一致的结果

### 如何避免这种幻读

```sql
-- ✅ 方案1：使用行级锁（Next-Key Lock）- 悲观锁机制
BEGIN;
SELECT * FROM user WHERE age > 20 FOR UPDATE;  
-- 当前读：立即加 Next-Key Lock，物理阻止其他事务插入
-- 机制：通过锁定索引范围，其他事务的 INSERT 会被阻塞

SELECT * FROM user WHERE age > 20 FOR UPDATE;
-- 结果一致，因为没有其他事务能插入数据

COMMIT;

-- ✅ 方案2：使用 MVCC 快照读 - 乐观并发控制
BEGIN;
SELECT * FROM user WHERE age > 20;  
-- 快照读：基于事务开始时的 ReadView
-- 机制：读取历史版本数据，不阻塞其他事务的 INSERT

-- 此时其他事务可以正常插入数据，但当前事务看不到
SELECT * FROM user WHERE age > 20;
-- 结果一致，因为都基于同一个 ReadView（事务开始时的快照）

COMMIT;
```

## 不同读取方式的对比

| 操作类型 | 使用 MVCC | 是否加锁 | 加锁类型 | 是否幻读 |
|---------|----------|---------|---------|---------|
| `SELECT` | ✓ 快照读 | ✗ | - | ✗ |
| `SELECT ... FOR UPDATE` | ✗ 当前读 | ✓ | Next-Key Lock | ✗ |
| `SELECT ... LOCK IN SHARE MODE` | ✗ 当前读 | ✓ | Next-Key Lock | ✗ |
| `UPDATE` | ✗ 当前读 | ✓ | Next-Key Lock | ✗ |
| `DELETE` | ✗ 当前读 | ✓ | Next-Key Lock | ✗ |

## 最佳实践建议

### 1. 根据业务需求选择读取方式

```sql
-- 场景1：仅查询展示，不需要强一致性
SELECT * FROM user WHERE age > 20;  
-- 使用快照读，性能好

-- 场景2：查询后要修改，需要强一致性
SELECT * FROM user WHERE age > 20 FOR UPDATE;  
-- 使用当前读 + 加锁，避免并发问题
```

### 2. 避免混用快照读和当前读

```sql
-- ❌ 不推荐：混用可能导致不一致
BEGIN;
SELECT * FROM user WHERE age > 20;           -- 快照读
-- ... 其他操作
SELECT * FROM user WHERE age > 20 FOR UPDATE; -- 当前读
COMMIT;

-- ✅ 推荐：保持一致的读取方式
BEGIN;
SELECT * FROM user WHERE age > 20 FOR UPDATE; -- 统一使用当前读
-- ... 其他操作
SELECT * FROM user WHERE age > 20 FOR UPDATE;
COMMIT;
```

### 3. 理解锁的范围

在使用当前读时，要注意 Next-Key Lock 的锁定范围：

```sql
-- 等值查询：通常只锁定单条记录
SELECT * FROM user WHERE id = 10 FOR UPDATE;

-- 范围查询：锁定整个范围
SELECT * FROM user WHERE id > 10 FOR UPDATE;  
-- 锁定范围更大，可能影响并发性能
```

## 总结

MySQL InnoDB 在 REPEATABLE READ 隔离级别下通过两种机制基本解决了幻读问题：

1. **MVCC（快照读）**
   - 为每个事务创建数据快照
   - 天然避免幻读
   - 性能好，无锁开销

2. **Next-Key Lock（当前读）**
   - 锁定记录 + 间隙
   - 物理阻止插入
   - 保证强一致性

**核心要点**：

- 纯快照读或纯当前读场景下，InnoDB 完全避免幻读
- 混用快照读和当前读时，可能出现幻读现象
- 根据业务需求选择合适的读取方式，避免不必要的锁竞争
- 理解 MVCC 和 Next-Key Lock 的工作原理，有助于设计更好的并发控制策略

这种"MVCC + Next-Key Lock"的组合设计，在保证数据一致性的同时，也兼顾了并发性能，是 MySQL InnoDB 存储引擎的一大亮点。