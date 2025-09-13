---
title: Lombok指南
category:
  - Lombok
---

# Lombok完整指南

## 目录

[[toc]]

## 什么是Lombok

Lombok是一个Java库，通过注解的方式帮助开发者自动生成常见的样板代码（boilerplate code），如getter、setter、toString、equals、hashCode等方法。它能显著减少代码量，提高开发效率，让开发者专注于业务逻辑而非重复的代码编写。

### 传统Java类的问题

在传统的Java开发中，一个简单的POJO类通常需要编写大量重复代码：

```java
public class User {
    private String name;
    private int age;
    private boolean active;
    
    // 需要手动编写所有getter方法
    public String getName() {
        return name;
    }
    
    public int getAge() {
        return age;
    }
    
    public boolean isActive() {
        return active;
    }
    
    // 需要手动编写所有setter方法
    public void setName(String name) {
        this.name = name;
    }
    
    public void setAge(int age) {
        this.age = age;
    }
    
    public void setActive(boolean active) {
        this.active = active;
    }
    
    // 还需要重写equals、hashCode、toString等方法
    @Override
    public boolean equals(Object o) {
        // 大量样板代码...
    }
    
    @Override
    public int hashCode() {
        // 大量样板代码...
    }
    
    @Override
    public String toString() {
        // 大量样板代码...
    }
}
```

### 使用Lombok后的简洁版本

```java
@Data
public class User {
    private String name;
    private int age;
    private boolean active;
}
```

仅仅使用一个`@Data`注解，Lombok就能自动生成所有必要的方法！

## Lombok的工作原理

Lombok基于Java的注解处理机制（Annotation Processing Tool, APT）工作：

1. **编译期处理**：Lombok的注解都是`@Retention(RetentionPolicy.SOURCE)`级别的，在编译期有效
2. **AST修改**：在编译的注解处理阶段，Lombok会解析注解并修改抽象语法树（AST）
3. **代码生成**：自动生成相应的方法代码
4. **最终编译**：将修改后的代码编译成字节码

编译过程包含三个主要阶段：
- 分析和输入到符号表
- **注解处理**（Lombok在此阶段工作）
- 语义分析和生成class文件

## 安装和配置

### Maven依赖

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.28</version>
    <scope>provided</scope>
</dependency>
```

### IDE插件安装

不同IDE需要安装相应插件以获得完整支持：

- **IntelliJ IDEA**：安装Lombok Plugin
- **Eclipse**：下载lombok.jar并运行安装程序
- **VS Code**：安装Java Extension Pack

## 常用注解详解

### @Getter / @Setter

自动生成getter和setter方法。

```java
@Getter
@Setter
public class Person {
    private String name;
    private int age;
    
    // 可以为单个字段指定访问级别
    @Setter(AccessLevel.PROTECTED)
    private String password;
}
```

生成的方法：
```java
public String getName() { return name; }
public void setName(String name) { this.name = name; }
public int getAge() { return age; }
public void setAge(int age) { this.age = age; }
protected void setPassword(String password) { this.password = password; }
```

### @ToString

自动生成toString方法。

```java
@ToString
public class Product {
    private String name;
    private double price;
    private String category;
}

// 排除某些字段
@ToString(exclude = {"password"})
public class User {
    private String username;
    private String password;
    private String email;
}

// 包含父类toString
@ToString(callSuper = true)
public class Student extends Person {
    private String studentId;
}
```

### @Slf4j

当你在一个类上使用 @Slf4j 注解时，Lombok 会为该类自动生成一个 Logger 对象，命名为 log，你可以直接使用它来记录日志。

```java
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MyService {

    public void someMethod() {
        // 直接使用 log 对象记录日志
        log.info("This is an info level log.");
        log.error("This is an error level log.");
        log.debug("This is a debug level log.");
    }
}
```
Lombok 在编译时会自动生成如下代码：

```java
private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MyService.class);

```

### @EqualsAndHashCode、@RequiredArgsConstructor

@EqualsAndHashCode：自动生成equals和hashCode方法。

```java
@EqualsAndHashCode
public class Book {
    private String isbn;
    private String title;
    private String author;
}

// 只使用特定字段
@EqualsAndHashCode(of = {"isbn"})
public class Book {
    private String isbn;
    private String title;
    private String author;
}

// 排除某些字段
@EqualsAndHashCode(exclude = {"lastModified"})
public class Document {
    private String id;
    private String content;
    private Date lastModified;
}
```

### 构造器注解

```java
// 无参构造器
@NoArgsConstructor
public class Empty {
    private String field;
}

// 全参构造器
@AllArgsConstructor
public class Full {
    private String name;
    private int age;
}

