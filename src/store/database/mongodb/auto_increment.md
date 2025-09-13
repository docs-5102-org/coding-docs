---
title: MongoDb 自增ID实现
category:
  - 数据库
tag:
  - MongoDB
---

# MongoDb 自增ID实现

## ✅ 方法一：使用 `counters` 集合实现自增 ID（官方推荐）

这是最经典、最稳定的方式，利用一个专门的集合来存储每个集合的当前最大 ID 值。

### 🔧 实现步骤：

1. 创建一个 `counters` 集合，用于保存每个集合的当前最大 ID。
2. 每次插入新文档前，先查询并更新 `counters` 中的值。
3. 使用事务或原子操作确保并发安全。

### 📦 示例代码（Node.js + MongoDB 驱动）

```javascript
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function getNextSequence(name) {
  const db = client.db('testdb');
  const counters = db.collection('counters');
  const result = await counters.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result.value.seq;
}

async function insertUser(user) {
  const db = client.db('testdb');
  const users = db.collection('users');
  const id = await getNextSequence('userid');
  user._id = id;
  await users.insertOne(user);
  console.log('Inserted user with _id:', id);
}

async function run() {
  await client.connect();
  await insertUser({ name: 'Alice', age: 30 });
  await client.close();
}

run();
```

### 📦 示例代码（Python + PyMongo）

```python
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017')
db = client['testdb']

def get_next_sequence(name):
    result = db.counters.find_one_and_update(
        {'_id': name},
        {'$inc': {'seq': 1}},
        upsert=True,
        return_document=True
    )
    return result['seq']

def insert_user(user):
    user['_id'] = get_next_sequence('userid')
    db.users.insert_one(user)
    print('Inserted user with _id:', user['_id'])

insert_user({'name': 'Alice', 'age': 30})
```

---

## ✅ 方法二：使用 MongoDB 事务 + 乐观锁（适合高并发）

如果你担心并发冲突，可以使用事务来包裹 `findOneAndUpdate` 和 `insertOne`，确保原子性。

---

## ✅ 方法三：使用 UUID 或 ObjectId（不推荐自增）

MongoDB 默认使用 `ObjectId` 作为主键，它是全局唯一的。如果你不需要“连续”的自增 ID，建议直接用 `ObjectId`，性能更好，分布式也更安全。

---

## ✅ 方法四：使用第三方库（如 `mongoose-auto-increment`）

如果你用 Node.js + Mongoose，可以用 [`mongoose-auto-increment`](https://www.npmjs.com/package/mongoose-auto-increment) 插件：

```bash
npm install mongoose-auto-increment
```

```javascript
const autoIncrement = require('mongoose-auto-increment');
autoIncrement.initialize(mongoose.connection);

const userSchema = new mongoose.Schema({ name: String });
userSchema.plugin(autoIncrement.plugin, { model: 'User', field: '_id' });

const User = mongoose.model('User', userSchema);
```

---

## ✅ 总结对比

| 方法 | 是否连续 | 是否线程安全 | 是否分布式友好 | 适用场景 |
|------|-----------|----------------|------------------|----------|
| counters 集合 | ✅ | ✅（需事务） | ❌（需集中管理） | 单机/小并发 |
| ObjectId | ❌ | ✅ | ✅ | 推荐默认 |
| UUID | ❌ | ✅ | ✅ | 分布式系统 |
| auto-increment 插件 | ✅ | ✅ | ❌ | Node.js + Mongoose |

---

## ✅ 推荐方案

- **开发测试/小项目**：用 `counters` 集合。
- **生产环境/分布式系统**：用 `ObjectId` 或 UUID。
- **Node.js + Mongoose**：用 `mongoose-auto-increment`。

