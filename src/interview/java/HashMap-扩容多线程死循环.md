# HashMap 多线程扩容死循环详解

## 一、前置知识：头插法 vs 尾插法

### 头插法（JDK 1.7）
```
原链表: A → B → C

插入新节点X:
步骤1: X.next = A      (X指向原头节点)
步骤2: head = X        (X成为新头节点)

结果: X → A → B → C    (新节点在最前面)
```

### 尾插法（JDK 1.8+）
```
原链表: A → B → C

插入新节点X:
步骤1: C.next = X      (原尾节点指向X)
步骤2: tail = X        (X成为新尾节点)

结果: A → B → C → X    (新节点在最后面)
```

---

## 二、单线程扩容过程（正常情况）

### 扩容前的状态
```
旧数组 (capacity = 2)
┌─────┬─────┐
│  0  │  1  │
└─────┴─────┘
         ↓
      A → B → null

假设:
- A.hash = 5,  5 % 2 = 1  (在索引1)
- B.hash = 5,  5 % 2 = 1  (哈希碰撞,也在索引1)
```

### 扩容到新数组（capacity = 4）
```
重新计算位置:
- A.hash = 5,  5 % 4 = 1  (新位置:索引1)
- B.hash = 5,  5 % 4 = 1  (新位置:索引1)

使用头插法转移:

步骤1: 转移A
  e = A
  next = B         (保存下一个节点)
  A.next = null    (A插入新数组)
  newTable[1] = A
  
  新数组[1]: A → null

步骤2: 转移B
  e = B
  next = null
  B.next = A       (头插法:B指向A)
  newTable[1] = B
  
  新数组[1]: B → A → null

✓ 正常结束,没有问题
```

---

## 三、多线程扩容死循环详解

### 初始状态
```
线程1和线程2同时进行扩容

旧数组[1]: A → B → null

两个线程都要将 A 和 B 转移到新数组
```

### 时间线详解

#### **T1 时刻：线程1开始执行**
```java
// 线程1的局部变量
e = A           // 当前节点
next = B        // 下一个节点 (关键!)
```

```
线程1视角:
e → [A] → [B] → null
    ↑     ↑
    e    next
```

#### **T2 时刻：线程1被暂停，线程2完整执行完扩容**

线程2使用头插法完成扩容：
```
步骤1: 转移A
  新数组[1]: A → null

步骤2: 转移B (头插法)
  B.next = A
  新数组[1]: B → A → null

✓ 线程2完成,新数组变成: B → A → null
```

**注意**：此时旧数组也被改变了！
```
旧数组[1]: B → A → null  (已经反转!)
```

#### **T3 时刻：线程1恢复执行**

记住：线程1之前的局部变量还在！
```java
e = A        // 线程1之前记住的
next = B     // 线程1之前记住的
```

**第一次循环：转移A**
```java
// 代码简化版
e = A
next = B              // 线程1之前保存的next
A.next = newTable[1]  // A.next = null
newTable[1] = A       // 新数组: A → null
e = next              // e = B (准备处理B)
```

```
线程1的新数组[1]: A → null
```

**第二次循环：转移B（问题来了！）**
```java
e = B
next = B.next         // ⚠️ 现在B.next是谁?
                      // 是A! (线程2已经把B→A了)
```

看实际的链表状态：
```
实际链表(被线程2改过): B → A → null
                       ↑   ↑
                       e  next
```

```java
B.next = newTable[1]  // B.next = A (新数组头是A)
newTable[1] = B       // 新数组: B → A
e = next              // e = A (⚠️ 又回到A了!)
```

```
线程1的新数组[1]: B → A → null
                  ↑       
                 头节点    
```

**第三次循环：再次转移A（死循环形成！）**
```java
e = A                 // 又处理A了
next = A.next         // next = ?
```

看A的next是谁：
```
当前链表: B → A → ?
              ↑
          A.next是谁?
```

因为上一步 `B.next = A`，所以：
```
A.next = null 吗? 不是!
实际上从 B → A,所以遍历时会看到 A 还连着东西
```

继续执行：
```java
A.next = newTable[1]  // A.next = B (头节点是B)
newTable[1] = A       // 新数组: A → B
```

**环形成了！**
```
最终状态:
newTable[1]: A ⇄ B (双向循环!)
            ↑___↓

详细:
A.next = B
B.next = A
形成环: A → B → A → B → A → ...
```

---

## 四、死循环演示

### 成环后查询会发生什么
```java
// 查询一个不存在的key
map.get(notExistKey);

// 内部代码会遍历链表
while (e != null) {
    if (e.key.equals(notExistKey)) {
        return e.value;
    }
    e = e.next;  // ⚠️ 永远不会是null!
}

// 死循环路径:
A → B → A → B → A → B → ...
    永远找不到null,永远退不出循环!
```

### CPU 100% 现象
```
线程永远在循环:
while (e != null) {  // 永远为true
    e = e.next;      // A→B→A→B...
}

表现:
- CPU占用100%
- 程序卡死
- 无法响应请求
```

---

## 五、完整时序图

