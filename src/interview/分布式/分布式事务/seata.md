---
title: seata分布式事务
category:
  - 面试题
tag:
  - 分布式事务
date: 2025-11-28
---

> GitHub：https://github.com/apache/incubator-seata

## 一、什么是 Seata？

Seata（Simple Extensible Autonomous Transaction Architecture）是阿里巴巴开源的**分布式事务解决方案**，致力于在微服务架构下提供高性能、易用的分布式事务服务。

核心组成：

- **TC（Transaction Coordinator）**：事务协调者，独立部署的 Seata Server，维护全局事务状态，驱动提交或回滚
- **TM（Transaction Manager）**：事务管理器，标注 `@GlobalTransactional` 的服务，负责开启、提交、回滚全局事务
- **RM（Resource Manager）**：资源管理器，各微服务中管理本地数据库资源，向 TC 注册分支事务

```
┌─────────────────────────────────────────────────────┐
│                    业务流程                           │
│  TM ──①开启全局事务──▶ TC                           │
│  TM ──②调用服务────▶ RM ──③注册分支──▶ TC           │
│  TM ──④提交/回滚───▶ TC ──⑤通知RM──▶ RM            │
└─────────────────────────────────────────────────────┘
```

---

## 二、Seata 支持哪些事务模式？

| 模式 | 全称 | 一致性 | 侵入性 | 性能 | 适用场景 |
|------|------|--------|--------|------|----------|
| **AT** | Automatic Transaction | 最终一致 | 低 | 高 | 关系型数据库，主流场景 |
| **TCC** | Try-Confirm-Cancel | 最终一致 | 高 | 较高 | 需要精确控制资源预留 |
| **Saga** | 长事务补偿 | 最终一致 | 低 | 高 | 长流程、跨系统业务 |
| **XA** | 基于数据库XA协议 | 强一致 | 低 | 低 | 对一致性要求极高场景 |

---

## 三、AT 模式原理（重点）

AT 模式是 Seata 默认模式，**无需改业务代码**，基于本地 UNDO_LOG 表实现自动回滚。

### 执行流程

**一阶段（执行）：**

```
1. 解析 SQL，生成 before image（执行前快照）
2. 执行本地 SQL
3. 生成 after image（执行后快照）
4. 将 before/after image 写入 UNDO_LOG 表（同一本地事务内）
5. 向 TC 注册分支事务，申请全局锁
6. 获得全局锁后，提交本地事务（同时释放本地锁）
```

**二阶段（提交）：**

```
全局提交：TC 通知 RM 异步删除 UNDO_LOG，释放全局锁
全局回滚：TC 通知 RM 用 before image 反向还原数据，删除 UNDO_LOG
```

### UNDO_LOG 表结构

```sql
CREATE TABLE `undo_log` (
  `branch_id`     BIGINT       NOT NULL COMMENT '分支事务ID',
  `xid`           VARCHAR(128) NOT NULL COMMENT '全局事务ID',
  `context`       VARCHAR(128) NOT NULL COMMENT '序列化类型',
  `rollback_info` LONGBLOB     NOT NULL COMMENT '回滚信息(before/after image)',
  `log_status`    INT(11)      NOT NULL COMMENT '0正常 1全局完成',
  `log_created`   DATETIME(6)  NOT NULL,
  `log_modified`  DATETIME(6)  NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_undo_log` (`xid`, `branch_id`)
) ENGINE = InnoDB;
```

---

## 四、TCC 模式原理

TCC 需要**业务方实现三个方法**：

```java
// Try：资源预留（冻结）
Boolean try(BusinessActionContext ctx);

// Confirm：真正执行业务（使用预留资源）
Boolean confirm(BusinessActionContext ctx);

