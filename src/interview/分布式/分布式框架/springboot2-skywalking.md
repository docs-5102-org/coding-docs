---
title: SpringBoot 2 + SkyWalking 实战方案
category:
  - SpringCloud 面试题
date: 2025-11-28
---

# SpringBoot 2 + SkyWalking 实战方案

> 适用版本：SpringBoot 2.x | SkyWalking OAP 9.x | Java 8 / 11

---

## 一、架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    业务服务集群                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Service A    │  │ Service B    │  │ Service C    │  │
│  │ SW Agent     │  │ SW Agent     │  │ SW Agent     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼───────────┘
          │  gRPC/11800      │                 │
          ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│              SkyWalking OAP Server (Cluster)             │
│         负责 Trace 数据收集、聚合、分析                   │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Elasticsearch      MySQL           H2(dev)
     (生产推荐)        (可选)           (本地调试)
                           │
                           ▼
              ┌─────────────────────────┐
              │   SkyWalking UI (8080)  │
              │   拓扑图 / Trace / 告警  │
              └─────────────────────────┘
```

> O  →  Observability  可观测性
> A  →  Analysis       分析
> P  →  Platform       平台

---

## 二、环境准备

### 2.1 版本矩阵

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 8 / 11 | SpringBoot 2.x 推荐 |
| SpringBoot | 2.7.x | 最新 2.x 维护版 |
| SkyWalking OAP | 9.4.0 | 稳定版 |
| SkyWalking Agent | 9.4.0 | 与 OAP 保持一致 |
| Elasticsearch | 7.x | OAP 存储后端（生产）|

### 2.2 下载 SkyWalking

```bash
# 下载 SkyWalking 发行包
wget https://archive.apache.org/dist/skywalking/9.4.0/apache-skywalking-apm-9.4.0.tar.gz
tar -zxvf apache-skywalking-apm-9.4.0.tar.gz
cd apache-skywalking-apm-bin

# 目录结构
├── agent/          # Java Agent（复制到各服务）
├── bin/            # 启动脚本
├── config/         # OAP 配置
├── oap-libs/       # OAP 依赖
└── webapp/         # UI 应用
```

---

## 三、OAP Server 配置

### 3.1 存储配置（Elasticsearch）

编辑 `config/application.yml`：

```yaml
storage:
  selector: ${SW_STORAGE:elasticsearch}
  elasticsearch:
    namespace: ${SW_NAMESPACE:""}
    clusterNodes: ${SW_STORAGE_ES_CLUSTER_NODES:localhost:9200}
    protocol: ${SW_STORAGE_ES_HTTP_PROTOCOL:"http"}
    user: ${SW_ES_USER:""}
    password: ${SW_ES_PASSWORD:""}
    trustStorePath: ${SW_STORAGE_ES_SSL_JKS_PATH:""}
    trustStorePass: ${SW_STORAGE_ES_SSL_JKS_PASS:""}
    secretsManagementFile: ${SW_ES_SECRETS_MANAGEMENT_FILE:""}
    dayStep: ${SW_STORAGE_DAY_STEP:1}
    indexShardsNumber: ${SW_STORAGE_ES_INDEX_SHARDS_NUMBER:1}
    indexReplicasNumber: ${SW_STORAGE_ES_INDEX_REPLICAS_NUMBER:1}
    # 数据保留天数
    recordDataTTL: ${SW_CORE_RECORD_DATA_TTL:3}
    metricsDataTTL: ${SW_CORE_METRICS_DATA_TTL:7}
```

### 3.2 gRPC 接收器配置

```yaml
receiver-sharing-server:
  default:
    restHost: ${SW_RECEIVER_SHARING_REST_HOST:0.0.0.0}  # REST 接口监听所有网卡
    restPort: ${SW_RECEIVER_SHARING_REST_PORT:0}        # 0 = 不启用 REST 接收（随机端口）
    gRPCHost: ${SW_RECEIVER_GRPC_HOST:0.0.0.0}          # gRPC 监听所有网卡
    gRPCPort: ${SW_RECEIVER_GRPC_PORT:11800}            # Agent 上报端口
