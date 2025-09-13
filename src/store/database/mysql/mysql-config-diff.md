---
title: mysqld与mysql区分
category:
  - 数据库
tag:
  - MySQL
  - SQL
---

# MySQL 概念区分

## 目录

[[toc]]

在使用 MySQL 数据库系统时，经常会遇到一些容易混淆的概念和组件。本文档将帮助您清晰地区分这些重要概念。

## mysqld vs mysql

### mysqld（MySQL 服务器守护进程）

`mysqld` 是 MySQL 数据库管理系统的核心组件，具有以下特点：

- **性质**：服务器端守护进程或服务
- **作用**：MySQL 数据库服务器的核心引擎
- **职责**：
  - 处理客户端连接请求
  - 执行数据库操作和 SQL 语句
  - 管理数据存储和检索
  - 执行数据库服务器相关的所有任务
  - 维护数据库的完整性和安全性

### mysql（命令行客户端工具）

`mysql` 是用于与 MySQL 服务器交互的客户端工具，具有以下特点：

- **性质**：命令行客户端应用程序
- **作用**：连接和操作 MySQL 服务器的接口
- **功能**：
  - 连接到本地或远程 MySQL 服务器
  - 执行 SQL 语句和查询
  - 管理数据库、表和用户
  - 导入和导出数据
  - 执行数据库维护任务

### 关系说明

- `mysqld` 必须先启动运行，`mysql` 客户端才能连接到数据库服务器
- 一个 `mysqld` 服务器可以同时服务多个 `mysql` 客户端连接
- `mysql` 客户端可以连接到本地服务器，也可以通过网络连接到远程服务器

## 配置文件概念

### my.cnf 配置文件

`my.cnf` 是 MySQL 系统的主要配置文件：

- **用途**：存储 MySQL 服务器和客户端的配置参数
- **位置**：通常位于 `/etc/my.cnf`、`/etc/mysql/my.cnf` 或用户主目录
- **内容**：包含服务器启动参数、性能设置、安全配置等

### mysql.cnf 相关说明

关于 `mysql.cnf` 文件，需要注意：

- 在某些 MySQL 发行版中可能存在类似的配置文件
- 具体的配置文件名称和位置可能因操作系统和安装方式而异
- 建议查阅具体的 MySQL 文档以确认配置文件的标准命名

## 实际应用场景

### 启动 MySQL 服务
```bash
# 启动 mysqld 服务（服务器端）
sudo systemctl start mysqld
# 或
sudo service mysql start
```

### 连接数据库
```bash
# 使用 mysql 客户端连接（客户端）
mysql -u username -p
mysql -h hostname -u username -p database_name
```

### 检查服务状态
```bash
# 检查 mysqld 服务状态
sudo systemctl status mysqld
ps aux | grep mysqld
```

## com.mysql.jdbc.Driver 和 com.mysql.cj.jdbc.Driver 的区别以及设定 serverTimezone

### 驱动类区别（Connector/J 升级）
com.mysql.jdbc.Driver：适用于 mysql-connector-java 5.x

com.mysql.cj.jdbc.Driver：从 6.x（包含 8.x）版本开始使用

⚠️ 如果你使用的是新版驱动却仍写旧名称，会报错或触发警告：“Loading class 'com.mysql.jdbc.Driver' ... new driver class is 'com.mysql.cj.jdbc.Driver'.”

### 配置示例对比

```text
# connector‑java 5.x（旧项目兼容用法）
driverClassName=com.mysql.jdbc.Driver
url=jdbc:mysql://localhost:3306/test?useUnicode=true&characterEncoding=utf8&useSSL=false
username=root
password=

# connector‑java 6.x / 8.x（推荐方式）
driverClassName=com.mysql.cj.jdbc.Driver
url=jdbc:mysql://localhost:3306/test?serverTimezone=UTC&useUnicode=true&characterEncoding=utf8&useSSL=false
username=root
password=
```