// Cancel：释放预留资源（回滚）
Boolean cancel(BusinessActionContext ctx);
```

### 注意事项

**幂等问题**：Confirm/Cancel 可能被重复调用，需要做幂等控制

```java
// 用状态机 + 唯一key 保证幂等
if (frozenOrder.getStatus() == CONFIRMED) {
    return true; // 已经处理过，直接返回
}
```

**空回滚**：Try 未执行，Cancel 被调用（网络超时等原因）

```java
// Cancel 中先判断 Try 是否执行过
FrozenRecord record = frozenDao.get(ctx.getXid());
if (record == null) {
    return true; // Try 未执行，直接返回
}
```

**悬挂**：Cancel 先于 Try 执行，需要拒绝后续 Try

```java
// Try 中检查是否已经 Cancel 过
if (cancelDao.exists(ctx.getXid())) {
    return false; // 已经回滚，拒绝 Try
}
```

### Java 完整示例

下面是一个完整的转账场景 TCC 示例，涵盖幂等、空回滚、悬挂三种处理逻辑。先看一下流程图：

<img :src="$withBase('/assets/images/interview/distributed/seata-tcc.png')" 
  alt="垂直与水平区别"
  width="800px" 
  height="auto">

下面是完整的 Java 代码实现，场景是：**A 账户向 B 账户转账 100 元**。

```java
// ===================== 数据模型 =====================

/**
 * 冻结记录表：Try 阶段插入，Confirm/Cancel 后删除或更新
 * frozen_record (xid, from_account, to_account, amount, status, create_time)
 * status: TRYING | CONFIRMED | CANCELLED
 */

// ===================== TCC 接口实现 =====================

@LocalTCC
@Service
public class TransferTccServiceImpl implements TransferTccService {

    @Autowired
    private AccountDao accountDao;

    @Autowired
    private FrozenRecordDao frozenRecordDao;

    @Autowired
    private CancelMarkDao cancelMarkDao; // 专门记录 Cancel 标记，防悬挂

    /**
     * Try 阶段：冻结转出方金额 + 预占收款方配额
     * 异常时由框架自动触发 Cancel
     */
    @Override
    @TwoPhaseBusinessAction(name = "transferTcc", commitMethod = "confirm", rollbackMethod = "cancel")
    public boolean tryTransfer(BusinessActionContext ctx,
                               String fromAccountId,
                               String toAccountId,
                               BigDecimal amount) {

        String xid = ctx.getXactionId();

        // ① 防悬挂：Cancel 先于 Try 执行时，Try 应拒绝
        if (cancelMarkDao.exists(xid)) {
            log.warn("[TCC Try] xid={} 已经 Cancel，拒绝 Try（防悬挂）", xid);
            return false;
        }

        // ② 检查转出方余额是否充足
        Account fromAccount = accountDao.selectForUpdate(fromAccountId);
        if (fromAccount.getBalance().compareTo(amount) < 0) {
            log.warn("[TCC Try] xid={} 余额不足，from={}", xid, fromAccountId);
            return false;
        }

        // ③ 冻结转出方金额（balance 不变，frozen_amount += amount）
        accountDao.freeze(fromAccountId, amount);

        // ④ 预占收款方配额（防止收款方账户注销等异常）
        Account toAccount = accountDao.selectForUpdate(toAccountId);
        if (!toAccount.isActive()) {
            // 解冻并返回 false，框架会触发 Cancel
            accountDao.unfreeze(fromAccountId, amount);
            return false;
        }
        accountDao.increaseQuota(toAccountId, amount);

        // ⑤ 插入冻结记录（Confirm/Cancel 依赖此记录判断 Try 是否执行过）
        FrozenRecord record = new FrozenRecord();
        record.setXid(xid);
        record.setFromAccount(fromAccountId);
        record.setToAccount(toAccountId);
        record.setAmount(amount);
        record.setStatus(TccStatus.TRYING);
        frozenRecordDao.insert(record);

        log.info("[TCC Try] xid={} 冻结成功，from={} to={} amount={}", xid, fromAccountId, toAccountId, amount);
        return true;
    }