// 必需参数构造器（final字段和@NonNull字段）
@RequiredArgsConstructor
public class Required {
    private final String name;
    @NonNull
    private String email;
    private String phone; // 可选字段，不包含在构造器中
}
```

:::tip
说明：
1. 必须使用 final 修饰：
只有被 final 修饰的成员变量（或使用 @NonNull 标注的字段）才会被包含到构造函数中。
2. 自动注入依赖：
@RequiredArgsConstructor 会自动为这些 final 字段生成一个带参构造方法，Spring 会通过构造方法完成依赖注入。
3. 减少样板代码：
不再需要逐个写 @Autowired 注解，代码更简洁、整洁。
:::

### @Data

@Data是最常用的注解，相当于以下注解的组合：
- @Getter
- @Setter
- @ToString
- @EqualsAndHashCode
- @RequiredArgsConstructor

```java
@Data
public class Employee {
    private final String id;
    @NonNull
    private String name;
    private String department;
    private double salary;
}
```

### @Builder

生成建造者模式代码。

```java
@Builder
public class Car {
    private String brand;
    private String model;
    private int year;
    private String color;
}

// 使用方式
Car car = Car.builder()
    .brand("Toyota")
    .model("Camry")
    .year(2023)
    .color("Blue")
    .build();
```

#### @Builder设置默认值

为@Builder生成的字段设置默认值有多种方式：

##### 方式1：使用@Builder.Default注解

```java
@Builder
@Data
public class ServerConfig {
    private String host;
    
    @Builder.Default
    private int port = 8080; // 默认端口
    
    @Builder.Default
    private String protocol = "HTTP"; // 默认协议
    
    @Builder.Default
    private boolean ssl = false; // 默认不启用SSL
    
    @Builder.Default
    private int maxConnections = 100; // 默认最大连接数
    
    @Builder.Default
    private List<String> allowedIps = new ArrayList<>(); // 默认空列表
    
    @Builder.Default
    private Map<String, String> headers = new HashMap<>(); // 默认空Map
}

// 使用示例
ServerConfig config1 = ServerConfig.builder()
    .host("localhost")
    .build(); // port=8080, protocol="HTTP", ssl=false等使用默认值

ServerConfig config2 = ServerConfig.builder()
    .host("example.com")
    .port(443)        // 覆盖默认值
    .ssl(true)        // 覆盖默认值
    .build();
```

##### 方式2：复杂对象的默认值

```java
@Builder
@Data
public class DatabaseConfig {
    private String url;
    private String username;
    private String password;
    
    @Builder.Default
    private ConnectionPool pool = ConnectionPool.builder()
        .minSize(5)
        .maxSize(20)
        .timeout(30)
        .build();
    
    @Builder.Default
    private Properties properties = createDefaultProperties();
    
    // 静态方法创建复杂默认值
    private static Properties createDefaultProperties() {
        Properties props = new Properties();
        props.setProperty("autoReconnect", "true");
        props.setProperty("characterEncoding", "UTF-8");
        props.setProperty("useSSL", "false");
        return props;
    }
}
```

##### 方式3：使用方法初始化默认值

```java
@Builder
@Data
public class UserProfile {
    private String username;
    private String email;
    
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now(); // 当前时间作为默认值
    
    @Builder.Default
    private String userId = UUID.randomUUID().toString(); // 随机UUID作为默认值
    
    @Builder.Default
    private UserSettings settings = UserSettings.createDefault(); // 调用静态方法
    
    @Builder.Default
    private List<String> roles = Arrays.asList("USER"); // 默认角色
}

// UserSettings类
@Builder
@Data
public class UserSettings {
    @Builder.Default
    private String theme = "light";
    
    @Builder.Default
    private String language = "en";
    
    @Builder.Default
    private boolean notifications = true;
    
    public static UserSettings createDefault() {
        return UserSettings.builder().build();
    }
}
```

##### 方式4：结合@Value使用（不可变对象）

```java
@Value
@Builder
public class ApiResponse {
    String message;
    Object data;
    
    @Builder.Default
    int status = 200; // 默认成功状态码
    
    @Builder.Default
    LocalDateTime timestamp = LocalDateTime.now(); // 默认当前时间
    
    @Builder.Default
    boolean success = true; // 默认成功
    
    @Builder.Default
    Map<String, Object> metadata = Collections.emptyMap(); // 默认空Map
}

// 使用示例
ApiResponse response = ApiResponse.builder()
    .message("Operation completed")
    .data(someDataObject)
    .build(); // 其他字段使用默认值
