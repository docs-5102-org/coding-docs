---
title: ZooKeeper 入门教程
category:
  - 中间件
tag:
  - ZooKeeper
---

# ZooKeeper 入门教程

## 1. ZooKeeper 简介

Apache ZooKeeper是一个为分布式应用所设计的开源协调服务，其设计目的是为了减轻分布式应用程序所承担的协调任务。它可以为用户提供同步、配置管理、分组和命名等服务。

### 1.1 主要特性

- **过半存活即可用**：集群中只要有过半的机器是正常工作的，那么整个集群对外就是可用的
- **顺序一致性**：来自任意特定客户端的更新都会按其发送顺序被应用
- **原子性**：每个更新要么成功，要么失败
- **单一视图**：无论客户端连到哪个服务器，都会看到同样的服务视图
- **可靠性**：一旦更新被应用，它将一直保持到被其他更新覆盖

## 2. 系统环境要求

### 2.1 平台支持

| 平台 | 运行client | 运行server | 开发环境 | 生产环境 |
|------|-----------|-----------|----------|----------|
| GNU/Linux | √ | √ | √ | √ |
| Sun Solaris | √ | √ | √ | √ |
| FreeBSD | √ | ×(对nio的支持不好) | √ | √ |
| Windows | √ | √ | √ | × |
| MacOSX | √ | √ | √ | × |

### 2.2 软件环境

- **JDK**: 需要JDK 1.6或更高版本
- **机器数量**: 通常建议使用3台独立的Linux服务器构成ZK集群（奇数台）
- **内存**: 建议4GB物理内存机器上，最多设置-Xmx为3G

## 3. 集群部署

### 3.1 基础环境准备

以下以3台机器为例：

| 主机名 | IP地址 | myid | 角色 |
|--------|--------|------|------|
| god.cn | 192.168.127.87 | 1 | server.1 |
| obd.cn | 192.168.127.99 | 2 | server.2 |
| mod.cn | 192.168.127.101 | 3 | server.3 |

### 3.2 安装步骤

#### 步骤1：安装JDK
```bash
# 确保安装了JDK 1.6+
java -version
```

#### 步骤2：下载ZooKeeper
```bash
# 下载ZooKeeper
wget https://archive.apache.org/dist/zookeeper/zookeeper-3.4.12/zookeeper-3.4.12.tar.gz

# 解压
tar -zxvf zookeeper-3.4.12.tar.gz
mv zookeeper-3.4.12 /usr/local/zookeeper
```

#### 步骤3：配置zoo.cfg
```bash
cd /usr/local/zookeeper/conf
cp zoo_sample.cfg zoo.cfg
```

编辑zoo.cfg配置文件：
```properties
# 时间单元（毫秒）
tickTime=2000
# 初始化同步限制
initLimit=10
# 同步限制
syncLimit=5
# 数据目录
dataDir=/usr/local/data/zookeeper
# 事务日志目录（建议单独磁盘）
dataLogDir=/usr/local/logs/zookeeper
# 客户端连接端口
clientPort=2181
# 最大客户端连接数
maxClientCnxns=1000

# 集群配置
server.1=god.cn:2888:3888
server.2=obd.cn:2888:3888
server.3=mod.cn:2888:3888
```

#### 步骤4：创建myid文件
```bash
# 创建数据目录
mkdir -p /usr/local/data/zookeeper

# 在每台机器上创建myid文件，内容对应server.X中的X
echo "1" > /usr/local/data/zookeeper/myid  # god.cn
echo "2" > /usr/local/data/zookeeper/myid  # obd.cn
echo "3" > /usr/local/data/zookeeper/myid  # mod.cn
```

#### 步骤5：配置日志
编辑conf/log4j.properties：
```properties
# 修改根日志级别
zookeeper.root.logger=INFO, ROLLINGFILE

# 配置滚动文件输出
log4j.appender.ROLLINGFILE=org.apache.log4j.DailyRollingFileAppender
log4j.appender.ROLLINGFILE.File=${zookeeper.log.dir}/zookeeper.log
log4j.appender.ROLLINGFILE.layout=org.apache.log4j.PatternLayout
log4j.appender.ROLLINGFILE.layout.ConversionPattern=%d{ISO8601} [myid:%X{myid}] - %-5p [%t:%C{1}@%L] - %m%n
```

#### 步骤6：配置环境变量
在每台机器的/etc/profile中添加：
```bash
export ZOOKEEPER_HOME=/usr/local/zookeeper
export PATH=$PATH:$ZOOKEEPER_HOME/bin
```

#### 步骤7：配置hosts
在每台机器的/etc/hosts中添加：
```
192.168.127.87 god.cn
192.168.127.99 obd.cn
192.168.127.101 mod.cn
```

### 3.3 启动集群

在每台机器上执行：
```bash
# 启动ZooKeeper
zkServer.sh start

# 查看状态
zkServer.sh status
```

正常启动后，会看到一台Leader和两台Follower。

## 4. 单机模式配置

如果只是用于开发测试，可以配置单机模式：

