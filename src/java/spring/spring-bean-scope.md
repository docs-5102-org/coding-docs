---
title: Spring Bean的生命周期
category:
  - Web框架
tag:
  - Spring Bean的生命周期
---

# Spring Bean的作用域和生命周期

## 概述

Spring框架中的Bean是应用程序的核心组件，理解Bean的作用域和生命周期对于开发高质量的Spring应用至关重要。本文将详细介绍Spring Bean的各种作用域以及完整的生命周期流程。

## 一、Bean的作用域（Scope）

Spring提供了多种Bean作用域，用于控制Bean实例的创建和管理方式。默认情况下，Bean采用单例模式（`scope="singleton"`）。

### 1. Singleton（单例）

**定义**：这是Spring容器的默认作用域，在整个Bean容器中仅保留一个实例对象供所有调用者共享引用。

**特点**：
- 容器启动时创建实例
- 全局共享同一个实例
- 线程安全需要开发者自行保证

**适用场景**：无会话状态的Bean，如：
- 辅助工具类
- DAO组件
- 业务逻辑组件

**配置示例**：
```xml
<bean id="userService" class="com.example.UserService" scope="singleton"/>
```

### 2. Prototype（原型）

**定义**：多实例作用域，针对每次不同的请求，Bean容器均会生成一个全新的Bean实例。

**特点**：
- 每次请求都创建新实例
- Spring不负责prototype Bean的完整生命周期管理
- 客户端负责实例的销毁

**适用场景**：需要保持会话状态的Bean实例

**配置示例**：
```xml
<bean id="shoppingCart" class="com.example.ShoppingCart" scope="prototype"/>
```

###  Singleton vs Prototype

#### SpringMVC Controller 单例与多例属性对比表

| 配置模式 | 作用域注解 | 普通属性表现 | 静态属性表现 | 测试结果 |
|---------|-----------|------------|------------|---------|
| **多例模式** | `@Scope("prototype")` | **不共享** - 每次请求创建新实例，普通属性独立 | **共享** - 静态属性在所有实例间共享 | 普通属性始终为0，静态属性递增(0,1,2,3...) |
| **单例模式** | `@Scope("singleton")` | **共享** - 同一实例的普通属性被多个请求共享 | **共享** - 静态属性在所有请求间共享 | 普通属性和静态属性都递增(0,1,2,3...) |
| **默认模式** | 无`@Scope`注解 | **共享** - SpringMVC默认单例，普通属性被共享 | **共享** - 静态属性在所有请求间共享 | 普通属性和静态属性都递增(0,1,2,3...) |

#### 关键差异说明

##### 普通属性的区别

1. **多例模式下**：
   - 每次HTTP请求都创建新的Controller实例
   - 每个实例都有自己独立的普通属性
   - 多个并发请求之间的普通属性**互不影响**

2. **单例模式下**：
   - 整个应用只有一个Controller实例
   - 所有HTTP请求共享同一个实例的普通属性
   - 多个并发请求会**相互影响**普通属性的值

##### 静态属性的特点

- 无论单例还是多例，**静态属性都是共享的**
- 静态属性属于类本身，不属于任何实例
- 在JVM中只有一份副本

#### 线程安全性分析

| 模式 | 普通属性线程安全性 | 静态属性线程安全性 | 推荐使用场景 |
|-----|------------------|------------------|------------|
| **多例** | ✅ 安全 | ❌ 不安全 | 需要在Controller中定义实例属性时 |
| **单例** | ❌ 不安全 | ❌ 不安全 | 无状态Controller（推荐） |

#### 最佳实践建议

1. **推荐做法**：使用SpringMVC默认的单例模式，但**不在Controller中定义任何属性**
2. **原因**：SpringMVC基于方法开发，参数通过方法参数传递，方法执行完毕后参数自动销毁
3. **特殊情况**：如果必须在Controller中定义属性，使用`@Scope("prototype")`改为多例模式
4. **性能考虑**：单例模式性能更好，避免频繁创建销毁对象

这种设计体现了SpringMVC相比Struts的优势：通过基于方法的开发模式和合理的作用域管理，在保证线程安全的同时提升了性能。

### 3. Request（请求）

**定义**：针对每次HTTP请求，Spring容器会创建一个全新的Bean实例，该实例仅在当前HTTP请求内有效。

**特点**：
- 每个HTTP请求创建独立实例
- 请求结束时实例被销毁
- 仅在Web应用中有效

