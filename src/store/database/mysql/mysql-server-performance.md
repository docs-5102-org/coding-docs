---
title: MySQL服务器性能优化指南
category:
  - 数据库
tag:
  - MySQL
---

# MySQL服务器性能优化指南

## 一、优化目标

根据服务器硬件资源合理配置MySQL系统参数，充分利用现有资源，最大化提升MySQL数据库性能。

## 二、服务器环境

- **内存**: 32GB
- **CPU**: 4核心，每核心8线程
- **MySQL版本**: 5.5
- **当前配置**: my-huge.cnf（MySQL默认最大支持配置）
- **字符编码**: UTF-8

## 三、参数配置优化

### 3.1 连接相关参数

#### 3.1.1 back_log（连接请求队列）

```ini
back_log = 500
```

**参数说明：**
- 当MySQL连接数达到max_connections时，新请求会被存入队列
- 队列大小即为back_log值，超出则拒绝连接
- 建议值不超过系统TCP/IP侦听队列大小（通常为512）
- 每个连接占用约256KB，500个连接占用约125MB

**查看系统限制：**
```bash
cat /proc/sys/net/ipv4/tcp_max_syn_backlog
```

#### 3.1.2 max_connections（最大连接数）

```ini
max_connections = 3000
```

**参数说明：**
- MySQL支持的最大并发连接数（理论上限16384）
- 根据业务并发量调整，建议设置为预期峰值的1.2-1.5倍
- 每个连接会占用缓冲区内存，约占用750MB（按配置估算）

**监控命令：**
```sql
SHOW VARIABLES LIKE 'max_connections';
SHOW STATUS LIKE 'max_used_connections';
```

#### 3.1.3 max_user_connections（单用户最大连接数）

```ini
max_user_connections = 800
```

**参数说明：**
- 限制单个数据库用户的最大并发连接数
- 设置为0表示不限制
- 防止单个用户占用过多连接资源

#### 3.1.4 thread_concurrency（线程并发数）

```ini
thread_concurrency = 64
```

**参数说明：**
- 建议设置为：CPU核心数 × 2
- 当前配置：4个CPU × 8核 × 2 = 64
- 错误设置会导致无法充分利用多核CPU

#### 3.1.5 thread_cache_size（线程缓存池）

```ini
thread_cache_size = 64
```

**参数说明：**
- 缓存空闲线程，避免频繁创建销毁线程
- 根据内存大小推荐值：1GB→8, 2GB→16, 3GB→32, >3GB→64
- **缓存命中率计算：**(Connections - Threads_created) / Connections × 100%
- 命中率应大于90%

**监控命令：**
```sql
SHOW STATUS LIKE 'thread%';
SHOW STATUS LIKE '%connection%';
```

#### 3.1.6 wait_timeout（连接超时时间）

```ini
# wait_timeout = 1800  # 可选配置，30分钟
```

**参数说明：**
- 非交互式连接的空闲超时时间（秒）
- 默认8小时（28800秒），建议根据业务调整
- 配合interactive_timeout使用
- 如发现大量Sleep进程，可适当降低此值

### 3.2 网络相关参数

#### 3.2.1 skip-name-resolve（禁用DNS解析）

```ini
skip-name-resolve
```

**参数说明：**
- 禁止MySQL对外部连接进行DNS解析
- 显著提升连接速度
- **注意：** 启用后必须使用IP地址授权，不能使用主机名

#### 3.2.2 skip-networking（禁用TCP/IP）

```ini
# skip-networking  # 不建议启用
```

**参数说明：**
- 完全关闭TCP/IP连接方式，仅允许本地Socket连接
- 如WEB服务器远程连接MySQL，**不要**启用此选项

### 3.3 存储引擎配置

#### 3.3.1 default-storage-engine（默认存储引擎）

```ini
default-storage-engine = InnoDB
```

**InnoDB相关配置：**
```ini
innodb_data_home_dir = /var/lib/mysql
innodb_log_group_home_dir = /var/lib/mysql

# 注意：首次配置时注释掉此行，避免覆盖现有数据
# innodb_data_file_path = ibdata1:1024M;ibdata2:10M:autoextend

innodb_buffer_pool_size = 1000M
innodb_additional_mem_pool_size = 20M
innodb_log_file_size = 500M
innodb_log_buffer_size = 20M
innodb_flush_log_at_trx_commit = 0
innodb_lock_wait_timeout = 50
```

