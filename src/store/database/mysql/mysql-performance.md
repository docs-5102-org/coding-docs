---
title: SQL语句优化
category:
  - 数据库
tag:
  - MySQL
---

# MySQL SQL语句优化指南

## 目录

[[toc]]

---

## 索引优化策略

### 1. 合理建立索引
对查询进行优化，要尽量避免全表扫描，首先应考虑在 `WHERE` 及 `ORDER BY` 涉及的列上建立索引。

```sql
-- 在经常查询的字段上建立索引
CREATE INDEX idx_user_name ON users(name);
CREATE INDEX idx_order_date ON orders(order_date);
```

### 2. 复合索引的使用
在使用索引字段作为条件时，如果该索引是复合索引，那么必须使用到该索引中的第一个字段作为条件时才能保证系统使用该索引。

```sql
-- 创建复合索引
CREATE INDEX idx_user_name_age ON users(name, age);

-- 正确使用复合索引（遵循最左前缀原则）
SELECT * FROM users WHERE name = 'John' AND age = 25;
SELECT * FROM users WHERE name = 'John';

-- 错误使用（无法使用索引）
SELECT * FROM users WHERE age = 25;
```

### 3. 索引数量控制
索引并不是越多越好，一个表的索引数最好不要超过6个。索引提高了 `SELECT` 的效率，但同时也降低了 `INSERT` 及 `UPDATE` 的效率。

---

## WHERE子句优化

### 1. 避免NULL值判断
应尽量避免在 `WHERE` 子句中对字段进行 `NULL` 值判断，否则将导致引擎放弃使用索引而进行全表扫描。

```sql
-- 避免使用
SELECT id FROM t WHERE num IS NULL;

-- 优化方案：设置默认值0，然后查询
SELECT id FROM t WHERE num = 0;
```

**建议**：最好不要给数据库留 `NULL`，尽可能的使用 `NOT NULL` 填充数据库。

### 2. 避免使用不等于操作符
应尽量避免在 `WHERE` 子句中使用 `!=` 或 `<>` 操作符，否则将引擎放弃使用索引而进行全表扫描。

```sql
-- 避免使用
SELECT * FROM users WHERE status != 'inactive';

-- 优化方案：使用IN或其他条件
SELECT * FROM users WHERE status IN ('active', 'pending');
```

### 3. 慎用OR连接条件
如果一个字段有索引，一个字段没有索引，将导致引擎放弃使用索引而进行全表扫描。

```sql
-- 避免使用
SELECT id FROM t WHERE num = 10 OR name = 'admin';

-- 优化方案：使用UNION ALL
SELECT id FROM t WHERE num = 10
UNION ALL
SELECT id FROM t WHERE name = 'admin';
```

### 4. 优化IN和NOT IN
`IN` 和 `NOT IN` 也要慎用，否则会导致全表扫描。

```sql
-- 对于连续数值，使用BETWEEN替代IN
-- 避免使用
SELECT id FROM t WHERE num IN (1, 2, 3);

-- 优化方案
SELECT id FROM t WHERE num BETWEEN 1 AND 3;

-- 使用EXISTS替代IN
-- 避免使用
SELECT num FROM a WHERE num IN (SELECT num FROM b);

-- 优化方案
SELECT num FROM a WHERE EXISTS (SELECT 1 FROM b WHERE num = a.num);
```

### 5. 避免字段表达式操作
应尽量避免在 `WHERE` 子句中对字段进行表达式操作。

```sql
-- 避免使用
SELECT id FROM t WHERE num / 2 = 100;

-- 优化方案
SELECT id FROM t WHERE num = 100 * 2;
```

### 6. 避免字段函数操作
应尽量避免在 `WHERE` 子句中对字段进行函数操作。

```sql
-- 避免使用
SELECT id FROM t WHERE SUBSTRING(name, 1, 3) = 'abc';
SELECT id FROM t WHERE DATEDIFF(day, create_date, '2005-11-30') = 0;

-- 优化方案
SELECT id FROM t WHERE name LIKE 'abc%';
SELECT id FROM t WHERE create_date >= '2005-11-30' 
                  AND create_date < '2005-12-01';
```

---

## 查询语句优化

### 1. 避免SELECT *
任何地方都不要使用 `SELECT * FROM t`，用具体的字段列表代替 `*`，不要返回用不到的任何字段。

```sql
-- 避免使用
SELECT * FROM users;

-- 优化方案
SELECT id, name, email FROM users;
```

### 2. 优化LIKE查询
下面的查询将导致全表扫描，若要提高效率，可以考虑全文检索。

```sql
-- 避免使用（会导致全表扫描）
SELECT id FROM t WHERE name LIKE '%abc%';

-- 优化方案（如果可能，使用前缀匹配）
SELECT id FROM t WHERE name LIKE 'abc%';
```

### 3. 避免无条件COUNT
`SELECT COUNT(*) FROM table` 这样不带任何条件的 count 会引起全表扫描。

