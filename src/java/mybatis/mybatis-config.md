---
title: MyBatis 和 MyBatisPlus 配置指南
category:
  - 持久层框架
tag:
  - MyBatis
  - MyBatisPlus
---

# MyBatis 和 MyBatisPlus 配置优化指南

## 目录

[[toc]]

## 开发环境配置

### MyBatis 基础配置

```yaml
mybatis:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 开启SQL日志打印
    map-underscore-to-camel-case: true                     # 开启驼峰命名自动映射
```

### MyBatisPlus 基础配置

```yaml
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 开启SQL日志打印
    map-underscore-to-camel-case: true                     # 开启驼峰命名自动映射
```

## 生产环境配置

```yaml
mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.nologging.NoLoggingImpl  # 关闭SQL日志
```

## 日志配置方案

### YAML 配置方式

```yaml
logging:
  level:
    # 日志级别顺序：trace < debug < info < warn < error
    com.baomidou.mybatisplus: DEBUG  # MyBatisPlus日志
    org.mybatis: DEBUG               # MyBatis日志
    com.example.mapper: DEBUG        # 自定义Mapper日志
```

### XML 配置方式 (logback.xml)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
    <encoder>
      <pattern>%d{yyyy-MM-dd HH:mm:ss} - %msg%n</pattern>
    </encoder>
  </appender>

  <root level="INFO">
    <appender-ref ref="STDOUT" />
  </root>

  <logger name="org.mybatis" level="DEBUG"/>
  <logger name="com.baomidou" level="DEBUG"/>
  <logger name="com.yourcompany.yourapp" level="DEBUG"/>
</configuration>
```

> 注意：YAML配置会覆盖logback.xml的配置

## 高级配置选项

### MyBatis 完整配置

```yaml
mybatis:
  config-location: classpath:mybatis.cfg.xml     # 主配置文件路径
  type-aliases-package: com.example.entity      # 实体类别名包
  mapper-locations: classpath:mapper/*.xml      # Mapper文件位置
  configuration:
    map-underscore-to-camel-case: true          # 驼峰命名映射
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # SQL日志
```

### MyBatisPlus 完整配置

```yaml
mybatis-plus:
  type-aliases-package: com.example.entity      # 实体类别名包
  mapper-locations: classpath:mapper/*.xml      # Mapper文件位置
  global-config:
    banner: false                               # 关闭启动Banner
    db-config:
      id-type: auto                             # 主键策略
      field-strategy: NOT_EMPTY                 # 字段更新策略
      db-type: MYSQL                            # 数据库类型
      logic-delete-field: deleted               # 逻辑删除字段
      logic-delete-value: 1                     # 删除标记值
      logic-not-delete-value: 0                 # 未删除标记值
  configuration:
    map-underscore-to-camel-case: true          # 驼峰命名映射
    call-setters-on-nulls: true                 # 空值字段也调用setter
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # SQL日志
```

## 仅打印SQL语句的最佳实践

1. 配置日志级别
```yaml
logging:
  level:
    com.example.mapper: debug
```

2. 移除MyBatisPlus的日志实现配置
```yaml
mybatis-plus:
  configuration:
    # 注释掉log-impl配置
    # log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
```

此配置将只输出SQL语句而不显示查询结果，适合生产环境调试使用。
