---
title: JSON字段类型讲解
category:
  - 数据库
tag:
  - MySQL
  - SQL
  - JSON
---

# MySQL JSON字段类型讲解

MySQL 5.7 版本开始原生支持 JSON 数据类型，为开发者提供了灵活的数据存储和查询方式。本文档将详细介绍 MySQL 中 JSON 字段的各种操作方法。

## 目录

[[toc]]

## 1. JSON 数据类型简介

JSON（JavaScript Object Notation）是一种轻量级的数据交换格式，MySQL 的 JSON 数据类型提供：

- **自动验证**：确保存储的是有效的 JSON 格式
- **优化存储**：采用二进制格式存储，提高存储效率
- **丰富函数**：提供多种内置函数用于 JSON 数据操作

## 2. 方式一：直接使用 JSON 查询语法

这种方式无需额外配置，可以直接在 SQL 语句中使用。

### 2.1 使用 JSON 数据路径表达式

JSON 路径表达式是最直接的查询方式：

```sql
-- 基本查询示例
SELECT 
    name, 
    email, 
    phone, 
    data->'$.address' as address,           -- 返回 JSON 对象
    data->>'$.address.city' as city,        -- 返回字符串值
    data->>'$.address.state' as state       -- 返回字符串值
FROM mytable 
WHERE data->'$.address.state' = 'NY';
```

**语法说明：**
- `->` 操作符：返回 JSON 对象或数组
- `->>` 操作符：返回字符串值（去除引号）
- `$.path` 格式：JSON 路径表达式

### 2.2 使用 JSON 函数

MySQL 提供了丰富的 JSON 函数：

```sql
-- 使用 JSON_EXTRACT 函数
SELECT 
    name, 
    email, 
    phone, 
    JSON_EXTRACT(data, '$.address') as address,
    JSON_EXTRACT(data, '$.address.city') as city,
    JSON_EXTRACT(data, '$.address.state') as state
FROM mytable 
WHERE JSON_EXTRACT(data, '$.address.state') = 'NY';
```

### 2.3 常用 JSON 函数

```sql
-- JSON_OBJECT：创建 JSON 对象
SELECT JSON_OBJECT('name', 'John', 'age', 30, 'city', 'New York');

-- JSON_ARRAY：创建 JSON 数组
SELECT JSON_ARRAY('apple', 'banana', 'orange');

-- JSON_VALID：验证 JSON 格式
SELECT JSON_VALID('{"name": "John", "age": 30}');  -- 返回 1

-- JSON_CONTAINS：检查是否包含指定值
SELECT JSON_CONTAINS(data, '"NY"', '$.address.state') FROM mytable;

-- JSON_KEYS：获取 JSON 对象的所有键
SELECT JSON_KEYS(data, '$.address') FROM mytable;

-- JSON_LENGTH：获取 JSON 数组或对象的长度
SELECT JSON_LENGTH(data, '$.hobbies') FROM mytable;
```

### 2.4 在 MyBatis 中使用

在 MyBatis 中，建议使用 JSON 函数处理查询列：

```java
@Select("<script>" +
        "SELECT " +
        "JSON_EXTRACT(mp_alipay, '$.name') as name, " +
        "JSON_EXTRACT(mp_alipay, '$.age') as age " +
        "FROM app_manage_t" +
        "</script>")
List<UserInfo> selectUserList();
```

## 3. 方式二：使用 MyBatis TypeHandler

这种方式通过 TypeHandler 自动完成 JSON 字段与 Java 对象之间的转换。

### 3.1 XML 配置方式

#### 配置 ResultMap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.AppManageMapper">
    
    <resultMap id="beanMap" type="com.example.entity.AppManageEntity">
        <id column="id" property="id" />
        <!-- 其他普通字段 -->
        <result column="name" property="name" />
        <result column="email" property="email" />
        
        <!-- JSON 字段配置 -->
        <result column="app_ios" property="appIos" 
                typeHandler="com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler" />
        <result column="mp_alipay" property="mpAlipay" 
                typeHandler="com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler" />
    </resultMap>
    
    <!-- 使用 resultMap 的查询 -->
    <select id="selectByCondition" resultMap="beanMap">
        SELECT * FROM app_manage_t WHERE status = #{status}
    </select>
    
</mapper>
```

### 3.2 实体类注解方式

在实体类中使用 `@TableField` 注解配置 TypeHandler：

```java
@Data
@TableName("app_manage_t")
public class AppManageEntity {
    
    @TableId
    private Long id;
    
    private String name;
    private String email;
    
    // JSON 字段配置
    @TableField(typeHandler = JacksonTypeHandler.class)
    private AppIosConfig appIos;
    
    @TableField(typeHandler = JacksonTypeHandler.class)
    private AlipayConfig mpAlipay;
}
```

对应的配置类：

```java
@Data
public class AppIosConfig {
    private String appId;
    private String appSecret;
    private String version;
    // 其他字段...
}

@Data
public class AlipayConfig {
    private String name;
    private Integer age;
    private String merchantId;
    // 其他字段...
}
```

### 3.3 注意事项

使用 TypeHandler 方式需要注意：

1. **自动映射限制**：使用 TypeHandler 后，手动查询将不会自动映射 JSON 属性
2. **查询性能**：复杂的 JSON 操作可能影响查询性能
3. **索引支持**：可以为 JSON 字段的特定路径创建虚拟列索引

```sql
-- 为 JSON 字段创建虚拟列索引
ALTER TABLE mytable 
ADD COLUMN city VARCHAR(50) GENERATED ALWAYS AS (data->>'$.address.city') STORED;

CREATE INDEX idx_city ON mytable(city);
```

## 4. JSON 操作最佳实践

### 4.1 数据插入

```sql
-- 插入 JSON 数据
INSERT INTO mytable (name, data) VALUES 
('John Doe', '{"address": {"city": "New York", "state": "NY"}, "hobbies": ["reading", "gaming"]}');

-- 使用 JSON_OBJECT 函数插入
INSERT INTO mytable (name, data) VALUES 
('Jane Smith', JSON_OBJECT('address', JSON_OBJECT('city', 'Los Angeles', 'state', 'CA')));
```

### 4.2 数据更新

```sql
-- 更新整个 JSON 字段
UPDATE mytable 
SET data = JSON_SET(data, '$.address.city', 'Boston') 
WHERE name = 'John Doe';

-- 添加新的 JSON 属性
UPDATE mytable 
SET data = JSON_INSERT(data, '$.phone', '123-456-7890') 
WHERE name = 'John Doe';

-- 删除 JSON 属性
UPDATE mytable 
SET data = JSON_REMOVE(data, '$.phone') 
WHERE name = 'John Doe';
```

### 4.3 性能优化建议

1. **适度使用**：不要过度依赖 JSON 字段，结构化数据仍建议使用传统列
2. **创建索引**：为经常查询的 JSON 路径创建虚拟列索引
3. **验证数据**：在应用层和数据库层都要验证 JSON 格式
4. **监控性能**：定期监控 JSON 查询的性能表现

## 5. 总结

MySQL JSON 类型操作主要有两种方式：

- **直接 SQL 方式**：灵活度高，适合复杂查询，无需额外配置
- **TypeHandler 方式**：自动化程度高，适合简单的对象映射，但有一定限制

选择哪种方式取决于具体的业务需求和技术架构。对于简单的 JSON 数据存储和查询，推荐使用 TypeHandler 方式；对于复杂的 JSON 数据操作，建议使用直接 SQL 方式。