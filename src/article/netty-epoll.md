---
title: Netty 的 Epoll 模式
category:
  - Netty
tag:
  - Epoll
---


## Netty 的 Epoll 模式

### 先理解背景

Netty 默认用 **NIO**（Java 原生），但在 Linux 上可以换成 **Epoll** 模式。

---

### Epoll vs NIO 的本质区别

| 对比项 | Java NIO (Selector) | Linux Epoll |
|--------|--------------------|----|
| 实现层 | JVM 封装，跨平台 | 直接调用 Linux 内核 syscall |
| 事件通知 | 每次需要遍历所有 fd | 只返回就绪的 fd，O(1) |
| 空轮询 Bug | **有**（臭名昭著） | 无 |
| 边缘触发(ET) | 不支持 | 支持 |
| 性能 | 一般 | 更高 |

---

### 具体有啥用

**1. 解决 Java NIO 空轮询 Bug**
```
Java NIO 的 Selector 在 Linux 上有个 bug：
即使没有任何事件，select() 也会不断返回 0
→ CPU 飙到 100%

Epoll 模式直接绕过这个问题
```

**2. 更低的系统开销**
```
NIO：内核把所有 fd 的状态复制给用户态，你再遍历
Epoll：内核只告诉你哪些 fd 就绪了，直接处理

连接数越多，差距越明显（万级连接时感受明显）
```

**3. 支持边缘触发（ET 模式）**
```
水平触发(LT)：数据没读完，下次还会通知你
边缘触发(ET)：只通知一次，你必须一次读完

ET 模式减少系统调用次数，高并发下性能更好
```

**4. 更多 Linux 特性支持**
```java
// Epoll 模式独有
EpollEventLoopGroup  // 支持更多底层参数调优
EpollServerSocketChannel
// 可以设置 TCP_CORK、SO_REUSEPORT 等 Linux 特有选项
```

---

### 怎么用

```java
// 默认 NIO 写法
EventLoopGroup boss = new NioEventLoopGroup();
EventLoopGroup worker = new NioEventLoopGroup();
bootstrap.channel(NioServerSocketChannel.class);

// 换成 Epoll（仅需改这两处）
EventLoopGroup boss = new EpollEventLoopGroup();
EventLoopGroup worker = new EpollEventLoopGroup();
bootstrap.channel(EpollServerSocketChannel.class);
```

加个平台判断更优雅：

```java
boolean isLinux = Epoll.isAvailable();

EventLoopGroup boss = isLinux 
    ? new EpollEventLoopGroup() 
    : new NioEventLoopGroup();

Class<? extends ServerSocketChannel> channelClass = isLinux
    ? EpollServerSocketChannel.class
    : NioServerSocketChannel.class;
```

---

### 什么时候值得开启

| 场景 | 建议 |
|------|------|
| 部署在 Linux + 高并发（万级连接） | ✅ 强烈建议开 |
| 普通业务，连接数不多 | 可选，收益不明显 |
| Windows / Mac 开发环境 | ❌ 不支持，自动降级 NIO |
| 容器部署（Docker/K8s on Linux） | ✅ 同样有效 |

---

### 一句话总结

> Epoll 模式就是让 Netty 在 Linux 上**直接用内核级 IO 多路复用**，跳过 JVM 的封装层，连接数越大、并发越高，收益越明显。