```properties
tickTime=2000
dataDir=/var/lib/zookeeper
clientPort=2181
```

启动命令：
```bash
zkServer.sh start
```

## 5. 配置参数详解

### 5.1 基础配置

| 参数名 | 说明 | 默认值 |
|--------|------|--------|
| tickTime | ZK的基本时间单元(毫秒) | 2000 |
| dataDir | 数据快照存储目录 | 无 |
| dataLogDir | 事务日志存储目录 | dataDir |
| clientPort | 客户端连接端口 | 2181 |

### 5.2 集群配置

| 参数名 | 说明 | 默认值 |
|--------|------|--------|
| initLimit | Follower启动时与Leader同步的最大时间 | 10 |
| syncLimit | Leader与Follower心跳检测最大时间 | 5 |
| server.x | 集群机器配置格式：server.id=host:port:port | 无 |

### 5.3 性能优化配置

| 参数名 | 说明 | 默认值 |
|--------|------|--------|
| snapCount | 触发快照的事务数 | 100000 |
| maxClientCnxns | 单个客户端最大连接数 | 60 |
| preAllocSize | 事务日志预分配空间大小(MB) | 64 |
| autopurge.purgeInterval | 自动清理频率(小时) | 0(不清理) |
| autopurge.snapRetainCount | 保留文件数量 | 3 |

## 6. 常用命令

### 6.1 服务管理命令

```bash
# 启动服务
zkServer.sh start

# 停止服务
zkServer.sh stop

# 重启服务
zkServer.sh restart

# 查看状态
zkServer.sh status
```

### 6.2 客户端命令

```bash
# 连接ZooKeeper
zkCli.sh -server localhost:2181

# 常用客户端操作
ls /                    # 列出根目录
create /test "data"     # 创建节点
get /test              # 获取节点数据
set /test "newdata"    # 设置节点数据
delete /test           # 删除节点
```

### 6.3 四字命令

ZooKeeper提供了一些四字命令用于监控：

```bash
# 查看配置
echo conf | nc localhost 2181

# 查看状态
echo stat | nc localhost 2181

# 查看连接信息
echo cons | nc localhost 2181

# 检查服务是否正常
echo ruok | nc localhost 2181

# 监控信息
echo mntr | nc localhost 2181

# Watcher信息概要
echo wchs | nc localhost 2181
```

## 7. 日常运维

### 7.1 数据清理

ZooKeeper不会自动清理历史数据，需要定期清理：

创建清理脚本：
```bash
#!/bin/bash
# cleanup.sh

# 数据目录
dataDir=/usr/local/data/zookeeper/version-2
# 事务日志目录
dataLogDir=/usr/local/logs/zookeeper/version-2
# 日志目录
logDir=/usr/local/zookeeper/logs
# 保留文件数
count=66

count=$[$count+1]
ls -t $dataLogDir/log.* | tail -n +$count | xargs rm -f
ls -t $dataDir/snapshot.* | tail -n +$count | xargs rm -f
ls -t $logDir/zookeeper.log.* | tail -n +$count | xargs rm -f
```

添加到crontab：
```bash
# 每天凌晨2点清理
0 2 * * * /path/to/cleanup.sh
```

或者使用ZooKeeper自带的清理工具：
```bash
java -cp zookeeper.jar:lib/* org.apache.zookeeper.server.PurgeTxnLog dataDir snapDir -n count
```

### 7.2 监控

建议监控以下指标：
- CPU、内存、磁盘使用率
- 网络连接数
- ZooKeeper响应时间
- 事务处理数量
- Watcher数量
- 节点数量

### 7.3 备份策略

- 定期备份dataDir目录中的snapshot文件
- 备份事务日志文件
- 备份配置文件

## 8. 故障处理

### 8.1 常见问题

1. **启动失败**
   - 检查JDK版本
   - 检查端口占用
   - 检查myid文件
   - 检查磁盘空间

2. **集群脑裂**
   - 确保网络连通性
   - 检查防火墙设置
   - 确认机器时间同步

3. **性能问题**
   - 检查磁盘IO
   - 调整JVM参数
   - 优化网络配置

### 8.2 数据恢复

如果数据文件损坏：
1. 确认其他节点正常工作
2. 停止故障节点
3. 删除dataDir和dataLogDir中的数据
4. 重启节点（会自动从Leader同步数据）

## 9. 最佳实践

### 9.1 部署建议

- 使用奇数台机器（3台、5台、7台）
- 独立的磁盘用于事务日志
- 跨机房部署以提高可用性
- 独立的服务器，避免资源竞争

### 9.2 配置建议

- 合理设置JVM堆大小（不超过物理内存的75%）
- 开启自动清理功能
- 配置独立的事务日志目录
- 设置合适的超时参数

### 9.3 运维建议

- 定期清理历史数据
- 监控集群状态
- 定期备份重要数据
- 使用自动重启机制（如systemd、supervisor）

## 10. 安全配置

### 10.1 网络安全

- 配置防火墙，只开放必要端口
- 使用内网通信
- 配置SSL/TLS加密

