---
title: Spring 注解详解
category:
  - Web框架
tag:
  - Spring 注解详解
---

# Spring 注解详解

## 目录

[[toc]]

## 核心配置注解

### @EnableAutoConfiguration 注解

#### 1. 作用

`@EnableAutoConfiguration` 是 Spring Boot 的核心注解之一，它的作用是：
👉 **根据应用的依赖和配置，自动推测并配置 Spring 容器所需要的 Bean**。

例如：

* 如果引入了 `spring-boot-starter-web`，它会自动配置 **Tomcat**、**Spring MVC** 等组件，帮你快速启动一个 Web 应用。

---

#### 2. 与 Starter POM 的关系

* **Starter POM**：一种统一的依赖管理方式，方便你一次性引入一组常用依赖（比如 `spring-boot-starter-data-jpa`）。
* **Auto-Configuration**：根据类路径下的依赖和条件（如是否存在某个类、某个配置）来自动配置 Spring 应用。

📌 二者的关系：

* Starter POM 只是简化了依赖管理。
* Auto-Configuration 才是让 Spring Boot 应用「开箱即用」的关键机制。
* **两者互相独立，但常常配合使用**。

---

#### 3. 使用方式

`@EnableAutoConfiguration` 一般加在应用的主配置类（`@Configuration`）上：

```java
@Configuration
@EnableAutoConfiguration
public class MyApplication {
}
```

> 在实际开发中，通常不直接使用 `@EnableAutoConfiguration`，而是使用组合注解 `@SpringBootApplication`，它包含了：

* `@Configuration`
* `@EnableAutoConfiguration`
* `@ComponentScan`

---

#### 4. 禁用自动配置

如果某些自动配置类不是你想要的，可以通过 `exclude` 或 `excludeName` 属性禁用：

```java
import org.springframework.boot.autoconfigure.*;
import org.springframework.boot.autoconfigure.jdbc.*;
import org.springframework.context.annotation.*;

@Configuration
@EnableAutoConfiguration(exclude = { DataSourceAutoConfiguration.class })
public class MyConfiguration {
}
```

📌 常见场景：

* 不想使用 Spring Boot 默认的数据源配置，而是自己配置数据源。
* 不想使用默认的安全配置（如 Spring Security 自动配置）。

---

✅ **总结**：

* `@EnableAutoConfiguration` 让 Spring Boot 根据依赖自动配置应用，大幅减少手动配置的工作。
* Starter POM 提供依赖，Auto-Configuration 负责配置。
* 如果某些自动配置不合适，可以通过 `exclude` 禁用。
* 推荐使用 `@SpringBootApplication` 替代单独的 `@EnableAutoConfiguration`。

### 

👌 我帮你把这段内容优化一下，让结构更清晰、重点更突出，适合学习笔记或者文档使用：

---

### @SpringBootApplication

#### 1. 背景

在 Spring Boot 项目中，主类通常需要组合以下三个注解：

* **`@Configuration`**：声明该类是一个配置类，替代传统的 XML 配置。
* **`@EnableAutoConfiguration`**：启用 Spring Boot 的自动配置机制，根据类路径中的依赖自动装配 Bean。
* **`@ComponentScan`**：启用组件扫描，自动发现并注册当前包及子包下的 `@Component`、`@Service`、`@Repository`、`@Controller` 等组件。

由于这三个注解几乎总是一起使用，Spring Boot 提供了一个更方便的组合注解：**`@SpringBootApplication`**。

---

#### 2. 定义

`@SpringBootApplication` 等价于：

```java
@Configuration
@EnableAutoConfiguration
@ComponentScan
```

也就是说，它默认具备了配置类、自动配置、组件扫描的能力。

---

#### 3. 使用示例

```java
package com.example.myproject;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication // 相当于 @Configuration + @EnableAutoConfiguration + @ComponentScan
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

---

#### 4. 最佳实践

* **主类建议放在顶层包**：这样 `@ComponentScan` 能扫描到所有子包中的组件，避免遗漏。
* **推荐使用 `@SpringBootApplication`**，而不是手动写三个注解，更简洁，也符合 Spring Boot 官方规范。

---

✅ **总结**：
`@SpringBootApplication` 是 Spring Boot 应用的入口标志，封装了最常用的三个注解（`@Configuration`、`@EnableAutoConfiguration`、`@ComponentScan`），让应用具备自动配置和组件扫描能力，极大简化了开发。


### @Configuration

用于标注配置类，相当于传统的XML配置文件。通常与@Bean注解配合使用。

```java
@Configuration
public class AppConfig {
    
    @Bean
    public UserService userService() {
        return new UserServiceImpl();
    }
}
```

参考:

- https://blog.csdn.net/tuoni123/article/details/79977459


### @EnableConfigurationProperties

#### 1. 作用

`@EnableConfigurationProperties` 用于启用并注册使用 **`@ConfigurationProperties`** 注解的 Bean，使其能够从 **`application.properties`** 或 **`application.yml`** 等配置文件中读取并绑定属性值。

换句话说：
👉 它让 **配置文件中的属性** 可以自动映射到 Java Bean 上。

---

#### 2. 使用方式

**方式一：自动扫描**

如果你的类上已经标注了 `@ConfigurationProperties` 并且被 Spring 管理（例如加了 `@Component`），那么无需额外写 `@EnableConfigurationProperties`，Spring Boot 会自动识别。

```java
@Component
@ConfigurationProperties(prefix = "app.connection")
public class ConnectionSettings {
    private String url;
    private String username;
    private String password;
    // getters & setters
}
```

配置文件示例：

```yaml
app:
  connection:
    url: jdbc:mysql://localhost:3306/test
    username: root
    password: 123456
