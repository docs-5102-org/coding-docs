---
title: 命令大全
category:
  - 中间件
tag:
  - Redis
---

# Redis 命令大全

Redis是一个开源的内存数据结构存储系统，可以用作数据库、缓存和消息代理。本文档整理了Redis的核心命令，按数据类型和功能分类。

## 目录

[[toc]]

## 官方命令参考

- **Redis官方命令文档**: https://redis.io/commands
- **Redis中文文档**: http://redis.cn/commands.html

## 基础连接命令

### 连接管理
- `PING` - 测试连接是否正常
- `AUTH password` - 验证密码
- `SELECT index` - 选择数据库（0-15）
- `QUIT` - 关闭连接
- `INFO` - 获取服务器信息

## 字符串（String）命令

### 基本操作
- `SET key value` - 设置键值
- `GET key` - 获取键值
- `GETSET key value` - 设置新值并返回旧值
- `MSET key1 value1 key2 value2` - 批量设置
- `MGET key1 key2` - 批量获取
- `DEL key` - 删除键
- `EXISTS key` - 检查键是否存在

### 高级操作
- `INCR key` - 数值递增1
- `INCRBY key increment` - 数值递增指定值
- `DECR key` - 数值递减1
- `DECRBY key decrement` - 数值递减指定值
- `APPEND key value` - 追加字符串
- `STRLEN key` - 获取字符串长度
- `SETRANGE key offset value` - 替换字符串的一部分
- `GETRANGE key start end` - 获取字符串的一部分

### 过期时间
- `EXPIRE key seconds` - 设置过期时间（秒）
- `TTL key` - 获取剩余过期时间
- `PERSIST key` - 移除过期时间
- `SETEX key seconds value` - 设置键值并指定过期时间

## 哈希（Hash）命令

### 基本操作
- `HSET key field value` - 设置哈希字段
- `HGET key field` - 获取哈希字段值
- `HMSET key field1 value1 field2 value2` - 批量设置哈希字段
- `HMGET key field1 field2` - 批量获取哈希字段值
- `HGETALL key` - 获取所有字段和值
- `HDEL key field` - 删除哈希字段
- `HEXISTS key field` - 检查字段是否存在

### 高级操作
- `HKEYS key` - 获取所有字段名
- `HVALS key` - 获取所有字段值
- `HLEN key` - 获取字段数量
- `HINCRBY key field increment` - 字段值递增

## 列表（List）命令

### 基本操作
- `LPUSH key element` - 从左边插入元素
- `RPUSH key element` - 从右边插入元素
- `LPOP key` - 从左边弹出元素
- `RPOP key` - 从右边弹出元素
- `LLEN key` - 获取列表长度
- `LRANGE key start stop` - 获取指定范围元素

### 高级操作
- `LINDEX key index` - 获取指定位置元素
- `LSET key index element` - 设置指定位置元素
- `LTRIM key start stop` - 保留指定范围元素
- `LREM key count element` - 删除指定元素
- `LINSERT key BEFORE|AFTER pivot element` - 在指定元素前后插入

### 阻塞操作
- `BLPOP key timeout` - 阻塞式左弹出
- `BRPOP key timeout` - 阻塞式右弹出

## 集合（Set）命令

### 基本操作
- `SADD key member` - 添加成员
- `SREM key member` - 删除成员
- `SMEMBERS key` - 获取所有成员
- `SISMEMBER key member` - 检查成员是否存在
- `SCARD key` - 获取成员数量
- `SPOP key` - 随机弹出成员
- `SRANDMEMBER key count` - 随机获取成员

### 集合运算
- `SUNION key1 key2` - 并集
- `SINTER key1 key2` - 交集
- `SDIFF key1 key2` - 差集
- `SUNIONSTORE destination key1 key2` - 并集并存储
- `SINTERSTORE destination key1 key2` - 交集并存储
- `SDIFFSTORE destination key1 key2` - 差集并存储

## 有序集合（Sorted Set）命令

### 基本操作
- `ZADD key score member` - 添加成员及分数
- `ZREM key member` - 删除成员
- `ZSCORE key member` - 获取成员分数
- `ZCARD key` - 获取成员数量
- `ZCOUNT key min max` - 获取指定分数范围成员数量

### 排名操作
基于文档中的ZADD实现排名功能，有序集合是实现排行榜的理想数据结构：

- `ZRANGE key start stop [WITHSCORES]` - 按分数从低到高获取成员
- `ZREVRANGE key start stop [WITHSCORES]` - 按分数从高到低获取成员
- `ZRANK key member` - 获取成员排名（从低到高）
- `ZREVRANK key member` - 获取成员排名（从高到低）

