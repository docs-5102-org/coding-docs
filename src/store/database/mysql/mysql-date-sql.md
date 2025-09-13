---
title: 日期SQL语句
category:
  - 数据库
tag:
  - MySQL
  - SQL
---

# MySQL 日期SQL语句

MySQL提供了丰富的日期时间函数，让我们能够灵活地查询和处理时间数据。

## 目录

[[toc]]

## 一、基本日期查询

### 1.1 查询今天的数据
```sql
-- 方法1：使用TO_DAYS函数
SELECT * FROM 表名 WHERE TO_DAYS(时间字段名) = TO_DAYS(NOW());

-- 方法2：使用DATE函数
SELECT * FROM 表名 WHERE DATE(时间字段名) = CURDATE();

-- 方法3：使用BETWEEN范围查询
SELECT * FROM 表名 WHERE 时间字段名 >= CURDATE() AND 时间字段名 < DATE_ADD(CURDATE(), INTERVAL 1 DAY);
```

### 1.2 查询昨天的数据
```sql
-- 方法1：使用TO_DAYS函数
SELECT * FROM 表名 WHERE TO_DAYS(NOW()) - TO_DAYS(时间字段名) = 1;

-- 方法2：使用DATE_SUB函数
SELECT * FROM 表名 WHERE DATE(时间字段名) = DATE_SUB(CURDATE(), INTERVAL 1 DAY);
```

### 1.3 查询明天的数据
```sql
SELECT * FROM 表名 WHERE DATE(时间字段名) = DATE_ADD(CURDATE(), INTERVAL 1 DAY);
```

## 二、时间范围查询

### 2.1 查询近N天的数据
```sql
-- 近7天
SELECT * FROM 表名 WHERE DATE_SUB(CURDATE(), INTERVAL 7 DAY) <= DATE(时间字段名);

-- 近30天
SELECT * FROM 表名 WHERE DATE_SUB(CURDATE(), INTERVAL 30 DAY) <= DATE(时间字段名);

-- 近N天（包含今天）
SELECT * FROM 表名 WHERE 时间字段名 >= DATE_SUB(CURDATE(), INTERVAL 6 DAY);

-- 最近N天不包含今天
SELECT * FROM 表名 WHERE 时间字段名 BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND DATE_SUB(CURDATE(), INTERVAL 1 DAY);
```

### 2.2 查询指定时间段的数据
```sql
-- 查询某个时间段的数据
SELECT * FROM 表名 WHERE 时间字段名 BETWEEN '2024-01-01' AND '2024-12-31';

-- 查询某个时间段的数据（精确到时分秒）
SELECT * FROM 表名 WHERE 时间字段名 BETWEEN '2024-01-01 00:00:00' AND '2024-01-31 23:59:59';
```

## 三、周查询

### 3.1 本周数据
```sql
-- 方法1：使用YEARWEEK函数
SELECT * FROM 表名 WHERE YEARWEEK(DATE_FORMAT(时间字段名,'%Y-%m-%d')) = YEARWEEK(NOW());

-- 方法2：使用WEEK函数
SELECT * FROM 表名 WHERE WEEK(时间字段名) = WEEK(NOW()) AND YEAR(时间字段名) = YEAR(NOW());

-- 方法3：按周一开始计算
SELECT * FROM 表名 WHERE 时间字段名 >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) 
AND 时间字段名 < DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY);
```

### 3.2 上周数据
```sql
-- 使用YEARWEEK函数
SELECT * FROM 表名 WHERE YEARWEEK(DATE_FORMAT(时间字段名,'%Y-%m-%d')) = YEARWEEK(NOW())-1;

-- 精确的上周时间范围（周一到周日）
SELECT * FROM 表名 WHERE 时间字段名 >= DATE_SUB(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY)
AND 时间字段名 < DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY);
```

## 四、月查询

