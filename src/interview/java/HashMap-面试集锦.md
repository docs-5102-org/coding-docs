# HashMap 常见面试题详解

## 1. 当两个对象的hashcode相同会发生什么？

```
这叫做"哈希碰撞"或"哈希冲突"

发生过程:
┌─────────────────────────────────┐
│ key1.hashCode() = 100           │
│ key2.hashCode() = 100  (相同!)  │
└─────────────────────────────────┘
         ↓
计算数组索引: hash % 数组长度
         ↓
┌─────┬──────────────────┐
│ 5   │ [key1,v1]        │  两个key都定位到索引5
│     │      ↓           │
│     │ [key2,v2]        │  形成链表或红黑树
└─────┴──────────────────┘
```

**处理方式**：
- **JDK 1.8之前**：拉链法（链表）
- **JDK 1.8之后**：链表长度 ≤ 8 用链表，> 8 转红黑树

**关键点**：
- hashCode相同 ≠ 对象相同
- 还需要通过 `equals()` 方法判断key是否真正相等

---

## 2. 如果两个键的hashcode相同，如何获取值对象？

```java
// 获取流程示例
HashMap<Key, Value> map = new HashMap<>();

// 假设 key1 和 key2 的 hashCode 相同
map.put(key1, value1);
map.put(key2, value2);

Value v = map.get(key1);  // 如何找到正确的value?
```

**查找过程**：

```
步骤1: 计算hashCode
  key1.hashCode() → 定位到数组索引

步骤2: 遍历该位置的链表/红黑树
  ┌────────────┐
  │ Node1      │  hash相同? ✓  equals(key1)? ✗
  │ key != key1│
  └─────↓──────┘
  ┌────────────┐
  │ Node2      │  hash相同? ✓  equals(key1)? ✓  找到了!
  │ key == key1│
  └────────────┘
  返回 Node2.value

步骤3: 通过equals()精确匹配
  - 先比较 hash 值（快速过滤）
  - 再用 equals() 精确判断
  - 找到匹配的key，返回对应value
```

**核心代码逻辑**：
```java
// HashMap内部查找逻辑简化版
if (node.hash == hash && 
    (node.key == key || key.equals(node.key))) {
    return node.value;  // 找到了
}
```

**关键点**：
- **hashCode** 用于快速定位
- **equals** 用于精确匹配
- 必须同时重写 `hashCode()` 和 `equals()`

---

## 3. 可以用ConcurrentHashMap代替Hashtable吗？

**答案：可以，而且强烈推荐！**

### 对比表格

| 特性 | Hashtable | ConcurrentHashMap |
|------|-----------|-------------------|
| 线程安全 | ✓ | ✓ |
| 锁机制 | 整表锁（synchronized方法） | 分段锁/CAS（JDK 1.8+） |
| 并发度 | 低（同时只有1个线程操作） | 高（多个线程可同时操作不同段） |
| null支持 | key和value都不允许null | key和value都不允许null |
| 性能 | 差 | 好 |
| 推荐使用 | ✗ 已过时 | ✓ 推荐 |

### 锁机制对比

```
Hashtable - 整表锁:
┌─────────────────────┐
│   synchronized      │  所有操作都锁整个表
│  ┌───┬───┬───┬───┐ │  线程1操作时,线程2必须等待
│  │ 0 │ 1 │ 2 │ 3 │ │
│  └───┴───┴───┴───┘ │
└─────────────────────┘


ConcurrentHashMap - 分段锁(JDK 1.7):
┌─────┬─────┬─────┬─────┐
│Seg0 │Seg1 │Seg2 │Seg3 │  每个段独立加锁
│ 🔒  │     │ 🔒  │     │  线程1锁Seg0,线程2可以操作Seg1
└─────┴─────┴─────┴─────┘


ConcurrentHashMap - CAS+synchronized(JDK 1.8+):
┌───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │  只锁冲突的具体桶
│   │🔒 │   │   │  粒度更细,并发度更高
└───┴───┴───┴───┘
```

### 使用建议

```java
// ✗ 不推荐 - Hashtable
Hashtable<String, String> table = new Hashtable<>();

// ✓ 推荐 - ConcurrentHashMap
ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();

// 线程安全的操作
map.put("key", "value");
map.get("key");
map.putIfAbsent("key", "value");  // 原子操作
```

**什么时候不能替代**：
- 需要对整个Map加锁的业务逻辑
- 遗留系统兼容性要求

---

## 4. 重新调整HashMap大小存在什么问题？

### 扩容机制

```
触发条件: size > capacity × loadFactor (默认0.75)

扩容过程:
旧数组(capacity=4)          新数组(capacity=8)
┌───┬───┬───┬───┐          ┌───┬───┬───┬───┬───┬───┬───┬───┐
│ 0 │ 1 │ 2 │ 3 │   →     │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │
└───┴───┴───┴───┘          └───┴───┴───┴───┴───┴───┴───┴───┘
  ↓     ↓                    重新计算每个元素的位置
rehash所有元素
```

### 存在的问题

