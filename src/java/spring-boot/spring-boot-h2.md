---
title: SpringBoot集成H2数据库
category:
  - Web框架
tag:
  - Spring Boot
---

# SpringBoot 集成H2数据库

本文将介绍如何在 Spring Boot 应用中集成 H2 数据库，涵盖基本概念、配置方式以及实战示例，适合开发和单元测试场景。

---

## 1. H2 数据库简介

* **H2** 是一个由 Java 语言实现的开源关系型数据库，支持嵌入模式（embedded）、内存模式（in-memory）和服务器模式（server）等方式，可通过 JDBC API 使用 ([CSDN博客][1], [Spring Boot Tutorial][2])。
* 常用于开发、测试场景，尤其是 CI/CD 环境中，可以无需依赖外部数据库，减少测试环境复杂度与脏数据影响 ([CSDN博客][1], [Spring Boot Tutorial][2])。
* 支持 **MySQL 兼容模式**，通过类似 `jdbc:h2:~/test;MODE=MySQL;DATABASE_TO_LOWER=TRUE` 等参数，可以模拟 MySQL/MariaDB 行为，包括大小写处理等差异 ([CSDN博客][1])。

---

## 2. 集成 Spring Boot 与 H2

### 2.1 添加依赖

在 `pom.xml` 中引入以下依赖：

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
  <groupId>com.h2database</groupId>
  <artifactId>h2</artifactId>
  <scope>runtime</scope>
</dependency>
```

这能让 Spring Boot 自动配置 H2 数据源和 JPA 支持 ([Baeldung on Kotlin][3], [HowToDoInJava][4], [Spring Boot Tutorial][2])。

### 2.2 应用配置（application.properties）

```properties
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_ON_EXIT=TRUE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
spring.jpa.hibernate.ddl-auto=update
```

### 2.3 application.yml

```yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb;DB_CLOSE_ON_EXIT=TRUE
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    database-platform: org.hibernate.dialect.H2Dialect
    hibernate:
      ddl-auto: update
  h2:
    console:
      enabled: true
      path: /h2-console

```

* `jdbc:h2:mem:testdb` 表示使用内存模式，重启应用后数据清除 ([Baeldung on Kotlin][3], [HowToDoInJava][4], [Spring Boot Tutorial][2])。
* `spring.h2.console.enabled=true` 启用 Web 控制台，访问路径为 `/h2-console` ([HowToDoInJava][4], [Medium][5])。
* `ddl-auto=update` 使 Hibernate 根据实体自动更新表结构 ([Code Like A Girl][6])。

---

## 3. 示例：Spring Boot + H2 CRUD 应用

### 3.1 项目结构

```
src/
├── main/
│   ├── java/com/example/demo/
│   │   ├── DemoApplication.java
│   │   ├── entity/
│   │   │   └── Department.java
│   │   ├── repository/
│   │   │   └── DepartmentRepository.java
│   │   ├── service/
│   │   │   └── DepartmentService.java
│   │   │   └── DepartmentServiceImpl.java
│   │   └── controller/
│   │       └── DepartmentController.java
│   └── resources/
│       ├── application.properties
│       └── data.sql (可选，用于初始化数据)
```

### 3.2 实体类示例

```java
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long departmentId;
    private String departmentName;
    private String departmentAddress;
    private String departmentCode;
}
```

### 3.3 Repository 接口

```java
@Repository
public interface DepartmentRepository extends CrudRepository<Department, Long> { }
```

### 3.4 服务层接口与实现

```java
public interface DepartmentService {
    Department saveDepartment(Department department);
    List<Department> fetchDepartmentList();
    Department updateDepartment(Department department, Long departmentId);
    void deleteDepartmentById(Long departmentId);
}

@Service
public class DepartmentServiceImpl implements DepartmentService {
    @Autowired
    private DepartmentRepository repository;

    @Override
    public Department saveDepartment(Department dept) {
        return repository.save(dept);
    }
    // 实现其他方法：fetch, update, delete...
}
```

### 3.5 控制器示例

```java
@RestController
@RequestMapping("/departments")
public class DepartmentController {
    @Autowired
    private DepartmentService service;

    @PostMapping
    public Department create(@RequestBody Department dept) {
        return service.saveDepartment(dept);
    }

    @GetMapping
    public List<Department> list() {
        return service.fetchDepartmentList();
    }

    @PutMapping("/{id}")
    public Department update(@PathVariable Long id, @RequestBody Department dept) {
        return service.updateDepartment(dept, id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.deleteDepartmentById(id);
    }
}
```

---

## 4. 单元测试中的 H2 使用

* 在单元测试环境中，使用 H2 可避免对外部数据库的依赖，确保测试独立、快速执行、无残留数据 ([CSDN博客][1])。
* 推荐的测试注解配置：

```java
@SpringBootTest
@AutoConfigureMockMvc
public class DepartmentControllerTest {
    @Autowired
    private MockMvc mvc;
    // 测试 controller 行为
}
```

```java
@SpringBootTest
@Transactional
public class DepartmentRepositoryTest {
    @Autowired
    private DepartmentRepository repository;
    // 测试 CRUD 行为
}
```

MockMvc 可用于模拟 HTTP 请求，`@Transactional` 确保测试执行完后回滚事务，保持 DB 清洁。

---

## 5. 总结与建议

* H2 是一个轻量、快速、内嵌的 Java 数据库，非常适合开发阶段与单元测试使用。
* Spring Boot 对于 H2 的支持非常全面，自动配置极简，无需额外 setup。
* 推荐的实践包括使用 `application.properties` 做基本配置，并利用实体 + JPA 自动建表。同时利用 H2 控制台进行调试。
* 单元测试中使用 H2 可提高测试稳定性，并消除外部依赖。
* 若希望模拟生产数据库行为，可使用 H2 的兼容模式（如 MySQL 替代方案）。

---

希望这篇 Markdown 文档能帮助你快速上手 Spring Boot 和 H2 数据库的集成与应用，包括开发和测试各个层面。如果你还有特定需求（如安全配置、集成外部数据库、复杂关联模型等），欢迎继续交流！

[1]: https://blog.csdn.net/a82514921/article/details/108029222 "Java单元测试实践-25.在本地使用H2数据库进行单元测试_org.h2.jdbc.jdbcsqlnontransientconnectionexception-CSDN博客"
[2]: https://www.springboottutorial.com/spring-boot-and-h2-in-memory-database?utm_source=chatgpt.com "Spring Boot and H2 in memory database"
[3]: https://www.baeldung.com/spring-boot-h2-database?utm_source=chatgpt.com "Spring Boot With H2 Database"
[4]: https://howtodoinjava.com/spring-boot/h2-database-example/?utm_source=chatgpt.com "Spring Boot and H2 Database: Integration Example"
[5]: https://medium.com/%40piyumisudusinghe/spring-boot-h2-database-b5a54786ecb6?utm_source=chatgpt.com "Connect Spring Boot application with H2 Database"
[6]: https://code.likeagirl.io/configuring-a-spring-boot-application-with-h2-database-92359130500b?utm_source=chatgpt.com "Configuring a Spring Boot Application with H2 Database"