```
时间轴:
═══════════════════════════════════════════════════════════

初始: 旧数组[1] → A → B → null

───────────────────────────────────────────────────────────
T1: 线程1启动
    e = A, next = B  (保存了局部变量)
    ⏸️ 线程1暂停 (CPU调度)

───────────────────────────────────────────────────────────
T2: 线程2完整执行扩容（头插法）

【循环1】e = A，处理节点 A
    next        = e.next = A.next = B      (保存下一个节点)
    A.next      = newTable[1] = null       (新桶为空，头插后 A 是尾节点)
    newTable[1] = A → null
    e           = next = B                 (推进到下一个节点)

【循环2】e = B，处理节点 B
    next        = e.next = B.next = null   (B 是最后一个，next 为 null)
    B.next      = newTable[1] = A          (头插，B 插到 A 前面)
    newTable[1] = B → A → null
    e           = next = null              (推进到 null，循环结束)

✓ 线程2完成

此时堆内存状态：
    A.next = null  →  ⚠️ 原来是 B，现已变为 null
    B.next = A     →  ⚠️ 原来是 null，现已变为 A

───────────────────────────────────────────────────────────
T3: 线程1恢复，用旧局部变量继续执行
───────────────────────────────────────────────────────────
【循环1】e = A，处理节点 A
    next        = e.next = A.next = null   (读堆内存，线程2已改为 null)
    A.next      = newTable[1] = null       (新桶为空，A 是第一个插入)
    newTable[1] = A → null
    e           = T1保存的旧next = B       (用 T1 挂起前存的局部变量推进，不是本轮 next)

【循环2】e = B，处理节点 B
    next        = e.next = B.next = A      ⚠️ 线程2把 B.next 改成了 A！正常应为 null
    B.next      = newTable[1] = A          (头插，B 插到 A 前面)
    newTable[1] = B → A
    e           = next = A                 ⚠️ e 又回到了 A，本应到 null

【循环3】e = A，再次处理节点 A（while e != null 条件成立）
    next        = e.next = A.next = null   (读堆内存)
    A.next      = newTable[1] = B          (头插，A 插到 B 前面) 💥 环在这里闭合
    newTable[1] = A → B
    e           = next = null              ← transfer() 正常退出

💥 环已闭合：A.next = B，B.next = A
   死循环发生在后续 get() 遍历时：
   e = A → B → A → B → 永远到不了 null，CPU 100%

───────────────────────────────────────────────────────────
结果: 死循环,CPU 100%
```

---

## 六、为什么JDK 1.8修复了？

### JDK 1.8 改用尾插法
```java
// JDK 1.8 扩容代码简化
Node<K,V> loHead = null, loTail = null;  // 尾指针
Node<K,V> hiHead = null, hiTail = null;

do {
    next = e.next;
    if ((e.hash & oldCap) == 0) {
        if (loTail == null)
            loHead = e;
        else
            loTail.next = e;  // ✓ 尾插法
        loTail = e;
    }
    // ...
} while ((e = next) != null);
```

### 尾插法不会成环
```
线程1和线程2同时扩容

线程2先完成: A → B → null (顺序不变!)

线程1恢复执行:
- 转移A: A → null
- 转移B: A → B → null

✓ 顺序保持,不会成环

```

### 但是！仍然不安全
```java
// 多线程put仍可能丢数据
线程1: put(key1, value1)
线程2: put(key2, value2)

可能结果:
- key1或key2丢失
- 数据覆盖
- size计算错误

结论: JDK 1.8 修复了死循环,但HashMap仍不是线程安全的!

```


时序图

```
───────────────────────────────────────────────────────────
初始状态: newTable[3] = null

线程1: put(key1, value1)  hash 落在桶3
线程2: put(key2, value2)  hash 同样落在桶3

───────────────────────────────────────────────────────────
T1: 线程1检查桶3
    if (table[3] == null)   ← 条件成立，准备 CAS 插入
    ⏸️ 线程1挂起

T2: 线程2检查桶3
    if (table[3] == null)   ← 条件同样成立（线程1还没写进去）
    table[3] = Node(key2)   ← 线程2写入成功

T3: 线程1恢复
    table[3] = Node(key1)   ← 线程1不知道线程2已经写了，直接覆盖
    
💥 结果: key2 丢失，size 却 +2
───────────────────────────────────────────────────────────
```

---

## 七、如何避免这个问题？

### 方案1：使用 ConcurrentHashMap（推荐）
```java
// ✓ 线程安全
Map<String, String> map = new ConcurrentHashMap<>();
```

### 方案2：使用 Collections.synchronizedMap
```java
// ✓ 线程安全,但性能差
Map<String, String> map = Collections.synchronizedMap(new HashMap<>());
```

### 方案3：外部加锁
```java
// ✓ 可行,但麻烦
Map<String, String> map = new HashMap<>();
synchronized(map) {
    map.put(key, value);
}
```

---

## 八、记忆要点

```
死循环的根本原因:
1. 头插法导致链表反转
2. 多线程共享变量被修改
3. 局部变量还保存着旧状态
4. 形成环形链表

关键时刻:
T1: 线程1记住 next = B
T2: 线程2完成,链表变成 B → A
T3: 线程1用旧的next,导致 A ⇄ B 成环

解决:
- JDK 1.8+ 用尾插法 (不会成环)
- 但仍要用 ConcurrentHashMap (线程安全)
```

这就是为什么永远不要在多线程环境下使用HashMap！