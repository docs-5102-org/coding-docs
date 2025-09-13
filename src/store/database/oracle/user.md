---
title: 创建用户和表指南
  - 数据库
tag:
  - Oracle
---

# Oracle 创建用户和表指南

## 目录

[[toc]]

## 概述

在Oracle数据库管理中，创建用户和表是基础而重要的操作。本文档将详细介绍如何使用PLSQL Developer工具和SQL命令来创建和管理Oracle用户、表空间以及数据表，包括权限管理和最佳实践。

## 1. Oracle用户类型概述

### 1.1 用户类型分类

Oracle数据库中主要包含以下几种用户类型：

| 用户类型 | 用户名示例 | 权限级别 | 主要用途 |
|----------|------------|----------|----------|
| 超级管理员 | SYS | SYSDBA | 数据库最高权限，可创建表空间 |
| 普通管理员 | SYSTEM | DBA | 管理权限，但不能创建表空间 |
| 普通用户 | SCOTT | CONNECT | 一般业务用户 |
| 应用用户 | 自定义用户 | 自定义 | 应用程序专用用户 |

### 1.2 用户权限区别

- **SYS用户**：超级用户，具有SYSDBA权限，可以创建表空间
- **SYSTEM用户**：管理员用户，但不能创建表空间
- **普通用户**：需要授予相应权限才能进行数据库操作

## 2. 使用PLSQL Developer创建用户

### 2.1 登录系统用户

#### 操作步骤：

1. **启动PLSQL Developer**
2. **选择登录用户**：使用 `SYS`（Oracle系统用户）登录
3. **重要设置**：登录时必须选择 **SYSDBA** 模式
   - 系统用户登录：选择 SYSDBA
   - 普通用户登录：选择 Normal

> **⚠️ 注意**：SYS用户必须以SYSDBA身份登录，否则无法执行系统级操作。

### 2.2 创建表空间

在创建用户之前，通常需要先创建专用的表空间：

```sql
-- 创建表空间语句
CREATE TABLESPACE train_tab
DATAFILE 'E:\oracle\train\train_tab.def' 
SIZE 100M                    -- 生成数据文件并定义文件大小
AUTOEXTEND ON 
NEXT 10M 
MAXSIZE UNLIMITED           -- 设置自动扩展
LOGGING
EXTENT MANAGEMENT LOCAL AUTOALLOCATE
SEGMENT SPACE MANAGEMENT AUTO;
```

#### 表空间参数说明：

- **DATAFILE**：指定数据文件路径和名称
- **SIZE**：初始大小
- **AUTOEXTEND ON**：启用自动扩展
- **NEXT**：每次扩展的大小
- **MAXSIZE UNLIMITED**：最大大小不限制
- **LOGGING**：启用日志记录

### 2.3 创建用户

#### 基本语法：

```sql
-- 创建用户基本语法
CREATE USER username 
IDENTIFIED BY password
DEFAULT TABLESPACE tablespace_name
TEMPORARY TABLESPACE temp_tablespace_name;
```

#### 实际示例：

```sql
-- 创建用户示例
CREATE USER student 
IDENTIFIED BY student 
DEFAULT TABLESPACE users
TEMPORARY TABLESPACE temp;
```

#### Oracle 12c特殊说明：

Oracle 12c引入了容器数据库(CDB)和可插拔数据库(PDB)的概念：

```sql
-- Oracle 12c中创建用户（避免ORA-65096错误）
-- 方法1：创建本地用户（推荐）
ALTER SESSION SET "_ORACLE_SCRIPT"=true;
CREATE USER c##username IDENTIFIED BY password;

-- 方法2：在PDB中创建用户
ALTER SESSION SET CONTAINER = pdb_name;
CREATE USER username IDENTIFIED BY password;
```

## 3. 用户权限管理

### 3.1 基本权限授予

#### 连接权限：

```sql
-- 授予连接权限
GRANT CONNECT TO username;
```

#### 资源权限：

```sql
-- 授予资源权限（创建表、序列等）
GRANT RESOURCE TO username;
```

#### DBA权限：

```sql
-- 授予DBA权限（数据库管理员权限）
GRANT DBA TO username;
```

### 3.2 权限管理最佳实践

#### 完整的用户创建和授权流程：

```sql
-- 1. 创建用户
CREATE USER myuser 
IDENTIFIED BY mypassword
DEFAULT TABLESPACE users
TEMPORARY TABLESPACE temp;

-- 2. 授予基本权限
GRANT CONNECT TO myuser;
GRANT RESOURCE TO myuser;

-- 3. 授予表空间配额
ALTER USER myuser QUOTA UNLIMITED ON users;

-- 4. 可选：授予DBA权限（谨慎使用）
-- GRANT DBA TO myuser;
```

### 3.3 权限回收

```sql
-- 回收权限示例
REVOKE DBA FROM username;
REVOKE CONNECT FROM username;

-- 撤销表空间权限
REVOKE UNLIMITED TABLESPACE FROM username;
```

## 4. 创建数据表

### 4.1 表创建基础语法