    /**
     * Confirm 阶段：真正扣款 + 到账
     * 必须保证幂等，可能被框架重试多次
     */
    @Override
    public boolean confirm(BusinessActionContext ctx) {
        String xid = ctx.getXactionId();

        // ① 幂等检查：已经 CONFIRMED 直接返回成功
        FrozenRecord record = frozenRecordDao.getByXid(xid);
        if (record == null) {
            // Try 未成功就进 Confirm，理论上不应发生，保护性返回
            log.warn("[TCC Confirm] xid={} 冻结记录不存在，直接返回 true", xid);
            return true;
        }
        if (record.getStatus() == TccStatus.CONFIRMED) {
            log.info("[TCC Confirm] xid={} 已确认，幂等返回 true", xid);
            return true;
        }

        // ② 正式扣减转出方冻结金额
        //    frozen_amount -= amount（冻结归零）
        accountDao.deductFrozen(record.getFromAccount(), record.getAmount());

        // ③ 收款方余额真正到账
        //    balance += amount，quota -= amount（释放预占）
        accountDao.creditWithQuota(record.getToAccount(), record.getAmount());

        // ④ 更新冻结记录状态 → CONFIRMED（幂等 key）
        frozenRecordDao.updateStatus(xid, TccStatus.CONFIRMED);

        log.info("[TCC Confirm] xid={} 转账成功，from={} to={} amount={}",
                xid, record.getFromAccount(), record.getToAccount(), record.getAmount());
        return true;
    }

    /**
     * Cancel 阶段：释放资源
     * 必须保证幂等，可能被框架重试多次
     * 还需处理「空回滚」和「悬挂」两种异常场景
     */
    @Override
    public boolean cancel(BusinessActionContext ctx) {
        String xid = ctx.getXactionId();

        // ① 防空回滚：Try 未执行（网络超时等），直接返回成功
        FrozenRecord record = frozenRecordDao.getByXid(xid);
        if (record == null) {
            log.warn("[TCC Cancel] xid={} 冻结记录不存在（空回滚），直接返回 true", xid);
            // 写入 Cancel 标记，防止 Try 后续到达形成悬挂
            cancelMarkDao.insert(xid);
            return true;
        }

        // ② 幂等检查：已经 CANCELLED 直接返回成功
        if (record.getStatus() == TccStatus.CANCELLED) {
            log.info("[TCC Cancel] xid={} 已回滚，幂等返回 true", xid);
            return true;
        }

        // ③ 解冻转出方金额
        accountDao.unfreeze(record.getFromAccount(), record.getAmount());

        // ④ 释放收款方预占配额
        accountDao.releaseQuota(record.getToAccount(), record.getAmount());

        // ⑤ 更新冻结记录状态 → CANCELLED（幂等 key）
        frozenRecordDao.updateStatus(xid, TccStatus.CANCELLED);

        // ⑥ 写入 Cancel 标记，防止后续 Try 迟到导致悬挂
        cancelMarkDao.insert(xid);

        log.info("[TCC Cancel] xid={} 回滚成功，from={} to={} amount={}",
                xid, record.getFromAccount(), record.getToAccount(), record.getAmount());
        return true;
    }
}
```

```java
// ===================== AccountDao 关键 SQL 语义 =====================

public interface AccountDao {

    // Try: 冻结，balance 不动，frozen_amount 增加
    // UPDATE account SET frozen_amount = frozen_amount + #{amount} WHERE id = #{id}
    void freeze(String accountId, BigDecimal amount);

    // Cancel: 解冻，frozen_amount 归零
    // UPDATE account SET frozen_amount = frozen_amount - #{amount} WHERE id = #{id}
    void unfreeze(String accountId, BigDecimal amount);

    // Confirm: 扣减冻结金额（真实扣款）
    // UPDATE account SET frozen_amount = frozen_amount - #{amount} WHERE id = #{id}
    void deductFrozen(String accountId, BigDecimal amount);

    // Confirm: 收款方到账并释放预占
    // UPDATE account SET balance = balance + #{amount}, quota = quota - #{amount} WHERE id = #{id}
    void creditWithQuota(String accountId, BigDecimal amount);

    // Try: 预占收款方配额
    // UPDATE account SET quota = quota + #{amount} WHERE id = #{id}
    void increaseQuota(String accountId, BigDecimal amount);

    // Cancel: 释放预占配额
    // UPDATE account SET quota = quota - #{amount} WHERE id = #{id}
    void releaseQuota(String accountId, BigDecimal amount);
}
```

```java
// ===================== 发起调用（业务层） =====================

@Service
public class TransferService {

    @Autowired
    private TransferTccService transferTccService;

