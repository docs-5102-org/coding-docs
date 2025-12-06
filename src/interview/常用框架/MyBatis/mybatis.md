---
title: MyBatis 面试题详解
category:
  - 面试题
date: 2025-11-28
---

# MyBatis 面试题详解

## 1. MyBatis 中 #{}和 ${}的区别是什么？

### 核心区别

**#{}（预编译处理）：**
- MyBatis 会将 SQL 中的 #{} 替换为 `?` 占位符
- 使用 PreparedStatement 的 set 方法进行参数赋值
- 参数会被当作字符串处理，自动添加引号
- **有效防止 SQL 注入**，保证程序安全

**${}（字符串替换）：**
- 直接进行字符串拼接，不经过预编译
- 在 SQL 解析阶段就完成变量替换
- 不会自动添加引号
- **存在 SQL 注入风险**

### 使用场景

**#{}适用场景（推荐优先使用）：**
- 传递普通参数值，如：`SELECT * FROM user WHERE id = #{id}`
- 所有可能存在 SQL 注入风险的场景

**${}适用场景（谨慎使用）：**
- 动态表名：`SELECT * FROM ${tableName}`
- 动态列名：`ORDER BY ${columnName}`
- 动态 SQL 片段拼接
- 注意：这些场景下必须严格校验输入，避免注入风险

### 示例对比

```sql
-- 使用 #{} 
SELECT * FROM user WHERE name = #{userName}
-- 实际执行：SELECT * FROM user WHERE name = ?
-- 参数 'admin' 会被处理为：SELECT * FROM user WHERE name = 'admin'

-- 使用 ${}
SELECT * FROM user WHERE name = ${userName}
-- 实际执行：SELECT * FROM user WHERE name = admin
-- 如果传入 "admin' OR '1'='1"，会导致 SQL 注入
```

---

## 2. MyBatis 有几种分页方式？

### 两种分页方式

**逻辑分页（内存分页）：**
- 使用 MyBatis 自带的 RowBounds 进行分页
- 一次性查询大量数据到内存
- 在应用层内存中进行数据筛选和分页
- 适用于数据量小的场景

**物理分页（数据库分页）：**
- 通过数据库的分页语法直接查询指定数据
- 手写 SQL：`LIMIT offset, size`（MySQL）
- 使用分页插件：如 PageHelper、MyBatis-Plus
- 适用于数据量大的生产环境

### 分页实现示例

```xml
<!-- 逻辑分页 -->
List<User> users = sqlSession.selectList("selectAllUsers", null, new RowBounds(offset, limit));

<!-- 物理分页 - 手写 SQL -->
<select id="selectUsersByPage" resultType="User">
    SELECT * FROM user 
    LIMIT #{offset}, #{limit}
</select>

<!-- 物理分页 - PageHelper 插件 -->
PageHelper.startPage(pageNum, pageSize);
List<User> users = userMapper.selectAllUsers();
```

---

## 3. RowBounds 是一次性查询全部结果吗？为什么？

### 工作原理

**RowBounds 并非一次性查询所有数据**，原因如下：

1. **MyBatis 基于 JDBC 封装**
   - JDBC 驱动有 Fetch Size 配置
   - 控制每次从数据库获取的记录数
   - 默认情况下会分批次获取数据

2. **流式查询机制**
   - 当调用 ResultSet.next() 时，JDBC 会自动获取下一批数据
   - 类似于"分页流式读取"
   - 避免一次性加载过多数据导致内存溢出

3. **Fetch Size 作用**
   - 假设查询 10000 条数据，Fetch Size = 2500
   - 数据库会分 4 次返回结果
   - 每次 next() 操作会触发新的数据获取

> [rowbounds原理详解](./)

### 注意事项

- 虽然是分批获取，但逻辑上仍然是全表扫描
- 性能瓶颈在于数据库需要查询全部数据
- 大数据量场景下，物理分页性能更优

---

## 4. MyBatis 逻辑分页和物理分页的区别是什么？

### 详细对比

| 对比维度 | 逻辑分页 | 物理分页 |
|---------|---------|---------|
| **实现位置** | 应用层（内存） | 数据库层 |
| **SQL 语句** | 查询全部数据 | 使用 LIMIT/OFFSET 等语法 |
| **数据传输量** | 传输所有数据 | 只传输当前页数据 |
| **内存消耗** | 高（需存储全部数据） | 低（只存储当前页） |
| **数据库压力** | 大（全表扫描） | 小（精确查询） |
| **网络开销** | 大 | 小 |
| **性能表现** | 数据量大时性能差 | 性能稳定 |
| **内存溢出风险** | 高 | 低 |
| **适用场景** | 小数据量（<1000 条） | 生产环境、大数据量 |

### 性能建议

- **数据量 < 1000 条**：逻辑分页可接受
- **数据量 > 1000 条**：强烈推荐物理分页
- **生产环境**：统一使用物理分页，避免性能问题

---

## 5. MyBatis 是否支持延迟加载？延迟加载的原理是什么？

### 延迟加载支持

MyBatis **支持延迟加载**，但仅限于以下关联查询：
- **association（英 [əˌsəʊsiˈeɪʃn]）**：一对一关联
- **collection**：一对多关联

### 配置方式

```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启延迟加载 -->
    <setting name="lazyLoadingEnabled" value="true"/>
    <!-- 按需加载（推荐） -->
    <setting name="aggressiveLazyLoading" value="false"/>
</settings>
```

### 实现原理

**核心机制：动态代理 + 延迟查询**

1. **代理对象生成**
   - MyBatis 为关联对象创建代理对象
   - 初始时关联属性为 null

2. **触发加载时机**
   - 当调用 `a.getB().getName()` 时
   - 检测到 `a.getB()` 为 null
   - 触发预存的关联查询 SQL

3. **执行流程**
   ```java
   User user = userMapper.selectById(1);  // 只查询 user 表
   // 此时 user.getOrders() 为代理对象，未查询 orders 表
   
   List<Order> orders = user.getOrders();  // 触发延迟加载
   // 此时才执行：SELECT * FROM orders WHERE user_id = 1
   ```

### 底层技术

- **CGLIB 代理**：为实体类生成代理子类
- **Javassist**：字节码增强技术
- **拦截器模式**：拦截 getter 方法调用

### 使用场景

**适合使用延迟加载：**
- 关联数据不总是需要
- 关联查询数据量大
- 需要优化首次查询性能

**不适合延迟加载：**
- 关联数据必定使用（会产生 N+1 查询问题）
- 需要批量加载数据
- Session 可能提前关闭

---

## 6. 说一下 MyBatis 的一级缓存和二级缓存？

