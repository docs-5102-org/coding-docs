---
title: SpringBoot集成Netty
category:
  - Web框架
tag:
  - Spring Boot
  - Netty
---

# SpringBoot 集成 Netty 完整指南

## 1. 概述

Netty 是一个基于 NIO 的高性能网络通信框架，而 SpringBoot 提供了快速构建应用的能力。将两者结合可以构建高性能的网络服务应用。本文将详细介绍如何在 SpringBoot 项目中集成 Netty。

## 2. 环境准备

### 2.1 依赖配置

在 `pom.xml` 中添加必要的依赖：

```xml
<dependencies>
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
        <version>2.7.0</version>
    </dependency>
    
    <!-- Netty 依赖 -->
    <dependency>
        <groupId>io.netty</groupId>
        <artifactId>netty-all</artifactId>
        <version>4.1.77.Final</version>
    </dependency>
    
    <!-- JSON 处理 -->
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
        <version>2.13.3</version>
    </dependency>
    
    <!-- Lombok (可选) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

## 3. 核心组件实现

### 3.1 Netty 服务器配置

```java
@Component
@Slf4j
public class NettyServer {
    
    @Value("${netty.server.port:8888}")
    private int port;
    
    @Value("${netty.server.boss-threads:1}")
    private int bossThreads;
    
    @Value("${netty.server.worker-threads:0}")
    private int workerThreads;
    
    private EventLoopGroup bossGroup;
    private EventLoopGroup workerGroup;
    private Channel channel;
    
    @Autowired
    private NettyServerHandler nettyServerHandler;
    
    /**
     * 启动 Netty 服务器
     */
    public void start() throws InterruptedException {
        bossGroup = new NioEventLoopGroup(bossThreads);
        workerGroup = new NioEventLoopGroup(workerThreads);
        
        try {
            ServerBootstrap bootstrap = new ServerBootstrap();
            bootstrap.group(bossGroup, workerGroup)
                    .channel(NioServerSocketChannel.class)
                    .option(ChannelOption.SO_BACKLOG, 128)
                    .childOption(ChannelOption.SO_KEEPALIVE, true)
                    .childOption(ChannelOption.TCP_NODELAY, true)
                    .childHandler(new ChannelInitializer<SocketChannel>() {
                        @Override
                        protected void initChannel(SocketChannel ch) {
                            ChannelPipeline pipeline = ch.pipeline();
                            
                            // 添加编解码器
                            pipeline.addLast(new LengthFieldBasedFrameDecoder(1024 * 1024, 0, 4, 0, 4));
                            pipeline.addLast(new LengthFieldPrepender(4));
                            pipeline.addLast(new StringDecoder(CharsetUtil.UTF_8));
                            pipeline.addLast(new StringEncoder(CharsetUtil.UTF_8));
                            
                            // 添加业务处理器
                            pipeline.addLast(nettyServerHandler);
                        }
                    });
            
            ChannelFuture future = bootstrap.bind(port).sync();
            channel = future.channel();
            log.info("Netty 服务器启动成功，端口：{}", port);
            
        } catch (Exception e) {
            log.error("Netty 服务器启动失败", e);
            stop();
            throw e;
        }
    }
    
    /**
     * 停止 Netty 服务器
     */
    public void stop() {
        if (channel != null) {
            channel.close();
        }
        if (workerGroup != null) {
            workerGroup.shutdownGracefully();
        }
        if (bossGroup != null) {
            bossGroup.shutdownGracefully();
        }
        log.info("Netty 服务器已停止");
    }
}
```

### 3.2 消息处理器

```java
@Component
@Slf4j
@ChannelHandler.Sharable
public class NettyServerHandler extends ChannelInboundHandlerAdapter {
    
    @Autowired
    private MessageService messageService;
    
    /**
     * 客户端连接时触发
     */
    @Override
    public void channelActive(ChannelHandlerContext ctx) {
        log.info("客户端连接：{}", ctx.channel().remoteAddress());
        // 可以在这里进行连接管理
        ChannelManager.addChannel(ctx.channel());
    }
    