#### **问题1: 性能问题**
```
- 需要创建新数组 (耗时)
- 重新计算所有元素的hash位置 (耗时)
- 数据量大时,扩容可能导致明显卡顿

解决方案:
  预估容量: new HashMap<>(expectedSize / 0.75 + 1)
```

#### **问题2: 多线程死循环 (JDK 1.7)**

```
JDK 1.7 扩容时使用头插法,多线程可能导致链表成环:

线程1扩容:           线程2扩容:
A → B               B → A
                    形成环: A ⇄ B

结果: get()时死循环,CPU 100%

JDK 1.8已修复: 改用尾插法,但仍不建议多线程使用HashMap
```

#### **问题3: 数据丢失**
```java
// 多线程场景
线程1: map.put(key1, value1)  // 触发扩容
线程2: map.put(key2, value2)  // 同时put

可能结果:
- key1或key2丢失
- 覆盖彼此的数据
```

#### **问题4: 扩容频繁**
```
初始容量太小 → 频繁扩容 → 性能下降

示例:
HashMap<> map = new HashMap<>();  // 默认16
// 插入100个元素会扩容3次: 16→32→64→128

优化:
HashMap<> map = new HashMap<>(128);  // 一次到位
```

### 最佳实践

```java
// 1. 预估容量,避免扩容
int expectedSize = 1000;
Map<String, String> map = new HashMap<>(expectedSize * 4 / 3 + 1);

// 2. 多线程用ConcurrentHashMap
Map<String, String> threadSafeMap = new ConcurrentHashMap<>();

// 3. 调整负载因子(谨慎)
Map<String, String> map = new HashMap<>(16, 0.5f);  // 更早扩容,减少碰撞
```

---

## 5. 为什么用HashMap而不用ArrayList?

### 本质区别

```
ArrayList:  有序列表
  [0]→value0
  [1]→value1
  [2]→value2
  通过索引(index)访问: list.get(0)

HashMap:    键值对映射
  key1 → value1
  key2 → value2
  key3 → value3
  通过键(key)访问: map.get(key1)
```

### 性能对比

| 操作 | ArrayList | HashMap |
|------|-----------|---------|
| 按索引查找 | O(1) | ✗ 不支持 |
| 按值查找 | O(n) | O(1) 平均 |
| 插入(末尾) | O(1) | O(1) 平均 |
| 插入(中间) | O(n) | O(1) 平均 |
| 删除 | O(n) | O(1) 平均 |

### 使用场景对比

```java
// 场景1: 学生列表(有序,按索引访问)
// ✓ 用ArrayList
List<Student> students = new ArrayList<>();
students.add(new Student("张三"));
students.add(new Student("李四"));
Student first = students.get(0);  // 按顺序获取


// 场景2: 学生信息查询(按学号快速查找)
// ✓ 用HashMap
Map<String, Student> studentMap = new HashMap<>();
studentMap.put("2024001", new Student("张三"));
studentMap.put("2024002", new Student("李四"));
Student s = studentMap.get("2024001");  // O(1)快速查找


// 场景3: 用ArrayList实现查找(性能差)
// ✗ 不推荐
List<Student> list = new ArrayList<>();
// 查找学号为"2024001"的学生
for (Student s : list) {  // O(n) 遍历
    if (s.getId().equals("2024001")) {
        return s;
    }
}
```

### 选择依据

**选择 ArrayList**：
- ✓ 需要保持插入顺序
- ✓ 需要按索引访问
- ✓ 需要遍历所有元素
- ✓ 允许重复元素
- 例子：日志记录、任务队列、商品列表

**选择 HashMap**：
- ✓ 需要快速查找(通过key)
- ✓ 需要key-value映射关系
- ✓ key不重复
- ✓ 不关心顺序
- 例子：缓存、配置项、ID映射、计数器

### 实战示例

```java
// 统计单词出现次数
// HashMap: O(n) 一次遍历
Map<String, Integer> wordCount = new HashMap<>();
for (String word : words) {
    wordCount.put(word, wordCount.getOrDefault(word, 0) + 1);
}

// ArrayList: O(n²) 每个单词都要遍历查找
// 性能差,不推荐


// 缓存用户信息
// HashMap: O(1) 快速查找
Map<Long, User> userCache = new HashMap<>();
User user = userCache.get(userId);  // 秒级响应

// ArrayList: O(n) 线性查找
// 用户量大时性能崩溃
```

### 记忆口诀

```
ArrayList: 有序列表,按位置取
HashMap:   键值映射,按key查

需要快速查找 → HashMap
需要保持顺序 → ArrayList
两者都需要 → LinkedHashMap
```

---

## 参考资料

- https://tuonioooo.gitbooks.io/java-concurrent/content/hashmapshi-xian-yuan-li.html

---


## 总结

这5个问题覆盖了HashMap的核心知识点：
1. **哈希碰撞** - 底层存储原理
2. **查找机制** - hashCode + equals
3. **线程安全** - 并发场景的选择
4. **扩容问题** - 性能优化关键
5. **应用场景** - 与其他数据结构的对比

掌握这些，HashMap面试基本无忧！