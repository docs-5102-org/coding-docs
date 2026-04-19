---
title: MySQL Redo Log 与 Undo Log 详解 ⭐️⭐️⭐️⭐️⭐️
category:
  - 数据库
tag:
  - MySQL
---

# MySQL Redo Log 与 Undo Log 详解

## 一、Redo Log（重做日志）

### 1.1 核心作用
Redo Log 是 InnoDB 存储引擎特有的日志，用于保证事务的**持久性（Durability）**。它记录的是数据页的物理修改操作，即"在某个数据页的某个偏移量处修改了几字节的数据"。

### 1.2 WAL 原则（Write-Ahead Logging）

**先写日志，再写磁盘**，这是 Redo Log 的核心机制：

1. **修改数据时**：事务修改数据不会立即写入磁盘数据文件，而是先将修改操作记录到 Redo Log 中
2. **为什么这样做**：
   - 顺序写 Redo Log 比随机写数据页快得多
   - 可以将多次随机写转换为一次顺序写
   - 提高数据库性能

### 1.3 工作流程

```
事务修改数据
    ↓
1. 修改 Buffer Pool 中的数据页（内存操作）
    ↓
2. 生成 Redo Log，写入 Redo Log Buffer（内存）
    ↓
3. 事务提交时，Redo Log Buffer 刷盘到 Redo Log File（磁盘）  ← 补充
    ↓
4. 在特定时机刷盘到 Redo Log File（checkpoint 等触发）
    ↓
5. 后台线程异步将脏页刷入数据文件
```

### 1.4 刷盘时机

Redo Log 从内存刷到磁盘的触发条件：

1. **事务提交时**（根据 `innodb_flush_log_at_trx_commit` 参数）
   - 0：延迟写入，每秒刷盘（性能最好，可能丢失1秒数据）
   - 1：实时写入并刷盘（最安全，默认值）
   - 2：实时写入 OS Cache，每秒刷盘（折中方案）

2. **Redo Log Buffer 空间不足时**（默认 16MB）

3. **后台线程定期刷盘**（每秒一次）

4. **正常关闭数据库时**

5. **做 Checkpoint 时**

### 1.5 文件组织结构

Redo Log 由多个物理文件组成**循环使用**的日志文件组：

```
ib_logfile0 → ib_logfile1 → ib_logfile2 → ... → ib_logfile0（循环）
```

**关键概念**：
- **write pos**：当前记录的位置，边写边后移
- **checkpoint**：当前要擦除的位置，擦除前需确保对应数据页已刷盘
- 当 write pos 追上 checkpoint，说明日志文件满了，需要停下来推进 checkpoint（刷脏页）

### 1.6 崩溃恢复

数据库崩溃重启时的恢复流程：

1. **扫描 Redo Log**：从最后一个 Checkpoint 开始读取 Redo Log
2. **重做操作**：将已提交但未刷盘的事务重新执行一遍
3. **保证持久性**：确保已提交事务的修改不会丢失

**示例场景**：
```
事务 A 提交 → Redo Log 已刷盘 → 脏页未刷盘 → 系统崩溃
恢复时：根据 Redo Log 重新应用事务 A 的修改
```

---

## 二、Undo Log（回滚日志）

### 2.1 核心作用

Undo Log 有两大关键作用：

1. **实现事务回滚**：保证事务的**原子性（Atomicity）**
2. **实现 MVCC**：保证事务的**隔离性（Isolation）**，提供多版本并发控制

### 2.2 记录内容

Undo Log 记录的是**逻辑日志**，存储的是数据修改前的反向操作：

| 原始操作 | Undo Log 记录 |
|---------|--------------|
| INSERT  | 记录主键，回滚时执行 DELETE |
| DELETE  | 记录完整行数据，回滚时执行 INSERT |
| UPDATE  | 记录修改前的旧值，回滚时执行反向 UPDATE |

### 2.3 工作流程

#### 2.3.1 事务回滚流程

