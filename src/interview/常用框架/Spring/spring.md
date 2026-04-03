---
title: Spring面试题
category:
  - Spring面试题
date: 2025-11-28
---

# Spring框架面试题精编

## 目录
- [Spring基础概念](#spring基础概念)
- [核心特性IOC与AOP](#核心特性ioc与aop)
- [Bean管理](#bean管理)
- [事务管理](#事务管理)
- [Spring配置](#spring配置)
- [高级话题](#高级话题)

---

## Spring基础概念

### 1. 为什么要使用Spring?

Spring框架提供了以下核心优势:

- **IOC容器管理** - Spring容器自动管理依赖对象,无需手动创建和管理,实现程序解耦
- **事务支持** - 提供声明式事务管理,简化事务操作
- **AOP支持** - 面向切面编程,方便处理横切关注点(如日志、异常等)
- **框架集成** - 轻松整合MyBatis、Hibernate等其他框架

### 2. Spring主要模块

- **Spring Core** - 框架基础,提供IOC和依赖注入特性
- **Spring Context** - 构建于Core之上,提供框架式的对象访问方法
- **Spring DAO** - 提供JDBC抽象层
- **Spring AOP** - 面向切面编程实现,支持自定义拦截器和切点
- **Spring Web** - Web开发集成特性,如文件上传、IOC容器初始化
- **Spring Web MVC** - MVC框架实现

---

## 核心特性IOC与AOP

### 3. 什么是AOP?

AOP(Aspect Oriented Programming)即面向切面编程,通过预编译方式和运行期动态代理实现程序功能的统一维护。

**核心思想**: 统一处理某一"切面"的问题,如日志记录、异常处理、事务管理等横切关注点。

### @Aspect 原理

#### 核心概念 — AOP

`@Aspect` 是 Spring AOP（面向切面编程）的实现，本质是**动态代理**。

```
原始调用:  Controller → Service.method()
AOP调用:   Controller → 代理对象 → [切面逻辑] → Service.method() → [切面逻辑]
```

#### 底层代理机制

```
目标类实现了接口  →  JDK 动态代理  (java.lang.reflect.Proxy)
目标类没有接口   →  CGLIB 代理    (生成子类字节码)
```

---

#### 核心注解

| 注解 | 时机 | 常用场景 |
|------|------|---------|
| `@Before` | 方法执行前 | 参数校验、权限检查 |
| `@After` | 方法执行后（无论成败） | 资源清理 |
| `@AfterReturning` | 方法正常返回后 | 返回值处理 |
| `@AfterThrowing` | 方法抛异常后 | 异常统一处理 |
| `@Around` | 包裹整个方法 | 日志、耗时、事务 |

---

#### 常见示例

**1. 接口耗时统计**

```java
@Aspect
@Component
public class TimingAspect {

    @Around("execution(* com.example.service..*(..))")
    public Object logTime(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        String method = pjp.getSignature().toShortString();

        try {
            return pjp.proceed();  // 执行原方法
        } finally {
            long cost = System.currentTimeMillis() - start;
            System.out.printf("[耗时] %s → %dms%n", method, cost);
        }
    }
}
```

---

**2. 操作日志记录（配合自定义注解）**

```java
// 自定义注解
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Log {
    String value() default "";
}

// 切面
@Aspect
@Component
public class LogAspect {

    @AfterReturning(
        pointcut = "@annotation(log)",
        returning = "result"
    )
    public void saveLog(JoinPoint jp, Log log, Object result) {
        String user    = SecurityContext.currentUser();
        String action  = log.value();
        String method  = jp.getSignature().getName();
        // 存数据库...
        System.out.printf("[日志] 用户=%s 操作=%s 方法=%s%n", user, action, method);
    }
}

// 使用
@Log("删除用户")
public void deleteUser(Long id) { ... }
```

---

**3. 权限校验**

```java
@Aspect
@Component
public class AuthAspect {

    @Before("@annotation(requiresRole)")
    public void checkRole(RequiresRole requiresRole) {
        String required = requiresRole.value();
        String current  = SecurityContext.getRole();

        if (!current.equals(required)) {
            throw new AccessDeniedException("需要角色: " + required);
        }
    }
}

// 使用
@RequiresRole("ADMIN")
public void deleteUser(Long id) { ... }
```

---

**4. 接口限流（令牌桶）**

```java
@Aspect
@Component
public class RateLimitAspect {

    private final Map<String, RateLimiter> limiters = new ConcurrentHashMap<>();

    @Around("@annotation(rateLimit)")
    public Object limit(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        String key = pjp.getSignature().toString();
        RateLimiter limiter = limiters.computeIfAbsent(
            key, k -> RateLimiter.create(rateLimit.qps())
        );

        if (!limiter.tryAcquire()) {
            throw new RuntimeException("请求过于频繁，请稍后再试");
        }
        return pjp.proceed();
    }
}

// 使用
@RateLimit(qps = 10)
public Result query(String keyword) { ... }
```

---

**5. 异常统一处理**

```java
@Aspect
@Component
public class ExceptionAspect {

    @AfterThrowing(
        pointcut = "execution(* com.example..*(..))",
        throwing  = "ex"
    )
    public void handleException(JoinPoint jp, Exception ex) {
        String method = jp.getSignature().toShortString();
        // 告警、入库、钉钉通知...
        log.error("[异常] 方法={} 错误={}", method, ex.getMessage());
    }
}
```

---

### Pointcut 表达式速查

```java
// 某包下所有方法
execution(* com.example.service.*.*(..))

// 某类所有方法
execution(* com.example.UserService.*(..))

// 带特定注解的方法
@annotation(com.example.annotation.Log)

// 带特定注解的类
@within(org.springframework.stereotype.Service)

// 组合使用
@Pointcut("execution(* com.example..*(..)) && @annotation(Log)")
```

---

#### 执行顺序

```
@Around(前) 
  → @Before 
    → 目标方法 
  → @AfterReturning / @AfterThrowing 
→ @After 
→ @Around(后)
```


### 4. 什么是IOC?

IOC 是一种设计思想，核心是**把对象的创建权和依赖关系的管理权，从代码本身转移给外部容器**。Spring 通过 DI（依赖注入）来实现 IOC —— 你只需声明需要什么，容器负责创建和组装。好处是对象之间不再互相 `new`，耦合度大幅降低，也更易于单元测试（可以直接注入 Mock 对象）。

```java
// 传统方式：调用者主动 new，依赖关系写死在代码里
public class OrderService {
    // 自己创建依赖，耦合死了
    private UserService userService = new UserServiceImpl();
}

// IOC 方式：依赖由容器注入，调用者不关心怎么创建
public class OrderService {
    @Autowired
    private UserService userService;  // 容器负责创建并注入
}
```

---

#### IOC 和 DI 的关系 ?

IOC 是思想，DI（依赖注入）是实现手段，两者经常混用但不完全相同。

#### 控制反转的"反转"体现在哪?

```
传统:  OrderService  →  主动 new UserService()     # 控制权在自己
IOC:   Spring容器    →  创建并注入给 OrderService   # 控制权反转给容器
```

#### 容器的本质

Spring IOC 容器本质是一个 **Map**，存放所有被管理的 Bean：

```java
Map<String, Object> iocContainer = {
    "orderService" → OrderService实例,
    "userService"  → UserServiceImpl实例,
    ...
}
```

---

## Bean管理

### 5. Spring常用的注入方式

1. **Setter属性注入**
   ```java
   public class UserService {
       private UserDao userDao;
       
       public void setUserDao(UserDao userDao) {
           this.userDao = userDao;
       }
   }
   ```

2. **构造方法注入**
   ```java
   public class UserService {
       private final UserDao userDao;
       
       public UserService(UserDao userDao) {
           this.userDao = userDao;
       }
   }
   ```

3. **注解方式注入**
   ```java
   @Service
   public class UserService {
       @Autowired
       private UserDao userDao;
   }
   ```

### 6. Spring中的Bean线程安全吗?

**默认情况**: Spring Bean默认是单例模式(singleton),框架本身未对单例Bean进行多线程封装。

**线程安全性**:
- 无状态Bean(如DAO、Service层)通常是线程安全的
- 有状态Bean(如包含可变成员变量)需要开发者自行保证线程安全

**解决方案**:
1. 避免在Bean中定义可变的成员变量
2. 使用ThreadLocal保存可变成员变量(推荐)
3. 将Bean作用域改为prototype

> [ThreadLocal详解](../../../java-concurrent/thread/threadlocal/get.md)

### 7. Spring Bean的作用域

Spring支持5种作用域:

| 作用域 | 说明 |
|-------|------|
| **singleton** | IOC容器中只存在一个Bean实例(默认) |
| **prototype** | 每次获取Bean都创建新实例 |
| **request** | 每个HTTP请求创建一个实例 |
| **session** | 同一个HTTP Session共享一个实例 |
| **global-session** | 用于Portlet容器,提供全局HTTP Session |

⚠️ **注意**: prototype作用域会频繁创建和销毁Bean,需慎重考虑性能影响。

### 8. Spring自动装配方式

#### 1. byName

根据属性名称匹配 Bean 的名称进行注入。

```java
// Bean 定义
public class UserService {
    private UserDao userDao;  // 属性名为 userDao
    
    public void setUserDao(UserDao userDao) {
        this.userDao = userDao;
    }
}

public class UserDao {
    public void saveUser() {
        System.out.println("保存用户");
    }
}
```

```xml
<!-- XML 配置 -->
<bean id="userDao" class="com.example.UserDao"/>

<bean id="userService" class="com.example.UserService" autowire="byName">
    <!-- Spring 会自动查找名为 userDao 的 bean 并注入 -->
</bean>
```

#### 2. byType

根据属性的类型在容器中查找匹配的 Bean 进行注入。

```java
// Bean 定义
public class OrderService {
    private PaymentService paymentService;
    
    public void setPaymentService(PaymentService paymentService) {
        this.paymentService = paymentService;
    }
}

public class PaymentService {
    public void pay() {
        System.out.println("支付成功");
    }
}
```

```xml
<!-- XML 配置 -->
<bean id="alipayService" class="com.example.PaymentService"/>

<bean id="orderService" class="com.example.OrderService" autowire="byType">
    <!-- Spring 会根据 PaymentService 类型自动注入，bean 名称无关紧要 -->
</bean>
```

**注意**：如果容器中有多个相同类型的 Bean，byType 会抛出异常。

#### 3. constructor

通过构造函数参数类型匹配进行注入。

```java
// Bean 定义
public class ProductService {
    private ProductDao productDao;
    private CacheService cacheService;
    
    // 通过构造函数注入
    public ProductService(ProductDao productDao, CacheService cacheService) {
        this.productDao = productDao;
        this.cacheService = cacheService;
    }
}

public class ProductDao {
    public void findProduct() {
        System.out.println("查询商品");
    }
}

public class CacheService {
    public void cache() {
        System.out.println("缓存数据");
    }
}
```

```xml
<!-- XML 配置 -->
<bean id="productDao" class="com.example.ProductDao"/>
<bean id="cacheService" class="com.example.CacheService"/>

<bean id="productService" class="com.example.ProductService" autowire="constructor">
    <!-- Spring 会根据构造函数参数类型自动注入匹配的 bean -->
</bean>
```

#### 4. autodetect

先尝试 constructor，如果不行则使用 byType。

```java
// Bean 定义
public class EmailService {
    private EmailSender emailSender;
    
    // 有构造函数，优先使用 constructor 方式
    public EmailService(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
    
    // 也有 setter 方法
    public void setEmailSender(EmailSender emailSender) {
        this.emailSender = emailSender;
    }
}

public class EmailSender {
    public void send() {
        System.out.println("发送邮件");
    }
}
```

```xml
<!-- XML 配置 -->
<bean id="emailSender" class="com.example.EmailSender"/>

<bean id="emailService" class="com.example.EmailService" autowire="autodetect">
    <!-- Spring 会先尝试使用构造函数注入，找到合适的构造函数就使用它 -->
    <!-- 如果没有合适的构造函数，则降级为 byType 方式 -->
</bean>
```

#### 关键区别总结

- **byName**：依赖属性名称匹配，Bean ID 必须与属性名相同
- **byType**：依赖类型匹配，同类型 Bean 只能有一个
- **constructor**：通过构造函数注入，适合不可变对象
- **autodetect**：智能选择，优先构造函数（Spring 5.0+ 已废弃）

现代 Spring 开发更推荐使用 `@Autowired` 注解方式，更简洁灵活。


### 9. Bean生命周期

Spring Bean生命周期主要阶段:

1. **实例化** - 通过构造器或工厂方法创建Bean实例
2. **属性赋值** - 为Bean属性设置值和其他Bean引用
3. **前置处理** - 调用BeanPostProcessor的postProcessBeforeInitialization方法
4. **初始化** - 调用Bean的init-method方法
5. **后置处理** - 调用BeanPostProcessor的postProcessAfterInitialization方法
6. **使用** - Bean就绪,可供使用
7. **销毁** - 容器关闭时调用destroy-method方法

**管理方式**:
- InitializingBean和DisposableBean接口
- 其他Aware接口
- XML配置的init()和destroy()方法
- @PostConstruct和@PreDestroy注解

---

## 事务管理

### 10. Spring事务实现方式

1. **声明式事务**
   - 基于XML配置
   - 基于注解(@Transactional)

2. **编程式事务**
   - 通过代码显式管理和维护事务

### 11. Spring事务隔离级别

| 隔离级别 | 说明 | 可能问题 |
|---------|------|---------|
| **ISOLATION_DEFAULT** | 使用数据库默认隔离级别 | 取决于数据库 |
| **ISOLATION_READ_UNCOMMITTED** | 读未提交 | 脏读、不可重复读、幻读 |
| **ISOLATION_READ_COMMITTED** | 读已提交(SQL Server默认) | 不可重复读、幻读 |
| **ISOLATION_REPEATABLE_READ** | 可重复读(MySQL默认) | 幻读 |
| **ISOLATION_SERIALIZABLE** | 序列化(最高级别) | 性能最低 |

**数据问题说明**:
- **脏读** - 读取到其他事务未提交的数据
- **不可重复读** - 同一事务内多次读取同一数据结果不同
- **幻读** - 同一事务内多次查询结果集行数不同


### 各隔离级别的选择建议

#### 1. **READ_COMMITTED（读已提交）** - 最常用的平衡选择 ⭐

**适用场景：**
- 大多数互联网应用（如电商、社交应用）
- 对性能要求较高，可以容忍少量数据不一致

**优点：**
- 避免了脏读（不会读到脏数据）
- 性能较好，并发度高
- Oracle、SQL Server 默认级别

**可接受的问题：**
- 不可重复读：大多数业务场景可以接受（比如查看商品详情时价格变化）
- 幻读：通常影响不大

```java
@Transactional(isolation = Isolation.READ_COMMITTED)
public void processOrder(Long orderId) {
    // 适合大部分业务操作
}
```

---

#### 2. **REPEATABLE_READ（可重复读）** - MySQL 默认级别

**适用场景：**
- 需要在同一事务内多次读取相同数据且要求结果一致
- 财务报表、数据分析等场景

**优点：**
- 保证事务内读取一致性
- MySQL 的 InnoDB 引擎通过 MVCC + Next-Key Lock 基本解决了幻读

**注意：**
- 性能略低于 READ_COMMITTED
- 可能出现幻读（但 MySQL InnoDB 通过间隙锁大部分情况已解决）

```java
@Transactional(isolation = Isolation.REPEATABLE_READ)
public BigDecimal calculateAccountBalance(Long accountId) {
    // 多次读取账户余额，保证一致性
    BigDecimal balance1 = accountDao.getBalance(accountId);
    // ... 其他操作
    BigDecimal balance2 = accountDao.getBalance(accountId);
    // balance1 == balance2 保证相等
}
```

---

#### 3. **SERIALIZABLE（序列化）** - 最高级别，谨慎使用

**适用场景：**
- 金融核心交易（转账、结算）
- 库存扣减等绝对不能出错的场景
- 数据一致性要求极高的场景

**优点：**
- 完全避免脏读、不可重复读、幻读

**缺点：**
- 性能最差，几乎串行执行
- 容易导致锁等待和超时

```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void transferMoney(Long fromAccount, Long toAccount, BigDecimal amount) {
    // 银行转账等核心业务
    accountDao.deduct(fromAccount, amount);
    accountDao.add(toAccount, amount);
}
```

---

### 4. **READ_UNCOMMITTED（读未提交）** - 几乎不使用 ❌

**问题：**
- 会出现脏读，读到未提交的数据
- 数据可靠性无法保证

**唯一适用：**
- 临时统计报表（对准确性要求极低）
- 几乎不推荐使用

---

### 实际开发中的最佳实践

#### 推荐策略：

```java
// 1. 一般业务 - 使用 READ_COMMITTED
@Transactional(isolation = Isolation.READ_COMMITTED)
public void createOrder(Order order) { }

// 2. 需要一致性读取 - 使用 REPEATABLE_READ
@Transactional(isolation = Isolation.REPEATABLE_READ)
public Report generateReport(Long userId) { }

// 3. 核心金融业务 - 使用 SERIALIZABLE
@Transactional(isolation = Isolation.SERIALIZABLE)
public void bankTransfer(TransferRequest request) { }

// 4. 大部分情况 - 使用数据库默认
@Transactional  // 使用 ISOLATION_DEFAULT
public void normalBusiness() { }
```

#### 性能 vs 一致性权衡：

```
性能高 ←——————————————————————————→ 一致性高
READ_UNCOMMITTED → READ_COMMITTED → REPEATABLE_READ → SERIALIZABLE
      ❌               ⭐⭐⭐              ⭐⭐               ⭐
```

---

#### 结论

**最佳实践建议：**

1. **80% 的业务场景**：使用 `READ_COMMITTED`（性能和一致性平衡）
2. **15% 的业务场景**：使用 `REPEATABLE_READ`（需要事务内一致性）
3. **5% 的核心业务**：使用 `SERIALIZABLE`（绝对不能出错）
4. **几乎不用**：`READ_UNCOMMITTED`

**核心原则：默认使用数据库的默认级别，只在必要时提升隔离级别。**

如果你使用 MySQL，`REPEATABLE_READ` 是默认值且性能表现很好；如果使用 Oracle/SQL Server，`READ_COMMITTED` 是默认值且足够应付大多数场景。


### 12. Spring事务传播行为

**支持当前事务**:
- **PROPAGATION_REQUIRED** - 存在事务则加入,否则创建新事务
- **PROPAGATION_SUPPORTS** - 存在事务则加入,否则以非事务方式运行
- **PROPAGATION_MANDATORY** - 存在事务则加入,否则抛出异常

**不支持当前事务**:
- **PROPAGATION_REQUIRES_NEW** - 创建新事务,挂起当前事务
- **PROPAGATION_NOT_SUPPORTED** - 以非事务方式运行,挂起当前事务
- **PROPAGATION_NEVER** - 以非事务方式运行,存在事务则抛出异常
- **PROPAGATION_NESTED** - 存在事务则创建嵌套事务,否则等同于REQUIRED

### 13. @Transactional注解

[@Transactional注解详解及失效场景](../../../article/spring-transactional.md)

### 14. 避免AOP自调用问题

**问题场景**:
```java
@Service
public class OrderService {
    // 内部调用,事务失效
    private void insert() {
        insertOrder(); // @Transactional注解被忽略
    }
    
    @Transactional
    public void insertOrder() {
        // 数据库操作
    }
}
```

**原因**: Spring AOP代理下,只有目标方法由外部调用时才被代理管理。

**解决方案**: 使用AspectJ替代Spring AOP代理。

---

## Spring配置

### 15. BeanFactory vs ApplicationContext

**BeanFactory**:
- Spring最基础的容器
- 包含Bean定义和实例化逻辑
- 管理Bean生命周期

**ApplicationContext**:
- 继承BeanFactory,提供更多企业级功能
- 支持国际化(i18n)
- 统一的资源文件访问
- 事件发布机制
- 更多的企业级特性

**常见实现类**:
1. **ClassPathXmlApplicationContext** - 从classpath加载配置
2. **FileSystemXmlApplicationContext** - 从文件系统加载配置
3. **XmlWebApplicationContext** - Web应用中使用
4. **AnnotationConfigApplicationContext** - 基于Java配置

### 16. Spring配置方式

**1. 基于XML配置**
```xml
<beans>
    <bean id="userService" class="com.example.UserServiceImpl">
        <property name="userDao" ref="userDao"/>
    </bean>
</beans>
```

**2. 基于注解配置**
```java
@Configuration
@ComponentScan(basePackages = "com.example")
public class AppConfig {
    @Bean
    public MyService myService() {
        return new MyServiceImpl();
    }
}
```

**3. 基于Java配置**
```java
ApplicationContext ctx = new AnnotationConfigApplicationContext(AppConfig.class);
MyService service = ctx.getBean(MyService.class);
```

### 17. @Component vs @Bean

| 特性 | @Component | @Bean |
|-----|-----------|-------|
| **作用对象** | 类 | 方法 |
| **使用方式** | 类路径扫描自动装配 | 手动在方法中创建Bean |
| **灵活性** | 较低,适用于自己的类 | 较高,适用于第三方库 |
| **典型场景** | 业务逻辑类 | 第三方类、需要复杂初始化的Bean |

### 18. @RestController vs @Controller

**@Controller** - 返回视图页面
```java
@Controller
public class UserController {
    @GetMapping("/user")
    public String getUser(Model model) {
        return "userView"; // 返回视图名称
    }
}
```

**@RestController** - 返回JSON/XML数据
```java
@RestController
public class UserController {
    @GetMapping("/user")
    public User getUser() {
        return new User(); // 直接返回对象,自动转为JSON
    }
}
```

💡 **等价关系**: @RestController = @Controller + @ResponseBody

> [常用注解](../../../java/spring/spring-annotation.md)

---

## 高级话题

### 19. Spring中的事件机制

Spring提供5种标准事件:

1. **ContextRefreshedEvent** - 容器初始化或刷新时触发
2. **ContextStartedEvent** - 容器启动时触发
3. **ContextStoppedEvent** - 容器停止时触发
4. **ContextClosedEvent** - 容器关闭时触发
5. **RequestHandledEvent** - HTTP请求处理完成时触发

**自定义事件示例**:
```java
// 1. 定义事件
public class CustomEvent extends ApplicationEvent {
    public CustomEvent(Object source, String message) {
        super(source);
    }
}

// 2. 创建监听器
@Component
public class CustomEventListener implements ApplicationListener<CustomEvent> {
    @Override
    public void onApplicationEvent(CustomEvent event) {
        // 处理事件
    }
}

// 3. 发布事件
applicationContext.publishEvent(new CustomEvent(this, "消息"));
```

### 20. IOC容器初始化过程

```
Resource定位 → BeanDefinition载入 → BeanDefinition注册
```

1. **Resource定位** - 定位配置文件位置
2. **载入** - 将配置文件解析为BeanDefinition
3. **注册** - 将BeanDefinition注册到容器

### 21. Spring中使用的设计模式

- **工厂模式** - BeanFactory、ApplicationContext创建Bean
- **单例模式** - Bean默认单例
- **代理模式** - AOP功能实现
- **模板方法模式** - JdbcTemplate、HibernateTemplate
- **观察者模式** - 事件驱动模型
- **适配器模式** - AOP的Advice、MVC的Controller适配
- **包装器模式** - 动态切换数据源

### 22. 注入Java集合

```xml
<!-- List -->
<property name="list">
    <list>
        <value>value1</value>
        <value>value2</value>
    </list>
</property>

<!-- Set -->
<property name="set">
    <set>
        <value>value1</value>
        <value>value2</value>
    </set>
</property>

<!-- Map -->
<property name="map">
    <map>
        <entry key="key1" value="value1"/>
        <entry key="key2" value="value2"/>
    </map>
</property>

<!-- Properties -->
<property name="props">
    <props>
        <prop key="key1">value1</prop>
        <prop key="key2">value2</prop>
    </props>
</property>
```

### 23. 构造器注入 vs Setter注入

| 对比维度 | 构造器注入 | Setter注入 |
|---------|-----------|-----------|
| **依赖完整性** | 保证依赖完整 | 可能不完整 |
| **循环依赖** | 无法解决 | 可以解决 |
| **灵活性** | 较低,需要传入所有参数 | 较高,可选择性注入 |
| **不可变性** | 支持final字段 | 不支持final字段 |
| **适用场景** | 必需依赖 | 可选依赖 |

### 24. Inner Beans(内部Bean)

```xml
<bean id="customer" class="com.example.Customer">
    <property name="person">
        <!-- 内部Bean,仅在customer中使用 -->
        <bean class="com.example.Person">
            <property name="name" value="John"/>
            <property name="age" value="30"/>
        </bean>
    </property>
</bean>
```

### 25. FileSystemResource vs ClassPathResource

- **FileSystemResource** - 需要指定配置文件的相对路径或绝对路径
- **ClassPathResource** - 在classpath中自动搜索配置文件

### 26. Spring循环依赖解决

**✅ 三级缓存结构描述**：

```java
// 一级缓存 — 存放完整可用的 Bean（初始化完成）
Map<String, Object> singletonObjects;

// 二级缓存 — 存放早期暴露的原始 Bean（未完成初始化，属性未注入）
Map<String, Object> earlySingletonObjects;

// 三级缓存 — 存放 ObjectFactory，存 Lambda  需要调用才能得到对象，调用时才决定返回原始还是代理
Map<String, ObjectFactory<?>> singletonFactories;
```

> ⚠️ 三级缓存存的不是"Bean工厂对象"，更准确说是 **ObjectFactory Lambda**，调用它才能拿到早期引用（普通Bean返回原始对象，AOP Bean返回代理对象）。

---

**三级缓存怎么配合工作**：

```
A 依赖 B，B 依赖 A 的循环依赖解决过程：

1. 创建 A 的原始对象
2. 将 A 的 ObjectFactory 放入三级缓存
3. 注入 A 的属性，发现需要 B
4. 创建 B 的原始对象
5. 将 B 的 ObjectFactory 放入三级缓存
6. 注入 B 的属性，发现需要 A
7. 从三级缓存取出 A 的 ObjectFactory，生成 A 的早期引用
8. 将早期引用放入二级缓存，删除三级缓存中的 A
9. B 拿到 A 的早期引用，完成属性注入
10. B 初始化完成，放入一级缓存
11. A 拿到完整的 B，完成属性注入
12. A 初始化完成，放入一级缓存
```

---

**为什么需要三级缓存而不是二级**

```
如果没有三级缓存，只用二级缓存：
  → 提前暴露的只能是原始对象
  → 如果 A 需要被 AOP 代理，其他 Bean 拿到的是原始 A，不是代理 A
  → 最终容器里有两个 A：代理A（一级缓存）和原始A（被其他Bean持有）
  → 数据不一致！

三级缓存的 ObjectFactory 解决了这个问题：
  → 调用时判断是否需要代理，需要则返回代理对象，不需要则返回原始对象
  → 保证其他 Bean 拿到的引用和最终一级缓存的对象一致
```

具体例子从头推演一遍。

```
@Service
public class A {
    @Autowired private B b;
}

@Service
@Aspect          // A 需要被 AOP 代理
public class B {
    @Autowired private A a;
}
```

A 依赖 B，B 依赖 A，且 **A 需要生成代理对象**。

---

假设只有二级缓存，会发生什么

```
第1步: 创建 A 的原始对象  →  A原始
第2步: 把 A原始 放入二级缓存
第3步: A 需要注入 B，开始创建 B
第4步: 创建 B 的原始对象  →  B原始
第5步: B 需要注入 A，从二级缓存取出 →  拿到 A原始
第6步: B 完成初始化，B持有的是 A原始
第7步: A 完成初始化
第8步: Spring 对 A 进行 AOP 代理  →  生成 A代理
第9步: 把 A代理 放入一级缓存

结果：
  一级缓存里是 A代理
  B 持有的是 A原始   ← 和一级缓存里的不是同一个对象！

Controller → A代理  ✅
B 内部用的 → A原始  ❌  

同一个 A，两个身份，数据不一致！

```

:::tip

**为什么第2步不能直接存代理对象**

原因是这个时候根本没办法创建代理对象。

第1步: 刚刚 new 出来 A原始
         ↓
         此时 A 的状态：
           属性还没注入   （@Autowired 的 B 还是 null）
           @PostConstruct 还没执行
           各种后置处理器还没跑
         ↓
         AOP 代理的生成依赖完整的 Bean
         一个"残缺"的对象，没有意义去代理它

**AOP 代理正常的生成时机**

实例化 → 属性注入 → 初始化 → 后置处理器(BeanPostProcessor) → 生成代理对象
                                        ↑
                              代理在这里才生成（第6步之后）

:::

三级缓存如何解决？

```
// 三级缓存存的是这样一个 Lambda
() -> {
    if (A需要AOP代理) {
        return A的代理对象;   // 提前生成代理
    } else {
        return A的原始对象;
    }
}
```

再走一遍流程：
```
第1步: 创建 A 的原始对象  →  A原始
第2步: 把 【生成A引用的Lambda】 放入三级缓存
第3步: A 需要注入 B，开始创建 B
第4步: 创建 B 的原始对象  →  B原始
第5步: B 需要注入 A
         → 从三级缓存取出 Lambda，执行它
         → Lambda 判断 A 需要代理，提前生成 A代理
         → 把 A代理 放入二级缓存（备用）
         → B 拿到的是 A代理  ✅
第6步: B 完成初始化，B持有 A代理
第7步: A 完成初始化
第8步: 从二级缓存取出已经生成好的 A代理，放入一级缓存

结果：
  一级缓存里是 A代理
  B 持有的也是 A代理  ✅ 同一个对象！
```

---

### 一句话总结
```
二级缓存：只能提前暴露原始对象，AOP场景下会导致两个版本的A并存

三级缓存：提前暴露的是一个"按需生成"的工厂
          需要代理 → 提前造代理给别人
          不需要代理 → 给原始对象
          保证所有人拿到的是同一个对象
```

---

**无法解决的场景**

```java
// ❌ 构造器注入，无法解决
// 原因：实例化阶段就需要依赖，还没机会放入三级缓存
@Service
public class A {
    public A(B b) { }  // 构造时就要 B
}

// ❌ @Scope("prototype") 原型Bean，无法解决
// 原因：原型Bean不走三级缓存机制

// ✅ Setter 注入 / @Autowired 字段注入，可以解决
// 原因：先实例化，再注入属性，有机会提前暴露早期引用
```

---

**Spring Boot 2.6+ 的变化**

```yaml
# Spring Boot 2.6 开始默认禁止循环依赖，启动直接报错
# 如需开启（不推荐）：
spring:
  main:
    allow-circular-references: true
```

> 官方态度：**循环依赖本身是设计问题**，应通过拆分类、引入中间层来从根本上解决，而不是依赖框架兜底。

### 27. AOP 中 final方法的注意事项

Spring AOP默认使用CGLIB生成目标对象的子类:

- final方法无法被重写,不会被代理
- 调用final方法时直接调用目标对象的方法
- 可能导致预期的切面逻辑不生效

**建议**: 避免在需要AOP增强的类中使用final方法。

---

## 扩展阅读

- [Spring源码解读](https://app.gitbook.com/@tuonioooo-notebook/s/application-framework/springyuan-ma-jie-du-pian)
- [Spring IoC源码分析](https://javadoop.com/post/spring-ioc)
- [Spring事务管理详解](https://www.ibm.com/developerworks/cn/java/j-master-spring-transactional-use/index.html)
- [Spring循环依赖解决](https://www.cnblogs.com/zzq6032010/p/11406405.html)