### 一级缓存（Session 级别）

**特性：**
- 基于 `PerpetualCache` 的 HashMap 实现
- 作用域：SqlSession 级别
- 生命周期：与 SqlSession 一致
- 默认开启，无法关闭

**工作机制：**
```java
SqlSession session = sqlSessionFactory.openSession();
User user1 = session.selectOne("selectUser", 1);  // 查询数据库
User user2 = session.selectOne("selectUser", 1);  // 从缓存读取
// user1 == user2  返回同一对象

session.commit();  // 提交后清空缓存
session.close();   // 关闭后清空缓存
```

**缓存失效场景：**
1. SqlSession 执行 commit()、close()、clearCache()
2. 执行任何 INSERT、UPDATE、DELETE 操作
3. 查询参数不同
4. 查询语句不同

**注意事项：**
- 多个 SqlSession 之间缓存不共享
- 分布式环境可能出现脏数据
- 同一 SqlSession 内的 UPDATE 操作会清空缓存

### 二级缓存（Mapper 级别）

**特性：**
- 同样基于 `PerpetualCache` 的 HashMap
- 作用域：Mapper（namespace）级别
- 多个 SqlSession 可共享
- 默认关闭，需手动开启

**开启方式：**

```xml
<!-- mybatis-config.xml -->
<settings>
    <setting name="cacheEnabled" value="true"/>
</settings>

<!-- UserMapper.xml -->
<mapper namespace="com.xx.UserMapper">
<cache 
    eviction="LRU"           <!-- 缓存回收策略 -->
    flushInterval="60000"    <!-- 刷新间隔（毫秒） -->
    size="512"               <!-- 缓存对象数量 -->
    readOnly="false"/>       <!-- 是否只读 -->
</mapper>

<!-- 实体类需实现 Serializable -->
public class User implements Serializable {
    // ...
}
```

**缓存回收策略：**
- **LRU**（默认）：最近最少使用，移除最长时间不用的对象
- **FIFO**：先进先出，按对象进入缓存顺序移除
- **SOFT**：软引用，基于 GC 状态移除
- **WEAK**：弱引用，更积极的 GC 移除

**查询优先级：**
```
二级缓存 → 一级缓存 → 数据库
```

**缓存更新机制：**
- 执行 INSERT、UPDATE、DELETE 操作
- 默认清空该 Mapper 下的所有缓存
- 可通过 `flushCache="false"` 控制

### 自定义缓存

**集成 Redis：**
```xml
<cache type="org.mybatis.caches.redis.RedisCache">
    <property name="host" value="127.0.0.1"/>
    <property name="port" value="6379"/>
</cache>
```

**集成 Ehcache：**
```xml
<cache type="org.mybatis.caches.ehcache.EhcacheCache">
    <property name="timeToLiveSeconds" value="3600"/>
</cache>
```

### 使用建议

**推荐方案：**
- 一级缓存：保持默认开启
- 二级缓存：生产环境慎用，推荐使用 Redis 等分布式缓存
- 分布式系统：统一使用 Redis、Memcached 等外部缓存

**注意事项：**
- 二级缓存可能导致脏读（多表关联时）
- 需要保证缓存一致性
- 缓存雪崩、缓存穿透等问题需考虑

---

## 7. MyBatis 和 Hibernate 的区别有哪些？

### 全面对比

| 对比维度 | MyBatis | Hibernate |
|---------|---------|-----------|
| **ORM 程度** | 半自动化（SQL 需手写） | 全自动化（HQL/自动生成 SQL） |
| **灵活性** | 高（可精细控制 SQL） | 较低（HQL 限制） |
| **学习成本** | 低（SQL 基础即可） | 高（需学习 HQL、缓存机制等） |
| **开发效率** | 中等（需编写 SQL） | 高（CRUD 自动生成） |
| **SQL 优化** | 容易（直接优化 SQL） | 困难（需调优配置） |
| **数据库移植性** | 差（SQL 语法依赖数据库） | 好（HQL 跨数据库） |
| **复杂查询** | 强（原生 SQL 支持） | 弱（复杂查询需原生 SQL） |
| **二级缓存** | 基础实现 | 强大（支持查询缓存、集合缓存） |
| **动态 SQL** | 强（标签丰富） | 弱 |
| **适用场景** | 需求多变、SQL 优化要求高 | 标准 CRUD、快速开发 |

### 技术特点

**MyBatis 优势：**
- SQL 与代码分离，便于维护和优化
- 支持动态 SQL，灵活性高
- 学习曲线平缓
- 适合复杂业务和性能调优

**Hibernate 优势：**
- 完全面向对象，减少 SQL 编写
- 数据库移植性好
- 标准 JPA 实现
- 强大的缓存机制

### 选型建议

**选择 MyBatis：**
- 项目对 SQL 性能要求高
- 业务逻辑复杂，需要灵活的 SQL
- 团队熟悉 SQL
- 需要与遗留系统集成

**选择 Hibernate：**
- 标准 CRUD 为主
- 需要跨数据库
- 快速开发原型
- 团队熟悉 JPA

---

## 8. MyBatis 有哪些执行器（Executor）？

### 三种执行器

**1. SimpleExecutor（简单执行器）**

**特点：**
- 每次执行 SQL 都创建新的 Statement
- 执行完成后立即关闭 Statement
- 默认执行器

**适用场景：**
- 普通的 CRUD 操作
- 对性能要求不高的场景

**执行流程：**
```java
// 每次都是：创建 Statement → 执行 SQL → 关闭 Statement
Statement stmt1 = conn.prepareStatement(sql1);
stmt1.execute();
stmt1.close();

Statement stmt2 = conn.prepareStatement(sql2);
stmt2.execute();
stmt2.close();
```

---

**2. ReuseExecutor（重用执行器）**

**特点：**
- 以 SQL 作为 key 缓存 Statement 对象
- 相同 SQL 复用 Statement，避免重复创建
- 执行完不关闭，存入 Map 供下次使用

**适用场景：**
- 有大量重复 SQL 执行
- 需要提升 Statement 创建性能

**执行流程：**
```java
// 第一次执行
Statement stmt = map.get(sql);
if (stmt == null) {
    stmt = conn.prepareStatement(sql);
    map.put(sql, stmt);
}
stmt.execute();
// 不关闭，保存在 Map 中

// 第二次执行相同 SQL
Statement stmt = map.get(sql);  // 直接获取复用
stmt.execute();
```

**性能提升：**
- 避免重复 SQL 解析
- 减少 Statement 对象创建开销
- 适合预编译语句频繁执行的场景

---

**3. BatchExecutor（批处理执行器）**

