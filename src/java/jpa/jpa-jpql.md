---
title: JPQL语言完整指南
category:
  - 持久层框架
tag:
  - Jpa
---

# JPQL语言完整指南

## 目录
- [什么是JPQL](#什么是jpql)
- [基本语法](#基本语法)
- [查询语句类型](#查询语句类型)
- [条件查询](#条件查询)
- [参数传递](#参数传递)
- [动态条件查询](#动态条件查询)
- [联表查询](#联表查询)
- [聚合函数](#聚合函数)
- [排序和分页](#排序和分页)
- [子查询](#子查询)
- [原生SQL vs JPQL](#原生sql-vs-jpql)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 什么是JPQL

JPQL（Java Persistence Query Language）是Java持久化API（JPA）中定义的查询语言。它是一种面向对象的查询语言，类似于SQL，但操作的是实体对象而非数据库表。

### JPQL的特点
- **面向对象**：查询基于实体类和属性，而不是表和列
- **数据库无关**：相同的JPQL语句可以在不同数据库上运行
- **类型安全**：在编译时检查语法错误
- **功能丰富**：支持复杂查询、聚合、分组等操作

## 基本语法

### 基本结构
```jpql
SELECT 选择表达式
FROM 实体名 [别名]
[WHERE 条件表达式]
[GROUP BY 分组表达式]
[HAVING 分组条件]
[ORDER BY 排序表达式]
```

### 实体命名约定
```jpql
-- 使用实体类名，不是表名
SELECT u FROM User u WHERE u.name = 'John'

-- 别名使用（推荐）
SELECT user FROM User user WHERE user.age > 18
```

## 查询语句类型

### 1. 查询语句（SELECT）
```jpql
-- 查询全部字段
SELECT u FROM User u

-- 查询特定字段
SELECT u.name, u.email FROM User u

-- 使用构造函数
SELECT NEW com.example.UserDTO(u.name, u.email) FROM User u
```

### 2. 更新语句（UPDATE）
```jpql
UPDATE User u SET u.lastLogin = CURRENT_TIMESTAMP WHERE u.id = :userId
```

### 3. 删除语句（DELETE）
```jpql
DELETE FROM User u WHERE u.active = false
```

## 条件查询

### 基本条件操作符
```jpql
-- 等于
SELECT u FROM User u WHERE u.status = 'ACTIVE'

-- 不等于
SELECT u FROM User u WHERE u.status <> 'INACTIVE'

-- 比较操作符
SELECT u FROM User u WHERE u.age >= 18 AND u.age <= 65

-- 空值判断
SELECT u FROM User u WHERE u.email IS NOT NULL

-- 模糊查询
SELECT u FROM User u WHERE u.name LIKE '%John%'

-- IN 操作符
SELECT u FROM User u WHERE u.role IN ('ADMIN', 'USER')

-- BETWEEN 操作符
SELECT u FROM User u WHERE u.createTime BETWEEN :startDate AND :endDate
```

### 逻辑操作符
```jpql
-- AND 操作符
SELECT u FROM User u WHERE u.age > 18 AND u.status = 'ACTIVE'

-- OR 操作符
SELECT u FROM User u WHERE u.role = 'ADMIN' OR u.role = 'SUPER_ADMIN'

-- NOT 操作符
SELECT u FROM User u WHERE NOT u.deleted = true
```

## 参数传递

### 位置参数（不推荐）
```java
@Query("SELECT u FROM User u WHERE u.name = ?1 AND u.age = ?2")
List<User> findByNameAndAge(String name, Integer age);
```

### 命名参数（推荐）
```java
@Query("SELECT u FROM User u WHERE u.name = :name AND u.age = :age")
List<User> findByNameAndAge(@Param("name") String name, @Param("age") Integer age);
```

### SpEL表达式参数
```java
@Query("SELECT u FROM User u WHERE u.name = :#{#user.name}")
List<User> findByUser(@Param("user") User user);
```

## 动态条件查询

### 处理可能为空的参数

#### 方式一：使用原生SQL的IF函数
```java
@Query(value = "SELECT * FROM user WHERE " +
       "IF(:name != '', name = :name, 1=1) AND " +
       "IF(:email != '', email = :email, 1=1) AND " +
       "IF(:status != '', status = :status, 1=1)", 
       nativeQuery = true)
List<User> findByDynamicConditions(@Param("name") String name, 
                                  @Param("email") String email, 
                                  @Param("status") String status);
```

#### 方式二：使用NULL检查和OR条件
```java
@Query("SELECT u FROM User u WHERE " +
       "(:name IS NULL OR :name = '' OR u.name = :name) AND " +
       "(:email IS NULL OR :email = '' OR u.email = :email) AND " +
       "(:status IS NULL OR :status = '' OR u.status = :status)")
List<User> findByDynamicConditions(@Param("name") String name, 
                                  @Param("email") String email, 
                                  @Param("status") String status);
```

#### 方式三：使用Specification（推荐）
```java
public class UserSpecification {
    public static Specification<User> hasName(String name) {
        return (root, query, criteriaBuilder) -> 
            StringUtils.hasText(name) ? 
                criteriaBuilder.equal(root.get("name"), name) : 
                criteriaBuilder.conjunction();
    }
    
    public static Specification<User> hasEmail(String email) {
        return (root, query, criteriaBuilder) -> 
            StringUtils.hasText(email) ? 
                criteriaBuilder.equal(root.get("email"), email) : 
                criteriaBuilder.conjunction();
    }
}

// 使用方式
Specification<User> spec = Specification.where(null);
if (StringUtils.hasText(name)) {
    spec = spec.and(UserSpecification.hasName(name));
}
if (StringUtils.hasText(email)) {
    spec = spec.and(UserSpecification.hasEmail(email));
}
List<User> users = userRepository.findAll(spec);
```

## 联表查询

### 内连接（INNER JOIN）
```jpql
SELECT u, p FROM User u INNER JOIN u.profile p WHERE p.city = 'Beijing'
```

### 左外连接（LEFT JOIN）
```jpql
SELECT u, o FROM User u LEFT JOIN u.orders o WHERE u.status = 'ACTIVE'
```

### FETCH JOIN（解决N+1问题）
```jpql
SELECT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :userId
```

### 多表联查示例
```java
@Query("SELECT u.name, p.city, o.totalAmount " +
       "FROM User u " +
       "LEFT JOIN u.profile p " +
       "LEFT JOIN u.orders o " +
       "WHERE u.createTime >= :startDate")
List<Object[]> findUserOrderInfo(@Param("startDate") LocalDateTime startDate);
```

## 聚合函数

### 基本聚合函数
```jpql
-- 计数
SELECT COUNT(u) FROM User u WHERE u.status = 'ACTIVE'

-- 求和
SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = 'COMPLETED'

-- 平均值
SELECT AVG(u.age) FROM User u

-- 最大值/最小值
SELECT MAX(o.createTime), MIN(o.createTime) FROM Order o
```

### 分组查询
```jpql
SELECT u.department, COUNT(u), AVG(u.salary) 
FROM User u 
GROUP BY u.department 
HAVING COUNT(u) > 5
ORDER BY u.department
```

## 排序和分页

### 排序
```jpql
-- 单字段排序
SELECT u FROM User u ORDER BY u.createTime DESC

-- 多字段排序
SELECT u FROM User u ORDER BY u.department ASC, u.salary DESC
```

### 分页查询
```java
@Query("SELECT u FROM User u WHERE u.status = :status")
Page<User> findByStatus(@Param("status") String status, Pageable pageable);

// 使用方式
Pageable pageable = PageRequest.of(0, 10, Sort.by("createTime").descending());
Page<User> users = userRepository.findByStatus("ACTIVE", pageable);
```

## 子查询

### EXISTS子查询
```jpql
SELECT u FROM User u 
WHERE EXISTS (
    SELECT o FROM Order o WHERE o.user = u AND o.status = 'PENDING'
)
```

### IN子查询
```jpql
SELECT u FROM User u 
WHERE u.id IN (
    SELECT DISTINCT o.user.id FROM Order o WHERE o.totalAmount > 1000
)
```

### 比较子查询
```jpql
SELECT u FROM User u 
WHERE u.salary > (
    SELECT AVG(u2.salary) FROM User u2 WHERE u2.department = u.department
)
```

## 原生SQL vs JPQL

### 何时使用原生SQL
```java
// 复杂的数据库特定函数
@Query(value = "SELECT DATE_FORMAT(create_time, '%Y-%m') as month, COUNT(*) " +
               "FROM user GROUP BY DATE_FORMAT(create_time, '%Y-%m')", 
       nativeQuery = true)
List<Object[]> getUserCountByMonth();

// 数据库特定的优化查询
@Query(value = "SELECT /*+ USE_INDEX(user, idx_user_email) */ * FROM user WHERE email = ?1", 
       nativeQuery = true)
User findByEmailWithHint(String email);
```

### JPQL的优势
```java
// 跨数据库兼容
@Query("SELECT u FROM User u WHERE u.createTime >= :date")
List<User> findRecentUsers(@Param("date") LocalDateTime date);

// 面向对象，易于维护
@Query("SELECT u FROM User u JOIN FETCH u.profile WHERE u.status = 'ACTIVE'")
List<User> findActiveUsersWithProfile();
```

## 最佳实践

### 1. 命名规范
```java
// 好的命名
@Query("SELECT u FROM User u WHERE u.email = :email AND u.status = :status")
List<User> findActiveUsersByEmail(@Param("email") String email, @Param("status") String status);

// 避免使用位置参数
@Query("SELECT u FROM User u WHERE u.email = ?1") // 不推荐
```

### 2. 参数验证
```java
@Query("SELECT u FROM User u WHERE " +
       "(:email IS NULL OR TRIM(:email) = '' OR u.email = :email)")
List<User> findByEmail(@Param("email") String email);
```

### 3. 性能优化
```java
// 使用FETCH JOIN避免N+1问题
@Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.id = :userId")
User findUserWithOrders(@Param("userId") Long userId);

// 只查询需要的字段
@Query("SELECT new com.example.UserDTO(u.id, u.name, u.email) FROM User u")
List<UserDTO> findAllUserDTOs();
```

### 4. 事务管理
```java
@Modifying
@Transactional
@Query("UPDATE User u SET u.lastLogin = CURRENT_TIMESTAMP WHERE u.id = :userId")
int updateLastLogin(@Param("userId") Long userId);
```

## 常见问题

### 1. N+1查询问题
```java
// 问题代码
@Query("SELECT u FROM User u WHERE u.department = :dept")
List<User> findByDepartment(@Param("dept") String dept);
// 访问 user.getOrders() 时会产生N+1查询

// 解决方案
@Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders WHERE u.department = :dept")
List<User> findByDepartmentWithOrders(@Param("dept") String dept);
```

### 2. 批量操作优化
```java
// 批量更新
@Modifying
@Query("UPDATE User u SET u.status = :newStatus WHERE u.id IN :userIds")
int batchUpdateStatus(@Param("newStatus") String newStatus, @Param("userIds") List<Long> userIds);

// 批量删除
@Modifying
@Query("DELETE FROM User u WHERE u.lastLogin < :cutoffDate")
int deleteInactiveUsers(@Param("cutoffDate") LocalDateTime cutoffDate);
```

### 3. 复杂条件查询
```java
// 使用Criteria API处理复杂动态查询
@Repository
public class UserRepositoryImpl implements UserRepositoryCustom {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public List<User> findByCriteria(UserSearchCriteria criteria) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> query = cb.createQuery(User.class);
        Root<User> root = query.from(User.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        if (StringUtils.hasText(criteria.getName())) {
            predicates.add(cb.like(root.get("name"), "%" + criteria.getName() + "%"));
        }
        
        if (criteria.getAgeMin() != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("age"), criteria.getAgeMin()));
        }
        
        if (criteria.getAgeMax() != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("age"), criteria.getAgeMax()));
        }
        
        query.where(predicates.toArray(new Predicate[0]));
        query.orderBy(cb.desc(root.get("createTime")));
        
        return entityManager.createQuery(query).getResultList();
    }
}
```

### 4. 日期时间处理
```java
// 日期范围查询
@Query("SELECT u FROM User u WHERE u.createTime BETWEEN :startDate AND :endDate")
List<User> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                          @Param("endDate") LocalDateTime endDate);

// 使用日期函数
@Query("SELECT u FROM User u WHERE YEAR(u.createTime) = :year")
List<User> findByYear(@Param("year") Integer year);
```

### 5. 空值处理最佳实践
```java
// 组合条件的空值处理
@Query("SELECT u FROM User u WHERE " +
       "(:name IS NULL OR TRIM(:name) = '' OR LOWER(u.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
       "(:status IS NULL OR u.status = :status) AND " +
       "(:departmentId IS NULL OR u.department.id = :departmentId)")
List<User> searchUsers(@Param("name") String name, 
                      @Param("status") String status, 
                      @Param("departmentId") Long departmentId);
```

## 官方文档和参考资料

### 官方规范文档
- **Jakarta Persistence Specification**  
  https://jakarta.ee/specifications/persistence/  
  Jakarta EE官方的JPA规范文档，包含完整的JPQL语法定义

- **Oracle JPA Documentation**  
  https://docs.oracle.com/html/E13946_04/ejb3_langref.html  
  Oracle官方的JPA语言参考文档，详细介绍JPQL语法

- **OpenJPA Language Reference**  
  https://openjpa.apache.org/builds/1.2.3/apache-openjpa/docs/jpa_langref.html  
  Apache OpenJPA的JPQL语言参考

### 主流JPA实现文档
- **Hibernate ORM Documentation**  
  https://hibernate.org/orm/documentation/  
  Hibernate官方文档，包含HQL和JPQL的详细说明

- **Hibernate User Guide - HQL and JPQL**  
  https://docs.jboss.org/hibernate/stable/orm/userguide/html_single/Hibernate_User_Guide.html  
  Hibernate用户指南中关于HQL和JPQL的章节

- **EclipseLink JPQL Extensions**  
  https://docs.oracle.com/middleware/1221/toplink/jpa-extensions-reference/jpql.htm  
  EclipseLink对JPQL的扩展功能文档

### Spring框架相关文档
- **Spring Data JPA Reference**  
  https://docs.spring.io/spring-data/jpa/docs/current/reference/html/  
  Spring Data JPA官方文档，包含@Query注解和JPQL使用

- **Spring Data JPA Query Methods**  
  https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html  
  Spring Data JPA查询方法的详细文档

### 权威第三方教程和博客
- **Thorben Janssen's JPQL Guide**  
  https://thorben-janssen.com/jpql/  
  Hibernate专家Thorben Janssen的JPQL详细教程

- **Baeldung JPA Tutorials**  
  https://www.baeldung.com/category/persistence/jpa/  
  Baeldung网站的JPA和JPQL系列教程

- **TutorialsPoint JPA JPQL**  
  https://www.tutorialspoint.com/jpa/jpa_jpql.htm  
  TutorialsPoint的JPQL基础教程

- **ObjectDB JPQL Reference**  
  https://www.objectdb.com/java/jpa/query/jpql/structure  
  ObjectDB提供的JPQL结构和语法参考

### 社区和论坛资源
- **Stack Overflow JPA标签**  
  https://stackoverflow.com/questions/tagged/jpa  
  JPQL相关问题和解答的权威社区

- **JPA/Hibernate官方论坛**  
  https://discourse.hibernate.org/  
  Hibernate官方社区论坛

- **Reddit JPA社区**  
  https://www.reddit.com/r/java/ (JPA相关讨论)  
  Java开发者社区中的JPA讨论

### 在线工具和测试环境
- **JPQL Tester (JSFiddle风格)**  
  可以在一些在线IDE中测试JPQL语句

- **H2 Database Console**  
  用于快速测试JPQL查询的轻量级数据库

### 书籍推荐
- **"Pro JPA 2 in Java EE 8"** - Mike Keith, Merrick Schincariol
- **"Java Persistence with Hibernate"** - Christian Bauer, Gavin King
- **"High-Performance Java Persistence"** - Vlad Mihalcea

### 规范变更历史
- **JPA 1.0 (JSR 220)** - 初始版本
- **JPA 2.0 (JSR 317)** - 添加Criteria API、更多JPQL功能
- **JPA 2.1 (JSR 338)** - 存储过程、批量更新等
- **JPA 2.2 (JSR 365)** - Java 8支持、Stream API
- **Jakarta Persistence 3.0+** - 命名空间变更，持续演进

## 总结

JPQL是JPA中强大的查询语言，它提供了面向对象的查询方式，使得数据库操作更加直观和类型安全。掌握JPQL的关键在于：

1. 理解面向对象的查询思维
2. 熟练使用参数绑定和动态条件
3. 合理使用FETCH JOIN优化性能
4. 根据场景选择JPQL或原生SQL
5. 遵循最佳实践，编写可维护的代码

通过本指南的学习和实践，结合上述官方文档和权威资源，您应该能够熟练使用JPQL完成各种复杂的数据库查询任务。建议从官方规范文档开始深入学习，然后结合具体的JPA实现（如Hibernate）文档进行实践。