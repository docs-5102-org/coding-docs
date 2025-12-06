---
title: 自动装配工作流程（详解）
category:
  - SpringBoot面试题
date: 2025-11-28
---

# Spring Boot自动装配中何时根据项目依赖进行筛选？

## 自动装配中依赖检测的关键步骤

**答案: 主要在第4和第5步**

@SpringBootApplication启动
    ↓
@EnableAutoConfiguration生效
    ↓
AutoConfigurationImportSelector扫描spring.factories  ← 第3步：加载所有候选配置类(不管你有没有依赖)
    ↓
加载所有自动配置类(xxxAutoConfiguration)  ← 第4步：实例化配置类
    ↓
**根据@Conditional条件判断是否生效**  ← 👉 第5步：这里才真正检查你的依赖!
    ↓
向容器注入配置的Bean

---

## 详细说明

### 第3步：无差别加载候选配置
```java
// AutoConfigurationImportSelector.getCandidateConfigurations()
List<String> configurations = SpringFactoriesLoader.loadFactoryNames(
    EnableAutoConfiguration.class, 
    classLoader
);
// 这一步会读取所有jar包的spring.factories文件
// 加载所有配置类的全限定名，不管你项目有没有对应的依赖
// 例如：会同时加载 DataSourceAutoConfiguration、RedisAutoConfiguration 等
```

### 第5步：**条件判断 - 真正的依赖检查**

这一步通过`@Conditional`系列注解检查你的项目依赖：

#### 1. @ConditionalOnClass - 检查类是否存在
```java
@Configuration
@ConditionalOnClass({DataSource.class, EmbeddedDatabaseType.class})
// 👉 只有当你的classpath中存在DataSource类时，这个配置才生效
// 也就是说，只有引入了数据库相关依赖(如spring-boot-starter-jdbc)才会生效
public class DataSourceAutoConfiguration {
    // ...
}
```

**工作原理:**
```java
// Spring会尝试加载指定的类
Class.forName("javax.sql.DataSource");
// 如果你没有引入jdbc依赖，这里会抛出ClassNotFoundException
// 该自动配置类就不会生效
```

#### 2. @ConditionalOnBean - 检查Bean是否存在
```java
@Configuration
@ConditionalOnBean(DataSource.class)
// 👉 只有容器中已经存在DataSource的Bean时才生效
public class DataSourceTransactionManagerAutoConfiguration {
    // ...
}
```

#### 3. @ConditionalOnMissingClass - 检查类不存在
```java
@Configuration
@ConditionalOnMissingClass("org.springframework.data.redis.core.RedisOperations")
// 👉 只有当你没有引入Redis依赖时才生效
public class SomeOtherAutoConfiguration {
    // ...
}
```

---

## 完整流程示例

假设你的项目引入了`spring-boot-starter-web`但没有引入`spring-boot-starter-data-redis`:

```markdown
第3步：扫描spring.factories
├── 加载 DataSourceAutoConfiguration ✓
├── 加载 RedisAutoConfiguration ✓
├── 加载 WebMvcAutoConfiguration ✓
└── 加载 ThymeleafAutoConfiguration ✓
    (所有配置类都会被加载，不管有没有依赖)

第5步：条件判断
├── DataSourceAutoConfiguration
│   └── @ConditionalOnClass(DataSource.class)
│       ├── 检查classpath → 没有找到DataSource类 ❌
│       └── 配置不生效，跳过
│
├── RedisAutoConfiguration  
│   └── @ConditionalOnClass(RedisOperations.class)
│       ├── 检查classpath → 没有找到RedisOperations类 ❌
│       └── 配置不生效，跳过
│
├── WebMvcAutoConfiguration
│   └── @ConditionalOnClass({Servlet.class, DispatcherServlet.class})
│       ├── 检查classpath → 找到了这些类 ✓ (starter-web包含了这些)
│       └── 配置生效，注入相关Bean ✓
│
└── ThymeleafAutoConfiguration
    └── @ConditionalOnClass(TemplateEngine.class)
        ├── 检查classpath → 没有找到TemplateEngine类 ❌
        └── 配置不生效，跳过

最终结果：只有WebMvcAutoConfiguration生效并注入Bean
```

---

## 源码验证

### ConditionEvaluator.shouldSkip()
```java
// Spring在处理配置类时会调用此方法
public boolean shouldSkip(@Nullable AnnotatedTypeMetadata metadata, 
                          @Nullable ConfigurationPhase phase) {
    
    if (metadata == null || !metadata.isAnnotated(Conditional.class.getName())) {
        return false;
    }
    
    // 获取所有@Conditional注解
    List<Condition> conditions = getConditions(metadata);
    
    // 遍历所有条件，只要有一个不满足就跳过
    for (Condition condition : conditions) {
        if (!condition.matches(context, metadata)) {
            return true;  // 👉 不满足条件，跳过此配置类
        }
    }
    
    return false;  // 所有条件都满足，加载此配置类
}
```

### OnClassCondition.getMatchOutcome()
```java
// @ConditionalOnClass的实现
public ConditionOutcome getMatchOutcome(ConditionContext context, 
                                       AnnotatedTypeMetadata metadata) {
    
    ClassLoader classLoader = context.getClassLoader();
    List<String> onClasses = getCandidates(metadata, ConditionalOnClass.class);
    
    // 👉 检查每个类是否存在于classpath中
    List<String> missing = filter(onClasses, ClassNameFilter.MISSING, classLoader);
    
    if (!missing.isEmpty()) {
        // 有类不存在，条件不匹配
        return ConditionOutcome.noMatch("required classes missing: " + missing);
    }
    
    // 所有类都存在，条件匹配
    return ConditionOutcome.match();
}
```

---

## 总结

**简洁答案:**

项目依赖的检查发生在**第5步"根据@Conditional条件判断"**这个阶段。

- 第3步只是加载所有候选配置类的名称
- 第5步才会通过`@ConditionalOnClass`等注解真正检查你的classpath中是否存在对应的类
- 如果你引入了某个starter(如spring-boot-starter-web)，对应的类就会在classpath中
- Spring就会让相关的自动配置类生效

**记忆口诀:**
"全部加载，按需生效" - spring.factories加载全部，@Conditional按你的依赖筛选
```