**特点：**
- 仅支持 UPDATE 操作（INSERT、UPDATE、DELETE）
- 不支持 SELECT（JDBC 批处理限制）
- 将 SQL 添加到批处理队列
- 统一执行 executeBatch()

**适用场景：**
- 批量插入、更新、删除
- 大数据量导入
- 需要提升写入性能

**执行流程：**
```java
// 批量添加 SQL
stmt.addBatch(sql1);
stmt.addBatch(sql2);
stmt.addBatch(sql3);
// ... 添加多条 SQL

// 统一执行
stmt.executeBatch();
```

**使用示例：**
```xml
<!-- 批量插入 -->
<insert id="batchInsert">
    INSERT INTO user (name, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age})
    </foreach>
</insert>
```

**性能优势：**
- 减少数据库交互次数
- 批量发送 SQL，降低网络开销
- 数据库可优化批量执行计划

---

### 执行器配置

**全局配置：**
```xml
<settings>
    <setting name="defaultExecutorType" value="SIMPLE"/>
    <!-- SIMPLE | REUSE | BATCH -->
</settings>
```

**编程式指定：**
```java
// 创建 SqlSession 时指定
SqlSession session = sqlSessionFactory.openSession(ExecutorType.BATCH);
```

### 性能对比

| 执行器 | 性能 | 适用场景 |
|--------|------|---------|
| SimpleExecutor | 基准 | 日常 CRUD |
| ReuseExecutor | +10%~30% | 重复 SQL 多 |
| BatchExecutor | +50%~200% | 批量写入 |

---

## 9. MyBatis 分页插件的实现原理是什么？

### 核心原理
分页插件基于 MyBatis 的插件机制（Interceptor）实现，主要工作流程如下：

1. **拦截 SQL 执行**：通过实现 `Interceptor` 接口，拦截 `Executor` 的 `query` 方法
2. **重写 SQL 语句**：在拦截方法中获取原始 SQL，根据数据库方言（dialect）添加物理分页语句
   - MySQL: `LIMIT offset, size`
   - Oracle: `ROWNUM` 或 `ROW_NUMBER() OVER()`
   - PostgreSQL: `LIMIT size OFFSET offset`
3. **参数处理**：自动注入分页参数（如 offset、limit）
4. **总数查询**：执行 `COUNT(*)` 查询获取总记录数（可选优化）

### 实现示例
```java
@Intercepts({
    @Signature(type = Executor.class, method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class})
})
public class PageInterceptor implements Interceptor {
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        Object[] args = invocation.getArgs();
        MappedStatement ms = (MappedStatement) args[0];
        Object parameter = args[1];
        // RowBounds = 分页参数载体（offset + limit）
        // 分页插件据此判断是否需要分页拦截：
        // 1) 改写 SQL（拼接 LIMIT / OFFSET）
        // 2) 执行 COUNT 查询（统计总条数）
        // 3) 封装分页结果（如 PageInfo / IPage）
        // ⚠ 原生 RowBounds 为内存分页（性能低下），必须结合插件才真正分页
        RowBounds rowBounds = (RowBounds) args[2];
        
        // 判断是否需要分页
        if (rowBounds != RowBounds.DEFAULT) {
            BoundSql boundSql = ms.getBoundSql(parameter);
            String sql = boundSql.getSql();
            
            // 根据数据库类型添加分页语句
            String pageSql = buildPageSql(sql, rowBounds);
            
            // 重写 SQL 并执行
            // ... 具体实现
        }
        
        return invocation.proceed();
    }
}
```

---

## 10. MyBatis 如何编写一个自定义插件？

### 插件拦截的四大对象

MyBatis 允许拦截以下四个核心对象的方法调用：

1. **Executor（执行器）**
   - 作用：负责整体的 SQL 执行流程
   - 拦截方法：`update`、`query`、`commit`、`rollback` 等
   - 应用场景：分页插件、性能监控、SQL 日志

2. **StatementHandler（语句处理器）**
   - 作用：处理 SQL 语句的准备、参数设置、执行
   - 拦截方法：`prepare`、`parameterize`、`query`、`update`
   - 应用场景：SQL 改写、多租户、数据权限控制

3. **ParameterHandler（参数处理器）**
   - 作用：将 Java 对象转换为 SQL 参数
   - 拦截方法：`setParameters`
   - 应用场景：参数加密、敏感信息脱敏

4. **ResultSetHandler（结果集处理器）**
   - 作用：将 JDBC ResultSet 转换为 Java 对象
   - 拦截方法：`handleResultSets`、`handleOutputParameters`
   - 应用场景：结果集加密/解密、数据脱敏

### 插件实现的三个关键方法

```java
public interface Interceptor {
    // 拦截逻辑的核心实现
    Object intercept(Invocation invocation) throws Throwable;
    
    // 生成目标对象的代理
    default Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    // 设置插件的自定义属性
    default void setProperties(Properties properties) {
        // 默认空实现
    }
}
```

**方法说明：**
- `intercept()`：拦截的核心逻辑，可以在方法执行前后添加自定义操作
- `plugin()`：用于创建目标对象的代理，一般直接使用 `Plugin.wrap(target, this)`
- `setProperties()`：读取配置文件中的插件参数

### 完整的插件实现示例

```java
@Intercepts({
    @Signature(
        type = Executor.class,
        method = "query",
        args = {MappedStatement.class, Object.class, RowBounds.class, ResultHandler.class}
    )
})
public class SqlPerformanceInterceptor implements Interceptor {
    
    private long slowSqlThreshold = 1000; // 慢 SQL 阈值（毫秒）
    
    @Override
    public Object intercept(Invocation invocation) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            // 执行目标方法
            Object result = invocation.proceed();
            return result;
        } finally {
            long endTime = System.currentTimeMillis();
            long costTime = endTime - startTime;
            
            // 记录慢 SQL
            if (costTime > slowSqlThreshold) {
                MappedStatement ms = (MappedStatement) invocation.getArgs()[0];
                System.err.println("慢SQL警告: " + ms.getId() + " 耗时: " + costTime + "ms");
            }
        }
    }
    
    @Override
    public Object plugin(Object target) {
        return Plugin.wrap(target, this);
    }
    
    @Override
    public void setProperties(Properties properties) {
        String threshold = properties.getProperty("slowSqlThreshold");
        if (threshold != null) {
            this.slowSqlThreshold = Long.parseLong(threshold);
        }
    }
}
```

### 插件配置

**XML 配置方式：**
```xml
<plugins>
    <plugin interceptor="com.example.SqlPerformanceInterceptor">
        <property name="slowSqlThreshold" value="2000"/>
    </plugin>
</plugins>
```

