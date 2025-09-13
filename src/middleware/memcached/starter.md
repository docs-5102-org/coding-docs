---
title: Memcached 入门教程
category:
  - 中间件
tag:
  - Memcached
---

# Memcached 入门教程

## 目录

[[toc]]

## 什么是 Memcached？

Memcached 是一个高性能的分布式内存对象缓存系统，专门设计用于动态 Web 应用以减轻数据库负载。它通过在内存中缓存数据和对象来减少读取数据库的次数，从而提高动态、数据库驱动网站的速度。

### 核心特点

- **基于键值对存储**：使用 hashmap 结构存储数据
- **纯内存缓存**：所有数据都存储在内存中，访问速度极快
- **分布式架构**：支持多台服务器构建缓存集群
- **协议简单**：支持文本协议和二进制协议
- **高性能**：基于 libevent 的事件处理，支持高并发

## Memcached 的工作原理

### 存储机制

Memcached 基于一个存储键/值对的 hashmap 结构。其守护进程用 C 语言编写，客户端可以用任何语言来编写，并通过 memcached 协议与守护进程通信。

### 内存管理

- **LRU 算法**：当内存容量达到指定值后，基于 LRU（Least Recently Used）算法自动删除不常使用的缓存
- **Slab 分配**：使用 slab 分配器来管理内存，减少内存碎片
- **数据易失性**：数据仅存在于内存中，重启服务或系统会导致全部数据消失

### 分布式算法

Memcached 服务器端本身没有分布式功能，分布式完全依赖客户端实现。主要有两种分布式算法：

#### 1. 余数计算分散法（传统方法）
```
server_index = CRC(key) % N
```
- 简单有效，数据分散均匀
- 缺点：添加或移除服务器时，缓存重组代价大

#### 2. 一致性哈希算法（推荐）
- 将服务器节点和数据键都映射到一个环形空间（0~2^32）
- 数据顺时针查找最近的服务器节点进行存储
- 优点：添加或移除节点时，只影响部分数据，损失最小

## 安装配置

### Linux 系统安装

#### 前置依赖
首先需要安装 libevent 库：

**Ubuntu/Debian:**
```bash
sudo apt-get install libevent libevent-dev
```

**Redhat/Fedora/CentOS:**
```bash
yum install libevent libevent-dev
```

#### 自动安装（推荐）

**Ubuntu/Debian:**
```bash
sudo apt-get install memcached
```

**Redhat/Fedora/CentOS:**
```bash
yum install memcached
```

**FreeBSD:**
```bash
portmaster databases/memcached
```

#### 源码编译安装

```bash
# 下载最新版本
wget http://memcached.org/latest

# 解压
tar -zxvf memcached-1.x.x.tar.gz
cd memcached-1.x.x

# 配置编译
./configure --prefix=/usr/local/memcached
make && make test

# 安装
sudo make install
```

#### 启动参数说明

- `-d`：作为守护进程运行
- `-m`：分配给 Memcached 使用的内存数量（单位：MB）
- `-u`：运行 Memcached 的用户
- `-l`：监听的服务器 IP 地址
- `-p`：设置监听端口（默认 11211）
- `-c`：最大并发连接数（默认 1024）
- `-P`：设置保存 pid 的文件路径

#### 前台运行（调试模式）
```bash
/usr/local/memcached/bin/memcached -p 11211 -m 64m -vv
```

#### 后台运行
```bash
# 简单启动
/usr/local/memcached/bin/memcached -p 11211 -m 64m -d

# 完整参数启动
/usr/local/memcached/bin/memcached -d -m 64M -u root -l 192.168.0.200 -p 11211 -c 256 -P /tmp/memcached.pid
```

### Windows 系统安装

由于官方未提供 Windows 安装包，需要下载第三方编译版本：

