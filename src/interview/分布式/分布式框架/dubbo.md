---
title: dubbo 面试题
category:
  - dubbo 面试题
date: 2025-11-28
---

# Dubbo 面试题整理

> 📌 **说明**：本文基于 Dubbo 2.x 版本整理，涉及新版本（Dubbo 3.x）变化的地方均有标注。

---

## 目录

- [Dubbo 面试题整理](#dubbo-面试题整理)
  - [目录](#目录)
  - [1. 为什么要用 Dubbo？](#1-为什么要用-dubbo)
  - [2. Dubbo 的整体架构设计有哪些分层？](#2-dubbo-的整体架构设计有哪些分层)
    - [Dubbo2.0 框架从上到下共分为 10 层：](#dubbo20-框架从上到下共分为-10-层)
    - [Dubbo3 的架构：两面模型](#dubbo3-的架构两面模型)
    - [Dubbo3 在 2.x 基础上新增/变化的核心层](#dubbo3-在-2x-基础上新增变化的核心层)
    - [为什么 Dubbo3 找不到那个 10 层分层图了？](#为什么-dubbo3-找不到那个-10-层分层图了)
    - [总结一句话](#总结一句话)
  - [3. Dubbo默认使用的是什么通信框架，还有别的选择吗？](#3-dubbo默认使用的是什么通信框架还有别的选择吗)
  - [4. 服务调用是阻塞的吗？](#4-服务调用是阻塞的吗)
  - [5. 一般使用什么注册中心，还有别的选择吗？](#5-一般使用什么注册中心还有别的选择吗)
  - [6. 默认使用什么序列化框架，你知道的还有哪些？](#6-默认使用什么序列化框架你知道的还有哪些)
  - [7. 服务提供者能实现失效踢出是什么原理？](#7-服务提供者能实现失效踢出是什么原理)
  - [8. 服务上线怎么不影响旧版本？](#8-服务上线怎么不影响旧版本)
    - [1. XML 配置](#1-xml-配置)
    - [2. 注解（Annotation）方式](#2-注解annotation方式)
  - [9. 如何解决服务调用链过长的问题？](#9-如何解决服务调用链过长的问题)
  - [10. 说说核心的配置有哪些？](#10-说说核心的配置有哪些)
    - [Dubbo2.0 基于XML核心配置](#dubbo20-基于xml核心配置)
    - [Dubbo 3 基于注解的核心配置方式](#dubbo-3-基于注解的核心配置方式)
      - [核心注解配置对照表](#核心注解配置对照表)
      - [全局组件配置 (通常在 YAML/Properties 中)](#全局组件配置-通常在-yamlproperties-中)
      - [💡 关键代码示例](#-关键代码示例)
  - [11. Dubbo 推荐用什么协议？](#11-dubbo-推荐用什么协议)
  - [12. 同一个服务多个注册的情况下可以直连某一个服务吗？](#12-同一个服务多个注册的情况下可以直连某一个服务吗)
  - [13. 服务注册与发现的流程](#13-服务注册与发现的流程)
  - [14. Dubbo 集群容错有几种方案？](#14-dubbo-集群容错有几种方案)
  - [15. Dubbo 服务降级、失败重试怎么做？](#15-dubbo-服务降级失败重试怎么做)
    - [Dubbo 2.0 的实现方式](#dubbo-20-的实现方式)
    - [Dubbo 3.0 的实现方式](#dubbo-30-的实现方式)
    - [💡 核心参数速查表](#-核心参数速查表)
  - [16. Dubbo 使用过程中都遇到了些什么问题？](#16-dubbo-使用过程中都遇到了些什么问题)
  - [17. Dubbo Monitor 实现原理？](#17-dubbo-monitor-实现原理)
  - [18. Dubbo 用到哪些设计模式？](#18-dubbo-用到哪些设计模式)
    - [工厂模式](#工厂模式)
    - [装饰器模式（责任链模式）](#装饰器模式责任链模式)
    - [观察者模式](#观察者模式)
    - [动态代理模式](#动态代理模式)
  - [19. Dubbo 配置文件是如何加载到 Spring 中的？](#19-dubbo-配置文件是如何加载到-spring-中的)
  - [20. Dubbo SPI（Service Provider Interface） 和 Java SPI 区别？](#20-dubbo-spiservice-provider-interface-和-java-spi-区别)
  - [21. Dubbo 支持分布式事务吗？](#21-dubbo-支持分布式事务吗)
  - [22. Dubbo 可以对结果进行缓存吗？](#22-dubbo-可以对结果进行缓存吗)
    - [Dubbo2.0基于XML的写法](#dubbo20基于xml的写法)
    - [Dubbo3.0基于注解的写法](#dubbo30基于注解的写法)
    - [支持的缓存类型\*\*（通过 `cache` 属性指定）：](#支持的缓存类型通过-cache-属性指定)
  - [23. 服务上线怎么兼容旧版本？](#23-服务上线怎么兼容旧版本)
  - [24. Dubbo 必须依赖的包有哪些？](#24-dubbo-必须依赖的包有哪些)
    - [**Dubbo2.0 必须依赖 JDK**，其他组件均为可选依赖，根据使用的功能按需引入：](#dubbo20-必须依赖-jdk其他组件均为可选依赖根据使用的功能按需引入)
    - [Dubbo 3.x 核心依赖清单](#dubbo-3x-核心依赖清单)
  - [25. Dubbo telnet 命令能做什么？](#25-dubbo-telnet-命令能做什么)
  - [26. Dubbo 支持服务降级吗？](#26-dubbo-支持服务降级吗)
  - [27. Dubbo 如何优雅停机？](#27-dubbo-如何优雅停机)
  - [28. Dubbo 和 Dubbox 之间的区别？](#28-dubbo-和-dubbox-之间的区别)
  - [29. Dubbo 和 Spring Cloud 的区别？](#29-dubbo-和-spring-cloud-的区别)
  - [30. 你还了解别的分布式框架吗？](#30-你还了解别的分布式框架吗)

---

## 1. 为什么要用 Dubbo？

随着服务化的进一步发展，服务越来越多，服务之间的调用和依赖关系也越来越复杂，诞生了面向服务的架构体系（SOA），也因此衍生出了一系列相应的技术，如对服务提供、服务调用、连接处理、通信协议、序列化方式、服务发现、服务路由、日志输出等行为进行封装的服务框架。

就这样，分布式系统的服务治理框架出现了，Dubbo 也就这样产生了。Dubbo 的核心价值在于：

- **服务治理**：提供完善的服务注册、发现、路由、负载均衡能力
- **高性能 RPC**：基于 Netty 的高性能远程调用
- **可扩展性**：基于 SPI 机制，方便扩展各个组件
- **可视化监控**：提供服务调用链路追踪和监控能力

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x（又称 Dubbo3）在 2.x 基础上进行了全面升级，引入了全新的 **Triple 协议**（基于 gRPC/HTTP2），对云原生场景（Kubernetes、Service Mesh）提供了更好的支持，同时兼容 gRPC 生态，实现了真正的跨语言互通。

---

## 2. Dubbo 的整体架构设计有哪些分层？

### Dubbo2.0 框架从上到下共分为 10 层：

| 层级     | 名称                      | 说明                                                                                       |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------ |
| 第 10 层 | 接口服务层（Service）     | 与业务逻辑相关，定义 Provider 和 Consumer 对应的接口和实现                                 |
| 第 9 层  | 配置层（Config）          | 对外配置接口，以 `ServiceConfig` 和 `ReferenceConfig` 为中心                               |
| 第 8 层  | 服务代理层（Proxy）       | 生成服务的客户端 Stub 和服务端 Skeleton，扩展接口为 `ProxyFactory`                         |
| 第 7 层  | 服务注册层（Registry）    | 封装服务地址的注册和发现，以服务 URL 为中心                                                |
| 第 6 层  | 路由层（Cluster）         | 封装多个提供者的路由和负载均衡，扩展接口为 `Cluster`、`Directory`、`Router`、`LoadBalance` |
| 第 5 层  | 监控层（Monitor）         | RPC 调用次数和调用时间监控，以 `Statistics` 为中心                                         |
| 第 4 层  | 远程调用层（Protocol）    | 封装 RPC 调用，以 `Invocation` 和 `Result` 为中心                                          |
| 第 3 层  | 信息交换层（Exchange）    | 封装请求响应模式，同步转异步，以 `Request` 和 `Response` 为中心                            |
| 第 2 层  | 网络传输层（Transport）   | 抽象 Mina 和 Netty 为统一接口，以 `Message` 为中心                                         |
| 第 1 层  | 数据序列化层（Serialize） | 可复用的序列化工具，扩展接口为 `Serialization`、`ObjectInput`、`ObjectOutput`              |

> https://cn.dubbo.apache.org/zh-cn/docsv2.7/dev/design/

这个问题很有价值，来把两者的关系讲清楚。

---

### Dubbo3 的架构：两面模型

从抽象架构上，Dubbo3 分为两层：**服务治理抽象控制面** 和 **Dubbo 数据面**。

```
┌──────────────────────────────────────────────────────┐
│              服务治理控制面（Control Plane）            │
│   注册中心 / 配置中心 / 元数据中心 / Admin 控制台        │
│   Istio / xDS（Mesh 场景）                            │
└──────────────────────┬───────────────────────────────┘
                       │ 地址发现 / 流量规则下发
┌──────────────────────▼───────────────────────────────┐
│              Dubbo 数据面（Data Plane）                │
│                                                      │
│  Consumer ──── Triple/Dubbo 协议 ────► Provider      │
│  （服务消费方）                       （服务提供方）    │
│                                                      │
│  内部仍保留 2.x 的 10 层分层结构（Proxy/Cluster/       │
│  Protocol/Exchange/Transport/Serialize 等）           │
└──────────────────────────────────────────────────────┘
```

---

### Dubbo3 在 2.x 基础上新增/变化的核心层

除了保留原有 10 层，Dubbo3 实际上新增了几个关键能力：

| 变化点           | Dubbo2                                   | Dubbo3                                                     |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------- |
| **通信协议**     | Dubbo 私有协议（TCP）                    | 新增 **Triple 协议**（基于 HTTP/2，兼容 gRPC）             |
| **服务发现模型** | 接口级服务发现（URL 粒度极细，数据量大） | 新增**应用级服务发现**（数据量降低约 90%）                 |
| **部署架构**     | 只有 SDK 模式                            | 新增 **Sidecar（Proxy） Mesh** + **Proxyless Mesh**        |
| **多语言**       | 主要是 Java                              | Java / Go / Rust / Node 等多语言 SDK                       |
| **服务治理**     | 路由规则、负载均衡                       | 对接 **xDS / Istio**，支持 VirtualService、DestinationRule |

> [Sidecar Mesh（代理模式）、Proxyless Mesh（无代理模式）](https://cn.dubbo.apache.org/en/overview/what/core-features/service-mesh/)

| 特性       | Sidecar Mesh (经典)          | Proxyless Mesh (Dubbo 3 特色) |
| ---------- | ---------------------------- | ----------------------------- |
| 代理组件   | 运行 Envoy (Sidecar)         | 无代理，直接通信              |
| 性能       | 有一定损耗 (由于多跳跳转)    | 极高性能 (点对点直连)         |
| 治理执行者 | Envoy 代理                   | Dubbo SDK 框架                |
| 协议标准   | xDS (控制面 -> Envoy)        | xDS (控制面 -> Dubbo)         |
| 适合场景   | 多语言混合、对性能不极度敏感 | 高性能要求、全链路 Dubbo 体系 |

---


### 为什么 Dubbo3 找不到那个 10 层分层图了？

Dubbo3 仍然保持 2.x 的经典架构，主要职责是解决微服务进程之间的通信，并通过丰富的服务治理能力更好地管理和控制微服务集群；框架的升级是全面的，体现在 Dubbo 核心功能的几乎每个方面。

也就是说，**Dubbo2 的 10 层内部分层在 Dubbo3 里依然存在，只是官方不再以这张图作为核心宣传**。原因是 Dubbo3 的设计重心已经从"内部实现分层"转向"整体架构定位"，官方文档改用了更宏观的两层视角来描述。

---

### 总结一句话

> Dubbo3 的 10 层内部分层**没有消失**，只是官方不再把它作为主要文档入口来展示。Dubbo3 对外的架构描述从"代码分层"升维到了"**控制面 + 数据面**"的云原生两层架构视角，这是因为 Dubbo3 的核心升级点不在内部实现细节，而在于整体系统的定位与边界。

如果你做的是 Dubbo 2.7.x 的项目（你之前的技术栈），内部机制完全对应那 10 层，不需要特别关注 Dubbo3 的架构变化。

---

##  3. Dubbo默认使用的是什么通信框架，还有别的选择吗？

- Netty 是绝对核心，Dubbo 默认一直使用 Netty 4。
- Mina 的现状：虽然理论上支持，但实际上在 Dubbo 3.x 社区中已基本不再维护，处于边缘化/遗留状态。

> 🆕 **Dubbo 3.x 新变化**：
> - 自研 Triple 协议：底层基于 Netty 实现的 HTTP/2 传输，100% 兼容 gRPC 协议。
> - 多协议共存：除了传统的 Dubbo 协议（TCP），还支持原生 gRPC-Java、REST 和 Hessian2 等。
> - 高性能优化：支持开启 Netty 的 [Epoll](../../../article\netty-epoll.md) 模式以在 Linux 环境下获得更高吞吐。


---

## 4. 服务调用是阻塞的吗？

默认是**阻塞的同步调用**，但可以配置为**异步调用**。

- Dubbo 基于 NIO 的非阻塞实现并行调用，客户端不需要启动多线程即可完成并行调用多个远程服务，相对多线程开销较小。
- 异步调用会返回一个 `Future` 对象，调用方可在需要结果时再获取。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 引入了对 **Reactive 编程模型**的支持，Triple 协议原生支持 Streaming（流式调用），包括：
> - **ServerStream**：服务端流
> - **ClientStream**：客户端流
> - **BidirectionalStream**：双向流
>
> 这使得 Dubbo 在实时推送、大文件传输等场景下更加灵活。

---

## 5. 一般使用什么注册中心，还有别的选择吗？

推荐使用 **Zookeeper** 作为注册中心。其他可选项如下：

| 注册中心  | 是否推荐     | 说明                                 |
| --------- | ------------ | ------------------------------------ |
| Zookeeper | ✅ 推荐       | 稳定可靠，生产环境首选               |
| Nacos     | ✅ 推荐（新） | Dubbo 3.x 官方主推，同时支持配置中心 |
| Redis     | ⚠️ 不推荐     | 可用但不稳定                         |
| Multicast | ⚠️ 不推荐     | 仅适合局域网测试                     |
| Simple    | ⚠️ 不推荐     | 仅用于测试                           |

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 官方将 **Nacos** 列为与 Zookeeper 同等地位的主推注册中心，并新增了对 **Kubernetes（K8s）原生服务发现**的支持（通过 Kubernetes API Server），以及对 **Consul**、**Etcd** 等注册中心的支持。

---

##  6. 默认使用什么序列化框架，你知道的还有哪些？

默认推荐使用 **Hessian2** 序列化。其他可选项：

- Kryo
- FST
- FastJson
- Protobuf
- Java 原生序列化（性能差，不推荐）

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 引入了 **Protobuf** 作为 Triple 协议默认的序列化方式，并官方推荐在新项目中使用 **Kryo** 或 **Protobuf** 替代 Hessian，以获得更好的性能和跨语言能力。

---

## 7. 服务提供者能实现失效踢出是什么原理？

服务失效踢出基于 **Zookeeper 的临时节点（Ephemeral Node）原理**。

- Provider 启动后，在 Zookeeper 上创建一个**临时节点**来表示自己的服务地址。
- 当 Provider 宕机或网络断开时，与 Zookeeper 的 Session 超时，临时节点**自动删除**。
- Consumer 通过 Watcher 监听节点变化，感知到节点删除后，自动将该 Provider 从本地服务列表中移除。

---

## 8. 服务上线怎么不影响旧版本？

采用**多版本（version）**开发策略，不影响旧版本：

### 1. XML 配置

```xml
<!-- 新版本 Provider -->
<dubbo:service interface="com.example.UserService" version="2.0.0" ref="userServiceV2"/>

<!-- Consumer 指定版本调用 -->
<dubbo:reference interface="com.example.UserService" version="1.0.0"/>
```

不同版本的服务注册到注册中心后，版本号不同的服务之间互相不引用，实现平滑升级。

### 2. 注解（Annotation）方式

虽然 XML 能用，但 Dubbo 3 的用户大多已转向 Spring Boot 风格。对应的配置如下：

Provider (服务提供方):

```java
@DubboService(version = "2.0.0")
public class UserServiceImplV2 implements UserService { ... }
```

Consumer (服务消费方):

```java
@DubboReference(version = "2.0.0")
private UserService userService;
```


:::tip

**Dubbo 3.0 的新变化：应用级服务发现**

这是你需要特别注意的一点。虽然 version 逻辑不变，但底层原理变了：

* Dubbo 2.x (接口级)：注册中心里存的是接口名。版本号直接挂在接口路径下。
* Dubbo 3.x (应用级)：为了减轻注册中心压力，Dubbo 3 默认推荐按“应用名”注册。
* 即使你用了应用级发现，version 依然会作为元数据的一部分来辅助匹配。
   * 平滑升级更强大：Dubbo 3 支持“双注册、双发现”，即一个服务可以同时以 2.0 格式和 3.0 格式存在，确保老版本 Consumer 也能找到新版本 Provider。
   * 
------------------------------

****更好的替代方案：全链路**灰度**
在 Dubbo 3 的大规模生产实践中，单纯靠 version 强行指定版本有时会显得太“死板”。Dubbo 3 引入了更强大的流量治理能力：

* 标签路由 (Tag Routing)：
不改代码里的 version，而是在流量入口给请求打上 tag=gray。
* 动态路由：
在 Dubbo Admin 控制台上直接下发规则：“将 10% 的流量导向新部署的 V2 节点”。这种方式比在代码里写死 version="2.0.0" 要灵活得多。

:::


---

## 9. 如何解决服务调用链过长的问题？

可以结合 **Zipkin** 实现分布式服务链路追踪，通过 TraceId 将一次请求的所有调用串联起来，方便定位性能瓶颈和故障根因。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 内置了对 **OpenTelemetry** 标准的支持，可与 Zipkin、Jaeger、SkyWalking 等主流链路追踪系统无缝集成，无需额外手动埋点。

---

## 10. 说说核心的配置有哪些？

### Dubbo2.0 基于XML核心配置

| 配置标签            | 说明                         |
| ------------------- | ---------------------------- |
| `dubbo:service`     | 服务提供方配置，暴露服务     |
| `dubbo:reference`   | 服务消费方配置，引用远程服务 |
| `dubbo:protocol`    | 协议配置，指定通信协议和端口 |
| `dubbo:application` | 应用信息配置                 |
| `dubbo:module`      | 模块信息配置                 |
| `dubbo:registry`    | 注册中心配置                 |
| `dubbo:monitor`     | 监控中心配置                 |
| `dubbo:provider`    | 服务提供方默认配置           |
| `dubbo:consumer`    | 服务消费方默认配置           |
| `dubbo:method`      | 方法级配置                   |
| `dubbo:argument`    | 方法参数配置                 |

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 全面支持通过 **Java 注解**（`@DubboService`、`@DubboReference`）和 **YAML / Properties 文件**进行配置，不再强依赖 XML，与 Spring Boot 集成更加自然。注意：旧版的 `@Service` 注解已被标记为废弃，应改用 `@DubboService`。

### Dubbo 3 基于注解的核心配置方式

在 Dubbo 3 中，Java 注解已成为主流配置方式。它与 XML 标签具有一一对应的关系。

以下是基于 Dubbo 3 最新标准整理的核心注解对照表：

#### 核心注解配置对照表

| Java 注解       | 对应 XML 标签     | 说明                                            | 常见配置属性                         |
| --------------- | ----------------- | ----------------------------------------------- | ------------------------------------ |
| @DubboService   | <dubbo:service>   | 暴露服务。用于 Provider 端的实现类上。          | version, group, timeout, registry    |
| @DubboReference | <dubbo:reference> | 引用服务。用于 Consumer 端的成员变量上。        | version, check, loadbalance, retries |
| @EnableDubbo    | (无)              | 开启开关。配置在 Spring Boot 启动类上。         | scanBasePackages (指定扫描路径)      |
| @Method         | <dubbo:method>    | 方法级配置。嵌套在 @DubboService/Reference 中。 | name, timeout, oninvoke              |
| @Argument       | <dubbo:argument>  | 参数配置。嵌套在 @Method 中。                   | index, type, callback                |

------------------------------

#### 全局组件配置 (通常在 YAML/Properties 中)

在 Dubbo 3 的推荐实践中，基础设施类（如注册中心、协议）通常不在 Java 类里写死，而是放在 `application.yml` 中实现“代码与配置分离”。

如果您需要将这些也转化为 Java Bean 配置，可以使用 Spring 的 @Bean 方式：

| 配置类 (Java Bean)   | 对应 XML 标签         | 对应 YAML 配置项      | 说明                           |
| -------------------- | --------------------- | --------------------- | ------------------------------ |
| ApplicationConfig    | dubbo:application     | dubbo.application     | 应用名、元数据类型             |
| RegistryConfig       | dubbo:registry        | dubbo.registry        | 注册中心地址 (zookeeper://...) |
| ProtocolConfig       | dubbo:protocol        | dubbo.protocol        | 协议名 (triple/dubbo)、端口    |
| MetadataReportConfig | dubbo:metadata-report | dubbo.metadata-report | Dubbo 3 新增：元数据中心       |
| ConfigCenterConfig   | dubbo:config-center   | dubbo.config-center   | Dubbo 3 新增：配置中心         |

------------------------------

#### 💡 关键代码示例

**1. 服务提供方 (Provider)**

```java
@DubboService(version = "1.0.0", timeout = 3000, methods = {
    @Method(name = "sayHello", timeout = 1000) // 针对特定方法设置超时
})
public class UserServiceImpl implements UserService {
    // 业务实现
}
```

**2. 服务消费方 (Consumer)**

```java
@Component
public class UserAction {
    @DubboReference(version = "1.0.0", check = false, loadbalance = "roundrobin")
    private UserService userService;

}
```

**3. 启动类**

```java
@SpringBootApplication
@EnableDubbo(scanBasePackages = "com.example.service.impl") // 开启 Dubbo 并指定扫描包
public class ProviderApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProviderApplication.class, args);
    }
}
```

------------------------------

**⚠️ 特别提醒：关于注解废弃**

正如你提到的，Dubbo 3 明确区分了 Dubbo 注解和 Spring 注解：

* 弃用：@Service (com.alibaba.dubbo...) 和 @Reference。
* 启用：@DubboService 和 @DubboReference (org.apache.dubbo...)。
* 原因：避免与 Spring 原生的 @Service 产生冲突，使语义更清晰。

---

## 11. Dubbo 推荐用什么协议？

| 协议            | 是否推荐          | 说明                                               |
| --------------- | ----------------- | -------------------------------------------------- |
| `dubbo://`      | ✅ 推荐（2.x）     | 默认协议，基于 Netty，长连接，二进制传输，高性能   |
| `triple://`     | ✅ 强烈推荐（3.x） | 基于 HTTP/2，兼容 gRPC，云原生友好 (也是基于Netty) |
| `rmi://`        | —                 | Java RMI 协议                                      |
| `hessian://`    | —                 | Hessian 协议，可与 Hessian 客户端互通              |
| `http://`       | —                 | 基于 HTTP 表单的协议                               |
| `webservice://` | —                 | 基于 WebService 的协议                             |
| `thrift://`     | —                 | 基于 Thrift 的协议                                 |
| `rest://`       | —                 | RESTful 协议                                       |

> 🆕 **Dubbo 3.x 新变化**：**Triple 协议**是 Dubbo 3.x 的默认推荐协议，完全兼容 gRPC，支持 Unary、Server Streaming、Client Streaming、Bidirectional Streaming 四种调用模式，是未来的主要发展方向。

---

## 12. 同一个服务多个注册的情况下可以直连某一个服务吗？

可以**点对点直连**，修改配置即可绕过注册中心：

```xml Dubbo 2.0
<dubbo:reference id="userService" interface="com.example.UserService"
                 url="dubbo://192.168.1.100:20880"/>
```

```java Dubbo 3.0
@DubboReference(id = "userService", url = "dubbo://192.168.1.100:20880")
private UserService userService;
```


也可以通过 **telnet** 直接连接某个服务进行调试：

```bash
telnet 192.168.1.100 20880
```

---

## 13. 服务注册与发现的流程

```
Provider 启动
    ↓
向 Registry（如 Zookeeper）注册服务地址
    ↓
Consumer 启动
    ↓
向 Registry 订阅所需服务
    ↓
Registry 推送 Provider 地址列表给 Consumer
    ↓
Consumer 从地址列表中选一个 Provider（负载均衡）
    ↓
Consumer 直接调用 Provider（不经过 Registry）
    ↓
调用信息上报 Monitor（可选）
```

**关键点**：
- 注册中心宕机后，Consumer 仍可通过**本地缓存**的地址列表继续调用 Provider，实现了一定程度的高可用。
- Provider 和 Consumer 之间是**直连通信**，Registry 只负责地址的注册和推送，不参与实际调用链路。

---

## 14. Dubbo 集群容错有几种方案？

| 集群容错方案                 | 说明                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| **Failover Cluster**（默认） | 失败自动切换，重试其他服务器；适合读操作，但重试会带来更长延迟                       |
| **Failfast Cluster**         | 快速失败，只发起一次调用，失败立即报错；适合非幂等写操作                             |
| **Failsafe Cluster**         | 失败安全，出现异常时直接忽略；适合写入日志等不重要操作                               |
| **Failback Cluster**         | 失败自动恢复，记录失败请求，定时重发；适合消息通知等操作                             |
| **Forking Cluster**          | 并行调用多个服务器，只要一个成功即返回；适合对实时性要求高的读操作，但浪费服务器资源 |
| **Broadcast Cluster**        | 广播逐个调用所有提供者，任意一个报错则报错；适合通知所有 Provider 更新本地缓存等场景 |

> 🆕 **Dubbo 3.x 新变化**：新增了 **ZoneAwareCluster**（区域感知集群），在多注册中心场景下，优先调用同区域的服务，减少跨区域延迟。

---

## 15. Dubbo 服务降级、失败重试怎么做？

**服务降级**：通过在 `dubbo:reference` 中设置 `mock` 属性实现。

### Dubbo 2.0 的实现方式

```xml
<!-- 方式一：直接返回 null -->
<dubbo:reference mock="return null" .../>

<!-- 方式二：使用 Mock 实现类 -->
<dubbo:reference mock="true" .../>
```

使用 `mock="true"` 时，需要在接口同一包路径下创建名为 `接口名 + Mock` 的实现类，在其中编写降级逻辑：

```java
public class UserServiceMock implements UserService {
    @Override
    public User getUser(Long id) {
        // 降级逻辑，返回默认值或缓存数据
        return new User(-1L, "默认用户");
    }
}
```


**失败重试**：通过 `retries` 参数配置，默认重试 2 次（加上第一次共 3 次）：

```xml
<dubbo:reference retries="3" .../>
<!-- 或在方法级别配置 -->
<dubbo:method name="getUser" retries="0"/> <!-- 0 表示不重试 -->
```

> ⚠️ **注意**：写操作（如 insert、update）应将 `retries` 设为 `0`，避免重试导致数据重复写入。

### Dubbo 3.0 的实现方式

```java Dubbo 3.0
@DubboReference(mock = "return null")
private UserService userService;

// 或者返回特定的基本类型/字符串
@DubboReference(mock = "return empty") // 返回空集合/对象
private UserService userService;
```

当设置 `mock = "true"` 时，Dubbo 会自动寻找名为 接口名 + Mock 的类。

```java
// 1. 在同一个包下创建 Mock 类
public class UserServiceMock implements UserService {
    @Override
    public User getUser(Long id) {
        return new User(-1L, "系统繁忙，请稍后再试");
    }
}

// 2. 消费端引用
@DubboReference(mock = "true") 
private UserService userService;
```


**失败重试**：通过 `retries` 参数配置，默认重试 2 次（加上第一次共 3 次）：

```java
@DubboReference(retries = 2) // 总共调用 1(初始) + 2(重试) = 3 次
private UserService userService;
```

**方法级配置 (最推荐)**

针对读写操作进行差异化配置，避免你提到的“写操作重复执行”风险。

```java
@DubboReference(
    methods = {
        @Method(name = "getUser", retries = 2),   // 读操作：重试
        @Method(name = "insertUser", retries = 0) // 写操作：不重试
    }
)
private UserService userService;
```

> ⚠️ **注意**：写操作（如 insert、update）应将 `retries` 设为 `0`，避免重试导致数据重复写入。


### 💡 核心参数速查表

| 功能 | XML 属性 | @DubboReference 属性 | 备注                                         |
| ---- | -------- | -------------------- | -------------------------------------------- |
| 降级 | mock     | mock                 | 支持 return null, force:return null, true    |
| 重试 | retries  | retries              | 默认值是 2 (不含第一次)                      |
| 超时 | timeout  | timeout              | 默认 1000ms                                  |
| 检查 | check    | check                | 默认 true (启动时强制检查 Provider 是否存在) |

---

## 16. Dubbo 使用过程中都遇到了些什么问题？

**常见问题及排查思路：**

| 问题现象                   | 排查方向                                                                        |
| -------------------------- | ------------------------------------------------------------------------------- |
| 在注册中心找不到对应的服务 | 检查 Provider 的实现类是否添加了 `@DubboService`（3.x）或 `@Service`（2.x）注解 |
| 无法连接到注册中心         | 检查配置文件中的注册中心 IP 和端口是否正确                                      |
| Consumer 调用超时          | 检查 Provider 处理时间是否过长，适当调大 `timeout` 参数                         |
| 序列化异常                 | 检查 DTO 是否实现了 `Serializable` 接口                                         |
| No provider available      | Provider 未启动，或 Consumer 与 Provider 的接口版本/分组不一致                  |

---

## 17. Dubbo Monitor 实现原理？

Monitor 通过 **Filter 链**采集数据，整体流程如下：

1. Consumer 端发起调用前，经过 Filter 链中的 **MonitorFilter**，MonitorFilter 将调用数据发送给 **DubboMonitor**。
2. Provider 端接收请求时，同样经过 MonitorFilter。
3. **DubboMonitor** 将数据聚合后（默认每 1 分钟聚合一次）暂存到 `ConcurrentMap<Statistics, AtomicReference> statisticsMap`。
4. 线程池（3 个线程，名为 `DubboMonitorSendTimer`）每隔 1 分钟调用 **SimpleMonitorService**，遍历发送聚合数据，发送完毕后重置对应的 AtomicReference。
5. **SimpleMonitorService** 将数据塞入 **BlockingQueue**（容量为 100000）。
6. 后台线程（`DubboMonitorAsyncWriteLogThread`）以死循环方式将队列中的数据**写入本地文件**。
7. 另一个线程池（1 个线程，名为 `DubboMonitorTimer`）每隔 **5 分钟**将统计文件绘制成图表。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 弱化了内置 Monitor，官方推荐对接 **Prometheus + Grafana** 实现监控，通过内置的 Metrics 模块暴露标准指标，与云原生可观测性体系融合。

---

## 18. Dubbo 用到哪些设计模式？

### 工厂模式

Provider 在 export 服务时，通过 `ExtensionLoader` 获取扩展实现，采用了**工厂模式** + **JDK SPI 机制**：

```java
private static final Protocol protocol =
    ExtensionLoader.getExtensionLoader(Protocol.class).getAdaptiveExtension();
```

优点是可扩展性强，只需在 classpath 下增加配置文件即可扩展实现，代码零侵入。

### 装饰器模式（责任链模式）

Dubbo 的 Filter 调用链是装饰器模式与责任链模式的混合使用。Provider 的调用链如下：

```
EchoFilter → ClassLoaderFilter → GenericFilter → ContextFilter →
ExecuteLimitFilter → TraceFilter → TimeoutFilter → MonitorFilter → ExceptionFilter
```

- **责任链体现**：如 `EchoFilter` 判断是否为回声测试请求，是则直接返回，不再继续传递。
- **装饰器体现**：如 `ClassLoaderFilter` 仅在主功能上增加了切换 ClassLoader 的行为。

### 观察者模式

Provider 启动时订阅注册中心，注册中心每 5 秒检查服务是否更新，有更新则向 Provider 发送 notify 消息，Provider 执行 `NotifyListener` 的 `notify` 方法，体现了**观察者模式**。

### 动态代理模式

`ExtensionLoader` 的 Adaptive 实现是典型的动态代理模式，在调用阶段根据参数动态决定调用哪个实现类，通过 `createAdaptiveExtensionClassCode` 方法生成代理类。

---

## 19. Dubbo 配置文件是如何加载到 Spring 中的？

Spring 容器启动时，会读取 Spring 默认的 schema 以及 **Dubbo 自定义的 schema**。每个 schema 对应一个 **NamespaceHandler**，NamespaceHandler 通过 **BeanDefinitionParser** 解析配置信息，并将其转化为需要加载的 Bean 对象，从而纳入 Spring 容器管理。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 支持通过 Spring Boot Starter 自动装配，配置可以直接写在 `application.yml` 中，不再需要手动配置 XML namespace，大幅简化了接入流程。

---

## 20. Dubbo SPI（Service Provider Interface） 和 Java SPI 区别？

| 对比项         | JDK SPI                    | Dubbo SPI                                       |
| -------------- | -------------------------- | ----------------------------------------------- |
| 加载方式       | 一次性加载**所有**扩展实现 | **按需加载**，可只加载指定的扩展实现            |
| 性能           | 较差，存在资源浪费         | 较好，延迟加载                                  |
| IoC / AOP 支持 | 不支持                     | 支持，扩展点可通过 setter 注入其他扩展点        |
| 第三方容器     | 不支持                     | 支持，默认支持 Spring Bean                      |
| 获取方式       | 只能遍历获取               | 可通过名称获取指定扩展                          |
| 配置文件路径   | `META-INF/services/`       | `META-INF/dubbo/` 或 `META-INF/dubbo/internal/` |

**Dubbo SPI 的核心优势**：
1. 对 Dubbo 进行扩展，不需要改动 Dubbo 的源码（开闭原则）
2. 延迟加载，节约资源
3. 增加了对扩展点 IoC 和 AOP 的支持
4. 很好地支持第三方 IoC 容器

---

## 21. Dubbo 支持分布式事务吗？

Dubbo 自身**不支持**分布式事务，需借助第三方框架实现。

**推荐方案：**

- **TCC-Transaction**：开源 TCC 补偿性分布式事务框架，通过 Dubbo 隐式传参（RpcContext）的方式传递事务上下文，避免侵入业务代码。
  - GitHub：https://github.com/changmingxie/tcc-transaction
- **Seata**：阿里开源的分布式事务解决方案，支持 AT、TCC、Saga、XA 四种模式，与 Dubbo 有良好的集成支持，是目前更主流的选择。
  - GitHub：https://github.com/apache/incubator-seata

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 与 **Seata** 的集成更为完善，推荐使用 Seata 作为分布式事务解决方案。

---

## 22. Dubbo 可以对结果进行缓存吗？

可以。Dubbo 提供了**声明式缓存**，减少重复调用的开销：

### Dubbo2.0基于XML的写法
```xml
<dubbo:reference cache="true" />
```

### Dubbo3.0基于注解的写法

**1. 基础写法**

你可以直接在注解中指定开启缓存。默认开启的是 LRU（最近最少使用） 算法缓存。

```java
@DubboReference(cache = "lru")
private UserService userService;
```

注：在注解中通常需要显式指定缓存策略（如 lru），而不只是简单的 true。

------------------------------

**2. 方法级写法 (更常用)**

缓存通常比较消耗内存，建议只针对特定的只读查询方法开启，而不是整个接口。

```java
@DubboReference(
    methods = {
        @Method(name = "getUser", cache = "lru"),    // 开启缓存
        @Method(name = "updateUser", cache = "false") // 关闭缓存（默认）
    }
)
private UserService userService;
```

### 支持的缓存类型**（通过 `cache` 属性指定）：

Dubbo 内置了四种缓存策略，你可以根据业务场景选择：

| 策略名称     | 值          | 说明                                                           |
| ------------ | ----------- | -------------------------------------------------------------- |
| LRU          | lru         | 默认值。淘汰最近最少使用的请求结果，防止内存溢出。             |
| Thread Local | threadlocal | 当前线程缓存。比如一次请求内多次调用同参数方法，只发一次 RPC。 |
| JCache       | jcache      | 与 JSR107 集成，可以桥接 Redis 或 Ehcache 等第三方缓存。       |
| Expiring     | expiring    | Dubbo 3 新增。支持过期的缓存策略。                             |

> ⚠️ **注意**：缓存适合**查询类**接口，对于有副作用的写操作，不应开启缓存。

:::tip

**💡 核心提示**

* 配置生效端：cache 配置在 Consumer（消费端）。当 Consumer 发现本地有相同的参数请求结果且未过期时，将不再发起远程调用。
* 适用场景：仅适用于 幂等性 极高、数据变化频率低的方法（如配置信息查询、字典表查询）。
* 内存风险：由于缓存是在 Consumer 进程内存中维护的，如果返回的对象很大或者参数组合极多，请务必使用 lru 并关注 JVM 内存状态。

:::

---

## 23. 服务上线怎么兼容旧版本？

通过**版本号（version）**过渡，多个不同版本的服务注册到注册中心，版本号不同的服务相互间不引用：

```xml
<!-- v1 Provider -->
<dubbo:service interface="com.example.UserService" version="1.0.0" ref="userServiceV1"/>
<!-- v2 Provider -->
<dubbo:service interface="com.example.UserService" version="2.0.0" ref="userServiceV2"/>

<!-- Consumer 可指定调用具体版本 -->
<dubbo:reference interface="com.example.UserService" version="1.0.0"/>
```

这与**服务分组（group）**的概念类似，group 用于隔离不同业务场景，version 用于平滑升级。

---

## 24. Dubbo 必须依赖的包有哪些？

### **Dubbo2.0 必须依赖 JDK**，其他组件均为可选依赖，根据使用的功能按需引入：

| 依赖                           | 用途                   |
| ------------------------------ | ---------------------- |
| JDK                            | 必须                   |
| Netty                          | 网络通信（强烈推荐）   |
| Zookeeper Client（如 Curator） | 使用 ZK 注册中心时需要 |
| Spring                         | 与 Spring 集成时需要   |
| Hessian2                       | 使用默认序列化时需要   |

### Dubbo 3.x 核心依赖清单

| 依赖组件       | 必要性 | 建议版本/实现         | 用途说明                                                            |
| -------------- | ------ | --------------------- | ------------------------------------------------------------------- |
| JDK            | 必须   | JDK 8 / 11 / 17       | Dubbo 3 核心库运行的基础环境。                                      |
| Dubbo Core     | 必须   | 3.x.x                 | 包含 SPI 机制、配置层、Proxy 层等核心逻辑。                         |
| Netty 4        | 核心   | 4.1.x                 | 事实上的必须。处理底层网络 IO（Triple 和 Dubbo 协议都靠它）。       |
| 序列化组件     | 核心   | Protobuf / Hessian2   | 必选其一。Triple 协议推荐 Protobuf；传统协议用 Hessian2/Fastjson2。 |
| 注册中心客户端 | 必选   | Nacos / Curator(ZK)   | 必选其一。用于服务发现。Dubbo 3 推荐使用 Nacos。                    |
| Spring Context | 可选   | 5.x / 6.x             | 仅在使用 Spring/Spring Boot 集成时需要。                            |
| YAML 解析器    | 建议   | SnakeYAML             | Dubbo 3 默认支持 YAML 配置，不引入则只能用 Properties 或 XML。      |
| 元数据中心插件 | 建议   | dubbo-metadata-report | Dubbo 3 特有。应用级服务发现模式下，建议配置以存储接口映射。        |


---

## 25. Dubbo telnet 命令能做什么？

Dubbo 2.0.5 以上版本的服务提供端口支持 telnet 命令，可用于调试和管理：

**连接服务：**

```bash
telnet localhost 20880
```

**常用命令：**

| 命令                             | 说明                       |
| -------------------------------- | -------------------------- |
| `ls`                             | 显示服务列表               |
| `ls -l`                          | 显示服务详细信息列表       |
| `ls XxxService`                  | 显示指定服务的方法列表     |
| `ls -l XxxService`               | 显示指定服务的方法详细信息 |
| `invoke XxxService.method(args)` | 直接调用服务方法           |
| `status`                         | 显示服务状态               |
| `count XxxService`               | 统计服务调用次数           |

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 提供了更强大的 **Dubbo Admin** 控制台，支持通过 Web UI 进行服务治理操作（路由规则、权重调整、服务测试等），telnet 方式仍可使用但已不是主推手段。

---

## 26. Dubbo 支持服务降级吗？

支持。通过 `dubbo:reference` 中的 `mock` 属性实现（详见[第 15 题](#15-dubbo-服务降级失败重试怎么做)）：

```xml
<!-- 直接返回空值 -->
<dubbo:reference mock="return null" .../>

<!-- 使用 Mock 实现类，在类中编写降级逻辑 -->
<dubbo:reference mock="true" .../>
```

命名规则：Mock 类名 = **接口名 + Mock**，放在与接口相同的包路径下。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 支持与 **Sentinel** 深度集成，可实现更完善的流控降级、熔断、系统保护等能力，推荐在生产环境中结合 Sentinel 使用。

---

## 27. Dubbo 如何优雅停机？

Dubbo 通过 **JDK 的 ShutdownHook** 完成优雅停机：

- **优雅停机（`kill PID`）**：JVM 收到信号后触发 ShutdownHook，Dubbo 会等待正在执行的请求处理完毕，然后注销服务、断开连接，再退出进程。
- **强制杀死（`kill -9 PID`）**：不会触发 ShutdownHook，直接强制终止进程，**不会**执行优雅停机逻辑，可能导致请求丢失。

**优雅停机的主要行为：**
1. 向注册中心注销服务，Consumer 感知后不再向该 Provider 发送新请求。
2. 等待已建立连接上的请求处理完成。
3. 关闭连接，退出进程。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 在 Kubernetes 场景下支持配合 **PreStop Hook** 和 **readinessProbe** 实现更完善的优雅下线，避免流量损失。

---

## 28. Dubbo 和 Dubbox 之间的区别？

**Dubbox** 是当当网在 Dubbo 停止维护期间（约 2012-2017 年）基于 Dubbo 2.x 做的扩展项目，主要增强点有：

- 支持 RESTful 风格的远程调用（基于 JAX-RS）
- 更新了 Zookeeper、HttpClient 等开源组件版本
- 支持新版本的 Spring 框架

> 📌 **现状**：Apache Dubbo 于 2017 年重新启动维护并捐献给 Apache，目前已发展到 Dubbo 3.x，Dubbox 已基本停止更新，不建议新项目使用。

---

## 29. Dubbo 和 Spring Cloud 的区别？

| 功能组件     | Dubbo                          | Spring Cloud                |
| ------------ | ------------------------------ | --------------------------- |
| 服务注册中心 | Zookeeper / Nacos              | Eureka / Nacos / Consul     |
| 服务调用方式 | **RPC**（高性能）              | **REST API**（通用性强）    |
| 服务网关     | 无（需自行集成）               | Spring Cloud Gateway / Zuul |
| 断路器       | 不完善（可集成 Sentinel）      | Hystrix / Resilience4j      |
| 分布式配置   | 无（可集成 Nacos Config）      | Spring Cloud Config / Nacos |
| 服务跟踪     | 无（可集成 Zipkin/SkyWalking） | Spring Cloud Sleuth         |
| 消息总线     | 无                             | Spring Cloud Bus            |
| 数据流       | 无                             | Spring Cloud Stream         |
| 批量任务     | 无                             | Spring Cloud Task           |

**选型建议：**

- **Dubbo**：像"组装机"，各组件选择自由度高，性能更高（RPC 协议），适合内部服务间高频调用的场景；上手难度略高。
- **Spring Cloud**：像"品牌机"，生态完整，各组件经过大量兼容性测试，稳定性更高，适合快速构建微服务体系；但 REST 调用性能不如 RPC。

> 🆕 **Dubbo 3.x 新变化**：Dubbo 3.x 通过 **Triple 协议**（HTTP/2 + Protobuf）填补了部分与 Spring Cloud 的差距，同时官方推出了 **Dubbo Spring Boot Starter** 和 **Dubbo Admin**，极大提升了开发体验。两者之间的差距在逐渐缩小，现实中也有团队将 Dubbo 与 Spring Cloud 组合使用（如以 Nacos 作为共同的注册/配置中心）。

---

## 30. 你还了解别的分布式框架吗？

| 框架             | 公司/社区        | 特点                                       |
| ---------------- | ---------------- | ------------------------------------------ |
| **Spring Cloud** | Pivotal / Spring | 完整的微服务解决方案，生态丰富             |
| **gRPC**         | Google           | 基于 HTTP/2 + Protobuf，跨语言，高性能     |
| **Thrift**       | Facebook         | 跨语言 RPC 框架，支持多种序列化协议        |
| **Finagle**      | Twitter          | 基于 Scala/JVM，函数式风格的 RPC 框架      |
| **brpc**         | Baidu            | 百度开源的工业级 RPC 框架，C++ 实现        |
| **SOFARPC**      | Ant Group        | 蚂蚁开源，与 SOFAStack 微服务体系深度集成  |
| **Kitex**        | ByteDance        | 字节跳动开源，Golang 实现的高性能 RPC 框架 |

---

*整理时间：2024 年 | 如有遗漏或错误欢迎补充*