```

---

**方式二：在配置类中显式启用**

如果 `@ConfigurationProperties` 类没有交给 Spring 管理（没有 `@Component`），可以通过 `@EnableConfigurationProperties` 注册：

```java
@Configuration
@EnableConfigurationProperties(ConnectionSettings.class)
public class MyConfiguration {
}
```

这样，`ConnectionSettings` 就会作为一个 Bean 被注册到 Spring 容器，并完成属性绑定。

---

#### 3. 总结

| 注解                               | 作用                                 | 典型用法                             |
| -------------------------------- | ---------------------------------- | -------------------------------- |
| `@ConfigurationProperties`       | 声明一个配置属性类，支持从配置文件绑定                | 放在 Java Bean 上                   |
| `@EnableConfigurationProperties` | 启用并注册 `@ConfigurationProperties` 类 | 放在 `@Configuration` 类上，指定要注册的属性类 |

✅ **最佳实践**：

* 小型项目：直接在配置类上加 `@Component + @ConfigurationProperties`。
* 大型项目（推荐）：只在 Bean 上写 `@ConfigurationProperties`，然后通过 `@EnableConfigurationProperties` 显式注册，避免组件扫描的副作用，更清晰。

👌 我帮你把 **`@Profile`（注意是单数形式，不是 `@Profiles`）** 的说明优化一下，让逻辑更清楚：

---

## @ConditionalOnXXX

在 Spring Boot 自动配置中，@ConditionalOnXXX 系列注解用于控制配置类或 Bean 是否生效。
通过这些条件注解，Spring Boot 能够根据当前环境（类路径、Bean 是否存在、配置属性等）自动选择合适的配置。


### 使用场景

#### 作用于类上

* 一般需要与 @Configuration 一起使用
* 决定整个配置类是否生效

#### 作用于方法上

* 一般需要与 @Bean 一起使用
* 决定某个 Bean 是否需要注册到容器中

### 典型示例

```java
@Configuration
// 仅当类路径中存在 DataSource 和 EmbeddedDatabaseType 时，配置类才生效
@ConditionalOnClass({ DataSource.class, EmbeddedDatabaseType.class })
@EnableConfigurationProperties(DataSourceProperties.class)
@Import({ Registrar.class, DataSourcePoolMetadataProvidersConfiguration.class })
public class DataSourceAutoConfiguration {

    private static final Log logger =
            LogFactory.getLog(DataSourceAutoConfiguration.class);

    @Bean
    // 当容器中不存在 DataSourceInitializer Bean 时，才创建默认的 DataSourceInitializer
    @ConditionalOnMissingBean
    public DataSourceInitializer dataSourceInitializer(DataSourceProperties properties,
                                                       ApplicationContext applicationContext) {
        return new DataSourceInitializer(properties, applicationContext);
    }
}

```

### 常用 @ConditionalOnXXX 注解说明

| 注解                                  | 作用                              | 使用场景                           |
| ----------------------------------- | ------------------------------- | ------------------------------ |
| **@ConditionalOnClass**             | 当指定的类存在于类路径中时，配置才生效             | 检查某些依赖是否存在，如 JDBC、Redis 客户端等   |
| **@ConditionalOnMissingClass**      | 当指定的类 **不存在** 于类路径中时，配置才生效      | 某些功能只在缺少依赖时启用                  |
| **@ConditionalOnBean**              | 当容器中存在指定类型的 Bean 时，配置才生效        | 依赖某些 Bean 才能初始化后续组件            |
| **@ConditionalOnMissingBean**       | 当容器中 **不存在** 指定类型的 Bean 时，配置才生效 | 提供默认 Bean 实现（最常见）              |
| **@ConditionalOnProperty**          | 当配置文件中存在指定属性，并且值符合要求时，配置才生效     | 常用于通过 `application.yml` 控制功能开关 |
| **@ConditionalOnResource**          | 当类路径下存在指定资源时，配置才生效              | 比如检测某个配置文件、脚本是否存在              |
| **@ConditionalOnWebApplication**    | 当前应用是 Web 应用时，配置才生效             | 区分 Web 环境和非 Web 环境             |
| **@ConditionalOnNotWebApplication** | 当前应用不是 Web 应用时，配置才生效            | CLI 程序或后台任务场景                  |
| **@ConditionalOnExpression**        | 基于 SpEL 表达式的结果来决定是否生效           | 灵活控制，表达式返回 `true` 才生效          |
| **@ConditionalOnJava**              | 当 Java 版本符合要求时，配置才生效            | 比如要求 JDK 1.8 以上                |
| **@ConditionalOnCloudPlatform**     | 当运行在指定云平台上时，配置才生效               | 如 Kubernetes、Heroku 等          |


### @Profile 注解

#### 1. 作用

Spring **Profile** 提供了一种机制，可以根据当前运行的环境，选择性地加载 Bean 或配置类。
👉 简单来说：**不同环境加载不同配置**。

任何 `@Component` 或 `@Configuration` 都可以使用 `@Profile` 标记，只有当指定的 Profile 激活时，该 Bean 才会被注册到 Spring 容器中。

---

#### 2. 使用示例

```java
@Configuration
@Profile("production")  // 仅在 production 环境激活时生效
public class ProductionConfiguration {
    // ...
}
```

---

#### 3. 激活 Profile 的方式

Spring Boot 提供多种方式来指定 **当前激活的 Profile**：

**✅ application.properties / application.yml**

```properties
spring.profiles.active=dev,hsqldb
```

```yaml
spring:
  profiles:
    active: dev,hsqldb
