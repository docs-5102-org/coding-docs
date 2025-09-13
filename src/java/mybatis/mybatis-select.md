---
title: MyBatis @Select详解
category:
  - 持久层框架
tag:
  - MyBatis
  - '@Select'
---

# MyBatis @Select详解

## 目录

[[toc]]

## 概述

MyBatis的@Select注解是一种基于注解的映射方式，允许开发者直接在Mapper接口的方法上编写SQL查询语句，而无需编写XML映射文件。这种方式简化了配置，提高了开发效率。

## 基本语法

### 简单查询

```java
@Select("SELECT id, name, email FROM user WHERE id = #{id}")
User getUserById(@Param("id") Long id);
```

### 多参数查询

```java
@Select("SELECT * FROM user WHERE name = #{name} AND age = #{age}")
List<User> getUserByNameAndAge(@Param("name") String name, @Param("age") Integer age);
```

## 复杂查询场景

### 1. 使用IN查询（集合参数）

当需要传入集合作为IN查询条件时，需要使用`<script>`标签：

```java
@Select({
    "<script>",
    "SELECT id, name, user_id",
    "FROM label",
    "WHERE id IN",
    "<foreach collection='ids' item='id' open='(' separator=',' close=')'>",
    "#{id}",
    "</foreach>",
    "</script>"
})
List<LabelDTO> getLabelsByIds(@Param("ids") List<Long> ids);
```

**关键要点：**
- 使用大括号`{}`包围多行SQL语句
- 必须使用`<script>`标签包装动态SQL
- 每行SQL语句后用逗号分隔
- 使用`<foreach>`标签处理集合参数

### 2. 条件查询

```java
@Select({
    "<script>",
    "SELECT * FROM user WHERE 1=1",
    "<if test='name != null and name != \"\"'>",
    "AND name LIKE CONCAT('%', #{name}, '%')",
    "</if>",
    "<if test='age != null'>",
    "AND age = #{age}",
    "</if>",
    "</script>"
})
List<User> getUsersByCondition(@Param("name") String name, @Param("age") Integer age);
```

### 3. 分页查询

```java
@Select("SELECT * FROM user ORDER BY id DESC LIMIT #{offset}, #{limit}")
List<User> getUsersWithPagination(@Param("offset") Integer offset, @Param("limit") Integer limit);
```

### 4. 联表查询

```java
@Select({
    "SELECT u.id, u.name, u.email, d.dept_name",
    "FROM user u",
    "LEFT JOIN department d ON u.dept_id = d.id",
    "WHERE u.id = #{userId}"
})
UserWithDeptDTO getUserWithDepartment(@Param("userId") Long userId);
```

## 结果映射

### 1. 自动映射

当数据库字段名与Java属性名一致时，MyBatis会自动映射：

```java
@Select("SELECT id, name, email FROM user WHERE id = #{id}")
User getUserById(@Param("id") Long id);
```

### 2. 使用@Results进行手动映射

```java
@Select("SELECT user_id, user_name, user_email FROM t_user WHERE user_id = #{id}")
@Results({
    @Result(property = "id", column = "user_id"),
    @Result(property = "name", column = "user_name"),
    @Result(property = "email", column = "user_email")
})
User getUserById(@Param("id") Long id);
```

### 3. 复杂对象映射

```java
@Select({
    "SELECT u.id as user_id, u.name as user_name,",
    "d.id as dept_id, d.name as dept_name",
    "FROM user u LEFT JOIN department d ON u.dept_id = d.id",
    "WHERE u.id = #{userId}"
})
@Results({
    @Result(property = "id", column = "user_id"),
    @Result(property = "name", column = "user_name"),
    @Result(property = "department.id", column = "dept_id"),
    @Result(property = "department.name", column = "dept_name")
})
UserWithDepartment getUserWithDept(@Param("userId") Long userId);
```

## 高级特性

### 1. 使用Provider类

对于复杂的动态SQL，可以使用Provider类：

