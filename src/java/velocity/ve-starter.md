---
title: Velocity 入门指南
category:
  - java
  - 模版引擎
tag:
  - Velocity
---


# Velocity 入门指南

## 目录
1. [什么是Velocity](#什么是velocity)
2. [环境准备](#环境准备)
3. [基本语法](#基本语法)
4. [变量和引用](#变量和引用)
5. [指令](#指令)
6. [方法调用](#方法调用)
7. [宏定义](#宏定义)
8. [实际应用示例](#实际应用示例)
9. [最佳实践](#最佳实践)
10. [官方资源](#官方资源)

## 什么是Velocity

Velocity是Apache软件基金会开发的基于Java的模板引擎。它允许任何人使用简单而强大的模板语言来引用Java代码中定义的对象，从而实现模板与业务逻辑的分离。

### 主要特点
- **简单易学**：类似于HTML的语法，学习成本低
- **强大灵活**：支持条件判断、循环、方法调用等
- **性能优秀**：经过优化的解析引擎，执行效率高
- **广泛应用**：Web应用、代码生成、邮件模板等多个领域

## 环境准备

### Maven依赖
```xml
<dependency>
    <groupId>org.apache.velocity</groupId>
    <artifactId>velocity-engine-core</artifactId>
    <version>2.3</version>
</dependency>
```

### Gradle依赖
```gradle
implementation 'org.apache.velocity:velocity-engine-core:2.3'
```

### 基本配置
```java
// 初始化Velocity引擎
VelocityEngine velocityEngine = new VelocityEngine();
velocityEngine.setProperty(RuntimeConstants.RESOURCE_LOADER, "classpath");
velocityEngine.setProperty("classpath.resource.loader.class", 
    ClasspathResourceLoader.class.getName());
velocityEngine.init();
```

## 基本语法

Velocity模板语法基于VTL（Velocity Template Language），主要包含以下元素：

### 注释
```velocity
## 单行注释

#*
  多行注释
  可以跨越多行
*#

#**
 * 文档注释
 * 类似JavaDoc
 *#
```

### 引用类型
- **$reference** - 静默引用，值不存在时不显示
- **$!reference** - 安静引用，值不存在时显示空字符串
- **${reference}** - 正式引用，用于消除歧义

## 变量和引用

### 变量定义和使用
```velocity
## 设置变量
#set($name = "张三")
#set($age = 25)
#set($list = ["apple", "banana", "orange"])
#set($map = {"key1": "value1", "key2": "value2"})

## 使用变量
你好，$name！
您的年龄是：$age 岁

## 属性访问
用户姓名：$user.name
用户邮箱：$user.email
```

### 字符串操作
```velocity
## 字符串拼接
#set($fullName = "$firstName $lastName")

## 字符串方法调用
大写姓名：$name.toUpperCase()
姓名长度：$name.length()
```

## 指令

### #if 条件判断
```velocity
#if($user.age >= 18)
    您已成年，可以投票。
#elseif($user.age >= 16)
    您可以考驾照。
#else
    您还未成年。
#end
```

### #foreach 循环
```velocity
## 遍历列表
#foreach($item in $list)
    第 $velocityCount 个项目：$item
#end

## 遍历Map
#foreach($entry in $map.entrySet())
    键：$entry.key，值：$entry.value
#end

## 带条件的循环
#foreach($user in $users)
    #if($user.active)
        活跃用户：$user.name
    #end
#end
```

### #set 赋值
```velocity
## 简单赋值
#set($title = "欢迎页面")

## 条件赋值
#set($status = $user.isActive() ? "活跃" : "非活跃")

## 算术运算
#set($total = $price * $quantity)
```

### #include 和 #parse
```velocity
## 包含静态内容
#include("header.html")

## 解析Velocity模板
#parse("sidebar.vm")
```

### #macro 宏定义
```velocity
## 定义宏
#macro(tablerow $columns)
    <tr>
    #foreach($column in $columns)
        <td>$column</td>
    #end
    </tr>
#end

## 使用宏
#tablerow(["姓名", "年龄", "邮箱"])
```

## 方法调用

### 对象方法调用
```velocity
## 字符串方法
$name.substring(0, 3)
$name.toLowerCase()
$name.replace("a", "A")

## 集合方法
$list.size()
$list.isEmpty()
$list.get(0)

## 自定义对象方法
$user.getFormattedDate()
$product.calculateDiscount(0.1)
```

### 静态方法调用
```velocity
## 配置工具类后可调用静态方法
$Math.max(10, 20)
$StringUtils.isEmpty($value)
```

## 宏定义

### 简单宏
```velocity
#macro(sayHello $name)
    <h1>你好，$name！</h1>
#end

## 使用宏
#sayHello("小明")
```

### 带参数的宏
```velocity
#macro(createButton $text $url $class)
    <a href="$url" class="$class">$text</a>
#end

#createButton("点击我", "/home", "btn btn-primary")
```

### 宏库
```velocity
## 在velocimacro.vm中定义公共宏
#macro(formatDate $date)
    $date.toString("yyyy-MM-dd HH:mm:ss")
#end

#macro(pagination $currentPage $totalPages $baseUrl)
    <div class="pagination">
    #foreach($page in [1..$totalPages])
        #if($page == $currentPage)
            <span class="current">$page</span>
        #else
            <a href="$baseUrl?page=$page">$page</a>
        #end
    #end
    </div>
#end
```

## 实际应用示例

### HTML页面模板
```velocity
<!DOCTYPE html>
<html>
<head>
    <title>$pageTitle</title>
    <meta charset="UTF-8">
</head>
<body>
    <header>
        <h1>$siteTitle</h1>
        <nav>
            #foreach($menuItem in $menuItems)
                <a href="$menuItem.url">$menuItem.title</a>
            #end
        </nav>
    </header>
    
    <main>
        <h2>用户列表</h2>
        <table>
            <thead>
                <tr>
                    <th>姓名</th>
                    <th>邮箱</th>
                    <th>状态</th>
                </tr>
            </thead>
            <tbody>
                #foreach($user in $users)
                <tr>
                    <td>$user.name</td>
                    <td>$user.email</td>
                    <td>
                        #if($user.active)
                            <span class="active">活跃</span>
                        #else
                            <span class="inactive">非活跃</span>
                        #end
                    </td>
                </tr>
                #end
            </tbody>
        </table>
    </main>
</body>
</html>
```

### 邮件模板
```velocity
亲爱的 $user.name：

感谢您注册我们的服务！

您的账户信息：
- 用户名：$user.username
- 邮箱：$user.email
- 注册时间：$user.registrationDate

#if($user.hasSpecialOffer)
特别优惠：作为新用户，您可享受首月5折优惠！
优惠码：$user.promoCode
#end

如有任何问题，请联系客服。

祝好！
客服团队
```

### Java代码生成模板
```velocity
package $package;

#foreach($import in $imports)
import $import;
#end

/**
 * $classComment
 * @author $author
 * @date $date
 */
public class $className {

#foreach($field in $fields)
    private $field.type $field.name;
    
#end

#foreach($field in $fields)
    public $field.type get${field.capitalizedName}() {
        return $field.name;
    }
    
    public void set${field.capitalizedName}($field.type $field.name) {
        this.$field.name = $field.name;
    }
    
#end
}
```

## 最佳实践

### 1. 模板组织
- 将公共模板片段抽取到单独文件
- 使用有意义的文件名和目录结构
- 保持模板文件的简洁和可读性

### 2. 变量命名
```velocity
## 好的命名
$userName
$userList
$totalAmount

## 避免的命名
$u
$data
$temp
```

### 3. 条件判断
```velocity
## 安全的判断
#if($user && $user.name)
    用户姓名：$user.name
#end

## 使用安静引用避免空值显示
$!user.name
```

### 4. 性能优化
```velocity
## 避免在循环中进行复杂计算
#set($userCount = $users.size())
#foreach($user in $users)
    用户 $velocityCount / $userCount: $user.name
#end
```

### 5. 错误处理
```velocity
## 提供默认值
#set($title = $pageTitle || "默认标题")

## 检查集合是否为空
#if($users && $users.size() > 0)
    #foreach($user in $users)
        $user.name
    #end
#else
    暂无用户数据
#end
```

## 官方资源

- **官方网站**：https://velocity.apache.org/
- **官方文档**：https://velocity.apache.org/engine/devel/user-guide.html
- **API文档**：https://velocity.apache.org/engine/devel/apidocs/
- **GitHub仓库**：https://github.com/apache/velocity-engine
- **下载地址**：https://velocity.apache.org/download.cgi

### 相关工具
- **VelocityTools**：https://velocity.apache.org/tools/devel/
- **Maven插件**：https://www.mojohaus.org/velocity-maven-plugin/
- **IDE插件**：多数IDE都有Velocity语法高亮插件

---

通过这份入门教程，您应该能够开始使用Velocity模板引擎进行基本的模板开发。建议结合实际项目需求，逐步深入学习更高级的特性和技巧。