    @GlobalTransactional(name = "global-transfer", rollbackFor = Exception.class)
    public void transfer(String fromId, String toId, BigDecimal amount) {
        // Seata 框架会自动：
        //   - 成功时调 confirm()
        //   - 任何参与方失败时调所有参与方的 cancel()
        boolean result = transferTccService.tryTransfer(null, fromId, toId, amount);
        if (!result) {
            throw new BusinessException("转账 Try 阶段失败");
        }
    }
}
```

---

三个核心问题的处理总结：

**幂等**：`frozen_record.status` 作为状态机，Confirm 检查 `CONFIRMED`、Cancel 检查 `CANCELLED`，重复调用直接返回 `true`。

**空回滚**：Cancel 进来先查 `frozen_record`，记录不存在说明 Try 未执行，直接返回 `true`，同时写入 Cancel 标记。

**悬挂**：Try 进来先查 `cancel_mark` 表，若存在说明 Cancel 已先执行，拒绝本次 Try（返回 `false`）。Cancel 每次执行都写 `cancel_mark`，包括空回滚的情况。

---

## 五、Saga 模式原理

Saga 适合**长事务、跨多系统**场景，将长事务拆分为多个本地事务，失败时**正向补偿**。

```
正向：T1 → T2 → T3 → T4
失败：T4失败 → C3（补偿T3）→ C2（补偿T2）→ C1（补偿T1）
```

Seata 提供**状态机引擎**实现 Saga，通过 JSON 配置定义流程：

```json
{
  "Name": "orderSaga",
  "StartState": "CreateOrder",
  "States": {
    "CreateOrder": {
      "Type": "ServiceTask",
      "ServiceName": "orderService",
      "ServiceMethod": "create",
      "CompensateState": "CancelOrder",
      "Next": "DeductStock"
    },
    "CancelOrder": {
      "Type": "ServiceTask",
      "ServiceName": "orderService",
      "ServiceMethod": "cancel",
      "IsForCompensation": true
    }
  }
}
```

---

## 六、常见面试问题

### Q1：AT 模式和 TCC 模式怎么选？

| 场景 | 推荐 |
|------|------|
| 内部微服务，数据库是 MySQL | AT 模式（改动少，上手快） |
| 需要精确控制资源预留（如库存） | TCC 模式 |
| 跨公司、跨系统、无法改数据库 | Saga 模式 |
| 强一致性要求（金融核心） | XA 模式 |

### Q2：Seata AT 模式如何解决脏写问题？

通过**全局锁**机制：

```
本地事务提交前，RM 向 TC 申请全局锁
只有拿到全局锁，才能提交本地事务
其他事务想修改同一行，必须等待全局锁释放
```

> 本地锁（数据库行锁）在本地事务提交后释放，全局锁在全局事务结束后释放。

### Q3：Seata 的全局锁和数据库行锁的关系？

```
全局锁：Seata 层面，防止不同全局事务并发修改同一行
行锁：  数据库层面，防止同一数据库内并发写冲突

一阶段：先拿行锁 → 执行SQL → 申请全局锁 → 提交本地事务（释放行锁）
回滚：  拿行锁 → 校验 after image → 还原数据 → 释放全局锁
```

### Q4：AT 模式回滚时发现数据被修改怎么办（脏数据校验）？

回滚前会比对 **after image 和当前数据库数据**：

- 一致 → 正常回滚，用 before image 还原
- 不一致 → **回滚失败**，记录异常日志，需要人工介入处理（说明有脏写发生）

### Q5：Seata 性能问题怎么看？

AT 模式性能损耗主要来自：

1. 生成 before/after image（额外查询）
2. 写 UNDO_LOG（额外写操作）
3. 全局锁竞争（高并发热点数据场景影响大）

优化思路：

- 热点数据场景改用 TCC，自己控制锁粒度
- 合理设置全局事务超时时间，避免锁等待过长
- Seata Server 集群部署，避免单点瓶颈

---

## 七、常见配置示例

### 7.1 依赖引入（SpringBoot）

```xml
<dependency>
    <groupId>com.alibaba.cloud</groupId>
    <artifactId>spring-cloud-starter-alibaba-seata</artifactId>
