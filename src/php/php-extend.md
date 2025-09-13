---
title: PHP扩展插件配置教程
category:
  - PHP
---

# PHP扩展插件配置教程 - Memcached与Redis安装

本教程将详细介绍如何在不同操作系统上安装和配置PHP的Memcached和Redis扩展插件。

## 目录

[[toc]]

## 环境准备

### 系统要求

- PHP 7.4+ (推荐PHP 8.0+)
- 操作系统: Linux (Ubuntu/CentOS)、macOS、Windows
- 管理员权限

### 检查当前PHP版本

```bash
php -v
```

### 检查已安装的扩展

```bash
php -m
```

## Memcached扩展安装

### Ubuntu/Debian系统

#### 1. 安装Memcached服务

```bash
# 更新包列表
sudo apt update

# 安装Memcached服务
sudo apt install memcached

# 安装libmemcached开发库
sudo apt install libmemcached-dev zlib1g-dev
```

#### 2. 安装PHP Memcached扩展

**方法一：使用apt包管理器（推荐）**

```bash
# 安装PHP Memcached扩展
sudo apt install php-memcached

# 重启Apache/Nginx
sudo systemctl restart apache2
# 或
sudo systemctl restart nginx
sudo systemctl restart php7.4-fpm  # 根据你的PHP版本调整
```

**方法二：使用PECL编译安装**

```bash
# 安装编译工具
sudo apt install php-dev php-pear

# 通过PECL安装
sudo pecl install memcached

# 添加扩展到php.ini
echo "extension=memcached.so" | sudo tee -a /etc/php/8.0/apache2/php.ini
echo "extension=memcached.so" | sudo tee -a /etc/php/8.0/cli/php.ini
```

### CentOS/RHEL系统

#### 1. 安装Memcached服务

```bash
# 安装EPEL仓库
sudo yum install epel-release

# 安装Memcached
sudo yum install memcached libmemcached-devel

# 启动并设置开机自启
sudo systemctl start memcached
sudo systemctl enable memcached
```

#### 2. 安装PHP扩展

```bash
# 安装开发工具
sudo yum install php-devel php-pear gcc gcc-c++

# 安装扩展
sudo pecl install memcached

# 配置php.ini
echo "extension=memcached.so" | sudo tee -a /etc/php.ini
```

### macOS系统

#### 使用Homebrew

```bash
# 安装Memcached服务
brew install memcached

# 启动Memcached
brew services start memcached

# 安装PHP扩展
brew install php-memcached

# 或者使用PECL
sudo pecl install memcached
```

### Windows系统

#### 1. 下载预编译DLL