```

---

**✅ 命令行参数**

```bash
java -jar app.jar --spring.profiles.active=prod
```

---

**✅ 环境变量**

```bash
export SPRING_PROFILES_ACTIVE=dev
```

---

#### 4. 总结

| 注解 / 属性                  | 作用                            | 示例                                  |
| ------------------------ | ----------------------------- | ----------------------------------- |
| `@Profile("xxx")`        | 指定某个 Bean/配置类仅在 `xxx` 环境激活时生效 | `@Profile("dev")`                   |
| `spring.profiles.active` | 设置当前应用激活的 Profile（可多个）        | `spring.profiles.active=dev,hsqldb` |

---

✅ **最佳实践**：

* 开发环境：`dev`
* 测试环境：`test` 或 `qa`
* 生产环境：`prod`
* 建议将 **环境相关的 Bean/配置分离**，利用 `@Profile` 控制加载，避免手动修改配置文件。

### @ComponentScan

用于指定Spring需要扫描的包路径，自动发现和注册Bean。

```java
@Configuration
@ComponentScan(basePackages = "com.example.web")
public class WebConfig {
    // 配置内容
}
```

### @Bean
标注在方法上，表示该方法返回的对象将被Spring容器管理。

```java
@Configuration
public class DatabaseConfig {
    
    @Bean
    public DataSource dataSource() {
        // 返回数据源对象
        return new HikariDataSource();
    }
}
```

### @Import

[CSDN](https://blog.csdn.net/tuoni123/article/details/80213050)

## Web层注解

### @Controller
标注控制器类，处理HTTP请求。

```java
@Controller
public class UserController {
    
    @RequestMapping("/users")
    public String listUsers(Model model) {
        return "userList";
    }
}
```

**注意事项：**
- Controller是单例的，被多个请求线程共享
- 应该设计成无状态类
- 需要在配置文件中添加组件扫描：`<context:component-scan base-package="com.example.web"/>`

👌 我帮你把 **`@RestController`** 的说明优化一下，条理化成学习笔记风格：

---

## @RestController 注解

#### 1. 作用

`@RestController` 是一个 **组合注解**，相当于同时加上了：

* **`@Controller`**：标记该类是一个 Spring MVC 控制器。
* **`@ResponseBody`**：表示方法返回值会直接作为 HTTP 响应体，而不是渲染到视图。

👉 适用于开发 **RESTful API**（返回 JSON / XML / 自定义类型），避免每个方法都手动写 `@ResponseBody`。

---

#### 2. 使用示例

```java
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello() {
        return "Hello, World!";
    }
}
```

调用 `/hello` 接口时，返回内容就是：

```
Hello, World!
```

而不会去找视图解析器加载一个 `hello.html`。

---

#### 3. 与 @Controller 区别

| 注解                | 作用                  | 返回值处理方式                                  | 典型场景        |
| ----------------- | ------------------- | ---------------------------------------- | ----------- |
| `@Controller`     | 标记类为控制器             | 返回值默认作为 **视图名称**，需要模板解析（如 Thymeleaf、JSP） | MVC 页面应用    |
| `@RestController` | 标记类为 REST 控制器（组合注解） | 返回值直接写入 **HTTP 响应体**（JSON/XML/字符串）       | REST API 服务 |

---

#### 4. 总结

* `@RestController = @Controller + @ResponseBody`
* 适合构建 RESTful API，返回数据而不是页面。
* 避免在每个方法上都写 `@ResponseBody`，更简洁。


### @RequestMapping

用于映射Web请求到具体的处理方法。

#### 基本用法
```java
@Controller
@RequestMapping("/home")
public class HomeController {
    
    @RequestMapping("/welcome")
    public String welcome() {
        return "welcome";
    }
}
```

#### 多种使用方式

1. **类级别映射**
```java
@Controller
@RequestMapping("/api/v1")
public class ApiController {
    // 所有方法都会有 /api/v1 前缀
}
```

2. **多URI映射**
```java
@RequestMapping(value={"/method1", "/method1/second"})
@ResponseBody
public String method1(){
    return "method1";
}
```

3. **HTTP方法限制**
```java
@RequestMapping(value="/users", method=RequestMethod.POST)
@ResponseBody
public String createUser(){
    return "User created";
}

@RequestMapping(value="/users", method={RequestMethod.POST, RequestMethod.GET})
@ResponseBody
public String handleUsers(){
    return "Handle users";
}
```

4. **请求头限制**
```java
@RequestMapping(value="/method", headers="name=john")
@ResponseBody
public String withHeaders(){
    return "Header matched";
}

@RequestMapping(value="/method", headers={"name=john", "id=1"})
@ResponseBody
public String withMultipleHeaders(){
    return "Multiple headers matched";
}
```

5. **Content-Type和Accept**
```java
@RequestMapping(
    value="/api/data", 
    produces={"application/json","application/xml"}, 
    consumes="text/html"
)
@ResponseBody
public String apiData(){
    return "API data";
}
```

解释

| SpringMVC 属性   | 对应 HTTP 头      | 作用                                     | 匹配不成功时的错误码                   | 示例                                                                                      |
| -------------- | -------------- | -------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------- |
| **`produces`** | `Accept`       | 限制 **响应内容类型**（返回值格式），告诉客户端接口能返回什么类型的数据 | `406 Not Acceptable`         | `produces={"application/json","application/xml"}`：表示接口能返回 JSON 或 XML，取决于客户端的 `Accept` 头 |
| **`consumes`** | `Content-Type` | 限制 **请求内容类型**（请求体格式），声明接口能接收什么格式的数据    | `415 Unsupported Media Type` | `consumes="application/json"`：表示接口只能接收 `Content-Type: application/json` 的请求体            |


📌 简单记忆：
- produces → 我能生产什么（返回什么格式给你）
- consumes → 我能吃什么（我能接受什么格式的请求）

6. **路径变量@PathVariable**
```java
@RequestMapping(value="/users/{id}")
@ResponseBody
public String getUser(@PathVariable("id") int id){
    return "User ID: " + id;
}

