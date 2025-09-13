---
title: CONVERT日期格式说明 
category:
  - 数据库
tag:
  - SqlServer
---

# SQL Server 中 `CONVERT` 日期格式说明


在 SQL Server 中，`CONVERT` 函数的第三个参数用于指定日期时间的格式化样式。常见的样式代码如下：

| 样式代码 | 输出格式 | 示例 |
|----------|----------|------|
| 100 或 0 | mon dd yyyy hh:miAM (或 PM) | Apr 19 2014 12:00AM |
| 101      | mm/dd/yy | 04/19/14 |
| 102      | yy.mm.dd | 14.04.19 |
| 103      | dd/mm/yy | 19/04/14 |
| 104      | dd.mm.yy | 19.04.14 |
| 105      | dd-mm-yy | 19-04-14 |
| 106      | dd mon yy | 19 Apr 14 |
| 107      | Mon dd, yy | Apr 19, 14 |
| **108**  | **hh:mm:ss** | **12:00:00** |
| 109 或 9 | mon dd yyyy hh:mi:ss:mmmAM (或 PM) | Apr 19 2014 12:00:00:000AM |
| 110      | mm-dd-yy | 04-19-14 |
| 111      | yy/mm/dd | 14/04/19 |
| 112      | yymmdd | 20140419 |
| 113 或 13 | dd mon yyyy hh:mm:ss:mmm(24h) | 19 Apr 2014 00:00:00:000 |
| 114      | hh:mi:ss:mmm(24h) | 00:00:00:000 |
| 120 或 20 | yyyy-mm-dd hh:mi:ss(24h) | 2014-04-19 00:00:00 |
| 121 或 21 | yyyy-mm-dd hh:mi:ss.mmm(24h) | 2014-04-19 00:00:00.000 |
| 126      | yyyy-mm-ddThh:mm:ss.mmm (无空格) | 2014-04-19T00:00:00.000 |
| 130      | dd mon yyyy hh:mi:ss:mmmAM | 19 Apr 2014 12:00:00:000AM |
| 131      | dd/mm/yy hh:mi:ss:mmmAM | 19/04/14 12:00:00:000AM |

---

## `108` 的含义

在 `CONVERT` 中，`108` 表示 **时间格式**，输出为：

```
hh\:mm\:ss
```

即只显示时、分、秒，不包含日期部分。  
例如：

```sql
SELECT CONVERT(VARCHAR(8), GETDATE(), 108);
```

结果可能为：

```
23:14:59
```

---

## 示例：将毫秒时间戳转换为指定格式

假设有一个毫秒时间戳 `1397836800000`，希望将其转换为 `20140419`（`112` 格式）。

SQL 写法如下：

```sql
SELECT CONVERT(
    NVARCHAR(10),
    DATEADD(SECOND, 1397836800000/1000, '1970-01-01 08:00:00'),
    112
) AS logdate;
```

### 结果

```
20140419
```

这里：

* `DATEADD(SECOND, 1397836800000/1000, '1970-01-01 08:00:00')`
  将毫秒数转为秒，并加到 Unix Epoch（1970-01-01 08:00:00，北京时区）上。
* `CONVERT(..., 112)`
  将时间格式化为 `yymmdd`，即 `20140419`。

---

## 总结

* `CONVERT` 第三个参数用于指定日期输出格式。
* `108` 代表 `hh:mm:ss`，即只保留时间部分。
* `112` 代表 `yymmdd`，常用于日志日期字段存储。