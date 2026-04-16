---
title: SpringBoot 3 + SkyWalking 实战方案
category:
  - SpringCloud 面试题
date: 2025-11-28
---

# SpringBoot 3 + SkyWalking 实战方案

> 适用版本：SpringBoot 3.x | SkyWalking OAP 9.x | Java 17+

---

## 一、架构概览

```
┌─────────────────────────────────────────────────────────┐
│                    业务服务集群（Java 17+）                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Service A    │  │ Service B    │  │ Service C    │  │
│  │ SW Agent 9.x │  │ SW Agent 9.x │  │ SW Agent 9.x │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼─────────────────┼─────────────────┼───────────┘
          │  gRPC/11800      │                 │
          ▼                  ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│              SkyWalking OAP Server 9.x                   │
│      支持 OpenTelemetry / Zipkin / SkyWalking 协议        │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
     Elasticsearch      BanyanDB          H2(dev)
     (7.x / 8.x)     (SW 原生存储)       (本地调试)
                           │
                           ▼
              ┌─────────────────────────┐
              │   SkyWalking UI (8080)  │
              │ 拓扑 / Trace / Metrics  │
              └─────────────────────────┘
```

> **SpringBoot 3.x 关键差异**
> - 最低 Java 17，全面迁移 `javax.*` → `jakarta.*`
> - 内置 Micrometer Tracing（对接 OpenTelemetry）
> - SkyWalking Agent 需 **9.1.0+** 才完整支持 Jakarta EE

---

## 二、环境准备

### 2.1 版本矩阵

| 组件 | 版本 | 说明 |
|------|------|------|
| Java | 17 / 21 | SpringBoot 3.x 强制要求 |
| SpringBoot | 3.2.x | 最新稳定版 |
| SkyWalking OAP | 9.7.0 | 推荐，完整支持 Jakarta |
| SkyWalking Agent | 9.1.0+ | 支持 Jakarta Servlet |
| Elasticsearch | 7.x / 8.x | 生产存储后端 |

### 2.2 SpringBoot 3 与 SkyWalking Agent 兼容说明

```
SpringBoot 3.x 使用 jakarta.servlet.*
SkyWalking Agent 9.0.x 只支持 javax.servlet.*  ← 不兼容！
SkyWalking Agent 9.1.0+ 同时支持两者          ← 推荐使用
```

### 2.3 下载 SkyWalking

```bash
wget https://archive.apache.org/dist/skywalking/9.7.0/apache-skywalking-apm-9.7.0.tar.gz
tar -zxvf apache-skywalking-apm-9.7.0.tar.gz
cd apache-skywalking-apm-bin
```

---

## 三、OAP Server 配置

### 3.1 存储配置（Elasticsearch 8.x）

`config/application.yml`：

```yaml
storage:
  selector: ${SW_STORAGE:elasticsearch}
  elasticsearch:
    clusterNodes: ${SW_STORAGE_ES_CLUSTER_NODES:localhost:9200}
    protocol: ${SW_STORAGE_ES_HTTP_PROTOCOL:"https"}    # ES 8.x 默认 HTTPS
    user: ${SW_ES_USER:"elastic"}
    password: ${SW_ES_PASSWORD:"your-password"}
    trustStorePath: ${SW_STORAGE_ES_SSL_JKS_PATH:""}
    # ES 8.x 安全配置
    enableHttpSsl: ${SW_STORAGE_ES_SSL_ENABLE:true}
    recordDataTTL: ${SW_CORE_RECORD_DATA_TTL:3}
    metricsDataTTL: ${SW_CORE_METRICS_DATA_TTL:7}
```

### 3.2 OpenTelemetry 接收器（SpringBoot 3 推荐）

```yaml
# 开启 OpenTelemetry 接收器
receiver-otel:
  default:
    enabledHandlers:
      - default
      - zipkin

# OTLP 接收配置（4317 gRPC / 4318 HTTP）
receiver-sharing-server:
  default:
    gRPCPort: ${SW_RECEIVER_GRPC_PORT:11800}
    # 同时支持 OTLP 协议
    restPort: ${SW_RECEIVER_REST_PORT:12800}
```

### 3.3 启动

```bash
bin/oapService.sh start
bin/webappService.sh start
tail -f logs/skywalking-oap-server.log
```

---

## 四、SpringBoot 3 项目集成

### 4.1 方式一：Java Agent（推荐）

**Agent 配置** `agent/config/agent.config`：

```properties
agent.service_name=${SW_AGENT_NAME:your-service-name}
collector.backend_service=${SW_AGENT_COLLECTOR_BACKEND_SERVICES:127.0.0.1:11800}
logging.level=${SW_LOGGING_LEVEL:INFO}

# SpringBoot 3 需要开启 Jakarta EE 插件
# 确认 plugins 目录中包含以下文件：
# apm-spring-webmvc-6.x-plugin-*.jar   （Spring 6 / Boot 3）
# apm-tomcat-10x-plugin-*.jar          （Tomcat 10 / Jakarta）
```