```sql
-- 基本创建表语法
CREATE TABLE table_name (
    column1 datatype [constraint],
    column2 datatype [constraint],
    ...
    [table_constraint]
);
```

### 4.2 数据类型选择

#### 常用数据类型：

| 数据类型 | 说明 | 示例 |
|----------|------|------|
| VARCHAR2(n) | 变长字符串 | VARCHAR2(50) |
| NUMBER(p,s) | 数值类型 | NUMBER(10,2) |
| DATE | 日期类型 | DATE |
| TIMESTAMP | 时间戳 | TIMESTAMP |
| CLOB | 大文本对象 | CLOB |
| BLOB | 二进制大对象 | BLOB |

### 4.3 创建表实例

#### 基本表创建：

```sql
-- 创建学生信息表
CREATE TABLE students (
    student_id NUMBER(10) PRIMARY KEY,
    student_name VARCHAR2(50) NOT NULL,
    student_email VARCHAR2(100) UNIQUE,
    birth_date DATE,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gpa NUMBER(3,2) CHECK (gpa >= 0 AND gpa <= 4.0),
    is_active CHAR(1) DEFAULT 'Y' CHECK (is_active IN ('Y', 'N'))
);
```

#### 带外键的表创建：

```sql
-- 创建课程表
CREATE TABLE courses (
    course_id NUMBER(10) PRIMARY KEY,
    course_name VARCHAR2(100) NOT NULL,
    credits NUMBER(2) DEFAULT 3,
    department_id NUMBER(10)
);

-- 创建选课表（包含外键）
CREATE TABLE enrollments (
    enrollment_id NUMBER(10) PRIMARY KEY,
    student_id NUMBER(10),
    course_id NUMBER(10),
    enrollment_date DATE DEFAULT SYSDATE,
    grade CHAR(2),
    CONSTRAINT fk_student FOREIGN KEY (student_id) 
        REFERENCES students(student_id),
    CONSTRAINT fk_course FOREIGN KEY (course_id) 
        REFERENCES courses(course_id)
);
```

### 4.4 表约束类型

#### 主要约束类型：

```sql
-- 主键约束
CONSTRAINT pk_table_name PRIMARY KEY (column_name)

-- 外键约束
CONSTRAINT fk_constraint_name FOREIGN KEY (column_name) 
    REFERENCES parent_table(parent_column)

-- 唯一约束
CONSTRAINT uk_constraint_name UNIQUE (column_name)

-- 检查约束
CONSTRAINT ck_constraint_name CHECK (condition)

-- 非空约束
column_name datatype NOT NULL
```

## 5. 表空间管理

### 5.1 查看表空间信息

```sql
-- 查看所有表空间
SELECT tablespace_name, status, contents 
FROM dba_tablespaces;

-- 查看表空间使用情况
SELECT 
    df.tablespace_name,
    df.size_mb,
    df.size_mb - NVL(fs.free_mb, 0) AS used_mb,
    NVL(fs.free_mb, 0) AS free_mb,
    ROUND((df.size_mb - NVL(fs.free_mb, 0)) / df.size_mb * 100, 2) AS used_percent
FROM (
    SELECT 
        tablespace_name,
        ROUND(SUM(bytes) / 1024 / 1024, 2) AS size_mb
    FROM dba_data_files
    GROUP BY tablespace_name
) df
LEFT JOIN (
    SELECT 
        tablespace_name,
        ROUND(SUM(bytes) / 1024 / 1024, 2) AS free_mb
    FROM dba_free_space
    GROUP BY tablespace_name
) fs ON df.tablespace_name = fs.tablespace_name;
```

### 5.2 临时表空间创建

```sql
-- 查看现有临时表空间
SELECT name FROM v$tempfile;

-- 创建临时表空间
CREATE TEMPORARY TABLESPACE temp_new
TEMPFILE '/u01/app/oracle/oradata/orcl/temp_new01.dbf' 
SIZE 100M
AUTOEXTEND ON 
NEXT 10M 
MAXSIZE UNLIMITED;
```

## 6. 高级操作和最佳实践

### 6.1 使用子查询创建表

```sql
-- 通过子查询创建表（复制数据）
CREATE TABLE students_backup AS
SELECT * FROM students;

-- 通过子查询创建表结构（不复制数据）
CREATE TABLE students_template AS
SELECT * FROM students WHERE 1=0;
```

### 6.2 表的修改操作

#### 添加列：

```sql
-- 添加新列
ALTER TABLE students 
ADD (phone_number VARCHAR2(20), address CLOB);
```

#### 修改列：

```sql
-- 修改列数据类型
ALTER TABLE students 
MODIFY student_name VARCHAR2(100);
```

#### 删除列：

```sql
-- 删除列
ALTER TABLE students 
DROP COLUMN phone_number;
```

### 6.3 索引创建

```sql
-- 创建普通索引
CREATE INDEX idx_student_name ON students(student_name);

-- 创建复合索引
CREATE INDEX idx_student_email_date ON students(student_email, enrollment_date);

-- 创建唯一索引
CREATE UNIQUE INDEX idx_student_email_unique ON students(student_email);
```

