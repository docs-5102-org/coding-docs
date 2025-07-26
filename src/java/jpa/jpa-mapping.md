---
title: JPA 实体映射完整指南
category:
  - 持久层框架
tag:
  - Jpa
  - 实体映射
---


# JPA 实体映射完整指南

## 目录
1. [基础实体映射注解](#基础实体映射注解)
2. [主键生成策略](#主键生成策略)
3. [字段映射注解](#字段映射注解)
4. [高级映射注解](#高级映射注解)
5. [一对一关联映射](#一对一关联映射)
6. [一对多和多对一关联映射](#一对多和多对一关联映射)
7. [级联操作](#级联操作)
8. [最佳实践](#最佳实践)

## 基础实体映射注解

### @Entity
标识一个类为JPA实体类，对应数据库中的一张表。
```java
@Entity(name="EntityName") // name属性可选，对应实体类的名称，不区分大小写
public class WorkManage {
    // 实体属性
}
```

### @Table
配合@Entity使用，指定实体对应的数据库表的详细信息。
```java
@Table(name = "work_manage", catalog = "", schema = "")
@Entity
public class WorkManage {
    // 实体属性
}
```
- **name**: 表名，默认与实体名一致
- **catalog**: 数据库目录名，可选
- **schema**: 数据库模式名，可选

### @Id
标识实体的主键属性，每个实体必须有且仅有一个主键。
```java
@Id
@Column(name = "WORKID")
private String workid;
```

## 主键生成策略

### @GeneratedValue
配置主键的生成策略，支持四种策略：

#### 1. IDENTITY - 自动增长
依赖数据库的自增主键功能：
```java
@Entity
@Table(name = "defacement")
public class Defacement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ID")
    private Integer id;
}
```

#### 2. TABLE - 表生成
通过额外的表来生成主键，适用于数据库迁移：
```java
@Id
@GeneratedValue(strategy = GenerationType.TABLE)
@Column(name = "user_code", nullable = false)
private String userCode;
```

更详细参考：[GenerationType.TABLE映射原理](./jpa-mapping-table.md)

#### 3. SEQUENCE - 序列生成
使用数据库序列生成主键：
```java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE)
@SequenceGenerator(name = "seq_user")
@Column(name = "user_id", nullable = false)
private int userId;
```

> 这种方式依赖于数据库是否有SEQUENCE，如果没有就不能用

#### 4. AUTO - 自动选择
让ORM框架自动选择合适的生成策略（默认）。

## 字段映射注解

### @Basic
表示简单属性到数据库字段的映射，通常可以省略：
```java
@Basic(optional = false, fetch = FetchType.EAGER)
public String getAddress() {
    return address;
}
```
- **fetch**: 抓取策略（EAGER/LAZY）
- **optional**: 是否允许为null,默认为true

### @Column
描述数据库表中字段的详细定义：
```java
@Column(
    name = "BIRTH",
    nullable = false,
    unique = false,
    length = 255,
    insertable = true,
    updatable = true,
    columnDefinition = "DATE"
)
public String getBirthday() {
    return birthday;
}
```
- **name**: 字段名称
- **nullable**: 是否允许为null
- **unique**: 是否唯一
- **length**: 字段长度（仅对String有效）
- **insertable**: 插入时是否包含
- **updatable**: 更新时是否包含
- **columnDefinition**: 数据库中的实际类型，通常ORM框架可以根据属性类型自动判断数据库中字段的类型，但是对于Date类型仍无法确定数据库中字段类型究竟是 DATE,TIME还是TIMESTAMP.此外，String的默认映射类型为VARCHAR,如果要将String类型映射到特定数据库的BLOB或 TEXT字段类型,该属性非常有用.

### @Transient
标识属性不映射到数据库字段：
```java
@Transient
public int getAge() {
    return getYear(new Date()) - getYear(birth);
}
```

## 高级映射注解

### @MappedSuperclass
将超类的JPA注解传递给子类：
```java
@MappedSuperclass
public class Employee {
    @Id
    private Long id;
    private String name;
}

@Entity
public class Engineer extends Employee {
    // 继承了Employee的JPA注解
}
```

### @Embedded 和 @Embeddable
将多个字段组合成一个类：
```java
@Embeddable
public class Address {
    private String city;
    private String street;
    private String zip;
}

@Entity
public class User {
    @Embedded
    private Address address;
}
```

详细示例：https://blog.csdn.net/lmy86263/article/details/52108130

### @OrderBy
指定集合字段的排序规则：
```java
@OrderBy("group_name ASC, name DESC")
private List<Book> books = new ArrayList<>();
```

### @Lob
处理大字段类型：
```java
@Lob
@Column(name = "PHOTO")
private Serializable photo; // 对应Blob字段类型

@Lob
@Column(name = "DESCRIPTION")
private String description; // 对应Clob字段类型
```

## 一对一关联映射

### 单向一对一
```java
@Entity
@Table(name = "people")
public class People {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    private String name;
    
    @OneToOne
    @JoinColumn(name = "pet_fk") // 在people表中添加外键
    private Pet pet;
}

@Entity
@Table(name = "pet")
public class Pet {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;
    
    private String name;
    // 单向关联，Pet中没有指向People的属性
}
```

### 双向一对一
主实体（持有外键的一方）：
```java
@Entity
@Table(name = "T_ONEA")
public class OneA {
    @Id
    @Column(name = "ONEA_ID")
    private String oneaId;
    
    //主Pojo这方的设置比较简单，只要设置好级联和映射到从Pojo的外键就可以了。
    @OneToOne(cascade = CascadeType.ALL, mappedBy = "oneA")
    private OneB oneB;
}
```

从实体（被关联的一方）：
```java
@Entity
@Table(name = "T_ONEB")
public class OneB {
    @Id
    @Column(name = "ONEB_ID")
    private String onebId;
    
    //设置从方指向主方的关联外键，这个ONEA_ID其实是表T_ONEA的主键
    @OneToOne
    @JoinColumn(name = "ONEA_ID", unique = true, referencedColumnName = "ONEA_ID")
    private OneA oneA;
}
```

简单测试

```java
OneA oneA = new OneA();
OneB oneB = new OneB();
oneA.setOneB(oneB);
oneB.setOneA(oneA);
jpaRepository.save(oneA);//即可级联保存oneB
```

@OneToOne源码解读

```java
@Target({METHOD, FIELD})
@Retention(RUNTIME)
public @interface OneToOne {

/**
* (非强制/随意)关联的目标的实体类，默认是当前字段或者属性来存储
*/
Class targetEntity() default void.class;

/**
* (非强制/随意) 必须级联到关联目标的操作。默认是不级联的
*/
CascadeType[] cascade() default {};

/**
* (非强制/随意) 是否赖加载该级联，还是马上获取级联
* 急切获取级联策略是持久性提供程序运行时上的一个要求，即必须急切地获取相关实体并加载到内存
* 赖加载策略是持久性提供程序运行时上的一个要求并不马上加载到内存.
*/
FetchType fetch() default EAGER;

/**
* (非强制/随意) 级联是否可选. 如果将设置为false，则必须始终存在非空关系。
*/
boolean optional() default true;

/** (非强制/随意) 关联关系的字段或者属性.
*/
String mappedBy() default "";


/**
* (非强制/随意)是否将删除操作应用于已将*从关系中删除的实体，并将删除操作级联到*这些实体.
* @since Java Persistence 2.0
*/
boolean orphanRemoval() default false;
}
```

## 一对多和多对一关联映射

### 注解讲解


#### @ManyToOne表示一个多对一的映射,该注解标注的属性通常是数据库表的外键

- **optional**: 是否允许该字段为null,该属性应该根据数据库表的外键约束来确定,默认为true
- **fetch**: 表示抓取策略,默认为FetchType.EAGER
- **cascade**: 表示默认的级联操作策略,可以指定为ALL、PERSIST、MERGE、REFRESH和REMOVE中的若干组合,默认为无级联操作
- **targetEntity**: 表示该属性关联的实体类型.该属性通常不必指定,ORM框架根据属性类型自动判断targetEntity.


```java
//订单Order和用户User是一个ManyToOne的关系
//在Order类中定义
@ManyToOne
@JoinColumn(name=”USER”)
public User getUser() {
   return user;
}
```

#### @OneToMany(fetch=FetchType,cascade=CascadeType)

`@OneToMany`描述一个一对多的关联,该属性应该为集体类型,在数据库中并没有实际字段.

- **fetch**: 表示抓取策略,默认为FetchType.LAZY,因为关联的多个对象通常不必从数据库预先读取到内存
- **cascade**: 表示级联操作策略,对于OneToMany类型的关联非常重要,通常该实体更新或删除时,其关联的实体也应当被更新或删除

例如: 实体User和Order是OneToMany的关系,则实体User被删除时,其关联的实体Order也应该被全部删除

```java
@OneTyMany(cascade=ALL)
public List getOrders() {
        return orders;
}
```

#### @JoinColumn

@JoinColumn和@Column类似，描述的不是一个简单字段，而是一个关联字段,例如.描述一个@ManyToOne的字段.

name:该字段的名称.由于@JoinColumn描述的是一个关联字段,如ManyToOne,则默认的名称由其关联的实体决定.

例如,实体Order有一个user属性来关联实体User,则Order的user属性为一个外键,

其默认的名称为实体User的名称+下划线+实体User的主键名称

示例：见@ManyToOne

### @ManyToOne 单向关联

```java
@Entity
@Table(name = "t_order")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;
    
    private String orderName;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id") // 必须指定关联字段
    private User user;
}

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private Integer age;
}
```

dao

```java

/**
 * @author tony
 */
public interface OrderRepository extends JpaRepository<Order, Long> {

}
//=======================================================================================
/**
 * @author tony
 */
public interface UserRepository extends JpaRepository<User, Long> {

}
```

测试类

```java
@RunWith(SpringRunner.class)
@SpringBootTest
public class SpringbootJpaCascadeApplicationTests {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void contextLoads() {
    }

    /**
     * @ManyToOne 单向关联测试
     */
    @Test
    public void cascadeSingle(){

        User user = new User();
        user.setId(1l);
        user.setAge(20);
        user.setName("ALLEN");
        userRepository.save(user);

        Order order = new Order(null,"袜子", user);
        Order order2 = new Order(null,"裤子", user);
        //保存
        orderRepository.save(order);
        orderRepository.save(order2);

        //获取

        //getOne仅仅是通过代理获取并且仅仅是延迟加载策略
        //findById两种策略都支持
        Order getOrder = orderRepository.findById(order.getOrderId()).get();
        System.out.println("getOrder.getOrderName() = " + getOrder.getOrderName());
        System.out.println("getOrder.getUser().getName() = " + getOrder.getUser().getName());
    }
}
```

::: tip

单向关联的一方，必须配置其JoinColumn，指定关联字段，注意延迟加载和立即抓取策略的使用方式，代码里已经注释，

注意其实体类名不能与Mysql关键字冲突等问题MySQL server version for the right syntax to use near
:::

### @OneToMany 单向关联

```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Integer age;
    
    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id") // 指定关联字段
    private Set<Order> orders = new LinkedHashSet<>();
}
```
dao参考上方

测试类

```java
/**
     * @OneToMany单向关联测试
     */
    @Test
    public void testOneToMany(){
        Order order1 = new Order(1l, "上衣", 1);
        Order order2 = new Order(2l, "裤子", 1);
        Order order3 = new Order(3l, "胸罩", 1);

        Set<Order> orders = new LinkedHashSet<>();
        orders.add(order1);
        orders.add(order2);
        orders.add(order3);

        User user = new User(1l, "Kobe", 20, orders);
        //保存
        userRepository.save(user);//级联保存，因为配置了CascadeType.ALL
        //级联查询
        //findAll方法默认是  FetchType.LAZY策略，需要修改FetchType.EAGER，可以抓取到子表
        List<User> userList = userRepository.findAll();
        userList.forEach(user1 -> {
            System.out.println("user1.getName() = " + user1.getName());
            user1.getOrders().forEach(order -> {
                System.out.println("order.getOrderName() = " + order.getOrderName());
            });
        });

    }
```

::: tip
单向关联的一方，必须配置其JoinColumn，指定关联字段，注意延迟加载和立即抓取策略的使用方式，代码里已经注释，

注意其实体类名不能与Mysql关键字冲突等问题MySQL server version for the right syntax to use near，

注意级联保存的使用方式，CascadeType.ALL，注意抓取策略的实现方式FetchType.EAGER、FetchType.Lazy
:::

### 双向关联（推荐配置）
一方（User）：
```java
@Entity
public class User {
    @Id
    @GeneratedValue(generator = "uuidGenerator")
    @GenericGenerator(name = "uuidGenerator", strategy = "uuid")
    private String id;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
}
```

多方（Order）：
```java
@Entity
@Table(name = "t_order")
public class Order {
    @Id
    @GeneratedValue(generator = "uuidGenerator")
    @GenericGenerator(name = "uuidGenerator", strategy = "uuid")
    private String id;
    
    private String orderName;
    
    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "user_id")
    private User user;
}
```

示例

```java
@Test
public void testOneToManyPersist(){
    Customer customer=new Customer();
    customer.setAge(16);
    customer.setBirth(new Date());
    customer.setCreatedTime(new Date());
    customer.setEmail("CC@163.com");
    customer.setLastName("AA");
    
    Order order1=new Order();
    order1.setOrderName("o-CC-1");
    
    Order order2=new Order();
    order2.setOrderName("o-CC-2");
    
    //建立关联关系
    customer.getOrders().add(order1);
    customer.getOrders().add(order2);
    //执行保存操作
    entityManager.persist(customer);
    entityManager.persist(order1);
    entityManager.persist(order2);    
}
```

::: tip

双向配置关联：@OneToMany一方配置相对简单，不需要配置关联字段，@manyToOne一方配置除了基本配置外，需要配置关联字段映射。

orphanRemoval = true：可以参考 更新的同时删除多的一方的旧数据
:::

### 级联清空关联关系

```java
public void updateAttributes(MicroForm microForm){
    BeanUtilsHelper.copyProperties(this, microForm);
    microForm.getMicroAppraisalForms().stream().forEach(microAppraisalForm -> {
        MicroAppraisal microAppraisal = new MicroAppraisal();
        BeanUtilsHelper.copyProperties(microAppraisal, microAppraisalForm);
        this.clearDetail();
        this.details.add(microAppraisal);
        microAppraisal.setMicroPage(this);
    });
    this.updateTime = new Date();
}

private void clearDetail(){
    this.details.stream().forEach(microAppraisal -> {
        microAppraisal.setMicroPage(null);
    });
    this.details.clear();
}
```

### 避免中间表生成

在双向一对多关联中，务必在@OneToMany中使用`mappedBy`属性，这样可以：
1. 避免自动生成多余的中间表
2. 让多的一方维护关联关系，减少SQL语句执行

## 级联操作

### CascadeType 类型详解

```java
public enum CascadeType {
    PERSIST,  // 级联保存
    REMOVE,   // 级联删除
    MERGE,    // 级联更新
    DETACH,   // 级联脱管
    REFRESH,  // 级联刷新
    ALL       // 所有级联操作
}
```

#### CascadeType.PERSIST
级联保存操作，当前实体保存时，级联保存关联实体：
```java
@OneToMany(cascade = CascadeType.PERSIST)
private List<Order> orders;
```

#### CascadeType.REMOVE
级联删除操作，删除当前实体时，关联实体也被删除：
```java
@OneToMany(cascade = CascadeType.REMOVE)
private List<Order> orders;
```

#### CascadeType.MERGE
级联更新操作，当前实体数据改变时，关联实体数据也相应更新：
```java
@OneToMany(cascade = CascadeType.MERGE)
private List<Order> orders;
```

#### CascadeType.ALL
拥有所有级联操作权限：
```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
private List<Order> orders;
```

### orphanRemoval 属性
用于在更新时删除多的一方的旧数据：
```java
@OneToMany(cascade = CascadeType.ALL, mappedBy = "applyObject", orphanRemoval = true)
private List<ApplyObjectList> applyObjectList;
```

## 最佳实践

### 1. 双向关联配置原则
- 使用多的一方维护关联关系
- 在@OneToMany中使用`mappedBy`属性
- 避免在@OneToMany中使用@JoinColumn

### 2. 级联操作选择
- 谨慎使用CascadeType.REMOVE，避免误删数据
- 根据业务需求选择合适的级联策略
- 使用orphanRemoval处理旧数据清理

### 3. 性能优化
- 合理选择FetchType（EAGER/LAZY）
- 对于集合属性，默认使用FetchType.LAZY
- 根据查询频率调整抓取策略

### 4. 数据完整性
- 正确设置nullable属性
- 使用unique约束保证数据唯一性
- 合理使用columnDefinition指定数据类型

### 5. 命名规范
- 实体类使用驼峰命名
- 数据库表和字段使用下划线分隔
- 外键命名规范：表名_id

## 示例代码总结

完整的用户订单关系示例：
```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();
    
    // 级联清空关联关系的方法
    public void updateOrders(List<Order> newOrders) {
        clearOrders();
        newOrders.forEach(order -> {
            this.orders.add(order);
            order.setUser(this);
        });
    }
    
    private void clearOrders() {
        this.orders.forEach(order -> order.setUser(null));
        this.orders.clear();
    }
}

@Entity
@Table(name = "t_order")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderId;
    
    @Column(name = "order_name")
    private String orderName;
    
    @ManyToOne(cascade = CascadeType.PERSIST)
    @JoinColumn(name = "user_id")
    private User user;
}
```

通过以上配置，可以实现完整的JPA实体映射，支持各种关联关系和级联操作，确保数据的一致性和完整性。