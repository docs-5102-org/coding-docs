---
title: MyBatis <where>标签详解
category:
  - 持久层框架
tag:
  - MyBatis
  - '<where>'
---

# MyBatis `<where>`标签动态SQL完全指南

## 目录

[[toc]]

## 概述

MyBatis的`<where>`标签是处理动态SQL查询条件的核心标签，它能够自动处理SQL语句中的WHERE子句，智能去除多余的`AND`、`OR`连接符，解决动态条件拼接中的语法问题。

## 核心功能

`<where>`标签具有以下关键功能：
- 自动添加WHERE关键字（当内部有条件时）
- 自动移除第一个多余的AND或OR
- 当没有任何条件时，不会添加WHERE子句
- 避免SQL语法错误，提高代码健壮性

## 实战案例：从基础到进阶

### 基础SQL查询

原始固定条件查询：
```sql
SELECT id, gender, nickname, mobile, avatar 
FROM dts_user 
WHERE gender = 1 AND mobile LIKE '%56%'
```

### 进阶一：部分动态化

将mobile查询条件动态化：
```xml
<!-- 根据条件查询用户 -->
<select id="queryUserByWhere" parameterType="user" resultType="user">
    SELECT id, gender, nickname, mobile, avatar 
    FROM dts_user 
    WHERE gender = 1 AND mobile LIKE '%${mobile}%'
</select>
```

**注意**：这里使用`${}`进行字符串拼接，存在SQL注入风险，生产环境建议使用`#{}`配合CONCAT函数。

### 进阶二：全面动态化

所有查询条件都支持动态传入：
```xml
<!-- 根据条件查询用户 -->
<select id="queryUserByWhere" parameterType="user" resultType="user">
    SELECT id, gender, nickname, mobile, avatar 
    FROM dts_user 
    WHERE gender = #{gender} AND mobile LIKE '%${mobile}%'
</select>
```

### 进阶三：条件判断优化

使用`<if>`标签进行条件判断，但需要添加`1=1`来处理WHERE子句：
```xml
<!-- 根据条件查询用户 -->
<select id="queryUserByWhere" parameterType="user" resultType="user">
    SELECT id, gender, nickname, mobile, avatar 
    FROM dts_user 
    WHERE 1=1
    <if test="gender != null and gender != ''">
        AND gender = #{gender}
    </if>
    <if test="mobile != null and mobile != ''">
        AND mobile LIKE '%${mobile}%'
    </if>
</select>
```

**问题**：使用`1=1`虽然解决了语法问题，但不够优雅。

### 进阶四：`<where>`标签最佳实践

使用`<where>`标签自动处理WHERE子句和连接符：
```xml
<!-- 根据条件查询用户 -->
<select id="queryUserByWhere" parameterType="user" resultType="user">
    SELECT id, gender, nickname, mobile, avatar 
    FROM dts_user
    <where>
        <if test="gender != null">
            AND gender = #{gender}
        </if>
        <if test="mobile != null and mobile != ''">
            AND mobile LIKE '%${mobile}%'
        </if>
    </where>
</select>
```

## `<where>`标签工作原理

### 自动处理规则

1. **智能添加WHERE**：当`<where>`标签内部有任何内容时，自动添加WHERE关键字
2. **移除前导连接符**：自动移除第一个AND或OR连接符
3. **空条件处理**：当没有任何条件满足时，不添加WHERE子句

### 示例对比

**传统方式**（容易出错）：
```xml
<select id="findUsers" resultType="User">
    SELECT * FROM users WHERE
    <if test="name != null">
        name = #{name}
    </if>
    <if test="age != null">
        AND age = #{age}
    </if>
</select>
```
当name为null时，SQL变成：`SELECT * FROM users WHERE AND age = 18`（语法错误）

**使用`<where>`标签**（自动修正）：
```xml
<select id="findUsers" resultType="User">
    SELECT * FROM users
    <where>
        <if test="name != null">
            AND name = #{name}
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>
```
当name为null时，SQL变成：`SELECT * FROM users WHERE age = 18`（正确）

## 复杂实战案例