</dependency>
```

### 7.2 application.yml 配置

```yaml
seata:
  enabled: true
  application-id: order-service        # 当前服务名
  tx-service-group: my_tx_group        # 事务分组，需和TC配置一致
  service:
    vgroup-mapping:
      my_tx_group: default             # 映射到TC集群名
  registry:
    type: nacos                        # 注册中心类型
    nacos:
      server-addr: 127.0.0.1:8848
      namespace: seata
      group: SEATA_GROUP
  config:
    type: nacos                        # 配置中心类型
    nacos:
      server-addr: 127.0.0.1:8848
      namespace: seata
      group: SEATA_GROUP
  data-source-proxy-mode: AT           # 事务模式：AT / XA
```

### 7.3 AT 模式使用示例

```java
@Service
public class OrderService {

    @Autowired
    private OrderDao orderDao;

    @Autowired
    private StockFeignClient stockClient;

    @Autowired
    private AccountFeignClient accountClient;

    // 开启全局事务，超时5秒，回滚异常类型
    @GlobalTransactional(timeoutMills = 5000, rollbackFor = Exception.class)
    public void createOrder(OrderDTO dto) {
        // 1. 创建订单
        orderDao.insert(dto);

        // 2. 扣减库存（远程调用）
        stockClient.deduct(dto.getProductId(), dto.getCount());

        // 3. 扣减余额（远程调用）
        accountClient.deduct(dto.getUserId(), dto.getAmount());
    }
}
```

### 7.4 TCC 模式使用示例

```java
// 定义 TCC 接口
@LocalTCC
public interface StockTccService {

    @TwoPhaseBusinessAction(name = "deductStock", commitMethod = "confirm", rollbackMethod = "cancel")
    boolean tryDeduct(BusinessActionContext ctx,
                      @BusinessActionContextParameter("productId") Long productId,
                      @BusinessActionContextParameter("count") Integer count);

    boolean confirm(BusinessActionContext ctx);

    boolean cancel(BusinessActionContext ctx);
}

// 实现类
@Service
public class StockTccServiceImpl implements StockTccService {

    @Override
    public boolean tryDeduct(BusinessActionContext ctx, Long productId, Integer count) {
        // 冻结库存（预留资源）
        stockDao.freeze(productId, count);
        return true;
    }

    @Override
    public boolean confirm(BusinessActionContext ctx) {
        Long productId = Long.valueOf(ctx.getActionContext("productId").toString());
        Integer count = Integer.valueOf(ctx.getActionContext("count").toString());
        // 真正扣减冻结的库存
        stockDao.deductFrozen(productId, count);
        return true;
    }

    @Override
    public boolean cancel(BusinessActionContext ctx) {
        Long productId = Long.valueOf(ctx.getActionContext("productId").toString());
        Integer count = Integer.valueOf(ctx.getActionContext("count").toString());
        // 释放冻结的库存
        stockDao.releaseFrozen(productId, count);
        return true;
    }
}
```

### 7.5 Seata Server（TC）配置（file.conf）

```properties
# Seata Server 存储模式（推荐 db）
store.mode=db
store.db.datasource=druid
store.db.dbType=mysql
store.db.driverClassName=com.mysql.cj.jdbc.Driver
store.db.url=jdbc:mysql://127.0.0.1:3306/seata?rewriteBatchedStatements=true
store.db.user=root
store.db.password=123456

# 全局事务表、分支事务表、全局锁表
store.db.globalTable=global_table
store.db.branchTable=branch_table
store.db.lockTable=lock_table
```

---

## 八、总结

```
┌────────────────────────────────────────────────────────┐
│                    Seata 核心总结                        │
├──────────┬─────────────────────────────────────────────┤
│ 角色     │ TC（协调者）、TM（发起者）、RM（参与者）      │
├──────────┼─────────────────────────────────────────────┤
│ 主推模式 │ AT（无侵入，自动补偿）                        │
├──────────┼─────────────────────────────────────────────┤
│ 核心机制 │ 全局锁 + UNDO_LOG + 两阶段提交               │
├──────────┼─────────────────────────────────────────────┤
│ 常见坑   │ TCC 幂等、空回滚、悬挂                        │
├──────────┼─────────────────────────────────────────────┤
│ 性能优化 │ 热点场景用TCC，合理设置超时，TC集群部署        │
└──────────┴─────────────────────────────────────────────┘
```