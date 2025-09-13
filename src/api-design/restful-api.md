---
title: RESTful API 设计指南
category:
  - API 设计
tag:
  - RESTful
---

# RESTful API 设计指南

## 目录

[[toc]]

## 什么是 REST

REST（Representational State Transfer，表述性状态转移）是一种网络化超媒体应用的架构风格。它主要用于构建轻量级、可维护、可伸缩的 Web 服务。基于 REST 的服务被称为 RESTful 服务。

### 核心概念
- **资源（Resource）**：系统中的任何事物，可以是图片、视频、网页、商业信息等
- **表示（Representation）**：资源的具体表现形式，如 JSON、XML
- **状态转移（State Transfer）**：通过 HTTP 方法对资源进行操作

## RESTful 核心特点

### 1. 模型表示（Representations）

资源可以用多种格式表示，常见的有 JSON 和 XML：

**JSON 表示示例：**
```json
{
    "ID": "1",
    "Name": "张三",
    "Email": "zhangsan@example.com",
    "Country": "China"
}
```

**XML 表示示例：**
```xml
<Person>
    <ID>1</ID>
    <Name>张三</Name>
    <Email>zhangsan@example.com</Email>
    <Country>China</Country>
</Person>
```

### 2. 统一接口（Uniform Interface）

REST 使用标准的 HTTP 方法作为统一接口：

| 方法 | 用途 | 安全性 | 幂等性 |
|------|------|--------|--------|
| GET | 获取资源 | ✓ | ✓ |
| POST | 创建资源 | ✗ | ✗ |
| PUT | 创建/更新资源 | ✗ | ✓ |
| DELETE | 删除资源 | ✗ | ✓ |
| HEAD | 获取资源头信息 | ✓ | ✓ |
| OPTIONS | 获取允许的操作 | ✓ | ✓ |

### 3. 无状态（Stateless）

每个请求都是独立的，不依赖于之前的请求：

```
✅ 无状态设计
Request1: GET /api/persons/1
Request2: GET /api/persons/2

❌ 有状态设计  
Request1: GET /api/persons/1
Request2: GET /api/next-person
```

### 4. 资源链接

资源表示应包含相关资源的链接：

```json
{
  "id": 711,
  "manufacturer": "bmw",
  "model": "X5",
  "drivers": [
    {
      "id": "23",
      "name": "张三",
      "links": [
        {
          "rel": "self",
          "href": "/api/v1/drivers/23"
        }
      ]
    }
  ]
}
```

### 5. 缓存（Caching）

通过 HTTP 头控制缓存行为：

| 头部字段 | 说明 |
|----------|------|
| Cache-Control | 缓存控制指令 |
| Expires | 过期时间 |
| Last-Modified | 最后修改时间 |
| ETag | 实体标签 |

## 设计最佳实践

### 1. 使用名词而不是动词

| ✅ 推荐 | ❌ 避免 |
|---------|---------|
| GET /users | GET /getAllUsers |
| POST /users | POST /createUser |
| PUT /users/1 | PUT /updateUser/1 |
| DELETE /users/1 | DELETE /deleteUser/1 |

### 2. 使用复数名词

```
✅ 推荐
/users
/products
/orders

❌ 避免
/user
/product
/order
```

### 3. 使用子资源表达关系

```
GET /users/1/orders          # 获取用户1的所有订单
GET /users/1/orders/5        # 获取用户1的订单5
POST /users/1/orders         # 为用户1创建新订单
```

### 4. 良好的 URI 设计原则

- 使用小写字母
- 使用连字符（-）分隔单词，避免下划线（_）
- 避免尾部斜杠
- 保持 URI 简洁明了

```
✅ 推荐
/api/v1/user-profiles
/api/v1/shopping-carts

❌ 避免
/api/v1/User_Profiles/
/api/v1/ShoppingCarts/
```

## HTTP 方法使用规范

### GET - 获取资源

```http
GET /api/users/1 HTTP/1.1
Host: example.com
Accept: application/json
```

### POST - 创建资源

```http
POST /api/users HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com"
}
```

### PUT - 更新/创建资源

```http
PUT /api/users/1 HTTP/1.1
Host: example.com
Content-Type: application/json

{
  "name": "李四",
  "email": "lisi@example.com"
}
```

### DELETE - 删除资源

```http
DELETE /api/users/1 HTTP/1.1
Host: example.com
```

### PUT vs POST 的区别