```

### 3.3 启动 OAP 和 UI

```bash
# 启动 OAP Server
bin/oapService.sh start

# 启动 UI（默认 8080 端口）
bin/webappService.sh start

# 查看日志
tail -f logs/skywalking-oap-server.log
```

---

## 四、SpringBoot 2 项目集成

### 4.1 方式一：Java Agent（推荐，无代码侵入）

**下载并配置 Agent：**

```bash
# 将 agent 目录复制到项目部署路径
cp -r apache-skywalking-apm-bin/agent /opt/skywalking-agent
```

**Agent 配置文件** `agent/config/agent.config`：

```properties
# 服务名（在 SkyWalking UI 中显示）
agent.service_name=${SW_AGENT_NAME:your-service-name}

# OAP Server 地址
collector.backend_service=${SW_AGENT_COLLECTOR_BACKEND_SERVICES:127.0.0.1:11800}

# 日志级别
logging.level=${SW_LOGGING_LEVEL:INFO}

# 采样率（0~1，1 表示 100%）
agent.sample_n_per_3_secs=${SW_AGENT_SAMPLE:-1}

# 忽略的端点（健康检查等）
agent.ignore_suffix=${SW_AGENT_IGNORE_SUFFIX:.jpg,.jpeg,.js,.css,.png,.bmp,.gif,.ico,.mp3,.mp4,.html,.svg}

# 是否开启操作名分组
plugin.opgroup.rest_template.enabled=true
```

SkyWalking 通过 Java Agent 字节码增强实现无侵入，启动时动态修改类的字节码。

**JVM 启动参数：**

```bash
java -javaagent:/opt/skywalking-agent/skywalking-agent.jar \
     -Dskywalking.agent.service_name=order-service \
     -Dskywalking.collector.backend_service=oap-server:11800 \
     -jar your-springboot2-app.jar
```

**背后发生了什么：**

```
JVM 启动
    │
    └─ 加载 skywalking-agent.jar并读取Agent 配置文件
        │
        └─ Agent 通过 Instrumentation API 拦截类加载
            │
            ├─ 发现 Spring MVC 的 DispatcherServlet  → 插入 trace 代码
            ├─ 发现 Feign 客户端                     → 插入透传 traceId 代码
            ├─ 发现 JDBC                             → 插入 SQL 追踪代码
            └─ 发现 Redis/MQ 等                      → 插入对应追踪代码
```

**上报流程：**

```
HTTP 请求进来
    │
    ├─ Agent 拦截，生成 traceId、spanId
    │
    ├─ 业务代码正常执行
    │
    ├─ Feign 调用下游，Agent 自动在 Header 里加入 traceId
    │       SW8: 1-xxx-xxx-...    ← SkyWalking 专用 Header
    │
    └─ 请求结束，Agent 把完整 trace 数据
            通过 gRPC 上报到 OAP Server:11800
```

**Spring Boot 里对应的插件：**

```
skywalking-agent/plugins/
    ├─ apm-springmvc-annotation-plugin.jar    # 拦截 Controller
    ├─ apm-feign-default-http-plugin.jar      # 拦截 Feign
    ├─ apm-jdbc-commons.jar                   # 拦截数据库
    ├─ apm-redis-plugin.jar                   # 拦截 Redis
    └─ apm-rocketmq-plugin.jar                # 拦截 MQ
```

**Docker 方式：**

```dockerfile
FROM openjdk:11-jre-slim

# 复制 Agent
COPY skywalking-agent/ /opt/skywalking-agent/

# 复制应用
COPY target/app.jar /app.jar

ENV SW_AGENT_NAME=order-service
ENV SW_AGENT_COLLECTOR_BACKEND_SERVICES=oap-server:11800

ENTRYPOINT ["java", \
  "-javaagent:/opt/skywalking-agent/skywalking-agent.jar", \
  "-jar", "/app.jar"]
