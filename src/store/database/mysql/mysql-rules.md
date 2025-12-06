---
title: MySQL 高性能优化规范指南
category:
  - 数据库
tag:
  - MySQL
---

# MySQL 高性能优化规范指南

## 📋 目录

1. [命名规范](#命名规范)
2. [基本设计规范](#基本设计规范)
3. [字段设计规范](#字段设计规范)
4. [索引设计规范](#索引设计规范)
5. [SQL 开发规范](#sql-开发规范)
6. [数据库操作规范](#数据库操作规范)

---

## 命名规范

### 基本原则

**必须遵守**：
- 所有数据库对象名称使用**小写字母**，单词间用**下划线**分割
- 禁止使用 MySQL 保留关键字（使用时需用单引号括起来）
- 命名要**见名识意**，长度不超过 **32 个字符**

**特殊前缀**：
- 临时表：`tmp_表名_日期` （如：`tmp_users_20250101`）
- 备份表：`bak_表名_时间戳` （如：`bak_orders_20250101_143000`）

**一致性原则**：
- 相同数据的列名和列类型必须保持一致，避免关联查询时的隐式类型转换导致索引失效

---

## 基本设计规范

### 1. 存储引擎选择

**必须使用 InnoDB 存储引擎**

✅ 优势：
- 支持事务（ACID）
- 支持行级锁，并发性能更好
- 具备更好的崩溃恢复能力

### 2. 字符集设置

**统一使用 UTF8 字符集**

```sql
-- 建表示例
CREATE TABLE users (
    id INT PRIMARY KEY,
    name VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';
```

💡 注意：
- UTF8 兼容性最好，避免乱码问题
- 需要存储 emoji 表情时使用 `utf8mb4`
- 不同字符集比较会造成索引失效

### 3. 注释规范

**所有表和字段都必须添加注释**

```sql
CREATE TABLE orders (
    order_id BIGINT PRIMARY KEY COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    amount DECIMAL(10,2) COMMENT '订单金额'
) COMMENT='订单表';
```

### 4. 表数据量控制

**建议单表数据量控制在 500 万以内**

⚠️ 超出后的问题：
- 修改表结构耗时长
- 备份和恢复困难
- 查询性能下降

🔧 解决方案：
- **历史数据归档**（适用于日志数据）
- **分库分表**（适用于业务数据）

### 5. 分区表使用

**谨慎使用 MySQL 分区表**

❌ 缺点：
- 跨分区查询效率可能更低
- 分区键选择困难

✅ 建议：采用**物理分表**方式管理大数据

### 6. 冷热数据分离

**减小表的宽度，做好冷热分离**

原因：
- MySQL 限制：每表最多 4096 列，每行数据不超过 65535 字节
- 减少磁盘 IO，提高缓存命中率
- 避免读入无用的冷数据

示例：
```sql
-- 热数据表（高频访问）
CREATE TABLE user_base (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(50),
    mobile VARCHAR(11),
    status TINYINT
) COMMENT='用户基础信息表';

-- 冷数据表（低频访问）
CREATE TABLE user_profile (
    user_id BIGINT PRIMARY KEY,
    address TEXT,
    description TEXT,
    hobby TEXT
) COMMENT='用户详细资料表';
```

### 7. 禁止事项

❌ **严禁**：
- 建立预留字段（难以见名识意，类型不明确）
- 存储图片、文件等大二进制数据（应存储文件路径）
- 在线上环境做压力测试
- 从开发/测试环境直接连接生产数据库

---

## 字段设计规范

### 1. 数据类型选择原则

**优先选择最小的数据类型**

#### IP 地址存储

```sql
-- ❌ 错误方式
ip VARCHAR(15)

-- ✅ 正确方式
ip INT UNSIGNED

-- 使用方法
INSERT INTO table VALUES (INET_ATON('192.168.1.1'));
SELECT INET_NTOA(ip) FROM table;
```

#### 整数类型

**非负数据使用无符号类型**

| 类型 | 有符号范围 | 无符号范围 |
|------|-----------|-----------|
| TINYINT | -128 ~ 127 | 0 ~ 255 |
| INT | -2,147,483,648 ~ 2,147,483,647 | 0 ~ 4,294,967,295 |
| BIGINT | -2^63 ~ 2^63-1 | 0 ~ 2^64-1 |

```sql
-- 自增 ID、整型 IP 等使用无符号
user_id BIGINT UNSIGNED AUTO_INCREMENT
```

### 2. 字符串类型

**VARCHAR(N) 中的 N 表示字符数**

```sql
-- UTF8 存储 255 个汉字
VARCHAR(255)  -- = 765 字节 (255 × 3)
```

💡 建议：
- 根据实际需求设置长度，避免浪费内存
- 手机号：`VARCHAR(11)`
- 姓名：`VARCHAR(50)`
- 邮箱：`VARCHAR(100)`

### 3. TEXT/BLOB 类型

**避免使用 TEXT、BLOB 数据类型**

❌ 问题：
- 无法使用内存临时表，必须使用磁盘临时表
- 需要进行二次查询，性能差
- 只能使用前缀索引
- 不能有默认值

✅ 解决方案：
```sql
-- 将大字段分离到扩展表
CREATE TABLE article (
    id BIGINT PRIMARY KEY,
    title VARCHAR(200),
    summary VARCHAR(500),
    author VARCHAR(50)
) COMMENT='文章主表';

CREATE TABLE article_content (
    article_id BIGINT PRIMARY KEY,
    content TEXT
) COMMENT='文章内容扩展表';
```

### 4. ENUM 类型

**避免使用 ENUM 类型**

❌ 缺点：
- 修改 ENUM 值需要 ALTER 语句
- ORDER BY 效率低
- 禁止使用数值作为枚举值

✅ 替代方案：使用 TINYINT + 注释
```sql
status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待审核, 1-已通过, 2-已拒绝'
```

### 5. NULL 值处理

**尽可能把所有列定义为 NOT NULL**

原因：
- NULL 列需要额外空间存储
- 比较和计算需要特殊处理
- 影响索引效率

```sql
-- ✅ 推荐
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL DEFAULT '',
    age INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 6. 时间类型

**使用 TIMESTAMP 或 DATETIME**

| 类型 | 存储空间 | 范围 | 推荐场景 |
|------|---------|------|---------|
| TIMESTAMP | 4 字节 | 1970-01-01 ~ 2038-01-19 | 近期时间 |
| DATETIME | 8 字节 | 1000-01-01 ~ 9999-12-31 | 远期时间 |

```sql
-- ❌ 不推荐
created_at VARCHAR(20)  -- '2025-01-01 12:00:00'

-- ✅ 推荐
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

### 7. 金额字段

**必须使用 DECIMAL 类型**

```sql
-- ❌ 错误：浮点数不精确
price FLOAT

-- ✅ 正确：精确存储
price DECIMAL(10,2) COMMENT '价格，单位：元'
```

💡 说明：
- `DECIMAL(10,2)`：总共 10 位，小数点后 2 位
- 可存储比 BIGINT 更大的整数
- 计算不会丢失精度

---

## 索引设计规范

### 1. 索引数量限制

**建议单表索引不超过 5 个**

⚠️ 索引并非越多越好：
- 增加查询效率，但降低写入和更新效率
- 增加优化器生成执行计划的时间
- 占用更多存储空间

### 2. 索引建立原则

**❌ 禁止给每列都建单独索引**

- MySQL 5.6 之前：一条 SQL 只能使用一个索引
- MySQL 5.6 之后：虽然支持索引合并，但远不如联合索引高效

### 3. 主键设计

**每个 InnoDB 表必须有主键**

InnoDB 是**索引组织表**，按主键顺序组织数据。

✅ **推荐做法**：
```sql
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

❌ **不推荐做法**：
- 使用频繁更新的列作为主键
- 使用多列联合主键
- 使用 UUID、MD5、HASH、字符串（无序增长）

### 4. 常见索引场景

**应该建立索引的列**：
- WHERE 子句中的列
- ORDER BY、GROUP BY、DISTINCT 中的字段
- 多表 JOIN 的关联列

💡 **建议**：将这些字段建立**联合索引**，效果更好

```sql
-- 查询示例
SELECT * FROM orders 
WHERE user_id = 123 AND status = 1 
ORDER BY created_at DESC;

-- 推荐索引
CREATE INDEX idx_user_status_time ON orders(user_id, status, created_at);
```

### 5. 联合索引顺序

**遵循最左前缀原则**

排序规则：
1. **区分度最高**的列放最左侧（区分度 = 不同值数量 / 总行数）
2. **字段长度小**的列放最左侧（一页存储更多数据）
3. **使用最频繁**的列放最左侧（减少索引数量）

```sql
-- 假设查询场景
-- 区分度：user_id (高) > status (低)
-- 长度：status (1字节) < user_id (8字节)
-- 频率：都很高

-- 推荐顺序
CREATE INDEX idx_user_status ON orders(user_id, status);
```

### 6. 避免冗余索引

**❌ 重复索引**：
```sql
PRIMARY KEY(id)
UNIQUE INDEX(id)
INDEX(id)
```

**❌ 冗余索引**：
```sql
INDEX(a, b, c)  -- 已包含下面的索引
INDEX(a, b)     -- 冗余
INDEX(a)        -- 冗余
```

### 7. 覆盖索引

**优先考虑覆盖索引**

覆盖索引：索引包含查询所需的所有字段

✅ 优势：
- 避免回表查询（二次查询）
- 将随机 IO 转为顺序 IO

```sql
-- 查询
SELECT user_id, status, created_at FROM orders WHERE user_id = 123;

-- 覆盖索引
CREATE INDEX idx_cover ON orders(user_id, status, created_at);
-- 索引已包含所有查询字段，无需回表
```

### 8. 外键约束

**尽量避免使用外键约束**

✅ 推荐做法：
- 不使用 `FOREIGN KEY` 约束
- 但必须在关联列上建立索引
- 数据完整性在**业务层**实现

❌ 外键缺点：
- 影响父表和子表的写操作
- 降低并发性能
- 增加系统复杂度

---

## SQL 开发规范

### 1. 预编译语句

**建议使用预编译语句**

```java
// ✅ 推荐：预编译
PreparedStatement pstmt = conn.prepareStatement(
    "SELECT * FROM users WHERE id = ?"
);
pstmt.setLong(1, userId);

// ❌ 不推荐：拼接 SQL
String sql = "SELECT * FROM users WHERE id = " + userId;
```

优势：
- 减少 SQL 编译时间
- 防止 SQL 注入
- 提高处理效率

### 2. 避免隐式转换

**保持数据类型一致**

```sql
-- ❌ 错误：id 是 INT 类型，传字符串会导致索引失效
SELECT name FROM users WHERE id = '123';

-- ✅ 正确
SELECT name FROM users WHERE id = 123;
```

### 3. 索引使用技巧

**避免索引失效**

```sql
-- ❌ 双 % 号：索引失效
WHERE name LIKE '%张%'

-- ✅ 后置 %：可以使用索引
WHERE name LIKE '张%'

-- ❌ 函数操作：索引失效
WHERE DATE(created_at) = '2025-01-01'

-- ✅ 范围查询：使用索引
WHERE created_at >= '2025-01-01' AND created_at < '2025-01-02'

-- ❌ NOT IN：索引失效
WHERE id NOT IN (1, 2, 3)

-- ✅ LEFT JOIN 或 NOT EXISTS
WHERE NOT EXISTS (SELECT 1 FROM table2 WHERE table2.id = table1.id)
```

💡 **联合索引范围查询**：
```sql
-- 索引：(a, b, c)
-- ❌ a 使用范围查询后，b、c 索引失效
WHERE a > 10 AND b = 20 AND c = 30

-- ✅ 将范围查询放最后
WHERE b = 20 AND c = 30 AND a > 10
```

### 4. 禁用 SELECT *

**必须使用明确的字段列表**

```sql
-- ❌ 错误
SELECT * FROM users WHERE id = 1;

-- ✅ 正确
SELECT id, username, email, mobile FROM users WHERE id = 1;
```

原因：
- 消耗更多 CPU、IO、网络带宽
- 无法使用覆盖索引
- 表结构变更影响大

### 5. INSERT 语句规范

**必须包含字段列表**

```sql
-- ❌ 错误
INSERT INTO users VALUES ('张三', 25, '13800138000');

-- ✅ 正确
INSERT INTO users (name, age, mobile) 
VALUES ('张三', 25, '13800138000');
```

### 6. 避免子查询

**优化为 JOIN 操作**

```sql
-- ❌ 不推荐：子查询
SELECT * FROM orders 
WHERE user_id IN (
    SELECT id FROM users WHERE status = 1
);

-- ✅ 推荐：JOIN
SELECT o.* FROM orders o
INNER JOIN users u ON o.user_id = u.id
WHERE u.status = 1;
```

原因：
- 子查询结果集无法使用索引
- 产生临时表，消耗 CPU 和 IO
- 性能较差

### 7. JOIN 表数量限制

**建议不超过 5 个表关联**

原因：
- 每关联一个表，分配一个关联缓存
- 容易造成内存溢出
- 产生临时表，影响效率
- MySQL 最多允许 61 个表关联

### 8. 批量操作

**减少与数据库的交互次数**

```java
// ❌ 不推荐：循环单次插入
for (User user : userList) {
    INSERT INTO users VALUES (...);
}

// ✅ 推荐：批量插入
INSERT INTO users (name, age) VALUES
('张三', 25),
('李四', 30),
('王五', 28);
```

### 9. 使用 IN 代替 OR

**同一列的多条件判断**

```sql
-- ❌ 不推荐
WHERE status = 1 OR status = 2 OR status = 3

-- ✅ 推荐（IN 值不超过 500 个）
WHERE status IN (1, 2, 3)
```

### 10. 禁用随机排序

**禁止使用 ORDER BY RAND()**

```sql
-- ❌ 错误：性能极差
SELECT * FROM users ORDER BY RAND() LIMIT 10;

-- ✅ 正确：程序生成随机值
SELECT * FROM users WHERE id >= (随机ID) LIMIT 10;
```

原因：
- 将所有数据加载到内存
- 为每行生成随机值并排序
- 消耗大量 CPU、IO、内存

### 11. UNION 使用

**明确无重复时使用 UNION ALL**

```sql
-- ❌ UNION：会去重（使用临时表）
SELECT * FROM table1
UNION
SELECT * FROM table2;

-- ✅ UNION ALL：不去重（效率高）
SELECT * FROM table1
UNION ALL
SELECT * FROM table2;
```

### 12. 拆分复杂 SQL

**大 SQL 拆分为多个小 SQL**

原因：
- MySQL 中一个 SQL 只能使用一个 CPU
- 拆分后可以并行执行
- 逻辑更清晰，易于维护

```sql
-- ❌ 复杂的大 SQL
SELECT ... FROM table1 
JOIN table2 ... 
JOIN table3 ... 
WHERE complex_conditions...

-- ✅ 拆分为多个步骤
-- 1. 先查询主要数据
-- 2. 再查询关联数据
-- 3. 程序中组装结果
```

---

## 数据库操作规范

### 1. 批量写操作

**超 100 万行数据分批操作**

```sql
-- ❌ 错误：一次更新 100 万行
UPDATE users SET status = 1 WHERE created_at < '2024-01-01';

-- ✅ 正确：分批更新
UPDATE users SET status = 1 
WHERE created_at < '2024-01-01' 
LIMIT 10000;
-- 重复执行多次
```

⚠️ 大批量操作的问题：
- 造成严重的主从延迟
- 产生大量 binlog 日志
- 长时间锁表，阻塞其他操作
- 占满数据库连接

### 2. 大表结构修改

**使用 pt-online-schema-change 工具**

```bash
# 在线修改表结构
pt-online-schema-change \
  --alter "ADD COLUMN new_col VARCHAR(50)" \
  D=database,t=table \
  --execute
```

原理：
1. 创建新表并修改结构
2. 复制原表数据到新表
3. 在原表创建触发器同步新数据
4. 完成后替换表名

优势：
- 避免锁表
- 避免主从延迟
- 对业务影响小

### 3. 权限管理

**遵循最小权限原则**

✅ 程序账号权限：
```sql
-- 只授予必要的库和表权限
GRANT SELECT, INSERT, UPDATE, DELETE 
ON database.* TO 'app_user'@'%';

-- 禁止授予的权限
-- DROP, ALTER, SUPER 等
```

❌ 禁止事项：
- 程序账号不能有 SUPER 权限
- 不能跨库操作
- 原则上不能有 DROP 权限

**SUPER 权限保留给 DBA**：
- 当达到最大连接数时，SUPER 用户仍可连接
- 用于紧急处理问题

### 4. 数据库设计考虑扩展性

**为未来预留空间**：
- 使用不同账号连接不同数据库
- 禁止跨库查询
- 为分库分表留出余地
- 降低业务耦合度
- 避免权限过大的安全风险

---

## 📊 快速参考表

### 推荐数据类型对照表

| 业务场景 | 推荐类型 | 示例 |
|---------|---------|------|
| 自增主键 | BIGINT UNSIGNED | `id BIGINT UNSIGNED AUTO_INCREMENT` |
| 用户名 | VARCHAR(50) | `username VARCHAR(50) NOT NULL` |
| 手机号 | VARCHAR(11) | `mobile VARCHAR(11) NOT NULL` |
| 邮箱 | VARCHAR(100) | `email VARCHAR(100)` |
| IP 地址 | INT UNSIGNED | `ip INT UNSIGNED` |
| 状态字段 | TINYINT | `status TINYINT NOT NULL DEFAULT 0` |
| 金额 | DECIMAL(10,2) | `amount DECIMAL(10,2) NOT NULL` |
| 创建时间 | TIMESTAMP | `created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP` |
| 更新时间 | TIMESTAMP | `updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| 文本内容 | TEXT | 分离到扩展表 |

### 索引优化检查清单

- [ ] 主键使用自增 BIGINT
- [ ] WHERE 条件列建立索引
- [ ] 联合索引遵循最左前缀
- [ ] 区分度高的列放在左侧
- [ ] 避免重复和冗余索引
- [ ] 单表索引数量不超过 5 个
- [ ] JOIN 关联列建立索引
- [ ] 覆盖索引优先考虑

### SQL 性能优化检查清单

- [ ] 避免使用 SELECT *
- [ ] 避免使用子查询
- [ ] 避免函数操作字段
- [ ] 避免隐式类型转换
- [ ] 避免 NOT IN 操作
- [ ] 避免 LIKE '%关键词%'
- [ ] 避免 ORDER BY RAND()
- [ ] 使用 LIMIT 分页
- [ ] 使用预编译语句
- [ ] 批量操作代替循环

---

## 🎯 总结

遵循以上规范可以：
- ✅ 提高查询性能 50% 以上
- ✅ 减少数据库锁等待
- ✅ 降低主从延迟
- ✅ 提升系统稳定性
- ✅ 便于后期维护和扩展

**核心原则**：
1. 合理的表结构设计
2. 高效的索引策略
3. 优化的 SQL 语句
4. 规范的操作流程

## 参考

https://mp.weixin.qq.com/s?__biz=Mzg2OTA0Njk0OA==&mid=2247485117&idx=1&sn=92361755b7c3de488b415ec4c5f46d73&chksm=cea24976f9d5c060babe50c3747616cce63df5d50947903a262704988143c2eeb4069ae45420&token=79317275&lang=zh_CN#rd

---

*最后更新：2025-01-01*