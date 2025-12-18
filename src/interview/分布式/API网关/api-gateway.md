---
title: API网关基础知识
category:
  - 面试题
tag:
  - 分布式-网关
date: 2025-11-28
---

# API网关基础知识

## 什么是网关？

网关（Gateway）是计算机网络中的一种设备或服务器，用于连接不同网络或协议之间进行数据转发和处理。

如下所示，网关服务外层通过 Nginx 进⾏负载转发以达到⾼可⽤。Nginx 在部署的时候，尽量也要考虑高可用，避免单点风险。

<iframe
  src="https://tuonioooo.github.io/fast-web-template/web/gateway/nginx-dynamic-example/dist"
  width="100%"
  height="800"
  style="border:0;"
></iframe>

> [原始示例来自于-stackblitz](https://stackblitz.com/edit/vitejs-vite-8zeohk8s?embed=1&view=preview)

## 网关能提供哪些功能？

绝大部分网关可以提供下面这些功能（有一些功能需要借助其他框架或者中间件）：

- **请求转发**：将请求转发到目标微服务。
- **负载均衡**：根据各个微服务实例的负载情况或者具体的负载均衡策略配置对请求实现动态的负载均衡。
- **安全认证**：对用户请求进行身份验证并仅允许可信客户端访问 API，并且还能够使用类似 RBAC 等方式来授权。
- **参数校验**：支持参数映射与校验逻辑。
- **日志记录**：记录所有请求的行为日志供后续使用。
- **监控告警**：从业务指标、机器指标、JVM 指标等方面进行监控并提供配套的告警机制。
- **流量控制**：对请求的流量进行控制，也就是限制某一时刻内的请求数。
- **熔断降级**：实时监控请求的统计信息，达到配置的失败阈值后，自动熔断，返回默认值。
- **响应缓存**：当用户请求获取的是一些静态的或更新不频繁的数据时，一段时间内多次请求获取到的数据很可能是一样的。对于这种情况可以将响应缓存起来。这样用户请求可以直接在网关层得到响应数据，无需再去访问业务服务，减轻业务服务的负担。
- **响应聚合**：某些情况下用户请求要获取的响应内容可能会来自于多个业务服务。网关作为业务服务的调用方，可以把多个服务的响应整合起来，再一并返回给用户。
- **灰度发布**：将请求动态分流到不同的服务版本（最基本的一种灰度发布）。
- **异常处理**：对于业务服务返回的异常响应，可以在网关层在返回给用户之前做转换处理。这样可以把一些业务侧返回的异常细节隐藏，转换成用户友好的错误提示返回。
- **API 文档：** 如果计划将 API 暴露给组织以外的开发人员，那么必须考虑使用 API 文档，例如 Swagger 或 OpenAPI。
- **协议转换**：通过协议转换整合后台基于 REST、AMQP、Dubbo 等不同风格和实现技术的微服务，面向 Web Mobile、开放平台等特定客户端提供统一服务。
- **证书管理**：将 SSL 证书部署到 API 网关，由一个统一的入口管理接口，降低了证书更换时的复杂度。

下图来源于[百亿规模 API 网关服务 Shepherd 的设计与实现 - 美团技术团队 - 2021](https://mp.weixin.qq.com/s/iITqdIiHi3XGKq6u6FRVdg)这篇文章。

![](https://oss.javaguide.cn/github/javaguide/distributed-system/api-gateway/up-35e102c633bbe8e0dea1e075ea3fee5dcfb.png)

## 有哪些常见的网关系统？

### Netflix Zuul

Zuul 是 Netflix 开发的一款提供动态路由、监控、弹性、安全的网关服务，基于 Java 技术栈开发，可以和 Eureka、Ribbon、Hystrix 等组件配合使用。

Zuul 核心架构如下：

![Zuul 核心架构](https://oss.javaguide.cn/github/javaguide/distributed-system/api-gateway/zuul-core-architecture.webp)

Zuul 主要通过过滤器（类似于 AOP）来过滤请求，从而实现网关必备的各种功能。

![Zuul 请求声明周期](https://oss.javaguide.cn/github/javaguide/system-design/distributed-system/api-gateway/zuul-request-lifecycle.webp)

我们可以自定义过滤器来处理请求，并且，Zuul 生态本身就有很多现成的过滤器供我们使用。就比如限流可以直接用国外朋友写的 [spring-cloud-zuul-ratelimit](https://github.com/marcosbarbero/spring-cloud-zuul-ratelimit) (这里只是举例说明，一般是配合 hystrix 来做限流)：

```xml
<dependency>
  <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-netflix-zuul</artifactId>
</dependency>
<dependency>
    <groupId>com.marcosbarbero.cloud</groupId>
    <artifactId>spring-cloud-zuul-ratelimit</artifactId>
    <version>2.2.0.RELEASE</version>
</dependency>
```

[Zuul 1.x](https://netflixtechblog.com/announcing-zuul-edge-service-in-the-cloud-ab3af5be08ee) 基于同步 IO，性能较差。[Zuul 2.x](https://netflixtechblog.com/open-sourcing-zuul-2-82ea476cb2b3) 基于 Netty 实现了异步 IO，性能得到了大幅改进。

![Zuul2 架构](https://oss.javaguide.cn/github/javaguide/distributed-system/api-gateway/zuul2-core-architecture.png)

- GitHub 地址： <https://github.com/Netflix/zuul>
- 官方 Wiki： <https://github.com/Netflix/zuul/wiki>

### Spring Cloud Gateway

SpringCloud Gateway 属于 Spring Cloud 生态系统中的网关，其诞生的目标是为了替代老牌网关 **Zuul**。准确点来说，应该是 Zuul 1.x。SpringCloud Gateway 起步要比 Zuul 2.x 更早。

为了提升网关的性能，SpringCloud Gateway 基于 Spring WebFlux 。Spring WebFlux 使用 Reactor 库来实现响应式编程模型，底层基于 Netty 实现同步非阻塞的 I/O。

![](https://oss.javaguide.cn/github/javaguide/system-design/distributed-system/api-gateway/springcloud-gateway-%20demo.png)

Spring Cloud Gateway 不仅提供统一的路由方式，并且基于 Filter 链的方式提供了网关基本的功能，例如：安全，监控/指标，限流。

Spring Cloud Gateway 和 Zuul 2.x 的差别不大，也是通过过滤器来处理请求。不过，目前更加推荐使用 Spring Cloud Gateway 而非 Zuul，Spring Cloud 生态对其支持更加友好。

- Github 地址： <https://github.com/spring-cloud/spring-cloud-gateway>
- 官网： <https://spring.io/projects/spring-cloud-gateway>

### OpenResty

根据官方介绍：

> OpenResty 是一个基于 Nginx 与 Lua 的高性能 Web 平台，其内部集成了大量精良的 Lua 库、第三方模块以及大多数的依赖项。用于方便地搭建能够处理超高并发、扩展性极高的动态 Web 应用、Web 服务和动态网关。

![OpenResty 和 Nginx 以及 Lua 的关系](https://oss.javaguide.cn/github/javaguide/system-design/distributed-system/api-gatewaynginx-lua-openresty.png)

OpenResty 基于 Nginx，主要还是看中了其优秀的高并发能力。不过，由于 Nginx 采用 C 语言开发，二次开发门槛较高。如果想在 Nginx 上实现一些自定义的逻辑或功能，就需要编写 C 语言的模块，并重新编译 Nginx。

为了解决这个问题，OpenResty 通过实现 `ngx_lua` 和 `stream_lua` 等 Nginx 模块，把 Lua/LuaJIT 完美地整合进了 Nginx，从而让我们能够在 Nginx 内部里嵌入 Lua 脚本，使得可以通过简单的 Lua 语言来扩展网关的功能，比如实现自定义的路由规则、过滤器、缓存策略等。

> Lua 是一种非常快速的动态脚本语言，它的运行速度接近于 C 语言。LuaJIT 是 Lua 的一个即时编译器，它可以显著提高 Lua 代码的执行效率。LuaJIT 将一些常用的 Lua 函数和工具库预编译并缓存，这样在下次调用时就可以直接使用缓存的字节码，从而大大加快了执行速度。

关于 OpenResty 的入门以及网关安全实战推荐阅读这篇文章：[每个后端都应该了解的 OpenResty 入门以及网关安全实战](https://mp.weixin.qq.com/s/3HglZs06W95vF3tSa3KrXw)。

- Github 地址： <https://github.com/openresty/openresty>
- 官网地址： <https://openresty.org/>

### Kong

Kong 是一款基于 [OpenResty](https://github.com/openresty/) （Nginx + Lua）的高性能、云原生、可扩展、生态丰富的网关系统，主要由 3 个组件组成：

- Kong Server：基于 Nginx 的服务器，用来接收 API 请求。
- Apache Cassandra/PostgreSQL：用来存储操作数据。
- Kong Dashboard：官方推荐 UI 管理工具，当然，也可以使用 RESTful 方式 管理 Admin api。

![](https://oss.javaguide.cn/github/javaguide/system-design/distributed-system/api-gateway/kong-way.webp)

由于默认使用 Apache Cassandra/PostgreSQL 存储数据，Kong 的整个架构比较臃肿，并且会带来高可用的问题。

Kong 提供了插件机制来扩展其功能，插件在 API 请求响应循环的生命周期中被执行。比如在服务上启用 Zipkin 插件：

```shell
$ curl -X POST http://kong:8001/services/{service}/plugins \
    --data "name=zipkin"  \
    --data "config.http_endpoint=http://your.zipkin.collector:9411/api/v2/spans" \
    --data "config.sample_ratio=0.001"
```

Kong 本身就是一个 Lua 应用程序，并且是在 Openresty 的基础之上做了一层封装的应用。归根结底就是利用 Lua 嵌入 Nginx 的方式，赋予了 Nginx 可编程的能力，这样以插件的形式在 Nginx 这一层能够做到无限想象的事情。例如限流、安全访问策略、路由、负载均衡等等。编写一个 Kong 插件，就是按照 Kong 插件编写规范，写一个自己自定义的 Lua 脚本，然后加载到 Kong 中，最后引用即可。

![](https://oss.javaguide.cn/github/javaguide/system-design/distributed-system/api-gateway/kong-gateway-overview.png)

除了 Lua，Kong 还可以基于 Go 、JavaScript、Python 等语言开发插件，得益于对应的 PDK（插件开发工具包）。

关于 Kong 插件的详细介绍，推荐阅读官方文档：<https://docs.konghq.com/gateway/latest/kong-plugins/>，写的比较详细。

- Github 地址： <https://github.com/Kong/kong>
- 官网地址： <https://konghq.com/kong>

### APISIX

APISIX 是一款基于 OpenResty 和 etcd 的高性能、云原生、可扩展的网关系统。

> etcd 是使用 Go 语言开发的一个开源的、高可用的分布式 key-value 存储系统，使用 Raft 协议做分布式共识。

与传统 API 网关相比，APISIX 具有动态路由和插件热加载，特别适合微服务系统下的 API 管理。并且，APISIX 与 SkyWalking（分布式链路追踪系统）、Zipkin（分布式链路追踪系统）、Prometheus（监控系统） 等 DevOps 生态工具对接都十分方便。

![APISIX 架构图](https://oss.javaguide.cn/github/javaguide/distributed-system/api-gateway/apisix-architecture.png)

作为 Nginx 和 Kong 的替代项目，APISIX 目前已经是 Apache 顶级开源项目，并且是最快毕业的国产开源项目。国内目前已经有很多知名企业（比如金山、有赞、爱奇艺、腾讯、贝壳）使用 APISIX 处理核心的业务流量。

根据官网介绍：“APISIX 已经生产可用，功能、性能、架构全面优于 Kong”。

APISIX 同样支持定制化的插件开发。开发者除了能够使用 Lua 语言开发插件，还能通过下面两种方式开发来避开 Lua 语言的学习成本：

- 通过 Plugin Runner 来支持更多的主流编程语言（比如 Java、Python、Go 等等）。通过这样的方式，可以让后端工程师通过本地 RPC 通信，使用熟悉的编程语言开发 APISIX 的插件。这样做的好处是减少了开发成本，提高了开发效率，但是在性能上会有一些损失。
- 使用 Wasm（WebAssembly） 开发插件。Wasm 被嵌入到了 APISIX 中，用户可以使用 Wasm 去编译成 Wasm 的字节码在 APISIX 中运行。

> Wasm 是基于堆栈的虚拟机的二进制指令格式，一种低级汇编语言，旨在非常接近已编译的机器代码，并且非常接近本机性能。Wasm 最初是为浏览器构建的，但是随着技术的成熟，在服务器端看到了越来越多的用例。

![](https://oss.javaguide.cn/github/javaguide/distributed-system/api-gateway/up-a240d3b113cde647f5850f4c7cc55d4ff5c.png)

- Github 地址：<https://github.com/apache/apisix>
- 官网地址： <https://apisix.apache.org/zh/>

相关阅读：

- [为什么说 Apache APISIX 是最好的 API 网关？](https://mp.weixin.qq.com/s/j8ggPGEHFu3x5ekJZyeZnA)
- [有了 NGINX 和 Kong，为什么还需要 Apache APISIX](https://www.apiseven.com/zh/blog/why-we-need-Apache-APISIX)
- [APISIX 技术博客](https://www.apiseven.com/zh/blog)
- [APISIX 用户案例](https://www.apiseven.com/zh/usercases)（推荐）

### Shenyu

Shenyu 是一款基于 WebFlux 的可扩展、高性能、响应式网关，Apache 顶级开源项目。

![Shenyu 架构](https://oss.javaguide.cn/github/javaguide/distributed-system/api-gateway/shenyu-architecture.png)

Shenyu 通过插件扩展功能，插件是 ShenYu 的灵魂，并且插件也是可扩展和热插拔的。不同的插件实现不同的功能。Shenyu 自带了诸如限流、熔断、转发、重写、重定向、和路由监控等插件。

- Github 地址： <https://github.com/apache/incubator-shenyu>
- 官网地址： <https://shenyu.apache.org/>

## 如何选择网关？

在常见的网关系统中，**Spring Cloud Gateway**、**Kong** 和 **APISIX** 是目前使用最广泛的三个选择。

### Spring Cloud Gateway

对于以 Java 为主要技术栈的团队，**Spring Cloud Gateway** 通常是首选方案，主要优势包括:

- **无缝集成**:与 Spring Cloud 生态深度整合,学习成本低
- **成熟稳定**:经过大量生产环境验证,社区支持完善
- **开发友好**:配置简单,Java 开发者上手快

不过需要注意其局限性:

- **性能瓶颈**:相比 Kong 和 APISIX,吞吐量和延迟表现较弱
- **功能局限**:在高并发、复杂路由场景下,通常需要搭配 `OpenResty` 等组件使用
- **适用场景**:更适合中小规模、对极致性能要求不高的业务场景

### Kong vs APISIX

Kong 和 APISIX 都是高性能、功能丰富的云原生网关,适合对性能和扩展性要求较高的场景。

**Kong** 作为开源 API 网关的先驱,具有以下特点:
- 生态成熟,插件丰富
- 用户群体庞大,社区活跃
- 依赖 PostgreSQL/Cassandra 作为配置存储

**APISIX** 作为后起之秀,在多个维度上表现更优:

| 对比维度 | APISIX | Kong |
|---------|--------|------|
| **配置中心** | 基于 etcd,无单点故障,云原生友好 | 依赖数据库,存在单点风险,需额外高可用方案 |
| **热更新** | 支持毫秒级热更新 | 不支持热更新 |
| **性能表现** | 吞吐量和延迟更优 | 性能较好但略逊一筹 |
| **插件生态** | 插件数量更多,功能更全面 | 插件成熟但相对较少 |
| **架构设计** | 更符合云原生理念 | 传统架构 |

### 选型建议

- **Java 技术栈 + 中小规模业务**:优先选择 **Spring Cloud Gateway**
- **高性能 + 云原生场景**:推荐 **APISIX**,特别是在 Kubernetes 环境下
- **需要成熟生态和企业级支持**:可考虑 **Kong**,尤其是已有 Kong 使用经验的团队

根据 APISIX 官方数据,其在功能、性能和架构上已全面超越 Kong,对于新项目来说,APISIX 是更具前瞻性的选择。

## 参考

- Kong 插件开发教程[通俗易懂]：<https://cloud.tencent.com/developer/article/2104299>
- API 网关 Kong 实战：<https://xie.infoq.cn/article/10e4dab2de0bdb6f2c3c93da6>
- Spring Cloud Gateway 原理介绍和应用：<https://blog.fintopia.tech/60e27b0e2078082a378ec5ed/>
- 微服务为什么要用到 API 网关？：<https://apisix.apache.org/zh/blog/2023/03/08/why-do-microservices-need-an-api-gateway/>
