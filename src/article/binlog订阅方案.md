---
title: Binlog订阅方案
category:
  - java
  - MySQL
tag:
  - 缓存
---

# Binlog订阅方案详解

Binlog订阅是通过监听MySQL的二进制日志（Binary Log）来实现数据同步的方案。让我详细讲解实现原理和具体操作。

## 一、什么是Binlog？

**Binlog（二进制日志）** 是MySQL记录所有数据库变更操作的日志文件，包括：
- INSERT（插入）
- UPDATE（更新）
- DELETE（删除）
- 表结构变更（DDL）

**Binlog的作用**：
- 数据恢复
- 主从复制
- 数据审计
- 增量备份

## 二、Binlog订阅原理

### 工作流程

```
MySQL数据库
    ↓ (写入binlog)
Binlog文件
    ↓ (实时读取)
Canal/Maxwell等中间件
    ↓ (解析并发送)
消息队列(Kafka/RocketMQ)
    ↓ (消费)
应用程序
    ↓ (执行)
删除/更新缓存(Redis/Memcached)
```

### 核心思想

**伪装成MySQL的Slave（从库）**，向MySQL Master请求binlog数据，然后解析binlog内容，实时同步数据变更。

## 三、主流实现工具

### 1. **Canal（阿里开源）** - 最流行

#### 特点
- 阿里巴巴开源，生产环境验证
- 支持多种数据源和目标
- 性能好，延迟低（毫秒级）
- 支持HA高可用

#### 架构
```
MySQL Master
    ↓
Canal Server (伪装成slave)
    ↓
Canal Client / MQ
    ↓
业务应用
```

### 2. **Maxwell** - 轻量级

#### 特点
- 轻量级，部署简单
- 直接输出JSON格式
- 支持输出到Kafka、Kinesis等
- 适合中小型项目

### 3. **Debezium** - Kafka生态

#### 特点
- 基于Kafka Connect
- 支持多种数据库（MySQL、PostgreSQL等）
- 云原生架构
- 与Kafka生态集成紧密

### 4. **MySQL Binlog Connector** - Java客户端

#### 特点
- 纯Java实现
- 可以直接集成到应用中
- 适合定制化需求

## 四、Canal实战示例

### 步骤1：MySQL配置

#### 开启Binlog
```sql
-- 编辑 my.cnf 或 my.ini
[mysqld]
# 开启binlog
log-bin=mysql-bin
# binlog格式设置为ROW（必须）
binlog-format=ROW
# 指定要监听的数据库
binlog-do-db=your_database
# server-id（集群中唯一）
server-id=1
```

#### 创建Canal用户
```sql
-- 创建用户
CREATE USER 'canal'@'%' IDENTIFIED BY 'canal123';

-- 授权（MySQL 5.x）
GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'canal'@'%';

-- 授权（MySQL 8.x）
GRANT SELECT, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'canal'@'%';

-- 刷新权限
FLUSH PRIVILEGES;
```

#### 验证Binlog
```sql
-- 查看binlog是否开启
SHOW VARIABLES LIKE 'log_bin';

-- 查看binlog格式
SHOW VARIABLES LIKE 'binlog_format';

-- 查看binlog文件列表
SHOW BINARY LOGS;

-- 查看binlog内容
SHOW BINLOG EVENTS IN 'mysql-bin.000001';
```

### 步骤2：部署Canal Server

#### Docker方式（推荐）
```bash
# 拉取镜像
docker pull canal/canal-server:latest

# 运行Canal Server
docker run -d \
  --name canal-server \
  -p 11111:11111 \
  -e canal.instance.master.address=mysql_host:3306 \
  -e canal.instance.dbUsername=canal \
  -e canal.instance.dbPassword=canal123 \
  -e canal.instance.filter.regex=.*\\..* \
  canal/canal-server:latest
```

#### 配置文件方式
```properties
# conf/example/instance.properties

# MySQL连接配置
canal.instance.master.address=127.0.0.1:3306
canal.instance.dbUsername=canal
canal.instance.dbPassword=canal123

# binlog位置（首次启动可不配置）
# canal.instance.master.journal.name=
# canal.instance.master.position=

# 监听的表规则（正则表达式）
# 所有库所有表
canal.instance.filter.regex=.*\\..*
# 指定库的所有表
# canal.instance.filter.regex=test\\..*
# 指定具体表
# canal.instance.filter.regex=test\\.user,test\\.order

# 排除的表
canal.instance.filter.black.regex=mysql\\..*
```

