---
title: Thymeleaf 入门指南
category:
  - java
  - 模版引擎
tag:
  - Thymeleaf
---

# Thymeleaf 入门指南

## 简介

Thymeleaf 是一个现代的服务器端 Java 模板引擎，适用于 Web 和独立环境。它能够处理 HTML、XML、JavaScript、CSS 甚至纯文本。

**官方资源：**
- 官网：https://www.thymeleaf.org/
- 官方文档：https://www.thymeleaf.org/documentation.html
- 官方教程：https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html

## 模板布局（Layout）

### 方式一：Fragment 组合方式

将页面分割成多个片段（fragment），使用 `th:include` 和 `th:replace` 来组合页面。

#### 主页面示例
```html
<!-- index.html -->
<html>
<head>
    <meta charset="utf-8"/>
    <title>Demo</title>
</head>
<body>
    <div th:include="components/header :: header"></div>
    <div class="container">
        <h1>Hello World</h1>
    </div>
    <div th:include="components/footer :: footer"></div>
</body>
</html>
```

#### 头部组件
```html
<!-- components/header.html -->
<header th:fragment="header">
    <ul>
        <li>News</li>
        <li>Blog</li>
        <li>Post</li>
    </ul>
</header>
```

#### 底部组件
```html
<!-- components/footer.html -->
<footer th:fragment="footer">
    <div>I am footer.</div>
</footer>
```

### 方式二：布局装饰器（推荐）

创建一个基础布局模板，子页面继承并填充内容区域。

#### 布局模板
```html
<!-- layout/layout.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Demo</title>
    <!-- 公共的 CSS、JS 资源 -->
    <link rel="stylesheet" th:href="@{/css/common.css}"/>
</head>
<body>
    <div th:include="components/header :: header"></div>
    
    <!-- 内容占位符 -->
    <div layout:fragment="content"></div>
    
    <div th:include="components/footer :: footer"></div>
    
    <!-- 公共的 JavaScript -->
    <script th:src="@{/js/common.js}"></script>
</body>
</html>
```

#### 子页面
```html
<!-- index.html -->
<html layout:decorator="layout/layout">
<head>
    <!-- 页面特定的 CSS -->
    <link rel="stylesheet" th:href="@{/css/index.css}"/>
</head>
<body>
    <div layout:fragment="content">
        <h2>Hello World!!!</h2>
        <p>这是首页内容</p>
    </div>
    
    <!-- 页面特定的 JavaScript -->
    <script th:src="@{/js/index.js}"></script>
</body>
</html>
```

**优势：**
- 布局中的 CSS、JS、图片等资源可以在所有子页面中使用
- 子页面可以引入页面特定的资源
- 代码复用性高，维护方便

## Fragment 传参

向 fragment 传递参数来实现动态内容。

### CSS 样式定义
```css
.active {
    background-color: green;
    color: white;
}
```

### 带参数的 Fragment
```html
<!-- components/header.html -->
<header th:fragment="header (tab)">
    <ul>
        <li><span th:class="${tab eq 'news'} ? 'active'">News</span></li>
        <li><span th:class="${tab eq 'blog'} ? 'active'">Blog</span></li>
        <li><span th:class="${tab eq 'post'} ? 'active'">Post</span></li>
    </ul>
</header>
```

### 调用方式
```html
<div th:include="components/header :: header(tab='blog')"></div>
```

## th:replace、th:include、th:insert 的区别

| 指令 | 行为 | 说明 |
|------|------|------|
| `th:insert` | 保留自己的主标签，保留 fragment 的主标签 | 插入方式 |
| `th:replace` | 不要自己的主标签，保留 fragment 的主标签 | 完全替换 |
| `th:include` | 保留自己的主标签，不要 fragment 的主标签 | 内容替换（3.0后不推荐） |

### 示例对比

**Fragment 定义：**
```html
<footer th:fragment="copy">  
    <script type="text/javascript" th:src="@{/plugins/jquery/jquery-3.0.2.js}"></script>  
</footer>
```

**使用方式：**
```html
<div th:insert="footer :: copy"></div>  
<div th:replace="footer :: copy"></div>  
<div th:include="footer :: copy"></div>
```

**渲染结果：**
```html
<!-- th:insert 结果 -->
<div>  
    <footer>  
        <script type="text/javascript" src="/plugins/jquery/jquery-3.0.2.js"></script>  
    </footer>    
</div>

<!-- th:replace 结果 -->
<footer>  
    <script type="text/javascript" src="/plugins/jquery/jquery-3.0.2.js"></script>  
</footer>

<!-- th:include 结果 -->
<div>  
    <script type="text/javascript" src="/plugins/jquery/jquery-3.0.2.js"></script>  
</div>
```

## 常用功能

### 时间格式化

```html
<!-- LocalDateTime 格式化 -->
<span th:text="${#temporals.format(localDateTime, 'yyyy-MM-dd HH:mm:ss')}"></span>

<!-- Date 格式化 -->
<span th:text="${#dates.format(date, 'yyyy-MM-dd HH:mm:ss')}"></span>
```