@RequestMapping(value="/users/{id:[\\d]+}/{name}")
@ResponseBody
public String getUserWithName(
    @PathVariable("id") long id,
    @PathVariable("name") String name
){
    return "User ID: " + id + ", Name: " + name;
}
```

7. **请求参数@RequestParam**
```java
@RequestMapping(value="/search")
@ResponseBody
public String search(@RequestParam("keyword") String keyword){
    return "Search keyword: " + keyword;
}
```

8. **参数匹配**
```java
@RequestMapping(params="method=register")
public String register(String username) {
    userService.add(username);
    return "success";
}
```

9. **默认方法和回退方法**
```java
// 默认方法
@RequestMapping()
@ResponseBody
public String defaultMethod(){
    return "default method";
}

// 回退方法
@RequestMapping("*")
@ResponseBody
public String fallbackMethod(){
    return "fallback method";
}
```

### @ResponseBody

将方法返回值直接输出到HTTP响应体中，通常用于返回JSON数据。

```java
@RequestMapping(value = "/api/users", method = RequestMethod.GET)
public @ResponseBody String getUsers(HttpServletRequest request) {
    JSONObject json = new JSONObject();
    try {
        // 业务逻辑
        List<User> users = userService.getAllUsers();
        json.put("result", 0);
        json.put("data", users);
    } catch (Exception e) {
        json.put("result", 1);
        json.put("msg", e.getMessage());
    }
    return json.toString();
}
```

**作用：**
- 将Controller方法返回的对象转换为指定格式（如JSON、XML）
- 写入到Response对象的body数据区
- 返回的数据不是HTML页面，而是其他格式数据时使用

### @MatrixVariable

`@MatrixVariable` 是 Spring MVC 提供的一个参数绑定注解，用来**获取 URL 路径中矩阵变量（Matrix Variables）的值**。

---

#### 🌐 什么是矩阵变量（Matrix Variables）？

矩阵变量是嵌入在 URL 路径中的参数，形式如下：

```
/cars;color=red;year=2012/owners;name=tom
```

这里：

* `cars` 路径段有两个矩阵变量：`color=red`，`year=2012`
* `owners` 路径段有一个矩阵变量：`name=tom`

它和查询参数（`?key=value`）不同，查询参数一般放在 **整个 URL 的末尾**，而矩阵变量则是 **绑定在某个路径段** 上。

---

#### 🔧 @MatrixVariable 的用法

```java
@RequestMapping("/cars/{path}")
@ResponseBody
public String getCar(
    @MatrixVariable(pathVar = "path", name = "color") String color,
    @MatrixVariable(pathVar = "path", name = "year") int year) {

    return "Car color: " + color + ", year: " + year;
}
```

如果访问：

```
/cars;color=red;year=2012
```

结果：

```
Car color: red, year: 2012
```

---

#### 📌 @MatrixVariable 注解参数

| 属性             | 说明               |
| -------------- | ---------------- |
| `name`         | 矩阵变量的名字（必须）      |
| `required`     | 是否必须（默认 true）    |
| `defaultValue` | 默认值（当变量不存在时使用）   |
| `pathVar`      | 指定该矩阵变量属于哪个路径变量段 |

---

#### ⚠️ 注意事项

1. **默认情况下 Spring MVC 禁用了矩阵变量**，需要在 `WebMvcConfigurer` 中开启：

   ```java
   @Override
   public void configurePathMatch(PathMatchConfigurer configurer) {
       UrlPathHelper urlPathHelper = new UrlPathHelper();
       urlPathHelper.setRemoveSemicolonContent(false); // 保留分号内容
       configurer.setUrlPathHelper(urlPathHelper);
   }
   ```
2. 矩阵变量不是特别常见，REST API 里更多使用 **查询参数**（`?key=value`）。



### @HttpEntity

HttpEntity 除了能获得 request 请求和 response 响应之外，它还能访问请求和响应头

#### 请求相关信息

1. **请求头（Request Headers）**：
```java
@PostMapping("/example")
public ResponseEntity<String> handleRequest(HttpEntity<String> httpEntity) {
    // 获取所有请求头
    HttpHeaders headers = httpEntity.getHeaders();
    
    // 获取特定请求头
    String contentType = headers.getFirst("Content-Type");
    String authorization = headers.getFirst("Authorization");
    
    // 获取请求体
    String body = httpEntity.getBody();
    
    return ResponseEntity.ok("处理完成");
}
```

2. **请求体内容**：
```java
// 处理 JSON 请求体
@PostMapping("/user")
public ResponseEntity<String> createUser(HttpEntity<User> httpEntity) {
    HttpHeaders headers = httpEntity.getHeaders();
    User user = httpEntity.getBody();
    
    // 可以同时访问头信息和请求体
    String clientInfo = headers.getFirst("User-Agent");
    
    return ResponseEntity.ok("用户创建成功");
}
```

#### 与 ResponseEntity 结合使用

当你返回 `ResponseEntity` 时，同样可以设置响应头：

```java
@PostMapping("/upload")
public ResponseEntity<String> uploadFile(HttpEntity<byte[]> httpEntity) {
    HttpHeaders requestHeaders = httpEntity.getHeaders();
    byte[] fileContent = httpEntity.getBody();
    
    // 处理文件上传逻辑...
    
    // 设置响应头
    HttpHeaders responseHeaders = new HttpHeaders();
    responseHeaders.add("X-Upload-Status", "Success");
    responseHeaders.add("X-File-Size", String.valueOf(fileContent.length));
    
    return new ResponseEntity<>("文件上传成功", responseHeaders, HttpStatus.OK);
}
```

#### 与其他注解的区别

- `@RequestBody`：只能获取请求体内容
- `@RequestHeader`：只能获取特定的请求头
- `HttpEntity`：可以同时获取请求头和请求体，提供了更完整的 HTTP 消息访问能力

## 全局异常处理注解

### @ControllerAdvice

#### 1. 作用

`@ControllerAdvice` 用于 **集中管理和增强 Spring MVC 控制器**，可以把多个控制器中通用的逻辑抽取出来，统一配置。
常见用途：

* 全局异常处理
* 全局数据绑定
* 全局数据预处理

👉 它的目标就是 **把控制器的全局逻辑放在一个地方统一管理**。

---

#### 2. 常见配合注解

| 注解                  | 作用                    | 使用位置 |
| ------------------- | --------------------- | ---- |
| `@ExceptionHandler` | 全局处理控制器中的异常           | 方法上  |
| `@InitBinder`       | 自定义请求参数绑定（例如格式化日期、数字） | 方法上  |
| `@ModelAttribute`   | 在请求处理之前，向模型中添加全局属性    | 方法上  |

---

#### 3. 使用示例

**（1）全局异常处理**

```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    @ResponseBody
    public String handleRuntimeException(RuntimeException e) {
        return "发生错误：" + e.getMessage();
    }
}
```

当任意 `@Controller` 抛出 `RuntimeException` 时，都会进入这个处理方法。

---

**（2）全局数据绑定**

```java
@ControllerAdvice
public class GlobalInitBinder {

