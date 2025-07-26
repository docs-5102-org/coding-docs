---
title: MyBatis 基础教程
category:
  - 持久层框架
tag:
  - MyBatis
---

# MyBatis 基础教程

## 目录
1. [MyBatis 简介](#mybatis-简介)
2. [环境搭建](#环境搭建)
3. [核心组件](#核心组件)
4. [配置文件详解](#配置文件详解)
5. [映射器（Mapper）](#映射器mapper)
6. [基本 CRUD 操作](#基本-crud-操作)
7. [动态 SQL](#动态-sql)
8. [结果映射](#结果映射)
9. [缓存机制](#缓存机制)
10. [最佳实践](#最佳实践)
11. [官方资源](#官方资源)
12. [第三方教程资源](#第三方教程资源)

## MyBatis 简介

MyBatis 是一个优秀的持久层框架，它支持自定义 SQL、存储过程以及高级映射。MyBatis 免除了几乎所有的 JDBC 代码以及设置参数和获取结果集的工作。MyBatis 可以通过简单的 XML 或注解来配置和映射原始类型、接口和 Java POJO（Plain Old Java Objects，普通老式 Java 对象）为数据库中的记录。

### 特点
- **简单易学**：本身就很小且简单，没有任何第三方依赖
- **灵活**：不会对应用程序或数据库的现有设计强加任何影响
- **解除 SQL 与程序代码的耦合**：通过提供 DAO 层，将业务逻辑和数据访问逻辑分离
- **提供映射标签**：支持对象与数据库的 ORM 字段关系映射
- **提供 XML 标签**：支持编写动态 SQL 语句

## 环境搭建

### Maven 依赖
```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.5.13</version>
</dependency>

<!-- 数据库驱动（以 MySQL 为例） -->
<dependency>
    <groupId>mysql</groupId>
    <artifactId>mysql-connector-java</artifactId>
    <version>8.0.33</version>
</dependency>
```

### Gradle 依赖
```gradle
implementation 'org.mybatis:mybatis:3.5.13'
implementation 'mysql:mysql-connector-java:8.0.33'
```

## 核心组件

### SqlSessionFactoryBuilder
用于创建 SqlSessionFactory 的建造者类，一旦创建了 SqlSessionFactory，就不再需要它了。

### SqlSessionFactory
用于创建 SqlSession 的工厂类，SqlSessionFactory 一旦被创建就应该在应用的运行期间一直存在。

### SqlSession
执行 SQL 语句的会话对象，每个线程都应该有它自己的 SqlSession 实例。

### Mapper
映射器接口，定义了数据访问的方法。

## 配置文件详解

### 主配置文件 (mybatis-config.xml)
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <!-- 属性配置 -->
  <properties resource="database.properties"/>
  
  <!-- 设置 -->
  <settings>
    <setting name="cacheEnabled" value="true"/>
    <setting name="lazyLoadingEnabled" value="true"/>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
  </settings>
  
  <!-- 类型别名 -->
  <typeAliases>
    <typeAlias alias="User" type="com.example.model.User"/>
    <package name="com.example.model"/>
  </typeAliases>
  
  <!-- 环境配置 -->
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="${driver}"/>
        <property name="url" value="${url}"/>
        <property name="username" value="${username}"/>
        <property name="password" value="${password}"/>
      </dataSource>
    </environment>
  </environments>
  
  <!-- 映射器 -->
  <mappers>
    <mapper resource="mappers/UserMapper.xml"/>
    <package name="com.example.mapper"/>
  </mappers>
</configuration>
```

### 数据库属性文件 (database.properties)
```properties
driver=com.mysql.cj.jdbc.Driver
url=jdbc:mysql://localhost:3306/mybatis_demo?serverTimezone=UTC
username=root
password=password
```

## 映射器（Mapper）

### 接口定义
```java
public interface UserMapper {
    User selectById(Long id);
    List<User> selectAll();
    int insert(User user);
    int update(User user);
    int deleteById(Long id);
}
```

### XML 映射文件
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.example.mapper.UserMapper">
  
  <resultMap id="UserResultMap" type="User">
    <id property="id" column="id"/>
    <result property="username" column="username"/>
    <result property="email" column="email"/>
    <result property="createTime" column="create_time"/>
  </resultMap>
  
  <select id="selectById" parameterType="long" resultMap="UserResultMap">
    SELECT id, username, email, create_time
    FROM users
    WHERE id = #{id}
  </select>
  
  <select id="selectAll" resultMap="UserResultMap">
    SELECT id, username, email, create_time
    FROM users
  </select>
  
  <insert id="insert" parameterType="User" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO users (username, email, create_time)
    VALUES (#{username}, #{email}, #{createTime})
  </insert>
  
  <update id="update" parameterType="User">
    UPDATE users
    SET username = #{username}, email = #{email}
    WHERE id = #{id}
  </update>
  
  <delete id="deleteById" parameterType="long">
    DELETE FROM users WHERE id = #{id}
  </delete>
  
</mapper>
```

## 基本 CRUD 操作

### 使用示例
```java
public class MyBatisDemo {
    public static void main(String[] args) throws IOException {
        // 读取配置文件
        String resource = "mybatis-config.xml";
        InputStream inputStream = Resources.getResourceAsStream(resource);
        
        // 创建 SqlSessionFactory
        SqlSessionFactory sqlSessionFactory = 
            new SqlSessionFactoryBuilder().build(inputStream);
        
        // 获取 SqlSession
        try (SqlSession session = sqlSessionFactory.openSession()) {
            // 获取映射器
            UserMapper mapper = session.getMapper(UserMapper.class);
            
            // 查询操作
            User user = mapper.selectById(1L);
            System.out.println(user);
            
            // 插入操作
            User newUser = new User();
            newUser.setUsername("张三");
            newUser.setEmail("zhangsan@example.com");
            newUser.setCreateTime(new Date());
            
            int result = mapper.insert(newUser);
            session.commit(); // 提交事务
            
            System.out.println("插入结果: " + result);
            System.out.println("新用户ID: " + newUser.getId());
        }
    }
}
```

## 动态 SQL

MyBatis 的强大特性之一就是它的动态 SQL 能力。

### if 标签
```xml
<select id="findUsers" resultMap="UserResultMap">
  SELECT * FROM users
  WHERE 1=1
  <if test="username != null">
    AND username = #{username}
  </if>
  <if test="email != null">
    AND email = #{email}
  </if>
</select>
```

### choose、when、otherwise 标签
```xml
<select id="findUsers" resultMap="UserResultMap">
  SELECT * FROM users
  WHERE 1=1
  <choose>
    <when test="username != null">
      AND username = #{username}
    </when>
    <when test="email != null">
      AND email = #{email}
    </when>
    <otherwise>
      AND status = 'ACTIVE'
    </otherwise>
  </choose>
</select>
```

### where 标签
```xml
<select id="findUsers" resultMap="UserResultMap">
  SELECT * FROM users
  <where>
    <if test="username != null">
      username = #{username}
    </if>
    <if test="email != null">
      AND email = #{email}
    </if>
  </where>
</select>
```

### foreach 标签
```xml
<select id="findUsersByIds" resultMap="UserResultMap">
  SELECT * FROM users
  WHERE id IN
  <foreach collection="ids" item="id" open="(" close=")" separator=",">
    #{id}
  </foreach>
</select>
```

## 结果映射

### 基本结果映射
```xml
<resultMap id="UserResultMap" type="User">
  <id property="id" column="user_id"/>
  <result property="username" column="user_name"/>
  <result property="email" column="email"/>
</resultMap>
```

### 关联映射（一对一）
```xml
<resultMap id="UserWithProfileResultMap" type="User">
  <id property="id" column="user_id"/>
  <result property="username" column="username"/>
  <association property="profile" javaType="UserProfile">
    <id property="id" column="profile_id"/>
    <result property="firstName" column="first_name"/>
    <result property="lastName" column="last_name"/>
  </association>
</resultMap>
```

### 集合映射（一对多）
```xml
<resultMap id="UserWithOrdersResultMap" type="User">
  <id property="id" column="user_id"/>
  <result property="username" column="username"/>
  <collection property="orders" ofType="Order">
    <id property="id" column="order_id"/>
    <result property="orderNumber" column="order_number"/>
    <result property="amount" column="amount"/>
  </collection>
</resultMap>
```

## 缓存机制

### 一级缓存（默认开启）
SqlSession 级别的缓存，在同一个 SqlSession 中，相同的查询会被缓存。

### 二级缓存
```xml
<!-- 在映射文件中开启二级缓存 -->
<cache eviction="LRU" flushInterval="60000" size="512" readOnly="true"/>
```

### 自定义缓存
```xml
<cache type="com.example.MyCustomCache"/>
```

## 最佳实践

### 1. 合理使用 SqlSession
- SqlSession 不是线程安全的，不能被共享
- 使用完毕后要及时关闭
- 建议使用 try-with-resources 语句

### 2. 参数传递
```java
// 单个参数
User getUserById(@Param("id") Long id);

// 多个参数
List<User> getUsers(@Param("username") String username, 
                   @Param("email") String email);

// 对象参数
int insertUser(User user);
```

### 3. 结果集处理
```java
// 使用 ResultHandler 处理大量数据
mapper.selectUsers(new ResultHandler<User>() {
    @Override
    public void handleResult(ResultContext<? extends User> context) {
        User user = context.getResultObject();
        // 处理每一行数据
    }
});
```

### 4. 事务管理
```java
try (SqlSession session = sqlSessionFactory.openSession()) {
    UserMapper mapper = session.getMapper(UserMapper.class);
    
    // 执行数据库操作
    mapper.insert(user);
    mapper.update(anotherUser);
    
    // 提交事务
    session.commit();
} catch (Exception e) {
    // 异常时会自动回滚
    e.printStackTrace();
}
```

## 官方资源

### 官方网站和文档
- **MyBatis 官网**: https://mybatis.org/mybatis-3/
- **中文官方文档**: https://mybatis.org/mybatis-3/zh/index.html
- **GitHub 仓库**: https://github.com/mybatis/mybatis-3
- **配置参考**: https://mybatis.org/mybatis-3/zh/configuration.html
- **XML 映射器**: https://mybatis.org/mybatis-3/zh/sqlmap-xml.html
- **动态 SQL**: https://mybatis.org/mybatis-3/zh/dynamic-sql.html
- **Java API**: https://mybatis.org/mybatis-3/zh/java-api.html
-  **mybatis-plus**: https://baomidou.com/

### Spring 集成
- **MyBatis-Spring**: https://mybatis.org/spring/
- **MyBatis-Spring-Boot-Starter**: https://mybatis.org/spring-boot-starter/

## 第三方教程资源

### 视频教程
- **尚硅谷 MyBatis 教程**: https://www.bilibili.com/video/BV1mW411M737
- **黑马程序员 MyBatis**: https://www.bilibili.com/video/BV1Qf4y1T7Hx
- **动力节点 MyBatis**: https://www.bilibili.com/video/BV1JP4y1Z73S

### 博客教程
- **菜鸟教程 MyBatis**: https://www.runoob.com/mybatis/mybatis-tutorial.html
- **易百教程 MyBatis**: https://www.yiibai.com/mybatis/
- **廖雪峰 MyBatis 教程**: https://www.liaoxuefeng.com/wiki/1252599548343744/1282381977747489

### GitHub 示例项目
- **MyBatis 官方示例**: https://github.com/mybatis/mybatis-3/tree/master/src/test/java/org/apache/ibatis
- **Spring Boot + MyBatis 示例**: https://github.com/mybatis/spring-boot-starter/tree/master/mybatis-spring-boot-samples
- **MyBatis Generator 示例**: https://github.com/mybatis/generator

### 实用工具
- **MyBatis Generator**: https://mybatis.org/generator/
  - 自动生成 Model、Mapper 接口和 XML 文件
- **MyBatis Plus**: https://baomidou.com/
  - MyBatis 的增强工具，提供更多便捷功能
- **PageHelper**: https://github.com/pagehelper/Mybatis-PageHelper
  - MyBatis 分页插件

### 社区资源
- **Stack Overflow MyBatis 标签**: https://stackoverflow.com/questions/tagged/mybatis
- **MyBatis 用户群组**: https://groups.google.com/g/mybatis-user
- **掘金 MyBatis 专栏**: https://juejin.cn/tag/MyBatis

## 总结

MyBatis 是一个功能强大且灵活的持久层框架，它在简化数据库操作的同时保持了 SQL 的灵活性。通过合理使用其各种特性，可以构建出高效、可维护的数据访问层。

建议初学者按照以下步骤学习：
1. 首先掌握基本的配置和简单的 CRUD 操作
2. 学习动态 SQL 的使用
3. 理解结果映射和关联查询
4. 掌握缓存机制和事务管理
5. 在实际项目中应用最佳实践

希望这个教程能帮助您快速上手 MyBatis！