**适用场景**：Web应用中需要在请求期间保持状态的组件

### 4. Session（会话）

**定义**：针对每个HTTP Session，Spring容器会创建一个全新的Bean实例，该实例仅在当前HTTP Session内有效。

**特点**：
- 每个用户会话拥有独立实例
- Session结束时实例被销毁
- 仅在Web应用中有效

**适用场景**：用户会话相关的数据存储

### 5. Global Session（全局会话）

**定义**：类似于HTTP Session作用域，但仅在基于Portlet的Web应用中有意义。

**特点**：
- 适用于Portlet环境
- 在标准Servlet环境中等同于Session作用域
- 仅在Web应用中有效

## 二、Bean的生命周期

Bean的生命周期管理是Spring容器的核心功能之一。根据容器类型的不同，生命周期流程略有差异。

### BeanFactory中的Bean生命周期

BeanFactory是Spring最基础的容器，Bean的生命周期包括以下步骤：

#### 创建阶段

1. **实例化前处理**
   - 调用`InstantiationAwareBeanPostProcessor.postProcessBeforeInstantiation()`方法

2. **实例化**
   - 通过构造函数创建Bean实例

3. **实例化后处理**
   - 调用`InstantiationAwareBeanPostProcessor.postProcessAfterInstantiation()`方法

4. **属性设置**
   - 调用setter方法设置属性值

#### 初始化阶段

5. **Aware接口回调**
   - 调用`BeanNameAware.setBeanName()`方法
   - 调用`BeanFactoryAware.setBeanFactory()`方法

6. **初始化前处理**
   - 调用`InstantiationAwareBeanPostProcessor.postProcessBeforeInitialization()`方法
   - 调用`BeanPostProcessor.postProcessBeforeInitialization()`方法

7. **初始化**
   - 调用`InitializingBean.afterPropertiesSet()`方法
   - 调用`init-method`属性配置的方法

8. **初始化后处理**
   - 调用`InstantiationAwareBeanPostProcessor.postProcessAfterInitialization()`方法
   - 调用`BeanPostProcessor.postProcessAfterInitialization()`方法

#### 使用阶段

9. **实例管理**
   - 单例Bean：存入缓存池，由Spring容器管理
   - 原型Bean：交由调用者管理

#### 销毁阶段

10. **销毁处理**
    - 调用`DisposableBean.destroy()`方法
    - 调用`destroy-method`属性配置的方法

### ApplicationContext中的Bean生命周期

ApplicationContext是BeanFactory的扩展实现，其Bean生命周期在BeanFactory基础上增加了：

- 在`BeanFactoryAware`接口后增加`ApplicationContextAware.setApplicationContext()`方法调用

### 生命周期配置示例

#### 手动添加BeanPostProcessor

```java
ConfigurableBeanFactory bf = (ConfigurableBeanFactory) applicationContext;
bf.addBeanPostProcessor(new MyBeanPostProcessor());
```

#### 自定义初始化和销毁方法

```xml
<bean id="userService" 
      class="com.example.UserService"
      init-method="init"
      destroy-method="cleanup"/>
```

```java
@Component
public class UserService implements InitializingBean, DisposableBean {
    
    @Override
    public void afterPropertiesSet() throws Exception {
        // 初始化逻辑
    }
    
    @Override
    public void destroy() throws Exception {
        // 销毁逻辑
    }
}
```

## 三、最佳实践

### 作用域选择原则

1. **无状态组件**：使用Singleton作用域
2. **有状态组件**：使用Prototype作用域
3. **Web组件**：根据业务需求选择Request或Session作用域

### 生命周期管理建议

1. **合理使用初始化方法**：进行资源初始化
2. **正确实现销毁方法**：释放资源，避免内存泄漏
3. **谨慎使用Prototype**：注意手动管理生命周期
4. **利用Aware接口**：获取容器相关信息

## 参考链接

- [Spring Framework官方文档 - Bean Scopes](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-scopes)
- [Spring Framework官方文档 - Lifecycle Callbacks](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-lifecycle)
- [Spring Framework官方文档 - BeanPostProcessor](https://docs.spring.io/spring-framework/docs/current/reference/html/core.html#beans-factory-extension-bpp)

## 总结

Spring Bean的作用域和生命周期是Spring框架的核心概念。正确理解和使用这些特性，有助于开发出更加健壮、高效的Spring应用程序。开发者应根据具体的业务需求选择合适的作用域，并合理利用生命周期回调方法来管理Bean的初始化和销毁过程。