    /**
     * 客户端断开连接时触发
     */
    @Override
    public void channelInactive(ChannelHandlerContext ctx) {
        log.info("客户端断开连接：{}", ctx.channel().remoteAddress());
        ChannelManager.removeChannel(ctx.channel());
    }
    
    /**
     * 接收消息时触发
     */
    @Override
    public void channelRead(ChannelHandlerContext ctx, Object msg) {
        try {
            String message = (String) msg;
            log.info("接收到消息：{}", message);
            
            // 处理消息
            String response = messageService.processMessage(message);
            
            // 回复消息
            if (response != null) {
                ctx.writeAndFlush(response);
            }
            
        } catch (Exception e) {
            log.error("处理消息异常", e);
            ctx.writeAndFlush("ERROR: " + e.getMessage());
        }
    }
    
    /**
     * 异常处理
     */
    @Override
    public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
        log.error("连接异常：{}", ctx.channel().remoteAddress(), cause);
        ctx.close();
    }
}
```

### 3.3 连接管理器

```java
@Component
@Slf4j
public class ChannelManager {
    
    private static final ConcurrentHashMap<String, Channel> CHANNEL_MAP = new ConcurrentHashMap<>();
    
    /**
     * 添加连接
     */
    public static void addChannel(Channel channel) {
        String channelId = channel.id().asShortText();
        CHANNEL_MAP.put(channelId, channel);
        log.info("添加连接：{}，当前连接数：{}", channelId, CHANNEL_MAP.size());
    }
    
    /**
     * 移除连接
     */
    public static void removeChannel(Channel channel) {
        String channelId = channel.id().asShortText();
        CHANNEL_MAP.remove(channelId);
        log.info("移除连接：{}，当前连接数：{}", channelId, CHANNEL_MAP.size());
    }
    
    /**
     * 获取所有连接
     */
    public static Collection<Channel> getAllChannels() {
        return CHANNEL_MAP.values();
    }
    
    /**
     * 根据ID获取连接
     */
    public static Channel getChannel(String channelId) {
        return CHANNEL_MAP.get(channelId);
    }
    
    /**
     * 广播消息
     */
    public static void broadcast(String message) {
        CHANNEL_MAP.values().forEach(channel -> {
            if (channel.isActive()) {
                channel.writeAndFlush(message);
            }
        });
    }
    
    /**
     * 获取连接数量
     */
    public static int getChannelCount() {
        return CHANNEL_MAP.size();
    }
}
```

## 4. 业务服务层

### 4.1 消息处理服务

```java
@Service
@Slf4j
public class MessageService {
    
    @Autowired
    private ObjectMapper objectMapper;
    
    /**
     * 处理接收到的消息
     */
    public String processMessage(String message) {
        try {
            // 解析消息
            MessageRequest request = objectMapper.readValue(message, MessageRequest.class);
            
            // 根据消息类型处理
            switch (request.getType()) {
                case "PING":
                    return handlePing(request);
                case "CHAT":
                    return handleChat(request);
                case "BROADCAST":
                    return handleBroadcast(request);
                default:
                    return createResponse("ERROR", "未知消息类型", null);
            }
            
        } catch (Exception e) {
            log.error("处理消息失败：{}", message, e);
            return createResponse("ERROR", "消息处理失败：" + e.getMessage(), null);
        }
    }
    
    /**
     * 处理 PING 消息
     */
    private String handlePing(MessageRequest request) {
        return createResponse("PONG", "服务器响应", System.currentTimeMillis());
    }
    
    /**
     * 处理聊天消息
     */
    private String handleChat(MessageRequest request) {
        log.info("收到聊天消息：{}", request.getData());
        return createResponse("CHAT_ACK", "消息已接收", request.getData());
    }
    