1. 访问 [PECL官网](https://pecl.php.net/package/memcached)
2. 下载对应PHP版本的DLL文件
3. 将DLL文件放到PHP的`ext`目录

#### 2. 配置php.ini

```ini
extension=php_memcached.dll
```

#### 3. 安装Memcached服务

下载并安装Windows版本的Memcached服务。

## Redis扩展安装

### Ubuntu/Debian系统

#### 1. 安装Redis服务

```bash
# 安装Redis
sudo apt install redis-server

# 启动Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### 2. 安装PHP Redis扩展

**方法一：使用包管理器**

```bash
sudo apt install php-redis
```

**方法二：使用PECL**

```bash
sudo pecl install redis

# 添加到php.ini
echo "extension=redis.so" | sudo tee -a /etc/php/8.0/apache2/php.ini
echo "extension=redis.so" | sudo tee -a /etc/php/8.0/cli/php.ini
```

### CentOS/RHEL系统

#### 1. 安装Redis服务

```bash
# 安装Redis
sudo yum install redis

# 启动服务
sudo systemctl start redis
sudo systemctl enable redis
```

#### 2. 安装PHP扩展

```bash
# 使用PECL安装
sudo pecl install redis

# 配置php.ini
echo "extension=redis.so" | sudo tee -a /etc/php.ini
```

### macOS系统

```bash
# 安装Redis服务
brew install redis

# 启动Redis
brew services start redis

# 安装PHP Redis扩展
brew install php-redis

# 或使用PECL
sudo pecl install redis
```

### Windows系统

#### 1. 下载Redis

从 [Redis官网](https://redis.io/download) 下载Windows版本或使用WSL。

#### 2. 安装PHP扩展

1. 下载对应版本的`php_redis.dll`
2. 放置到PHP的`ext`目录
3. 在`php.ini`中添加：

```ini
extension=php_redis.dll
```

## 配置验证

### 1. 检查扩展是否安装成功

```bash
# 检查Memcached扩展
php -m | grep memcached

# 检查Redis扩展
php -m | grep redis
```

### 2. 创建测试脚本

创建 `test_extensions.php` 文件：

```php
<?php
echo "<h2>PHP扩展检查</h2>";

// 检查Memcached
if (extension_loaded('memcached')) {
    echo "✅ Memcached扩展已安装<br>";
    echo "版本: " . phpversion('memcached') . "<br>";
} else {
    echo "❌ Memcached扩展未安装<br>";
}

// 检查Redis
if (extension_loaded('redis')) {
    echo "✅ Redis扩展已安装<br>";
    echo "版本: " . phpversion('redis') . "<br>";
} else {
    echo "❌ Redis扩展未安装<br>";
}

// 服务连接测试
echo "<h3>服务连接测试</h3>";

// 测试Memcached连接
if (extension_loaded('memcached')) {
    try {
        $memcached = new Memcached();
        $memcached->addServer('localhost', 11211);
        $memcached->set('test_key', 'test_value', 60);
        $value = $memcached->get('test_key');
        if ($value === 'test_value') {
            echo "✅ Memcached服务连接正常<br>";
        } else {
            echo "❌ Memcached服务连接失败<br>";
        }
    } catch (Exception $e) {
        echo "❌ Memcached连接错误: " . $e->getMessage() . "<br>";
    }
}

// 测试Redis连接
if (extension_loaded('redis')) {
    try {
        $redis = new Redis();
        $redis->connect('localhost', 6379);
        $redis->set('test_key', 'test_value');
        $value = $redis->get('test_key');
        if ($value === 'test_value') {
            echo "✅ Redis服务连接正常<br>";
        } else {
            echo "❌ Redis服务连接失败<br>";
        }
        $redis->close();
    } catch (Exception $e) {
        echo "❌ Redis连接错误: " . $e->getMessage() . "<br>";
    }
}
?>
```

运行测试：

```bash
php test_extensions.php
```

## 常见问题解决

### Memcached相关问题

#### 问题1：编译错误 - 找不到libmemcached

**解决方案：**

```bash
# Ubuntu/Debian
sudo apt install libmemcached-dev

# CentOS/RHEL
sudo yum install libmemcached-devel
```

#### 问题2：Memcached服务无法启动

**解决方案：**

```bash
# 检查服务状态
sudo systemctl status memcached

# 检查配置文件
sudo nano /etc/memcached.conf

# 重启服务
sudo systemctl restart memcached
```

### Redis相关问题

#### 问题1：Redis连接被拒绝

**解决方案：**

```bash
# 检查Redis是否运行
redis-cli ping

# 检查防火墙设置
sudo ufw allow 6379

# 检查Redis配置
sudo nano /etc/redis/redis.conf
```

#### 问题2：PHP Redis扩展加载失败

**解决方案：**

```bash
# 检查扩展文件是否存在
ls -la /usr/lib/php/*/redis.so

# 检查php.ini配置
php --ini

# 重启Web服务器
sudo systemctl restart apache2
```

### 通用问题

#### 问题1：权限问题

**解决方案：**

```bash
# 修改PHP扩展目录权限
sudo chown -R www-data:www-data /usr/lib/php/
sudo chmod -R 755 /usr/lib/php/
```

#### 问题2：PHP版本不匹配

**解决方案：**

确保扩展版本与PHP版本匹配，重新编译或下载正确版本的扩展。

## 使用示例

### Memcached使用示例

```php
<?php
// 创建Memcached实例
$memcached = new Memcached();

// 添加服务器
$memcached->addServer('localhost', 11211);

// 设置数据
$memcached->set('user:1', ['name' => 'John', 'email' => 'john@example.com'], 3600);

// 获取数据
$user = $memcached->get('user:1');
print_r($user);

// 删除数据
$memcached->delete('user:1');

// 批量操作
$memcached->setMulti([
    'key1' => 'value1',
    'key2' => 'value2'
], 3600);

$values = $memcached->getMulti(['key1', 'key2']);
print_r($values);
?>
```

### Redis使用示例

```php
<?php
// 创建Redis连接
$redis = new Redis();
$redis->connect('localhost', 6379);

// 字符串操作
$redis->set('name', 'John Doe');
echo $redis->get('name'); // 输出: John Doe

// 设置过期时间
$redis->setex('session:123', 3600, 'session_data');

// 列表操作
$redis->lpush('messages', 'Hello');
$redis->lpush('messages', 'World');
$messages = $redis->lrange('messages', 0, -1);
print_r($messages);

// 哈希操作
$redis->hset('user:1', 'name', 'John');
$redis->hset('user:1', 'email', 'john@example.com');
$user = $redis->hgetall('user:1');
print_r($user);

// 集合操作
$redis->sadd('tags', 'php', 'redis', 'memcached');
$tags = $redis->smembers('tags');
print_r($tags);

// 关闭连接
$redis->close();
?>
```

## 性能优化建议

### Memcached优化

```ini
# php.ini 配置优化
memcached.use_sasl = Off
memcached.compression_type = fastlz
memcached.compression_factor = 1.3
memcached.compression_threshold = 2000
```

### Redis优化

```ini
# php.ini 配置
redis.arrays.autorehash = 1
redis.arrays.connecttimeout = 5
redis.arrays.lazyconnect = 1
```

## 监控和维护

### Memcached监控

```bash
# 查看Memcached状态
echo "stats" | nc localhost 11211

# 查看内存使用
memcached-tool localhost:11211 stats
```

### Redis监控

```bash
# Redis信息
redis-cli info

# 监控Redis命令
redis-cli monitor

# 查看慢查询
redis-cli slowlog get 10
```

## 参考资料


https://tecadmin.net/install-php7-on-centos7/

https://www.cnblogs.com/lihailin9073/p/11145432.html

## 总结

本教程详细介绍了PHP Memcached和Redis扩展的安装配置过程。正确安装这些扩展可以显著提升应用性能，特别是在缓存和会话管理方面。

建议在生产环境中：
- 定期监控缓存服务状态
- 设置合适的内存限制和过期策略  
- 实施备份和故障转移机制
- 进行性能基准测试

通过遵循本教程的步骤，您应该能够成功在您的系统上安装和配置这些重要的PHP扩展。