**JVM 启动参数：**

```bash
java -javaagent:/opt/skywalking-agent/skywalking-agent.jar \
     -Dskywalking.agent.service_name=order-service \
     -Dskywalking.collector.backend_service=oap-server:11800 \
     --add-opens java.base/java.lang=ALL-UNNAMED \
     -jar your-springboot3-app.jar
```

> **注意**：Java 17 模块系统限制，需添加 `--add-opens` 参数，否则 Agent 字节码增强可能报错。

**Dockerfile（Java 17）：**

```dockerfile
FROM eclipse-temurin:17-jre-jammy

COPY skywalking-agent/ /opt/skywalking-agent/
COPY target/app.jar /app.jar

ENV SW_AGENT_NAME=order-service
ENV SW_AGENT_COLLECTOR_BACKEND_SERVICES=oap-server:11800

ENTRYPOINT ["java", \
  "-javaagent:/opt/skywalking-agent/skywalking-agent.jar", \
  "--add-opens", "java.base/java.lang=ALL-UNNAMED", \
  "-jar", "/app.jar"]
```

### 4.2 方式二：Micrometer Tracing + OpenTelemetry（SpringBoot 3 原生）

SpringBoot 3.x 内置 Micrometer Tracing，可通过 OTLP 协议直接对接 SkyWalking OAP，**完全无 Agent**。

**pom.xml：**

```xml
<dependencies>
    <!-- SpringBoot 3 Actuator（包含 Micrometer）-->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>

    <!-- Micrometer Tracing + OpenTelemetry Bridge -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-tracing-bridge-otel</artifactId>
    </dependency>

    <!-- OTLP Exporter（输出到 SkyWalking OAP）-->
    <dependency>
        <groupId>io.opentelemetry</groupId>
        <artifactId>opentelemetry-exporter-otlp</artifactId>
    </dependency>

    <!-- Zipkin Reporter（可选，支持 Zipkin 协议）-->
    <dependency>
        <groupId>io.zipkin.reporter2</groupId>
        <artifactId>zipkin-reporter-brave</artifactId>
    </dependency>
</dependencies>
```

**application.yml：**

```yaml
management:
  tracing:
    enabled: true
    sampling:
      probability: 1.0      # 采样率，生产建议 0.1~0.3

  otlp:
    tracing:
      endpoint: http://oap-server:4318/v1/traces    # OAP OTLP HTTP 接收端
      # 或使用 gRPC:
      # endpoint: http://oap-server:4317

spring:
  application:
    name: order-service     # 服务名（会作为 SkyWalking 服务标识）
```

**自定义 Span（Micrometer API）：**

```java
import io.micrometer.tracing.Span;
import io.micrometer.tracing.Tracer;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final Tracer tracer;

    public Order createOrder(OrderRequest request) {
        // 创建子 Span
        Span span = tracer.nextSpan().name("createOrder").start();
        try (Tracer.SpanInScope ws = tracer.withSpan(span.start())) {
            // 添加标签
            span.tag("order.type", request.getType());
            span.tag("user.id", request.getUserId());

            // 记录事件
            span.event("order-validation-start");
            validate(request);
            span.event("order-validation-end");

            return doCreateOrder(request);
        } catch (Exception e) {
            span.error(e);
            throw e;
        } finally {
            span.end();
        }
    }
}
```

**注解方式（更简洁）：**

```java
import io.micrometer.tracing.annotation.NewSpan;
import io.micrometer.tracing.annotation.SpanTag;

@Service
public class InventoryService {

    // 自动创建 Span，方法名作为 operationName
    @NewSpan("checkInventory")
    public boolean checkStock(
        @SpanTag("product.id") String productId,
        @SpanTag("quantity") int quantity) {
        return doCheckStock(productId, quantity);
    }
}
```

### 4.3 方式三：SkyWalking Toolkit（代码侵入，功能最全）

**pom.xml：**

```xml
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
```

```java
@Service
public class PaymentService {

    @Trace(operationName = "processPayment")
    public PaymentResult process(PaymentRequest req) {
        ActiveSpan.tag("payment.method", req.getMethod());
        ActiveSpan.tag("amount", String.valueOf(req.getAmount()));

        // 获取 traceId 写入响应头或日志
        String traceId = TraceContext.traceId();
        MDC.put("traceId", traceId);

        return doProcess(req);
    }
}
```

---

## 五、日志与 Trace 关联

### 5.1 Logback 配置

