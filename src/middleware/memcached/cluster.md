---
title: Memcached 集群搭建指南
category:
  - 中间件
tag:
  - Memcached
---

# Memcached 集群搭建完整指南

## 目录

[[toc]]

## 概述
本文档详细介绍了如何搭建 Memcached 分布式集群，并提供完整的 Java 客户端实现。Memcached 本身不支持分布式，需要在客户端实现分布式策略。

## 环境准备

### 服务器信息
- 服务器1：192.168.176.129
- 服务器2：192.168.176.130  
- 服务器3：192.168.176.131
- 端口：1211

### 系统要求
- Linux 操作系统
- 已安装 yum 包管理器
- 具有 root 权限

## 安装步骤

### 1. 安装依赖
在三台服务器上分别执行以下命令安装 libevent：

```bash
yum install libevent libevent-devel -y
```

### 2. 下载并安装 Memcached

```bash
# 解压安装包
tar -zxvf memcached-1.2.5.tar.gz
cd memcached-1.2.5

# 编译安装
./configure
make
make install

# 默认安装到 /usr/local/bin 目录下
```

### 3. 启动 Memcached 服务

在三台服务器上分别启动 Memcached：

```bash
# 前台启动（用于调试）
/usr/local/bin/memcached -u root -p 1211 -m 64m -vv

# 后台启动（生产环境推荐）
/usr/local/bin/memcached -u root -p 1211 -m 64m -d
```

#### 启动参数说明
- `-u root`：运行用户
- `-p 1211`：监听端口
- `-m 64m`：分配内存大小（64MB）
- `-vv`：详细模式，输出调试信息到控制台
- `-d`：以守护进程方式在后台运行
- `-l IP`：监听的服务器IP地址
- `-c`：最大并发连接数（默认1024）
- `-P`：PID文件保存路径

### 4. 验证服务状态

```bash
# 检查进程
ps aux | grep memcached

# 检查端口
netstat -tlnp | grep 1211

# 简单测试连接
telnet 192.168.176.129 1211
```

## Java 客户端实现

### 依赖配置
在 `pom.xml` 中添加必要依赖：

```xml
<dependency>
    <groupId>com.whalin</groupId>
    <artifactId>Memcached-Java-Client</artifactId>
    <version>3.0.2</version>
</dependency>
<dependency>
    <groupId>log4j</groupId>
    <artifactId>log4j</artifactId>
    <version>1.2.17</version>
</dependency>
```

### 完整工具类实现

