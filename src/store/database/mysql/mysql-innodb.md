---
title: 为什么MySQL官方建议使用自增主键? ⭐️⭐️⭐️
category:
  - 数据库
tag:
  - MySQL
---

# 为什么MySQL官方建议使用自增主键？

## 一、B+Tree索引结构回顾

### InnoDB的聚簇索引特性

```
InnoDB中，数据本身就存储在主键索引的叶子节点上
主键索引 = 聚簇索引 = 数据本身

B+Tree结构：
        [10|20|30]           ← 非叶子节点（只存索引）
       /    |    \
      /     |     \
  [1-9]  [10-19] [20-29]     ← 叶子节点（存完整数据行）
   ↓       ↓       ↓
 数据页   数据页   数据页
```

### 数据页的组织方式

```
每个数据页默认16KB，页内的记录按主键顺序存储

数据页示例：
┌─────────────────────────────┐
│ Page Header                 │
├─────────────────────────────┤
│ Record 1: id=1, name=...   │
│ Record 2: id=2, name=...   │
│ Record 3: id=3, name=...   │
│ ...                         │
│ Free Space (剩余空间)        │
└─────────────────────────────┘
```

## 二、自增主键的优势

### 优势1：避免频繁的页分裂

#### 使用自增主键（顺序插入）

```sql
-- 当前数据页状态（已满）
Page 1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]  ← 16KB已满

-- 插入 id=11（自增）
INSERT INTO users (id, name) VALUES (11, 'user11');

-- 结果：在页尾追加，创建新页
Page 1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]  ← 保持不变
Page 2: [11]                              ← 新页，继续追加
```

**关键点**：
- ✅ 旧页完全不动，数据不需要移动
- ✅ 新页从空白开始，顺序写入
- ✅ 不会发生页分裂，只是创建新页

#### 使用UUID或无序主键（随机插入）

```sql
-- 当前数据页状态
Page 1: [uuid_a, uuid_c, uuid_f, uuid_m, uuid_z]  ← 按UUID排序

-- 插入 uuid_g（随机值，排序后位于中间）
INSERT INTO users (id, name) VALUES ('uuid_g', 'user_g');

-- 需要插入到 uuid_f 和 uuid_m 之间
Page 1: [uuid_a, uuid_c, uuid_f, uuid_g, uuid_m, uuid_z]
```

**如果页满了，就会触发页分裂**：

```
分裂前（页满）：
Page 1: [uuid_a, uuid_c, uuid_f, uuid_m, uuid_x, uuid_z]  ← 16KB满

插入 uuid_g：
分裂后：
Page 1: [uuid_a, uuid_c, uuid_f]       ← 保留前一半
Page 2: [uuid_g, uuid_m, uuid_x, uuid_z] ← 新页存后一半
```

**页分裂的代价**：
- ❌ 需要申请新页
- ❌ 需要移动约50%的数据到新页
- ❌ 需要更新父节点的索引指针
- ❌ 造成页空间浪费（两个页都只用了约50%）

如图：

<img :src="$withBase('/assets/images/store/innodb.png')" 
  alt=""
  width="800px" 
  height="auto">

### 优势2：减少数据移动

#### 自增主键：永远在最后插入

```
插入过程（顺序）：
Step 1: [1, 2, 3] + insert(4) → [1, 2, 3, 4]
Step 2: [1, 2, 3, 4] + insert(5) → [1, 2, 3, 4, 5]
Step 3: [1, 2, 3, 4, 5] + insert(6) → [1, 2, 3, 4, 5, 6]

✅ 每次都是追加，无需移动已有数据
```

#### UUID主键：需要找到插入位置

```
插入过程（无序）：
当前: [uuid_a, uuid_f, uuid_m, uuid_z]

插入 uuid_c（需要插入到 a 和 f 之间）：
1. 找到插入位置（二分查找）
2. 移动 uuid_f, uuid_m, uuid_z 向后挪
3. 插入 uuid_c

结果: [uuid_a, uuid_c, uuid_f, uuid_m, uuid_z]
      ↑ 新插入   ↑ 这些都移动了
```

### 优势3：更好的页填充率

```
自增主键（顺序插入）：
Page 1: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]  ← 95%满
Page 2: [16,17,18,19,20,21,22,23,24,25]        ← 70%满

UUID主键（随机插入后的页分裂）：
Page 1: [uuid_a, uuid_c, uuid_f]      ← 只有50%满，浪费空间
Page 2: [uuid_g, uuid_m]              ← 只有40%满，浪费空间
Page 3: [uuid_x, uuid_z]              ← 只有45%满，浪费空间
```

