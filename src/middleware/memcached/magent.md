---
title: Magent的主从实现​
category:
  - 中间件
tag:
  - Memcached
  - Magent
---

# Memcache高可用集群：基于Magent的主从实现

## 目录

[[toc]]

## 项目地址

http://code.google.com/p/memagent

https://github.com/wangmh/memagent

#### **一、核心架构与原理**

1. **架构设计**  
   - 采用双Magent节点+双Memcached节点的对称架构，每个Magent代理主备Memcached服务器，形成高可用池。任意单节点故障不影响服务，仅当所有节点同时宕机时才会完全失效（可通过增加节点数提升容错率）。
   - 数据同步机制：写入时通过一致性哈希算法（Ketama）将数据同时分发到主备Memcached节点；读取时优先从主节点获取，主节点故障则自动切换至备份节点。
2. **关键特性**  
   - **无单点故障**：Magent代理层实现故障转移，Memcached节点间无直接通信，依赖代理层维护数据冗余。
   - **数据完整性风险**：Memcached重启后数据丢失（内存特性），需额外手段恢复（如从备份节点同步）。

#### **二、安装与配置**
1. **依赖安装**  
   - **Memcached**：需预装libevent（建议版本≥2.1.8），配置时指定路径（如`--with-libevent=/usr`）。
   - **Magent**：  
     ```bash
     wget http://memagent.googlecode.com/files/magent-0.6.tar.gz
     tar -zxvf magent-0.6.tar.gz
     # 修改ketama.h添加宏定义（解决SSIZE_MAX错误）
     # 修改Makefile：CFLAGS添加`-lrt`，LIBS添加`-lm`
     make && cp magent /usr/bin/
     ```

2. **常见编译错误处理**  
   - **错误1**：`SSIZE_MAX未定义` → 在`ketama.h`开头添加宏定义。
   - **错误2**：`clock_gettime链接失败` → 修改Makefile的`CFLAGS`加入`-lrt`。
   - **错误3**：`libm.a缺失` → 创建软链接：`ln -s /usr/lib64/libm.so /usr/lib64/libm.a`。

#### **三、服务启动与参数说明**
1. **启动Memcached**  
   ```bash
   memcached -d -m 512 -u root -l 192.168.1.1 -p 11211
   ```
   - `-m`：内存大小（MB）；`-l`：绑定IP；`-p`：端口。

2. **启动Magent**  
   ```bash
   magent -u root -n 51200 -l 192.168.1.100 -p 12000 \
          -s 192.168.1.1:11211 -b 192.168.1.2:11211
   ```
   - **关键参数**：  
     - `-s`：主Memcached地址（可多个）；`-b`：备份Memcached地址。
     - `-n`：最大连接数；`-l`：监听IP（建议绑定VIP以实现高可用）。

#### **四、测试与故障处理**
1. **功能验证**  
   - **写入测试**：通过Magent插入数据，检查主备节点是否同步。
   - **故障模拟**：关闭主节点，确认备份节点可响应请求；重启主节点后需手动恢复数据（因内存数据丢失）。

2. **数据恢复方案**  
   - **手动同步**：从备份节点全量拷贝数据到重启的主节点。
   - **代理层容错**：自定义代理逻辑，主节点返回空值时自动查询备份节点。

#### **五、生产环境建议**
1. **高可用增强**  
   - 结合Keepalived实现Magent层的VIP漂移，避免代理单点故障。
   - 使用多组Magent（如南北机房独立部署），配置完全一致以确保哈希一致性。

2. **性能优化**  
   - 调整`-n`（连接数）和`-i`（保活连接数）参数以适应高并发场景。
   - 避免使用过期的Magent版本（如0.6可能存在稳定性问题，推荐0.5）。

#### **六、限制与替代方案**
- **Magent缺陷**：项目已停止更新，可考虑替代方案如Repcached（内置主从同步）或Twemproxy。
- **Memcached限制**：单Value上限1MB，Key长度≤250字节，需业务层适配。

---

**优化说明**：  
1. 合并重复内容（如安装步骤和错误处理），补充多来源的配置细节。  
2. 增加生产建议和替代方案，提升实用性。  
3. 使用代码块突出关键命令，调整段落逻辑顺序（原理→实施→验证）。