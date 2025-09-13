---
title: 常用SQL语句
category:
  - 数据库
tag:
  - MySQL
  - SQL
---

# MySQL 常用SQL语句

本文档整理了MySQL数据库中最常用的SQL命令和优化技巧，包括基础查询、优化方法、系统管理等方面的实用内容。

## 目录

[[toc]]

## 1. 基础系统查询

### 1.1 版本和基础信息查询
```sql
-- 查询MySQL版本号
SELECT @@version;

-- 查询当前用户
SELECT user();

-- 查询当前时间
SELECT now();

-- 查询数据库编码
SHOW variables like 'character_set_database';
```
> [官网详解](https://dev.mysql.com/doc/refman/8.0/en/show-variables.html)
> [show variables系统变量详解](https://www.cnblogs.com/cqliyongqiang/p/9515813.html)

### 1.2 连接状态查询
```sql
-- 查看MySQL连接状态
SHOW status like '%connect%';

-- 查看MySQL最大连接数
SHOW variables like '%connect%';
```

### 1.3 数据库和表信息查询
```sql
-- 显示所有数据库
SHOW databases;

-- 显示当前数据创建的编码和信息

show create database tbsadb;
show create database jinhonglun_erp;

-- 显示当前数据库中所有表
SHOW tables;

-- 查看表的详细信息
DESCRIBE table_name;

-- 查询数据库中表的数量(查询数据库表表)
SELECT COUNT(*) TABLES, table_schema 
FROM information_schema.TABLES   
WHERE table_schema = 'database_name' 
GROUP BY table_schema;
```

## 2. Like查询优化

### 2.1 问题描述
使用模糊查询时，如果数据量比较大，会响应很长时间，严重影响效率：

```sql
-- 普通模糊查询（性能较差）
SELECT `column` FROM `table` WHERE `field` like '%keyword%';
```

### 2.2 优化方案

#### 方案一：前缀匹配
```sql
-- 使用前缀匹配可以触发索引
SELECT `column` FROM `table` WHERE `field` like 'keyword%';
```

#### 方案二：函数替代
```sql
-- LOCATE()函数
SELECT `column` FROM `table` WHERE LOCATE('keyword', `field`) > 0;

-- POSITION()函数
SELECT `column` FROM `table` WHERE POSITION('keyword' IN `field`);

-- INSTR()函数
SELECT `column` FROM `table` WHERE INSTR(`field`, 'keyword') > 0;
```

#### 方案三：添加辅助字段（推荐）
通过添加辅助搜索字段来优化查询：

```sql
-- 添加辅助搜索字段, 字段PRODUCT、TYPE的首字符和IDX组成的
ALTER TABLE detail ADD COLUMN `SEARCH_ID` VARCHAR(255);

-- 更新辅助字段数据
UPDATE detail SET `SEARCH_ID` = CONCAT(
    SUBSTRING(PRODUCT, 1, 1), '_',
    SUBSTRING(TYPE, 1, 1), '_',
    IDX
);

-- 优化后的查询（可以使用索引）
SELECT * FROM detail WHERE `SEARCH_ID` LIKE 'P_A_%TEST001%';
```

::: tip
参考连接：
- https://cloud.tencent.com/developer/article/1159624
- https://www.cnblogs.com/scode2/p/9065946.html
:::


## 3. 排序和排名查询

### 3.1 基础排序
```sql
-- 查询最后一条数据
SELECT * FROM t_invoice ORDER BY invoice_id DESC LIMIT 1;
```

### 3.2 排名查询

#### 方案一：简单排名（值相同排名不同）
```sql
SELECT 
    @rank := @rank + 1 AS rank,
    name,
    age
FROM students, (SELECT @rank := 0) r
ORDER BY age DESC;

或

SELECT 
  ROW_NUMBER() OVER (ORDER BY age DESC) AS rank,
  name,
  age
FROM students;
```

输出

```
| rank | name | age |
| ---- | ---- | --- |
| 1    | 李四 | 25  |
| 2    | 赵六 | 25  |
| 3    | 张三 | 22  |
| 4    | 王五 | 20  |

```

#### 方案二：相同值相同排名（连续排名）
```sql
SELECT 
    @rank := CASE 
        WHEN @prevRank = age THEN @rank 
        ELSE @rank + 1 
    END AS rank,
    name,
    age,
    @prevRank := age
FROM students, (SELECT @rank := 0, @prevRank := -1) r
ORDER BY age DESC;
```

输出

```
| rank | name | age |
| ---- | ---- | --- |
| 1    | 李四 | 25  |
| 1    | 赵六 | 25  |
| 2    | 张三 | 22  |
| 3    | 王五 | 20  |

```

#### 方案三：相同值相同排名（跳跃排名）
```sql
SELECT 
    @rank := CASE 
        WHEN @prevRank = age THEN @rank 
        ELSE @incRank 
    END AS rank,
    name,
    age,
    @prevRank := age,
    @incRank := @incRank + 1
FROM students, (SELECT @rank := 0, @prevRank := -1, @incRank := 1) r
ORDER BY age DESC;
```

输出

```
| rank | name | age |
| ---- | ---- | --- |
| 1    | 李四 | 25  |
| 1    | 赵六 | 25  |
| 2    | 张三 | 22  |
| 3    | 王五 | 20  |

```

额外的资料：

https://zhuanlan.zhihu.com/p/564938207

#### 方案四

例如我有一张表 表名为 A： 

```
ID    SCORE 
1      28 
2      33 
3      33 
4      89 
5      99 
6      68 
7      68 
8      78 
9      88 
10    90 
```

现在我需要如下结果： 

```
ID    SCORE    RANK 
5      99              1 
10    90              2 
4      89              3 
9      88              4 
8      78              5 
6      68              6 
7      68              7 
2      33              8 
3      33              9 
1      28             10 
```

```sql
SELECT id,  
       score,  
       rank  
  FROM (SELECT tmp.id,  
               tmp.score,  
               @rank := @rank + 1 AS rank  
          FROM (SELECT id,  
                       score  
                  FROM a  
                 ORDER BY score desc) tmp,  
               (SELECT @rank   := 0) a) RESULT;

```

## 4. 表结构操作

### 4.1 添加字段
```sql
-- 添加新字段
ALTER TABLE table_name ADD column_name VARCHAR(20);

-- 修改字段类型
ALTER TABLE table_name MODIFY column_name VARCHAR(40);
```

### 4.2 批量给表添加字段
```sql
-- 设置变量
SET @database_name = 'your_database';
SET @field_name = 'tenant_id';
SET @field_definition = 'BIGINT NOT NULL DEFAULT 0 COMMENT "租户ID"';

-- 生成批量添加字段的SQL
SELECT CONCAT('ALTER TABLE ', TABLE_NAME,
              ' ADD COLUMN ', @field_name, ' ', @field_definition, ';') AS add_column_sql
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = @database_name
AND TABLE_NAME IN ('table1', 'table2'); -- 指定表名
```

### 4.3 创建索引
```sql
CREATE INDEX index_name ON table_name(column_name);
```

## 5. 数据操作

### 5.1 插入数据
```sql
-- 标准插入
INSERT INTO customers SET 
    name='Michael Archer', 
    address='北京', 
    city='艾迪';

-- 跨表插入
INSERT INTO target_table SELECT * FROM source_table WHERE condition;

-- 跨数据库插入
INSERT INTO database_b.table_b SELECT * FROM database_a.table_a WHERE condition;
```

### 5.2 更新数据
```sql
-- 关联表更新
UPDATE t_invoice AS i
INNER JOIN t_jd_trade AS j ON i.invoice_id = j.invoice_id
SET i.pay_at = j.pay_time 
WHERE i.shop IN ('shop1', 'shop2') AND i.pay_at IS NULL;
```

## 6. 用户和权限管理

### 6.1 创建用户
```sql
-- 创建用户
CREATE USER 'username' IDENTIFIED BY 'password';

-- 创建指定主机用户
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'password';
```

### 6.2 权限管理
```sql
-- 授予所有权限
GRANT ALL ON *.* TO 'username' IDENTIFIED BY 'password' WITH GRANT OPTION;

-- 授予指定数据库权限
GRANT ALL ON database_name.* TO 'username' IDENTIFIED BY 'password' WITH GRANT OPTION;

-- 撤销权限
REVOKE ALL PRIVILEGES, GRANT FROM username;
```

## 7. 数据库管理

### 7.1 创建数据库
```sql
CREATE DATABASE database_name;
```

### 7.2 导入SQL文件
```sql
-- 在MySQL命令行中导入
SOURCE /path/to/file.sql;
```

### 7.3 登录命令
```bash
# 基础登录
mysql -u username -p

# 指定主机和数据库
mysql -h hostname -u username -p database_name
```

## 8. 性能优化要点

1. **Like查询优化**：避免以通配符开头的模糊查询，考虑使用辅助字段
2. **索引使用**：确保查询条件能够有效使用索引
3. **避免全表扫描**：通过合理的WHERE条件和索引来避免全表扫描
4. **数据类型选择**：选择合适的数据类型可以提高查询效率
5. **查询语句优化**：使用EXPLAIN分析查询执行计划

## 9. 注意事项

1. 在使用`INTO OUTFILE`时，注意MySQL的`secure-file-priv`配置限制
2. 批量操作前建议先备份数据
3. 索引虽然能提高查询速度，但会影响插入和更新的性能
4. 使用模糊查询时要特别注意性能影响

---

*本文档基于MySQL实践经验整理，建议在实际使用时根据具体业务场景进行调整和测试。*