`src/main/resources/logback-spring.xml`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.core.encoder.LayoutWrappingEncoder">
            <!-- 方式一：SkyWalking Toolkit（配合 Agent）-->
            <layout class="org.apache.skywalking.apm.toolkit.log.logback.v1.x.TraceIdPatternLogbackLayout">
                <Pattern>%d{HH:mm:ss.SSS} [%thread] %-5level [%tid] %logger{36} - %msg%n</Pattern>
            </layout>
        </encoder>
    </appender>

    <!-- 方式二：Micrometer Tracing（SpringBoot 3 原生，配合 OTLP 方案）-->
    <!-- MDC 自动注入 traceId 和 spanId -->
    <appender name="STDOUT_MDC" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <Pattern>
                %d{HH:mm:ss.SSS} [%thread] %-5level [%X{traceId}/%X{spanId}] %logger{36} - %msg%n
            </Pattern>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
```

### 5.2 MDC 自动传递（SpringBoot 3 + Micrometer）

```yaml
# application.yml
logging:
  pattern:
    # MDC 中自动包含 traceId 和 spanId
    console: "%d{HH:mm:ss.SSS} [%thread] %-5level [%X{traceId}] %logger{36} - %msg%n"
```

---

## 六、SpringBoot 3 特有适配

### 6.1 Virtual Threads（JDK 21 + SpringBoot 3.2）

SpringBoot 3.2 支持虚拟线程，需注意 SkyWalking Agent 的兼容性：

```yaml
# application.yml（启用虚拟线程）
spring:
  threads:
    virtual:
      enabled: true
```

```java
// SkyWalking Agent 9.3+ 支持虚拟线程上下文传递
// Micrometer Tracing 方案天然兼容虚拟线程（推荐）
@RestController
public class OrderController {

    @GetMapping("/order/{id}")
    // 虚拟线程中 Trace Context 自动传播
    public Order getOrder(@PathVariable String id) {
        return orderService.findById(id);
    }
}
```

### 6.2 WebFlux（响应式）追踪

```xml
<!-- Reactor 上下文传播 -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-otel</artifactId>
</dependency>
<dependency>
    <groupId>io.projectreactor</groupId>
    <artifactId>reactor-core</artifactId>
</dependency>
```

```java
@RestController
public class ReactiveOrderController {

    private final OrderService orderService;
    private final Tracer tracer;

    @GetMapping("/order/{id}")
    public Mono<Order> getOrder(@PathVariable String id) {
        return Mono.fromCallable(() -> orderService.findById(id))
            // Micrometer Tracing 自动传播 Reactor Context
            .contextWrite(context -> context);
    }
}
```

### 6.3 Spring WebClient 追踪

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient(WebClient.Builder builder) {
        // Micrometer Tracing 自动为 WebClient 添加追踪 Header
        // 无需手动配置
        return builder
            .baseUrl("http://inventory-service")
            .build();
    }
}
```

---

## 七、Spring Cloud 链路传递

```yaml
# application.yml
spring:
  cloud:
    openfeign:
      micrometer:
        enabled: true   # 开启 Feign Micrometer 集成（SpringBoot 3 必须显式开启）
```

```java
@FeignClient(name = "inventory-service")
public interface InventoryClient {
    // Micrometer Tracing 自动注入 traceparent Header（W3C 标准）
    // SkyWalking 同时支持 W3C traceparent 和 sw8 Header
    @GetMapping("/inventory/{productId}")
    Inventory getInventory(@PathVariable String productId);
}
```

---

## 八、性能调优

### 8.1 采样策略

**Agent 方式：**

```properties
# 每 3 秒最大采样数
agent.sample_n_per_3_secs=30
```

**Micrometer 方式：**

```yaml
management:
  tracing:
    sampling:
      probability: 0.1   # 10% 采样（生产推荐）
```

**自定义采样器：**

```java
@Configuration
public class TracingConfig {

    @Bean
    public Sampler customSampler() {
        // 自定义采样逻辑：健康检查不采样，其他全采样
        return (traceContext, sampler) -> {
            String path = traceContext.name();
            if (path != null && path.contains("actuator")) {
                return SamplingResult.NOT_SAMPLED;
            }
            return SamplingResult.SAMPLED;
        };
    }
}
```

### 8.2 Java 17 模块系统适配

```bash
# 完整的 Java 17 启动参数
java \
  -javaagent:/opt/skywalking-agent/skywalking-agent.jar \
  --add-opens java.base/java.lang=ALL-UNNAMED \
  --add-opens java.base/java.math=ALL-UNNAMED \
  --add-opens java.base/java.util=ALL-UNNAMED \
  --add-opens java.base/java.util.concurrent=ALL-UNNAMED \
  --add-opens java.base/sun.nio.ch=ALL-UNNAMED \
  -Dskywalking.agent.service_name=order-service \
  -Dskywalking.collector.backend_service=oap-server:11800 \
  -jar app.jar
```