```

### 4.2 方式二：SDK 方式（自定义 Span）

**pom.xml 添加依赖：**

```xml
<dependencies>
    <!-- SkyWalking Toolkit（SpringBoot 2.x 使用此版本）-->
    <dependency>
        <groupId>org.apache.skywalking</groupId>
        <artifactId>apm-toolkit-trace</artifactId>
        <version>9.1.0</version>
    </dependency>
    <dependency>
        <groupId>org.apache.skywalking</groupId>
        <artifactId>apm-toolkit-logback-1.x</artifactId>
        <version>9.1.0</version>
    </dependency>
</dependencies>
```

**自定义 Span 追踪：**

```java
import org.apache.skywalking.apm.toolkit.trace.ActiveSpan;
import org.apache.skywalking.apm.toolkit.trace.Trace;
import org.apache.skywalking.apm.toolkit.trace.TraceContext;

@Service
public class OrderService {

    // 方式一：注解自动创建 Span
    @Trace(operationName = "createOrder")
    public Order createOrder(OrderRequest request) {
        // 添加自定义标签
        ActiveSpan.tag("order.type", request.getType());
        ActiveSpan.tag("order.amount", String.valueOf(request.getAmount()));

        // 记录日志到 Span
        ActiveSpan.info("Order created: " + request.getId());

        return doCreateOrder(request);
    }

    // 方式二：手动管理 Span
    public void processPayment(String orderId) {
        AbstractSpan span = ContextManager.createLocalSpan("processPayment");
        try {
            span.tag("order.id", orderId);
            doPayment(orderId);
        } catch (Exception e) {
            // 标记 Span 为错误
            span.log(e);
            ActiveSpan.error(e);
            throw e;
        } finally {
            ContextManager.stopSpan();
        }
    }

    // 获取当前 TraceId（用于日志关联）
    public String getCurrentTraceId() {
        return TraceContext.traceId();
    }
}
```

---

## 五、日志与 Trace 关联

### 5.1 Logback 配置（整合 traceId）

`src/main/resources/logback-spring.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <!-- SkyWalking Logback 插件，自动注入 traceId -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
                <Pattern>
                    %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%tid] %logger{36} - %msg%n
                </Pattern>
            </layout>
        </encoder>
    </appender>

    <!-- 输出到文件 -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>logs/app.log</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>logs/app.%d{yyyy-MM-dd}.log</fileNamePattern>
            <maxHistory>30</maxHistory>
        </rollingPolicy>
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
                <Pattern>
                    %d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level [%tid] %logger{36} - %msg%n
                </Pattern>
            </layout>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>
</configuration>
```

日志输出示例：

```
2024-01-15 10:23:45.123 [http-nio-8080-exec-1] INFO  [TID:abc123def456] c.e.OrderController - 创建订单: order-001
```

---

## 六、常用插件支持

SkyWalking Agent 内置支持以下 SpringBoot 2 常用组件（无需额外配置）：

| 插件 | 支持版本 | 说明 |
|------|---------|------|
| Spring MVC | 3.x ~ 5.x | HTTP 请求追踪 |
| Spring RestTemplate | 4.x | HTTP 客户端追踪 |
| OpenFeign | 2.x ~ 3.x | Feign 调用追踪 |
| MyBatis | 3.x | SQL 追踪 |
| MySQL JDBC | 5.x ~ 8.x | 数据库追踪 |
| Redis (Lettuce) | 5.x | 缓存追踪 |
| RabbitMQ | 5.x | 消息追踪 |
| Kafka | 2.x | 消息追踪 |
| Elasticsearch | 6.x ~ 7.x | ES 操作追踪 |

---

## 七、Spring Cloud 链路传递

在微服务场景下，Trace Context 通过 HTTP Header 自动传递：

```
X-B3-TraceId / sw8 Header（SkyWalking 自定义协议）
```

**OpenFeign 自动传递示例：**

```java
@FeignClient(name = "inventory-service")
public interface InventoryClient {
    // SkyWalking Agent 自动在请求头中注入 sw8 Header
    // 无需任何额外配置
    @GetMapping("/inventory/{productId}")
    Inventory getInventory(@PathVariable String productId);
}
```

**RestTemplate 注入 Trace Header：**

```java
@Configuration
public class RestTemplateConfig {