    @InitBinder
    public void initBinder(WebDataBinder binder) {
        // 比如全局日期格式化
        binder.registerCustomEditor(Date.class, new CustomDateEditor(new SimpleDateFormat("yyyy-MM-dd"), true));
    }
}
```

---

**（3）全局模型属性**

```java
@ControllerAdvice
public class GlobalModelAttribute {

    @ModelAttribute("projectName")
    public String projectName() {
        return "Spring Boot Demo";
    }
}
```

所有 `@RequestMapping` 方法在返回时，都会额外带上 `projectName` 属性。


#### 4. 总结

| 注解                  | 用途             | 典型场景               |
| ------------------- | -------------- | ------------------ |
| `@ControllerAdvice` | 控制器增强，集中处理全局逻辑 | 全局异常、全局数据绑定、全局模型属性 |
| `@ExceptionHandler` | 统一异常处理         | 异常 JSON 输出/错误页面跳转  |
| `@InitBinder`       | 请求参数格式化        | 日期、数字转换            |
| `@ModelAttribute`   | 共享模型属性         | 统一给页面/接口附加数据       |



## 数据绑定注解

### @ModelAttribute
用于绑定请求参数到模型对象，或者在Controller中为模型添加属性。

#### 1. 注解在方法上
```java
@Controller
public class UserController {
    
    // 在每个请求方法执行前都会执行
    @ModelAttribute
    public void populateModel(@RequestParam String name, Model model) {
        model.addAttribute("userName", name);
    }
    
    @RequestMapping(value = "/user")
    public String showUser() {
        return "userView"; // model中已包含userName属性
    }
}
```

#### 2. 返回具体类型的方法
```java
@ModelAttribute
public User addUser(@RequestParam String id) {
    return userManager.findUser(id);
}
```

#### 3. 指定属性名
```java
@ModelAttribute("currentUser")
public User getCurrentUser(@RequestParam String userId) {
    return userService.findById(userId);
}
```

#### 4. 同时标注@RequestMapping
```java
@RequestMapping(value = "/api/data")
@ModelAttribute("responseData")
public String getData() {
    return "data"; // 返回值作为模型属性，视图名由RequestToViewNameTranslator确定
}
```

#### 5. 注解在方法参数上
```java
@Controller
public class UserController {
    
    @ModelAttribute("currentUser")
    public User addCurrentUser() {
        return new User("john", "123");
    }
    
    @RequestMapping(value = "/profile")
    public String showProfile(@ModelAttribute("currentUser") User user) {
        user.setName("John Doe"); // 修改模型中的用户
        return "profile";
    }
}
```

### @SessionAttributes
用于在多个请求之间共享模型属性。

```java
@Controller
@RequestMapping("/forum")
@SessionAttributes("currentUser") // 将模型中的currentUser属性存储到Session
public class ForumController {
    
    @RequestMapping(params = "method=login")
    public String login(@RequestParam String username, ModelMap model) {
        User user = userService.login(username);
        model.addAttribute("currentUser", user); // 会自动存储到Session
        return "dashboard";
    }
    
    @RequestMapping(params = "method=profile")
    public String profile(@ModelAttribute("currentUser") User user) {
        // 从Session中获取用户信息
        return "profile";
    }
}
```

**多属性和类型指定：**
```java
// 多个属性名
@SessionAttributes({"user", "dept"})

// 按类型指定
@SessionAttributes(types = User.class)

// 多个类型
@SessionAttributes(types = {User.class, Department.class})

// 组合使用
@SessionAttributes(types = {User.class}, value = {"sessionData"})
```

## 依赖注入注解

### @Autowired
Spring提供的注解，按类型（byType）进行依赖注入。

```java
@Controller
public class UserController {
    
    @Autowired
    private UserService userService; // 字段注入
    
    @Autowired
    public void setUserService(UserService userService) { // setter注入
        this.userService = userService;
    }
}
```

**与@Qualifier配合使用：**
```java
@Autowired
@Qualifier("userServiceImpl")
private UserService userService;
```

**可选依赖：**
```java
@Autowired(required = false)
private OptionalService optionalService;
```

### @Resource
J2EE提供的注解，默认按名称（byName）进行依赖注入。

```java
@Resource(name="userService")
private UserService userService; // 字段注入

