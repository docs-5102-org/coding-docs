---
title: 触发器
category:
  - 数据库
tag:
  - SqlServer
  - 触发器
  - Trigger
---

# SQL 触发器

## 目录

[[toc]]

## 1. 什么是触发器？

触发器（Trigger）是 **一种特殊的存储过程**，它在对某个表或视图进行 `INSERT`、`UPDATE`、`DELETE` 操作时自动触发执行。

- **触发器特点：**
  - 绑定在某个表或视图上；
  - 由特定事件自动激活；
  - 常用于保持数据一致性和完整性；
  - 无法手动执行，只能由数据库事件触发。

---

## 2. 为什么使用触发器？

- 保证数据一致性：如修改主表数据时，自动维护子表；
- 实现复杂的业务规则：如强制计算金额、库存等；
- 数据审计：记录数据修改日志。

**示例场景：**

- 学生表 `Student` 与借书记录表 `BorrowRecord`：
  1. 修改学号时，借书记录中的学号也同步修改；
  2. 删除学生时，自动删除其借书记录。

---

## 3. 触发器中的虚拟表

触发器中系统提供了两个 **虚拟表**：

| 操作类型 | `Inserted` 存放内容 | `Deleted` 存放内容 |
|----------|----------------------|---------------------|
| `INSERT` | 新插入的记录         | 无                  |
| `UPDATE` | 更新后的记录         | 更新前的记录        |
| `DELETE` | 无                   | 被删除的记录        |

> ⚠️ 注意：`UPDATE` 操作等价于一次 `DELETE + INSERT`。

---

## 4. 基础示例

### 示例 1：更新触发器（同步学号）

```sql
CREATE TRIGGER truStudent
ON Student
FOR UPDATE
AS
    IF UPDATE(StudentID)
    BEGIN
        UPDATE BorrowRecord
        SET StudentID = i.StudentID
        FROM BorrowRecord br
        JOIN Deleted d ON br.StudentID = d.StudentID
        JOIN Inserted i ON 1=1
    END
````

说明：

* 当 `Student` 表的 `StudentID` 更新时，自动更新 `BorrowRecord` 表中的学号。

---

### 示例 2：删除触发器（级联删除）

```sql
CREATE TRIGGER trdStudent
ON Student
FOR DELETE
AS
    DELETE BorrowRecord
    FROM BorrowRecord br
    JOIN Deleted d ON br.StudentID = d.StudentID
```

说明：

* 当学生被删除时，同时删除其借书记录。

---

## 5. 实战案例：卷烟库存 & 销售

### 表结构

```sql
-- 卷烟销售表
CREATE TABLE 卷烟销售表 (
    卷烟品牌   VARCHAR(40) PRIMARY KEY NOT NULL,
    购货商     VARCHAR(40) NULL,
    销售数量   INT NULL,
    销售单价   MONEY NULL,
    销售金额   MONEY NULL
);

-- 卷烟库存表
CREATE TABLE 卷烟库存表 (
    卷烟品牌   VARCHAR(40) PRIMARY KEY NOT NULL,
    库存数量   INT NULL,
    库存单价   MONEY NULL,
    库存金额   MONEY NULL
);
```

---

### 示例 3：插入库存触发器

保证 **库存金额 = 库存数量 × 库存单价**。

```sql
CREATE TRIGGER T_INSERT_卷烟库存表
ON 卷烟库存表
FOR INSERT
AS
BEGIN TRANSACTION
    UPDATE 卷烟库存表
    SET 库存金额 = 库存数量 * 库存单价
    WHERE 卷烟品牌 IN (SELECT 卷烟品牌 FROM Inserted)
COMMIT TRANSACTION
```

---

### 示例 4：插入销售触发器

业务规则：

1. 卷烟必须有库存且库存数量大于 0；
2. 自动计算 **销售金额**；
3. 自动减少库存。

```sql
CREATE TRIGGER T_INSERT_卷烟销售表
ON 卷烟销售表
FOR INSERT
AS
BEGIN TRANSACTION
    -- 校验库存是否存在
    IF NOT EXISTS (
        SELECT 1 FROM 卷烟库存表
        WHERE 卷烟品牌 IN (SELECT 卷烟品牌 FROM Inserted)
    )
    BEGIN
        RAISERROR('错误！该卷烟不存在库存，不能销售。',16,1)
        ROLLBACK
        RETURN
    END

    -- 校验库存是否大于0
    IF EXISTS (
        SELECT 1 FROM 卷烟库存表
        WHERE 卷烟品牌 IN (SELECT 卷烟品牌 FROM Inserted) 
          AND 库存数量 <= 0
    )
    BEGIN
        RAISERROR('错误！该卷烟库存小于等于0，不能销售。',16,1)
        ROLLBACK
        RETURN
    END

    -- 计算销售金额
    UPDATE 卷烟销售表
    SET 销售金额 = 销售数量 * 销售单价
    WHERE 卷烟品牌 IN (SELECT 卷烟品牌 FROM Inserted)

    -- 更新库存
    DECLARE @卷烟品牌 VARCHAR(40), @销售数量 INT
    SELECT @卷烟品牌 = 卷烟品牌, @销售数量 = 销售数量 FROM Inserted

    UPDATE 卷烟库存表
    SET 库存数量 = 库存数量 - @销售数量,
        库存金额 = (库存数量 - @销售数量) * 库存单价
    WHERE 卷烟品牌 = @卷烟品牌
COMMIT TRANSACTION
```

---

## 6. 触发器语法

```sql
CREATE TRIGGER trigger_name
ON { table | view }
[ WITH ENCRYPTION ]
{ FOR | AFTER | INSTEAD OF } { [INSERT], [UPDATE], [DELETE] }
AS
    sql_statement [ ...n ]
```

* **FOR/AFTER**：在操作完成后执行；
* **INSTEAD OF**：替代操作执行（可用于视图）；
* **INSERT/UPDATE/DELETE**：触发条件；
* **Inserted/Deleted**：虚拟表，存放新旧记录。

---

## 7. 注意事项

1. `DELETE` 触发器不能捕获 `TRUNCATE TABLE`；
2. 触发器中禁止使用如下语句：

   * `CREATE DATABASE`、`DROP DATABASE`、`RESTORE DATABASE` 等；
3. 触发器最多嵌套 32 层；
4. 修改触发器：`ALTER TRIGGER ...`；
5. 删除触发器：`DROP TRIGGER ...`。

---

## 8. 总结

* 触发器是保证数据完整性和执行业务逻辑的重要手段；
* 熟练使用 `Inserted`、`Deleted` 虚拟表是关键；
* 应避免过度使用触发器，以免影响性能和可维护性。