```

##### 方式5：条件默认值

```java
@Builder
@Data
public class EmailConfig {
    private String smtpHost;
    private String username;
    private String password;
    
    @Builder.Default
    private int port = 587; // 默认SMTP端口
    
    @Builder.Default
    private boolean tls = true; // 默认启用TLS
    
    @Builder.Default
    private int timeout = 30000; // 默认30秒超时
    
    // 基于环境的默认值
    @Builder.Default
    private String fromAddress = getDefaultFromAddress();
    
    private static String getDefaultFromAddress() {
        String env = System.getProperty("env", "dev");
        return "no-reply@" + ("prod".equals(env) ? "company.com" : "dev.company.com");
    }
}
```

##### 注意事项和最佳实践

1. **集合类型的默认值**：
```java
@Builder
@Data
public class CollectionExample {
    // ❌ 错误：不使用@Builder.Default，集合将为null
    private List<String> tags;
    
    // ✅ 正确：使用@Builder.Default提供默认空集合
    @Builder.Default
    private List<String> categories = new ArrayList<>();
    
    // ✅ 推荐：使用不可变集合作为默认值
    @Builder.Default
    private List<String> permissions = Collections.emptyList();
    
    // ✅ 对于可变集合，提供复制构造
    @Builder.Default
    private Set<String> features = new HashSet<>();
}
```

2. **避免共享可变对象**：
```java
@Builder
@Data
public class BadExample {
    // ❌ 危险：所有实例将共享同一个List对象
    @Builder.Default
    private static final List<String> SHARED_LIST = new ArrayList<>();
    private List<String> items = SHARED_LIST;
}

@Builder
@Data
public class GoodExample {
    // ✅ 正确：每个实例都有自己的List
    @Builder.Default
    private List<String> items = new ArrayList<>();
}
```

3. **与toBuilder()结合使用**：
```java
@Builder(toBuilder = true)
@Data
public class ConfigWithDefaults {
    private String name;
    
    @Builder.Default
    private boolean enabled = true;
    
    @Builder.Default
    private int retryCount = 3;
}

// 使用toBuilder()时默认值会被保留
ConfigWithDefaults original = ConfigWithDefaults.builder()
    .name("test")
    .build(); // enabled=true, retryCount=3

ConfigWithDefaults modified = original.toBuilder()
    .retryCount(5) // 只修改retryCount
    .build(); // name="test", enabled=true, retryCount=5
```

### @SuperBuilder

@SuperBuilder是@Builder的增强版本，专门用于处理继承场景。@Builder在继承结构中存在局限性，而@SuperBuilder完美解决了这个问题。

#### @Builder的继承问题

```java
@Builder
public class Vehicle {
    private String brand;
    private int year;
}

@Builder
public class Car extends Vehicle {
    private String model;
    private int doors;
}

// 问题：无法同时设置父类和子类属性
Car car = Car.builder()
    .model("Camry")      // ✓ 可以设置子类属性
    .doors(4)            // ✓ 可以设置子类属性
    .brand("Toyota")     // ✗ 编译错误！无法设置父类属性
    .year(2023)          // ✗ 编译错误！无法设置父类属性
    .build();