@Resource(name="userService")
public void setUserService(UserService userService) { // setter注入
    this.userService = userService;
}
```

**装配顺序：**
1. 如果同时指定name和type，从Spring上下文中找到唯一匹配的bean
2. 如果指定name，按名称查找匹配的bean
3. 如果指定type，按类型查找唯一的bean
4. 如果都没指定，按byName方式装配，失败则按类型装配

#### @Resource 与 @Autowired 注解对比

**基本信息对比**

| 特性 | @Autowired | @Resource |
|------|------------|-----------|
| **来源** | Spring框架 | Java标准（JSR-250） |
| **包路径** | `org.springframework.beans.factory.annotation.Autowired` | `javax.annotation.Resource` |
| **默认装配方式** | byType（按类型） | byName（按名称） |

**属性配置对比**

| 属性 | @Autowired | @Resource |
|------|------------|-----------|
| **required属性** | ✅ 支持（默认true） | ❌ 不支持 |
| **name属性** | ❌ 不支持（需配合@Qualifier） | ✅ 支持 |
| **type属性** | ❌ 不支持 | ✅ 支持 |

**使用方式对比**

| 使用场景 | @Autowired | @Resource |
|----------|------------|-----------|
| **按类型注入** | `@Autowired` | `@Resource(type=UserDao.class)` |
| **按名称注入** | `@Autowired @Qualifier("userDao")` | `@Resource(name="userDao")` |
| **允许null值** | `@Autowired(required=false)` | 不支持（需手动处理） |

**@Resource 装配策略（优先级从高到低）**

| 优先级 | 配置方式 | 装配策略 | 说明 |
|--------|----------|----------|------|
| **1** | `@Resource(name="xxx", type=Xxx.class)` | name + type 精确匹配 | 必须同时匹配名称和类型 |
| **2** | `@Resource(name="xxx")` | byName 按名称匹配 | 根据指定名称查找bean |
| **3** | `@Resource(type=Xxx.class)` | byType 按类型匹配 | 根据指定类型查找唯一bean |
| **4** | `@Resource` | byName 然后 byType | 先按字段/方法名查找，失败后按类型查找 |

**代码示例对比**

- @Autowired 使用示例

```java
// 按类型注入
@Autowired
private UserDao userDao;

// 按名称注入（配合@Qualifier）
@Autowired 
@Qualifier("userDao")
private UserDao userDao;

// 允许null值
@Autowired(required = false)
private UserDao userDao;
```

- @Resource 使用示例

```java
// 按名称注入
@Resource(name = "userDao")
private UserDao userDao;

// 按类型注入
@Resource(type = UserDao.class)
private UserDao userDao;

// 默认装配（先byName后byType）
@Resource
private UserDao userDao;

// 精确匹配
@Resource(name = "userDao", type = UserDao.class)
private UserDao userDao;
```

#### 共同点

- ✅ 都可以用在字段上和setter方法上
- ✅ 用在字段上时都不需要提供setter方法
- ✅ Spring容器都支持这两种注解
- ✅ 都可以实现依赖注入功能

#### 选择建议

| 场景 | 推荐使用 | 理由 |
|------|----------|------|
| **Spring项目** | @Autowired | Spring原生注解，功能更丰富 |
| **Java EE项目** | @Resource | 标准注解，更好的可移植性 |
| **需要null值处理** | @Autowired | 支持required属性 |
| **需要精确控制装配** | @Resource | 支持name和type双重限定 |


### @Required

检查属性是否已经设置（只能用于setter方法）。

```java
public class ProductService {
    private Product product;
    
    @Required
    public void setProduct(Product product) {
        this.product = product;
    }
}
```

启动时，Spring 容器会通过 `RequiredAnnotationBeanPostProcessor` 检查 `Bean` 的所有 @Required 属性。

如果发现某个 `@Required` 标注的属性 没有被注入值，容器启动时会 抛异常，直接失败，错误如下：

```java
org.springframework.beans.factory.BeanInitializationException: 
Property 'product' is required for bean 'productService'
```

::: tip

在 Spring 5 以后，官方更推荐用 @Autowired(required = true) 或者 构造器注入 来替代 @Required。

因为 `@Required` 依赖于 RequiredAnnotationBeanPostProcessor，而现在已经不常用了。
:::



**配置文件中需要添加：**
```xml
<!-- Spring 2.5之前 -->
<bean class="org.springframework.beans.factory.annotation.RequiredAnnotationBeanPostProcessor"/>

<!-- Spring 2.5+ -->
<context:annotation-config/>
```

## 属性验证注解

### @Valid
JSR303验证注解，用于触发Bean验证。

#### 实体类定义
```java
import org.hibernate.validator.constraints.NotEmpty;
import org.hibernate.validator.constraints.Range;

public class User implements Serializable {
    
    @Range(min = 1, max = 5, message = "用户名长度必须在1和5之间")
    private String userName;
    
    @NotEmpty(message = "密码不能为空")
    private String password;
    
    // getter和setter方法
}
```

#### Controller中使用
```java
@Controller
@RequestMapping("/user")
public class UserController {
    
    @RequestMapping(value = "/register", method = RequestMethod.POST)
    public String register(@Valid User user, BindingResult result) {
        if (result.hasErrors()) {
            // 处理验证错误
            return "registerForm";
        } else {
            userService.register(user);
            return "success";
        }
    }
    
    @RequestMapping(method = RequestMethod.GET)
    public String showForm(ModelMap model) {
        model.addAttribute("user", new User());
        return "registerForm";
    }
}
```

**重要注意事项：**
- @Valid必须标注在需要验证的参数上
- 处理器方法必须包含Errors参数（如BindingResult）
- Errors参数必须紧跟在@Valid参数后面
- 多个@Valid参数需要对应多个Errors参数

#### 配置文件
```xml
<!-- 启用JSR303支持 -->
<mvc:annotation-driven />
```

## 事务注解

### @Transactional
声明式事务管理注解。

#### 基本使用
```java
@Transactional
public class UserService {
    
