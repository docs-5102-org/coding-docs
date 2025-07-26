---
title: Spring WebFlux 基础教程
category:
  - Web框架
tag:
  - Spring WebFlux
---

# Spring WebFlux 基础教程

## 目录
- [什么是Spring WebFlux](#什么是spring-webflux)
- [核心概念](#核心概念)
- [环境准备](#环境准备)
- [创建第一个WebFlux应用](#创建第一个webflux应用)
- [响应式编程基础](#响应式编程基础)
- [路由和处理器](#路由和处理器)
- [数据访问](#数据访问)
- [错误处理](#错误处理)
- [测试](#测试)
- [性能优化](#性能优化)
- [实际应用场景](#实际应用场景)
- [参考资料](#参考资料)

## 什么是Spring WebFlux

Spring WebFlux是Spring Framework 5.0引入的响应式Web框架，基于Reactor库构建。它提供了完全非阻塞的响应式编程模型，特别适合处理高并发、低延迟的应用场景。

### 主要特点

- **非阻塞I/O**: 基于Netty、Undertow等非阻塞服务器
- **响应式流**: 支持背压(backpressure)机制
- **函数式编程**: 支持函数式路由定义
- **灵活性**: 可以选择注解式或函数式编程模型

### WebFlux vs Spring MVC

| 特性 | Spring WebFlux | Spring MVC |
|------|----------------|------------|
| 编程模型 | 响应式 | 命令式 |
| I/O模型 | 非阻塞 | 阻塞 |
| 服务器 | Netty, Undertow | Tomcat, Jetty |
| 并发模型 | 事件循环 | 线程池 |
| 适用场景 | 高并发、I/O密集 | 传统Web应用 |

## 核心概念

### Mono和Flux

WebFlux基于两个核心类型：

- **Mono**: 表示0个或1个元素的异步序列
- **Flux**: 表示0个或多个元素的异步序列

```java
// Mono示例
Mono<String> mono = Mono.just("Hello World");
Mono<String> emptyMono = Mono.empty();

// Flux示例
Flux<String> flux = Flux.just("A", "B", "C");
Flux<Integer> range = Flux.range(1, 5);
```

### 背压(Backpressure)

背压是响应式流的重要概念，用于控制数据生产者和消费者之间的流量，防止内存溢出。

## 环境准备

### 依赖配置

在`pom.xml`中添加WebFlux依赖：

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-webflux</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

### Gradle配置

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-webflux'
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'io.projectreactor:reactor-test'
}
```

## 创建第一个WebFlux应用

### 1. 主应用类

```java
@SpringBootApplication
public class WebFluxApplication {
    public static void main(String[] args) {
        SpringApplication.run(WebFluxApplication.class, args);
    }
}
```

### 2. 创建控制器

```java
@RestController
public class HelloController {

    @GetMapping("/hello")
    public Mono<String> hello() {
        return Mono.just("Hello WebFlux!");
    }

    @GetMapping("/users")
    public Flux<String> getUsers() {
        return Flux.just("Alice", "Bob", "Charlie")
                   .delayElements(Duration.ofSeconds(1));
    }
}
```

### 3. 启动应用

默认情况下，WebFlux应用会在8080端口启动，使用Netty作为嵌入式服务器。

## 响应式编程基础

### 创建响应式流

```java
@Service
public class UserService {

    public Mono<User> findById(String id) {
        return Mono.fromCallable(() -> {
            // 模拟数据库查询
            Thread.sleep(100);
            return new User(id, "User" + id);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Flux<User> findAll() {
        return Flux.range(1, 10)
                   .map(i -> new User(String.valueOf(i), "User" + i))
                   .delayElements(Duration.ofMillis(100));
    }
}
```

### 操作符使用

```java
@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/users/{id}")
    public Mono<ResponseEntity<User>> getUser(@PathVariable String id) {
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/users/filtered")
    public Flux<User> getFilteredUsers() {
        return userService.findAll()
                .filter(user -> Integer.parseInt(user.getId()) % 2 == 0)
                .take(5);
    }
}
```

## 路由和处理器

### 函数式端点

除了注解式编程，WebFlux还支持函数式路由定义：

```java
@Configuration
public class RouterConfig {

    @Bean
    public RouterFunction<ServerResponse> route(UserHandler handler) {
        return RouterFunctions
            .route(GET("/api/users").and(accept(MediaType.APPLICATION_JSON)), handler::getAllUsers)
            .andRoute(GET("/api/users/{id}").and(accept(MediaType.APPLICATION_JSON)), handler::getUser)
            .andRoute(POST("/api/users").and(accept(MediaType.APPLICATION_JSON)), handler::createUser)
            .andRoute(PUT("/api/users/{id}").and(accept(MediaType.APPLICATION_JSON)), handler::updateUser)
            .andRoute(DELETE("/api/users/{id}"), handler::deleteUser);
    }
}
```

### 处理器函数

```java
@Component
public class UserHandler {

    @Autowired
    private UserService userService;

    public Mono<ServerResponse> getAllUsers(ServerRequest request) {
        return ServerResponse.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(userService.findAll(), User.class);
    }

    public Mono<ServerResponse> getUser(ServerRequest request) {
        String id = request.pathVariable("id");
        return userService.findById(id)
                .flatMap(user -> ServerResponse.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(user))
                .switchIfEmpty(ServerResponse.notFound().build());
    }

    public Mono<ServerResponse> createUser(ServerRequest request) {
        return request.bodyToMono(User.class)
                .flatMap(userService::save)
                .flatMap(user -> ServerResponse.created(URI.create("/api/users/" + user.getId()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(user));
    }
}
```

## 数据访问

### Spring Data R2DBC

响应式关系数据库访问：

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-r2dbc</artifactId>
</dependency>
<dependency>
    <groupId>io.r2dbc</groupId>
    <artifactId>r2dbc-postgresql</artifactId>
</dependency>
```

### Repository定义

```java
public interface UserRepository extends ReactiveCrudRepository<User, String> {
    
    @Query("SELECT * FROM users WHERE name LIKE :name")
    Flux<User> findByNameContaining(String name);
    
    Flux<User> findByAgeBetween(int minAge, int maxAge);
}
```

### 配置数据库连接

```yaml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/mydb
    username: user
    password: password
    pool:
      initial-size: 10
      max-size: 20
```

### MongoDB响应式支持

```java
public interface UserRepository extends ReactiveMongoRepository<User, String> {
    Flux<User> findByCity(String city);
    Mono<User> findByEmail(String email);
}
```

## 错误处理

### 全局异常处理

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        ErrorResponse error = new ErrorResponse("USER_NOT_FOUND", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
        ErrorResponse error = new ErrorResponse("VALIDATION_ERROR", ex.getMessage());
        return ResponseEntity.badRequest().body(error);
    }
}
```

### 错误操作符

```java
public Mono<User> getUser(String id) {
    return userRepository.findById(id)
            .switchIfEmpty(Mono.error(new UserNotFoundException("User not found: " + id)))
            .onErrorMap(DatabaseException.class, 
                       ex -> new ServiceException("Database error", ex))
            .retry(3);
}
```

## 测试

### 单元测试

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @InjectMocks
    private UserService userService;

    @Test
    void shouldFindUserById() {
        // Given
        String userId = "123";
        User expectedUser = new User(userId, "Test User");
        when(repository.findById(userId)).thenReturn(Mono.just(expectedUser));

        // When
        Mono<User> result = userService.findById(userId);

        // Then
        StepVerifier.create(result)
                .expectNext(expectedUser)
                .verifyComplete();
    }
}
```

### 集成测试

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class UserControllerIntegrationTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    void shouldGetAllUsers() {
        webTestClient.get()
                .uri("/users")
                .accept(MediaType.APPLICATION_JSON)
                .exchange()
                .expectStatus().isOk()
                .expectBodyList(User.class)
                .hasSize(3);
    }
}
```

## 性能优化

### 配置优化

```yaml
spring:
  webflux:
    # 设置缓冲区大小
    codec:
      max-in-memory-size: 256KB
  netty:
    # 调整事件循环线程数
    server:
      worker-threads: 4
```

### 背压处理

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_PLAIN_VALUE)
public Flux<String> streamData() {
    return Flux.interval(Duration.ofMillis(100))
            .map(i -> "data-" + i + "\n")
            .onBackpressureBuffer(1000)  // 缓冲区大小
            .onBackpressureDrop(item -> 
                log.warn("Dropped item: {}", item));  // 丢弃策略
}
```

### 连接池配置

```java
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient webClient() {
        ConnectionProvider provider = ConnectionProvider.builder("custom")
                .maxConnections(500)
                .maxIdleTime(Duration.ofSeconds(20))
                .maxLifeTime(Duration.ofMinutes(1))
                .pendingAcquireTimeout(Duration.ofSeconds(60))
                .evictInBackground(Duration.ofSeconds(120))
                .build();

        return WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(
                        HttpClient.create(provider)))
                .build();
    }
}
```

## 实际应用场景

### 1. 微服务网关

```java
@Component
public class GatewayHandler {

    public Mono<ServerResponse> routeToService(ServerRequest request) {
        return webClient.get()
                .uri("http://user-service/users/" + request.pathVariable("id"))
                .retrieve()
                .bodyToMono(User.class)
                .flatMap(user -> ServerResponse.ok().bodyValue(user))
                .onErrorResume(ex -> ServerResponse.status(503).build());
    }
}
```

### 2. 服务器推送事件(SSE)

```java
@GetMapping(value = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<String>> streamEvents() {
    return Flux.interval(Duration.ofSeconds(1))
            .map(sequence -> ServerSentEvent.<String>builder()
                    .id(String.valueOf(sequence))
                    .event("periodic-event")
                    .data("SSE - " + LocalTime.now())
                    .build());
}
```

### 3. WebSocket支持

```java
@Configuration
@EnableWebFluxSecurity
public class WebSocketConfig {

    @Bean
    public HandlerMapping webSocketMapping() {
        Map<String, WebSocketHandler> map = new HashMap<>();
        map.put("/websocket", new EchoWebSocketHandler());

        SimpleUrlHandlerMapping mapping = new SimpleUrlHandlerMapping();
        mapping.setUrlMap(map);
        mapping.setOrder(-1);
        return mapping;
    }
}
```

## 最佳实践

### 1. 避免阻塞操作

```java
// 错误做法
@GetMapping("/users/{id}")
public Mono<User> getUser(@PathVariable String id) {
    User user = jdbcTemplate.queryForObject(...); // 阻塞操作
    return Mono.just(user);
}

// 正确做法
@GetMapping("/users/{id}")
public Mono<User> getUser(@PathVariable String id) {
    return userRepository.findById(id); // 非阻塞操作
}
```

### 2. 合理使用调度器

```java
public Mono<String> processData(String data) {
    return Mono.fromCallable(() -> {
        // CPU密集型操作
        return heavyComputation(data);
    }).subscribeOn(Schedulers.parallel());
}

public Mono<String> readFile(String path) {
    return Mono.fromCallable(() -> {
        // I/O操作
        return Files.readString(Paths.get(path));
    }).subscribeOn(Schedulers.boundedElastic());
}
```

### 3. 错误处理策略

```java
public Mono<User> getUserWithFallback(String id) {
    return primaryService.getUser(id)
            .timeout(Duration.ofSeconds(5))
            .onErrorResume(TimeoutException.class, 
                          ex -> secondaryService.getUser(id))
            .onErrorReturn(new User(id, "Default User"));
}
```

## 参考资料

### 官方文档

- [Spring WebFlux 官方文档](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html)
- [Spring Boot WebFlux 指南](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.reactive)
- [Project Reactor 官方文档](https://projectreactor.io/docs/core/release/reference/)
- [Spring Data R2DBC](https://docs.spring.io/spring-data/r2dbc/docs/current/reference/html/)

### 第三方教程和资源

- [Baeldung - Spring WebFlux 系列教程](https://www.baeldung.com/spring-webflux)
- [Josh Long - Reactive Spring](https://www.youtube.com/watch?v=Cj4foJzPF80)
- [Spring WebFlux 实战教程 - 掘金](https://juejin.cn/post/6844903846207307790)
- [响应式编程入门 - InfoQ](https://www.infoq.cn/article/reactor-by-example)
- [Spring WebFlux vs Spring MVC - DZone](https://dzone.com/articles/spring-webflux-vs-spring-mvc)

### 社区资源

- [Spring Community Forums](https://community.spring.io/)
- [Stack Overflow - Spring WebFlux](https://stackoverflow.com/questions/tagged/spring-webflux)
- [GitHub - Spring Projects](https://github.com/spring-projects)
- [Reactor Community](https://github.com/reactor)

### 书籍推荐

- "Spring in Action" by Craig Walls (第6版)
- "Reactive Programming with RxJava" by Tomasz Nurkiewicz
- "Hands-On Reactive Programming in Spring 5" by Oleh Dokuka

### 在线课程

- [Spring Academy - Reactive Programming](https://spring.academy/courses/reactive-programming)
- [Udemy - Spring WebFlux 完整教程](https://www.udemy.com/topic/spring-webflux/)
- [Pluralsight - Building Reactive Applications](https://www.pluralsight.com/courses/building-reactive-applications-spring-webflux)

---

本教程涵盖了Spring WebFlux的基础知识和实践应用。建议结合官方文档和实际项目来深入学习响应式编程的概念和最佳实践。