```
BEGIN;
UPDATE user SET age = 25 WHERE id = 1;  -- 原值 age = 20
ROLLBACK;

执行过程：
1. 修改前：Undo Log 记录 "UPDATE user SET age = 20 WHERE id = 1"
2. 执行修改：age 改为 25
3. 回滚时：根据 Undo Log 将 age 改回 20
```

#### 2.3.2 MVCC 实现流程

在可重复读（REPEATABLE READ）隔离级别下：

```
时刻 T1：事务 A 开始，第一次查询 id=1 的记录
        - 读取当前记录 age=20（DB_TRX_ID=100）
        - 可见性判断：可见 ✓
        - 返回 age=20
        
时刻 T2：事务 B 修改 id=1 的记录并提交
        - 更新当前记录为 age=25（DB_TRX_ID=200）
        - 原值 age=20 保存到 Undo Log 中
        
时刻 T3：事务 A 第二次查询 id=1 的记录
        - 读取到当前记录 age=25（DB_TRX_ID=200）
        - 可见性判断：不可见 ✗（事务200在事务A的ReadView之后提交）
        - 通过 DB_ROLL_PTR 回溯到 Undo Log
        - 读取历史版本 age=20（DB_TRX_ID=100）
        - 可见性判断：可见 ✓
        - 返回 age=20

结果：事务 A 两次查询都返回 age=20，但获取路径不同
      ┌─────────────────────────────────────────────────┐
      │ 第一次：直接读当前记录（age=20）                  │
      │ 第二次：读到当前记录（age=25）→ 不可见            │
      │        → 回溯 Undo Log → 找到历史版本（age=20）  │
      └─────────────────────────────────────────────────┘
```

**MVCC 原理**

每行数据有隐藏字段：`DB_TRX_ID`（事务ID）、`DB_ROLL_PTR`（回滚指针）。

`DB_ROLL_PTR` 指向 Undo Log 中的历史版本，形成版本链。版本链由**写操作**（INSERT / UPDATE / DELETE）产生，查询本身不写入 Undo Log，只沿链回溯读取。

```
当前数据页（最新）
┌─────────────────────────┐
│ age=25  DB_TRX_ID=200   │  ← 事务B UPDATE 产生
│ DB_ROLL_PTR ──────┐     │
└───────────────────│─────┘
                    ↓
              Undo Log 节点1
        ┌─────────────────────────┐
        │ age=20  DB_TRX_ID=100   │  ← 事务B UPDATE 时记录的旧值
        │ DB_ROLL_PTR ──────┐     │
        └───────────────────│─────┘
                            ↓
                      Undo Log 节点2
                ┌─────────────────────────┐
                │ age=15  DB_TRX_ID=50    │  ← 更早的历史版本
                │ DB_ROLL_PTR = null      │  ← 链的终点
                └─────────────────────────┘
```

通过 **ReadView（快照）+ 版本链** 实现不同事务看到不同的数据版本：

| 组件 | 作用 |
|------|------|
| `DB_TRX_ID` | 标记该版本由哪个事务写入 |
| `DB_ROLL_PTR` | 指向上一个历史版本，串联成链 |
| `ReadView` | 事务开始时生成的快照，决定哪些版本可见 |
| `Undo Log` | 存储历史版本旧值，由写操作产生，查询只读不写 |

> **关键**：数据表中只有一条物理记录（最新版本），所有历史版本都存在 Undo Log 中。查询时如果当前版本不可见，则顺着 `DB_ROLL_PTR` 依次回溯，直到找到第一个可见版本为止。

### 2.4 两种 Undo Log 类型

#### 2.4.1 Insert Undo Log

- **作用**：用于 INSERT 操作的回滚
- **特点**：事务提交后立即删除
- **原因**：新插入的数据只对当前事务可见，提交后其他事务也能看到，不需要保留

#### 2.4.2 Update Undo Log