```sql
-- 避免使用
SELECT COUNT(*) FROM users;

-- 如果需要统计，添加合适的WHERE条件
SELECT COUNT(*) FROM users WHERE status = 'active';
```

---

## 表结构设计优化

### 1. 数据类型选择
尽量使用数字型字段，若只含数值信息的字段尽量不要设计为字符型，这会降低查询和连接的性能。

```sql
-- 优先使用数字类型
CREATE TABLE orders (
    id INT PRIMARY KEY,
    user_id INT,           -- 而不是VARCHAR
    amount DECIMAL(10,2),  -- 而不是VARCHAR
    status TINYINT         -- 而不是VARCHAR
);
```

### 2. 字符类型选择
尽可能的使用 `VARCHAR/NVARCHAR` 代替 `CHAR/NCHAR`，因为变长字段存储空间小，可以节省存储空间。

```sql
-- 推荐使用
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(100),     -- 而不是CHAR(100)
    email VARCHAR(255)     -- 而不是CHAR(255)
);
```

### 3. 避免更新聚簇索引
应尽可能的避免更新聚簇索引数据列，因为聚簇索引数据列的顺序就是表记录的物理存储顺序。

---

## 存储过程与临时表优化

### 1. 临时表使用建议
- 尽量使用表变量来代替临时表
- 避免频繁创建和删除临时表
- 在存储过程的最后务必将所有的临时表显式删除

```sql
-- 临时表的正确清理方式
TRUNCATE TABLE #temp_table;
DROP TABLE #temp_table;
```

### 2. 游标使用建议
- 尽量避免使用游标，因为游标的效率较差
- 如果游标操作的数据超过1万行，应该考虑改写
- 对小型数据集使用 `FAST_FORWARD` 游标

### 3. 存储过程优化
```sql
-- 在存储过程开始和结束设置
SET NOCOUNT ON;
-- 存储过程逻辑
SET NOCOUNT OFF;
```

---

## 大数据量操作优化

### 1. UPDATE语句优化
如果只更改1、2个字段，不要 `UPDATE` 全部字段，否则频繁调用会引起明显的性能消耗。

```sql
-- 避免使用
UPDATE users SET name = 'John', email = 'john@example.com', 
                 phone = '123456', address = 'Address'... 
WHERE id = 1;

-- 优化方案：只更新需要的字段
UPDATE users SET email = 'john@example.com' WHERE id = 1;
```

### 2. JOIN操作优化
对于多张大数据量的表 `JOIN`，要先分页再 `JOIN`，否则逻辑读会很高，性能很差。

```sql
-- 先分页再JOIN
SELECT u.name, o.amount 
FROM (SELECT * FROM users LIMIT 100) u
JOIN orders o ON u.id = o.user_id;
```

### 3. 批量操作优化
尽量避免大事务操作，提高系统并发能力。

---

## 实际案例分析

### 拆分大的 DELETE 或 INSERT 语句

如果你需要执行一个大的 `DELETE` 或 `INSERT` 查询，需要非常小心，要避免操作让整个网站停止响应。

#### 问题分析
- 大的DELETE或INSERT操作会锁表
- 表锁住了，其他操作都进不来
- 会积累大量的访问进程/线程和数据库连接
- 可能导致服务器崩溃

#### 解决方案：批量提交
使用 `LIMIT` 条件分批处理，下面是一个示例：

```sql
-- 分批删除示例（伪代码）
WHILE (1) {
    -- 每次只处理1000条
    DELETE FROM logs WHERE log_date <= '2012-11-01' LIMIT 1000;
    
    -- 如果没有affected rows，说明删除完成
    IF (affected_rows == 0) {
        BREAK; -- 退出循环
    }
    
    -- 每次暂停一段时间，释放表让其他进程访问
    SLEEP(0.05); -- 暂停50毫秒
}
```

#### MySQL实际实现
```sql
-- 创建存储过程实现批量删除
DELIMITER //
CREATE PROCEDURE BatchDelete()
BEGIN
    DECLARE done INT DEFAULT 0;
    
    WHILE done = 0 DO
        DELETE FROM logs WHERE log_date <= '2012-11-01' LIMIT 1000;
        
        IF ROW_COUNT() = 0 THEN
            SET done = 1;
        ELSE
            -- 暂停50毫秒，让其他操作有机会执行
            SELECT SLEEP(0.05);
        END IF;
    END WHILE;
END//
DELIMITER ;

-- 调用存储过程
CALL BatchDelete();
```

---

## 总结

SQL优化是一个系统性工程，需要从以下几个方面综合考虑：

1. **索引策略**：合理建立索引，控制索引数量
2. **查询优化**：优化WHERE条件，避免全表扫描
3. **表设计**：选择合适的数据类型，合理设计表结构
4. **批量操作**：大数据量操作要分批进行
5. **监控调优**：定期监控慢查询，持续优化

记住：**过早的优化是万恶之源，但合理的优化是必需的**。在实际应用中，应该先保证功能正确性，然后根据性能瓶颈进行针对性优化。