### 4.1 本月数据
```sql
-- 方法1：使用DATE_FORMAT函数
SELECT * FROM 表名 WHERE DATE_FORMAT(时间字段名, '%Y%m') = DATE_FORMAT(CURDATE(), '%Y%m');

-- 方法2：使用YEAR和MONTH函数
SELECT * FROM 表名 WHERE YEAR(时间字段名) = YEAR(NOW()) AND MONTH(时间字段名) = MONTH(NOW());

-- 方法3：使用时间范围
SELECT * FROM 表名 WHERE 时间字段名 >= DATE_FORMAT(NOW(),'%Y-%m-01') 
AND 时间字段名 < DATE_ADD(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 1 MONTH);
```

### 4.2 上个月数据
```sql
-- 方法1：使用PERIOD_DIFF函数
SELECT * FROM 表名 WHERE PERIOD_DIFF(DATE_FORMAT(NOW(), '%Y%m'), DATE_FORMAT(时间字段名, '%Y%m')) = 1;

-- 方法2：使用DATE_FORMAT和DATE_SUB
SELECT * FROM 表名 WHERE DATE_FORMAT(时间字段名,'%Y-%m') = DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH),'%Y-%m');

-- 方法3：精确的时间范围
SELECT * FROM 表名 WHERE 时间字段名 >= DATE_SUB(DATE_FORMAT(NOW(),'%Y-%m-01'), INTERVAL 1 MONTH)
AND 时间字段名 < DATE_FORMAT(NOW(),'%Y-%m-01');
```

### 4.3 指定月份数据
```sql
-- 查询指定年月的数据
SELECT * FROM 表名 WHERE DATE_FORMAT(时间字段名, '%Y-%m') = '2024-01';

-- 查询所有年份的指定月份
SELECT * FROM 表名 WHERE MONTH(时间字段名) = 1; -- 查询所有1月份的数据
```

## 五、季度查询

### 5.1 本季度数据
```sql
SELECT * FROM 表名 WHERE QUARTER(时间字段名) = QUARTER(NOW()) AND YEAR(时间字段名) = YEAR(NOW());
```

### 5.2 上季度数据
```sql
SELECT * FROM 表名 WHERE QUARTER(时间字段名) = QUARTER(DATE_SUB(NOW(), INTERVAL 1 QUARTER)) 
AND YEAR(时间字段名) = YEAR(DATE_SUB(NOW(), INTERVAL 1 QUARTER));
```

### 5.3 指定季度数据
```sql
-- 查询2024年第1季度数据
SELECT * FROM 表名 WHERE QUARTER(时间字段名) = 1 AND YEAR(时间字段名) = 2024;
```

## 六、年查询

### 6.1 本年数据
```sql
SELECT * FROM 表名 WHERE YEAR(时间字段名) = YEAR(NOW());
```

### 6.2 去年数据
```sql
SELECT * FROM 表名 WHERE YEAR(时间字段名) = YEAR(DATE_SUB(NOW(), INTERVAL 1 YEAR));
```

### 6.3 指定年份数据
```sql
SELECT * FROM 表名 WHERE YEAR(时间字段名) = 2024;
```

## 七、高级日期查询

### 7.1 时间戳查询
```sql
-- 对于UNIX时间戳字段
SELECT * FROM user WHERE DATE_FORMAT(FROM_UNIXTIME(时间戳字段),'%Y-%m') = DATE_FORMAT(NOW(),'%Y-%m');

-- 当前月份的时间戳数据
SELECT * FROM user WHERE MONTH(FROM_UNIXTIME(时间戳字段,'%Y-%m-%d')) = MONTH(NOW());

-- 当前年月的时间戳数据
SELECT * FROM user WHERE YEAR(FROM_UNIXTIME(时间戳字段,'%Y-%m-%d')) = YEAR(NOW()) 
AND MONTH(FROM_UNIXTIME(时间戳字段,'%Y-%m-%d')) = MONTH(NOW());
```

### 7.2 工作日查询
```sql
-- 查询工作日数据（周一到周五）
SELECT * FROM 表名 WHERE WEEKDAY(时间字段名) BETWEEN 0 AND 4;

-- 查询周末数据
SELECT * FROM 表名 WHERE WEEKDAY(时间字段名) IN (5, 6);
```

