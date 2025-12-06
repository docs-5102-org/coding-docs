---
title: LFU
category:
  - 算法
Date:
  - 2025-11-26
---

# LFU (Least Frequently Used) 算法详解教程

## 1. 什么是 LFU 算法

LFU (Least Frequently Used，最不经常使用) 是一种缓存淘汰算法。当缓存容量已满时，LFU 会优先淘汰访问频率最低的数据项。如果存在多个访问频率相同的项，则淘汰最早加入的那个。

## 2. LFU 算法原理

### 2.1 核心思想

- 记录每个缓存项的访问频率
- 当需要淘汰时，移除访问频率最小的项
- 频率相同时，采用 FIFO 策略（先进先出）

### 2.2 时间复杂度要求

高效的 LFU 实现应达到：
- `get(key)`: O(1)
- `put(key, value)`: O(1)

## 3. 数据结构设计

为实现 O(1) 时间复杂度，需要使用以下数据结构：

### 3.1 核心组件

1. **HashMap (key → Node)**: 快速定位缓存项
2. **HashMap (frequency → DoubleLinkedList)**: 存储相同频率的所有节点
3. **minFreq**: 记录当前最小频率

### 3.2 节点结构

```python
class Node:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.freq = 1  # 初始频率为 1
        self.prev = None
        self.next = None
```

## 4. 算法实现步骤

### 4.1 GET 操作

1. 检查 key 是否存在
2. 如果存在：
   - 从当前频率链表中移除节点
   - 频率 +1
   - 将节点加入新频率链表
   - 更新 minFreq（如果必要）
   - 返回 value
3. 如果不存在，返回 -1

### 4.2 PUT 操作

1. **如果 key 已存在**：
   - 更新 value
   - 增加频率（同 GET 操作）

2. **如果 key 不存在**：
   - 检查容量是否已满
   - 如果已满：从 minFreq 对应的链表中删除最老的节点
   - 创建新节点（频率为 1）
   - 将新节点加入频率 1 的链表
   - 设置 minFreq = 1

## 5. Python 完整实现

```python
class Node:
    def __init__(self, key, value):
        self.key = key
        self.value = value
        self.freq = 1
        self.prev = None
        self.next = None

class DoubleLinkedList:
    def __init__(self):
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head
        self.size = 0
    
    def add_first(self, node):
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node
        self.size += 1
    
    def remove(self, node):
        node.prev.next = node.next
        node.next.prev = node.prev
        self.size -= 1
    
    def remove_last(self):
        if self.size > 0:
            last_node = self.tail.prev
            self.remove(last_node)
            return last_node
        return None

class LFUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        self.min_freq = 0
        self.key_to_node = {}  # key -> Node
        self.freq_to_list = {}  # frequency -> DoubleLinkedList
    
    def get(self, key):
        if key not in self.key_to_node:
            return -1
        
        node = self.key_to_node[key]
        self._increase_freq(node)
        return node.value
    
    def put(self, key, value):
        if self.capacity == 0:
            return
        
        # 如果 key 已存在
        if key in self.key_to_node:
            node = self.key_to_node[key]
            node.value = value
            self._increase_freq(node)
            return
        
        # 容量已满，需要淘汰
        if len(self.key_to_node) >= self.capacity:
            self._evict()
        
        # 添加新节点
        new_node = Node(key, value)
        self.key_to_node[key] = new_node
        
        if 1 not in self.freq_to_list:
            self.freq_to_list[1] = DoubleLinkedList()
        self.freq_to_list[1].add_first(new_node)
        
        self.min_freq = 1
    
    def _increase_freq(self, node):
        old_freq = node.freq
        
        # 从旧频率链表中移除
        self.freq_to_list[old_freq].remove(node)
        
        # 如果旧频率链表为空且是最小频率，更新最小频率
        if self.freq_to_list[old_freq].size == 0 and old_freq == self.min_freq:
            self.min_freq += 1
        
        # 增加频率
        node.freq += 1
        new_freq = node.freq
        
        # 添加到新频率链表
        if new_freq not in self.freq_to_list:
            self.freq_to_list[new_freq] = DoubleLinkedList()
        self.freq_to_list[new_freq].add_first(node)
    
    def _evict(self):
        # 获取最小频率链表
        min_freq_list = self.freq_to_list[self.min_freq]
        
        # 移除最老的节点（链表尾部）
        evict_node = min_freq_list.remove_last()
        
        if evict_node:
            del self.key_to_node[evict_node.key]
```

## 6. 使用示例

```python
# 创建容量为 2 的 LFU 缓存
cache = LFUCache(2)

cache.put(1, 1)  # 缓存: {1=1}
cache.put(2, 2)  # 缓存: {1=1, 2=2}
print(cache.get(1))  # 返回 1，缓存: {1=1(freq=2), 2=2(freq=1)}

cache.put(3, 3)  # 淘汰 key 2，缓存: {1=1, 3=3}
print(cache.get(2))  # 返回 -1 (未找到)

print(cache.get(3))  # 返回 3，缓存: {1=1(freq=2), 3=3(freq=2)}
cache.put(4, 4)  # 淘汰 key 1（频率相同，1 更早），缓存: {3=3, 4=4}
print(cache.get(1))  # 返回 -1 (未找到)
```

## 7. LFU vs LRU

| 特性 | LFU | LRU |
|------|-----|-----|
| 淘汰策略 | 淘汰访问频率最低的 | 淘汰最久未使用的 |
| 适用场景 | 访问模式稳定 | 访问模式时序性强 |
| 复杂度 | 实现较复杂 | 实现相对简单 |
| 缓存污染 | 抗污染能力强 | 容易被批量访问污染 |

## 8. 应用场景

LFU 算法适用于以下场景：

- **CDN 缓存**: 热点内容长期保持高访问频率
- **数据库查询缓存**: 常用查询结果缓存
- **操作系统页面置换**: 频繁访问的页面保留在内存
- **Redis 缓存策略**: Redis 支持 LFU 作为淘汰策略之一

## 9. LFU 的优缺点

### 优点
- 能够保留长期热点数据
- 对偶发的大量访问不敏感
- 更符合实际业务中的访问规律

### 缺点
- 实现复杂度较高
- 早期访问的项可能难以被淘汰
- 新加入的热点数据需要时间积累频率

## 10. 优化建议

### 10.1 时间衰减
为避免历史频率影响过大，可以定期衰减频率：

```python
# 每隔一段时间将所有频率减半
def decay_frequencies(self):
    for node in self.key_to_node.values():
        node.freq = max(1, node.freq // 2)
```

### 10.2 LFU-K 算法
只记录最近 K 次访问的频率，避免历史数据影响过大。

## 11. 相关资源

### LeetCode 练习题
- [LFU 缓存 (LeetCode 460)](https://leetcode.com/problems/lfu-cache/)

### Redis 官方文档
- [Redis LFU 模式文档](https://redis.io/docs/manual/eviction/#the-new-lfu-mode)
- [Redis 缓存淘汰策略](https://redis.io/docs/reference/eviction/)

### 学习资源
- [Wikipedia - Cache Replacement Policies](https://en.wikipedia.org/wiki/Cache_replacement_policies)
- [LeetCode 题解讨论区](https://leetcode.com/problems/lfu-cache/solutions/)

---

**总结**: LFU 算法通过跟踪访问频率来决定缓存淘汰策略，适合访问模式稳定的场景。虽然实现复杂，但能有效保护热点数据，在实际应用中具有重要价值。