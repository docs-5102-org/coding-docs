---
title: 内置函数讲解
category:
  - 数据库
tag:
  - MySQL
  - SQL
---

# MySQL 内置函数详解

MySQL 提供了丰富的内置函数来帮助开发者处理各种数据操作需求。本文将详细介绍常用的MySQL内置函数，包括类型转换、字符串处理、聚合函数等。

## 1. 类型转换函数

### 1.1 CAST() 函数

CAST函数用于将一个数据类型转换为另一个数据类型。

**语法：**
```sql
CAST(value AS type)
```

**可转换的类型：**
- `BINARY` - 二进制，同带binary前缀的效果
- `CHAR()` - 字符型，可带参数
- `DATE` - 日期
- `TIME` - 时间
- `DATETIME` - 日期时间型
- `DECIMAL` - 浮点数
- `SIGNED` - 整数
- `UNSIGNED` - 无符号整数

**示例：**
```sql
-- 将字符串转换为整数
SELECT CAST('125e342.83' AS SIGNED);
-- 结果: 125

-- 将字符串转换为日期
SELECT CAST('2023-12-25' AS DATE);
-- 结果: 2023-12-25

-- 将数字转换为字符串
SELECT CAST(123.456 AS CHAR);
-- 结果: '123.456'
```

### 1.2 CONVERT() 函数

CONVERT函数与CAST函数功能相似，但语法略有不同。

**语法：**
```sql
CONVERT(value, type)
```

**示例：**
```sql
-- 将字符串转换为整数
SELECT CONVERT('23', SIGNED);
-- 结果: 23

-- 将字符串转换为日期
SELECT CONVERT('2023-12-25', DATE);
-- 结果: 2023-12-25
```

**注意事项：**
- 当转换字符串为数字时，MySQL会从左到右解析数字，遇到非数字字符时停止
- 例如：`CAST('3.35' AS SIGNED)` 结果为 3

## 2. 字符串聚合函数

### 2.1 GROUP_CONCAT() 函数

GROUP_CONCAT函数用于将分组中的多行数据连接成一个字符串。

**完整语法：**
```sql
GROUP_CONCAT([DISTINCT] 要连接的字段 
             [ORDER BY ASC/DESC 排序字段] 
             [SEPARATOR '分隔符'])
```

**基本用法示例：**

假设有表 `aa`：
```
+------+------+
| id   | name |
+------+------+
| 1    | 10   |
| 1    | 20   |
| 1    | 20   |
| 2    | 20   |
| 3    | 200  |
| 3    | 500  |
+------+------+
```

**1. 基本分组连接（逗号分隔）：**
```sql
SELECT id, GROUP_CONCAT(name) FROM aa GROUP BY id;
```
结果：
```
+------+--------------------+
| id   | group_concat(name) |
+------+--------------------+
| 1    | 10,20,20          |
| 2    | 20                |
| 3    | 200,500           |
+------+--------------------+
```

**2. 自定义分隔符：**
```sql
SELECT id, GROUP_CONCAT(name SEPARATOR ';') FROM aa GROUP BY id;
```
结果：
```
+------+----------------------------------+
| id   | group_concat(name separator ';') |
+------+----------------------------------+
| 1    | 10;20;20                        |
| 2    | 20                              |
| 3    | 200;500                         |
+------+----------------------------------+
```

**3. 去重连接：**
```sql
SELECT id, GROUP_CONCAT(DISTINCT name) FROM aa GROUP BY id;
```
结果：
```
+------+-----------------------------+
| id   | group_concat(distinct name) |
+------+-----------------------------+
| 1    | 10,20                      |
| 2    | 20                         |
| 3    | 200,500                    |
+------+-----------------------------+
```

**4. 排序连接：**
```sql
SELECT id, GROUP_CONCAT(name ORDER BY name DESC) FROM aa GROUP BY id;
```
结果：
```
+------+---------------------------------------+
| id   | group_concat(name order by name desc) |
+------+---------------------------------------+
| 1    | 20,20,10                             |
| 2    | 20                                   |
| 3    | 500,200                              |
+------+---------------------------------------+
```

## 3. 字符串查找函数

### 3.1 FIND_IN_SET() 函数

FIND_IN_SET函数用于在逗号分隔的字符串列表中查找指定值。

**语法：**
```sql
FIND_IN_SET(str, strlist)
```

**参数说明：**
- `str` - 要查询的字符串
- `strlist` - 字段名，参数以逗号分隔，如 (1,2,6,8)

**示例：**

假设有表 `test`：
```
+------+--------+----------+
| id   | area   | btype    |
+------+--------+----------+
| 1    | 1,2,3  | 10,15,20 |
| 2    | 4,5,6  | 25,30    |
+------+--------+----------+
```

**查询area中包含"1"的记录：**
```sql
SELECT * FROM test WHERE FIND_IN_SET('1', area);
```