```java
package com.benxq.test;

import java.util.Date;
import org.apache.log4j.Logger;
import com.whalin.MemCached.MemCachedClient;
import com.whalin.MemCached.SockIOPool;

/**
 * Memcached 分布式缓存工具类
 * 实现客户端分布式策略，支持多服务器负载均衡
 * 
 * @author qucf
 * @date 2016年1月14日
 */
public class MemcachedUtils {

    private static final Logger logger = Logger.getLogger(MemcachedUtils.class);
    
    // 连接池名称
    private static final String POOL_NAME = "memcached_cluster";
    private static SockIOPool sockIOPool = SockIOPool.getInstance(POOL_NAME);
    
    // 服务器集群配置
    private static final String[] SERVERS = {
        "192.168.176.129:1211",
        "192.168.176.130:1211", 
        "192.168.176.131:1211"
    };
    
    // 服务器权重配置（权重越高，分配的请求越多）
    private static final Integer[] SERVER_WEIGHTS = {1, 1, 1};
    
    private static MemCachedClient cachedClient;

    // 静态初始化连接池
    static {
        initializeConnectionPool();
        initializeClient();
    }

    /**
     * 初始化连接池配置
     */
    private static void initializeConnectionPool() {
        // 基本配置
        sockIOPool.setServers(SERVERS);
        sockIOPool.setWeights(SERVER_WEIGHTS);
        
        // 连接数配置
        sockIOPool.setInitConn(5);          // 初始连接数
        sockIOPool.setMinConn(2);           // 最小连接数
        sockIOPool.setMaxConn(20);          // 最大连接数
        sockIOPool.setMaxIdle(10000);       // 最大空闲时间（毫秒）
        
        // 维护线程配置
        sockIOPool.setMaintSleep(0);        // 维护线程睡眠时间（0表示不启动维护线程）
        
        // 网络配置
        sockIOPool.setNagle(false);         // 关闭Nagle算法，提高响应速度
        sockIOPool.setSocketTO(5000);       // Socket读取超时时间
        sockIOPool.setSocketConnectTO(3000); // Socket连接超时时间
        
        // 容错配置
        sockIOPool.setAliveCheck(false);    // 关闭连接心跳检测（减少网络负载）
        sockIOPool.setFailback(true);       // 启用故障恢复
        sockIOPool.setFailover(true);       // 启用故障转移
        
        // Hash算法配置
        // 0: String.hashCode() - JDK依赖，兼容性差
        // 1: Original算法 - 兼容其他客户端
        // 2: CRC32算法 - 兼容性好，性能优于original
        // 3: MD5算法 - 使用一致性Hash
        sockIOPool.setHashingAlg(3);
        
        // 启动连接池
        sockIOPool.initialize();
        
        logger.info("Memcached连接池初始化完成，服务器列表：" + String.join(",", SERVERS));
    }

    /**
     * 初始化客户端
     */
    private static void initializeClient() {
        cachedClient = new MemCachedClient(POOL_NAME);
        
        // 压缩配置
        cachedClient.setCompressEnable(true);     // 启用压缩
        cachedClient.setCompressThreshold(1024);  // 压缩阈值1KB
        
        // 数据类型配置
        cachedClient.setPrimitiveAsString(false); // 不强制转换为String类型
        
        logger.info("Memcached客户端初始化完成");
    }

    private MemcachedUtils() {
        // 工具类，禁止实例化
    }

    /**
     * 添加或更新缓存数据
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @return 操作是否成功
     */
    public static boolean set(String key, Object value) {
        return set(key, value, null);
    }

    /**
     * 添加或更新缓存数据（带过期时间）
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @param expireDate 过期时间
     * @return 操作是否成功
     */
    public static boolean set(String key, Object value, Date expireDate) {
        if (key == null || key.trim().isEmpty()) {
            logger.warn("缓存key为空，操作失败");
            return false;
        }
        
        try {
            boolean result = cachedClient.set(key, value, expireDate);
            if (result) {
                logger.debug("缓存设置成功，key: " + key);
            } else {
                logger.warn("缓存设置失败，key: " + key);
            }
            return result;
        } catch (Exception e) {
            logger.error("缓存set操作异常，key: " + key, e);
            return false;
        }
    }

    /**
     * 仅当key不存在时添加缓存
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @return 操作是否成功
     */
    public static boolean add(String key, Object value) {
        return add(key, value, null);
    }

    /**
     * 仅当key不存在时添加缓存（带过期时间）
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @param expireDate 过期时间
     * @return 操作是否成功
     */
    public static boolean add(String key, Object value, Date expireDate) {
        if (key == null || key.trim().isEmpty()) {
            logger.warn("缓存key为空，操作失败");
            return false;
        }
        
        try {
            boolean result = cachedClient.add(key, value, expireDate);
            if (result) {
                logger.debug("缓存添加成功，key: " + key);
            } else {
                logger.debug("缓存key已存在，添加失败，key: " + key);
            }
            return result;
        } catch (Exception e) {
            logger.error("缓存add操作异常，key: " + key, e);
            return false;
        }
    }

    /**
     * 仅当key存在时替换缓存
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @return 操作是否成功
     */
    public static boolean replace(String key, Object value) {
        return replace(key, value, null);
    }

    /**
     * 仅当key存在时替换缓存（带过期时间）
     * 
     * @param key 缓存键
     * @param value 缓存值
     * @param expireDate 过期时间
     * @return 操作是否成功
     */
    public static boolean replace(String key, Object value, Date expireDate) {
        if (key == null || key.trim().isEmpty()) {
            logger.warn("缓存key为空，操作失败");
            return false;
        }
        
        try {
            boolean result = cachedClient.replace(key, value, expireDate);
            if (result) {
                logger.debug("缓存替换成功，key: " + key);
            } else {
                logger.debug("缓存key不存在，替换失败，key: " + key);
            }
            return result;
        } catch (Exception e) {
            logger.error("缓存replace操作异常，key: " + key, e);
            return false;
        }
    }

    /**
     * 获取缓存数据
     * 
     * @param key 缓存键
     * @return 缓存值，不存在返回null
     */
    public static Object get(String key) {
        if (key == null || key.trim().isEmpty()) {
            logger.warn("缓存key为空，获取失败");
            return null;
        }
        
        try {
            Object result = cachedClient.get(key);
            if (result != null) {
                logger.debug("缓存命中，key: " + key);
            } else {
                logger.debug("缓存未命中，key: " + key);
            }
            return result;
        } catch (Exception e) {
            logger.error("缓存get操作异常，key: " + key, e);
            return null;
        }
    }

    /**
     * 删除缓存数据
     * 
     * @param key 缓存键
     * @return 操作是否成功
     */
    public static boolean delete(String key) {
        return delete(key, null);
    }

    /**
     * 删除缓存数据（延迟删除）
     * 
     * @param key 缓存键
     * @param expireDate 延迟删除时间
     * @return 操作是否成功
     */
    public static boolean delete(String key, Date expireDate) {
        if (key == null || key.trim().isEmpty()) {
            logger.warn("缓存key为空，删除失败");
            return false;
        }
        
        try {
            boolean result = cachedClient.delete(key, expireDate);
            if (result) {
                logger.debug("缓存删除成功，key: " + key);
            } else {
                logger.debug("缓存key不存在，删除失败，key: " + key);
            }
            return result;
        } catch (Exception e) {
            logger.error("缓存delete操作异常，key: " + key, e);
            return false;
        }
    }

    /**
     * 清空所有缓存数据
     * 
     * @return 操作是否成功
     */
    public static boolean flushAll() {
        try {
            boolean result = cachedClient.flushAll();
            if (result) {
                logger.info("所有缓存清空成功");
            } else {
                logger.warn("缓存清空失败");
            }
            return result;
        } catch (Exception e) {
            logger.error("缓存flushAll操作异常", e);
            return false;
        }
    }

    /**
     * 获取连接池统计信息
     * 
     * @return 统计信息字符串
     */
    public static String getStats() {
        return sockIOPool.getStats().toString();
    }

    /**
     * 关闭连接池（应用关闭时调用）
     */
    public static void shutdown() {
        if (sockIOPool != null) {
            sockIOPool.shutDown();
            logger.info("Memcached连接池已关闭");
        }
    }

    /**
     * 测试方法
     */
    public static void main(String[] args) {
        // 基本操作测试
        System.out.println("=== Memcached 集群测试 ===");
        
        // 添加数据
        boolean addResult = MemcachedUtils.add("test_key", "Hello Memcached!");
        System.out.println("添加结果: " + addResult);
        
        // 获取数据
        Object value = MemcachedUtils.get("test_key");
        System.out.println("获取结果: " + value);
        
        // 更新数据
        boolean setResult = MemcachedUtils.set("test_key", "Updated Value");
        System.out.println("更新结果: " + setResult);
        
        // 再次获取
        Object updatedValue = MemcachedUtils.get("test_key");
        System.out.println("更新后的值: " + updatedValue);
        
        // 删除数据
        boolean deleteResult = MemcachedUtils.delete("test_key");
        System.out.println("删除结果: " + deleteResult);
        
        // 验证删除
        Object deletedValue = MemcachedUtils.get("test_key");
        System.out.println("删除后的值: " + deletedValue);
        
        // 输出连接池统计
        System.out.println("连接池统计: " + MemcachedUtils.getStats());
    }
}
```