#### 下载地址
- 32位系统 1.4.4版本：[memcached-win32-1.4.4-14.zip](http://static.runoob.com/download/memcached-win32-1.4.4-14.zip)
- 64位系统 1.4.4版本：[memcached-win64-1.4.4-14.zip](http://static.runoob.com/download/memcached-win64-1.4.4-14.zip)
- 32位系统 1.4.5版本：[memcached-1.4.5-x86.zip](http://static.runoob.com/download/memcached-1.4.5-x86.zip)
- 64位系统 1.4.5版本：[memcached-1.4.5-amd64.zip](http://static.runoob.com/download/memcached-1.4.5-amd64.zip)

#### 版本 < 1.4.5 安装方法

1. 解压到指定目录
2. 以管理员权限安装服务：
```cmd
c:\memcached\memcached.exe -d install
```

3. 启动和停止服务：
```cmd
c:\memcached\memcached.exe -d start
c:\memcached\memcached.exe -d stop
```

4. 卸载服务：
```cmd
c:\memcached\memcached.exe -d uninstall
```

#### 版本 >= 1.4.5 安装方法

1. 解压到指定目录
2. 添加到任务计划：
```cmd
schtasks /create /sc onstart /tn memcached /tr "'c:\memcached\memcached.exe' -m 512"
```

3. 删除任务计划：
```cmd
schtasks /delete /tn memcached
```

## 基本使用

### 文本协议操作

Memcached 使用简单的基于文本行的协议，可以直接通过 telnet 进行操作：

```bash
$ telnet localhost 11211
Trying 127.0.0.1...
Connected to localhost.localdomain (127.0.0.1).
Escape character is '^]'.

# 存储数据
set foo 0 0 3
bar
STORED

# 获取数据
get foo
VALUE foo 0 3
bar
END
```

### 常用命令

#### 存储命令
- `set key flags exptime bytes`：存储键值对
- `add key flags exptime bytes`：仅当键不存在时存储
- `replace key flags exptime bytes`：仅当键存在时替换

#### 获取命令
- `get key`：获取单个键的值
- `gets key`：获取键的值和 CAS 标识
- `get key1 key2 ...`：获取多个键的值

#### 删除命令
- `delete key`：删除指定键
- `flush_all`：清空所有缓存

#### 统计命令
- `stats`：显示服务器统计信息
- `stats items`：显示各 slab 的统计信息
- `version`：显示版本信息

## 应用场景

### 典型使用场景

1. **数据库查询缓存**：缓存频繁查询的数据库结果
2. **页面缓存**：缓存动态生成的页面内容
3. **对象缓存**：缓存计算复杂的对象
4. **会话存储**：存储用户会话信息
5. **计数器**：实现访问量统计等功能

### 最佳实践

1. **设置合适的过期时间**：避免数据过期和内存浪费
2. **键名规范**：使用有意义且唯一的键名
3. **数据序列化**：复杂对象需要序列化后存储
4. **错误处理**：妥善处理缓存失效的情况
5. **监控维护**：定期监控内存使用和命中率

## 性能优化

### 内存调优
- 根据应用需求合理分配内存大小
- 监控内存使用情况，避免频繁的 LRU 淘汰
- 合理设置数据过期时间

### 网络优化
- 使用二进制协议提高效率
- 批量操作减少网络开销
- 合理设置连接池大小

### 分布式优化
- 使用一致性哈希算法
- 合理规划服务器节点
- 实现故障转移机制

## 安全注意事项

1. **网络安全**：Memcached 缺乏认证机制，应部署在防火墙后
2. **访问控制**：限制访问来源，避免未授权访问
3. **数据敏感性**：不要存储敏感信息，如密码等
4. **版本更新**：及时更新到最新版本，修复安全漏洞

## 总结

Memcached 是一个简单、高效的内存缓存系统，特别适合用于减轻数据库负载、提高 Web 应用性能。通过合理的部署和使用，可以显著提升应用的响应速度和并发处理能力。

在使用时需要注意：
- Memcached 是缓存而非持久化存储
- 需要在应用层处理缓存失效的情况
- 安全性需要通过网络层面进行保障
- 分布式功能依赖客户端实现

掌握 Memcached 的基本概念和使用方法，对于构建高性能的 Web 应用具有重要意义。