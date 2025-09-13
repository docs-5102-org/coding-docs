---
title: PHP 常见问题
category:
  - PHP
---

# PHP 常见问题解决方案

## 1. DedeCMS 后台登录后页面空白问题

### 问题现象
DedeCMS（织梦CMS）后台登录后显示一片空白，无任何错误提示。

### 解决方法一：启用错误报告定位问题

1. 找到 `include/common.inc.php` 文件，修改错误报告设置：
   ```php
   // 将这行注释掉
   //error_reporting(E_ALL);
   error_reporting(E_ALL || ~E_NOTICE);
   
   // 改为
   error_reporting(E_ALL);
   //error_reporting(E_ALL || ~E_NOTICE);
   ```

2. 保存后重新进入管理后台，查看具体错误提示

3. 根据错误提示修复对应文件（如 `data/config.cache.inc.php` 或 `plugins/run.php`）

4. 修复完成后将错误报告设置改回原状

### 解决方法二：修复 Session 相关问题

找到 `include/userlogin.class.php` 文件，将所有 `@session_register` 相关语句屏蔽：

```php
/* @session_register($this->keepUserIDTag); */
$_SESSION[$this->keepUserIDTag] = $this->userID;

/* @session_register($this->keepUserTypeTag); */
$_SESSION[$this->keepUserTypeTag] = $this->userType;

/* @session_register($this->keepUserChannelTag); */
$_SESSION[$this->keepUserChannelTag] = $this->userChannel;

/* @session_register($this->keepUserNameTag); */
$_SESSION[$this->keepUserNameTag] = $this->userName;

/* @session_register($this->keepUserPurviewTag); */
$_SESSION[$this->keepUserPurviewTag] = $this->userPurview;

/* @session_register($this->keepAdminStyleTag); */
$_SESSION[$this->keepAdminStyleTag] = $adminstyle;
```

## 2. DedeCMS 在 PHP7 环境下后台空白问题

### 问题原因
DedeCMS 在 PHP5 升级到 PHP7 后出现兼容性问题。

### 解决步骤

1. **修复语法错误**
   
   在 `include/common.func.php` 文件第49行左右，修改：
   ```php
   // 原代码
   if (isset($_helpers[$helpers]))
   {
       continue;  // 错误：continue 不能单独用在 if 语句中
   }
   
   // 修改为
   if (isset($_helpers[$helpers]))
   {
       return;  // 正确做法
   }
   ```

2. **修改数据库连接类型**
   
   在 `data/config.cache.inc.php` 文件中：
   ```php
   // 将
   $cfg_mysql_type = 'mysql'
   
   // 改为
   $cfg_mysql_type = 'mysqli'
   ```

## 3. PHP 扩展加载问题

### 问题：PHP Startup Unable to load dynamic library

**解决方法：**
在 `php.ini` 文件中正确设置扩展目录：
```ini
extension_dir = "D:\xampp\php\ext"
```
然后重启 Apache 服务。

## 4. PHP 错误日志配置

### 配置步骤

1. 打开 `php.ini` 配置文件

2. 关闭错误显示：
   ```ini
   display_errors = Off
   ```

3. 开启错误日志：
   ```ini
   log_errors = On
   ```

4. 设置错误日志路径：
   ```ini
   error_log = "\xampp\apache\logs\php_error.log"
   ```

5. 保存并重启 Apache

## 5. MySQL 相关问题

### 问题一：PHPMyAdmin 提示缺少 mysqli 扩展

**解决方法：**

1. 打开 `php.ini` 文件，启用 mysqli 扩展：
   ```ini
   extension=php_mysqli.dll  # 去掉前面的分号
   ```

2. 设置扩展目录：
   ```ini
   extension_dir = "e:\php\ext"  # 根据实际PHP安装路径调整
   ```

3. 重启 Apache 服务

### 问题二：Call to undefined function mysql_connect()

**问题原因：**
PHP7.0 开始废弃了 `mysql_connect()` 函数。

**解决方法：**
使用 `mysqli_connect()` 替代：

```php
// 旧写法（PHP7不支持）
$conn = mysql_connect("localhost", "root", "root");

// 新写法
$conn = mysqli_connect("localhost", "root", "root", "database_name");
```

### 问题三：PHPMyAdmin 登录提示 #1045 无法登录 MySQL 服务器

**解决步骤：**

1. 尝试使用空密码登录

2. 如果提示"空密码登录被禁止"，修改 PHPMyAdmin 配置：
   
   编辑 `/phpmyadmin/libraries/config.default.php` 文件：
   ```php
   $cfg['Servers'][$i]['nopassword'] = true;        // 改为 true
   $cfg['Servers'][$i]['AllowNoPassword'] = true;   // 改为 true
   $cfg['Servers'][$i]['password'] = '';            // 设置为空
   ```

3. 清除浏览器 cookie 或关闭登录窗口重新尝试

4. 成功登录后及时修改 MySQL 密码

## 6. 调试技巧

### 启用详细错误信息
在开发环境中临时启用详细错误显示：
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

### 使用 Xdebug 调试
安装并配置 Xdebug 扩展，可以进行断点调试，快速定位代码问题。

### 检查日志文件
- Apache 错误日志：`/var/log/apache2/error.log`（Linux）
- PHP 错误日志：根据 `php.ini` 中 `error_log` 设置的路径

## 注意事项

1. **版本兼容性**：升级 PHP 版本时注意检查代码兼容性
2. **备份重要文件**：修改配置文件前务必备份
3. **安全设置**：生产环境中应关闭错误显示，仅记录到日志文件
4. **及时更新**：使用最新版本的 CMS 和 PHP 扩展以获得更好的安全性和稳定性

---