## 配置文件

### log4j.properties 配置示例

```properties
# 根日志级别
log4j.rootLogger=INFO, stdout, file

# 控制台输出
log4j.appender.stdout=org.apache.log4j.ConsoleAppender
log4j.appender.stdout.layout=org.apache.log4j.PatternLayout
log4j.appender.stdout.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} [%t] %-5p %c{1} - %m%n

# 文件输出
log4j.appender.file=org.apache.log4j.DailyRollingFileAppender
log4j.appender.file.File=logs/memcached.log
log4j.appender.file.DatePattern='.'yyyy-MM-dd
log4j.appender.file.layout=org.apache.log4j.PatternLayout
log4j.appender.file.layout.ConversionPattern=%d{yyyy-MM-dd HH:mm:ss} [%t] %-5p %c{1} - %m%n

# Memcached相关日志
log4j.logger.com.benxq.test.MemcachedUtils=DEBUG
```

## 使用示例

```java
// 基本使用
MemcachedUtils.set("user:1001", userObject);
User user = (User) MemcachedUtils.get("user:1001");

// 带过期时间
Date expireTime = new Date(System.currentTimeMillis() + 3600 * 1000); // 1小时后过期
MemcachedUtils.set("session:abc123", sessionData, expireTime);

// 条件操作
if (MemcachedUtils.add("lock:resource1", "locked")) {
    // 获取锁成功，执行业务逻辑
    try {
        doSomething();
    } finally {
        MemcachedUtils.delete("lock:resource1");
    }
}
```

## 性能优化建议

### 1. 连接池配置
- 根据并发量调整最大连接数
- 合理设置超时时间
- 生产环境关闭详细日志

### 2. 数据存储优化
- 使用合适的序列化方式
- 启用压缩功能减少网络传输
- 设置合理的过期时间

### 3. Key 设计原则
- 使用有意义的前缀（如 `user:`、`session:`）
- 避免过长的 key 名称
- 使用一致的命名规范

### 4. 监控与运维
- 定期检查服务器状态
- 监控内存使用情况
- 记录操作日志便于排查问题

## 故障处理

### 常见问题
1. **连接超时**：检查网络连接和防火墙设置
2. **内存不足**：调整 `-m` 参数或清理无用数据
3. **服务无响应**：重启 Memcached 服务

### 故障转移
客户端配置了自动故障转移，当某台服务器不可用时会自动切换到其他可用服务器。

## 总结

本文档提供了完整的 Memcached 集群搭建方案，包括服务端安装配置和客户端实现。通过合理的配置和使用，可以构建高性能、高可用的分布式缓存系统。

**注意事项：**
- Memcached 不支持持久化，重启后数据丢失
- 客户端负责实现分布式策略和负载均衡
- 生产环境建议使用进程管理工具（如 systemd）管理服务
- 定期备份重要配置和监控服务状态