    // 类中所有方法都开启事务
    
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public List<User> getAllUsers() {
        // 这个方法不需要事务
        return userDao.findAll();
    }
}
```

#### 事务传播行为
```java
// 默认：如果有事务就加入，没有就新建
@Transactional(propagation = Propagation.REQUIRED)

// 容器不为这个方法开启事务
@Transactional(propagation = Propagation.NOT_SUPPORTED)

// 不管是否存在事务，都创建新事务
@Transactional(propagation = Propagation.REQUIRES_NEW)

// 必须在已有事务中执行，否则抛异常
@Transactional(propagation = Propagation.MANDATORY)

// 必须在没有事务中执行，否则抛异常
@Transactional(propagation = Propagation.NEVER)

// 如果其他bean有事务就用事务，没有就不用
@Transactional(propagation = Propagation.SUPPORTS)
```

#### 事务隔离级别
```java
// 读取未提交数据（会出现脏读、不可重复读）
@Transactional(isolation = Isolation.READ_UNCOMMITTED)

// 读取已提交数据（会出现不可重复读和幻读）
@Transactional(isolation = Isolation.READ_COMMITTED)

// 可重复读（会出现幻读）
@Transactional(isolation = Isolation.REPEATABLE_READ)

// 串行化
@Transactional(isolation = Isolation.SERIALIZABLE)
```

#### 其他重要参数
```java
@Transactional(
    // 只读事务
    readOnly = true,
    
    // 事务超时时间（秒）
    timeout = 30,
    
    // 指定回滚的异常类
    rollbackFor = {RuntimeException.class, Exception.class},
    
    // 指定回滚的异常类名
    rollbackForClassName = {"RuntimeException", "Exception"},
    
    // 指定不回滚的异常类
    noRollbackFor = RuntimeException.class,
    
    // 指定不回滚的异常类名
    noRollbackForClassName = "RuntimeException"
)
public void complexTransactionMethod() {
    // 业务逻辑
}
```

#### 重要注意事项
1. @Transactional只能应用到public方法上
2. 默认只有RuntimeException会回滚事务
3. 如果要让所有异常都回滚：`@Transactional(rollbackFor = Exception.class)`
4. 推荐在具体的类上使用，而不是接口上
5. Spring团队建议在实现类上使用@Transactional注解

## 配置属性注解

### @PropertySource
用于加载properties配置文件。

#### 基本使用
```java
@Configuration
@ComponentScan(basePackages = "com.example")
@PropertySource(value = "classpath:application.properties")
public class AppConfig {
    
    @Bean
    public PropertySourcesPlaceholderConfigurer propertyConfigurer() {
        return new PropertySourcesPlaceholderConfigurer();
    }
}
```

#### 多配置文件
```java
// 方式一：数组形式
@PropertySource(value = {
    "classpath:database.properties",
    "classpath:redis.properties"
})

// 方式二：使用@PropertySources（Spring 4+）
@PropertySources({
    @PropertySource("classpath:database.properties"),
    @PropertySource("classpath:redis.properties")
})
```

#### 忽略不存在的文件（Spring 4+）
```java
@PropertySource(
    value = "classpath:optional.properties", 
    ignoreResourceNotFound = true
)
```

### @Value
用于注入配置文件中的值。

#### 配置文件示例
```properties
# application.properties
server.name=localhost,backup-server
server.ports=8080,8081,9090
server.host=127.0.0.1
database.driver=com.mysql.cj.jdbc.Driver
```

#### 基本值注入
```java
@Component
public class ServerConfig {
    
    // 注入字符串值
    @Value("${database.driver}")
    private String databaseDriver;
    
    // 注入默认值（如果key不存在）
    @Value("${server.timeout:30}")
    private int timeout;
    
    // 注入并转换为List
    @Value("#{'${server.name}'.split(',')}")
    private List<String> serverNames;
    
    // 注入并转换为Integer List
    @Value("#{'${server.ports}'.split(',')}")
    private List<Integer> serverPorts;
    
    @Autowired
    private Environment environment;
    
    public void printConfig() {
        System.out.println("Database Driver: " + databaseDriver);
        System.out.println("Timeout: " + timeout);
        System.out.println("Server Names: " + serverNames);
        System.out.println("Server Ports: " + serverPorts);
        
        // 通过Environment获取
        String host = environment.getProperty("server.host");
        System.out.println("Server Host: " + host);
    }
}
```

#### 高级用法
```java
@Component
public class AdvancedConfig {
    
    // SpEL表达式
    @Value("#{systemProperties['java.home']}")
    private String javaHome;
    
    // 调用其他Bean的方法
    @Value("#{configService.getMaxConnections()}")
    private int maxConnections;
    
    // 条件表达式
    @Value("#{${server.ssl.enabled:false} ? 'https' : 'http'}")
    private String protocol;
    
    // 集合操作
    @Value("#{'${allowed.origins}'.split(',')}")
    private Set<String> allowedOrigins;
}
```

### @ConfigurationProperties

类型安全的配置属性绑定。

#### 配置文件
```properties
# application.yml
app:
  name: MyApplication
  version: 1.0.0
  database:
    url: jdbc:mysql://localhost:3306/mydb
    username: root
    password: password
    pool:
      max-size: 20
      min-size: 5
```

#### 配置类
```java
@ConfigurationProperties(prefix = "app")
@Component
public class AppProperties {
    
    private String name;
    private String version;
    private Database database = new Database();
    
    // getter和setter方法
    
    public static class Database {
        private String url;
        private String username;
        private String password;
        private Pool pool = new Pool();
        
        // getter和setter方法
        
        public static class Pool {
            private int maxSize;
            private int minSize;
            
