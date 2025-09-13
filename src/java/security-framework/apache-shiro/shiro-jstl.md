---
title: Shiro 中 JSTL 标签应用详解
category:
  - Java 安全认证框架
tag:
  - Shiro  
---

# Shiro 中 JSTL 标签应用详解

Apache Shiro 提供了丰富的 JSTL 标签用于在 JSP/GSP 页面进行权限控制，可以根据用户的登录状态、角色和权限来显示不同的页面内容和按钮。

## 官方资源

- **Apache Shiro 官网**: https://shiro.apache.org/
- **标签文档**: https://shiro.apache.org/web.html#Web-taglibrary
- **参考教程**: https://www.iteye.com/blog/jinnianshilongnian-2026398

## 1. 标签库导入

在使用 Shiro 标签之前，需要先导入标签库：

```jsp
<%@taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
```

标签库定义在 `shiro-web.jar` 包下的 `META-INF/shiro.tld` 中。

## 2. 认证状态标签

### guest 标签
用于显示游客（未登录用户）相关信息：

```jsp
<shiro:guest>
    欢迎游客访问，<a href="${pageContext.request.contextPath}/login.jsp">登录</a>
</shiro:guest>
```

**使用场景**：当用户没有进行身份验证时显示登录链接或游客提示信息。

### user 标签
用于显示已登录用户（包括记住我登录）的相关信息：

```jsp
<shiro:user>
    欢迎[<shiro:principal/>]登录，
    <a href="${pageContext.request.contextPath}/logout">退出</a>
</shiro:user>
```

**使用场景**：用户已经身份验证或通过"记住我"功能登录后显示用户信息和退出链接。

### authenticated 标签
仅对通过 `Subject.login()` 登录成功的用户显示内容（不包括记住我登录）：

```jsp
<shiro:authenticated>
    用户[<shiro:principal/>]已身份验证通过
</shiro:authenticated>
```

**使用场景**：需要区分真正登录和记住我登录的场景，如敏感操作提示。

### notAuthenticated 标签
对未进行身份验证的用户（包括记住我登录）显示内容：

```jsp
<shiro:notAuthenticated>
    未身份验证（包括记住我），请<a href="/login">登录</a>
</shiro:notAuthenticated>
```

**使用场景**：提示用户进行完整的身份验证。

## 3. 用户信息标签

### principal 标签
显示用户身份信息，提供多种获取方式：

#### 基本用法
```jsp
<shiro:principal/>
```
默认调用 `Subject.getPrincipal()` 获取 Primary Principal。

#### 指定类型
```jsp
<shiro:principal type="java.lang.String"/>
```
相当于 `Subject.getPrincipals().oneByType(String.class)`。

#### 获取属性
```jsp
<shiro:principal property="username"/>
```
相当于 `((User)Subject.getPrincipals()).getUsername()`。

**实际应用示例**：
```jsp
<div class="user-info">
    <span>当前用户：<shiro:principal property="username"/></span>
    <span>邮箱：<shiro:principal property="email"/></span>
</div>
```

## 4. 角色控制标签

### hasRole 标签
检查用户是否拥有指定角色：

```jsp
<shiro:hasRole name="admin">
    用户[<shiro:principal/>]拥有角色 admin
    <button onclick="adminFunction()">管理员操作</button>
</shiro:hasRole>
```

### hasAnyRoles 标签
检查用户是否拥有任意一个指定角色（OR 关系）：

```jsp
<shiro:hasAnyRoles name="admin,manager">
    用户[<shiro:principal/>]拥有角色 admin 或 manager
    <a href="/management">进入管理界面</a>
</shiro:hasAnyRoles>
```

### lacksRole 标签
检查用户是否缺少指定角色：

```jsp
<shiro:lacksRole name="admin">
    用户[<shiro:principal/>]没有角色 admin，权限不足
</shiro:lacksRole>
```

## 5. 权限控制标签

### hasPermission 标签
检查用户是否拥有指定权限：

```jsp
<shiro:hasPermission name="user:create">
    <button onclick="createUser()">创建用户</button>
</shiro:hasPermission>

<shiro:hasPermission name="order:delete">
    <button onclick="deleteOrder()" class="btn-danger">删除订单</button>
</shiro:hasPermission>
```

### lacksPermission 标签
检查用户是否缺少指定权限：

```jsp
<shiro:lacksPermission name="org:create">
    <span class="text-muted">您没有创建组织的权限</span>
</shiro:lacksPermission>
```

## 6. 自定义扩展标签

Shiro 还支持自定义标签来实现更复杂的权限控制逻辑。

### 导入自定义标签库
```jsp
<%@taglib prefix="zhang" tagdir="/WEB-INF/tags" %>
```