## 7. 常见问题和解决方案

### 7.1 Oracle 12c用户创建问题

#### 问题：ORA-65096: 公用用户名或角色无效

**解决方案：**

```sql
-- 方法1：设置Oracle脚本模式
ALTER SESSION SET "_ORACLE_SCRIPT"=true;
CREATE USER username IDENTIFIED BY password;

-- 方法2：使用c##前缀创建公共用户
CREATE USER c##username IDENTIFIED BY password;

-- 方法3：在PDB中创建本地用户
ALTER SESSION SET CONTAINER = your_pdb_name;
CREATE USER username IDENTIFIED BY password;
```

### 7.2 权限不足问题

#### 问题：ORA-01031: 权限不足

**解决方案：**

```sql
-- 检查当前用户权限
SELECT * FROM user_sys_privs;
SELECT * FROM user_role_privs;

-- 使用具有足够权限的用户授权
GRANT CREATE SESSION TO username;
GRANT CREATE TABLE TO username;
GRANT CREATE SEQUENCE TO username;
```

### 7.3 表空间不足问题

#### 问题：ORA-01654: 无法扩展索引

**解决方案：**

```sql
-- 扩展表空间
ALTER TABLESPACE users 
ADD DATAFILE '/u01/app/oracle/oradata/orcl/users02.dbf' 
SIZE 100M AUTOEXTEND ON;

-- 或者扩展现有数据文件
ALTER DATABASE 
DATAFILE '/u01/app/oracle/oradata/orcl/users01.dbf' 
RESIZE 500M;
```

## 8. 用户和表管理脚本示例

### 8.1 完整的用户创建脚本

```sql
-- ===== 完整的用户创建和权限配置脚本 =====

-- 1. 创建表空间
CREATE TABLESPACE app_data
DATAFILE '/u01/app/oracle/oradata/orcl/app_data01.dbf'
SIZE 100M
AUTOEXTEND ON
NEXT 10M
MAXSIZE 1G
LOGGING
EXTENT MANAGEMENT LOCAL AUTOALLOCATE
SEGMENT SPACE MANAGEMENT AUTO;

-- 2. 创建临时表空间
CREATE TEMPORARY TABLESPACE app_temp
TEMPFILE '/u01/app/oracle/oradata/orcl/app_temp01.dbf'
SIZE 50M
AUTOEXTEND ON
NEXT 5M
MAXSIZE 500M;

-- 3. 创建用户
CREATE USER app_user
IDENTIFIED BY app_password
DEFAULT TABLESPACE app_data
TEMPORARY TABLESPACE app_temp
QUOTA UNLIMITED ON app_data;

-- 4. 授予权限
GRANT CONNECT TO app_user;
GRANT RESOURCE TO app_user;
GRANT CREATE VIEW TO app_user;
GRANT CREATE SYNONYM TO app_user;
GRANT CREATE SEQUENCE TO app_user;

-- 5. 验证用户创建
SELECT username, default_tablespace, temporary_tablespace, created
FROM dba_users
WHERE username = 'APP_USER';
```

### 8.2 清理脚本

```sql
-- ===== 清理脚本 =====

-- 1. 删除用户及其对象
DROP USER app_user CASCADE;

-- 2. 删除表空间及数据文件
DROP TABLESPACE app_data INCLUDING CONTENTS AND DATAFILES;
DROP TABLESPACE app_temp INCLUDING CONTENTS AND DATAFILES;
```

## 9. 监控和维护

### 9.1 用户监控

```sql
-- 查看当前连接的用户
SELECT username, sid, serial#, status, program
FROM v$session
WHERE username IS NOT NULL;

-- 查看用户权限
SELECT grantee, privilege, admin_option
FROM dba_sys_privs
WHERE grantee = 'USERNAME';

-- 查看用户拥有的角色
SELECT grantee, granted_role, admin_option, default_role
FROM dba_role_privs
WHERE grantee = 'USERNAME';
```

### 9.2 表监控

```sql
-- 查看用户拥有的表
SELECT table_name, tablespace_name, num_rows, last_analyzed
FROM user_tables
ORDER BY table_name;

-- 查看表大小
SELECT 
    segment_name,
    segment_type,
    tablespace_name,
    ROUND(bytes/1024/1024, 2) AS size_mb
FROM user_segments
WHERE segment_type = 'TABLE'
ORDER BY bytes DESC;
```

## 总结

Oracle数据库中创建用户和表是数据库管理的基础操作。关键要点包括：

### 核心要点：
1. **用户类型理解**：区分SYS、SYSTEM和普通用户的权限差异
2. **表空间管理**：合理规划和创建表空间
3. **权限控制**：按需授予最小必要权限
4. **版本差异**：注意Oracle 12c的CDB/PDB架构变化
5. **最佳实践**：遵循命名规范和安全原则

### 操作流程：
1. 以SYSDBA身份登录
2. 创建表空间
3. 创建用户并指定表空间
4. 授予必要权限
5. 创建表和其他数据库对象
6. 定期监控和维护

### 参考资料

- https://blog.csdn.net/cs6480012/article/details/80771115