**注解配置方式（Spring Boot）：**
```java
@Configuration
public class MyBatisConfig {
    @Bean
    public SqlPerformanceInterceptor sqlPerformanceInterceptor() {
        return new SqlPerformanceInterceptor();
    }
}
```

---

## 11. MyBatis 执行批量插入，能返回数据库主键列表吗？

**答案：能。但需要区分不同场景和实现方式。**

---

### 一、MyBatis-Plus 的批量插入

#### 场景：使用雪花算法（IdType.ASSIGN_ID）

```java
@TableId(type = IdType.ASSIGN_ID)
private Long id;
```

**使用 `saveBatch()` 方法**
```java
List<User> userList = Arrays.asList(
    new User("张三", 20),
    new User("李四", 25),
    new User("王五", 30)
);

// 批量插入
userService.saveBatch(userList);

// ✅ 可以直接获取到雪花算法生成的ID
userList.forEach(user -> {
    System.out.println("用户ID: " + user.getId()); 
    // 输出类似：1234567890123456789
});
```

**原理说明：**
- `saveBatch()` 内部是**循环单条插入**，每次插入前会先生成雪花ID并回填到实体对象
- **性能相对较低**，但能保证ID回填
- 适合数据量不大（< 1000条）的场景

---

### 二、原生 MyBatis 的批量插入

#### 方式一：使用 `useGeneratedKeys`（适用于数据库自增主键）

**实体类配置：**
```java
public class User {
    private Long id;  // 数据库自增主键
    private String name;
    private Integer age;
    // getter/setter...
}
```

**Mapper XML：**
```xml
<insert id="batchInsert" useGeneratedKeys="true" keyProperty="id">
    INSERT INTO user (name, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.name}, #{user.age})
    </foreach>
</insert>
```

**调用示例：**
```java
@Autowired
private UserMapper userMapper;

public void testBatchInsert() {
    List<User> users = Arrays.asList(
        new User("张三", 20),
        new User("李四", 25),
        new User("王五", 30)
    );
    
    // 插入前ID为null
    System.out.println("插入前: " + users.get(0).getId()); // null
    
    // 批量插入
    userMapper.batchInsert(users);
    
    // ✅ 插入后ID自动回填
    users.forEach(user -> {
        System.out.println("用户: " + user.getName() + ", ID: " + user.getId());
        // 输出：用户: 张三, ID: 1
        //      用户: 李四, ID: 2
        //      用户: 王五, ID: 3
    });
}
```

---

#### 方式二：手动生成雪花ID（批量插入最佳实践）

**适用场景：** 需要真正的批量插入性能，又要获取主键ID

```java
public void batchInsertWithSnowflake() {
    List<User> users = new ArrayList<>();
    
    // 插入前手动生成雪花ID
    for (int i = 0; i < 3; i++) {
        User user = new User();
        user.setId(IdWorker.getId());  // 手动生成雪花ID
        user.setName("用户" + i);
        user.setAge(20 + i);
        users.add(user);
    }
    
    // 此时ID已经存在，可以先使用
    System.out.println("插入前已有ID: " + users.get(0).getId());
    
    // 执行批量插入（真正的批量SQL）
    userMapper.batchInsert(users);
    
    // ✅ ID在插入前就已经生成，随时可用
    users.forEach(user -> {
        System.out.println("用户: " + user.getName() + ", ID: " + user.getId());
    });
}
```

**Mapper XML：**
```xml
<insert id="batchInsert">
    INSERT INTO user (id, name, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.id}, #{user.name}, #{user.age})
    </foreach>
</insert>
```

---

#### 方式三：使用 `<selectKey>` 标签（适用于 Oracle 序列）

```xml
<insert id="batchInsert">
    <selectKey keyProperty="id" resultType="long" order="BEFORE">
        SELECT user_seq.NEXTVAL FROM DUAL
    </selectKey>
    INSERT INTO user (id, name, age) VALUES
    <foreach collection="list" item="user" separator=",">
        (#{user.id}, #{user.name}, #{user.age})
    </foreach>
</insert>
```

---

### 三、不同方案对比

| 方案 | 性能 | ID回填 | 适用场景 |
|-----|------|--------|---------|
| **MyBatis-Plus `saveBatch()`** | ⭐⭐⭐ | ✅ 自动 | 小批量（<1000条），快速开发 |
| **`useGeneratedKeys`** | ⭐⭐⭐⭐⭐ | ✅ 自动 | MySQL自增主键，大批量插入 |
| **手动生成雪花ID** | ⭐⭐⭐⭐⭐ | ✅ 手动 | **推荐方案**，性能最优 |
| **`<selectKey>` 序列** | ⭐⭐⭐⭐ | ✅ 自动 | Oracle 数据库 |

---

### 四、注意事项

#### 1. 数据库驱动版本限制
- **MySQL：** 需要 JDBC 驱动 ≥ `5.1.38` 才支持批量返回自增主键
- **PostgreSQL：** 原生支持 `RETURNING` 子句
- **Oracle：** 需要配合序列使用

#### 2. 数据库配置要求（MySQL）
```properties
# application.properties
spring.datasource.url=jdbc:mysql://localhost:3306/test?rewriteBatchedStatements=true
```
- `rewriteBatchedStatements=true` 开启真正的批量插入优化

#### 3. MyBatis 配置
```xml
<!-- mybatis-config.xml -->
<settings>
    <!-- 开启驼峰命名映射 -->
    <setting name="mapUnderscoreToCamelCase" value="true"/>
    <!-- 允许 JDBC 生成主键 -->
    <setting name="useGeneratedKeys" value="true"/>
</settings>
```

#### 4. 性能建议
- **小批量（< 1000条）：** 使用 `saveBatch()` 或 `useGeneratedKeys`
- **大批量（≥ 1000条）：** 
  - **推荐：** 手动生成雪花ID + 真正的批量SQL
  - 分批插入，每批 500-1000 条
  
```java
// 分批插入示例
List<User> allUsers = ...; // 假设有 10000 条数据
int batchSize = 1000;

for (int i = 0; i < allUsers.size(); i += batchSize) {
    List<User> batch = allUsers.subList(i, 
        Math.min(i + batchSize, allUsers.size()));
    
    // 手动生成ID
    batch.forEach(user -> user.setId(IdWorker.getId()));
    
    // 批量插入
    userMapper.batchInsert(batch);
}
```

---

### 五、总结