    /**
     * 处理广播消息
     */
    private String handleBroadcast(MessageRequest request) {
        String broadcastMsg = createResponse("BROADCAST", "广播消息", request.getData());
        ChannelManager.broadcast(broadcastMsg);
        return createResponse("BROADCAST_ACK", "广播消息已发送", null);
    }
    
    /**
     * 创建响应消息
     */
    private String createResponse(String type, String message, Object data) {
        try {
            MessageResponse response = MessageResponse.builder()
                    .type(type)
                    .message(message)
                    .data(data)
                    .timestamp(System.currentTimeMillis())
                    .build();
            return objectMapper.writeValueAsString(response);
        } catch (Exception e) {
            log.error("创建响应消息失败", e);
            return "{\"type\":\"ERROR\",\"message\":\"响应消息创建失败\"}";
        }
    }
}
```

### 4.2 消息模型

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {
    private String type;
    private String message;
    private Object data;
    private Long timestamp;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String type;
    private String message;
    private Object data;
    private Long timestamp;
}
```

## 5. SpringBoot 启动配置

### 5.1 应用启动类

```java
@SpringBootApplication
@Slf4j
public class NettySpringBootApplication implements CommandLineRunner, DisposableBean {
    
    @Autowired
    private NettyServer nettyServer;
    
    public static void main(String[] args) {
        SpringApplication.run(NettySpringBootApplication.class, args);
    }
    
    @Override
    public void run(String... args) throws Exception {
        // 启动 Netty 服务器
        new Thread(() -> {
            try {
                nettyServer.start();
            } catch (InterruptedException e) {
                log.error("Netty 服务器启动异常", e);
                Thread.currentThread().interrupt();
            }
        }).start();
        
        log.info("SpringBoot 应用启动完成");
    }
    
    @Override
    public void destroy() throws Exception {
        // 应用关闭时停止 Netty 服务器
        nettyServer.stop();
    }
}
```

### 5.2 配置文件

`application.yml`：

```yaml
# 服务器配置
server:
  port: 8080

# Netty 配置
netty:
  server:
    port: 8888
    boss-threads: 1
    worker-threads: 4

# 日志配置
logging:
  level:
    com.example.netty: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
```

## 6. REST API 接口

### 6.1 管理接口

```java
@RestController
@RequestMapping("/api/netty")
@Slf4j
public class NettyController {
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("channelCount", ChannelManager.getChannelCount());
        status.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(status);
    }
    
    @PostMapping("/broadcast")
    public ResponseEntity<String> broadcast(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        if (message == null || message.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("消息内容不能为空");
        }
        
        try {
            MessageResponse response = MessageResponse.builder()
                    .type("SYSTEM_BROADCAST")
                    .message("系统广播")
                    .data(message)
                    .timestamp(System.currentTimeMillis())
                    .build();
                    
            ObjectMapper objectMapper = new ObjectMapper();
            String broadcastMsg = objectMapper.writeValueAsString(response);
            
            ChannelManager.broadcast(broadcastMsg);
            return ResponseEntity.ok("广播消息发送成功");
            
        } catch (Exception e) {
            log.error("广播消息失败", e);
            return ResponseEntity.status(500).body("广播消息发送失败");
        }
    }
}
```

## 7. 客户端示例

### 7.1 Java 客户端