**查询btype中包含"15"的记录：**
```sql
SELECT * FROM test WHERE FIND_IN_SET('15', btype);
```

**FIND_IN_SET vs LIKE的区别：**
- `LIKE` 是广泛的模糊匹配，字符串中没有分隔符
- `FIND_IN_SET` 是精确匹配，字段值以英文逗号分隔
- `FIND_IN_SET` 查询结果比 `LIKE` 更精确

## 4. 数学函数

### 4.1 基础数学函数

```sql
-- 绝对值
SELECT ABS(-10);          -- 结果: 10

-- 向上取整
SELECT CEIL(4.2);         -- 结果: 5
SELECT CEILING(4.2);      -- 结果: 5

-- 向下取整
SELECT FLOOR(4.8);        -- 结果: 4

-- 四舍五入
SELECT ROUND(4.567, 2);   -- 结果: 4.57

-- 幂运算
SELECT POWER(2, 3);       -- 结果: 8
SELECT POW(2, 3);         -- 结果: 8

-- 平方根
SELECT SQRT(16);          -- 结果: 4

-- 随机数
SELECT RAND();            -- 结果: 0到1之间的随机数
```

### 4.2 三角函数

```sql
-- 正弦
SELECT SIN(PI()/2);       -- 结果: 1

-- 余弦
SELECT COS(0);            -- 结果: 1

-- 正切
SELECT TAN(PI()/4);       -- 结果: 1

-- 圆周率
SELECT PI();              -- 结果: 3.141593
```

## 5. 日期时间函数

### 5.1 获取当前时间

```sql
-- 当前日期时间
SELECT NOW();             -- 结果: 2023-12-25 10:30:45
SELECT CURRENT_TIMESTAMP(); -- 同NOW()

-- 当前日期
SELECT CURDATE();         -- 结果: 2023-12-25
SELECT CURRENT_DATE();    -- 同CURDATE()

-- 当前时间
SELECT CURTIME();         -- 结果: 10:30:45
SELECT CURRENT_TIME();    -- 同CURTIME()
```

### 5.2 日期时间提取

```sql
-- 提取年份
SELECT YEAR('2023-12-25');     -- 结果: 2023

-- 提取月份
SELECT MONTH('2023-12-25');    -- 结果: 12

-- 提取日期
SELECT DAY('2023-12-25');      -- 结果: 25

-- 提取小时
SELECT HOUR('10:30:45');       -- 结果: 10

-- 提取分钟
SELECT MINUTE('10:30:45');     -- 结果: 30

-- 提取秒
SELECT SECOND('10:30:45');     -- 结果: 45

-- 获取星期几
SELECT DAYOFWEEK('2023-12-25'); -- 结果: 2 (周一)
SELECT WEEKDAY('2023-12-25');   -- 结果: 0 (周一)
```

### 5.3 日期时间计算

```sql
-- 日期加减
SELECT DATE_ADD('2023-12-25', INTERVAL 7 DAY);     -- 加7天
SELECT DATE_SUB('2023-12-25', INTERVAL 1 MONTH);   -- 减1个月

-- 日期差值
SELECT DATEDIFF('2023-12-25', '2023-12-20');       -- 结果: 5

-- 时间差值
SELECT TIMEDIFF('10:30:45', '08:15:30');           -- 结果: 02:15:15
```

### 5.4 日期格式化

```sql
-- 格式化日期
SELECT DATE_FORMAT('2023-12-25 10:30:45', '%Y-%m-%d');     -- 2023-12-25
SELECT DATE_FORMAT('2023-12-25 10:30:45', '%Y年%m月%d日'); -- 2023年12月25日
SELECT DATE_FORMAT('2023-12-25 10:30:45', '%H:%i:%s');     -- 10:30:45

-- 字符串转日期
SELECT STR_TO_DATE('25/12/2023', '%d/%m/%Y');               -- 2023-12-25
```

## 6. 字符串函数

### 6.1 基础字符串操作

```sql
-- 字符串长度
SELECT LENGTH('Hello');        -- 结果: 5
SELECT CHAR_LENGTH('你好');    -- 结果: 2

-- 字符串连接
SELECT CONCAT('Hello', ' ', 'World');        -- 结果: 'Hello World'
SELECT CONCAT_WS('-', '2023', '12', '25');   -- 结果: '2023-12-25'

-- 大小写转换
SELECT UPPER('hello');         -- 结果: 'HELLO'
SELECT LOWER('HELLO');         -- 结果: 'hello'

-- 去除空格
SELECT TRIM('  hello  ');      -- 结果: 'hello'
SELECT LTRIM('  hello  ');     -- 结果: 'hello  '
SELECT RTRIM('  hello  ');     -- 结果: '  hello'
```

### 6.2 字符串截取和替换

