---
title: InnoDB 数据库死锁问题处理指南
category:
  - 数据库
tag:
  - MySQL
---

# InnoDB 数据库死锁问题处理指南

## 问题现象

在执行数据库 UPDATE 操作时，偶现 `DeadlockLoserDataAccessException` 异常：

```
Deadlock found when trying to get lock; try restarting transaction
```

**影响分析：**
- 对用户体验影响较小（仅表现为短暂卡顿）
- 数据库会自动回滚并重试事务
- 监控系统频繁告警，需要优化处理

---

## 解决方案

### 应用层重试机制

在应用程序中对 UPDATE 操作添加死锁重试逻辑：

```java
/**
 * 处理数据库死锁的更新操作
 * 
 * @param mapper MyBatis Mapper 接口
 * @param record 待更新的记录
 * @throws InterruptedException 线程中断异常
 */
private void updateWithDeadlockRetry(TestMapper mapper, Test record) 
        throws InterruptedException {
    int maxRetries = 5;
    int attempt = 0;
    
    while (attempt < maxRetries) {
        try {
            mapper.updateByPrimaryKeySelective(record);
            return; // 更新成功，退出循环
            
        } catch (DeadlockLoserDataAccessException e) {
            attempt++;
            if (attempt >= maxRetries) {
                throw e; // 达到最大重试次数，抛出异常
            }
            // 随机等待 0-500ms 后重试，避免重试冲突
            Thread.sleep((long) (Math.random() * 500));
        }
    }
}
```

**代码说明：**
- 最多重试 5 次
- 每次重试前随机休眠 0-500ms，降低再次冲突概率
- 使用 MyBatis，无需手动管理数据库连接
- 如使用原生 JDBC，需自行管理连接的创建与关闭

---

## 死锁原理示例

### 场景模拟

**初始状态：** 创建表并插入测试数据

```sql
CREATE TABLE t (i INT) ENGINE = InnoDB;
INSERT INTO t (i) VALUES(1);
```

### 死锁发生过程

**步骤 1：客户端 A 开启事务并持有共享锁（S锁）**

```sql
START TRANSACTION;
SELECT * FROM t WHERE i = 1 LOCK IN SHARE MODE;
```

此时客户端 A 持有行记录的**共享锁（S）**。

---

**步骤 2：客户端 B 尝试删除记录**

```sql
START TRANSACTION;
DELETE FROM t WHERE i = 1;
```

DELETE 操作需要**排他锁（X）**，但 X 锁与 A 持有的 S 锁互斥，客户端 B 进入等待状态。

---

**步骤 3：客户端 A 也尝试删除记录**

```sql
DELETE FROM t WHERE i = 1;
```

此时形成**死锁环路**：
- **客户端 A**：持有 S 锁，等待 X 锁（被 B 占用）
- **客户端 B**：持有 X 锁请求，等待 A 释放 S 锁

### InnoDB 的处理机制

检测到死锁后，InnoDB 会自动选择一个事务作为牺牲者并回滚，返回错误：

```
ERROR 1213 (40001): Deadlock found when trying to get lock;
try restarting transaction
```

另一个事务可以继续执行，死锁解除。

---

## 预防建议

1. **优化事务逻辑**：缩短事务持有锁的时间
2. **统一访问顺序**：多表操作时保持一致的访问顺序
3. **使用合适的索引**：减少锁定范围
4. **避免长事务**：及时提交或回滚事务
5. **应用层重试**：如上述代码示例，增加自动重试机制

---

## 参考资料

- [MySQL 官方文档 - InnoDB 死锁](http://dev.mysql.com/doc/refman/5.7/en/innodb-deadlocks.html)
- [数据库死锁案例分析](http://www.xaprb.com/blog/2006/08/03/a-little-known-way-to-cause-a-database-deadlock/)