```

#### @SuperBuilder的解决方案

```java
@SuperBuilder
@Data
public class Vehicle {
    private String brand;
    private int year;
    private String color;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Car extends Vehicle {
    private String model;
    private int doors;
    private boolean isElectric;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Motorcycle extends Vehicle {
    private String type;
    private int engineSize;
}

// 使用方式：可以流畅地设置父类和子类属性
Car car = Car.builder()
    .brand("Toyota")        // 父类属性
    .year(2023)            // 父类属性
    .color("Blue")         // 父类属性
    .model("Camry")        // 子类属性
    .doors(4)              // 子类属性
    .isElectric(false)     // 子类属性
    .build();

Motorcycle motorcycle = Motorcycle.builder()
    .brand("Honda")         // 父类属性
    .year(2023)            // 父类属性
    .color("Red")          // 父类属性
    .type("Sport")         // 子类属性
    .engineSize(600)       // 子类属性
    .build();
```

#### 多层继承示例

```java
@SuperBuilder
@Data
public abstract class Animal {
    private String name;
    private int age;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public abstract class Mammal extends Animal {
    private boolean hasHair;
    private int gestationPeriod;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Dog extends Mammal {
    private String breed;
    private boolean isTrained;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Cat extends Mammal {
    private boolean isIndoor;
    private int livesRemaining;
}

// 创建对象时可以设置所有层级的属性
Dog dog = Dog.builder()
    .name("Buddy")              // Animal属性
    .age(3)                     // Animal属性
    .hasHair(true)              // Mammal属性
    .gestationPeriod(63)        // Mammal属性
    .breed("Golden Retriever")  // Dog属性
    .isTrained(true)            // Dog属性
    .build();
```

#### @Builder vs @SuperBuilder 对比表

| 特性 | @Builder | @SuperBuilder |
|------|----------|---------------|
| **基本建造者模式** | ✓ | ✓ |
| **单一类使用** | ✓ | ✓ |
| **继承支持** | ✗ 仅支持当前类属性 | ✓ 支持完整继承链 |
| **多层继承** | ✗ 不支持 | ✓ 完全支持 |
| **抽象类支持** | ✗ 限制使用 | ✓ 完全支持 |
| **性能开销** | 较小 | 略大（生成更多代码） |
| **代码复杂度** | 简单 | 稍复杂 |
| **Lombok版本要求** | 早期版本即支持 | 1.18.2+ |

#### 何时使用哪个注解

**使用@Builder的场景：**
```java
// 1. 简单的单一类，无继承关系
@Builder
@Data
public class User {
    private String name;
    private String email;
    private int age;
}

// 2. 配置类
@Builder
@Data
public class DatabaseConfig {
    private String host;
    private int port;
    private String database;
    private String username;
    private String password;
}
```

**使用@SuperBuilder的场景：**
```java
// 1. 有继承关系的类体系
@SuperBuilder
@Data
public abstract class Shape {
    private String color;
    private double x, y;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Circle extends Shape {
    private double radius;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Rectangle extends Shape {
    private double width;
    private double height;
}

// 2. 抽象基类
@SuperBuilder
@Data
public abstract class BaseEntity {
    private Long id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
}

@SuperBuilder
@Data
@EqualsAndHashCode(callSuper = true)
public class Product extends BaseEntity {
    private String name;
    private BigDecimal price;
    private String category;
}
```

#### 注意事项和最佳实践

1. **toBuilder支持**：
```java
@SuperBuilder(toBuilder = true)
@Data
public class Vehicle {
    private String brand;
    private int year;
}

@SuperBuilder(toBuilder = true)
@Data
@EqualsAndHashCode(callSuper = true)
public class Car extends Vehicle {
    private String model;
    private int doors;
}

// 可以基于现有对象创建新的建造者
Car originalCar = Car.builder().brand("Toyota").model("Camry").build();
Car modifiedCar = originalCar.toBuilder().doors(2).build();
```

2. **与其他注解结合使用**：
```java
@SuperBuilder
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class Employee extends Person {
    private String employeeId;
    private String department;
    private BigDecimal salary;
}
```

3. **构造器访问级别控制**：
```java
@SuperBuilder(access = AccessLevel.PACKAGE)
@Data
public class InternalClass {
    private String internalData;
}
```

### @Value

创建不可变类（immutable class）。

```java
@Value
public class Point {
    int x;
    int y;
}

// 等价于：
public final class Point {
    private final int x;
    private final int y;
    
    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
    
    public int getX() { return x; }
    public int getY() { return y; }
    
    // equals, hashCode, toString方法
}
```

### 日志注解

```java
// Slf4j日志
@Slf4j
public class LogExample {
    public void doSomething() {
        log.info("Doing something...");
        log.error("Error occurred", new Exception());
    }
}

// 其他日志框架
@Log4j2
@CommonsLog
@Log
public class OtherLogExamples {
    // 自动生成对应的log字段
}
```

### @SneakyThrows

简化异常处理。

```java
@SneakyThrows
public String readFile(String filename) {
    return Files.readString(Paths.get(filename));
    // 无需显式处理IOException
}
```

### @Synchronized

提供同步方法的替代方案。

```java
public class Counter {
    private int count = 0;
    
    @Synchronized
    public void increment() {
        count++;
    }
    
    @Synchronized("lockObject")
    public void decrement() {
        count--;
    }
    
    private final Object lockObject = new Object();
}
```

## 常见问题和解决方案

### 1. Maven版本为空错误

**错误信息**：`For artifact {org.projectlombok:lombok:null:jar}: The version cannot be empty`

**解决方案**：

```xml
<!-- 方案1：在dependencies中指定版本 -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.28</version>
    <optional>true</optional>
</dependency>

<!-- 方案2：在annotationProcessorPaths中指定版本 -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.maven.plugins</groupId>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <annotationProcessorPaths>
                    <path>
                        <groupId>org.projectlombok</groupId>
                        <artifactId>lombok</artifactId>
                        <version>1.18.28</version>
                    </path>
                </annotationProcessorPaths>
            </configuration>
        </plugin>
    </plugins>
</build>
```

### 2. Boolean字段的Getter/Setter陷阱

**问题描述**：Boolean字段的getter/setter生成规则可能导致序列化问题。

```java
public class Member {
    private boolean isLeader; // 字段名以"is"开头
}
```

**Lombok生成**：
- Getter: `isLeader()` （而不是`getIsLeader()`）
- Setter: `setLeader()` （而不是`setIsLeader()`）

**解决方案**：
```java
// 方案1：避免以"is"开头的boolean字段名
public class Member {
    private boolean leader; // 推荐
}

// 方案2：手动添加正确的setter
public class Member {
    private boolean isLeader;
    
    public void setIsLeader(boolean isLeader) {
        this.isLeader = isLeader;
    }
}

// 方案3：使用@JsonProperty注解（适用于JSON序列化）
public class Member {
    @JsonProperty("isLeader")
    private boolean leader;
}
```

### 3. IDE不识别生成的方法

**原因**：IDE未安装Lombok插件或插件未正确配置。

**解决方案**：
1. 安装对应IDE的Lombok插件
2. 重启IDE
3. 确保项目正确导入Lombok依赖

### 4. 与其他框架的兼容性问题

**常见问题**：
- Jackson/Gson序列化问题
- JPA实体类问题
- MapStruct映射问题

**解决方案**：
```java
// Jackson序列化配置
@JsonIgnoreProperties(ignoreUnknown = true)
@Data
public class ApiResponse {
    private String message;
    private Object data;
}

// JPA实体类最佳实践
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    @Id
    @EqualsAndHashCode.Include
    private Long id;
    
    private String name;
    private String email;
}
```

## 最佳实践

### 1. 合理选择注解

```java
// 对于实体类，使用@Data
@Data
@Entity
public class User {
    @Id
    private Long id;
    private String name;
    private String email;
}

// 对于不可变值对象，使用@Value
@Value
public class Coordinate {
    double x;
    double y;
}

// 对于复杂构建的对象，使用@Builder
@Builder
@Data
public class DatabaseConfig {
    private String host;
    private int port;
    private String database;
    private String username;
    private String password;
    private int maxConnections;
    private boolean ssl;
}
```

### 2. 避免在继承层次中过度使用

```java
// 父类
@Getter
@Setter
public abstract class BaseEntity {
    private Long id;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

// 子类
@Data
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
public class User extends BaseEntity {
    private String name;
    private String email;
}
```

### 3. 谨慎使用@Data在JPA实体中

```java
// 推荐方式
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {
    @Id
    @EqualsAndHashCode.Include
    private Long id;
    
    private String name;
    
    @OneToMany(mappedBy = "user")
    @ToString.Exclude // 避免懒加载问题
    @EqualsAndHashCode.Exclude
    private List<Order> orders;
}
```

### 4. 配置合理的访问级别

```java
@Data
public class SecuritySensitiveData {
    private String publicInfo;
    
    @Setter(AccessLevel.PACKAGE)
    private String internalInfo;
    
    @Setter(AccessLevel.NONE) // 只有getter，没有setter
    private String readOnlyInfo;
    
    @Getter(AccessLevel.NONE) // 没有getter
    @Setter(AccessLevel.NONE) // 没有setter
    private String secretInfo;
}
```

## 性能和注意事项

### 1. 编译时性能

Lombok在编译时处理注解，对运行时性能无影响，但会略微增加编译时间。

### 2. 调试友好性

生成的方法在调试时可能不够直观，建议：
- 使用IDE的Lombok插件查看生成的代码
- 必要时使用`delombok`工具将注解转换为普通Java代码

### 3. 团队协作

确保团队成员都安装了Lombok插件，避免代码在不同环境下出现问题。

## 高级用法

### 1. 自定义配置

在项目根目录创建`lombok.config`文件：

```properties
# 禁用某些功能
lombok.getter.noIsPrefix = true
lombok.accessors.fluent = true
lombok.accessors.chain = true

# 日志框架配置
lombok.log.fieldName = logger
lombok.log.fieldIsStatic = true
```

### 2. 条件注解

```java
@Data
@ConditionalOnProperty(name = "app.features.user-management", havingValue = "true")
public class User {
    private String name;
    private String email;
}
```

### 3. 与Spring Boot集成

```java
@Component
@Data
@ConfigurationProperties(prefix = "app.config")
public class AppConfig {
    private String name;
    private String version;
    private DatabaseConfig database;
    
    @Data
    public static class DatabaseConfig {
        private String url;
        private String username;
        private String password;
    }
}
```

## 总结

Lombok是一个强大的Java库，能够显著减少样板代码，提高开发效率。