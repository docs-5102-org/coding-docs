---
title: MongoDB 可视化工具
category:
  - 数据库
tag:
  - MongoDB
---


# MongoDB 可视化工具  

## 目录

[[toc]]

## 1 工具演进史

| 时代 | 名称 | 特点 |
|---|---|---|
| 2012 | Robomongo | 开源、轻量、Shell 风格 |
| 2017 | Robo 3T | 被 3T 收购，继续免费 |
| 2020+ | **Studio 3T Community Edition** | 免费、非商业、功能增强 |

一句话：**Robomongo 已经退役，现在叫 Studio 3T Community Edition。**

## 2 下载与安装

### 2.1 官方地址  

[https://robomongo.org/download](https://robomongo.org/download)

### 2.2 支持平台  
- Windows 64-bit  
- macOS  
- Linux 64-bit  

> 下载后一路下一步即可；首次启动可选 **Dark Theme**，护眼。

---

## 3 核心功能速览
| 场景 | 功能 | 一句话描述 |
|---|---|---|
| 连接 | Fast Connection Setup | 复制 URI → 粘贴 → 秒连 |
| 浏览 | Tree / Table / JSON 视图 | 嵌套字段一键展开 |
| 查询 | IntelliShell | 语法高亮 + 自动补全 + 错误提示 |
| 聚合 | Aggregation Editor (CE 基础版) | 分阶段调试 Pipeline |
| 导入导出 | BSON/CSV/JSON/Excel | 向导式下一步下一步 |
| 错误减少 | 可视化点选 | 告别手写括号地狱 |

---

## 4 5 分钟上手
1. **新建连接**  
   - 主界面 `Connect → New Connection`  
   - 把 `mongodb://user:pass@host:port/db` 粘进 URI → `Connect`。

2. **浏览集合**  
   - 左侧双击集合 → 自动打开 **Tree 视图**  
   - 右上角切换 **Table/JSON**。

3. **跑一条查询**  
   - 工具栏 `IntelliShell` → 输入  
     ```js
     db.orders.find({status:"PAID"}).sort({amount:-1}).limit(10)
     ```
   - `F5` 运行，结果即时高亮。

4. **保存常用脚本**  
   - `Ctrl/Cmd + S` → 存为 `.js` 文件，下次直接打开。


## 其他值得关注的 MongoDB GUI 工具

| 工具名称 | 官方/社区 | 跨平台 | 许可证 | 一句话亮点 |
|---|---|---|---|---|
| **MongoDB Compass** | 官方 | Win / macOS / Linux | 免费 | 官方出品，聚合管道与 Schema 可视化神器 |
| **NoSQLBooster**（原 MongoBooster） | 社区 | Win / macOS / Linux | 免费版 + 付费版 | IntelliSense + SQL to MongoDB |
| **Navicat for MongoDB** | 商业 | Win / macOS / Linux | 14 天试用后付费 | 多数据库统一操作习惯 |
| **DBeaver** | 社区 | Win / macOS / Linux | 免费版 + 企业版 | 通用数据库管理器，也支持 MongoDB |
| **TablePlus** | 商业 | Win / macOS / Linux | 免费基础版 + 付费 | 原生客户端，界面极简，支持多种数据源 |
| **JetBrains DataGrip / Mongo Plugin** | 商业 | Win / macOS / Linux | 30 天试用后付费 | 深度集成 JetBrains IDE |
| **mongo-express** | 开源 | 任何支持 Node.js 的平台 | MIT 开源 | 浏览器即用，部署简单 |
| **phpMoAdmin** | 开源 | 任何支持 PHP 的平台 | GPL 开源 | 类似 phpMyAdmin，单文件即可运行 |

---

## 全部工具速查表（横向对比）

| 维度 | Studio 3T CE | MongoDB Compass | NoSQLBooster Free | Navicat for MongoDB | Robo 3T |
|---|---|---|---|---|---|
| **价格** | 免费（非商业） | 完全免费 | 免费版 + 付费 | 付费（14 天试用） | 免费 |
| **聚合管道可视化** | ✅ 基础版 | ✅ 最强 | ✅ | ✅ | ❌ |
| **SQL 查询** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **智能补全** | ✅ | ✅ | ✅ 最强 | ✅ | 一般 |
| **地理空间可视化** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **性能监控** | ❌ | ✅ 实时仪表盘 | ✅ | ✅ | ❌ |
| **跨平台** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **安装包体积** | 中等 | 中等 | 中等 | 大 | 小 |
| **适用场景** | 个人/学习 | 通用/新手 | 开发者 | 企业多库管理 | 轻量级/老用户 |

> 小结：  
> - **刚入门 / 想零成本**：直接装 **MongoDB Compass** 或 **Studio 3T CE**。  
> - **需要 SQL 语法或脚本增强**：**NoSQLBooster**。  
> - **已习惯 Navicat 系列**：继续用 **Navicat for MongoDB**。  
> - **喜欢浏览器即用或服务器共享**：**mongo-express**、**phpMoAdmin**。