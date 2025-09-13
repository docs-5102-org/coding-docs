---
title: SpringBoot集成quartz
category:
  - quartz
---

# SpringBoot集成quartz


## 简介

本文详细介绍了SpringBoot 集成quartz 过程，包含低版本到高版本的一些细微的变化，版本号是 ：2.7.18、低版本：2.2.6.Release，Quartz最新版本：2.3.2


## SpringBoot 2.7.18 集成 quartz 

#### 添加依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-quartz</artifactId>
    <version>2.7.18</version>
</dependency>
```

#### 添加yml配置

```yml
spring:
   # quartz定时任务
  quartz:
   #是否覆盖已经存在的JOB信息，默认值：false
   overwrite-existing-jobs: false
    # 存储方式，可选值：MEMORY（内存方式，不推荐）、JDBC（持久化存储，推荐）
    job-store-type: JDBC
    #可选值：ALWAYS(每次都生成、注意只有druid数据库连接池才会自动生成表)、EMBEDDED(仅初始化嵌入式数据源)、NEVER(不初始化数据源)。
    jdbc.initialize-schema: ALWAYS
    auto-startup: true
    startup-delay:  15s
    #quartz参数
    properties:
      org:
        quartz:
          scheduler:
            #定义调度名称  对应表`qrtz_scheduler_state` 中的 `SCHED_NAME`字段
            instanceName: SchedulerFactoryBean
            #默认主机名和时间戳生成实例ID,可以是任何字符串且必须是唯一的 对应表`qrtz_scheduler_state` 中的`INSTANCE_NAME`字段
            instanceId: AUTO
          #JobStore配置
          jobStore:
            #class: org.quartz.impl.jdbcjobstore.JobStoreTX 改为 LocalDataSourceJobStore
            class: org.springframework.scheduling.quartz.LocalDataSourceJobStore
            # PostgreSQLDelegate、StdJDBCDelegate #数据库的代理
            driverDelegateClass: org.quartz.impl.jdbcjobstore.StdJDBCDelegate
            tablePrefix: QRTZ_
            isClustered: true
            clusterCheckinInterval: 15000
            maxMisfiresToHandleAtATime: 1
            useProperties: false
            #容许的调度引擎设置触发器超时的"临界值"。任务的超时容忍度 默认为60秒（这里单位为毫秒）
            misfireThreshold: 60000
            selectWithLockSQL: 'SELECT * FROM {0}LOCKS UPDLOCK WHERE LOCK_NAME = ?'
          #线程池配置
          threadPool:
            class: org.quartz.simpl.SimpleThreadPool
            threadCount: 20
            threadPriority: 5
            threadsInheritContextClassLoaderOfInitializingThread: true
            
#....your other config
```

> 注意： org.quartz.jobStore.class  低版本、高版本取值不同
> 低版本：2.2.6.Release
>org.quartz.jobStore.class=org.quartz.impl.jdbcjobstore.JobStoreTX
> 高版本：2.5.x- 2.7.18
>org.quartz.jobStore.class=org.springframework.scheduling.quartz.LocalDataSourceJobStore
>避免错误信息：`org.quartz.SchedulerConfigException: DataSource name not set.`

#### 添加properties配置

```
org.quartz.job-store-type=JDBC
org.quartz.jdbc.initialize-schema=ALWAYS
org.quartz.scheduler.instanceId=AUTO
org.quartz.scheduler.makeSchedulerThreadDaemon=true
org.quartz.threadPool.class=org.quartz.simpl.SimpleThreadPool
org.quartz.threadPool.makeThreadsDaemons=true
org.quartz.threadPool.threadCount=10
org.quartz.threadPool.threadPriority=5
#org.quartz.jobStore.class=org.quartz.impl.jdbcjobstore.JobStoreTX
org.quartz.jobStore.class=org.springframework.scheduling.quartz.LocalDataSourceJobStore
org.quartz.jobStore.driverDelegateClass=org.quartz.impl.jdbcjobstore.StdJDBCDelegate
org.quartz.jobStore.tablePrefix=QRTZ_
org.quartz.jobStore.isClustered=true
org.quartz.jobStore.misfireThreshold=60000

```


### 启动项目

看到此效果就配置成功了

![图片](https://mmbiz.qpic.cn/sz_mmbiz_png/bu5aWs1MtkhqXxz5yda1PRqsVEUmCrdicbWEiaYd2pVFB0h8DC3L3zU5dYBuZnh2xhFDVmDVYL9VYtic8jfPhxOeQ/640?wx_fmt=png&from=appmsg&tp=webp&wxfrom=5&wx_lazy=1)

## 实战项目介绍

* miliqk
* jasper-mini-org

## 参考资料

* [官方文档](https://www.quartz-scheduler.org/)