### 分数操作
- `ZINCRBY key increment member` - 增加成员分数
- `ZRANGEBYSCORE key min max` - 按分数范围获取成员
- `ZREVRANGEBYSCORE key max min` - 按分数范围倒序获取成员
- `ZREMRANGEBYRANK key start stop` - 按排名删除成员
- `ZREMRANGEBYSCORE key min max` - 按分数删除成员

## 位图（Bitmap）命令

基于文档中的setbit统计活跃用户案例，位图操作在统计场景中非常有用：

### 基本操作
- `SETBIT key offset value` - 设置指定偏移位的值（0或1）
- `GETBIT key offset` - 获取指定偏移位的值
- `BITCOUNT key [start end]` - 统计值为1的位数量
- `BITPOS key bit [start] [end]` - 查找第一个指定值的位位置

### 位运算
- `BITOP operation destkey key [key ...]` - 对多个键执行位运算
  - operation可以是：AND, OR, XOR, NOT

### 实际应用场景
```bash
# 统计日活跃用户
SETBIT daily_active_users:2024-01-01 123 1  # 用户123今天活跃
BITCOUNT daily_active_users:2024-01-01       # 统计今天活跃用户数

# 统计周活跃用户（对7天的bitmap求并集）
BITOP OR weekly_active_users:2024-01-W1 daily_active_users:2024-01-01 daily_active_users:2024-01-02 ... daily_active_users:2024-01-07
BITCOUNT weekly_active_users:2024-01-W1     # 统计本周活跃用户数
```

更多内容参考：[Redis setbit(bitmap)统计活跃用户](./redis-bitmap)

## HyperLogLog命令

用于基数统计，内存使用极少：

- `PFADD key element` - 添加元素
- `PFCOUNT key` - 获取基数估算值
- `PFMERGE destkey sourcekey [sourcekey ...]` - 合并多个HyperLogLog

## 发布订阅命令

- `PUBLISH channel message` - 发布消息
- `SUBSCRIBE channel` - 订阅频道
- `UNSUBSCRIBE channel` - 取消订阅
- `PSUBSCRIBE pattern` - 按模式订阅
- `PUNSUBSCRIBE pattern` - 按模式取消订阅

## 事务命令

- `MULTI` - 开始事务
- `EXEC` - 执行事务
- `DISCARD` - 取消事务
- `WATCH key` - 监视键
- `UNWATCH` - 取消监视

## 脚本命令

- `EVAL script numkeys key [key ...] arg [arg ...]` - 执行Lua脚本
- `EVALSHA sha1 numkeys key [key ...] arg [arg ...]` - 执行已缓存的脚本
- `SCRIPT LOAD script` - 缓存脚本

## 数据库管理命令

- `KEYS pattern` - 查找匹配模式的键（生产环境慎用）
- `SCAN cursor [MATCH pattern] [COUNT count]` - 迭代键
- `FLUSHDB` - 清空当前数据库
- `FLUSHALL` - 清空所有数据库
- `DBSIZE` - 获取键总数
- `RANDOMKEY` - 随机获取一个键

## 服务器管理命令

- `CONFIG GET parameter` - 获取配置参数
- `CONFIG SET parameter value` - 设置配置参数
- `CLIENT LIST` - 获取客户端连接列表
- `CLIENT KILL ip:port` - 终止客户端连接
- `MONITOR` - 监控服务器接收的命令
- `SLOWLOG GET [count]` - 获取慢查询日志
- `LASTSAVE` - 获取最后一次成功保存的时间

## 持久化命令

- `SAVE` - 同步保存数据到磁盘
- `BGSAVE` - 异步保存数据到磁盘
- `BGREWRITEAOF` - 异步重写AOF文件

## 常用性能优化建议

1. **使用Pipeline**: 批量执行命令减少网络往返
2. **避免KEYS命令**: 在生产环境使用SCAN替代
3. **合理设置过期时间**: 避免内存泄漏
4. **使用合适的数据结构**: 根据场景选择最佳数据类型
5. **监控慢查询**: 定期检查SLOWLOG

## 实际应用案例

### 1. 用户会话管理
```bash
# 设置用户会话，30分钟过期
SETEX session:user123 1800 "session_data"
```

### 2. 排行榜系统
```bash
# 游戏分数排行榜
ZADD game_scores 1500 "player1" 2000 "player2"
ZREVRANGE game_scores 0 9 WITHSCORES  # 获取前10名
```

### 3. 消息队列
```bash
# 生产者推送消息
LPUSH message_queue "message1"
# 消费者拉取消息
BRPOP message_queue 10
```

### 4. 分布式锁
```bash
# 获取锁
SET lock:resource "token" NX PX 10000
# 释放锁（使用Lua脚本保证原子性）
```

---

*本文档基于Redis官方文档整理，更多详细信息请参考官方文档。*