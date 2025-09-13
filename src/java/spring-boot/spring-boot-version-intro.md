---
title: 版本介绍
category:
  - Web框架
tag:
  - Spring Boot
---

# 版本介绍


> 来自官方文档 [https://docs.spring.io/spring-boot/docs/{version}/reference/htmlsingle/#getting-started.system-requirements](https://docs.spring.io/spring-boot/docs/3.0.5/reference/htmlsingle/#getting-started.system-requirements) 的权威整理，一张表帮你选对版本、不踩坑。

## 速查表（官方推荐组合）

| Spring Boot | **最低** Java | **推荐** Java | Maven | Gradle | 备注 |
|-------------|---------------|---------------|--------|---------|------|
| **3.3.x** | 17 | 21 | 3.6.3+ | 7.5+ | Jakarta EE 10；支持虚拟线程 |
| **3.2.x** | 17 | 21 | 3.6.3+ | 7.5+ | 长期维护 (LTS) |
| **3.1.x** | 17 | 17 | 3.6.3+ | 7.5+ | Jakarta EE 10 |
| **3.0.x** | 17 | 17 | 3.5+ | 7.4+ | Jakarta EE 10；不再支持 Java 8 |
| **2.7.x** | 8 | 11/17 | 3.5+ | 6.8–7.x | 最后的 2.x LTS，2023-11 停止 OSS 支持 |
| **2.6.x** | 8 | 11 | 3.3+ | 6.8+ | 2022-11 EOL |
| **2.5.x** | 8 | 11 | 3.3+ | 6.8+ | 2022-05 EOL |
| **2.4.x** | 8 | 11 | 3.3+ | 6.7+ | 2021-11 EOL |

---

## 如何快速验证

1. 打开终端  
   ```bash
   java -version
   mvn -v
   gradle -v
   ```
2. 对照上表，确认 **Java ≥ 最低版本** 且 **构建工具 ≥ 最低版本**。

---

## 升级建议

| 当前版本 | 目标版本 | 关键动作 |
|----------|----------|----------|
| 2.x → 3.x | 3.3.x | 先升级到 **Java 17 或 21**，再迁移 `javax.*` → `jakarta.*` |
| 2.6/2.5 → 2.7 | 2.7.x | 无需换 Java，可直接升级；2.7 是 2.x 最后 LTS |
| 1.x | 2.7/3.x | 先停机升级到 2.7，再考虑 3.x |

---

## 官方文档直达

- 3.3.x 要求：https://docs.spring.io/spring-boot/docs/3.3.0/reference/htmlsingle/#getting-started.system-requirements  
- 2.7.x 要求：https://docs.spring.io/spring-boot/docs/2.7.18/reference/htmlsingle/#getting-started.system-requirements  

将上面链接中的 `{version}` 替换成目标版本号即可查看对应文档。

---

## 总结

**新项目直接上 Spring Boot 3.3 + Java 21；老项目 2.x 至少升到 2.7，并准备迁移到 3.x。**