### 内联表达式

```html
<!-- JavaScript 内联 -->
<script th:inline="javascript">
    var username = /*[[${session.user.name}]]*/ 'Sebastian';
    var size = /*[[${#lists.size(products)}]]*/ 0;
</script>

<!-- CSS 内联 -->
<style th:inline="css">
    .[[${classname}]] {
        text-align: [[${align}]];
    }
</style>
```

### 资源路径处理

```html
<!-- 静态资源引用 -->
<link rel="stylesheet" th:href="@{/css/style.css}"/>
<script th:src="@{/js/script.js}"></script>
<img th:src="@{/images/logo.png}" alt="Logo"/>

<!-- 带参数的链接 -->
<a th:href="@{/user/profile(id=${user.id})}">Profile</a>

<!-- 绝对路径 -->
<a th:href="@{http://www.example.com/docs}">External Link</a>
```

### 下拉框选中状态

```html
<select name="dbId" class="form-control">
    <option th:each="item : ${options}" 
            th:selected="${#strings.contains(pageData.dbId, item.id)}" 
            th:value="${item.id}" 
            th:text="${item.name}">
        Default Option
    </option>
</select>
```

### 条件判断

```html
<!-- if 条件 -->
<div th:if="${user != null}">
    <span th:text="${user.name}">Username</span>
</div>

<!-- unless 条件（相当于 if not） -->
<div th:unless="${#lists.isEmpty(products)}">
    <span>Products exist</span>
</div>

<!-- switch 条件 -->
<div th:switch="${user.role}">
    <p th:case="'admin'">Administrator</p>
    <p th:case="'user'">Regular User</p>
    <p th:case="*">Unknown Role</p>
</div>
```

### 循环遍历

```html
<!-- 基本循环 -->
<tr th:each="product : ${products}">
    <td th:text="${product.name}">Product Name</td>
    <td th:text="${product.price}">Price</td>
</tr>

<!-- 带状态变量的循环 -->
<tr th:each="product, iterStat : ${products}" th:class="${iterStat.odd} ? 'odd' : 'even'">
    <td th:text="${iterStat.count}">序号</td>
    <td th:text="${product.name}">Product Name</td>
</tr>
```

### 表单处理

```html
<!-- 表单绑定 -->
<form th:action="@{/user/save}" th:object="${user}" method="post">
    <input type="text" th:field="*{name}" placeholder="姓名"/>
    <input type="email" th:field="*{email}" placeholder="邮箱"/>
    <button type="submit">保存</button>
</form>

<!-- 错误信息显示 -->
<div th:if="${#fields.hasErrors('name')}" th:errors="*{name}">Name Error</div>
```

### thymeleaf和shiro标签整合

1.添加依赖

```xml
<dependency>
    <groupId>com.github.theborakompanioni</groupId>
    <artifactId>thymeleaf-extras-shiro</artifactId>
    <version>
 </dependency>
```

2.在shiro的configuration中配置

```java
@Bean
public ShiroDialect shiroDialect() {
    return new ShiroDialect();
}
```

3.在html中加入xmlns

```html
<html lang\="zh\_CN" xmlns:th\="http://www.thymeleaf.org"
    xmlns:shiro\="http://www.pollix.at/thymeleaf/shiro"\>
</html>
```

4.示例

```html
<span shiro:authenticated="true">
      <span>欢迎您：<span th:text="${userInfo.realName}"></span></span>
</span>
```

## 常用工具对象

### 字符串工具 (#strings)
```html
<span th:text="${#strings.isEmpty(name)}">是否为空</span>
<span th:text="${#strings.contains(name,'hello')}">包含检查</span>
<span th:text="${#strings.startsWith(name,'Mr.')}">前缀检查</span>
```

### 数字工具 (#numbers)
```html
<span th:text="${#numbers.formatInteger(num,3)}">格式化整数</span>
<span th:text="${#numbers.formatDecimal(num,1,2)}">格式化小数</span>
```

### 集合工具 (#lists)
```html
<span th:text="${#lists.size(products)}">集合大小</span>
<span th:text="${#lists.isEmpty(products)}">是否为空</span>
```

### 日期工具 (#dates)
```html
<span th:text="${#dates.format(date)}">默认格式</span>
<span th:text="${#dates.format(date, 'yyyy-MM-dd')}">自定义格式</span>
```

## 最佳实践

1. **推荐使用 `th:replace` 而不是 `th:include`**（3.0+ 版本）
2. **合理组织 fragment**，提高代码复用性
3. **使用布局装饰器模式**构建复杂页面结构
4. **善用工具对象**进行数据处理
5. **注意 XSS 防护**，必要时使用 `th:utext`
6. **静态原型优先**，确保模板在无数据时也能正常显示

## 扩展资源

- **Spring Boot 集成：** https://spring.io/guides/gs/serving-web-content/
- **Thymeleaf Layout Dialect：** https://github.com/ultraq/thymeleaf-layout-dialect
- **官方示例项目：** https://github.com/thymeleaf/thymeleafexamples-layouts