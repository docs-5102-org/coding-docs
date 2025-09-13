---
title: Redis Stack 教程
category:
  - 中间件
tag:
  - Redis Stack
---

# Redis Stack 教程

## 目录

[[toc]]

## 简介

Redis Stack 是一个集成了多个 Redis 模块的完整数据库平台，它将开源 Redis 与 RediSearch、RedisJSON、RedisGraph、RedisTimeSeries 和 RedisBloom 等模块结合在一起。这个平台专为构建实时应用程序而设计，能够在毫秒级别内可靠地处理请求，统一并简化了 Redis 的开发使用过程，显著提高工作效率。

Redis Stack 还集成了 RedisInsight，这是一个用于分析和优化 Redis 数据的可视化工具。

### 核心模块

**RediSearch**: 提供全文搜索功能，支持复杂的查询和索引功能，使得 Redis 可以高效地进行文本搜索和数据查询。

**RedisJSON**: 允许在 Redis 中存储和操作 JSON 数据。支持对 JSON 文档进行直接的 CRUD（创建、读取、更新、删除）操作，并且可以在存储层面上直接查询 JSON 数据。

**RedisGraph**: 图数据库模块，使用 Cypher 查询语言。允许用户以高性能的方式存储和查询图形数据结构，适用于需要图数据库功能的场景。

**RedisTimeSeries**: 专为时间序列数据设计的模块。支持高效的数据存储和查询，以及复杂的时间序列数据聚合操作，适用于监控数据、股市数据等场景。

**RedisBloom**: 提供概率数据结构，如 Bloom Filter 和 Cuckoo Filter，用于高效的成员存在性检测和近似计数。

**RedisAI**: 集成机器学习模型的执行能力，支持在 Redis 中直接运行 TensorFlow、PyTorch、ONNX 等框架的模型。

> **重要提示**: 目前 RediSearch 仅支持数据库为 0 的索引

## Docker 安装 Redis Stack

### 安装说明

Redis Stack 自动包含 Redis 和 redis-cli 服务，无需再额外手动安装 Redis 服务。

官网提供了两个版本：

- **redis/redis-stack**: 包含 Redis Stack 服务器和 RedisInsight。此容器最适合本地开发，因为可以使用嵌入式 RedisInsight 来可视化数据。
- **redis/redis-stack-server**: 仅提供 Redis Stack 服务器。此容器最适合生产部署。

### 基础安装

#### 拉取镜像

```bash
docker pull redis/redis-stack:latest
mkdir -p /opt/docker/redis-stack/data
```

#### 启动容器

```bash
sudo docker run -p 6379:6379 -p 8001:8001 \
--name redis-stack \
-e REDIS_ARGS="--appendonly yes --protected-mode no" \
-v /opt/docker/redis-stack/data:/data \
--restart=always \
-d redis/redis-stack
```

**命令解析**:
- `-p 6379:6379`: Redis 端口映射
- `-p 8001:8001`: RedisInsight 可视化工具端口映射
- `--name redis-stack`: 设置容器名称
- `-v /opt/docker/redis-stack/data:/data`: 数据卷挂载
- `--restart=always`: 跟随 Docker 自动重启
- `-d`: 在容器后台运行
- `-e REDIS_ARGS`: Redis 额外参数
  - `--appendonly yes`: 开启持久化
  - `--protected-mode no`: 关闭保护模式

> **注意**: 不要直接使用 redis-server 命令携带参数，这样会导致配置文件中的加载模块配置丢失。一定要使用 `-e REDIS_ARGS` 命令携带参数启动容器。

#### 验证安装

**查看容器日志**:
```bash
sudo docker logs redis-stack
```

**进入容器检查模块**:
```bash
sudo docker exec -it redis-stack bash
redis-cli
module list
```

成功安装后应该看到以下模块：
- redisgears_2
- timeseries
- RedisCompat
- ReJSON
- search
- bf

### 仅服务器版本安装