            // getter和setter方法
        }
    }
}
```

## 测试注解

### @ContextConfiguration

`@ContextConfiguration` 是 Spring **单元测试**里常用的注解，主要作用是：

---

#### 1. **基本作用**

* 用来指定 **Spring IoC 容器的配置文件** 或 **配置类**，从而在测试时加载 Spring 上下文。
* 这样就能在测试中使用 Spring 管理的 Bean（通过 `@Autowired`、`@Resource` 等注入）。

---

#### 2. **常见用法**

**2.1 指定 XML 配置文件**

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:spring/applicationContext.xml"})
public class UserServiceTest {
    @Autowired
    private UserService userService;

    @Test
    public void testAddUser() {
        userService.addUser();
    }
}
```

👉 这里会加载 `applicationContext.xml`，初始化 Spring 容器。

---

**2.2 指定 Java 配置类**

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = AppConfig.class)
public class UserServiceTest {
    @Autowired
    private UserService userService;
}
```

👉 这里会加载 `AppConfig` 里的 `@Bean`、`@Configuration` 等配置。

---

**2.3 结合 Spring Boot**

在 Spring Boot 中，一般直接用 `@SpringBootTest`，内部实际上也会用到 `@ContextConfiguration`。

---

#### 3. **主要属性**

| 属性                 | 说明                                                                 |
| ------------------ | ------------------------------------------------------------------ |
| `locations`        | 指定 XML 配置文件路径                                                      |
| `classes`          | 指定配置类（`@Configuration`）                                            |
| `initializers`     | 指定 `ApplicationContextInitializer`，可在加载前修改环境或属性                    |
| `loader`           | 指定上下文加载器，默认是 `SpringBootContextLoader` 或 `GenericXmlContextLoader` |
| `inheritLocations` | 是否继承父类测试的配置                                                        |

---

#### ✅ @SpringBootTest vs @ContextConfiguration

`@ContextConfiguration` 注解的作用就是 **告诉 Spring 测试框架该如何加载应用上下文**（基于 XML 或 Java 配置），从而让测试用例能够使用 Spring 管理的 Bean。


| 特性                  | `@ContextConfiguration`                   | `@SpringBootTest`                                                   |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| **适用场景**            | 传统 Spring 项目测试（基于 XML 或 Java 配置类）         | Spring Boot 项目测试                                                    |
| **容器加载方式**          | 需要手动指定配置文件或配置类（`locations` / `classes`）   | 自动加载整个 Spring Boot 应用上下文                                            |
| **默认配置**            | 无默认值，必须指定配置来源                             | 自动扫描 `@SpringBootApplication` 或主配置类                                 |
| **测试粒度**            | 适合单元测试，加载部分上下文                            | 适合集成测试，加载完整应用上下文                                                    |
| **属性注入**            | 可以用 `@Autowired` 注入 Bean                  | 同样支持 `@Autowired`，还能加载 `application.properties` / `application.yml` |
| **扩展能力**            | 可指定 `initializers`、`loader` 等灵活定制         | 提供 `webEnvironment`（可起 Web 容器）、`properties`（临时配置）等更强能力              |
| **依赖 JUnit Runner** | `@RunWith(SpringJUnit4ClassRunner.class)` | `@RunWith(SpringRunner.class)`（Spring Boot 内置推荐）                    |


---

## aop注解

[aop注解](./spring-aop.md)

## 计划任务

### @EnableScheduling

`@EnableScheduling` 是 **Spring 框架** 提供的一个注解，用来 **开启定时任务功能**。
它通常配合 `@Scheduled` 注解一起使用。

---

#### 1. 作用

* 告诉 **Spring 容器** 开启 **任务调度（Scheduling）** 的支持。
* 它会启用一个 `ScheduledAnnotationBeanPostProcessor`，这个后置处理器会扫描 Spring 容器中所有标注了 `@Scheduled` 的方法，并根据你配置的调度规则来定时执行。

如果没有加 `@EnableScheduling`，即使你在方法上写了 `@Scheduled(cron = "...")`，Spring 也不会去调度执行。

---

#### 2. 使用方式

通常写在 **配置类** 上，比如：

```java
@Configuration
@EnableScheduling
public class ScheduleConfig {
}
```

然后你就可以在任意 `@Component`、`@Service` 的方法上加 `@Scheduled` 来定义定时任务：

```java
@Component
public class MyTask {

    // 每5秒执行一次
    @Scheduled(fixedRate = 5000)
    public void task1() {
        System.out.println("定时任务执行: " + LocalDateTime.now());
    }

    // 每天凌晨1点执行
    @Scheduled(cron = "0 0 1 * * ?")
    public void task2() {
        System.out.println("每天1点执行任务: " + LocalDateTime.now());
    }
}
```

---

#### 3. 常见的 `@Scheduled` 参数

* **fixedRate**：以上一次开始时间为基准，间隔固定时间执行（单位：毫秒）。
* **fixedDelay**：以上一次任务执行结束时间为基准，间隔固定时间执行。
* **cron**：使用 **cron 表达式** 来配置执行时间，支持秒级别调度。

---

#### 4. 注意点

1. **必须加 `@EnableScheduling`** 才能让 `@Scheduled` 生效。
2. 定时任务的方法：

   * 不能有参数。
   * 通常返回 `void`。
3. 默认任务是 **单线程执行**，如果有多个任务，可能会出现阻塞。
   如果要并行执行，可以配置 **TaskScheduler**（比如用线程池）。

---

👉 总结一句话：
**`@EnableScheduling` 就是开启 Spring 定时任务的总开关，配合 `@Scheduled` 使用。**


## 参考

- https://my.oschina.net/cs520/blog/842293

## 总结

Spring注解大大简化了配置和开发工作，提高了开发效率。合理使用这些注解可以让我们的代码更加简洁、可维护。在实际开发中，应该根据具体的业务场景选择合适的注解，并遵循Spring的最佳实践。