1. **MyBatis-Plus + 雪花算法：** `saveBatch()` 自动回填ID，但性能一般
2. **原生 MyBatis + 数据库自增：** `useGeneratedKeys="true"` 性能最优
3. **最佳实践：** 手动生成雪花ID + 真正的批量SQL，兼顾性能和ID获取
4. 主键按照插入顺序依次填充到对象列表中，可直接使用
---

## 12. MyBatis 动态 SQL 是做什么的？都有哪些动态 SQL？能简述一下动态 SQL 的执行原理吗？

### 动态 SQL 的作用
动态 SQL 允许我们根据不同的条件动态生成 SQL 语句，避免手动拼接 SQL 字符串，提高代码的可维护性和安全性。

### MyBatis 提供的 9 种动态 SQL 标签

| 标签 | 作用 | 示例场景 |
|------|------|----------|
| `<if>` | 条件判断 | 根据参数是否为空决定是否添加查询条件 |
| `<choose>` | 多条件分支（类似 switch） | 多个条件只选择一个执行 |
| `<when>` | 配合 `<choose>` 使用 | 类似 case |
| `<otherwise>` | 配合 `<choose>` 使用 | 类似 default |
| `<where>` | 智能处理 WHERE 子句 | 自动去除多余的 AND/OR |
| `<set>` | 智能处理 UPDATE SET 子句 | 自动去除多余的逗号 |
| `<trim>` | 自定义前缀/后缀处理 | 灵活处理 SQL 片段 |
| `<foreach>` | 遍历集合 | 处理 IN 查询、批量操作 |
| `<bind>` | 创建变量 | 定义上下文变量 |

### 动态 SQL 示例

```xml
<!-- if 标签 -->
<select id="findUser" resultType="User">
    SELECT * FROM user
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="age != null">
            AND age = #{age}
        </if>
    </where>
</select>

<!-- choose/when/otherwise 标签 -->
<select id="findUserByCondition" resultType="User">
    SELECT * FROM user
    <where>
        <choose>
            <when test="id != null">
                id = #{id}
            </when>
            <when test="name != null">
                name = #{name}
            </when>
            <otherwise>
                status = 1
            </otherwise>
        </choose>
    </where>
</select>

<!-- foreach 标签 -->
<select id="findUserByIds" resultType="User">
    SELECT * FROM user WHERE id IN
    <foreach collection="ids" item="id" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>

<!-- set 标签 -->
<update id="updateUser">
    UPDATE user
    <set>
        <if test="name != null">name = #{name},</if>
        <if test="age != null">age = #{age},</if>
        <if test="email != null">email = #{email}</if>
    </set>
    WHERE id = #{id}
</update>
```

### 执行原理

1. **解析阶段**：MyBatis 启动时，将 XML 中的动态 SQL 解析为 `SqlNode` 树结构
2. **运行时处理**：执行 SQL 时，通过 `OGNL`（Object-Graph Navigation Language）表达式引擎计算条件
3. **SQL 生成**：根据表达式结果，动态拼接最终的 SQL 语句
4. **参数绑定**：将参数值绑定到 PreparedStatement，防止 SQL 注入

**关键类：**
- `DynamicSqlSource`：动态 SQL 的源
- `SqlNode`：SQL 节点接口（IfSqlNode、WhereSqlNode 等）
- `DynamicContext`：动态 SQL 的上下文，存储生成的 SQL 片段

---

## 13. MyBatis 是如何将 SQL 执行结果封装为目标对象并返回的？都有哪些映射形式？

### 两种主要映射形式

#### 方式一：使用 `<resultMap>` 标签
适用于复杂映射、字段名与属性名不一致、关联查询等场景。

```xml
<resultMap id="userResultMap" type="User">
    <id property="id" column="user_id"/>
    <result property="name" column="user_name"/>
    <result property="age" column="user_age"/>
    <result property="email" column="user_email"/>
    
    <!-- 关联对象映射 -->
    <association property="department" javaType="Department">
        <id property="id" column="dept_id"/>
        <result property="name" column="dept_name"/>
    </association>
    
    <!-- 集合映射 -->
    <collection property="orders" ofType="Order">
        <id property="id" column="order_id"/>
        <result property="orderNo" column="order_no"/>
    </collection>
</resultMap>

<select id="getUserById" resultMap="userResultMap">
    SELECT u.id AS user_id, u.name AS user_name, u.age AS user_age,
           d.id AS dept_id, d.name AS dept_name
    FROM user u
    LEFT JOIN department d ON u.dept_id = d.id
    WHERE u.id = #{id}
</select>
```

#### 方式二：使用 SQL 列别名
适用于简单映射，列名与属性名不一致时使用别名对齐。

```xml
<select id="getUserById" resultType="User">
    SELECT 
        id,
        user_name AS name,
        user_age AS age,
        user_email AS email
    FROM user
    WHERE id = #{id}
</select>
```

### 自动映射规则

MyBatis 会自动进行以下处理：
1. **忽略大小写**：列名 `USER_NAME` 可以映射到属性 `userName`
2. **驼峰转换**：开启 `mapUnderscoreToCamelCase` 后，`user_name` 自动映射到 `userName`

```xml
<settings>
    <setting name="mapUnderscoreToCamelCase" value="true"/>
</settings>
```

### 映射原理

1. 执行 SQL 获取 `ResultSet`
2. `ResultSetHandler` 处理结果集
3. 根据 `resultType` 或 `resultMap` 创建目标对象
4. 通过反射调用 setter 方法或直接设置字段值
5. 处理嵌套对象和集合（懒加载或立即加载）

---

## 14. MyBatis 的 Xml 映射文件中，不同的 Xml 映射文件，id 是否可以重复？

### 答案
- **有 `namespace`**：id 可以重复
- **无 `namespace`**：id 不能重复

### 原理分析

MyBatis 使用 `namespace + id` 作为 Statement 的唯一标识（类似 Map 的 key）：

```java
// 内部存储结构类似于
Map<String, MappedStatement> mappedStatements = new HashMap<>();

// 存储时的 key
String key = namespace + "." + id;  // 例如："com.example.UserMapper.selectById"

// 如果没有 namespace，key 就只有 id
String key = id;  // 例如："selectById"
```

### 示例说明

```xml
<!-- UserMapper.xml -->
<mapper namespace="com.example.UserMapper">
    <select id="selectById" resultType="User">
        SELECT * FROM user WHERE id = #{id}
    </select>
</mapper>

<!-- OrderMapper.xml -->
<mapper namespace="com.example.OrderMapper">
    <!-- 可以有相同的 id，因为 namespace 不同 -->
    <select id="selectById" resultType="Order">
        SELECT * FROM order WHERE id = #{id}
    </select>
</mapper>
```

