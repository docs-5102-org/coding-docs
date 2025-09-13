---
title: tkmapper入门教程
category:
  - 持久层框架
tag:
  - MyBatis
  - tkmapper
---

# tkmapper 入门教程

## 目录

[[toc]]

## 1. 什么是 tkmapper  
tkmapper（原名 MyBatis 通用 Mapper）是对 MyBatis 的轻量级增强，通过统一的 Mapper 接口、Example 查询器和代码生成器，**80% 的 CRUD 无需手写 SQL**，同时保持 MyBatis 原生能力。  
- 官网仓库：https://github.com/mybatis-mapper/mapper  
- 官方示例工程：https://github.com/mybatis-mapper/mybatis-mapper-example-springboot  
- 旧版仓库（5.x 以前）：https://github.com/abel533/Mapper/tree/master/spring  

---

## 2. 快速开始（Spring Boot 3.x 为例）

### 2.1 依赖
```xml
<!-- 核心 -->
<dependency>
    <groupId>tk.mybatis</groupId>
    <artifactId>mapper-spring-boot-starter</artifactId>
    <version>4.2.3</version>
</dependency>
<!-- 分页插件（可选） -->
<dependency>
    <groupId>com.github.pagehelper</groupId>
    <artifactId>pagehelper-spring-boot-starter</artifactId>
    <version>2.1.0</version>
</dependency>
```

### 2.2 配置
在 `application.yml` 中启用 Mapper 接口扫描：
```yml
mybatis:
  mapper-locations: classpath:mapper/*.xml   # 如仍需手写 SQL
mapper:
  mappers: tk.mybatis.mapper.common.Mapper    # 通用接口
  not-empty: true                             # 空字符串 = NULL
  style: camelhump                            # 列名转驼峰
```

### 2.3 实体类
```java
@Table(name = "t_demo")
public class MybatisDemo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private Long count;

    private Byte isDeleted;

    @Column(name = "create_time")
    private Date createTime;

    /* getter / setter 省略 */
}
```

### 2.4 Mapper 接口
```java
@Repository
public interface MybatisDemoMapper extends Mapper<MybatisDemo> {
    // 无需写任何方法
}
```

---

## 3. 常用 CRUD

| 操作 | 示例 |
|---|---|
| 主键查询 | `MybatisDemo d = mapper.selectByPrimaryKey(1L);` |
| 新增 | `mapper.insertSelective(entity);` |
| 条件删除 | `mapper.deleteByExample(example);` |
| 更新 | `mapper.updateByPrimaryKeySelective(entity);` |

---

## 4. 无手写 SQL 的复杂查询：Example

tkmapper 提供三种写法，均支持**动态 SQL 拼接**：

### 4.1 传统 Example 链式写法
```java
Example example = new Example(MybatisDemo.class);
example.selectProperties("id", "name")        // 只查部分列
       .and().andEqualTo("isDeleted", 0)
       .andLike("name", "%d%");
example.orderBy("createTime").desc()
       .orderBy("id").asc();
List<MybatisDemo> list = mapper.selectByExample(example);
```

### 4.2 Criteria 分步写法
```java
Example example = new Example(MybatisDemo.class);
Example.Criteria c = example.createCriteria();
c.andEqualTo("count", 0)
 .andLike("name", "%d%");
example.orderBy("count").desc();
```

### 4.3 Example.builder + Weekend（类型安全，推荐）
```java
WeekendSqls<MybatisDemo> sqls = WeekendSqls.<MybatisDemo>custom()
        .andEqualTo(MybatisDemo::getCount, 0)
        .andLike(MybatisDemo::getName, "%d%");

Example example = Example.builder(MybatisDemo.class)
        .select("id", "name")
        .where(sqls)
        .orderByDesc("count", "name")
        .build();
```

---

## 5. 代码生成器（一键生成实体、Mapper、XML）

1. 引入插件：
```xml
<plugin>
  <groupId>tk.mybatis</groupId>
  <artifactId>mapper-generator</artifactId>
  <version>1.1.5</version>
</plugin>
```
2. 配置 `generatorConfig.xml` → 指定数据库连接、表名、包名。
3. 运行 Maven 插件：
```bash
mvn mybatis-generator:generate
```

---

## 6. 分页查询（PageHelper 插件）
```java
PageHelper.startPage(1, 10);          // 第 1 页，每页 10 条
List<MybatisDemo> list = mapper.selectByExample(example);
PageInfo<MybatisDemo> page = new PageInfo<>(list);
```

---

## 7. 常见问题 FAQ

| 问题 | 解决 |
|---|---|
| 启动报错 “No MyBatis mapper was found” | 检查 `@MapperScan` 是否指向正确的 Mapper 包 |
| 列名与属性不一致 | 使用 `@Column(name = "...")` 或开启 `map-underscore-to-camel-case` |
| 需要手写复杂 SQL | 仍可在 `resources/mapper/*.xml` 中写原生 Mapper.xml |

---

## 8. 官方资源汇总
- 最新文档：https://github.com/mybatis-mapper/mapper  
- Spring Boot 示例：https://github.com/mybatis-mapper/mybatis-mapper-example-springboot  
- 旧版 5.x 文档：https://github.com/abel533/Mapper/tree/master/spring  

