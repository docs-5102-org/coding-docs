---
title: Memcached 常用命令
category:
  - 中间件
tag:
  - Memcached
---

# Memcached 常用命令

## 目录

[[toc]]

## 介绍

[入门教程](./starter.md)

## 基本命令

### 客户端连接 Memcached

```bash
telnet 127.0.0.1 11211
```

### 存储命令

1. **set** - 存储键值对（如果键已存在则覆盖）
   ```
   set key flags exptime bytes [noreply]
   value
   ```
   示例：
   ```
   set username 0 900 5
   john
   ```

2. **add** - 仅当键不存在时存储
   ```
   add key flags exptime bytes [noreply]
   value
   ```

3. **replace** - 仅当键存在时替换
   ```
   replace key flags exptime bytes [noreply]
   value
   ```

4. **append** - 向现有值追加数据
   ```
   append key flags exptime bytes [noreply]
   value
   ```

5. **prepend** - 向现有值前添加数据
   ```
   prepend key flags exptime bytes [noreply]
   value
   ```

6. **cas** (Check-And-Set) - 检查并设置
   ```
   cas key flags exptime bytes unique_cas_token [noreply]
   value
   ```

### 检索命令

1. **get** - 获取单个键的值
   ```
   get key
   ```

2. **gets** - 获取单个键的值和CAS令牌
   ```
   gets key
   ```

3. **get multiple** - 获取多个键的值
   ```
   get key1 key2 key3
   ```

### 删除命令

1. **delete** - 删除键
   ```
   delete key [noreply]
   ```

### 统计命令

1. **stats** - 显示服务器统计信息
   ```
   stats
   ```

2. **stats items** - 显示items统计信息
   ```
   stats items
   ```

3. **stats slabs** - 显示slabs统计信息
   ```
   stats slabs
   ```

4. **stats sizes** - 显示items大小信息
   ```
   stats sizes
   ```

5. **flush_all** - 清除所有缓存（可选延迟）
   ```
   flush_all [delay] [noreply]
   ```

## 实用示例

### 存储和检索数据

```bash
set user:1000 0 3600 10
John Smith
STORED

get user:1000
VALUE user:1000 0 10
John Smith
END
```

### 检查统计信息

```bash
stats
STAT pid 1234
STAT uptime 123456
STAT time 1461234567
...
END
```

## 参考资料

- https://memcached.org/
- https://www.runoob.com/memcached

## 注意事项

1. Memcached 默认不提供认证机制，请确保只在可信网络中使用
2. 数据存储在内存中，重启服务会导致数据丢失
3. 键最大长度为250字节，值最大为1MB（默认配置）
4. 过期时间以秒为单位，0表示永不过期