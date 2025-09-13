---
title: MongoDB 常用命令和语法
category:
  - 数据库
tag:
  - MongoDB
---

# MongoDB 常用命令和语法

## 目录

[[toc]]

## 1 启动与连接
### 1.1 启动 mongod（带认证）
```bash
# 读取配置文件并开启认证
./mongod --config /usr/local/mongodb-linux-x86_64-rhel62-3.6.5/etc/mongodb.conf --auth
```

### 1.2 进入命令行
```bash
mongo                       # 本地无认证登录
mongo -u root -p --authenticationDatabase admin   # 远程/带认证登录
```

---

## 2 用户管理
> 所有用户相关操作都需在 `admin` 数据库或有相应权限的库下进行。

### 2.1 开启用户认证（首次配置流程）
1. 修改配置文件 `mongodb.conf`，取消 `auth=true` 注释  
2. 重启服务  
3. 创建第一个 **管理员**（拥有 root 权限）  
```javascript
use admin
db.createUser({
  user: "root",
  pwd:  "root",
  roles: ["root"]
})
```
4. 认证并继续  
```javascript
db.auth("root", "root")   // 返回 1 表示成功
```

### 2.2 为业务库创建专属用户
```javascript
use runoob
db.createUser({
  user: "runoob",
  pwd:  "runoob",
  roles: [
    { role: "dbOwner", db: "runoob" }   // 3.0 以前写法
    // MongoDB 3.0+ 可直接写字符串
    // roles: ["readWrite", "dbAdmin"]
  ]
})
```

### 2.3 查看 / 删除用户
```javascript
// 查看所有用户
use admin
db.system.users.find().pretty()

// 删除指定用户
db.system.users.remove({ user: "java1" })
```

### 2.4 登录校验
```javascript
use runoob
db.auth("runoob", "runoob")   // 返回 1 即成功
```

---

## 3 常用 shell 命令速查
| 功能 | 命令 |
|---|---|
| 查看当前数据库 | `db` |
| 切换数据库 | `use <db>` |
| 查看所有库 | `show dbs` |
| 查看集合列表 | `show collections` 或 `db.getCollectionNames()` |
| 创建集合 | `db.createCollection("col")` |
| 插入文档 | `db.col.insert({name:"Mongo"})` |
| 查询文档 | `db.col.find().pretty()` |
| 更新文档 | `db.col.update({name:"Mongo"},{$set:{age:18}})` |
| 删除文档 | `db.col.remove({name:"Mongo"})` |
| 删除集合 | `db.col.drop()` |
| 删除数据库 | `db.dropDatabase()` |

---

## 4 配置文件示例（mongodb.conf）
```properties
# 数据目录
dbpath=/data/db
# 日志
logpath=/var/log/mongodb/mongod.log
# 后台运行
fork=true
# 监听地址
bind_ip=0.0.0.0
# 端口
port=27017
# 开启认证
auth=true
```

---

## 5 FAQ
**Q：忘记管理员密码怎么办？**  
A：临时关闭 `--auth` 参数重启 → 登录后修改用户密码 → 再次开启认证重启。

**Q：如何给用户追加角色？**  
A：
```javascript
use runoob
db.grantRolesToUser("runoob", [{ role: "read", db: "otherDB" }])
```