### 7.3 月初月末查询
```sql
-- 查询月初几天的数据
SELECT * FROM 表名 WHERE DAY(时间字段名) <= 5;

-- 查询月末几天的数据
SELECT * FROM 表名 WHERE DAY(时间字段名) >= DAY(LAST_DAY(时间字段名)) - 4;

-- 查询每月1号的数据
SELECT * FROM 表名 WHERE DAY(时间字段名) = 1;
```

## 八、日期计算和统计

### 8.1 按时间分组统计
```sql
-- 按年统计
SELECT YEAR(时间字段名) as 年份, COUNT(*) as 数量 FROM 表名 GROUP BY YEAR(时间字段名);

-- 按月统计
SELECT DATE_FORMAT(时间字段名, '%Y-%m') as 年月, COUNT(*) as 数量 FROM 表名 GROUP BY DATE_FORMAT(时间字段名, '%Y-%m');

-- 按周统计
SELECT YEARWEEK(时间字段名) as 年周, COUNT(*) as 数量 FROM 表名 GROUP BY YEARWEEK(时间字段名);

-- 按天统计
SELECT DATE(时间字段名) as 日期, COUNT(*) as 数量 FROM 表名 GROUP BY DATE(时间字段名);

-- 按小时统计
SELECT DATE_FORMAT(时间字段名, '%Y-%m-%d %H') as 小时, COUNT(*) as 数量 FROM 表名 GROUP BY DATE_FORMAT(时间字段名, '%Y-%m-%d %H');
```

### 8.2 时间差计算
```sql
-- 计算天数差
SELECT DATEDIFF(NOW(), 时间字段名) as 相差天数 FROM 表名;

-- 计算小时差
SELECT TIMESTAMPDIFF(HOUR, 时间字段名, NOW()) as 相差小时 FROM 表名;

-- 计算分钟差
SELECT TIMESTAMPDIFF(MINUTE, 时间字段名, NOW()) as 相差分钟 FROM 表名;
```

## 九、常用日期函数总结

### 9.1 获取当前时间
```sql
NOW()           -- 当前日期时间
CURDATE()       -- 当前日期
CURTIME()       -- 当前时间
UNIX_TIMESTAMP() -- 当前时间戳
```

### 9.2 日期格式化
```sql
DATE_FORMAT(date, format)  -- 格式化日期
STR_TO_DATE(str, format)   -- 字符串转日期
FROM_UNIXTIME(timestamp)   -- 时间戳转日期
```

### 9.3 日期计算
```sql
DATE_ADD(date, INTERVAL expr unit)  -- 日期加法
DATE_SUB(date, INTERVAL expr unit)  -- 日期减法
DATEDIFF(date1, date2)             -- 日期差（天数）
TIMESTAMPDIFF(unit, date1, date2)  -- 时间差（指定单位）
```

### 9.4 日期提取
```sql
YEAR(date)      -- 提取年份
MONTH(date)     -- 提取月份
DAY(date)       -- 提取日期
HOUR(time)      -- 提取小时
MINUTE(time)    -- 提取分钟
SECOND(time)    -- 提取秒数
WEEKDAY(date)   -- 星期几（0=周一）
DAYOFWEEK(date) -- 星期几（1=周日）
QUARTER(date)   -- 季度
WEEK(date)      -- 第几周
```

## 十、性能优化建议

### 10.1 索引优化
```sql
-- 为日期字段创建索引
CREATE INDEX idx_create_time ON 表名(时间字段名);

-- 复合索引
CREATE INDEX idx_date_status ON 表名(时间字段名, 状态字段);
```

### 10.2 查询优化技巧
1. 尽量使用范围查询而不是函数查询，提高索引使用效率
2. 避免在WHERE条件中对日期字段使用函数
3. 使用BETWEEN替代复杂的日期函数组合
4. 合理使用分区表处理大量历史数据

```sql
-- 优化前（不能使用索引）
SELECT * FROM 表名 WHERE YEAR(时间字段名) = 2024;

-- 优化后（可以使用索引）
SELECT * FROM 表名 WHERE 时间字段名 >= '2024-01-01' AND 时间字段名 < '2025-01-01';
```

通过掌握这些MySQL日期时间SQL语句，您可以灵活地处理各种时间相关的查询需求，提高数据库操作的效率和准确性。记住根据实际业务场景选择最合适的查询方式，并注意性能优化。