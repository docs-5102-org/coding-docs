---
title: 热点数据永不过期 - Java实现
category:
  - 缓存
  - redis
---

# 热点数据永不过期 - Java实现

```java
import java.time.LocalDateTime;
import java.util.concurrent.*;
import java.util.concurrent.locks.ReentrantLock;

/**
 * 热点数据缓存管理器 - 逻辑过期实现
 * 核心思想：缓存永不过期，通过逻辑过期时间判断，后台异步更新
 */
public class HotDataCacheManager {
    
    // 缓存存储（实际项目中使用Redis）
    private final ConcurrentHashMap<String, CacheData> cacheMap = new ConcurrentHashMap<>();
    
    // 线程池：用于异步更新缓存
    private final ExecutorService updateExecutor = new ThreadPoolExecutor(
        2, 5, 60L, TimeUnit.SECONDS,
        new LinkedBlockingQueue<>(100),
        new ThreadFactoryBuilder("cache-update-"),
        new ThreadPoolExecutor.CallerRunsPolicy()
    );
    
    // 互斥锁：防止缓存击穿（同一key并发重建）
    private final ConcurrentHashMap<String, ReentrantLock> lockMap = new ConcurrentHashMap<>();
    
    /**
     * 缓存数据包装类
     */
    static class CacheData {
        private Object data;              // 实际数据
        private LocalDateTime expireTime; // 逻辑过期时间
        
        public CacheData(Object data, LocalDateTime expireTime) {
            this.data = data;
            this.expireTime = expireTime;
        }
        
        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expireTime);
        }
        
        public Object getData() {
            return data;
        }
        
        public LocalDateTime getExpireTime() {
            return expireTime;
        }
    }
    
    /**
     * 获取热点数据（核心方法）
     * @param key 缓存key
     * @param dbLoader 数据库加载函数
     * @param expireSeconds 逻辑过期时间（秒）
     * @return 数据对象
     */
    public Object getHotData(String key, DataLoader dbLoader, long expireSeconds) {
        // 1. 从缓存获取数据
        CacheData cacheData = cacheMap.get(key);
        
        // 2. 缓存不存在，直接加载并返回
        if (cacheData == null) {
            return loadAndCache(key, dbLoader, expireSeconds);
        }
        
        // 3. 缓存存在但未过期，直接返回
        if (!cacheData.isExpired()) {
            System.out.println("[命中缓存] key=" + key + ", 过期时间=" + cacheData.getExpireTime());
            return cacheData.getData();
        }
        
        // 4. 缓存逻辑过期，尝试异步更新
        System.out.println("[缓存过期] key=" + key + ", 触发异步更新");
        
        // 4.1 尝试获取锁（避免多个线程重复更新）
        ReentrantLock lock = lockMap.computeIfAbsent(key, k -> new ReentrantLock());
        
        if (lock.tryLock()) {
            try {
                // 双重检查：防止其他线程已经更新
                CacheData recheckData = cacheMap.get(key);
                if (recheckData != null && !recheckData.isExpired()) {
                    return recheckData.getData();
                }
                
                // 提交异步任务更新缓存
                updateExecutor.submit(() -> {
                    try {
                        System.out.println("[开始更新] key=" + key + ", 线程=" + Thread.currentThread().getName());
                        Object newData = dbLoader.load(key);
                        
                        // 更新缓存
                        LocalDateTime newExpireTime = LocalDateTime.now().plusSeconds(expireSeconds);
                        cacheMap.put(key, new CacheData(newData, newExpireTime));
                        
                        System.out.println("[更新完成] key=" + key + ", 新过期时间=" + newExpireTime);
                    } catch (Exception e) {
                        System.err.println("[更新失败] key=" + key + ", 错误=" + e.getMessage());
                    }
                });
            } finally {
                lock.unlock();
            }
        }
        
        // 5. 返回旧数据（保证服务可用性）
        System.out.println("[返回旧数据] key=" + key + ", 保证服务可用");
        return cacheData.getData();
    }
    
    /**
     * 加载数据并缓存
     */
    private Object loadAndCache(String key, DataLoader dbLoader, long expireSeconds) {
        System.out.println("[缓存未命中] key=" + key + ", 加载数据");
        Object data = dbLoader.load(key);
        
        LocalDateTime expireTime = LocalDateTime.now().plusSeconds(expireSeconds);
        cacheMap.put(key, new CacheData(data, expireTime));
        
        System.out.println("[缓存已建立] key=" + key + ", 过期时间=" + expireTime);
        return data;
    }
    
    /**
     * 预热热点数据
     */
    public void warmUp(String key, Object data, long expireSeconds) {
        LocalDateTime expireTime = LocalDateTime.now().plusSeconds(expireSeconds);
        cacheMap.put(key, new CacheData(data, expireTime));
        System.out.println("[预热成功] key=" + key);
    }
    
    /**
     * 关闭资源
     */
    public void shutdown() {
        updateExecutor.shutdown();
    }
    
    /**
     * 数据加载器接口
     */
    @FunctionalInterface
    public interface DataLoader {
        Object load(String key);
    }
    
    /**
     * 线程工厂（用于命名线程）
     */
    static class ThreadFactoryBuilder implements ThreadFactory {
        private final String namePrefix;
        private int counter = 1;
        
        public ThreadFactoryBuilder(String namePrefix) {
            this.namePrefix = namePrefix;
        }
        
        @Override
        public Thread newThread(Runnable r) {
            return new Thread(r, namePrefix + counter++);
        }
    }
    
    // ==================== 测试示例 ====================
    public static void main(String[] args) throws InterruptedException {
        HotDataCacheManager cacheManager = new HotDataCacheManager();
        
        // 模拟数据库查询
        DataLoader dbLoader = key -> {
            try {
                Thread.sleep(1000); // 模拟数据库查询耗时
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            return "商品数据[" + key + "]-时间:" + System.currentTimeMillis();
        };
        
        String hotKey = "product:1001";
        
        // 第一次访问：缓存未命中
        System.out.println("\n===== 第1次访问 =====");
        Object data1 = cacheManager.getHotData(hotKey, dbLoader, 3);
        System.out.println("返回数据: " + data1);
        
        Thread.sleep(1000);
        
        // 第二次访问：命中缓存
        System.out.println("\n===== 第2次访问 =====");
        Object data2 = cacheManager.getHotData(hotKey, dbLoader, 3);
        System.out.println("返回数据: " + data2);
        
        Thread.sleep(3000);
        
        // 第三次访问：缓存逻辑过期，触发异步更新，但返回旧数据
        System.out.println("\n===== 第3次访问（过期后） =====");
        Object data3 = cacheManager.getHotData(hotKey, dbLoader, 3);
        System.out.println("返回数据: " + data3);
        
        Thread.sleep(2000);
        
        // 第四次访问：缓存已更新
        System.out.println("\n===== 第4次访问（更新后） =====");
        Object data4 = cacheManager.getHotData(hotKey, dbLoader, 3);
        System.out.println("返回数据: " + data4);
        
        cacheManager.shutdown();
    }
}
```