### 最佳实践
始终配置 `namespace`，并且：
- namespace 通常设置为 Mapper 接口的全限定名
- 方便接口绑定和后期维护
- 避免 id 冲突问题

---

## 15. MyBatis 中如何执行批处理？

### 使用 `BatchExecutor` 执行批处理

#### 配置方式

**方式一：全局配置**
```xml
<settings>
    <setting name="defaultExecutorType" value="BATCH"/>
</settings>
```

**方式二：编程式使用**
```java
// Spring 集成
@Autowired
private SqlSessionFactory sqlSessionFactory;

public void batchInsert(List<User> users) {
    try (SqlSession sqlSession = sqlSessionFactory.openSession(ExecutorType.BATCH)) {
        UserMapper mapper = sqlSession.getMapper(UserMapper.class);
        
        for (User user : users) {
            mapper.insert(user);
        }
        
        // 手动提交
        sqlSession.commit();
    }
}
```

### 三种执行器对比

| 执行器类型 | 说明 | 适用场景 |
|-----------|------|---------|
| `SimpleExecutor` | 每次执行都创建新的 Statement | 普通查询、更新 |
| `ReuseExecutor` | 重用 Statement 对象 | 相同 SQL 多次执行 |
| `BatchExecutor` | 批量执行，延迟提交 | 大批量插入、更新 |

### 批处理注意事项
1. 批处理模式下，`insert/update/delete` 返回值始终为 `-2147482646`（`Statement.SUCCESS_NO_INFO`）
2. 需要手动调用 `flushStatements()` 或 `commit()` 才会真正执行
3. 批量操作中途出现异常，可能导致部分数据已提交
4. 批处理不支持返回自增主键（可以在循环前后分别处理）

---

## 16. MyBatis 中如何指定使用哪一种 Executor 执行器？

### 三种指定方式

#### 方式一：全局配置（mybatis-config.xml）
```xml
<configuration>
    <settings>
        <!-- SIMPLE、REUSE、BATCH -->
        <setting name="defaultExecutorType" value="SIMPLE"/>
    </settings>
</configuration>
```

#### 方式二：编程式指定
```java
SqlSession sqlSession = sqlSessionFactory.openSession(ExecutorType.BATCH);
```

#### 方式三：Spring Boot 配置
```yaml
mybatis:
  configuration:
    default-executor-type: simple  # simple、reuse、batch
```

### 执行器选择建议
- **日常 CRUD**：使用 `SIMPLE`（默认）
- **大量相同 SQL**：使用 `REUSE`
- **批量导入/更新**：使用 `BATCH`

---

## 17. MyBatis 是否可以映射 Enum 枚举类？

**答案：可以。** MyBatis 不仅可以映射枚举，还可以映射任何 Java 类型到数据库列。

### 两种内置枚举处理器

#### 1. `EnumTypeHandler`（默认）
将枚举的 **名称（name）** 存储到数据库。

```java
public enum UserStatus {
    ACTIVE, INACTIVE, DELETED
}

// 数据库存储: "ACTIVE", "INACTIVE", "DELETED"
```

#### 2. `EnumOrdinalTypeHandler`
将枚举的 **序号（ordinal）** 存储到数据库。

```java
// 数据库存储: 0, 1, 2
```

**配置方式：**
```xml
<typeHandlers>
    <typeHandler handler="org.apache.ibatis.type.EnumOrdinalTypeHandler"
                 javaType="com.example.UserStatus"/>
</typeHandlers>
```

### 自定义枚举类型处理器

适用于需要自定义映射规则的场景（如存储枚举的 code 值）。

```java
// 枚举定义
public enum UserStatus {
    ACTIVE(1, "激活"),
    INACTIVE(0, "未激活"),
    DELETED(-1, "已删除");
    
    private final int code;
    private final String desc;
    
    UserStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
    
    public int getCode() { return code; }
    public String getDesc() { return desc; }
    
    public static UserStatus of(int code) {
        for (UserStatus status : values()) {
            if (status.code == code) return status;
        }
        throw new IllegalArgumentException("Invalid code: " + code);
    }
}

// 自定义 TypeHandler
@MappedTypes(UserStatus.class)
@MappedJdbcTypes(JdbcType.INTEGER)
public class UserStatusTypeHandler extends BaseTypeHandler<UserStatus> {
    
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, 
                                     UserStatus parameter, JdbcType jdbcType) throws SQLException {
        ps.setInt(i, parameter.getCode());
    }
    
    @Override
    public UserStatus getNullableResult(ResultSet rs, String columnName) throws SQLException {
        int code = rs.getInt(columnName);
        return rs.wasNull() ? null : UserStatus.of(code);
    }
    
    @Override
    public UserStatus getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        int code = rs.getInt(columnIndex);
        return rs.wasNull() ? null : UserStatus.of(code);
    }
    
    @Override
    public UserStatus getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        int code = cs.getInt(columnIndex);
        return cs.wasNull() ? null : UserStatus.of(code);
    }
}
```

**注册 TypeHandler：**
```xml
<typeHandlers>
    <typeHandler handler="com.example.UserStatusTypeHandler"/>
</typeHandlers>
```

---

## 18. MyBatis 映射文件中，如果 A 标签通过 include 引用了 B 标签的内容，请问，B 标签能否定义在 A 标签的后面？

**答案：可以。** B 标签可以定义在 A 标签的后面，MyBatis 会智能处理这种前向引用。

### 原理解析

MyBatis 使用 **两阶段解析** 机制：

**第一阶段：顺序解析**
1. 按照文档顺序解析 XML 标签
2. 遇到 A 标签引用了尚未解析的 B 标签
3. 将 A 标签标记为 **"未完成解析"** 状态
4. 继续解析后续标签（包括 B 标签）

**第二阶段：重新解析**
1. 所有标签首次解析完成后
2. 重新解析那些标记为 **"未完成解析"** 的标签
3. 此时 B 标签已经存在，A 标签可以正常引用

### 示例

```xml
<mapper namespace="com.example.UserMapper">
    
    <!-- A 标签：引用了后面的 B 标签 -->
    <select id="selectUser" resultType="User">
        SELECT 
        <include refid="userColumns"/>
        FROM user WHERE id = #{id}
    </select>
    
    <!-- B 标签：在 A 标签后面定义 -->
    <sql id="userColumns">
        id, name, age, email, create_time
    </sql>
    
</mapper>
```

### 最佳实践
虽然支持前向引用，但建议：
- 将 `<sql>` 片段定义在文件顶部
- 便于维护和阅读
- 符合"先定义后使用"的编程习惯

---

## 19. 简述 MyBatis 的 Xml 映射文件和 MyBatis 内部数据结构之间的映射关系？

