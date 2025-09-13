---
title: Quartz 内容讲解
category:
  - quartz
---

# Quartz详细内容讲解

## 简介

Quartz是OpenSymphony开源组织在Job scheduling领域又一个开源项目，它可以与J2EE与J2SE应用程序相结合也可以单独使用。Quartz可以用来创建简单或为运行十个，百个，甚至是好几万个Jobs这样复杂的程序。Jobs可以做成标准的Java组件或 EJBs。

官网：[https://www.quartz-scheduler.org/](https://www.quartz-scheduler.org/)

github: [https://github.com/quartz-scheduler/quartz](https://github.com/quartz-scheduler/quartz)

## 组件(主要API)介绍

#### Job

* Job是一个任务接口，开发者定义自己的任务须实现该接口，并重写execute(JobExecutionContext context)方法.
* Job中的任务有可能并发执行，例如任务的执行时间过长，而每次触发的时间间隔太短，则会导致任务会被并发执行。
* 为了避免出现上面的问题，可以在Job实现类上使用@DisallowConcurrentExecution,保证上一个任务执行完后，再去执行下一个任务

#### JobDetail

JobDetail是任务详情。

包含有：任务名称，任务组名称，任务描述、具体任务Job的实现类、参数配置等等信息

可以说JobDetail是任务的定义，而Job是任务的执行逻辑。

#### Trigger

Trigger是一个触发器,定义Job执行的时间规则。


| **Trigger类型** | **描述** | **特点** |
| --- | --- | --- |
| SimpleTrigger | 从某一时间开始，以一定的时间间隔来执行任务，重复指定次数。 | 适用于固定间隔和次数的任务。 |
| CronTrigger | 适合于复杂的任务，使用cron表达式来定义执行规则。 | 高度灵活，可适应各种复杂的调度需求。 |
| CalendarIntervalTrigger | 指定从某一时间开始，以一定的时间间隔执行任务，时间间隔比SimpleTrigger丰富。 | 提供更丰富的时间间隔选项，如月、季度等。 |
| DailyTimeIntervalTrigger | 指定每天的某个时间段内，以一定的时间间隔执行任务。支持指定星期。 | 适用于每天特定时段的重复任务，并可以指定星期几执行。 |


#### Scheduler

Scheduler组件是调度器组件，它是Quartz框架的核心组件之一。Scheduler组件的主要职责是**管理和调度**注册到其中的Job，确保它们按照预定的规则和时间执行。

Scheduler组件具有以下功能：


| **功能点** | **描述** |
| --- | --- |
| 管理Job | Scheduler可以添加、删除、暂停和恢复注册的Job，同时存储Job的执行历史和状态信息，方便查询和监控。 |
| 调度Job | 根据JobDetail和Trigger信息，Scheduler可以调度和执行相应的Job，支持简单触发、日历触发和Cron触发等多种调度规则。 |
| 线程池管理 | Scheduler内置线程池，动态调整线程池大小以适应系统负载，确保系统稳定和性能。 |
| 容错处理 | 当Job执行失败时，Scheduler可以进行重试或报警等操作，确保任务不会因异常情况而丢失或中断。 |
| 集群支持 | Quartz支持集群部署，可在多个节点上部署Scheduler，确保系统的高可用性和可扩展性。同时提供分布式锁和集群状态同步等机制。 |
| 安全性控制 | Scheduler支持对Job进行访问控制和权限管理，确保只有授权用户可执行相应操作。 |
| 核心实现类 | StdScheduler是Quartz框架的核心实现类，负责实现上述功能。 |

> 也有其它实现类如：DirectSchedulerFactory、但StdScheduler是核心类

#### Jobstore


Jobstore用来存储任务和触发器相关的信息，例如所有任务的名称、数量、状态等等。Quartz中有两种存储任务的方式，一种在在内存，一种是在数据库。

**RAMJobStore**

Quartz默认的 JobStore是 RAMJobstore，也就是把任务和触发器信息运行的信息存储在内存中，用到了 HashMap、TreeSet、HashSet等等数据结构。

如果程序崩溃或重启，所有存储在内存中的数据都会丢失。所以我们需要把这些数据持久化到磁盘。 

**JDBCJobStore**

JDBCJobStore可以通过 JDBC接口，将任务运行数据保存在数据库中。

JDBC的实现方式有两种，JobStoreSupport类的两个子类：

* JobStoreTX：在独立的程序中使用，自己管理事务，不参与外部事务。
* JobStoreCMT：(Container Managed Transactions (CMT)，如果需要容器管理事务时，使用它。使用 JDBCJobSotre时，需要配置数据库信息

#### Builder

#### JobBuilder

| 方法/属性 | 描述 |
| --- | --- |
| withIdentity(String name, String group) | 配置Job名称与组名 |
| withDescription(String jobDescription) | 任务描述 |
| requestRecovery() | 出现故障是否重新执行，默认false |
| storeDurably() | 作业完成后是否保留存储，默认false |
| usingJobData(String dataKey, String value) | 配置单个参数key |
| usingJobData(JobDataMap newJobDataMap) | 配置多个参数，放入一个map |
| setJobData(JobDataMap newJobDataMap) | 和上面类似，但是这个参数直接指向newJobDataMap，直接设置的参数无效 |

#### TriggerBuilder


| **方法/属性** | **描述** | 
| --- | --- | 
| withIdentity(String name, String group) | 配置Trigger名称与组名 |
| withIdentity(TriggerKey triggerKey) | 配置Trigger名称与组名 |
| withDescription(String triggerDescription) | 描述 |
| withPriority(int triggerPriority) | 设置优先级，默认是：5 |
| startAt(Date triggerStartTime) | 设置开始时间 |
| startNow() | 触发器立即生效 |
| endAt(Date triggerEndTime) | 设置结束时间 |
| withSchedule(ScheduleBuilder schedBuilder) | 设置调度builder | 

#### SimpleScheduleBuilder

| **方法/属性** | **描述** |
| --- | --- | 
| repeatForever() | 指定触发器将无限期重复 |
| withRepeatCount(int triggerRepeatCount) | 指定重复次数，总触发的次数=triggerRepeatCount+1 | 
| repeatSecondlyForever(int seconds) | 每隔seconds秒无限期重复 | 
| repeatMinutelyForever(int minutes) | 每隔minutes分钟无限期重复 | 
| repeatHourlyForever(int hours) | 每隔hours小时无限期重复 | 
| repeatSecondlyForever() | 每隔1秒无限期重复 |
| repeatMinutelyForever() | 每隔1分钟无限期重复 | 
| repeatHourlyForever() | 每隔1小时无限期重复 |
| withIntervalInSeconds(int intervalInSeconds) | 每隔intervalInSeconds秒执行 | 
| withIntervalInMinutes(int intervalInMinutes) | 每隔intervalInMinutes分钟执行 | 
| withIntervalInHours(int intervalInHours) | 每隔intervalInHours小时执行 |
| withMisfireHandlingInstructionFireNow() | 失火后的策略为：MISFIRE_INSTRUCTION_FIRE_NOW | 

#### CronScheduleBuilder

CronScheduleBuilder是一个用于构建基于Cron表达式的调度计划的工具类。它允许用户通过简单的API调用，使用Cron表达式来定义任务的调度规则。Cron表达式是一种用于描述定时任务的字符串格式，它可以指定任务在何时执行，以及执行的频率等。CronScheduleBuilder封装了对Cron表达式的解析和处理逻辑，使得用户可以方便地创建和管理基于Cron表达式的调度计划。


| **类/方法** | **描述** | **示例/参数** |
| --- | --- | --- |
| **CalendarIntervalScheduleBuilder** | 使用Calendar间隔调度构建器 |  |
| inTimeZone(TimeZone timezone) | 设置时区 |  |
| withInterval(int timeInterval, IntervalUnit unit) | 相隔多少时间执行 | 单位：毫秒、秒、分、时、天、周、月、年 |
| withIntervalInSeconds(int intervalInSeconds) | 相隔秒 |  |
| withIntervalInWeeks(int intervalInWeeks) | 相隔周 |  |
| withIntervalInMonths(int intervalInMonths) | 相隔月 |  |
| **DailyTimeIntervalScheduleBuilder** | 使用每日时间间隔调度构建器 |  |
| withInterval(int timeInterval, IntervalUnit unit) | 相隔多少时间执行 | 单位：秒、分、时（其他单位不支持） |
| withIntervalInSeconds(int intervalInSeconds) | 相隔秒 |  |
| withIntervalInMinutes(int intervalInMinutes) | 相隔分 |  |
| withIntervalInHours(int intervalInHours) | 相隔时 |  |
| `onDaysOfTheWeek(Set<Integer> onDaysOfWeek)` | 在一周的指定日期触发 | 取值范围：1-7（1是星期天，2是星期一…） |
| `onDaysOfTheWeek(Integer ... onDaysOfWeek)` | 和上面一样，3是星期二…7是星期六 |  |
| onMondayThroughFriday() | 每星期的周一导周五触发 |  |
| onSaturdayAndSunday() | 每星期的周六周日触发 |  |
| onEveryDay() | 每天触发 |  |
| withRepeatCount(int repeatCount) | 重复次数，总的重复次数=1 (at start time) + repeatCount |  |
| startingDailyAt(TimeOfDay timeOfDay) | 触发的开始时间 |  |
| endingDailyAt(TimeOfDay timeOfDay) | 触发的结束时间 |  |



## quartz表说明

| 序号 | 表名 | 描述 |
| --- | --- | --- |
| 1 | `qrtz_blob_triggers` | 以Blob 类型存储的触发器。 |
| 2 | `qrtz_calendars` | 存放日历信息，quartz可配置一个日历来指定一个时间范围。 |
| 3 | `qrtz_cron_triggers` | 存放cron类型的触发器。 |
| 4 | `qrtz_fired_triggers` | 存储已经触发的trigger相关信息，trigger随着时间的推移状态发生变化，直到最后trigger执行完成，从表中被删除。 |
| 5 | `qrtz_job_details` | 存放一个jobDetail信息。 |
| 6 | `qrtz_job_listeners` | job**监听器**。 |
| 7 | `qrtz_locks` | Quartz提供的锁表，为多个节点调度提供分布式锁，实现分布式调度，默认有2个锁。 |
| 8 | `qrtz_paused_trigger_graps` | 存放暂停掉的触发器。 |
| 9 | `qrtz_scheduler_state` | 存储所有节点的scheduler，会定期检查scheduler是否失效。 |
| 10 | `qrtz_simple_triggers` | 存储SimpleTrigger。 |
| 11 | `qrtz_trigger_listeners` | 触发器监听器。 |
| 12 | `qrtz_triggers` | 触发器的基本信息。 |
| 13 | `qrtz_simprop_triggers` | 存储CalendarIntervalTrigger和DailyTimeIntervalTrigger两种类型的触发器。 |

### quartz表的SQL

```sql
CREATE TABLE `qrtz_blob_triggers` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `BLOB_DATA` blob,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  KEY `SCHED_NAME` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_blob_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `qrtz_triggers` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `qrtz_calendars` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `CALENDAR_NAME` varchar(190) NOT NULL,
  `CALENDAR` blob NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`CALENDAR_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `qrtz_cron_triggers` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `CRON_EXPRESSION` varchar(120) NOT NULL,
  `TIME_ZONE_ID` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_cron_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `qrtz_triggers` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `qrtz_fired_triggers` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `ENTRY_ID` varchar(95) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `INSTANCE_NAME` varchar(190) NOT NULL,
  `FIRED_TIME` bigint(13) NOT NULL,
  `SCHED_TIME` bigint(13) NOT NULL,
  `PRIORITY` int(11) NOT NULL,
  `STATE` varchar(16) NOT NULL,
  `JOB_NAME` varchar(190) DEFAULT NULL,
  `JOB_GROUP` varchar(190) DEFAULT NULL,
  `IS_NONCONCURRENT` varchar(1) DEFAULT NULL,
  `REQUESTS_RECOVERY` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`ENTRY_ID`),
  KEY `IDX_QRTZ_FT_TRIG_INST_NAME` (`SCHED_NAME`,`INSTANCE_NAME`),
  KEY `IDX_QRTZ_FT_INST_JOB_REQ_RCVRY` (`SCHED_NAME`,`INSTANCE_NAME`,`REQUESTS_RECOVERY`),
  KEY `IDX_QRTZ_FT_J_G` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_FT_JG` (`SCHED_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_FT_T_G` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  KEY `IDX_QRTZ_FT_TG` (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `qrtz_job_details` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `JOB_NAME` varchar(190) NOT NULL,
  `JOB_GROUP` varchar(190) NOT NULL,
  `DESCRIPTION` varchar(250) DEFAULT NULL,
  `JOB_CLASS_NAME` varchar(250) NOT NULL,
  `IS_DURABLE` varchar(1) NOT NULL,
  `IS_NONCONCURRENT` varchar(1) NOT NULL,
  `IS_UPDATE_DATA` varchar(1) NOT NULL,
  `REQUESTS_RECOVERY` varchar(1) NOT NULL,
  `JOB_DATA` blob,
  PRIMARY KEY (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_J_REQ_RECOVERY` (`SCHED_NAME`,`REQUESTS_RECOVERY`),
  KEY `IDX_QRTZ_J_GRP` (`SCHED_NAME`,`JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



CREATE TABLE `qrtz_locks` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `LOCK_NAME` varchar(40) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`LOCK_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `qrtz_paused_trigger_grps` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `qrtz_scheduler_state` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `INSTANCE_NAME` varchar(190) NOT NULL,
  `LAST_CHECKIN_TIME` bigint(13) NOT NULL,
  `CHECKIN_INTERVAL` bigint(13) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`INSTANCE_NAME`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `qrtz_simple_triggers` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `REPEAT_COUNT` bigint(7) NOT NULL,
  `REPEAT_INTERVAL` bigint(12) NOT NULL,
  `TIMES_TRIGGERED` bigint(10) NOT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_simple_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `qrtz_triggers` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `qrtz_simprop_triggers` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `STR_PROP_1` varchar(512) DEFAULT NULL,
  `STR_PROP_2` varchar(512) DEFAULT NULL,
  `STR_PROP_3` varchar(512) DEFAULT NULL,
  `INT_PROP_1` int(11) DEFAULT NULL,
  `INT_PROP_2` int(11) DEFAULT NULL,
  `LONG_PROP_1` bigint(20) DEFAULT NULL,
  `LONG_PROP_2` bigint(20) DEFAULT NULL,
  `DEC_PROP_1` decimal(13,4) DEFAULT NULL,
  `DEC_PROP_2` decimal(13,4) DEFAULT NULL,
  `BOOL_PROP_1` varchar(1) DEFAULT NULL,
  `BOOL_PROP_2` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  CONSTRAINT `qrtz_simprop_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`) REFERENCES `qrtz_triggers` (`SCHED_NAME`, `TRIGGER_NAME`, `TRIGGER_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `qrtz_triggers` (
  `SCHED_NAME` varchar(120) NOT NULL,
  `TRIGGER_NAME` varchar(190) NOT NULL,
  `TRIGGER_GROUP` varchar(190) NOT NULL,
  `JOB_NAME` varchar(190) NOT NULL,
  `JOB_GROUP` varchar(190) NOT NULL,
  `DESCRIPTION` varchar(250) DEFAULT NULL,
  `NEXT_FIRE_TIME` bigint(13) DEFAULT NULL,
  `PREV_FIRE_TIME` bigint(13) DEFAULT NULL,
  `PRIORITY` int(11) DEFAULT NULL,
  `TRIGGER_STATE` varchar(16) NOT NULL,
  `TRIGGER_TYPE` varchar(8) NOT NULL,
  `START_TIME` bigint(13) NOT NULL,
  `END_TIME` bigint(13) DEFAULT NULL,
  `CALENDAR_NAME` varchar(190) DEFAULT NULL,
  `MISFIRE_INSTR` smallint(2) DEFAULT NULL,
  `JOB_DATA` blob,
  PRIMARY KEY (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`),
  KEY `IDX_QRTZ_T_J` (`SCHED_NAME`,`JOB_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_T_JG` (`SCHED_NAME`,`JOB_GROUP`),
  KEY `IDX_QRTZ_T_C` (`SCHED_NAME`,`CALENDAR_NAME`),
  KEY `IDX_QRTZ_T_G` (`SCHED_NAME`,`TRIGGER_GROUP`),
  KEY `IDX_QRTZ_T_STATE` (`SCHED_NAME`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_N_STATE` (`SCHED_NAME`,`TRIGGER_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_N_G_STATE` (`SCHED_NAME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_NEXT_FIRE_TIME` (`SCHED_NAME`,`NEXT_FIRE_TIME`),
  KEY `IDX_QRTZ_T_NFT_ST` (`SCHED_NAME`,`TRIGGER_STATE`,`NEXT_FIRE_TIME`),
  KEY `IDX_QRTZ_T_NFT_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`),
  KEY `IDX_QRTZ_T_NFT_ST_MISFIRE` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_STATE`),
  KEY `IDX_QRTZ_T_NFT_ST_MISFIRE_GRP` (`SCHED_NAME`,`MISFIRE_INSTR`,`NEXT_FIRE_TIME`,`TRIGGER_GROUP`,`TRIGGER_STATE`),
  CONSTRAINT `qrtz_triggers_ibfk_1` FOREIGN KEY (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`) REFERENCES `qrtz_job_details` (`SCHED_NAME`, `JOB_NAME`, `JOB_GROUP`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

```

> 建议，先用druid数据源先连接自动创建这些表，省的自己手动操作