---

## 九、告警配置

`config/alarm-settings.yml`：

```yaml
rules:
  service_resp_time_rule:
    metrics-name: service_resp_time
    op: ">"
    threshold: 1000
    period: 10
    count: 3
    silence-period: 5
    message: "服务 {name} 响应时间超过 1s"

  service_sla_rule:
    metrics-name: service_sla
    op: "<"
    threshold: 5000
    period: 10
    count: 2
    silence-period: 3
    message: "服务 {name} 成功率低于 50%"

# 钉钉/企业微信告警
webhooks:
  - https://oapi.dingtalk.com/robot/send?access_token=xxx
  - https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx
```

---

## 十、Docker Compose 一键部署

```yaml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false    # 开发环境关闭安全
      - "ES_JAVA_OPTS=-Xms512m -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - es-data:/usr/share/elasticsearch/data

  oap-server:
    image: apache/skywalking-oap-server:9.7.0
    depends_on:
      - elasticsearch
    environment:
      SW_STORAGE: elasticsearch
      SW_STORAGE_ES_CLUSTER_NODES: elasticsearch:9200
      SW_OTEL_RECEIVER: default              # 开启 OpenTelemetry 接收
      SW_OTEL_RECEIVER_ENABLED_HANDLERS: default
    ports:
      - "11800:11800"   # SkyWalking Agent gRPC
      - "12800:12800"   # HTTP REST
      - "4317:4317"     # OTLP gRPC（SpringBoot 3 Micrometer）
      - "4318:4318"     # OTLP HTTP

  skywalking-ui:
    image: apache/skywalking-ui:9.7.0
    depends_on:
      - oap-server
    environment:
      SW_OAP_ADDRESS: http://oap-server:12800
    ports:
      - "8080:8080"

  # SpringBoot 3 应用（Agent 方式）
  order-service-agent:
    image: eclipse-temurin:17-jre-jammy
    depends_on:
      - oap-server
    environment:
      SW_AGENT_NAME: order-service
      SW_AGENT_COLLECTOR_BACKEND_SERVICES: oap-server:11800
    volumes:
      - ./skywalking-agent:/opt/skywalking-agent
      - ./target/app.jar:/app.jar
    command: >
      java
      -javaagent:/opt/skywalking-agent/skywalking-agent.jar
      --add-opens java.base/java.lang=ALL-UNNAMED
      -jar /app.jar

  # SpringBoot 3 应用（Micrometer OTLP 方式）
  order-service-otel:
    image: eclipse-temurin:17-jre-jammy
    depends_on:
      - oap-server
    environment:
      MANAGEMENT_OTLP_TRACING_ENDPOINT: http://oap-server:4318/v1/traces
      MANAGEMENT_TRACING_SAMPLING_PROBABILITY: "1.0"
      SPRING_APPLICATION_NAME: order-service
    volumes:
      - ./target/app.jar:/app.jar
    command: java -jar /app.jar

volumes:
  es-data:
```

---

## 十一、两种接入方式对比

| 维度 | Java Agent | Micrometer OTLP |
|------|-----------|-----------------|
| 代码侵入 | 无 | 少量（依赖引入）|
| Java 版本 | 8 / 11 / 17+ | 17+（SpringBoot 3）|
| 功能丰富度 | 最全 | 基础链路追踪 |
| 虚拟线程 | 需 9.3+ | 天然支持 |
| 自定义 Span | @Trace 注解 | @NewSpan 注解 |
| 协议 | sw8（私有）| W3C traceparent（标准）|
| 跨 APM 兼容 | 弱 | 强（OTLP 标准协议）|
| 运维复杂度 | 需维护 Agent | 依赖 Maven 管理 |

**推荐策略：**
- 新项目（SpringBoot 3 + 微服务）→ **Micrometer OTLP**，标准协议，未来可切换 APM 工具
- 存量项目迁移 / 需要 DB 级别追踪 → **Java Agent**，功能最全，零代码修改

---

## 十二、常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Agent 增强失败 | Java 17 模块限制 | 添加 `--add-opens` 参数 |
| Servlet 插件不生效 | Agent < 9.1.0 | 升级至 9.1.0+，使用 Jakarta 插件 |
| OTLP 数据未到达 | OAP 未开启 OTLP 接收器 | 配置 `SW_OTEL_RECEIVER=default` |
| 虚拟线程 Trace 丢失 | Agent 版本过旧 | 升级 Agent 或改用 Micrometer 方案 |
| W3C Header 不兼容 | SkyWalking 默认 sw8 协议 | OAP 9.x 已同时支持 W3C traceparent |
| 采样率设置无效 | 两种方案配置位置不同 | Agent 用 `agent.config`，Micrometer 用 `application.yml` |