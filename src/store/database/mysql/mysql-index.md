---
title: 索引指南
category:
  - 数据库
tag:
  - MySQL
  - SQL
---

# MySQL索引完整指南

## 1. 索引概述

索引是数据库中用于提高查询性能的重要机制。MySQL支持多种索引类型，合理使用索引可以大大提升查询效率，但不当使用也可能导致性能问题。

## 2. MySQL存储引擎查看

在了解索引之前，首先需要了解当前MySQL的存储引擎情况：

### 2.1 查看可用存储引擎
```sql
mysql> SHOW ENGINES;
```

### 2.2 查看当前默认存储引擎
```sql
mysql> SHOW VARIABLES LIKE '%storage_engine%';
```

### 2.3 查看特定表的存储引擎
```sql
mysql> SHOW CREATE TABLE 表名;
```
在显示结果中，`ENGINE`参数后面显示的就是该表当前使用的存储引擎。

## 3. 索引类型与创建语法

### 3.1 主键索引（PRIMARY KEY）
```sql
ALTER TABLE `table_name` ADD PRIMARY KEY (`column`);
```
- 唯一且不能为NULL
- 每个表只能有一个主键索引

### 3.2 唯一索引（UNIQUE）
```sql
ALTER TABLE `table_name` ADD UNIQUE (`column`);
```
- 保证列值的唯一性
- 可以有NULL值

### 3.3 普通索引（INDEX）
```sql
ALTER TABLE `table_name` ADD INDEX index_name (`column`);
```
- 最基本的索引类型
- 没有唯一性限制

### 3.4 全文索引（FULLTEXT）
```sql
ALTER TABLE `table_name` ADD FULLTEXT (`column`);
```
- 用于全文搜索
- 主要用于TEXT类型字段

### 3.5 联合索引（多列索引）
```sql
ALTER TABLE `table_name` ADD INDEX index_name (`column1`, `column2`, `column3`);
```
- 在多个列上创建的索引
- 遵循最左前缀原则

## 4. 索引失效的5种情况

索引并不是时时都会生效的，以下情况会导致索引失效：

### 4.1 使用OR条件
如果条件中有OR，即使其中有条件带索引也不会使用索引。这也是为什么要尽量少用OR的原因。

**解决方案：** 要想使用OR又让索引生效，只能将OR条件中的每个列都加上索引。

### 4.2 联合索引未使用第一部分
对于多列索引，如果不是使用的第一部分（最左前缀），则不会使用索引。

**示例：**
```sql
-- 假设有联合索引 INDEX(a, b, c)
SELECT * FROM table WHERE b = 1 AND c = 2;  -- 不会使用索引
SELECT * FROM table WHERE a = 1 AND b = 2;  -- 会使用索引
```

### 4.3 LIKE查询以%开头
当LIKE查询以通配符%开头时，索引失效。

**示例：**
```sql
SELECT * FROM table WHERE name LIKE '%张';    -- 索引失效
SELECT * FROM table WHERE name LIKE '张%';    -- 索引有效
```

### 4.4 字符串类型未使用引号
如果列类型是字符串，条件中的数据必须使用引号引用起来，否则不使用索引。

**示例：**
```sql
SELECT * FROM table WHERE name = 123;     -- 索引失效
SELECT * FROM table WHERE name = '123';   -- 索引有效
```

### 4.5 MySQL优化器选择全表扫描
如果MySQL估计使用全表扫描要比使用索引快，则不使用索引。这通常发生在表数据量很小或者查询结果集占表总数据的很大比例时。

## 5. 索引使用情况监控

### 5.1 查看索引使用状态
```sql
SHOW STATUS LIKE 'Handler_read%';
```

### 5.2 关键指标说明
- **handler_read_key**: 这个值越高越好，表示使用索引查询到的次数
- **handler_read_rnd_next**: 这个值越高，说明查询效率越低，可能存在大量全表扫描

## 6. 索引优化建议

### 6.1 设计原则
1. **选择性高的列**: 在选择性高（不重复值多）的列上建立索引
2. **最左前缀**: 联合索引要考虑最左前缀原则
3. **避免过多索引**: 索引会影响写入性能，不要创建过多不必要的索引

### 6.2 使用建议
1. **WHERE子句**: 经常出现在WHERE子句中的列应该建立索引
2. **ORDER BY**: 经常需要排序的列考虑建立索引
3. **JOIN条件**: 连接条件的列应该建立索引
4. **避免函数**: 避免在WHERE条件中对索引列使用函数

### 6.3 维护建议
1. **定期分析**: 使用`ANALYZE TABLE`更新表统计信息
2. **监控性能**: 定期检查慢查询日志
3. **索引重建**: 必要时重建碎片化严重的索引

## 7. 参考

* **官方文档**
https://dev.mysql.com/doc/refman/8.0/en/mysql-indexes.html

* **菜鸟教程**
https://www.runoob.com/mysql/mysql-index.html

* **其他**
https://zhuanlan.zhihu.com/p/411359802
https://blog.csdn.net/kingmax54212008/article/details/49797575