### 步骤3：编写Canal Client

#### Maven依赖
```xml
<dependency>
    <groupId>com.alibaba.otter</groupId>
    <artifactId>canal.client</artifactId>
    <version>1.1.7</version>
</dependency>

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

#### Java客户端代码
```java
import com.alibaba.otter.canal.client.CanalConnector;
import com.alibaba.otter.canal.client.CanalConnectors;
import com.alibaba.otter.canal.protocol.CanalEntry.*;
import com.alibaba.otter.canal.protocol.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.net.InetSocketAddress;
import java.util.List;

@Component
public class CanalClient {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @PostConstruct
    public void start() {
        // 创建连接
        CanalConnector connector = CanalConnectors.newSingleConnector(
            new InetSocketAddress("127.0.0.1", 11111),
            "example",  // destination名称
            "",         // username（如果配置了）
            ""          // password（如果配置了）
        );
        
        // 启动独立线程监听
        new Thread(() -> {
            try {
                connector.connect();
                // 订阅所有表
                connector.subscribe(".*\\..*");
                // 回滚到未确认的位置
                connector.rollback();
                
                while (true) {
                    // 获取100条数据，超时时间1秒
                    Message message = connector.getWithoutAck(100);
                    long batchId = message.getId();
                    int size = message.getEntries().size();
                    
                    if (batchId == -1 || size == 0) {
                        Thread.sleep(1000);
                    } else {
                        // 处理数据
                        handleDataChange(message.getEntries());
                        // 确认消费
                        connector.ack(batchId);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                connector.disconnect();
            }
        }).start();
    }
    
    private void handleDataChange(List<Entry> entries) {
        for (Entry entry : entries) {
            // 只处理行变更数据
            if (entry.getEntryType() != EntryType.ROWDATA) {
                continue;
            }
            
            try {
                // 解析数据
                RowChange rowChange = RowChange.parseFrom(entry.getStoreValue());
                EventType eventType = rowChange.getEventType();
                String tableName = entry.getHeader().getTableName();
                String schemaName = entry.getHeader().getSchemaName();
                
                // 遍历每一行数据
                for (RowData rowData : rowChange.getRowDatasList()) {
                    switch (eventType) {
                        case INSERT:
                            handleInsert(schemaName, tableName, rowData);
                            break;
                        case UPDATE:
                            handleUpdate(schemaName, tableName, rowData);
                            break;
                        case DELETE:
                            handleDelete(schemaName, tableName, rowData);
                            break;
                        default:
                            break;
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
    
    private void handleInsert(String schema, String table, RowData rowData) {
        System.out.println("INSERT操作");
        printColumns(rowData.getAfterColumnsList());
        // 删除相关缓存
        deleteCache(schema, table, rowData.getAfterColumnsList());
    }
    
    private void handleUpdate(String schema, String table, RowData rowData) {
        System.out.println("UPDATE操作");
        System.out.println("更新前：");
        printColumns(rowData.getBeforeColumnsList());
        System.out.println("更新后：");
        printColumns(rowData.getAfterColumnsList());
        // 删除相关缓存
        deleteCache(schema, table, rowData.getAfterColumnsList());
    }
    
    private void handleDelete(String schema, String table, RowData rowData) {
        System.out.println("DELETE操作");
        printColumns(rowData.getBeforeColumnsList());
        // 删除相关缓存
        deleteCache(schema, table, rowData.getBeforeColumnsList());
    }
    
    private void printColumns(List<Column> columns) {
        for (Column column : columns) {
            System.out.println(column.getName() + " : " + column.getValue());
        }
    }
    
    private void deleteCache(String schema, String table, List<Column> columns) {
        // 根据业务逻辑删除缓存
        if ("your_database".equals(schema) && "user".equals(table)) {
            // 获取主键ID
            String id = null;
            for (Column column : columns) {
                if ("id".equals(column.getName())) {
                    id = column.getValue();
                    break;
                }
            }
            
            if (id != null) {
                // 删除用户缓存
                String cacheKey = "user:" + id;
                redisTemplate.delete(cacheKey);
                System.out.println("已删除缓存: " + cacheKey);
            }
        }
    }
}
```

### 步骤4：整合Kafka（推荐生产环境）

#### Canal配置输出到Kafka
```properties
# conf/canal.properties

# 配置MQ类型
canal.serverMode = kafka

# Kafka配置
kafka.bootstrap.servers = localhost:9092
kafka.acks = all
kafka.compression.type = snappy

# Topic命名规则
canal.mq.dynamicTopic = .*\\..*
```

#### 消费Kafka消息
```java
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import com.alibaba.fastjson.JSONObject;

@Component
public class CanalKafkaConsumer {
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @KafkaListener(topics = "example", groupId = "canal-consumer")
    public void onMessage(ConsumerRecord<String, String> record) {
        String value = record.value();
        JSONObject json = JSONObject.parseObject(value);
        
        String database = json.getString("database");
        String table = json.getString("table");
        String type = json.getString("type");  // INSERT, UPDATE, DELETE
        
        // 处理数据变更
        if ("user".equals(table)) {
            List<JSONObject> data = json.getJSONArray("data").toJavaList(JSONObject.class);
            for (JSONObject row : data) {
                String id = row.getString("id");
                String cacheKey = "user:" + id;
                
                // 删除缓存
                redisTemplate.delete(cacheKey);
                System.out.println("删除缓存: " + cacheKey);
            }
        }
    }
}
```

## 五、Maxwell实战示例

### 快速启动
```bash
# 使用Docker启动Maxwell
docker run -d \
  --name maxwell \
  -e MYSQL_HOST=mysql_host \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER=maxwell \
  -e MYSQL_PASSWORD=maxwell123 \
  -e MYSQL_DATABASE=maxwell \
  zendesk/maxwell
```

### 输出到Kafka
```bash
docker run -d \
  --name maxwell \
  -e MYSQL_HOST=mysql_host \
  -e MYSQL_USER=maxwell \
  -e MYSQL_PASSWORD=maxwell123 \
  -e KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  zendesk/maxwell
```

### Maxwell输出格式（JSON）
```json
{
  "database": "test",
  "table": "user",
  "type": "insert",
  "ts": 1638360000,
  "xid": 12345,
  "commit": true,
  "data": {
    "id": 1,
    "name": "张三",
    "age": 25
  }
}
```

## 六、生产环境最佳实践

### 1. 高可用部署
```
MySQL Master-Slave
    ↓
Canal HA集群（使用Zookeeper）
    ↓
Kafka集群
    ↓
多个消费者实例
```

### 2. 监控告警
- 监控binlog消费延迟
- 监控Canal实例状态
- 监控缓存删除成功率
- 设置告警阈值

### 3. 异常处理
```java
// 重试机制
@Retryable(
    value = Exception.class,
    maxAttempts = 3,
    backoff = @Backoff(delay = 1000)
)
public void deleteCache(String key) {
    redisTemplate.delete(key);
}

// 失败记录
if (deleteFailed) {
    // 记录到死信队列
    sendToDeadLetterQueue(cacheKey);
}
```

### 4. 性能优化
- 批量删除缓存
- 异步处理
- 使用缓存预热
- 控制消费速率

## 七、优缺点分析

### 优点
✅ **业务代码无侵入** - 不需要修改业务代码  
✅ **实时性高** - 毫秒级延迟  
✅ **可靠性强** - binlog保证数据不丢失  
✅ **解耦** - 数据库和缓存操作分离  
✅ **可扩展** - 可以同步到多个目标系统

### 缺点
❌ **增加系统复杂度** - 需要维护额外组件  
❌ **运维成本** - 需要监控Canal、Kafka等  
❌ **binlog依赖** - MySQL必须开启binlog  
❌ **最终一致性** - 存在短暂延迟

## 八、总结

Binlog订阅方案是解决缓存一致性的优雅方案，特别适合：
- 大型分布式系统
- 对实时性要求高的场景
- 需要数据同步到多个系统的场景

选择Canal还是Maxwell？
- **Canal**：功能强大，适合大型项目
- **Maxwell**：轻量简单，适合中小型项目

核心思想就是：**让数据库的变更自动同步到缓存，而不是在业务代码中手动维护！**