```java
@Component
@Slf4j
public class NettyClient {
    
    private EventLoopGroup group;
    private Channel channel;
    
    public void connect(String host, int port) throws InterruptedException {
        group = new NioEventLoopGroup();
        
        Bootstrap bootstrap = new Bootstrap();
        bootstrap.group(group)
                .channel(NioSocketChannel.class)
                .handler(new ChannelInitializer<SocketChannel>() {
                    @Override
                    protected void initChannel(SocketChannel ch) {
                        ChannelPipeline pipeline = ch.pipeline();
                        pipeline.addLast(new LengthFieldBasedFrameDecoder(1024 * 1024, 0, 4, 0, 4));
                        pipeline.addLast(new LengthFieldPrepender(4));
                        pipeline.addLast(new StringDecoder(CharsetUtil.UTF_8));
                        pipeline.addLast(new StringEncoder(CharsetUtil.UTF_8));
                        pipeline.addLast(new ClientHandler());
                    }
                });
        
        ChannelFuture future = bootstrap.connect(host, port).sync();
        channel = future.channel();
        log.info("客户端连接成功：{}:{}", host, port);
    }
    
    public void sendMessage(String message) {
        if (channel != null && channel.isActive()) {
            channel.writeAndFlush(message);
        }
    }
    
    public void disconnect() {
        if (channel != null) {
            channel.close();
        }
        if (group != null) {
            group.shutdownGracefully();
        }
    }
    
    private static class ClientHandler extends ChannelInboundHandlerAdapter {
        @Override
        public void channelRead(ChannelHandlerContext ctx, Object msg) {
            log.info("收到服务器消息：{}", msg);
        }
        
        @Override
        public void exceptionCaught(ChannelHandlerContext ctx, Throwable cause) {
            log.error("客户端异常", cause);
            ctx.close();
        }
    }
}
```

## 8. 性能优化建议

### 8.1 线程池配置

- **Boss 线程数**：通常设置为 1，负责接受连接
- **Worker 线程数**：设置为 CPU 核数的 2 倍，处理 I/O 操作
- **业务线程池**：对于复杂业务逻辑，使用独立的业务线程池

### 8.2 内存管理

```java
// 启用池化的 ByteBuf 分配器
bootstrap.option(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT);
bootstrap.childOption(ChannelOption.ALLOCATOR, PooledByteBufAllocator.DEFAULT);

// 设置接收缓冲区大小
bootstrap.childOption(ChannelOption.RCVBUF_ALLOCATOR, 
    new AdaptiveRecvByteBufAllocator(64, 1024, 65536));
```

### 8.3 网络参数调优

```java
// TCP 相关参数
bootstrap.option(ChannelOption.SO_BACKLOG, 1024);
bootstrap.childOption(ChannelOption.SO_KEEPALIVE, true);
bootstrap.childOption(ChannelOption.TCP_NODELAY, true);
bootstrap.childOption(ChannelOption.SO_REUSEADDR, true);

// 缓冲区大小
bootstrap.childOption(ChannelOption.SO_RCVBUF, 32 * 1024);
bootstrap.childOption(ChannelOption.SO_SNDBUF, 32 * 1024);
```

## 9. 监控和日志

### 9.1 连接监控

```java
@Component
public class ConnectionMonitor {
    
    @Scheduled(fixedRate = 30000) // 每30秒执行一次
    public void logConnectionStats() {
        int activeConnections = ChannelManager.getChannelCount();
        log.info("当前活跃连接数：{}", activeConnections);
    }
}
```

### 9.2 性能指标

- 连接数统计
- 消息吞吐量
- 响应时间
- 错误率统计

## 10. 部署和运维

### 10.1 Docker 部署

```dockerfile
FROM openjdk:11-jre-slim

COPY target/netty-springboot-*.jar app.jar

EXPOSE 8080 8888

ENTRYPOINT ["java", "-jar", "/app.jar"]
```

### 10.2 生产环境配置

```yaml
# 生产环境配置
netty:
  server:
    port: 8888
    boss-threads: 1
    worker-threads: 8

logging:
  level:
    root: INFO
    com.example.netty: INFO
  file:
    name: /var/log/netty-app.log
    max-size: 100MB
    max-history: 30
```

## 11. 相关资料

### 参考文档：
[SocketIO实战](https://www.jianshu.com/p/c67853e729e2)
[SpringBoot集成SocketIO实时通信](https://blog.csdn.net/zsj777/article/details/83212776)

### github源码：
[示例1](https://github.com/tuonioooo/Springboot-master/tree/master/springboot-netty-socketio)
[示例2](https://github.com/xtayfjpk/socketio-test)