### 10.2 访问控制

```bash
# 设置ACL
create /secure "data" auth:user:password
setAcl /secure auth:user:password:rwa
```

### 10.3 认证配置

在zoo.cfg中配置：
```properties
authProvider.1=org.apache.zookeeper.server.auth.SASLAuthenticationProvider
```

## 11. 相关链接资源

### 11.1 官方资源

#### 官方网站和文档
- **Apache ZooKeeper 官方网站**: https://zookeeper.apache.org/
- **官方文档**: https://zookeeper.apache.org/documentation.html
- **ZooKeeper 快速入门指南**: https://zookeeper.apache.org/doc/current/zookeeperStarted.html
- **ZooKeeper 管理员指南**: https://zookeeper.apache.org/doc/current/zookeeperAdmin.html
- **ZooKeeper 程序员指南**: https://zookeeper.apache.org/doc/current/zookeeperProgrammers.html
- **ZooKeeper API 文档**: https://zookeeper.apache.org/doc/current/api/index.html
- **ZooKeeper JMX 文档**: https://zookeeper.apache.org/doc/current/zookeeperJMX.html

#### 官方代码仓库
- **GitHub 官方仓库**: https://github.com/apache/zookeeper
- **Apache GitBox**: https://gitbox.apache.org/repos/asf/zookeeper.git

### 11.2 优质第三方教程

#### 实践教程
- **Zookeeper Tutorial — With Practical Example** (Medium): https://bikas-katwal.medium.com/zookeeper-introduction-designing-a-distributed-system-using-zookeeper-and-java-7f1b108e236e
- **What is Zookeeper?** (Medium): https://medium.com/@gavindya/what-is-zookeeper-db8dfc30fc9b
- **Apache Zookeeper 详解** (Medium): https://medium.com/rahasak/apache-zookeeper-31b2091657a8
- **Getting Started with Java and Zookeeper** (Baeldung): https://www.baeldung.com/java-zookeeper
- **What is Apache ZooKeeper?** (GeeksforGeeks): https://www.geeksforgeeks.org/java/what-is-apache-zookeeper/

#### 在线课程和教程
- **Zookeeper API Overview** (TutorialsPoint): https://www.tutorialspoint.com/zookeeper/
- **Apache ZooKeeper — Big Data Classes**: https://cloudmesh.github.io/classes/lesson/tech/zookeeper

### 11.3 开源项目和工具

#### GitHub 相关项目
- **ZooKeeper 相关项目**: https://github.com/topics/zookeeper
- **ZooKeeper Docker**: https://github.com/31z4/zookeeper-docker
- **ZooKeeper Kubernetes Operator**: https://github.com/pravega/zookeeper-operator
- **ZooKeeper Web UI**: https://github.com/elkozmon/zoonavigator
- **ZooKeeper REST API**: https://github.com/apache/zookeeper/tree/master/zookeeper-contrib/zookeeper-contrib-rest

#### 监控工具
- **ZooKeeper Exporter for Prometheus**: https://github.com/dabealu/zookeeper-exporter
- **ZooKeeper Grafana Dashboard**: https://grafana.com/grafana/dashboards/10465

### 11.4 书籍推荐

- **ZooKeeper: Distributed Process Coordination** - O'Reilly Media
- **Hadoop: The Definitive Guide** - O'Reilly Media (包含ZooKeeper章节)
- **Learning Apache Kafka** - Packt Publishing (ZooKeeper在Kafka中的应用)

### 11.5 社区和支持

#### 邮件列表
- **用户邮件列表**: user@zookeeper.apache.org
- **开发者邮件列表**: dev@zookeeper.apache.org
- **提交邮件列表**: commits@zookeeper.apache.org

#### 问答社区
- **Stack Overflow**: https://stackoverflow.com/questions/tagged/zookeeper
- **Apache JIRA**: https://issues.apache.org/jira/projects/ZOOKEEPER

### 11.6 相关技术

#### 配合使用的技术栈
- **Apache Kafka**: https://kafka.apache.org/
- **Apache HBase**: https://hbase.apache.org/
- **Apache Storm**: https://storm.apache.org/
- **Apache Solr**: https://solr.apache.org/
- **Hadoop YARN**: https://hadoop.apache.org/

#### 替代方案
- **etcd**: https://etcd.io/
- **Consul**: https://www.consul.io/
- **Apache Curator**: https://curator.apache.org/ (ZooKeeper客户端库)

## 结语

ZooKeeper是一个强大的分布式协调服务，正确的部署和运维对于确保系统的稳定性和可靠性至关重要。本教程涵盖了从基础安装到高级运维的各个方面，希望能帮助您更好地使用和管理ZooKeeper集群。

在生产环境中使用时，请根据实际需求调整配置参数，并建立完善的监控和备份机制。建议深入阅读官方文档，并结合实际项目需求来选择合适的配置和工具。

如果您在使用过程中遇到问题，可以参考上述提供的官方文档、社区资源和第三方教程，或者在相关的技术社区寻求帮助。