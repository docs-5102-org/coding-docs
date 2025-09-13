---
title: Shardingsphere实现分库分表
category:
  - Web框架
tag:
  - Spring Boot
  - 
---

# SpringBoot Shardingsphere实现分库分表

## 概述

Apache ShardingSphere是一个开源的分布式 SQL 事务和查询引擎，用于任何数据库上的数据分片、扩展、加密的工具。

## 相关资源链接

### 官方资源
- **GitHub主仓库**: [https://github.com/apache/shardingsphere](https://github.com/apache/shardingsphere)
- **官方文档**: [https://shardingsphere.apache.org/](https://shardingsphere.apache.org/)
- **示例代码**: [https://github.com/apache/shardingsphere-example](https://github.com/apache/shardingsphere-example)
- **实战项目**: [miliqk-manage](https://gitee.com/miliqk-org/miliqk-manage)

### 其他教程

- **第三方教程**: https://www.jianshu.com/p/0ae1451b3a69

## 核心概念

### 分库（Sharding Database）
将数据分散到多个数据库中，通常按照某个字段（如用户ID）进行水平分割。

### 分表（Sharding Table）
将单个表的数据分散到多个表中，可以在同一个数据库中，也可以跨数据库。

### 分片键（Sharding Key）
用于分片路由的数据库字段，决定数据存储到哪个分片中。

## 环境准备

### 1. Maven依赖

```xml
<dependencies>
    <!-- Spring Boot Starter -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    
    <!-- Spring Boot JPA -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    
    <!-- Sharding-JDBC -->
    <dependency>
        <groupId>io.shardingsphere</groupId>
        <artifactId>sharding-jdbc-spring-boot-starter</artifactId>
        <version>3.1.0</version>
    </dependency>
    
    <!-- MySQL驱动 -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Druid连接池 -->
    <dependency>
        <groupId>com.alibaba</groupId>
        <artifactId>druid-spring-boot-starter</artifactId>
        <version>1.1.22</version>
    </dependency>
</dependencies>
```

### 2. 数据库准备

创建两个数据库：`order_db_0` 和 `order_db_1`

```sql
-- 创建数据库
CREATE DATABASE order_db_0;
CREATE DATABASE order_db_1;

-- 在每个数据库中创建表
USE order_db_0;
CREATE TABLE t_order_0 (
    order_id BIGINT PRIMARY KEY,
    user_id INT NOT NULL,
    order_status VARCHAR(50),
    create_time DATETIME
);

CREATE TABLE t_order_1 (
    order_id BIGINT PRIMARY KEY,
    user_id INT NOT NULL,
    order_status VARCHAR(50),
    create_time DATETIME
);

-- 同样的表结构在 order_db_1 中也要创建
USE order_db_1;
CREATE TABLE t_order_0 (
    order_id BIGINT PRIMARY KEY,
    user_id INT NOT NULL,
    order_status VARCHAR(50),
    create_time DATETIME
);

CREATE TABLE t_order_1 (
    order_id BIGINT PRIMARY KEY,
    user_id INT NOT NULL,
    order_status VARCHAR(50),
    create_time DATETIME
);
```

## 配置文件

### application.yml 配置

```yaml
spring:
  shardingsphere:
    datasource:
      names: ds0,ds1
      ds0:
        type: com.alibaba.druid.pool.DruidDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/order_db_0?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=GMT%2B8
        username: root
        password: your_password
      ds1:
        type: com.alibaba.druid.pool.DruidDataSource
        driver-class-name: com.mysql.cj.jdbc.Driver
        url: jdbc:mysql://localhost:3306/order_db_1?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=GMT%2B8
        username: root
        password: your_password
    
    sharding:
      tables:
        t_order:
          actual-data-nodes: ds$->{0..1}.t_order_$->{0..1}
          table-strategy:
            inline:
              sharding-column: order_id
              algorithm-expression: t_order_$->{order_id % 2}
          database-strategy:
            inline:
              sharding-column: user_id
              algorithm-expression: ds$->{user_id % 2}
          key-generator:
            column: order_id
            type: SNOWFLAKE
    
    props:
      sql:
        show: true # 显示SQL语句
      
  jpa:
    hibernate:
      ddl-auto: none
    show-sql: true
    database-platform: org.hibernate.dialect.MySQL8Dialect
```

## 实体类

### Order实体类

```java
package com.example.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "t_order")
public class Order {
    
    @Id
    private Long orderId;
    
    @Column(name = "user_id")
    private Integer userId;
    
    @Column(name = "order_status")
    private String orderStatus;
    
    @Column(name = "create_time")
    private LocalDateTime createTime;
    
    // 构造方法
    public Order() {}
    
    public Order(Integer userId, String orderStatus) {
        this.userId = userId;
        this.orderStatus = orderStatus;
        this.createTime = LocalDateTime.now();
    }
    
    // Getter和Setter方法
    public Long getOrderId() {
        return orderId;
    }
    
    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }
    
    public Integer getUserId() {
        return userId;
    }
    
    public void setUserId(Integer userId) {
        this.userId = userId;
    }
    
    public String getOrderStatus() {
        return orderStatus;
    }
    
    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }
    
    public LocalDateTime getCreateTime() {
        return createTime;
    }
    
    public void setCreateTime(LocalDateTime createTime) {
        this.createTime = createTime;
    }
    
    @Override
    public String toString() {
        return "Order{" +
                "orderId=" + orderId +
                ", userId=" + userId +
                ", orderStatus='" + orderStatus + '\'' +
                ", createTime=" + createTime +
                '}';
    }
}
```

## Repository接口

### OrderRepository

```java
package com.example.repository;

import com.example.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    
    List<Order> findByUserId(Integer userId);
    
    List<Order> findByOrderStatus(String orderStatus);
    
    @Query("SELECT o FROM Order o WHERE o.userId = :userId AND o.orderStatus = :status")
    List<Order> findByUserIdAndStatus(@Param("userId") Integer userId, 
                                      @Param("status") String status);
}
```

## Service层

### OrderService

```java
package com.example.service;

import com.example.entity.Order;
import com.example.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {
    
    @Autowired
    private OrderRepository orderRepository;
    
    public Order createOrder(Integer userId, String orderStatus) {
        Order order = new Order(userId, orderStatus);
        return orderRepository.save(order);
    }
    
    public List<Order> findOrdersByUserId(Integer userId) {
        return orderRepository.findByUserId(userId);
    }
    
    public List<Order> findOrdersByStatus(String status) {
        return orderRepository.findByOrderStatus(status);
    }
    
    public Optional<Order> findOrderById(Long orderId) {
        return orderRepository.findById(orderId);
    }
    
    public List<Order> findAllOrders() {
        return orderRepository.findAll();
    }
    
    public Order updateOrderStatus(Long orderId, String newStatus) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            Order order = orderOpt.get();
            order.setOrderStatus(newStatus);
            return orderRepository.save(order);
        }
        throw new RuntimeException("Order not found with id: " + orderId);
    }
    
    public void deleteOrder(Long orderId) {
        orderRepository.deleteById(orderId);
    }
}
```

## Controller层

### OrderController

```java
package com.example.controller;

import com.example.entity.Order;
import com.example.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @PostMapping
    public ResponseEntity<Order> createOrder(@RequestParam Integer userId, 
                                           @RequestParam String orderStatus) {
        Order order = orderService.createOrder(userId, orderStatus);
        return ResponseEntity.ok(order);
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Order>> getOrdersByUserId(@PathVariable Integer userId) {
        List<Order> orders = orderService.findOrdersByUserId(userId);
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Order>> getOrdersByStatus(@PathVariable String status) {
        List<Order> orders = orderService.findOrdersByStatus(status);
        return ResponseEntity.ok(orders);
    }
    
    @GetMapping("/{orderId}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long orderId) {
        Optional<Order> order = orderService.findOrderById(orderId);
        return order.map(ResponseEntity::ok)
                   .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        List<Order> orders = orderService.findAllOrders();
        return ResponseEntity.ok(orders);
    }
    
    @PutMapping("/{orderId}")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long orderId, 
                                                  @RequestParam String newStatus) {
        try {
            Order updatedOrder = orderService.updateOrderStatus(orderId, newStatus);
            return ResponseEntity.ok(updatedOrder);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long orderId) {
        orderService.deleteOrder(orderId);
        return ResponseEntity.ok().build();
    }
}
```

## 启动类

### Application

```java
package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ShardingJdbcApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(ShardingJdbcApplication.class, args);
    }
}
```

## 测试验证

### 创建测试类

```java
package com.example;

import com.example.entity.Order;
import com.example.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class ShardingJdbcTest {
    
    @Autowired
    private OrderService orderService;
    
    @Test
    public void testCreateOrders() {
        // 创建不同用户的订单，验证分库分表
        for (int i = 1; i <= 10; i++) {
            Order order = orderService.createOrder(i, "PENDING");
            System.out.println("Created order: " + order);
        }
    }
    
    @Test
    public void testQueryOrders() {
        // 查询特定用户的订单
        List<Order> userOrders = orderService.findOrdersByUserId(1);
        System.out.println("User 1 orders: " + userOrders);
        
        // 查询所有订单
        List<Order> allOrders = orderService.findAllOrders();
        System.out.println("Total orders: " + allOrders.size());
    }
}
```

## 分片策略说明

### 1. 分库策略
- **分片键**: `user_id`
- **算法**: `ds$->{user_id % 2}`
- **说明**: 根据用户ID取模，偶数用户存储在ds0，奇数用户存储在ds1

### 2. 分表策略
- **分片键**: `order_id`
- **算法**: `t_order_$->{order_id % 2}`
- **说明**: 根据订单ID取模，偶数订单存储在t_order_0，奇数订单存储在t_order_1

### 3. 主键生成策略
- **类型**: SNOWFLAKE
- **说明**: 使用雪花算法生成分布式唯一ID

## 高级配置

### 1. 读写分离配置

```yaml
spring:
  shardingsphere:
    masterslave:
      name: ms
      master-data-source-name: ds0
      slave-data-source-names: ds1
      load-balance-algorithm-type: round_robin
```

### 2. 多种分片算法

```yaml
spring:
  shardingsphere:
    sharding:
      tables:
        t_order:
          table-strategy:
            standard:
              sharding-column: create_time
              range-algorithm-class-name: com.example.algorithm.OrderRangeShardingAlgorithm
              precise-algorithm-class-name: com.example.algorithm.OrderPreciseShardingAlgorithm
```

## 最佳实践

### 1. 分片键选择原则
- 选择查询频率高的字段作为分片键
- 避免跨分片查询
- 考虑数据分布的均匀性

### 2. 事务处理
- Sharding-JDBC支持弱XA事务
- 避免跨库事务，优先使用单库事务
- 考虑使用分布式事务方案

### 3. 性能优化
- 合理设计分片规则
- 使用批量操作减少网络开销
- 避免全表扫描和跨分片关联查询

## 常见问题

### 1. 跨分片查询问题
**问题**: 需要查询多个分片的数据
**解决**: 使用Hint强制路由或重新设计查询逻辑

### 2. 分布式主键冲突
**问题**: 不同分片可能生成相同主键
**解决**: 使用SNOWFLAKE或UUID等分布式ID生成策略

### 3. 数据迁移问题
**问题**: 现有数据如何迁移到分片环境
**解决**: 使用数据迁移工具或编写迁移脚本

## 总结

本教程详细介绍了Spring Boot集成Sharding-JDBC实现分库分表的完整流程，包括：

1. 环境搭建和依赖配置
2. 分库分表策略配置
3. 实体类、Repository、Service和Controller的实现
4. 测试验证和性能优化建议

通过本教程，您可以快速上手Sharding-JDBC，实现高性能的分库分表解决方案。

## 参考资源

- **官方文档**: [http://shardingjdbc.io/docs/00-overview/](http://shardingjdbc.io/docs/00-overview/)
- **GitHub示例**: [https://github.com/shardingjdbc/sharding-jdbc-example](https://github.com/shardingjdbc/sharding-jdbc-example)
- **源码仓库**: [https://github.com/shardingjdbc](https://github.com/shardingjdbc)
