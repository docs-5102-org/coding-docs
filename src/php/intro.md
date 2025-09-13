---
title: PHP 入门教程
category:
  - PHP
---

# PHP 入门教程：从安装到实践

## 1. PHP 简介

PHP（PHP: Hypertext Preprocessor）是一种广泛使用的开源服务器端脚本语言，特别适合Web开发。它可以嵌入HTML中，语法简单易学，功能强大。

## 2. 环境安装

### 2.1 Windows 系统安装

#### 方法一：使用集成环境（推荐新手）

**XAMPP（推荐）**
- 下载地址：https://www.apachefriends.org/
- 包含：Apache、MySQL、PHP、phpMyAdmin
- 安装简单，一键启动

**WAMP**
- 下载地址：https://www.wampserver.com/
- 仅支持Windows系统
- 界面友好，管理方便

#### 方法二：独立安装
1. 下载 PHP：访问 https://www.php.net/downloads
2. 下载 Apache：https://httpd.apache.org/
3. 下载 MySQL：https://dev.mysql.com/downloads/

### 2.2 macOS 系统安装

#### 使用 Homebrew（推荐）
```bash
# 安装 Homebrew（如果未安装）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 PHP
brew install php

# 安装 Apache
brew install httpd

# 安装 MySQL
brew install mysql
```

#### 使用 MAMP
- 下载地址：https://www.mamp.info/
- 类似 XAMPP 的集成环境

### 2.3 Linux 系统安装

#### Ubuntu/Debian 系统
```bash
# 更新包管理器
sudo apt update

# 安装 PHP 和常用扩展
sudo apt install php php-cli php-mysql php-mbstring php-xml php-curl

# 安装 Apache
sudo apt install apache2

# 安装 MySQL
sudo apt install mysql-server
```

#### CentOS/RHEL 系统
```bash
# 安装 PHP
sudo yum install php php-mysql php-mbstring php-xml php-curl

# 安装 Apache
sudo yum install httpd

# 安装 MySQL
sudo yum install mysql-server
```

## 3. 环境配置

### 3.1 PHP 配置文件

PHP 的主要配置文件是 `php.ini`，常见位置：
- Windows: `C:\xampp\php\php.ini`
- macOS: `/usr/local/etc/php/8.x/php.ini`
- Linux: `/etc/php/8.x/apache2/php.ini`

#### 重要配置项
```ini
; 显示错误信息（开发环境）
display_errors = On
error_reporting = E_ALL

; 设置时区
date.timezone = Asia/Shanghai

; 文件上传限制
upload_max_filesize = 10M
post_max_size = 10M

; 内存限制
memory_limit = 256M

; 执行时间限制
max_execution_time = 300
```

### 3.2 Apache 配置

编辑 `httpd.conf` 文件：
```apache
# 启用 PHP 模块
LoadModule php_module modules/libphp.so

# 添加 PHP 文件类型
AddType application/x-httpd-php .php

# 设置默认首页
DirectoryIndex index.php index.html
```

### 3.3 测试安装

创建 `info.php` 文件：
```php
<?php
phpinfo();
?>
```

访问 `http://localhost/info.php` 查看 PHP 信息。

## 4. PHP 基础语法

### 4.1 PHP 标签
```php
<?php
// PHP 代码
echo "Hello, World!";
?>
```

### 4.2 变量和数据类型
```php
<?php
// 变量声明
$name = "张三";
$age = 25;
$height = 175.5;
$isStudent = true;

// 数组
$fruits = array("苹果", "香蕉", "橙子");
$colors = ["红色", "绿色", "蓝色"];

// 输出变量
echo "姓名：" . $name . "<br>";
echo "年龄：$age 岁<br>";
?>
```

### 4.3 条件语句
```php
<?php
$score = 85;

if ($score >= 90) {
    echo "优秀";
} elseif ($score >= 80) {
    echo "良好";
} elseif ($score >= 60) {
    echo "及格";
} else {
    echo "不及格";
}
?>
```

### 4.4 循环语句
```php
<?php
// for 循环
for ($i = 1; $i <= 5; $i++) {
    echo "数字：$i<br>";
}

// foreach 循环
$fruits = ["苹果", "香蕉", "橙子"];
foreach ($fruits as $fruit) {
    echo "水果：$fruit<br>";
}

// while 循环
$count = 1;
while ($count <= 3) {
    echo "计数：$count<br>";
    $count++;
}
?>
```

### 4.5 函数
```php
<?php
// 定义函数
function greet($name) {
    return "你好，" . $name . "！";
}

// 调用函数
echo greet("李四");

// 函数with默认参数
function introduce($name, $age = 18) {
    echo "我叫$name，今年$age岁。";
}

introduce("王五", 25);
introduce("赵六"); // 使用默认年龄
?>
```

## 5. 表单处理

### 5.1 HTML 表单
```html
<!DOCTYPE html>
<html>
<head>
    <title>用户注册</title>
</head>
<body>
    <form method="POST" action="register.php">
        <p>
            <label>姓名：</label>
            <input type="text" name="name" required>
        </p>
        <p>
            <label>邮箱：</label>
            <input type="email" name="email" required>
        </p>
        <p>
            <label>年龄：</label>
            <input type="number" name="age">
        </p>
        <button type="submit">注册</button>
    </form>
</body>
</html>
```

