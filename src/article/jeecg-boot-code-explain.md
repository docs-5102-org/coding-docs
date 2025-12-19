---
title: JeecgBoot 表单设计器与代码生成器文档
category:
  - 低代码生成器
tag:
  -  JeecgBoot
---

# JeecgBoot 表单设计器与代码生成器文档

## 一、表单设计器前端架构

### 1.1 功能概述
`/online/cgform` 是 JeecgBoot 的表单设计器功能，其页面和 API 主要来自 `@jeecg/online` 包。

### 1.2 核心组件

| 组件文件 | 功能说明 |
|---------|---------|
| `CgformModal-21c5c387.mjs` | 表单设计器主界面 |
| `OnlCgformTabList-019ad753.mjs` | 表格组件 |
| `OnlCgformInnerTableList-4b5e14ed.mjs` | 内嵌表格组件 |
| `OnlCgformErpList-58acdfa0.mjs` | ERP 风格表格组件 |

### 1.3 API 接口

**基础路径：** `/online/cgform/head/`

| 接口路径 | 功能说明 |
|---------|---------|
| `GET /{formId}` | 获取表单配置 |
| `GET /enhanceJs/{formId}` | 获取 JS 增强配置 |
| `GET /enhanceJava/{formId}` | 获取 Java 增强配置 |
| `GET /enhanceSql/{formId}` | 获取 SQL 增强配置 |
| `GET /enhanceButton/{formId}` | 获取按钮增强配置 |

### 1.4 路由机制
- 路由通过外部包 `@jeecg/online` 注册
- 使用动态路由机制，通过 `registerDynamicRouter` 在应用启动时注册
- 页面访问路径：`/online/cgform`

---

## 二、表单设计器后端架构

### 2.1 模块依赖

**主要模块：** `jeecg-module-system`

```xml
<dependency>
    <groupId>org.jeecgframework.boot</groupId>
    <artifactId>hibernate-re</artifactId>
</dependency>
```

> **⚠️ 注意**  
> 原依赖已反编译，现使用 `jeecg-module-online` 模块代替

### 2.2 physicId 字段详解

#### 2.2.1 字段作用
`physicId` 字段用于处理表单的**复制和版本管理**，实现代码位于：
```
jeecg-module-online/src/main/java/org/jeecg/modules/online/cgform/service/impl/OnlCgformHeadServiceImpl.java
```

#### 2.2.2 核心逻辑

```java
LambdaQueryWrapper<OnlCgformHead> lambdaQueryWrapper = new LambdaQueryWrapper<>();
lambdaQueryWrapper.eq(OnlCgformHead::getPhysicId, id);
List<OnlCgformHead> selectList = this.baseMapper.selectList(lambdaQueryWrapper);

if (selectList != null && !selectList.isEmpty()) {
    for (OnlCgformHead onlCgformHead2 : selectList) {
        m212a(onlCgformHead2.getId());
    }
}
```

#### 2.2.3 字段含义

| 场景 | id | physicId | 说明 |
|------|----|---------|----|
| **原始表单** | UUID_A | UUID_A | `id` 与 `physicId` 相同，标识原始表单 |
| **复制表单** | UUID_B | UUID_A | 新 `id`，但 `physicId` 保持为原表单的 `id` |

#### 2.2.4 删除逻辑

当删除表单时，系统会：
1. 查找所有 `physicId` 等于当前表单 `id` 的记录（即所有副本）
2. 遍历找到的副本，调用 `m212a` 方法删除关联配置
3. 确保原始表单及其所有副本的配置被完全清理

`m212a` 方法负责删除：
- 字段定义
- 按钮配置
- JS 增强
- 其他关联数据

#### 2.2.5 应用场景

| 场景 | 示例 |
|------|------|
| **表单复制** | 复制现有表单作为新表单的起点，无需从头设计 |
| **版本管理** | 创建同一表单的多个版本，共享物理原型但配置不同 |
| **模板系统** | 创建表单模板，基于模板创建多个实例 |

**实际案例：**  
创建"客户信息"表单后，为不同部门创建多个自定义版本（销售部、市场部、客服部），这些版本共享基础结构但有不同的字段或布局。

---

## 三、代码生成器

### 3.1 功能入口

**核心类：** `OnlCgformHeadServiceImpl`  
**路径：**
```
jeecg-module-online/src/main/java/org/jeecg/modules/online/cgform/service/impl/OnlCgformHeadServiceImpl.java
```

**核心方法：** `generateCode()`

### 3.2 生成流程

```
用户触发代码生成
    ↓
OnlCgformHeadServiceImpl.generateCode()
    ↓
依赖 jeecg-boot-base-core 的 CgformEnum
    ↓
获取模板路径
    ↓
填充数据到模板
    ↓
生成代码文件
```

### 3.3 模板配置

**模板存储位置：**  
```
jeecg-module-system/jeecg-system-biz/src/main/resources/jeecg/
```

**依赖关系：**
- **代码生成器**：`jeecg-module-online` 模块
- **枚举配置**：`jeecg-boot-base-core` 模块的 `CgformEnum`
- **模板文件**：`jeecg-system-biz` 模块的 `resources/jeecg/` 目录

---

## 四、架构总结

```
┌─────────────────────────────────────────────────────┐
│                    前端层                              │
│  @jeecg/online 包 → 动态路由 → 表单设计器页面          │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                    API层                              │
│  /online/cgform/head/* → 表单配置 & 增强管理           │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                   业务层                              │
│  OnlCgformHeadServiceImpl → physicId 管理 & 代码生成  │
└─────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────┐
│                   模板层                              │
│  jeecg-system-biz/resources/jeecg/ → 代码模板         │
└─────────────────────────────────────────────────────┘
```

---

## 五、关键技术点

✅ **模块化设计**：前后端分离，通过外部包引入功能  
✅ **动态路由**：运行时注册路由，灵活扩展  
✅ **版本管理**：通过 `physicId` 实现表单复制和版本控制  
✅ **代码生成**：基于模板引擎，自动生成业务代码  
✅ **级联删除**：删除表单时自动清理所有关联数据