    @Bean
    public RestTemplate restTemplate() {
        // SkyWalking Agent 会自动拦截 RestTemplate，无需手动注入
        return new RestTemplate();
    }
}
```

---

## 八、性能调优

### 8.1 Agent 采样配置

```properties
# 每 3 秒最大采样数（-1 表示全采样）
agent.sample_n_per_3_secs=-1

# 生产环境建议（高流量服务）
agent.sample_n_per_3_secs=30
```

### 8.2 JVM 参数优化

```bash
# 生产环境推荐参数
java -javaagent:/opt/skywalking-agent/skywalking-agent.jar \
     -Dskywalking.agent.service_name=order-service \
     -Dskywalking.collector.backend_service=oap-server:11800 \
     -Dskywalking.agent.sample_n_per_3_secs=30 \
     -Dskywalking.logging.level=WARN \
     -XX:+UseG1GC \
     -Xms512m -Xmx1g \
     -jar app.jar
```

### 8.3 忽略无关端点

```properties
# 忽略健康检查、静态资源等
agent.ignore_suffix=.jpg,.jpeg,.js,.css,.png,.html,.svg
# 忽略特定 URL（正则）
agent.ignore_path=/actuator/**,/health,/metrics
```

---

## 九、告警配置

编辑 `config/alarm-settings.yml`：

```yaml
rules:
  # 服务响应时间告警（超过 1s）
  service_resp_time_rule:
    metrics-name: service_resp_time
    op: ">"
    threshold: 1000
    period: 10
    count: 3
    silence-period: 5
    message: "服务 {name} 响应时间超过 1s，当前值: {value}ms"

  # 服务错误率告警（超过 50%）
  service_sla_rule:
    metrics-name: service_sla
    op: "<"
    threshold: 5000   # 50%（单位：1/100）
    period: 10
    count: 2
    silence-period: 3
    message: "服务 {name} 成功率低于 50%"

  # 实例 JVM 内存告警
  instance_jvm_old_gc_time_rule:
    metrics-name: instance_jvm_old_gc_time
    op: ">"
    threshold: 1000
    period: 10
    count: 1
    silence-period: 2
    message: "实例 {name} Old GC 时间过长"

# Webhook 告警通知
webhooks:
  - https://your-webhook-url/skywalking-alert
```

---

## 十、Docker Compose 一键部署

```yaml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  oap-server:
    image: apache/skywalking-oap-server:9.4.0
    depends_on:
      - elasticsearch
    environment:
      SW_STORAGE: elasticsearch
      SW_STORAGE_ES_CLUSTER_NODES: elasticsearch:9200
    ports:
      - "11800:11800"   # gRPC（Agent 上报）
      - "12800:12800"   # HTTP REST

  skywalking-ui:
    image: apache/skywalking-ui:9.4.0
    depends_on:
      - oap-server
    environment:
      SW_OAP_ADDRESS: http://oap-server:12800
    ports:
      - "8080:8080"

  # SpringBoot 2 应用示例
  order-service:
    image: your-order-service:latest
    depends_on:
      - oap-server
    environment:
      SW_AGENT_NAME: order-service
      SW_AGENT_COLLECTOR_BACKEND_SERVICES: oap-server:11800
    volumes:
      - ./skywalking-agent:/opt/skywalking-agent
    command: >
      java -javaagent:/opt/skywalking-agent/skywalking-agent.jar
           -jar /app.jar

volumes:
  es-data:
```

---

## 十一、常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| UI 无数据 | Agent 连接 OAP 失败 | 检查 11800 端口是否通，查看 Agent 日志 |
| traceId 为空 | 未使用 SkyWalking Logback 插件 | 检查 logback 配置中的 Layout 类 |
| Span 数量过多 | 全采样在高流量下压力大 | 配置 `sample_n_per_3_secs` 限制采样 |
| 链路断链 | 跨服务未传递 sw8 Header | 确认 Agent 插件包含对应 HTTP 客户端插件 |
| OAP 启动慢 | ES 未完全就绪 | 增加 OAP 对 ES 的等待时间 |