**重要提醒：**
- 修改配置后，需删除`/var/lib/mysql/`下的`ib_logfile0`和`ib_logfile1`
- 否则MySQL将无法启动

**查看表存储引擎：**
```sql
SHOW TABLE STATUS LIKE 'tablename';
SHOW ENGINES;
```

**修改表存储引擎：**
```sql
ALTER TABLE tablename ENGINE = InnoDB;
```

## 四、缓存参数优化

### 4.1 全局缓存（启动时分配，始终存在）

总计约560MB，包括以下五个参数：

#### 4.1.1 key_buffer_size（MyISAM索引缓存）

```ini
key_buffer_size = 400M
```

**参数说明：**
- MyISAM表索引缓冲区大小
- 对MyISAM表性能影响最大
- 4GB内存服务器建议256M-384M

**性能监控：**
```sql
SHOW STATUS LIKE 'key_read%';
```

**命中率计算：**
- 未命中率 = Key_reads / Key_read_requests × 100%
- 理想值应低于0.1%

#### 4.1.2 innodb_buffer_pool_size（InnoDB缓冲池）

```ini
innodb_buffer_pool_size = 1024M
```

**参数说明：**
- InnoDB最重要的性能参数
- 缓存数据页和索引页
- 建议设置为物理内存的50%-80%
- InnoDB实际占用内存约为此值的1.21倍（包含开销）

**性能监控：**
```sql
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';
```

**命中率计算：**
- 命中率 = (Innodb_buffer_pool_read_requests - Innodb_buffer_pool_reads) / Innodb_buffer_pool_read_requests × 100%
- 理想命中率应大于99%

#### 4.1.3 innodb_additional_mem_pool_size（InnoDB数据字典缓存）

```ini
innodb_additional_mem_pool_size = 20M
```

**参数说明：**
- 存储数据字典和内部数据结构
- 2GB内存推荐20M，32GB内存推荐100M
- 不足时MySQL会在error log中记录Warning

**查看日志：**
```bash
cat /var/lib/mysql/机器名.error
```

#### 4.1.4 innodb_log_buffer_size（InnoDB日志缓冲）

```ini
innodb_log_buffer_size = 20M
```

**参数说明：**
- InnoDB事务日志缓冲区
- 建议1M-8M，事务量大可设置为4M-8M
- 不建议超过32M

**关联参数：innodb_flush_log_trx_commit**
- 0：每秒写入并同步日志（性能最好，可能丢失1秒数据）
- 1：每次事务提交立即写入并同步（最安全，性能较低）
- 2：每次提交写入，每秒同步（折中方案）

#### 4.1.5 query_cache_size（查询缓存）

```ini
query_cache_size = 40M
```

**参数说明：**
- 缓存SELECT语句的结果集
- 表数据变化会使相关缓存失效
- 256MB通常是合适的大小
- 数据变化频繁的场景慎用

**性能监控：**
```sql
SHOW STATUS LIKE 'Qcache_%';
```

**命中率计算：**
- 命中率 = Qcache_hits / (Qcache_hits + Qcache_inserts) × 100%
- 理想命中率应大于90%

### 4.2 会话缓存（按需分配，用完释放）

#### 4.2.1 read_buffer_size（顺序读缓冲）

```ini
read_buffer_size = 4M
```

**参数说明：**
- 用于表的顺序扫描
- 频繁全表扫描时适当增大

#### 4.2.2 sort_buffer_size（排序缓冲）

```ini
sort_buffer_size = 4M
```

**参数说明：**
- ORDER BY和GROUP BY操作使用
- 优先通过索引优化，索引无效时增大此值

#### 4.2.3 read_rnd_buffer_size（随机读缓冲）

```ini
read_rnd_buffer_size = 8M
```

**参数说明：**
- 用于排序后的随机读取
- 每个连接独立分配，不宜过大

#### 4.2.4 tmp_table_size（内存临时表大小）

```ini
tmp_table_size = 16M
```

**参数说明：**
- 内存临时表的最大值
- 超过此值会转为磁盘MyISAM表
- 配合max_heap_table_size使用