```java
@SelectProvider(type = UserSqlProvider.class, method = "buildGetUsersSql")
List<User> getUsers(@Param("condition") UserQueryCondition condition);

public class UserSqlProvider {
    public String buildGetUsersSql(Map<String, Object> params) {
        UserQueryCondition condition = (UserQueryCondition) params.get("condition");
        StringBuilder sql = new StringBuilder("SELECT * FROM user WHERE 1=1");
        
        if (condition.getName() != null) {
            sql.append(" AND name LIKE CONCAT('%', #{condition.name}, '%')");
        }
        if (condition.getAge() != null) {
            sql.append(" AND age = #{condition.age}");
        }
        
        return sql.toString();
    }
}
```

### 2. 返回Map类型

```java
@Select("SELECT COUNT(*) as total, AVG(age) as avg_age FROM user")
Map<String, Object> getUserStatistics();
```

### 3. 返回Optional类型

```java
@Select("SELECT * FROM user WHERE id = #{id}")
Optional<User> findUserById(@Param("id") Long id);
```

## 最佳实践

### 1. 参数使用@Param注解

```java
// 推荐：明确指定参数名
@Select("SELECT * FROM user WHERE name = #{name}")
User getUserByName(@Param("name") String name);

// 不推荐：依赖参数位置
@Select("SELECT * FROM user WHERE name = #{0}")
User getUserByName(String name);
```

### 2. 复杂SQL使用XML映射

当SQL过于复杂时，建议使用XML映射文件而非注解：

```java
// 简单查询适合使用注解
@Select("SELECT * FROM user WHERE id = #{id}")
User getUserById(@Param("id") Long id);

// 复杂查询建议使用XML
List<User> getUsersByComplexCondition(UserQueryCondition condition);
```

### 3. 注意SQL注入防护

```java
// 安全：使用#{} 预编译参数
@Select("SELECT * FROM user WHERE name = #{name}")
User getUserByName(@Param("name") String name);

// 危险：使用${} 直接拼接（仅在必要时使用）
@Select("SELECT * FROM user ORDER BY ${orderBy}")
List<User> getUsersOrderBy(@Param("orderBy") String orderBy);
```

## 常见问题及解决方案

### 1. 集合参数IN查询失败

**问题：** 使用List作为IN查询参数时报错

**解决方案：** 使用`<script>`标签和`<foreach>`

```java
@Select({
    "<script>",
    "SELECT * FROM user WHERE id IN",
    "<foreach collection='ids' item='id' open='(' separator=',' close=')'>",
    "#{id}",
    "</foreach>",
    "</script>"
})
List<User> getUsersByIds(@Param("ids") List<Long> ids);
```

### 2. 字段名不匹配

**问题：** 数据库字段名与Java属性名不一致

**解决方案：** 使用@Results注解或者在SQL中使用别名

```java
// 方案1：使用别名
@Select("SELECT user_name as name FROM user WHERE id = #{id}")
User getUserById(@Param("id") Long id);

// 方案2：使用@Results
@Select("SELECT user_name FROM user WHERE id = #{id}")
@Results(@Result(property = "name", column = "user_name"))
User getUserById(@Param("id") Long id);
```

### 3. 动态SQL中的特殊字符

**问题：** 在`<script>`标签中使用`<`、`>`等符号报错

**解决方案：** 使用转义字符或CDATA

```java
@Select({
    "<script>",
    "SELECT * FROM user WHERE age",
    "<![CDATA[ >= ]]>",
    "#{minAge}",
    "</script>"
})
List<User> getUsersByMinAge(@Param("minAge") Integer minAge);
```

## 总结

@Select注解为MyBatis提供了一种简洁的SQL映射方式，特别适合简单到中等复杂度的查询。使用时需要注意：

1. 简单查询直接使用字符串形式
2. 复杂查询使用数组形式配合`<script>`标签
3. 集合参数需要使用`<foreach>`标签
4. 适当使用@Results进行结果映射
5. 注意SQL注入防护
6. 复杂业务逻辑建议使用XML映射文件

通过合理使用@Select注解，可以显著提高开发效率，同时保持代码的简洁性和可维护性。