---
title: 安装与配置指南
category:
  - 中间件
tag:
  - Redis
---

# Redis 安装与配置指南

## Windows 系统安装

### 安装步骤

参考菜鸟教程：https://www.runoob.com/redis/redis-install.html

### 服务管理命令
```bash
# 安装服务
redis-server --service-install redis.windows.conf --loglevel verbose

# 卸载服务
redis-server --service-uninstall

# 启动服务
redis-server --service-start
```

### 中文乱码解决方案
1. 执行命令修改编码页：
   ```cmd
   chcp 65001
   ```
2. 右键命令行标题栏 → 选择"属性" → "字体" → 修改为"Lucida Console"

## Linux 系统安装

### 默认安装目录
```
/usr/local/redis
```

### 常用命令
```bash

# 启动Redis服务（后台模式）
./redis-server &

# 启动Redis服务（后台模式）指定配置文件
./redis-server /usr/local/redis/redis.conf &

# 客户端连接（指定端口）
./redis-cli -p 6278
```

### 连接信息
- 默认端口：6278
- 认证密码：vHlvVgq9Za

## 配置文件说明
主要配置文件为`redis.conf`，位于：
- Windows: 安装目录下
- Linux: `/usr/local/redis/`

建议安装后根据实际需求修改配置参数。

> 注意：生产环境请务必修改默认密码和端口号！


## Docker 安装 Redis

官网：https://hub.docker.com/_/redis

----------------------------------------
一、前置条件
----------------------------------------
1. 已安装 Docker 20.10+  
   验证：`docker run hello-world` 能看到 “Hello from Docker!” 即 OK。  
2. （可选）已安装 Docker Compose v2+。

----------------------------------------
二、场景 1：一条命令跑起 Redis（最快体验）
----------------------------------------
```bash
docker run -d --name redis-quick -p 6379:6379 redis
```
测试：
```bash
docker exec -it redis-quick redis-cli ping   # 返回 PONG
```
**特点**：容器删了数据就丢，适合临时测试。

----------------------------------------
三、场景 2：带持久化的标准容器
----------------------------------------
```bash
# 1. 创建专用 volume（Docker 管理）
docker volume create redis-data

# 2. 启动并挂载
docker run -d --name redis-prod \
  -p 6379:6379 \
  -v redis-data:/data \
  redis redis-server --appendonly yes
```
**说明**：  
- `/data` 是官方镜像默认数据目录；  
- `appendonly yes` 开启 AOF，容器重启数据仍在 。

----------------------------------------
四、场景 3：自定义端口 + 密码 + 配置（生产推荐）
----------------------------------------
1. 准备目录与文件  
```bash
mkdir -p ~/redis-docker && cd ~/redis-docker
```
2. 新建配置文件 `redis.conf`（示例）  
```
port 6380
requirepass MyStrongPass123
appendonly yes
maxmemory 256mb
```
3. 启动（命令行版）
```bash
docker run -d --name redis-custom \
  -p 6380:6380 \
  -v $PWD/redis.conf:/usr/local/etc/redis/redis.conf:ro \
  redis redis-server /usr/local/etc/redis/redis.conf
```
4. 或 **docker-compose.yml**（更易维护）  
```yaml
version: "3.8"
services:
  redis:
    image: redis:7.2-alpine
    container_name: my-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - ./data:/data          # 本地持久化
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf --requirepass MyStrongPass123
```
启动：`docker compose up -d` 

----------------------------------------
五、连接与验证
----------------------------------------
- 本地 CLI  
```bash
docker exec -it redis-custom redis-cli -p 6380 -a MyStrongPass123
127.0.0.1:6380> ping
PONG
```
- Python 示例
```python
import redis
r = redis.Redis(host='localhost', port=6380, password='MyStrongPass123')
r.set('foo', 'bar')
print(r.get('foo'))   # b'bar'
```

----------------------------------------
六、常用运维指令
----------------------------------------
| 操作 | 命令 |
|---|---|
| 停止并删除容器 | `docker stop redis-custom && docker rm redis-custom` |
| 查看日志 | `docker logs -f redis-custom` |
| 备份数据 | `docker exec redis-custom tar czf /data/backup.tar.gz /data` |
| 升级镜像 | `docker pull redis && docker compose up -d`（Compose 场景） |

----------------------------------------
七、常见问题速查
----------------------------------------
- **端口占用**：6379 被占用时改映射 `-p 16379:6379`。  
- **中文乱码**：CLI 加 `--raw` 或用 `redis-cli --no-raw --encoding utf-8`。  
- **权限拒绝**：确认宿主机目录权限 `chmod 777 data` 或改用 Docker volume。

至此，Docker 下的 Redis 已可开发、测试、生产全场景使用。