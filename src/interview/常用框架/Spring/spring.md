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

### 4. 什么是IOC?

IOC(Inversion of Control)即控制反转,是Spring的核心概念。

**传统方式**: 对象自己控制内部成员的创建和管理  
**IOC方式**: 将对象的创建和管理权交给Spring容器

**优势**: 降低耦合度,提高代码可维护性和可测试性

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

Spring通过三级缓存解决循环依赖:

1. **一级缓存** - 存放完整的Bean实例
2. **二级缓存** - 存放早期暴露的Bean实例
3. **三级缓存** - 存放Bean工厂对象

**注意**: 只能解决setter注入的循环依赖,构造器注入的循环依赖无法解决。

### 27. AOP中final方法的注意事项

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