# 热点数据永不过期 - Java实现

这里提供一个完整的实现方案,包含逻辑过期时间和后台异步更新机制。## 核心设计要点

### 1. **逻辑过期时间**
- 数据本身在缓存中永不过期（没有设置TTL）
- 通过`CacheData.expireTime`字段记录逻辑过期时间
- 过期判断由应用层控制，而非缓存中间件

### 2. **异步更新机制**
- 检测到逻辑过期后，立即返回旧数据（保证响应速度）
- 提交异步任务到线程池更新缓存
- 用户感知不到更新过程，体验流畅

### 3. **防止缓存击穿**
- 使用`ConcurrentHashMap<String, ReentrantLock>`为每个key维护独立锁
- `tryLock()`非阻塞获取锁，获取失败直接返回旧数据
- 避免大量线程同时重建缓存

### 4. **双重检查机制**
- 获取锁后再次检查缓存是否已被其他线程更新
- 减少不必要的数据库查询

## 实际应用建议

在生产环境中，可以进一步优化：

1. **使用Redis存储**：将`ConcurrentHashMap`替换为Redis，支持分布式场景
2. **分布式锁**：使用Redis分布式锁或Redisson替代本地锁
3. **监控告警**：记录缓存命中率、更新失败次数等指标
4. **降级策略**：数据库查询失败时，延长旧数据的有效期
5. **差异化过期时间**：根据访问频率动态调整过期时间

这个方案特别适合**秒杀商品详情**、**热门文章**、**排行榜**等高并发读场景。