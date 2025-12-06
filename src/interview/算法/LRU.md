---
title: LRU
category:
  - 算法
Date:
  - 2025-11-26
---

# LRU 缓存淘汰算法完整教程

## 目录
- [什么是 LRU](#什么是-lru)
- [核心原理](#核心原理)
- [应用场景](#应用场景)
- [数据结构设计](#数据结构设计)
- [实现方式](#实现方式)
- [代码示例](#代码示例)
- [时间复杂度分析](#时间复杂度分析)
- [优缺点](#优缺点)
- [实际应用](#实际应用)
- [相关资源](#相关资源)

## 什么是 LRU

**LRU (Least Recently Used)** 即"最近最少使用"算法，是一种常用的缓存淘汰策略。当缓存容量已满时，LRU 会优先淘汰最长时间未被访问的数据。

### 基本思想

基于"如果数据最近被访问过，那么将来被访问的几率也更高"这一局部性原理，LRU 算法会：
- 保留最近使用的数据
- 淘汰最久未使用的数据

## 核心原理

### 操作规则

1. **访问数据时**：如果数据在缓存中，将其移到最前面（表示最近使用）
2. **添加数据时**：
   - 如果缓存未满，直接添加到最前面
   - 如果缓存已满，删除最后面的数据（最久未使用），再添加新数据到最前面

### 关键特性

- **时效性**：根据访问时间排序
- **自动淘汰**：容量满时自动删除最旧数据
- **高效访问**：O(1) 时间复杂度的查找和更新

## 应用场景

1. **操作系统**：页面置换算法
2. **数据库**：缓冲池管理
3. **浏览器**：页面缓存
4. **CDN**：内容分发缓存
5. **Redis**：内存淘汰策略
6. **应用程序**：本地缓存实现

## 数据结构设计

### 最佳实现方案：哈希表 + 双向链表

```
哈希表：提供 O(1) 的查找速度
双向链表：提供 O(1) 的插入和删除操作

结构示意：
HashMap: key -> Node
         ↓
LinkedList: [最新] ⇄ Node ⇄ Node ⇄ Node ⇄ [最旧]
```

#### 为什么使用双向链表？

- **删除节点**：需要访问前驱节点（O(1)）
- **移动节点**：需要同时操作前驱和后继（O(1)）
- **头尾操作**：快速访问最新和最旧节点

## 实现方式

### Python 实现

```python
class Node:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # 哈希表
        # 创建虚拟头尾节点
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head
    
    def get(self, key: int) -> int:
        """获取数据"""
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add(node)
            return node.value
        return -1
    
    def put(self, key: int, value: int) -> None:
        """添加/更新数据"""
        if key in self.cache:
            self._remove(self.cache[key])
        
        node = Node(key, value)
        self._add(node)
        self.cache[key] = node
        
        if len(self.cache) > self.capacity:
            # 删除最久未使用的节点
            lru = self.head.next
            self._remove(lru)
            del self.cache[lru.key]
    
    def _remove(self, node):
        """从链表中移除节点"""
        node.prev.next = node.next
        node.next.prev = node.prev
    
    def _add(self, node):
        """添加节点到链表尾部（最近使用）"""
        node.prev = self.tail.prev
        node.next = self.tail
        self.tail.prev.next = node
        self.tail.prev = node

# 使用示例
cache = LRUCache(2)
cache.put(1, 1)
cache.put(2, 2)
print(cache.get(1))  # 返回 1
cache.put(3, 3)      # 淘汰 key 2
print(cache.get(2))  # 返回 -1 (未找到)
```

### JavaScript 实现

```javascript
class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }
    
    get(key) {
        if (!this.cache.has(key)) return -1;
        
        // 更新为最近使用
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }
    
    put(key, value) {
        // 如果存在，先删除
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }
        
        // 添加到最后（最近使用）
        this.cache.set(key, value);
        
        // 超出容量，删除最早的
        if (this.cache.size > this.capacity) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }
}

// 使用示例
const cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
console.log(cache.get(1)); // 1
cache.put(3, 3);           // 淘汰 key 2
console.log(cache.get(2)); // -1
```

### Java 实现

```java
import java.util.HashMap;

class LRUCache {
    class Node {
        int key, value;
        Node prev, next;
        Node(int k, int v) {
            key = k;
            value = v;
        }
    }
    
    private HashMap<Integer, Node> cache;
    private int capacity;
    private Node head, tail;
    
    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.cache = new HashMap<>();
        head = new Node(0, 0);
        tail = new Node(0, 0);
        head.next = tail;
        tail.prev = head;
    }
    
    public int get(int key) {
        if (!cache.containsKey(key)) return -1;
        Node node = cache.get(key);
        remove(node);
        add(node);
        return node.value;
    }
    
    public void put(int key, int value) {
        if (cache.containsKey(key)) {
            remove(cache.get(key));
        }
        Node node = new Node(key, value);
        add(node);
        cache.put(key, node);
        
        if (cache.size() > capacity) {
            Node lru = head.next;
            remove(lru);
            cache.remove(lru.key);
        }
    }
    
    private void remove(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }
    
    private void add(Node node) {
        node.prev = tail.prev;
        node.next = tail;
        tail.prev.next = node;
        tail.prev = node;
    }
}
```

## 时间复杂度分析

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| get() | O(1) | 哈希表查找 + 链表操作 |
| put() | O(1) | 哈希表插入 + 链表操作 |
| 空间复杂度 | O(capacity) | 存储所有缓存项 |

## 优缺点

### 优点

✅ 实现简单，易于理解  
✅ 能有效利用缓存空间  
✅ 符合程序的局部性原理  
✅ O(1) 的高效操作性能  

### 缺点

❌ 无法应对突发性或周期性批量操作  
❌ 不考虑数据访问频率，只看最近性  
❌ 可能出现"缓存污染"问题  
❌ 维护双向链表有额外开销  

## 实际应用

### Redis 中的 LRU

Redis 使用近似 LRU 算法（为了性能），通过采样方式选择淘汰的键：

```bash
# Redis 配置
maxmemory 100mb
maxmemory-policy allkeys-lru
```

### Linux 内核页面置换

Linux 使用改进的 LRU 算法管理内存页面，维护活跃和非活跃链表。

### 数据库缓冲池

MySQL InnoDB 使用基于 LRU 的缓冲池管理策略，优化磁盘 I/O。

## 相关资源

### 算法学习平台
- **LeetCode**: [146. LRU Cache](https://leetcode.com/problems/lru-cache/)
- **LeetCode 中文**: [146. LRU 缓存](https://leetcode.cn/problems/lru-cache/)

### 技术文档
- **Redis 官方文档**: https://redis.io/docs/manual/eviction/
- **Linux 内核文档**: https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html

### 扩展阅读
- **LRU-K**: 考虑访问频率的改进算法
- **2Q**: 使用两个队列的变体
- **ARC**: 自适应替换缓存算法
- **LFU**: 最不经常使用算法（基于频率）

## 总结

LRU 算法是计算机科学中的经典算法，广泛应用于各种缓存系统。通过哈希表和双向链表的组合，能够实现高效的 O(1) 时间复杂度操作。理解 LRU 算法不仅有助于解决实际问题，也是深入学习操作系统、数据库等系统知识的基础。

---

**提示**：在实际应用中，可能需要根据具体场景选择或改进 LRU 算法，例如结合访问频率（LFU）或使用分段 LRU 等变体。