### 4.3 其他缓存

#### 4.3.1 table_cache / table_open_cache（表缓存）

```ini
table_open_cache = 512
```

**参数说明：**
- 缓存打开的表句柄
- 建议值 = max_connections × N（N为平均每查询访问表数）
- 避免设置过大导致文件描述符不足

**性能监控：**
```sql
SHOW STATUS LIKE 'Open%tables';
```

**判断标准：**
- 如果Open_tables接近table_cache，且Opened_tables持续增长，需增大此值

## 五、配置文件示例

```ini
[mysqld]
# 连接配置
back_log = 500
max_connections = 3000
max_user_connections = 800
thread_concurrency = 64
thread_cache_size = 64

# 网络配置
skip-name-resolve

# 存储引擎
default-storage-engine = InnoDB

# MyISAM配置
key_buffer_size = 400M

# InnoDB配置
innodb_data_home_dir = /var/lib/mysql
innodb_log_group_home_dir = /var/lib/mysql
innodb_buffer_pool_size = 1024M
innodb_additional_mem_pool_size = 20M
innodb_log_file_size = 500M
innodb_log_buffer_size = 20M
innodb_flush_log_at_trx_commit = 0
innodb_lock_wait_timeout = 50

# 查询缓存
query_cache_size = 40M

# 会话缓存
read_buffer_size = 4M
sort_buffer_size = 4M
read_rnd_buffer_size = 8M
tmp_table_size = 16M

# 表缓存
table_open_cache = 512
```

## 六、配置生效步骤

1. **备份原配置文件**
   ```bash
   cp /etc/my.cnf /etc/my.cnf.backup
   ```

2. **编辑配置文件**
   ```bash
   vi /etc/my.cnf
   ```

3. **删除InnoDB日志文件**（如修改了innodb_log_file_size）
   ```bash
   rm /var/lib/mysql/ib_logfile*
   ```

4. **重启MySQL服务**
   ```bash
   service mysql restart
   ```

5. **验证配置**
   ```sql
   SHOW VARIABLES LIKE '参数名';
   ```

## 七、性能监控建议

### 7.1 关键监控指标

```sql
-- 连接状态
SHOW STATUS LIKE 'Threads_%';
SHOW STATUS LIKE 'Max_used_connections';

-- 缓存命中率
SHOW STATUS LIKE 'Qcache_%';
SHOW STATUS LIKE 'Key_read%';
SHOW STATUS LIKE 'Innodb_buffer_pool_read%';

-- 临时表使用
SHOW STATUS LIKE 'Created_tmp%';

-- 慢查询
SHOW VARIABLES LIKE 'slow_query_log';
SHOW STATUS LIKE 'Slow_queries';
```

### 7.2 优化建议

1. **优先使用索引优化**，避免全表扫描
2. **监控慢查询日志**，针对性优化SQL
3. **定期分析表**，保持索引效率
4. **根据实际负载调整参数**，避免盲目增大
5. **关注内存使用率**，防止OOM
6. **定期查看error log**，及时发现问题

## 八、注意事项

1. **内存规划**
   - 全局缓存 + (会话缓存 × max_connections) < 物理内存 × 80%
   - 为操作系统和其他服务预留足够内存

2. **配置调整原则**
   - 循序渐进，逐步调优
   - 每次只调整少数参数
   - 调整后观察一段时间再继续

3. **存储引擎选择**
   - 读多写少：MyISAM
   - 事务支持、高并发：InnoDB
   - 根据业务特点合理选择

4. **定期维护**
   - 分析和优化表：`ANALYZE TABLE` / `OPTIMIZE TABLE`
   - 清理过期数据
   - 监控磁盘空间

## 九、参考资源

- [MySQL官方文档 - Server System Variables](https://dev.mysql.com/doc/refman/5.5/en/server-system-variables.html)
- [InnoDB与MyISAM存储引擎对比](http://dbahacker.com/mysql/innodb-myisam-compare)
- [MySQL性能优化最佳实践](https://www.percona.com/blog/)

---

**最后更新日期**: 根据实际修改日期填写  
**适用版本**: MySQL 5.5及以上  
**作者**: 根据实际情况填写