---
title: Spring Data JPA教程
category:
  - 持久层框架
tag:
  - Jpa
---

# Spring Data JPA 完整教程

## 目录
1. [Spring Data JPA 简介](#spring-data-jpa-简介)
2. [基础配置](#基础配置)
3. [实体类定义](#实体类定义)
4. [Repository 接口](#repository-接口)
5. [查询方法](#查询方法)
6. [自定义查询与模糊查询](#自定义查询与模糊查询)
7. [分页和排序](#分页和排序)
8. [事务管理](#事务管理)
9. [最佳实践](#最佳实践)

## Spring Data JPA 简介

Spring Data JPA 是 Spring 生态系统中的一个重要组件，它建立在 JPA（Java Persistence API）之上，提供了更高级的抽象和更简洁的数据访问方式。通过 Spring Data JPA，开发者可以大大减少样板代码，专注于业务逻辑的实现。

### 核心特性
- **自动实现Repository接口**：无需手动编写实现类
- **方法名查询**：通过方法名自动生成查询
- **自定义查询支持**：支持 JPQL 和原生 SQL
- **分页和排序**：内置分页排序功能
- **审计功能**：自动记录创建时间、修改时间等

### 基本示例
```java
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByUsername(String username);
    
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    User findByEmail(String email);
}
```

## 基础配置

### Maven 依赖
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
</dependencies>
```

### 配置文件 (application.yml)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/mydb?useUnicode=true&characterEncoding=utf8
    username: root
    password: password
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQL8Dialect
        format_sql: true
```

### Java 配置类
```java
@Configuration
@EnableJpaRepositories(basePackages = "com.example.repository")
@EnableTransactionManagement
public class JpaConfig {
    
    @Bean
    public LocalContainerEntityManagerFactoryBean entityManagerFactory() {
        LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
        em.setDataSource(dataSource());
        em.setPackagesToScan("com.example.entity");
        
        JpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
        em.setJpaVendorAdapter(vendorAdapter);
        
        return em;
    }
}
```

## 实体类定义

### 基础实体类
```java
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String username;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "created_time")
    @CreationTimestamp
    private LocalDateTime createdTime;
    
    @Column(name = "updated_time")
    @UpdateTimestamp
    private LocalDateTime updatedTime;
    
    // 构造函数、getter、setter 省略
}
```

### 实体关系映射
```java
@Entity
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String title;
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;
    
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();
}

@Entity
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User author;
}
```

## Repository 接口

### 基础 Repository
```java
public interface UserRepository extends JpaRepository<User, Long> {
    // 基础 CRUD 操作已经包含在 JpaRepository 中
}
```

### 方法名查询
```java
public interface UserRepository extends JpaRepository<User, Long> {
    // 简单查询
    List<User> findByUsername(String username);
    User findByEmail(String email);
    
    // 条件查询
    List<User> findByUsernameAndEmail(String username, String email);
    List<User> findByUsernameOrEmail(String username, String email);
    
    // 模糊查询
    List<User> findByUsernameContaining(String username);
    List<User> findByUsernameStartingWith(String prefix);
    List<User> findByUsernameEndingWith(String suffix);
    
    // 排序查询
    List<User> findByUsernameOrderByCreatedTimeDesc(String username);
    
    // 限制结果数量
    User findFirstByUsername(String username);
    List<User> findTop10ByOrderByCreatedTimeDesc();
    
    // 存在性查询
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    // 计数查询
    long countByUsername(String username);
    
    // 删除操作
    void deleteByUsername(String username);
    long deleteByEmail(String email);
}
```

## 查询方法

### 使用 @Query 注解

#### JPQL 查询
```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query("SELECT u FROM User u WHERE u.email = ?1")
    User findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.username = :username AND u.email = :email")
    User findByUsernameAndEmail(@Param("username") String username, 
                               @Param("email") String email);
    
    @Query("SELECT u FROM User u WHERE u.createdTime BETWEEN ?1 AND ?2")
    List<User> findUsersByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdTime > ?1")
    long countUsersCreatedAfter(LocalDateTime date);
}
```

#### 原生 SQL 查询
```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Query(value = "SELECT * FROM users WHERE username = ?1", nativeQuery = true)
    User findByUsernameNative(String username);
    
    @Query(value = "SELECT u.*, COUNT(p.id) as post_count " +
                   "FROM users u LEFT JOIN posts p ON u.id = p.user_id " +
                   "GROUP BY u.id", nativeQuery = true)
    List<Object[]> findUsersWithPostCount();
}
```

#### 修改查询
```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.email = ?2 WHERE u.username = ?1")
    int updateEmailByUsername(String username, String email);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM User u WHERE u.createdTime < ?1")
    int deleteOldUsers(LocalDateTime cutoffDate);
}
```

## 自定义查询与模糊查询

### 模糊查询的常见问题与解决方案

在 Spring Data JPA 中进行模糊查询时，直接在 @Query 注解中使用 `'%参数%'` 的方式是无法正确工作的：

```java
// ❌ 错误的做法 - 这样查询不出结果
@Query("SELECT u FROM User u WHERE u.username LIKE '%?1%'")
List<User> findUserByUsernameLike(String username);
```

### 正确的模糊查询方法

#### 方法1：使用 CONCAT 函数（推荐）
```java
@Query("SELECT u FROM User u WHERE u.username LIKE CONCAT('%', ?1, '%')")
List<User> findUsersByUsernameContaining(String username);

@Query("SELECT u FROM User u WHERE u.username LIKE CONCAT('%', :keyword, '%')")
List<User> findUsersByKeyword(@Param("keyword") String keyword);
```

#### 方法2：在参数中拼接通配符
```java
@Query("SELECT u FROM User u WHERE u.username LIKE ?1")
List<User> findUsersByUsernameLike(String usernamePattern);

// 调用时传入: findUsersByUsernameLike("%john%")
```

#### 方法3：使用方法名查询（最简单）
```java
// Spring Data JPA 会自动转换为 LIKE '%username%'
List<User> findByUsernameContaining(String username);
List<User> findByUsernameStartingWith(String prefix);
List<User> findByUsernameEndingWith(String suffix);
```

### 复杂模糊查询示例

#### 多条件模糊查询
```java
@Query("SELECT e FROM Event e WHERE " +
       "(e.title LIKE CONCAT('%', ?1, '%') OR ?1 IS NULL) AND " +
       "(DATE(e.registerTime) = DATE(?2) OR ?2 IS NULL) AND " +
       "e.status = '1' " +
       "ORDER BY e.registerTime DESC")
List<Event> findEventsByConditions(String title, LocalDateTime registerTime, 
                                  Pageable pageable);
```

#### 原生 SQL 模糊查询
```java
@Query(value = "SELECT * FROM events e " +
               "WHERE (e.event_title LIKE CONCAT('%', ?1, '%') OR ?1 IS NULL) " +
               "AND (TO_DAYS(e.register_time) = TO_DAYS(?2) OR ?2 IS NULL) " +
               "AND e.status = '1' " +
               "ORDER BY e.register_time DESC LIMIT ?3, ?4", 
       nativeQuery = true)
List<Event> findAllEvents(String eventTitle, Timestamp registerTime, 
                         Integer offset, Integer pageSize);
```

### 不同数据库的模糊查询优化

#### MySQL 数据库
```java
// 使用 CONCAT 函数
@Query("SELECT u FROM User u WHERE u.username LIKE CONCAT('%', ?1, '%')")
List<User> findByUsernameMysql(String username);

// 使用全文索引的 MATCH AGAINST（需要在表字段上创建全文索引）
@Query(value = "SELECT * FROM users WHERE MATCH(username) AGAINST(?1)", 
       nativeQuery = true)
List<User> findByUsernameFullText(String username);
```

#### Oracle 数据库
```java
// 使用 INSTR 函数（比 LIKE 效率更高）
@Query(value = "SELECT * FROM users WHERE INSTR(username, ?1) > 0", 
       nativeQuery = true)
List<User> findByUsernameOracle(String username);
```

#### PostgreSQL 数据库
```java
// 使用 ILIKE（不区分大小写）
@Query(value = "SELECT * FROM users WHERE username ILIKE %?1%", 
       nativeQuery = true)
List<User> findByUsernamePostgreSQL(String username);

// 使用正则表达式
@Query(value = "SELECT * FROM users WHERE username ~ ?1", 
       nativeQuery = true)
List<User> findByUsernameRegex(String pattern);
```

### 动态查询示例

#### 使用 Criteria API
```java
@Repository
public class UserRepositoryCustomImpl implements UserRepositoryCustom {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public List<User> findUsersByCriteria(String username, String email, 
                                         LocalDateTime startDate, LocalDateTime endDate) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<User> query = cb.createQuery(User.class);
        Root<User> root = query.from(User.class);
        
        List<Predicate> predicates = new ArrayList<>();
        
        if (username != null && !username.isEmpty()) {
            predicates.add(cb.like(root.get("username"), "%" + username + "%"));
        }
        
        if (email != null && !email.isEmpty()) {
            predicates.add(cb.like(root.get("email"), "%" + email + "%"));
        }
        
        if (startDate != null && endDate != null) {
            predicates.add(cb.between(root.get("createdTime"), startDate, endDate));
        }
        
        query.where(predicates.toArray(new Predicate[0]));
        query.orderBy(cb.desc(root.get("createdTime")));
        
        return entityManager.createQuery(query).getResultList();
    }
}
```

## 分页和排序

### 基础分页
```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    Page<User> findByUsernameContaining(String username, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.email LIKE %?1%")
    Page<User> findByEmailContaining(String email, Pageable pageable);
}
```

### 使用示例
```java
@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    public Page<User> getUsers(int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        return userRepository.findAll(pageable);
    }
    
    public Page<User> searchUsers(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, 
                           Sort.by("createdTime").descending());
        return userRepository.findByUsernameContaining(keyword, pageable);
    }
}
```

### 自定义排序
```java
// 多字段排序
Sort sort = Sort.by(
    Sort.Order.desc("createdTime"),
    Sort.Order.asc("username")
);

Pageable pageable = PageRequest.of(0, 10, sort);
```

## 事务管理

### 基础事务配置
```java
@Service
@Transactional
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    
    @Transactional(rollbackFor = Exception.class)
    public User createUser(User user) {
        // 业务逻辑
        return userRepository.save(user);
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateUserAsync(Long userId, String newEmail) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new EntityNotFoundException("User not found"));
        user.setEmail(newEmail);
        userRepository.save(user);
    }
}
```

### 事务传播行为
```java
@Service
public class OrderService {
    
    // 默认：REQUIRED
    @Transactional
    public void createOrder(Order order) {
        // 如果没有事务，创建一个；如果有事务，加入当前事务
    }
    
    // 总是创建新事务
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logOrderEvent(OrderEvent event) {
        // 总是在新事务中执行，不受外部事务影响
    }
    
    // 必须在事务中执行
    @Transactional(propagation = Propagation.MANDATORY)
    public void updateOrderStatus(Long orderId, String status) {
        // 如果没有活动事务，抛出异常
    }
}
```

## 最佳实践

### 1. Repository 设计原则
```java
// ✅ 好的做法：按业务领域划分
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findActiveUsers();
    List<User> findByRole(String role);
}

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByUserAndDateRange(User user, LocalDateTime start, LocalDateTime end);
}
```

### 2. 查询优化
```java
// ✅ 使用 @EntityGraph 解决 N+1 问题
@EntityGraph(attributePaths = {"posts", "posts.comments"})
List<User> findUsersWithPostsAndComments();

// ✅ 使用投影减少数据传输
public interface UserSummary {
    String getUsername();
    String getEmail();
    LocalDateTime getCreatedTime();
}

List<UserSummary> findAllProjectedBy();
```

### 3. 异常处理
```java
@Service
@Transactional
public class UserService {
    
    public User getUserById(Long id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException(
                "User not found with id: " + id));
    }
    
    public User createUser(User user) {
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new BusinessException("Username or email already exists");
        }
    }
}
```

### 4. 性能监控
```java
@Configuration
public class JpaConfig {
    
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return hibernateProperties -> {
            hibernateProperties.put("hibernate.generate_statistics", true);
            hibernateProperties.put("hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS", 1000);
        };
    }
}
```

### 5. 缓存配置
```java
@Entity
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class User {
    // 实体定义
}

// 在 Repository 中使用查询缓存
@QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
@Query("SELECT u FROM User u WHERE u.status = 'ACTIVE'")
List<User> findActiveUsers();
```

## 总结

Spring Data JPA 提供了强大而灵活的数据访问能力，通过合理使用其特性可以大大提高开发效率。在实际项目中，建议：

1. **优先使用方法名查询**：对于简单查询，方法名查询最为简洁
2. **复杂查询使用 @Query**：对于复杂业务逻辑，使用 JPQL 或原生 SQL
3. **注意性能优化**：合理使用懒加载、投影、缓存等技术
4. **规范事务管理**：正确配置事务边界和传播行为
5. **做好异常处理**：提供友好的错误信息和恰当的异常处理

通过掌握这些知识点和最佳实践，你可以更好地使用 Spring Data JPA 构建高效、可维护的数据访问层。