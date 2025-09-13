---
title: 常见问题
category:
  - 中间件
tag:
  - Redis
---

# Redis 常见问题汇总

## 1. RDB持久化问题

### 问题描述
Redis配置了RDB快照保存，但当前无法持久化数据，出现以下错误：
```
MISCONF Redis is configured to save RDB snapshots, but is currently not able to persist
```

### 可能原因
- 磁盘空间不足
- 权限不足，无法写入RDB文件
- Redis配置文件中RDB路径不正确
- 系统资源不足

### 解决方案
1. 检查磁盘空间是否充足
2. 确保Redis进程有足够权限写入RDB目录
3. 检查配置文件中的`dir`和`dbfilename`设置
4. 临时禁用RDB持久化（谨慎使用）：
   ```
   redis-cli> CONFIG SET save ""
   ```

## 2. Redis连接被拒绝问题

### 问题表现
客户端无法连接到Redis服务器，出现连接被拒绝的错误。

### 排查步骤

#### 2.1 检查防火墙设置
**本地防火墙检查：**
```bash
# 查看防火墙状态
service iptables status

# 关闭防火墙（临时）
service iptables stop

# 永久关闭防火墙
chkconfig iptables off
```

**服务器防火墙配置：**
```bash
# 开放Redis端口（6379）
/sbin/iptables -I INPUT -p tcp --dport 6379 -j ACCEPT

# 保存防火墙配置
/etc/init.d/iptables save

# 重启防火墙服务
service iptables restart
```

#### 2.2 网络连通性测试
```bash
# 测试是否能ping通Redis服务器
ping [Redis服务器IP]

# 测试端口连通性
telnet [Redis服务器IP] 6379
```

#### 2.3 修改Redis配置文件
编辑`redis.conf`配置文件：

```bash
vi redis.conf
```

**关键配置修改：**

1. **注释绑定地址**（允许远程连接）：
   ```
   # bind 127.0.0.1
   ```
   或者绑定到所有接口：
   ```
   bind 0.0.0.0
   ```

2. **关闭保护模式**：
   ```
   protected-mode no
   ```
   或通过命令行设置：
   ```
   127.0.0.1:6379> config set protected-mode "no"
   ```

3. **守护进程设置**：
   ```
   daemonize no
   ```
   或通过命令行设置：
   ```
   127.0.0.1:6379> config set daemonize "no"
   ```

## 3. Redis主从复制问题

### 3.1 Connection refused 错误

#### 问题描述
在Docker容器中配置Redis主从关系时，从节点启动报错：
```
Error condition on socket for SYNC: Connection refused
```

#### 解决方案
1. **修改Redis主节点配置**：
   ```
   bind 0.0.0.0
   ```

2. **重启Redis主节点服务**

### 3.2 No route to host 错误

#### 问题描述
从服务器启动Redis时提示：
```
20309:S 03 Oct 18:26:28.358 * Connecting to MASTER 10.211.55.6:6379
20309:S 03 Oct 18:26:28.358 * MASTER <-> SLAVE sync started
20309:S 03 Oct 18:26:28.359 # Error condition on socket for SYNC: No route to host
```

#### 解决方案

**方案一：关闭主服务器防火墙**
```bash
# 临时关闭
service iptables stop

# 永久关闭
chkconfig iptables off
```

**方案二：防火墙开放端口**
```bash
# 开放Redis端口
/sbin/iptables -I INPUT -p tcp --dport 6379 -j ACCEPT

# 保存配置
/etc/init.d/iptables save

# 重启防火墙
service iptables restart
```

## 4. 常见问题排查流程

### 4.1 基础检查清单
- [ ] Redis服务是否正常启动
- [ ] 端口是否正确监听
- [ ] 防火墙是否阻止连接
- [ ] 网络连通性是否正常
- [ ] 配置文件是否正确

### 4.2 日志查看
```bash
# 查看Redis日志
tail -f /var/log/redis/redis-server.log

# 或者查看systemd日志
journalctl -u redis -f
```

### 4.3 配置验证
```bash
# 检查当前Redis配置
redis-cli info

# 查看特定配置项
redis-cli config get "*"
```

## 5. 预防措施

### 5.1 监控建议
- 定期检查Redis服务状态
- 监控磁盘空间使用情况
- 设置连接数和内存使用告警
- 定期备份Redis配置文件

### 5.2 最佳实践
- 使用密码认证提高安全性
- 合理配置持久化策略
- 定期更新Redis版本
- 建立完整的备份策略
- 在生产环境中启用保护模式

---

**注意事项：**
- 在生产环境中修改配置前，请务必备份原配置文件
- 关闭防火墙或保护模式可能带来安全风险，请谨慎操作
- 建议在测试环境中先验证解决方案的有效性