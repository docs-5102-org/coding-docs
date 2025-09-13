---
title: 批量重命名表
category:
  - 数据库
tag:
  - MySQL
  - SQL
---

# MySQL 批量重命名表方案

## 目录

[[toc]]

## 概述

本文档提供了MySQL数据库中批量为表添加或删除前缀的完整解决方案，支持多种方法实现表名的批量重命名操作。

## 方案一：查询生成SQL语句（简单快速）

### 1. 查看当前所有表

```sql
-- 方法1：简单查看
SHOW TABLES;

-- 方法2：通过INFORMATION_SCHEMA查看
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'your_database_name';
```

### 2. 生成批量重命名SQL

**添加前缀：**
```sql
SELECT CONCAT('RENAME TABLE ', TABLE_NAME, ' TO yichuang_', TABLE_NAME, ';') AS sql_statement
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'your_database_name';
```

**删除前缀：**
```sql
SELECT CONCAT('RENAME TABLE ', TABLE_NAME, ' TO ', 
              SUBSTRING(TABLE_NAME, LENGTH('yichuang_') + 1), ';') AS sql_statement
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'your_database_name' 
  AND TABLE_NAME LIKE 'yichuang_%';
```

### 3. 执行生成的SQL

将上述查询结果复制并执行即可。

---

## 方案二：存储过程自动化（推荐）

### 添加前缀存储过程

```sql
DELIMITER $$

CREATE PROCEDURE AddPrefixToTables(
    IN database_name VARCHAR(255),
    IN prefix VARCHAR(255)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE table_name VARCHAR(255);
    DECLARE processed_count INT DEFAULT 0;
    
    -- 游标定义
    DECLARE table_cursor CURSOR FOR 
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = database_name
          AND TABLE_TYPE = 'BASE TABLE';
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 参数验证
    IF database_name IS NULL OR database_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '数据库名称不能为空';
    END IF;
    
    IF prefix IS NULL OR prefix = '' THEN
        SET prefix = 'yichuang_';
    END IF;
    
    -- 创建临时表记录处理结果
    DROP TEMPORARY TABLE IF EXISTS temp_rename_log;
    CREATE TEMPORARY TABLE temp_rename_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_name VARCHAR(255),
        new_name VARCHAR(255),
        status VARCHAR(20),
        error_msg TEXT
    );
    
    -- 开始处理
    OPEN table_cursor;
    
    rename_loop: LOOP
        FETCH table_cursor INTO table_name;
        
        IF done THEN
            LEAVE rename_loop;
        END IF;
        
        -- 检查表名是否已有前缀
        IF table_name NOT LIKE CONCAT(prefix, '%') THEN
            BEGIN
                DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
                BEGIN
                    GET DIAGNOSTICS CONDITION 1
                        @error_msg = MESSAGE_TEXT;
                    INSERT INTO temp_rename_log (original_name, new_name, status, error_msg)
                    VALUES (table_name, CONCAT(prefix, table_name), 'FAILED', @error_msg);
                END;
                
                SET @sql = CONCAT('RENAME TABLE ', table_name, ' TO ', prefix, table_name);
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                
                INSERT INTO temp_rename_log (original_name, new_name, status, error_msg)
                VALUES (table_name, CONCAT(prefix, table_name), 'SUCCESS', NULL);
                
                SET processed_count = processed_count + 1;
            END;
        ELSE
            INSERT INTO temp_rename_log (original_name, new_name, status, error_msg)
            VALUES (table_name, table_name, 'SKIPPED', '表名已有指定前缀');
        END IF;
    END LOOP;
    
    CLOSE table_cursor;
    
    -- 输出处理结果
    SELECT 
        processed_count AS '成功处理数量',
        (SELECT COUNT(*) FROM temp_rename_log WHERE status = 'FAILED') AS '失败数量',
        (SELECT COUNT(*) FROM temp_rename_log WHERE status = 'SKIPPED') AS '跳过数量';
    
    SELECT * FROM temp_rename_log ORDER BY id;
END$$

DELIMITER ;
```

### 删除前缀存储过程

```sql
DELIMITER $$

CREATE PROCEDURE RemovePrefixFromTables(
    IN database_name VARCHAR(255),
    IN prefix VARCHAR(255)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE table_name VARCHAR(255);
    DECLARE new_table_name VARCHAR(255);
    DECLARE processed_count INT DEFAULT 0;
    
    DECLARE table_cursor CURSOR FOR 
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = database_name
          AND TABLE_TYPE = 'BASE TABLE'
          AND TABLE_NAME LIKE CONCAT(prefix, '%');
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    -- 参数验证
    IF database_name IS NULL OR database_name = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = '数据库名称不能为空';
    END IF;
    
    IF prefix IS NULL OR prefix = '' THEN
        SET prefix = 'yichuang_';
    END IF;
    
    -- 创建临时表记录处理结果
    DROP TEMPORARY TABLE IF EXISTS temp_remove_log;
    CREATE TEMPORARY TABLE temp_remove_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_name VARCHAR(255),
        new_name VARCHAR(255),
        status VARCHAR(20),
        error_msg TEXT
    );
    
    OPEN table_cursor;
    
    remove_loop: LOOP
        FETCH table_cursor INTO table_name;
        
        IF done THEN
            LEAVE remove_loop;
        END IF;
        
        SET new_table_name = SUBSTRING(table_name, LENGTH(prefix) + 1);
        
        -- 检查新表名是否有效
        IF new_table_name IS NOT NULL AND new_table_name != '' THEN
            BEGIN
                DECLARE CONTINUE HANDLER FOR SQLEXCEPTION
                BEGIN
                    GET DIAGNOSTICS CONDITION 1
                        @error_msg = MESSAGE_TEXT;
                    INSERT INTO temp_remove_log (original_name, new_name, status, error_msg)
                    VALUES (table_name, new_table_name, 'FAILED', @error_msg);
                END;
                
                SET @sql = CONCAT('RENAME TABLE ', table_name, ' TO ', new_table_name);
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
                
                INSERT INTO temp_remove_log (original_name, new_name, status, error_msg)
                VALUES (table_name, new_table_name, 'SUCCESS', NULL);
                
                SET processed_count = processed_count + 1;
            END;
        ELSE
            INSERT INTO temp_remove_log (original_name, new_name, status, error_msg)
            VALUES (table_name, new_table_name, 'FAILED', '移除前缀后表名为空');
        END IF;
    END LOOP;
    
    CLOSE table_cursor;
    
    -- 输出处理结果
    SELECT 
        processed_count AS '成功处理数量',
        (SELECT COUNT(*) FROM temp_remove_log WHERE status = 'FAILED') AS '失败数量';
    
    SELECT * FROM temp_remove_log ORDER BY id;
END$$

DELIMITER ;
```