### 核心配置对象：`Configuration`

MyBatis 将所有 XML 配置信息封装到一个重量级对象 `Configuration` 中，它是 MyBatis 的核心配置类。

### XML 标签与内部对象的映射关系

| XML 标签 | 内部对象 | 说明 |
|---------|---------|------|
| `<configuration>` | `Configuration` | 全局配置的根对象 |
| `<settings>` | `Configuration` 的各个属性 | 全局设置项 |
| `<typeAliases>` | `TypeAliasRegistry` | 类型别名注册表 |
| `<typeHandlers>` | `TypeHandlerRegistry` | 类型处理器注册表 |
| `<environments>` | `Environment` | 环境配置（数据源、事务） |
| `<mappers>` | `MapperRegistry` | Mapper 接口注册表 |
| `<parameterMap>` | `ParameterMap` | 参数映射对象 |
| `<parameterMap>` 的子元素 | `ParameterMapping` | 单个参数映射 |
| `<resultMap>` | `ResultMap` | 结果映射对象 |
| `<resultMap>` 的子元素 | `ResultMapping` | 单个结果映射 |
| `<select>`/`<insert>`/`<update>`/`<delete>` | `MappedStatement` | SQL 语句对象 |
| SQL 语句内容 | `SqlSource` | SQL 源 |
| 运行时生成的 SQL | `BoundSql` | 绑定参数后的 SQL |

### 数据结构关系图

```
Configuration (全局配置)
├── TypeAliasRegistry (类型别名)
├── TypeHandlerRegistry (类型处理器)
├── MapperRegistry (Mapper 注册)
├── MappedStatements (SQL 语句集合)
│   └── MappedStatement (单个 SQL 语句)
│       ├── SqlSource (SQL 源)
│       │   └── BoundSql (绑定后的 SQL)
│       ├── ParameterMap (参数映射)
│       │   └── ParameterMapping[]
│       └── ResultMap (结果映射)
│           └── ResultMapping[]
└── Environment (环境配置)
    ├── DataSource (数据源)
    └── TransactionFactory (事务工厂)
```

### 关键对象说明

**1. MappedStatement**
- 存储一个 SQL 语句的完整信息
- 包含 SQL 类型（SELECT/INSERT/UPDATE/DELETE）
- 包含参数映射、结果映射、缓存配置等

**2. SqlSource**
- 负责生成 SQL 语句
- 分为静态 SQL（`StaticSqlSource`）和动态 SQL（`DynamicSqlSource`）

**3. BoundSql**
- 运行时生成的最终 SQL
- 包含参数占位符和参数值的映射关系

**4. ResultMap**
- 定义查询结果如何映射到 Java 对象
- 支持嵌套映射（association、collection）

---

## 20. 为什么说 MyBatis 是半自动 ORM 映射工具？它与全自动的区别在哪里？

### 定义

- **全自动 ORM**：如 Hibernate，完全隐藏 SQL 细节，开发者只需操作对象
- **半自动 ORM**：如 MyBatis，需要手动编写 SQL，但自动处理结果映射

### 对比分析

| 特性 | MyBatis（半自动） | Hibernate（全自动） |
|------|------------------|-------------------|
| SQL 编写 | 需要手动编写 SQL | 自动生成 SQL |
| 学习曲线 | 需要熟悉 SQL | 需要学习 HQL/JPQL |
| 性能优化 | 灵活，可精细优化 | 受限于框架生成的 SQL |
| 关联查询 | 手动编写 JOIN | 自动处理关联关系 |
| 复杂查询 | 方便，直接写 SQL | 困难，需要复杂的 HQL |
| 数据库移植性 | 较差，SQL 依赖数据库 | 较好，屏蔽数据库差异 |
| 适用场景 | 复杂业务、遗留系统 | 标准 CRUD、快速开发 |

### 具体体现

**1. 关联对象查询**

```java
// Hibernate（全自动）
User user = session.get(User.class, 1);
List<Order> orders = user.getOrders(); // 自动查询关联数据

// MyBatis（半自动）
// 需要手动编写SQL和结果映射
<select id="getUserWithOrders" resultMap="userOrderMap">
    SELECT u.*, o.* 
    FROM user u 
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.id = #{id}
</select>
```

**2. 复杂查询处理**

```xml
<!-- MyBatis需要明确定义映射关系 -->
<resultMap id="userOrderMap" type="User">
    <id property="id" column="id"/>
    <result property="name" column="name"/>
    <collection property="orders" ofType="Order">
        <id property="orderId" column="order_id"/>
        <result property="amount" column="amount"/>
    </collection>
</resultMap>
```

### 优劣势分析

**MyBatis的优势：**
- SQL可控性强，便于性能调优
- 适合复杂业务场景和遗留系统
- 学习曲线相对平缓
- 可精确控制每一条SQL

**Hibernate的优势：**

- 开发效率高，代码量少
- 数据库移植性好
- 完全面向对象操作
- 自动处理缓存和延迟加载

### 选型建议

- **选择MyBatis**：需要精细SQL控制、复杂报表查询、性能敏感场景
- **选择Hibernate**：标准CRUD操作为主、快速开发、团队ORM经验丰富

---

## MyBatis 模糊查询 LIKE 语句写法详解

### 一、推荐写法（安全且高效）

#### 方式一：使用 CONCAT 函数（★★★★★ 推荐）

**Mapper 接口：**
```java
List<User> selectByNameLike(@Param("name") String name);
```

**Mapper XML：**
```xml
<!-- MySQL 写法 -->
<select id="selectByNameLike" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE CONCAT('%', #{name}, '%')
</select>

<!-- Oracle/PostgreSQL 写法 -->
<select id="selectByNameLike" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE '%' || #{name} || '%'
</select>
```

**调用示例：**
```java
// 直接传入关键字，不需要手动拼接 %
List<User> users = userMapper.selectByNameLike("张三");
// 生成 SQL: SELECT * FROM user WHERE name LIKE CONCAT('%', '张三', '%')
// 实际执行: SELECT * FROM user WHERE name LIKE '%张三%'
```

**优点：**
- ✅ 防止 SQL 注入（使用预编译参数）
- ✅ 代码简洁，调用方无需拼接 %
- ✅ 性能较好

---

### 二、其他常用写法

#### 方式二：使用 `${}` 拼接（不推荐，有 SQL 注入风险）

```xml
<select id="selectByNameLike" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE '%${name}%'
</select>
```

**调用示例：**
```java
List<User> users = userMapper.selectByNameLike("张三");
```