如果不需要 RedisInsight，可以安装仅包含服务器的版本：

```bash
docker run -d --name redis-stack-server -p 6379:6379 redis/redis-stack-server:latest
```

### 通过配置文件安装（高级）

#### 创建配置文件

```bash
cd /opt/docker/redis-stack
vi redis-stack.conf
```

配置文件内容：
```
protected-mode no
bind 0.0.0.0
port 6379
daemonize no
loadmodule /opt/redis-stack/lib/rediscompat.so
loadmodule /opt/redis-stack/lib/redisearch.so
loadmodule /opt/redis-stack/lib/redistimeseries.so
loadmodule /opt/redis-stack/lib/rejson.so
loadmodule /opt/redis-stack/lib/redisbloom.so
loadmodule /opt/redis-stack/lib/redisgears.so v8-plugin-path /opt/redis-stack/lib/libredisgears_v8_plugin.so
```

#### 启动容器

```bash
sudo docker run -p 6379:6379 -p 8001:8001 \
--name redis-stack \
-v /opt/docker/redis-stack/data:/data \
-v /opt/docker/redis-stack/redis-stack.conf:/etc/redis-stack.conf \
--restart=always \
-d redis/redis-stack
```

> **重要**: 两种配置方式不要混用（配置文件 + 命令行参数）

## 环境变量参数

Redis Stack 支持以下环境变量：

- **REDIS_ARGS**: Redis 的额外参数
- **REDISEARCH_ARGS**: RediSearch 的参数
- **REDISJSON_ARGS**: RedisJSON 的参数
- **REDISGRAPH_ARGS**: RedisGraph 的参数
- **REDISTIMESERIES_ARGS**: RedisTimeSeries 的参数
- **REDISBLOOM_ARGS**: RedisBloom 的参数

### 常用示例

**设置密码**:
```bash
docker run -e REDIS_ARGS="--requirepass redis-stack" redis/redis-stack:latest
```

**Redis 持久化**:
```bash
docker run -e REDIS_ARGS="--save 60 1000 --appendonly yes" redis/redis-stack:latest
```

**设置保留策略**:
```bash
docker run -e REDISTIMESERIES_ARGS="RETENTION_POLICY=20" redis/redis-stack:latest
```

## 配置文件说明

Redis Stack 有两个配置文件位置：

- 系统级: `/etc/redis-stack.conf`
- 软件级: `/opt/redis-stack/etc/redis-stack.conf`

**重要**: `/opt/redis-stack/etc/redis-stack.conf` 为最终生效配置，会覆盖其他配置。

通常情况下，挂载系统级别的配置文件即可。如果需要修改端口号，则需要修改软件级的配置文件或挂载该文件。

## 访问服务

### Redis 连接

通过标准 Redis 客户端连接到端口 6379：
```bash
redis-cli -h your_server_ip -p 6379
```

### RedisInsight Web 界面

通过浏览器访问：`http://your_server_ip:8001`

> **注意**: 如果部署在云服务器上，需要配置防火墙和安全组放行相关端口号（6379、8001）。只有安装 `redis/redis-stack` 版本才包含 RedisInsight，`redis/redis-stack-server` 版本不包含。

## 总结

Redis Stack 将 Redis 扩展为一个多模型数据库，支持多种数据类型和复杂的数据操作。这不仅提高了 Redis 的灵活性和应用场景，也使得开发者能够更高效地构建复杂的应用程序。

对于开发环境，建议直接使用命令行参数配置，专注于业务开发。生产环境可以考虑使用配置文件进行更精细的控制。

## 参考链接

- [RediSearch GitHub](https://github.com/RediSearch/RediSearch)
- [Redis Stack Docker 安装](https://redis.io/docs/install/install-stack/docker/)
- [Redis Stack 文档](https://redis.io/docs/about/about-stack/)
- [搜索和查询文档](https://redis.io/docs/latest/develop/interact/search-and-query)