### 存储过程使用方法

```sql
-- 添加前缀
CALL AddPrefixToTables('your_database_name', 'yichuang_');

-- 删除前缀
CALL RemovePrefixFromTables('your_database_name', 'yichuang_');

-- 使用默认前缀
CALL AddPrefixToTables('your_database_name', '');
```

---

## 方案三：事务安全批量操作

```sql
-- 开始事务
START TRANSACTION;

-- 设置变量
SET @database_name = 'your_database_name';
SET @prefix = 'yichuang_';

-- 生成并执行重命名语句
SET @sql_text = '';
SELECT GROUP_CONCAT(
    CONCAT('RENAME TABLE ', TABLE_NAME, ' TO ', @prefix, TABLE_NAME)
    SEPARATOR '; '
) INTO @sql_text
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = @database_name
  AND TABLE_TYPE = 'BASE TABLE';

-- 执行批量重命名（注意：这需要拆分为多个单独的RENAME语句）
-- 由于GROUP_CONCAT的限制，建议使用存储过程方案

-- 如果一切正常，提交事务
COMMIT;

-- 如果出现问题，回滚事务
-- ROLLBACK;
```

---

## 注意事项与最佳实践

### ⚠️ 执行前必读

1. **权限要求**
   - 确保具有 `ALTER` 和 `DROP` 权限
   - 建议使用具有完整权限的管理员账户

2. **备份策略**
   - **务必在执行前备份数据库**
   - 建议先在测试环境验证

3. **表名冲突检查**
   ```sql
   -- 检查是否存在冲突的表名
   SELECT TABLE_NAME, 
          CONCAT('yichuang_', TABLE_NAME) AS new_name,
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                  WHERE TABLE_SCHEMA = 'your_database_name' 
                  AND TABLE_NAME = CONCAT('yichuang_', TABLE_NAME)
              ) THEN '冲突'
              ELSE '正常'
          END AS status
   FROM INFORMATION_SCHEMA.TABLES
   WHERE TABLE_SCHEMA = 'your_database_name';
   ```

### 🔄 影响范围分析

#### 不受影响的部分
- ✅ 表中的所有数据（行和列）
- ✅ 表结构（字段、索引、约束等）
- ✅ 表的性能特征

#### 可能受影响的部分
- ⚠️ **外键约束**：MySQL 8.0+ 会自动更新，老版本需手动处理
- ⚠️ **视图定义**：需要手动更新引用的表名
- ⚠️ **存储过程/函数**：需要更新内部的表名引用
- ⚠️ **触发器**：需要更新相关的表名引用
- ⚠️ **应用程序代码**：需要同步更新硬编码的表名

### 📋 依赖关系检查

```sql
-- 查看外键依赖
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_SCHEMA = 'your_database_name'
  AND REFERENCED_TABLE_NAME IN (
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'your_database_name'
  );

-- 查看视图依赖
SELECT TABLE_NAME, VIEW_DEFINITION
FROM INFORMATION_SCHEMA.VIEWS
WHERE TABLE_SCHEMA = 'your_database_name';
```

### 🔧 清理操作

```sql
-- 删除创建的存储过程（如不再需要）
DROP PROCEDURE IF EXISTS AddPrefixToTables;
DROP PROCEDURE IF EXISTS RemovePrefixFromTables;
```

---

## 常见问题解决

### Q1: 存储过程执行失败
**A:** 检查权限、表名冲突、语法错误等，查看错误日志获取详细信息。

### Q2: 部分表重命名失败
**A:** 使用存储过程的日志功能查看具体失败原因，通常是权限或约束问题。

### Q3: 如何回滚操作
**A:** 使用删除前缀的存储过程，或提前准备回滚SQL脚本。

### Q4: 大量表的性能问题
**A:** 存储过程会逐个处理，对于大量表建议分批执行或在业务低峰期进行。

---

## 总结

本方案提供了三种不同复杂度的解决方案：
1. **简单方案**：手动生成SQL，适合少量表的一次性操作
2. **自动化方案**：存储过程，适合频繁操作和大量表的场景
3. **安全方案**：事务包装，提供回滚保障

建议根据实际需求选择合适的方案，并始终遵循备份优先的原则。