- **作用**：用于 UPDATE 和 DELETE 操作的回滚
- **特点**：事务提交后不能立即删除
- **原因**：需要为 MVCC 提供历史版本数据
- **清理时机**：当没有其他事务需要这个历史版本时，由 **Purge 线程**清理

### 2.5 存储位置

Undo Log 存储在**回滚段（Rollback Segment）**中：

- **位置**：存储在共享表空间或独立 Undo 表空间
- **结构**：每个回滚段包含 1024 个 Undo Log Slot
- **并发支持**：InnoDB 支持 128 个回滚段，可同时支持 128 × 1024 个并发事务

### 2.6 Purge 线程清理机制

**清理流程**：

1. **判断条件**：检查 Undo Log 记录是否还被其他活跃事务需要
2. **清理 Undo Log**：删除不再需要的 Update Undo Log
3. **清理数据页**：对于 DELETE 操作标记删除的记录，真正从数据页中删除

**为什么需要延迟清理**：
```
T1：事务 A 开始（ReadView 创建）
T2：事务 B 删除一条记录并提交
T3：事务 A 查询该记录

事务 A 仍能看到被删除的记录（通过 Undo Log），
所以不能立即清理 Undo Log
```

---

## 三、Redo Log 与 Undo Log 的协作

### 3.1 一个完整的事务流程

```
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 1;

执行步骤：
1. 生成 Undo Log：记录 balance 原值
2. 修改 Buffer Pool 中的数据页
3. 生成 Redo Log：记录物理修改操作
4. Redo Log 写入 Redo Log Buffer

COMMIT;

提交步骤：
5. Redo Log 刷盘（根据参数配置）
6. 事务提交成功
7. 后台异步刷脏页到数据文件
8. Purge 线程择机清理 Undo Log
```

### 3.2 崩溃恢复的完整过程

**场景**：事务 A 已提交，事务 B 未提交，系统崩溃

```
恢复步骤：
1. 扫描 Redo Log，找到所有已提交事务
2. 重做事务 A 的修改（保证持久性）
3. 扫描 Undo Log，找到未提交事务 B
4. 回滚事务 B 的修改（保证原子性）
5. 数据库恢复到一致性状态
```

### 3.3 两者的对比

| 特性 | Redo Log | Undo Log |
|------|----------|----------|
| **日志类型** | 物理日志（数据页修改） | 逻辑日志（反向操作） |
| **主要作用** | 保证持久性（Durability） | 保证原子性和隔离性 |
| **记录内容** | 修改后的数据 | 修改前的数据 |
| **使用时机** | 崩溃恢复时重做 | 事务回滚、MVCC 读取 |
| **文件结构** | 循环写入固定文件组 | 存储在回滚段 |
| **清理策略** | 覆盖写（循环利用） | Purge 线程清理 |

---

## 四、重要参数配置

### 4.1 Redo Log 相关参数

```sql
-- 事务提交时的刷盘策略（0/1/2）
innodb_flush_log_at_trx_commit = 1

-- Redo Log 文件大小
innodb_log_file_size = 512M

-- Redo Log 文件数量
innodb_log_files_in_group = 2

-- Redo Log Buffer 大小
innodb_log_buffer_size = 16M
```

### 4.2 Undo Log 相关参数

```sql
-- 回滚段数量
innodb_rollback_segments = 128

-- Undo 表空间数量
innodb_undo_tablespaces = 2

-- Undo 日志保留大小
innodb_max_undo_log_size = 1G

-- Purge 线程数量
innodb_purge_threads = 4
```

---

## 五、总结

**Redo Log**：
- 记录"做了什么"（物理修改）
- 保证已提交事务不丢失（持久性）
- 顺序写入，循环使用
- 崩溃恢复时用于重做

**Undo Log**：
- 记录"怎么撤销"（反向操作）
- 保证事务可回滚（原子性）
- 支持 MVCC（隔离性）
- 提交后延迟清理

两者共同协作，构成了 MySQL InnoDB 存储引擎 ACID 特性的核心实现机制。