```sql
-- 截取字符串
SELECT LEFT('Hello World', 5);      -- 结果: 'Hello'
SELECT RIGHT('Hello World', 5);     -- 结果: 'World'
SELECT SUBSTRING('Hello World', 7, 5); -- 结果: 'World'
SELECT MID('Hello World', 7, 5);    -- 结果: 'World'

-- 字符串替换
SELECT REPLACE('Hello World', 'World', 'MySQL'); -- 结果: 'Hello MySQL'

-- 字符串位置
SELECT LOCATE('World', 'Hello World');           -- 结果: 7
SELECT POSITION('World' IN 'Hello World');       -- 结果: 7
```

### 6.3 字符串比较和模式匹配

```sql
-- 字符串比较
SELECT STRCMP('abc', 'def');     -- 结果: -1 (第一个字符串小于第二个)

-- 模式匹配
SELECT 'Hello World' LIKE 'Hello%';              -- 结果: 1 (true)
SELECT 'Hello World' REGEXP '[0-9]';             -- 结果: 0 (false)
```

## 7. 聚合函数

### 7.1 基础聚合函数

```sql
-- 计数
SELECT COUNT(*);              -- 总行数
SELECT COUNT(column_name);    -- 非NULL值的数量

-- 求和
SELECT SUM(salary);           -- 工资总和

-- 平均值
SELECT AVG(salary);           -- 平均工资

-- 最大值和最小值
SELECT MAX(salary);           -- 最高工资
SELECT MIN(salary);           -- 最低工资
```

### 7.2 统计函数

```sql
-- 标准差
SELECT STDDEV(salary);        -- 标准差
SELECT STD(salary);           -- 同STDDEV

-- 方差
SELECT VARIANCE(salary);      -- 方差
```

## 8. 条件函数

### 8.1 基础条件函数

```sql
-- IF函数
SELECT IF(score >= 60, '及格', '不及格') AS result;

-- CASE语句
SELECT 
    CASE 
        WHEN score >= 90 THEN '优秀'
        WHEN score >= 80 THEN '良好'
        WHEN score >= 60 THEN '及格'
        ELSE '不及格'
    END AS grade;

-- IFNULL函数
SELECT IFNULL(phone, '无') AS contact;  -- 如果phone为NULL，返回'无'

-- NULLIF函数
SELECT NULLIF(value1, value2);          -- 如果两个值相等，返回NULL
```

### 8.2 空值处理

```sql
-- ISNULL检查
SELECT ISNULL(column_name);             -- 检查是否为NULL

-- COALESCE函数
SELECT COALESCE(phone, mobile, '无联系方式'); -- 返回第一个非NULL值
```

## 9. 系统信息函数

```sql
-- 数据库版本
SELECT VERSION();

-- 当前用户
SELECT USER();
SELECT CURRENT_USER();

-- 数据库名
SELECT DATABASE();

-- 连接ID
SELECT CONNECTION_ID();

-- 最后插入的ID
SELECT LAST_INSERT_ID();
```

## 10. JSON函数 (MySQL 5.7+)

```sql
-- JSON提取
SELECT JSON_EXTRACT('{"name": "John", "age": 30}', '$.name');  -- 结果: "John"

-- JSON数组长度
SELECT JSON_LENGTH('[1, 2, 3, 4]');                           -- 结果: 4

-- JSON键存在性检查
SELECT JSON_CONTAINS_PATH('{"a": 1, "b": 2}', 'one', '$.a');  -- 结果: 1

-- JSON数据类型检查
SELECT JSON_TYPE('123');                                       -- 结果: INTEGER
```

## 11. 使用建议和最佳实践

### 11.1 性能考虑

1. **索引友好**: 在WHERE子句中使用函数会导致索引失效，如：
   ```sql
   -- 不推荐
   SELECT * FROM users WHERE YEAR(created_at) = 2023;
   
   -- 推荐
   SELECT * FROM users WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';
   ```

2. **GROUP_CONCAT长度限制**: 默认最大长度为1024字符，可通过设置`group_concat_max_len`调整：
   ```sql
   SET SESSION group_concat_max_len = 4096;
   ```

### 11.2 数据类型转换注意事项

1. **隐式转换**: MySQL会自动进行类型转换，但可能导致性能问题
2. **精度问题**: 浮点数转换时可能丢失精度
3. **日期格式**: 确保日期字符串格式正确，推荐使用ISO 8601格式

### 11.3 字符串处理最佳实践

1. **字符集考虑**: 使用`CHAR_LENGTH`而非`LENGTH`处理多字节字符
2. **大小写敏感**: 注意排序规则对字符串比较的影响
3. **性能优化**: 对于大量字符串操作，考虑在应用层处理

## 总结

MySQL内置函数为数据处理提供了强大的工具集。合理使用这些函数可以大大简化SQL查询的复杂性，提高开发效率。在使用过程中，需要特别注意性能影响、数据类型转换和字符集处理等问题，确保查询既正确又高效。

记住，虽然这些函数功能强大，但在某些情况下，在应用程序中处理数据可能会更高效。选择在数据库层面还是应用层面处理数据，需要根据具体场景和性能要求来决定。