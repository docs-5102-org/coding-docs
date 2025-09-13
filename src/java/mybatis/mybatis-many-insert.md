---
title: MyBatis批量插入5种方案
category:
  - 持久层框架
tag:
  - MyBatis
---

# MyBatis / MyBatis-Plus 批量插入 5 种方案性能横向评测

::: tip
**场景**：一次性插入 1 万条 User 记录，MySQL 8.x，MyBatis 2.2.2，MyBatis-Plus 3.5.2  
**关注指标**：吞吐量、易用性、可维护性、通用性  
**结论先行**：**MyBatis 动态 SQL 批量插入** 和 **MyBatis-Plus InsertBatchSomeColumn** 最优，均在 600 ms 内完成，其余方案差距 1～2 个数量级。
:::

## 目录

[[toc]]

## 1 准备

### 1.1 Maven 依赖
```xml
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-j</artifactId>
    <scope>runtime</scope>
</dependency>

<dependency>
    <groupId>org.mybatis.spring.boot</groupId>
    <artifactId>mybatis-spring-boot-starter</artifactId>
    <version>2.2.2</version>
</dependency>

<dependency>
    <groupId>com.baomidou</groupId>
    <artifactId>mybatis-plus-boot-starter</artifactId>
    <version>3.5.2</version>
</dependency>

<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### 1.2 数据源配置
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/demo?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=UTC
    username: root
    password: root
mybatis:
  mapper-locations: classpath:mapping/*.xml
```

### 1.3 实体
```java
@Data
public class User {
    private Integer id;
    private String username;
    private String password;
}
```

---

## 2 方案对比

| #  | 方案                                | 耗时(ms) | 特点 & 适用场景                         |
|---|-------------------------------------|----------|----------------------------------------|
| 1 | for 循环单条插入                    | 26 348   | 最慢，仅做基线                         |
| 2 | MyBatis Batch Executor（手动提交）  | 24 516   | 事务手动控制，无 SQL 拼接优化          |
| 3 | MyBatis `<foreach>` 批量插入        | **521**  | 原生写法，通用、直观，**推荐**         |
| 4 | MP `saveBatch`（默认 1k 分批）      | 24 674   | 内部仍采用逐条 `INSERT`，性能一般      |
| 5 | MP `InsertBatchSomeColumn`          | **575**  | 生成 **多值 INSERT**，性能与方案 3 接近，**推荐** |

---

## 3 代码示例

### 3.1 方案 3：MyBatis `<foreach>` 批量插入
```java
// Service
public void batchInsert() {
    List<User> list = IntStream.range(0, 10_000)
            .mapToObj(i -> new User("u" + i, "p" + i))
            .collect(Collectors.toList());
    userMapper.batchInsert(list);
}

// Mapper
@Mapper
public interface UserMapper {
    int batchInsert(@Param("list") List<User> list);
}

<!-- XML -->
<insert id="batchInsert">
    INSERT INTO user (username, password) VALUES
    <foreach collection="list" item="u" separator=",">
        (#{u.username}, #{u.password})
    </foreach>
</insert>
```

### 3.2 方案 5：MyBatis-Plus `InsertBatchSomeColumn`
```java
// 1. 注入自定义 SQL 注入器
public class EasySqlInjector extends DefaultSqlInjector {
    @Override
    public List<AbstractMethod> getMethodList(Class<?> mapperClass, TableInfo tableInfo) {
        List<AbstractMethod> methods = super.getMethodList(mapperClass, tableInfo);
        methods.add(new InsertBatchSomeColumn());
        return methods;
    }
}

// 2. 声明 Mapper 接口
public interface UserMapper extends BaseMapper<User> {
    int insertBatchSomeColumn(Collection<User> list);
}

// 3. Service
public void batchInsert() {
    List<User> list = IntStream.range(0, 10_000)
            .mapToObj(i -> new User("u" + i, "p" + i))
            .collect(Collectors.toList());
    userMapper.insertBatchSomeColumn(list);
}
```

---

## 4 选型建议

| 场景                           | 推荐方案                        |
|------------------------------|---------------------------------|
| 纯 MyBatis 项目               | `<foreach>` 批量插入（方案 3）  |
| 已使用 MyBatis-Plus           | `InsertBatchSomeColumn`（方案 5）|
| 需要兼容多数据库              | 方案 3（Oracle 需改写语法）     |
| 已开启全局批处理（rewriteBatchedStatements=true） | 方案 2 也能跑，但性能不如 3/5 |

---

## 5 FAQ

1. **为什么 `saveBatch` 不快？**  
   默认每 1000 条提交一次，但内部仍然是 `INSERT INTO ... VALUES (...)` 单条 SQL，无法利用 MySQL 的多值插入优化。

2. **如何继续提升性能？**  
   - 连接串加 `rewriteBatchedStatements=true`  
   - 调大 `max_allowed_packet`  
   - 事务批量大小 5000～10000 条最佳  
   - 考虑异步 + 多线程分段插入

---

## 6 结论

在 **万级** 数据量下，**MyBatis 动态 SQL 批量插入** 和 **MyBatis-Plus InsertBatchSomeColumn** 性能处于同一梯队，且代码量最少、可维护性最高，建议优先采用。