**结果**：
- 自增主键：平均页填充率 80-90%
- UUID主键：平均页填充率 50-70%
- 相同数据量，UUID需要更多的数据页 → 占用更多磁盘空间 → 需要更多IO

## 三、性能对比测试

### 测试场景

```sql
-- 表结构1：自增主键
CREATE TABLE users_auto (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(100)
);

-- 表结构2：UUID主键
CREATE TABLE users_uuid (
    id CHAR(36) PRIMARY KEY,  -- UUID
    name VARCHAR(50),
    email VARCHAR(100)
);

-- 插入100万条数据
```

### 性能指标对比

| 指标 | 自增主键 | UUID主键 | 差异 |
|------|---------|---------|------|
| 插入时间 | 45秒 | 78秒 | **+73%** |
| 表空间大小 | 156MB | 312MB | **+100%** |
| 页分裂次数 | ~100次 | ~15000次 | **+150倍** |
| 平均页填充率 | 87% | 52% | **-40%** |
| 插入后查询性能 | 基准 | -15% | 索引碎片影响 |

### 实际案例

```sql
-- 监控页分裂（MySQL 5.7+）
SELECT * FROM information_schema.INNODB_METRICS 
WHERE NAME LIKE '%page_split%';

-- 自增主键插入10万条
-- 结果：innodb_page_splits = 12

-- UUID主键插入10万条  
-- 结果：innodb_page_splits = 1847
```

## 四、自增主键的完整优势总结

### 1. 写入性能优势

```
✅ 顺序IO：磁盘顺序写入比随机写入快10-100倍
✅ 减少页分裂：页分裂需要加锁，影响并发
✅ 减少数据移动：移动数据需要额外的CPU和内存操作
✅ 更少的索引维护：B+Tree结构调整更少
```

### 2. 空间利用优势

```
✅ 更高的页填充率：节省磁盘空间
✅ 更少的碎片：减少空间浪费
✅ 更小的索引大小：BIGINT(8字节) vs UUID(36字节)
```

### 3. 查询性能优势

```
✅ 更紧凑的索引：减少索引层级，减少IO
✅ 更好的缓存命中：相邻数据在物理上也相邻
✅ 范围查询友好：范围查询都是连续的页
```

## 五、特殊场景考虑

### 何时不适合使用自增主键？

```sql
-- 场景1：分布式系统，多节点写入
-- 问题：自增ID冲突
-- 解决：使用雪花ID（Snowflake）或UUID

-- 场景2：需要防止ID遍历攻击
-- 问题：id=1,2,3...容易被遍历
-- 解决：使用UUID或加密ID

-- 场景3：数据同步/合并
-- 问题：不同库的自增ID会冲突
-- 解决：使用全局唯一ID
```

### 分布式ID生成方案

```sql
-- 雪花ID：兼顾自增特性和全局唯一
-- 结构：[时间戳(41位)][机器ID(10位)][序列号(12位)]
-- 优点：趋势递增，近似自增主键的性能

CREATE TABLE users (
    id BIGINT PRIMARY KEY,  -- 雪花ID
    name VARCHAR(50)
);

-- 在应用层生成ID
-- 1234567890123456789 (趋势递增)
-- 1234567890123456790 (趋势递增)
-- 1234567890123456791 (趋势递增)
```

## 六、最佳实践建议

### 单机MySQL

```sql
-- ✅ 推荐：使用自增主键
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_no VARCHAR(32) UNIQUE,  -- 业务流水号作为唯一索引
    user_id BIGINT,
    created_at DATETIME
);
```

### 分布式MySQL

```sql
-- ✅ 推荐：使用雪花ID或类似方案
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,  -- 雪花ID（趋势递增）
    order_no VARCHAR(32) UNIQUE,
    user_id BIGINT,
    created_at DATETIME
);

-- ❌ 避免：纯随机UUID
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,  -- 完全无序，性能差
    ...
);
```

## 七、核心总结

**为什么推荐自增主键？**

1. **写入性能**：顺序插入，避免频繁页分裂和数据移动
2. **空间效率**：更高的页填充率，更小的索引体积
3. **查询性能**：更紧凑的数据结构，更好的缓存局部性
4. **维护简单**：索引碎片少，无需频繁优化

**关键理解**：
- 页分裂不是"分裂很少一部分"，而是自增主键**几乎不会触发页分裂**
- 数据移动不仅仅是"减少频率"，而是自增主键**完全不需要移动已有数据**
- 本质是利用了**顺序IO**的性能优势，这是机械硬盘和SSD的共同特性