### 扩展标签示例

#### hasAllRoles 标签
检查用户是否拥有所有指定角色（AND 关系）：

```jsp
<zhang:hasAllRoles name="admin,user">
    用户[<shiro:principal/>]同时拥有角色 admin 和 user
</zhang:hasAllRoles>
```

#### hasAllPermissions 标签
检查用户是否拥有所有指定权限：

```jsp
<zhang:hasAllPermissions name="user:create,user:update">
    <div class="user-operations">
        <button onclick="createUser()">创建用户</button>
        <button onclick="updateUser()">更新用户</button>
    </div>
</zhang:hasAllPermissions>
```

#### hasAnyPermissions 标签
检查用户是否拥有任意一个指定权限：

```jsp
<zhang:hasAnyPermissions name="user:create,user:view">
    <a href="/users">用户管理</a>
</zhang:hasAnyPermissions>
```

## 7. 实际应用场景

### 导航菜单控制
```jsp
<ul class="nav-menu">
    <shiro:hasPermission name="dashboard:view">
        <li><a href="/dashboard">仪表盘</a></li>
    </shiro:hasPermission>
    
    <shiro:hasRole name="admin">
        <li><a href="/admin">系统管理</a></li>
    </shiro:hasRole>
    
    <shiro:hasAnyRoles name="manager,supervisor">
        <li><a href="/reports">报表中心</a></li>
    </shiro:hasAnyRoles>
</ul>
```

### 操作按钮控制
```jsp
<div class="action-buttons">
    <shiro:hasPermission name="article:create">
        <button class="btn btn-primary" onclick="createArticle()">新建文章</button>
    </shiro:hasPermission>
    
    <shiro:hasPermission name="article:edit">
        <button class="btn btn-warning" onclick="editArticle()">编辑</button>
    </shiro:hasPermission>
    
    <shiro:hasPermission name="article:delete">
        <button class="btn btn-danger" onclick="deleteArticle()">删除</button>
    </shiro:hasPermission>
</div>
```

### 用户状态显示
```jsp
<div class="header-user">
    <shiro:guest>
        <a href="/login">登录</a> | <a href="/register">注册</a>
    </shiro:guest>
    
    <shiro:user>
        欢迎，<shiro:principal property="nickname"/>
        <shiro:authenticated>
            <span class="badge">已认证</span>
        </shiro:authenticated>
        <a href="/logout">退出</a>
    </shiro:user>
</div>
```

## 8. 最佳实践

### 1. 合理使用标签嵌套
```jsp
<shiro:user>
    <div class="user-panel">
        <h3>欢迎，<shiro:principal property="username"/></h3>
        
        <shiro:hasRole name="admin">
            <div class="admin-section">
                <h4>管理员功能</h4>
                <shiro:hasPermission name="system:config">
                    <button>系统配置</button>
                </shiro:hasPermission>
            </div>
        </shiro:hasRole>
    </div>
</shiro:user>
```

### 2. 结合 CSS 样式
```jsp
<style>
.restricted { opacity: 0.5; cursor: not-allowed; }
.admin-only { border-left: 3px solid #007bff; }
</style>

<shiro:lacksPermission name="user:delete">
    <button class="btn restricted" disabled>删除用户</button>
</shiro:lacksPermission>

<shiro:hasRole name="admin">
    <div class="admin-panel admin-only">
        <h3>管理员控制面板</h3>
    </div>
</shiro:hasRole>
```

### 3. 错误处理和友好提示
```jsp
<div class="feature-section">
    <shiro:hasPermission name="premium:feature">
        <div class="premium-content">
            <!-- 高级功能内容 -->
        </div>
    </shiro:hasPermission>
    
    <shiro:lacksPermission name="premium:feature">
        <div class="upgrade-prompt">
            <p>此功能需要高级权限</p>
            <a href="/upgrade" class="btn btn-primary">升级账户</a>
        </div>
    </shiro:lacksPermission>
</div>
```

## 9. 注意事项

1. **性能考虑**：标签会进行权限检查，在页面元素较多时要注意性能影响
2. **安全性**：前端权限控制只能作为用户体验优化，真正的安全检查必须在后端进行
3. **缓存策略**：合理配置 Shiro 的缓存机制，避免频繁的权限查询
4. **标签嵌套**：避免过深的标签嵌套，保持代码的可读性

## 10. 扩展阅读

- [Apache Shiro 官方文档](https://shiro.apache.org/documentation.html)
- [Shiro Web 支持文档](https://shiro.apache.org/web.html)
- [简单 Shiro 扩展实现 NOT、AND、OR 权限验证](https://www.iteye.com/blog/jinnianshilongnian-1864800)
