---
title: Memcached 面试题精
category:
  - 面试题
tag:
  - Memcached
Date:
  - 2025-11-26
---

# Memcached 面试题精华

> 基于 Memcached 1.6.x，整合核心考点与高频面试题

---

## 目录

- [一、基础概念](#一基础概念)
- [二、架构与原理](#二架构与原理)
- [三、内存管理](#三内存管理)
- [四、缓存机制与淘汰策略](#四缓存机制与淘汰策略)
- [五、分布式与高可用](#五分布式与高可用)
- [六、三大缓存问题](#六三大缓存问题)
- [七、对比分析](#七对比分析)
- [八、安全与配置](#八安全与配置)
- [九、技术限制](#九技术限制)
- [十、最佳实践](#十最佳实践)
- [十一、监控与运维](#十一监控与运维)

---

## 一、基础概念

### Q1：Memcached 是什么？核心特点有哪些？

Memcached 是一个**高性能的分布式内存 KV 缓存系统**，用于加速动态 Web 应用程序，减轻数据库负载。它通过在内存中缓存数据和对象来减少读取数据库的次数。

**核心特点：**

- **纯内存存储**：所有数据存于内存，速度极快，但不支持持久化
- **非阻塞事件驱动架构**：基于 Libevent，能很好解决 C10K 问题
- **分布式存储**：支持多节点部署，客户端负责分片路由
- **简单 KV 结构**：类似一个巨大的哈希表，只支持 String 类型
- **LRU 淘汰策略**：内存不足时自动淘汰最少使用的数据
- **多线程支持**：1.2+ 版本支持多线程，充分利用多核 CPU

---

### Q2：Memcached 适合什么场景？不适合什么场景？

✅ **适合：**
- 高并发读取的热点数据缓存
- Session 共享存储
- 页面/接口结果缓存
- 简单的计数器场景

❌ **不适合：**
- 需要数据持久化
- 需要复杂数据结构（List、Hash、ZSet 等）
- 需要原生分布式集群高可用
- 需要事务支持

---

## 二、架构与原理

### Q3：Memcached 的工作原理是什么？（两阶段哈希）

Memcached 采用**两阶段哈希（Two-Stage Hash）**机制：

```
第一阶段：客户端哈希（节点选择）
  Client 对 key 计算哈希值 → 确定目标节点

第二阶段：服务端哈希（数据定位）
  目标节点使用内部哈希算法 → 定位具体数据 item
```

**存储流程示例：**

```
Client 1 存储 key="foo", value="barbaz"
  ↓ 对 "foo" 哈希计算
  ↓ 定位到节点 B
  ↓ 直接连接节点 B 写入

Client 2 读取 key="foo"
  ↓ 相同客户端库 + 相同节点列表
  ↓ 对 "foo" 相同哈希计算 → 同样定位到节点 B
  ↓ 直接从节点 B 读取 "barbaz"
```

**架构特性：**
- **无中心节点**：节点之间不通信，避免网络风暴
- **客户端路由**：分片逻辑完全由客户端完成
- **独立节点**：每个节点独立运行，互不影响

---

### Q4：Memcached 的线程模型是什么？

```
主线程（监听连接）
    ↓ 接收连接后分发
Worker线程1  Worker线程2  Worker线程3 ...
（各自处理请求，减少锁竞争）
```

- 基于 **Libevent** 的多线程模型
- 主线程负责接受新连接，Worker 线程负责处理读写请求
- 命令解析：多线程并行处理
- 数据操作：基于全局锁（早期版本），后续版本持续优化
- 比单机多实例模式效率更高，尤其是 `multi-get` 操作

启用方式：

```bash
memcached -t 4  # 使用 4 个 Worker 线程
```

---

## 三、内存管理

### Q5：Memcached 的内存分配机制是什么？（Slab Allocation）

Memcached 使用 **Slab Allocation（Slab 分配器）**管理内存，核心思想是按对象大小预先分类建立内存池。

```
Page (1MB)
  └── 切割成 N 个等大的 Chunk
        └── 存储同尺寸的对象

  SlabClass 1: chunk = 64B    [obj][obj][obj][free]...
  SlabClass 2: chunk = 128B   [obj][obj][free][free]...
  SlabClass 3: chunk = 256B   [obj][free][free][free]...
  ...
```

**Chunk 大小按增长因子递增（默认 1.25）：**

```
slab1 → 400B
slab2 → 480B  (400 × 1.20)
slab3 → 576B  (480 × 1.20)
...
```

**优点：**
- 避免频繁 malloc/free 产生内存碎片
- 对象复用，分配效率高

**缺点：**
- 存在内部碎片（chunk 利用率低时浪费内存）
- 不同 size class 之间无法共享内存

---

### Q6：Memcached 的内存碎片问题如何解决？

| 碎片类型 | 原因 | 解决方案 |
|---------|------|---------|
| 外部碎片 | 频繁 malloc/free | Slab 机制已基本消除 |
| 内部碎片 | chunk 利用率低 | 调整 `-f` 增长因子参数 |

```bash
# 调整增长因子，让 chunk 大小分布更均匀
memcached -f 1.1   # 更细粒度的 size class
memcached -f 2.0   # 更粗粒度，减少 class 数量
```

最彻底的方式：**重启服务**（代价大，需配合预热）

---

### Q7：Memcached 与 jemalloc 在内存管理上有什么区别？

| 维度 | Slab Allocation（Memcached） | jemalloc（Redis） |
|------|---------------------------|-----------------|
| 定位 | 专用内存池机制 | 通用高性能分配器 |
| 碎片控制 | 靠对象复用，同类无碎片 | 靠 size class 精细划分 |
| 多线程 | 依赖内核/全局锁 | 多 arena 设计，高并发友好 |
| 内存归还 | 不主动归还 OS | 可配置归还策略 |
| 灵活性 | 低（适合固定大小对象） | 高（通用分配器） |
| 调试能力 | 弱 | 强（内置统计、profiling） |

> jemalloc 可理解为将 Slab 思想带到用户态并大幅增强的进化版。

---

## 四、缓存机制与淘汰策略

### Q8：Memcached 的 LRU 淘汰策略是怎样的？

采用 **LRU（Least Recently Used）算法** + **超时失效机制**：

**淘汰优先级：**
1. 优先淘汰：已过期的 slab 数据
2. 次优淘汰：最久未使用的 slab 数据
3. 按需分配：不预加载数据

**内存不足时：** 踢出最近最少使用的数据，**不会使用 swap**（swap 会导致严重性能下降）

---

### Q9：Memcached 的过期时间有哪些限制？

| 项目 | 说明 |
|------|------|
| 最大过期时间 | **30 天**（2,592,000 秒） |
| 永不过期 | 设置为 `0` |
| 相对时间 | 直接传秒数（如 `3600` = 1小时） |
| 绝对时间 | 传 Unix 时间戳 |
| 超过 30 天 | 被解释为 Unix 时间戳，行为可能异常 |

---

### Q10：Memcached 的过期机制是 Lazy 的，什么意思？

**Lazy Expiration（惰性过期）**：Memcached 不会主动扫描过期 key，而是在**访问时才检查是否过期**。

- 优点：节省 CPU，不需要后台扫描线程
- 缺点：过期 key 不会立即释放内存，需等到被访问或被 LRU 淘汰时才清除

---

## 五、分布式与高可用

### Q11：Memcached 如何实现分布式？

Memcached **本身不支持分布式**，依靠**客户端分片**实现：

```
key → hash 计算 → 取模 or 一致性哈希 → 定位到具体节点
```

| 算法 | 优点 | 缺点 |
|------|------|------|
| 普通取模 | 简单 | 节点变动时大量缓存失效 ❌ |
| 一致性哈希 | 节点变动只影响少量数据 | 实现略复杂 ✅ |

---

### Q12：什么是一致性哈希？解决了什么问题？

```
         node1
       /       \
   node3       node2   ← 哈希环
       \       /
         ...

key 顺时针查找最近节点
新增/删除节点只影响相邻区间的 key
```

**解决的问题：**
- 普通取模在节点扩缩容时，大量 key 重新映射导致缓存集体失效

**虚拟节点：**
- 解决节点数量少时数据倾斜问题
- 每个物理节点对应多个虚拟节点，分布更均匀

---

### Q13：Memcached 如何保证高可用？

| 方案 | 说明 | 风险 |
|------|------|------|
| 忽略失效节点 | 依赖其他节点分担 | 负载增加 |
| 移除失效节点 | 人工摘除 | 余数哈希时大量失效 ⚠️ |
| 热备节点接管 | 备用节点接管失效节点 IP | 需运维配合 |
| **一致性哈希（推荐）** | 节点变动影响最小 | 客户端需支持 |
| 二次哈希 | 失败后换算法再哈希 | 可能产生脏数据 ⚠️ |

**整体建议：**
- 多节点部署，降低单点影响
- 监控告警，及时发现问题
- 业务层做限流降级，缓存失效时保护后端 DB
- 应用层做好 fallback，缓存失效时能从 DB 重建

---

## 六、三大缓存问题

### Q14：缓存穿透如何解决？

**问题：** 查询不存在的 key，每次都打穿到数据库。

**解决方案：**

```python
# 方案1：缓存空值
user = db.query(user_id)
if not user:
    memcache.set(f"user:{user_id}", None, expire=300)  # 缓存短时间空值

# 方案2：布隆过滤器（推荐）
if not bloom_filter.exists(user_id):
    return None  # 直接拦截，不查 DB
```

---

### Q15：缓存雪崩如何解决？

**问题：** 大量 key 同时过期，请求全部打到数据库，导致数据库压力骤增。

**解决方案：**

```python
# 方案1：过期时间加随机抖动
expire = 3600 + random.randint(0, 300)  # 3600~3900 秒随机

# 方案2：热点数据永不过期
memcache.set(key, value, expire=0)

# 方案3：限流降级，保护 DB
# 方案4：提前异步刷新热点数据
```

---

### Q16：缓存击穿如何解决？

**问题：** 热点 key 过期瞬间，大量并发请求同时打到数据库（惊群效应）。

**解决方案：**

```python
# 互斥锁方案
def get_with_lock(key):
    value = cache.get(key)
    if value:
        return value

    # 尝试获取分布式锁
    if cache.add(f"lock:{key}", 1, expire=10):
        try:
            value = load_from_db(key)
            cache.set(key, value)
            return value
        finally:
            cache.delete(f"lock:{key}")
    else:
        # 等待其他线程加载完成后重试
        time.sleep(0.1)
        return get_with_lock(key)
```

**其他方案：**
- 热点 key 设置为**永不过期**，后台异步更新
- 提前刷新：在过期前一段时间主动续期

---

## 七、对比分析

### Q17：Memcached vs Redis 核心区别？

| 维度 | Memcached | Redis |
|------|-----------|-------|
| **数据结构** | 仅 String (KV) | String/Hash/List/Set/ZSet/Stream 等 |
| **持久化** | ❌ 不支持 | ✅ RDB + AOF |
| **分布式** | 客户端分片 | 原生 Cluster |
| **线程模型** | 多线程 | 单线程（6.0+ 多线程 I/O） |
| **内存管理** | Slab Allocation | jemalloc |
| **事务** | ❌ 不支持 | ✅ 有限支持（MULTI/EXEC） |
| **高可用** | 无原生支持 | Sentinel + Cluster |
| **适用场景** | 简单高并发缓存 | 缓存 + 复杂数据 + 持久化 |

> **选型建议：** 需要持久化、复杂数据结构、高可用集群 → Redis；纯粹高并发简单缓存、已有 Redis 想减负 → Memcached

---

### Q18：Memcached vs MySQL Query Cache？

| 特性 | Memcached | MySQL Query Cache |
|------|-----------|-------------------|
| 扩展性 | 优秀，可独立横向扩展 | 受限于单机内存 |
| 多核支持 | 良好 | 存在全局锁瓶颈 |
| 存储内容 | 任意数据对象 | 仅 SQL 查询结果 |
| 失效机制 | 灵活控制 | 表更新时全部失效 |
| 写密集场景 | 适合 | 频繁失效，性能下降 |

---

### Q19：Memcached 常用命令区别？

| 命令 | key 已存在 | key 不存在 |
|------|-----------|-----------|
| `set` | 覆盖 ✅ | 创建 ✅ |
| `add` | 失败 ❌ | 创建 ✅ |
| `replace` | 覆盖 ✅ | 失败 ❌ |
| `append` | 追加到末尾 | 失败 ❌ |
| `prepend` | 追加到开头 | 失败 ❌ |
| `cas` | CAS 比较后更新 | 失败 ❌ |

---

## 八、安全与配置

### Q20：Memcached 支持身份认证吗？

**不支持身份认证**，这是设计选择。

**设计理由：**
- 轻量级设计，避免增加复杂性
- 快速创建连接，认证应在应用层实现

**安全建议：**

```bash
# 1. 防火墙限制访问 IP
iptables -A INPUT -p tcp --dport 11211 -s 192.168.1.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 11211 -j DROP

# 2. 绑定内网地址，不暴露公网
memcached -l 127.0.0.1

# 3. 本地通信使用 Unix Socket
memcached -s /tmp/memcached.sock

# 4. 部署在 VPN / 专网环境中
```

---

### Q21：Memcached 大内存服务器如何部署？

推荐**一台大内存服务器运行多个实例**：

```bash
# 32GB 服务器运行 4 个实例，每个 8GB
memcached -m 8192 -p 11211 -u memcache
memcached -m 8192 -p 11212 -u memcache
memcached -m 8192 -p 11213 -u memcache
memcached -m 8192 -p 11214 -u memcache
```

**优点：**
- 降低单实例故障影响范围
- 更好利用多核 CPU
- 内存资源充分利用

---

## 九、技术限制

### Q22：Memcached 的 Key 和 Value 有哪些限制？

| 项目 | 限制 | 说明 |
|------|------|------|
| Key 最大长度 | **250 字符** | 服务端硬限制 |
| Value 最大值 | **1 MB** | 默认配置 |
| 过期时间最大值 | **30 天** | 超过则解析为时间戳 |

**为什么 Value 限制 1MB？**
1. Slab 最大 chunk 的设计限制
2. 更大的值降低内存利用率
3. 大数据序列化/反序列化耗时长，影响性能

**超过 1MB 怎么办？**
- 客户端压缩后再存储
- 拆分成多个 key 分段存储
- 超大对象存数据库或对象存储（S3、MogileFS）

---

### Q23：Memcached 支持事务吗？

**不支持事务。** 单条命令是原子的，但多条命令之间没有事务保证，也没有 MULTI/EXEC 机制。

如需 CAS（Compare And Swap）操作：

```bash
gets key        # 获取值及 cas token
cas key 0 60 value <token>  # 只有 token 匹配才更新成功
```

---

## 十、最佳实践

### Q24：Cache-Aside 模式如何实现？

```python
def get_user(user_id):
    # 1. 先查缓存
    user = memcache.get(f"user:{user_id}")
    if user is not None:
        return user

    # 2. 缓存未命中，查数据库
    user = db.query("SELECT * FROM users WHERE id = ?", user_id)

    # 3. 回填缓存（注意空值也要缓存，防穿透）
    memcache.set(f"user:{user_id}", user or "", expire=3600)
    return user

def update_user(user_id, data):
    db.update(user_id, data)
    memcache.delete(f"user:{user_id}")  # 删除缓存，下次读时重建
```

---

### Q25：为什么不建议批量导入导出 Memcached 数据？

1. **阻塞风险**：批量 IO 可能导致服务短暂暂停
2. **数据一致性**：导出导入期间数据可能已变化
3. **过期问题**：导出的数据可能已过期，导入后立即失效

**适用场景（例外情况）：**
- 静态不变的数据预热（warm-up）
- 系统迁移时的数据搬运

---

## 十一、监控与运维

### Q26：如何监控 Memcached？

```bash
# 查看实时统计
echo "stats" | nc localhost 11211

# 查看所有 slabs 信息
echo "stats slabs" | nc localhost 11211

# 查看 items 信息
echo "stats items" | nc localhost 11211
```

**核心监控指标：**

| 指标 | 计算方式 | 说明 |
|------|---------|------|
| **命中率** | `get_hits / (get_hits + get_misses)` | 越高越好，低于 80% 需排查 |
| **内存使用率** | `bytes / limit_maxbytes` | 超过 90% 需扩容 |
| **淘汰率** | `evictions` 增长速度 | 持续增长说明内存不足 |
| **连接数** | `curr_connections` | 接近上限时需排查 |
| **读写 QPS** | `cmd_get` / `cmd_set` 增量 | 评估负载 |

---

## 总结速查

### 核心考点一览

| 考点 | 关键词 |
|------|--------|
| 内存管理 | Slab Allocation、chunk、LRU、Lazy Expiration |
| 分布式 | 客户端分片、一致性哈希、虚拟节点 |
| 三大问题 | 穿透（布隆/空值）、雪崩（随机TTL）、击穿（互斥锁） |
| vs Redis | 无持久化、无复杂结构、多线程、Slab vs jemalloc |
| 限制 | Key≤250字符、Value≤1MB、TTL≤30天 |
| 安全 | 无认证、防火墙、内网部署 |

---

> 📌 **面试高频考点**：Slab 内存模型 > 一致性哈希 > 与 Redis 对比 > 三大缓存问题
>
> 参考资料：[官方文档](https://memcached.org/) · [GitHub](https://github.com/memcached/memcached) · [Wiki](https://github.com/memcached/memcached/wiki)