**缺点：**
- ❌ **存在 SQL 注入风险**
- ❌ 无法使用预编译，性能较差
- ⚠️ 只在完全信任输入源时使用（如固定配置值）

---

#### 方式三：Java 代码中拼接 %

**Mapper XML：**
```xml
<select id="selectByNameLike" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE #{name}
</select>
```

**调用示例：**
```java
// 在 Java 代码中拼接 %
String keyword = "张三";
List<User> users = userMapper.selectByNameLike("%" + keyword + "%");
// 生成 SQL: SELECT * FROM user WHERE name LIKE ?
// 参数绑定: '%张三%'
```

**优缺点：**
- ✅ 防止 SQL 注入
- ❌ 调用方需要手动拼接，代码不够优雅
- ✅ 性能好（使用预编译）

---

#### 方式四：使用 `<bind>` 标签

```xml
<select id="selectByNameLike" resultType="com.example.entity.User">
    <bind name="pattern" value="'%' + name + '%'" />
    SELECT * FROM user
    WHERE name LIKE #{pattern}
</select>
```

**调用示例：**
```java
List<User> users = userMapper.selectByNameLike("张三");
```

**优点：**
- ✅ 防止 SQL 注入
- ✅ 逻辑集中在 XML 中
- ✅ 调用方无需拼接

---

### 三、不同场景的完整示例

#### 场景 1：右模糊查询（以某字符结尾）

```xml
<!-- 查询姓张的用户 -->
<select id="selectByNamePrefix" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE CONCAT(#{name}, '%')
</select>
```

```java
List<User> users = userMapper.selectByNamePrefix("张");
// 查询结果: 张三、张飞、张无忌...
```

---

#### 场景 2：左模糊查询（以某字符开头）

```xml
<!-- 查询名字中包含"三"结尾的用户 -->
<select id="selectByNameSuffix" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE CONCAT('%', #{name})
</select>
```

```java
List<User> users = userMapper.selectByNameSuffix("三");
// 查询结果: 张三、李三、王老三...
```

---

#### 场景 3：多字段模糊查询

```xml
<select id="searchUsers" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE name LIKE CONCAT('%', #{keyword}, '%')
       OR email LIKE CONCAT('%', #{keyword}, '%')
       OR phone LIKE CONCAT('%', #{keyword}, '%')
</select>
```

```java
List<User> users = userMapper.searchUsers("张三");
// 查询名字、邮箱、电话中任一包含"张三"的用户
```

---

#### 场景 4：动态模糊查询（可选条件）

```xml
<select id="selectByCondition" resultType="com.example.entity.User">
    SELECT * FROM user
    <where>
        <if test="name != null and name != ''">
            AND name LIKE CONCAT('%', #{name}, '%')
        </if>
        <if test="email != null and email != ''">
            AND email LIKE CONCAT('%', #{email}, '%')
        </if>
        <if test="phone != null and phone != ''">
            AND phone LIKE CONCAT('%', #{phone}, '%')
        </if>
    </where>
</select>
```

```java
@Data
public class UserQuery {
    private String name;
    private String email;
    private String phone;
}

// 调用
UserQuery query = new UserQuery();
query.setName("张三");
query.setEmail("qq.com");
List<User> users = userMapper.selectByCondition(query);
// WHERE name LIKE '%张三%' AND email LIKE '%qq.com%'
```

---

### 四、MyBatis-Plus 的模糊查询

#### 使用 LambdaQueryWrapper

```java
@Autowired
private UserMapper userMapper;

public void testLike() {
    // 1. 全模糊查询
    LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
    wrapper.like(User::getName, "张三");
    List<User> users = userMapper.selectList(wrapper);
    // SQL: name LIKE '%张三%'
    
    // 2. 左模糊查询
    wrapper.clear();
    wrapper.likeLeft(User::getName, "三");
    users = userMapper.selectList(wrapper);
    // SQL: name LIKE '%三'
    
    // 3. 右模糊查询
    wrapper.clear();
    wrapper.likeRight(User::getName, "张");
    users = userMapper.selectList(wrapper);
    // SQL: name LIKE '张%'
    
    // 4. 多条件模糊查询
    wrapper.clear();
    wrapper.like(User::getName, "张")
           .or()
           .like(User::getEmail, "qq.com");
    users = userMapper.selectList(wrapper);
    // SQL: name LIKE '%张%' OR email LIKE '%qq.com%'
}
```

---

### 五、性能优化建议

#### 1. 避免全模糊查询（`%keyword%`）
```java
// ❌ 不推荐：无法使用索引
WHERE name LIKE '%张三%'

// ✅ 推荐：可以使用索引
WHERE name LIKE '张三%'
```

#### 2. 使用全文索引（数据量大时）

**MySQL 全文索引：**
```sql
-- 创建全文索引
ALTER TABLE user ADD FULLTEXT INDEX idx_name_fulltext(name);

-- 使用全文检索
SELECT * FROM user WHERE MATCH(name) AGAINST('张三' IN NATURAL LANGUAGE MODE);
```

**MyBatis 写法：**
```xml
<select id="fullTextSearch" resultType="com.example.entity.User">
    SELECT * FROM user
    WHERE MATCH(name) AGAINST(#{keyword} IN NATURAL LANGUAGE MODE)
</select>
```

#### 3. 使用 Elasticsearch（海量数据）
```java
// 适合百万级以上数据的模糊搜索
```

---

### 六、总结对比

| 写法 | 安全性 | 性能 | 推荐度 | 适用场景 |
|------|--------|------|--------|---------|
| **CONCAT + #{}** | ✅ 高 | ⭐⭐⭐⭐⭐ | ★★★★★ | **首选方案** |
| **${} 拼接** | ❌ 低 | ⭐⭐⭐ | ★ | 仅用于可信输入 |
| **Java 拼接 %** | ✅ 高 | ⭐⭐⭐⭐⭐ | ★★★★ | 简单场景 |
| **`<bind>` 标签** | ✅ 高 | ⭐⭐⭐⭐⭐ | ★★★★ | 复杂 SQL |
| **MyBatis-Plus** | ✅ 高 | ⭐⭐⭐⭐⭐ | ★★★★★ | **快速开发** |

**最佳实践：**
1. 日常开发优先使用 `CONCAT('%', #{name}, '%')` 
2. 使用 MyBatis-Plus 时优先使用 `wrapper.like()`
3. 避免使用 `${}` 防止 SQL 注入
4. 大数据量场景考虑全文索引或 Elasticsearch

---

## 参考文档

- [源码解读](https://tuonioooo.gitbooks.io/application-framework/content/mybatispian.html)
- [官方文档](https://mybatis.org/mybatis-3/zh_CN/index.html)