以下是一个包含多种动态条件的复杂查询示例：

```xml
<select id="findNovels" resultType="Novel">
    <script>
        SELECT 
            novel.id, novel.title, novel.cover_img, novel.author, 
            novel.intro, novel.score, novel.last_chapter_name, 
            novel.lately_follower, novel.total_follower, 
            novel.retention_ratio, novel.category_id, novel.category_name
        FROM novel_t AS novel 
        INNER JOIN novel_category_t AS cat ON novel.category_id = cat.id
        <where>
            novel.remove = 0 AND novel.sell_status = 'UP'
            
            <choose>
                <when test='minCatList != null and minCatList.size() > 0'>
                    AND novel.category_id IN 
                    <foreach collection="minCatList" item="item" index="index" 
                             open="(" separator="," close=")">
                        #{item.id}
                    </foreach>
                </when>
                <otherwise>
                    AND novel.category_id = #{majorId}
                </otherwise>
            </choose>
            
            <if test='genderChannel != null and genderChannel != ""'>
                AND cat.gender_channel = #{genderChannel}
            </if>
            
            <if test='status != null and status != "" and status != "all"'>
                AND novel.serial_status = #{status}
            </if>
        </where>
        ORDER BY novel.last_modified DESC
    </script>
</select>
```

## 最佳实践建议

### 1. 参数校验
```xml
<if test="mobile != null and mobile != ''">
    AND mobile LIKE CONCAT('%', #{mobile}, '%')
</if>
```

### 2. 安全性考虑
- 优先使用`#{}`而非`${}`防止SQL注入
- 对于LIKE查询，使用CONCAT函数拼接通配符

### 3. 性能优化
```xml
<where>
    <!-- 将选择性高的条件放在前面 -->
    <if test="id != null">
        AND id = #{id}
    </if>
    <if test="status != null">
        AND status = #{status}
    </if>
    <!-- 模糊查询放在后面 -->
    <if test="name != null and name != ''">
        AND name LIKE CONCAT('%', #{name}, '%')
    </if>
</where>
```

### 4. 代码可读性
```xml
<where>
    <!-- 基础条件 -->
    <if test="isActive != null">
        AND is_active = #{isActive}
    </if>
    
    <!-- 时间范围条件 -->
    <if test="startDate != null">
        AND create_time &gt;= #{startDate}
    </if>
    <if test="endDate != null">
        AND create_time &lt;= #{endDate}
    </if>
    
    <!-- 模糊查询条件 -->
    <if test="keyword != null and keyword != ''">
        AND (name LIKE CONCAT('%', #{keyword}, '%') 
             OR description LIKE CONCAT('%', #{keyword}, '%'))
    </if>
</where>
```

## 常见问题与解决方案

### 问题1：空WHERE子句
**错误示例**：
```sql
SELECT * FROM users WHERE  -- 所有条件都不满足时
```

**解决方案**：使用`<where>`标签自动处理

### 问题2：多余的连接符
**错误示例**：
```sql
SELECT * FROM users WHERE AND name = 'John'  -- 第一个条件前的AND
```

**解决方案**：`<where>`标签自动移除前导AND/OR

### 问题3：复杂嵌套条件
对于复杂的嵌套条件，可以结合`<choose>`、`<when>`、`<otherwise>`标签：

```xml
<where>
    <choose>
        <when test="userType == 'VIP'">
            AND level &gt; 5 AND points &gt; 1000
        </when>
        <when test="userType == 'NORMAL'">
            AND level &gt; 1
        </when>
        <otherwise>
            AND status = 'ACTIVE'
        </otherwise>
    </choose>
</where>
```

## 总结

`<where>`标签是MyBatis动态SQL的重要组件，它显著简化了动态查询条件的处理：

1. **自动化处理**：无需手动添加WHERE关键字和处理连接符
2. **错误预防**：避免常见的SQL语法错误
3. **代码简洁**：相比传统的`1=1`方式更加优雅
4. **维护性强**：条件变更时无需担心语法问题

通过合理使用`<where>`标签，可以构建出既安全又高效的动态SQL查询，提升开发效率和代码质量。