| 特性 | PUT | POST |
|------|-----|------|
| 幂等性 | 幂等 | 非幂等 |
| URI 完整性 | 需要完整URI | 可以部分URI |
| 主要用途 | 更新已知资源 | 创建新资源 |

## 状态码使用指南

### 成功状态码

- **200 OK** - 请求成功
- **201 Created** - 资源创建成功
- **204 No Content** - 请求成功但无内容返回

### 重定向状态码

- **304 Not Modified** - 资源未修改，使用缓存

### 客户端错误状态码

- **400 Bad Request** - 请求格式错误
- **401 Unauthorized** - 需要身份验证
- **403 Forbidden** - 禁止访问
- **404 Not Found** - 资源不存在
- **422 Unprocessable Entity** - 请求格式正确但语义错误

### 服务器错误状态码

- **500 Internal Server Error** - 服务器内部错误

### 错误响应格式

```json
{
  "errors": [
    {
      "userMessage": "请求的资源不存在",
      "internalMessage": "数据库中未找到用户",
      "code": 34,
      "moreInfo": "http://api.example.com/docs/errors/34"
    }
  ]
}
```

## 高级功能实现

### 1. 过滤（Filtering）

```
GET /api/cars?color=red
GET /api/cars?seats>=4
GET /api/cars?color=red&year=2023
```

### 2. 排序（Sorting）

```
GET /api/cars?sort=manufacturer      # 升序
GET /api/cars?sort=-year            # 降序
GET /api/cars?sort=manufacturer,-year  # 多字段排序
```

### 3. 字段选择（Field Selection）

```
GET /api/cars?fields=id,name,color
```

### 4. 分页（Pagination）

```
GET /api/cars?page=2&limit=20
GET /api/cars?offset=20&limit=20
```

**响应头示例：**
```http
HTTP/1.1 200 OK
X-Total-Count: 150
Link: <https://api.example.com/cars?page=3&limit=20>; rel="next",
      <https://api.example.com/cars?page=1&limit=20>; rel="prev"
```

### 5. API 版本控制

**URL 版本控制：**
```
/api/v1/users
/api/v2/users
```

**HTTP 头版本控制：**
```http
GET /api/users HTTP/1.1
Accept: application/vnd.api+json;version=1
```

### 6. 内容协商

**请求格式：**
```http
POST /api/users HTTP/1.1
Content-Type: application/json
Accept: application/json
```

**响应格式：**
```http
HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/123
```

### 7. HTTP 方法覆盖

对于不支持 PUT/DELETE 的客户端：

```http
POST /api/users/1 HTTP/1.1
X-HTTP-Method-Override: PUT
Content-Type: application/json

{
  "name": "更新后的名称"
}
```

## 安全最佳实践

### 1. 身份验证

```http
GET /api/users HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. HTTPS 使用

- 所有 API 端点都应使用 HTTPS
- 重定向 HTTP 请求到 HTTPS

### 3. 输入验证

```json
{
  "error": "Validation Failed",
  "details": [
    {
      "field": "email",
      "message": "邮箱格式不正确"
    }
  ]
}
```

## 文档化建议

### API 文档结构

1. **概述** - API 的基本信息和用途
2. **认证** - 身份验证方法
3. **端点** - 所有可用的 API 端点
4. **示例** - 请求和响应示例
5. **错误码** - 所有可能的错误代码
6. **更改日志** - API 版本变更记录

### 文档示例

| 端点 | 方法 | 描述 | 参数 |
|------|------|------|------|
| /api/v1/users | GET | 获取用户列表 | page, limit, sort |
| /api/v1/users/{id} | GET | 获取指定用户 | - |
| /api/v1/users | POST | 创建新用户 | name, email (required) |
| /api/v1/users/{id} | PUT | 更新用户信息 | name, email |
| /api/v1/users/{id} | DELETE | 删除用户 | - |

## 测试工具推荐

- **Postman** - API 测试和文档生成
- **Insomnia** - REST API 客户端
- **curl** - 命令行 HTTP 客户端
- **HTTPie** - 命令行 HTTP 客户端

## 总结

RESTful API 设计遵循以上原则可以帮助你创建：

- ✅ 易于理解和使用的接口
- ✅ 可维护和可扩展的架构
- ✅ 符合 HTTP 标准的实现
- ✅ 良好的开发者体验

记住，好的 API 设计是一个持续的过程，需要根据实际使用情况不断优化和改进。