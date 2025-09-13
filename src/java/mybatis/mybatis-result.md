---
title: MyBatis结果映射注解指南
category:
  - 持久层框架
tag:
  - MyBatis
  - '@Result'
  - '@Results'
  - '@ResultMap'
---

# MyBatis 结果映射注解使用指南

在 MyBatis 中，结果映射是一个重要的概念，它可以帮助我们将数据库查询结果映射到 Java 对象。本文将详细介绍三个重要的映射注解：`@Results`、`@Result` 和 `@ResultMap`。

## 目录

[[toc]]

## 1. XML方式的结果映射

### 1.1 基本用法

在 Mapper XML 文件中使用 `resultMap` 定义映射关系：

```xml
<!-- UserMapper.xml -->
<resultMap id="userChildrenMap" type="com.baomidou.mybatisplus.samples.pagination.model.UserChildren">
    <!-- 主键映射 -->
    <id column="id" property="id"/>
    
    <!-- 基本属性映射 -->
    <result column="age" property="age"/>
    <result column="email" property="email"/>
    <result column="name" property="name"/>
    
    <!-- 一对多关系映射 -->
    <collection property="children" ofType="com.baomidou.mybatisplus.samples.pagination.entity.Children" 
                columnPrefix="c_">
        <id column="id" property="id"/>
        <result column="name" property="name"/>
        <result column="user_id" property="userId"/>
    </collection>
</resultMap>
```

### 1.2 在注解中引用 XML 映射

使用 `@ResultMap` 注解引用 XML 中定义的映射：

```java
@ResultMap("userChildrenMap")
@Select("SELECT u.*, " +
        "c.id as c_id, c.name as c_name, c.user_id as c_user_id " +
        "FROM user u " +
        "LEFT JOIN children c ON u.id = c.user_id " +
        "WHERE u.id = #{id}")
UserChildren getUserWithChildren(@Param("id") Long id);
```

## 2. 注解方式的结果映射

### 2.1 使用 @Results 定义映射

使用 `@Results` 注解可以直接在 Mapper 接口中定义结果映射：

```java
public interface RoleMapper extends EnhanceMapper<RoleEntity> {
    
    @Select("SELECT r.* FROM role_t r WHERE r.tenant_id = #{tenantId} AND r.remove = 0")
    @Results(id = "roleResultMap", value = {
        // 基本属性映射
        @Result(property = "id", column = "id"),
        @Result(property = "name", column = "name"),
        @Result(property = "remark", column = "remark"),
        @Result(property = "roleCode", column = "role_code"),
        
        // 一对多关系映射：权限组
        @Result(
            property = "permissionGroups",
            javaType = Set.class,
            column = "id",    // 用于关联查询的列
            many = @Many(select = "selectPermissionGroupsByRoleId")
        ),
        
        // 一对多关系映射：角色组
        @Result(
            property = "roleGroups",
            javaType = Set.class,
            column = "id",
            many = @Many(select = "selectRoleGroupsByRoleId")
        )
    })
    Page<RoleEntity> selectRolesWithTenantId(Page<RoleEntity> page, @Param("tenantId") Integer tenantId);

    // 复用已定义的结果映射
    @Select("SELECT r.* FROM role_t r WHERE r.id = #{roleId}")
    @ResultMap("roleResultMap")    // 引用上面定义的映射
    RoleEntity selectRoleInfoByRoleId(@Param("roleId") Integer roleId);
}
```

### 2.2 @Result 注解说明

- `property`: Java对象的属性名
- `column`: 数据库的列名
- `javaType`: 属性的Java类型
- `one`: 一对一关系映射
- `many`: 一对多关系映射

### 2.3 @ResultMap 注解说明

- 用于引用已经定义好的结果映射（可以是XML中的，也可以是注解中的）
- 通过指定映射的ID来复用映射关系
- 可以减少重复的映射定义

## 3. 最佳实践

1. 对于简单的映射，使用注解方式更直观
2. 对于复杂的映射（比如多表关联），推荐使用XML方式
3. 可以混合使用XML和注解方式，取长补短
4. 注意合理复用结果映射，避免代码重复