### 5.2 处理表单数据
```php
<?php
// register.php
if ($_POST) {
    $name = $_POST['name'];
    $email = $_POST['email'];
    $age = $_POST['age'];
    
    // 基本验证
    if (empty($name)) {
        echo "姓名不能为空！";
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo "邮箱格式不正确！";
        exit;
    }
    
    echo "注册成功！<br>";
    echo "姓名：$name<br>";
    echo "邮箱：$email<br>";
    echo "年龄：$age<br>";
}
?>
```

## 6. 数据库操作（MySQL）

### 6.1 连接数据库
```php
<?php
$host = 'localhost';
$username = 'root';
$password = '';
$database = 'test';

// 使用 MySQLi
$conn = new mysqli($host, $username, $password, $database);

// 检查连接
if ($conn->connect_error) {
    die("连接失败：" . $conn->connect_error);
}
echo "连接成功！";

// 设置字符集
$conn->set_charset("utf8");
?>
```

### 6.2 创建数据表
```php
<?php
$sql = "CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($sql) === TRUE) {
    echo "数据表创建成功";
} else {
    echo "错误：" . $conn->error;
}
?>
```

### 6.3 插入数据
```php
<?php
$name = "张三";
$email = "zhangsan@example.com";

$sql = "INSERT INTO users (name, email) VALUES ('$name', '$email')";

if ($conn->query($sql) === TRUE) {
    echo "新记录插入成功";
} else {
    echo "错误：" . $conn->error;
}
?>
```

### 6.4 查询数据
```php
<?php
$sql = "SELECT id, name, email FROM users";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        echo "ID: " . $row["id"]. " - 姓名: " . $row["name"]. " - 邮箱: " . $row["email"]. "<br>";
    }
} else {
    echo "0 个结果";
}
?>
```

## 7. 常用功能示例

### 7.1 文件上传
```php
<?php
if ($_FILES["upload"]["error"] == 0) {
    $target_dir = "uploads/";
    $target_file = $target_dir . basename($_FILES["upload"]["name"]);
    
    if (move_uploaded_file($_FILES["upload"]["tmp_name"], $target_file)) {
        echo "文件上传成功！";
    } else {
        echo "文件上传失败！";
    }
}
?>
```

### 7.2 Session 管理
```php
<?php
session_start();

// 设置 session
$_SESSION["username"] = "张三";
$_SESSION["login_time"] = date("Y-m-d H:i:s");

// 获取 session
if (isset($_SESSION["username"])) {
    echo "欢迎，" . $_SESSION["username"];
}

// 销毁 session
// session_destroy();
?>
```

## 8. 学习资源

### 8.1 官方资源
- **PHP 官网**：https://www.php.net/
- **PHP 官方文档**：https://www.php.net/docs.php
- **PHP 官方教程**：https://www.php.net/manual/zh/tutorial.php

### 8.2 第三方教程网站

#### 中文教程
- **菜鸟教程 PHP**：https://www.runoob.com/php/
- **W3School PHP**：https://www.w3school.com.cn/php/
- **PHP 中文网**：https://www.php.cn/
- **慕课网 PHP 课程**：https://www.imooc.com/course/list?c=php

#### 英文教程
- **PHP: The Right Way**：https://phptherightway.com/
- **Codecademy PHP**：https://www.codecademy.com/learn/learn-php
- **freeCodeCamp PHP**：https://www.freecodecamp.org/
- **PHP Tutorial - Tutorialspoint**：https://www.tutorialspoint.com/php/

### 8.3 实践平台
- **LeetCode**：https://leetcode-cn.com/ （编程练习）
- **HackerRank**：https://www.hackerrank.com/domains/php
- **Codewars**：https://www.codewars.com/ （编程挑战）

### 8.4 开发工具推荐
- **Visual Studio Code**：免费，插件丰富
- **PHPStorm**：专业 PHP IDE
- **Sublime Text**：轻量级编辑器
- **Atom**：开源编辑器

## 9. 最佳实践

### 9.1 安全建议
```php
<?php
// 1. 防止 SQL 注入
$stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();

// 2. 验证和过滤输入
$name = filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING);
$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

// 3. 转义输出
echo htmlspecialchars($user_input, ENT_QUOTES, 'UTF-8');
?>
```

### 9.2 代码规范
- 使用有意义的变量名
- 添加适当的注释
- 保持代码缩进一致
- 遵循 PSR 标准

## 10. 下一步学习方向

1. **深入学习面向对象编程**
2. **学习现代 PHP 框架**（Laravel、Symfony）
3. **掌握 Composer 包管理器**
4. **学习 API 开发和 RESTful 设计**
5. **了解缓存技术**（Redis、Memcached）
6. **学习测试驱动开发**

## 总结

这份教程涵盖了 PHP 的基础知识，从环境搭建到基本语法，再到数据库操作。建议初学者按照教程逐步练习，多动手编写代码。记住，编程是一门实践性很强的技能，只有通过不断练习才能真正掌握。

祝你学习愉快！