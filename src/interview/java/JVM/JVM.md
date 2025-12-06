---
title: JVM 面试题精
category:
  - 面试题
tag:
  - JVM
Date:
  - 2025-11-26
---

# JVM 面试题

## 

### 1. **类加载器（ClassLoader）**

作用：

* 负责**从文件、网络、Jar 包等地方加载 .class 字节码**到 JVM。
* 把字节码数据放入 **方法区**（Java 8 后称为 MetaSpace）。
* 完成 *加载 → 链接 → 初始化* 整个类加载过程。

---

### 2. **运行时数据区（Runtime Data Area）**

JVM 运行时的内存结构，包含：

#### **线程私有：**

* **程序计数器（PC Register）**
* **Java 虚拟机栈（JVM Stack）**
* **本地方法栈（Native Method Stack）**

#### **线程共享：**

* **堆（Heap）** → 用于对象实例、数组（GC 发生地）
* **方法区（Method Area / MetaSpace）** → 类信息、常量池、静态变量、JIT 代码等
* **运行时常量池（Runtime Constant Pool）**

主要作用：存放程序运行过程中所有需要的数据。

---

## 3. **执行引擎（Execution Engine）**

负责“执行字节码”，包含：

### **（1）解释器 Interpreter**

逐条把字节码解释给底层执行（启动快、执行慢）。

### **（2）JIT（Just In Time 即时编译器）**

将热点代码编译为机器码，直接由 CPU 执行（执行快）。

### **（3）垃圾回收器（GC）**

是 JVM 执行子系统的一部分，管理堆内存的回收。

---

## 4. **本地库接口（JNI / Native Interface）**

* 提供 Java 调用 C/C++、操作系统底层函数的能力
* 允许 JVM 调用 native 方法库（如动态链接库 .dll / .so）
* 本地方法执行时会进入**Native Method Stack**

---

# 📌 **一个更加准确的总结**

> JVM 的工作过程是：
> ClassLoader 将字节码加载到方法区 →
> 执行引擎从方法区取指令，同时访问堆/栈等数据区 →
> 解释器/JIT 将字节码执行 →
> 如需调用系统底层或 C/C++ 代码，通过 JNI 调用本地库。

---

# 🎨 **ASCII 总体结构图**

```
          ┌──────────────────────────────────────────┐
          │                 JVM                      │
          └──────────────────────────────────────────┘
                           ▲
                           │
                     +-----------+
                     | ClassLoader |
                     +-----------+
                           │   加载类字节码
                           ▼
      ┌───────────────────────────────────────────────┐
      │           Runtime Data Area (内存结构)        │
      ├───────────────────────────────────────────────┤
      │  线程私有（Thread Private）                   │
      │   • PC 寄存器                                  │
      │   • JVM 栈                                     │
      │   • 本地方法栈                                 │
      │                                                 │
      │  线程共享（Thread Shared）                    │
      │   • 堆（Heap）                                 │
      │   • 方法区（Method Area / MetaSpace）         │
      │   • 运行时常量池（Runtime Constant Pool）     │
      └───────────────────────────────────────────────┘
                           ▲
                           │  取指令 / 取对象数据
                           ▼
          ┌──────────────────────────────────────────┐
          │            Execution Engine              │
          │  • 解释器 (Interpreter)                  │
          │  • JIT 即时编译器                        │
          │  • 垃圾回收器 (GC)                       │
          └──────────────────────────────────────────┘
                           ▲
                           │ native 方法调用
                           ▼
                 ┌────────────────────┐
                 │  Native Interface  │
                 │    (JNI 调用)      │
                 └────────────────────┘
                           │
                           ▼
                 ┌────────────────────┐
                 │ 操作系统 / C 库     │
                 └────────────────────┘
```

---

## 说一下Java运行时区域包括什么？

[JVM内存区域](./JVM内存区域.md)

## 什么是双亲委派模型？

**双亲委派模型（Parent-Delegation Model）**是Java虚拟机（JVM）中描述类加载器如何协同工作的一种机制，它定义了类加载器在加载类时的一个层级结构和委派规则。

### 工作流程
当一个类加载器收到加载类的请求时，它的处理流程如下： 

- 向上委派：它首先不会自己尝试去加载这个类，而是把这个请求委派给自己的“双亲”（父类）加载器去执行。
- 递归委派：父类加载器也会遵循同样的规则，继续将加载请求向上委派给它的父类加载器，直到达到最顶层的“启动类加载器”（Bootstrap ClassLoader）。
- 向下加载：如果父类加载器在它的搜索范围内找不到所需的类，才会将加载任务“退回”给它的下一级子加载器。
- 自主加载：如果所有父类加载器都无法加载，最终发起请求的那个类加载器才会尝试自己去加载这个类。

### 类加载器层级(分类)

- 启动类加载器（Bootstrap ClassLoader）：最顶层的加载器，由C++实现，是虚拟机自身的一部分，用来加载`$JAVA_HOME$/lib/`目录中的，或者被 `-Xbootclasspath` 参数所指定的路径中并且被虚拟机识别的类库；
- 扩展类加载器（Extension ClassLoader）：负责加载`$JAVA_HOME/lib/ext`指定的路径中的所有类库；
- 应用程序类加载器（Application ClassLoader）：也称为系统类加载器，负责加载用户类路径（Classpath）上所指定的类库。一般情况，如果我们没有自定义类加载器默认就是用这个加载器。

> [类加载器详解](./类加载器.md)

---

## 类加载的过程

- [类加载过程的详解](./类加载过程.md)


## Java中有哪些引用类型？

Java 提供了四种引用类型，用于实现不同强度的对象引用关系，帮助 JVM 更灵活地进行垃圾回收：

### 1. 强引用（Strong Reference）
最常见的引用类型，通过 `new` 关键字创建的对象默认都是强引用。只要强引用关系存在，垃圾回收器就不会回收被引用的对象，即使系统面临内存不足的风险。

**示例：**
```java
Object obj = new Object(); // 强引用
```

### 2. 软引用（Soft Reference）
用于描述有用但非必需的对象。当系统内存充足时，软引用对象不会被回收；当系统即将发生内存溢出时，JVM 会在抛出 OutOfMemoryError 之前回收这些对象。

**适用场景：** 实现内存敏感的缓存，如图片缓存、网页缓存等。

**示例：**
```java
SoftReference<Object> softRef = new SoftReference<>(new Object());
```

```java
import java.lang.ref.SoftReference;
import java.util.HashMap;
import java.util.Map;

public class ImageCache {
    // 使用 Map 存储图片的软引用
    private Map<String, SoftReference<byte[]>> imageCache = new HashMap<>();
    
    /**
     * 获取图片
     * @param imagePath 图片路径
     * @return 图片数据
     */
    public byte[] getImage(String imagePath) {
        // 先从缓存中查找
        SoftReference<byte[]> softRef = imageCache.get(imagePath);
        
        if (softRef != null) {
            byte[] imageData = softRef.get();
            if (imageData != null) {
                System.out.println("从缓存中获取图片: " + imagePath);
                return imageData;
            }
        }
        
        // 缓存中没有或已被回收,从磁盘加载
        System.out.println("从磁盘加载图片: " + imagePath);
        byte[] imageData = loadImageFromDisk(imagePath);
        
        // 放入缓存
        imageCache.put(imagePath, new SoftReference<>(imageData));
        
        return imageData;
    }
    
    /**
     * 模拟从磁盘加载图片
     */
    private byte[] loadImageFromDisk(String imagePath) {
        // 实际应用中这里会从文件系统读取
        return new byte[1024 * 1024]; // 模拟 1MB 图片
    }
}
```

> 大部分的场景下用redis替代了

### 3. 弱引用（Weak Reference）
同样用于描述有用但非必需的对象，但生命周期比软引用更短。无论内存是否充足，只要发生垃圾回收，弱引用对象就会被回收。

**适用场景：** 用于防止内存泄漏，如 WeakHashMap、ThreadLocal 等场景。

**示例：**
```java
WeakReference<Object> weakRef = new WeakReference<>(new Object());
```

### 4. 虚引用（Phantom Reference）
最弱的引用类型，形同虚设。虚引用不会影响对象的生命周期，无法通过虚引用获取对象实例。它的唯一作用是在对象被回收时收到一个系统通知。

**关键特点：**
- 必须与引用队列（ReferenceQueue）配合使用
- 当垃圾回收器准备回收对象时，会将虚引用加入到关联的引用队列中
- 通过监控引用队列，可以在对象内存被回收前执行清理操作

**适用场景：** 跟踪对象的回收状态，管理堆外内存（如 DirectByteBuffer）。

**示例：**
```java
ReferenceQueue<Object> queue = new ReferenceQueue<>();
PhantomReference<Object> phantomRef = new PhantomReference<>(new Object(), queue);
```

### 实际应用建议

在实际开发中，各种引用的使用频率为：**强引用 > 软引用 > 弱引用 > 虚引用**

- **软引用** 使用最为广泛，可以有效实现缓存机制，加速 JVM 垃圾回收，防止内存溢出
- **弱引用** 常用于避免内存泄漏的场景
- **虚引用** 较少使用，主要用于特殊的资源管理场景

合理使用不同类型的引用，可以帮助系统更好地管理内存，提升应用的稳定性和性能。

---

## Java程序`Stack overflow`的解决办法?

有的时候当我们的程序，递归调用太深的时候，可能我们的栈就溢出了。

这个问题很好解决，只要加上JVM参数`-Xss2m`，基本就能解决这个问题。

---

## 如何判断一个常量是废弃常量（废弃常量的判断标准）?

### 1. 字符串常量的判断 ✅

```java
// 示例
String s1 = "abc";  // "abc" 进入字符串常量池
s1 = null;          // 没有任何引用指向 "abc"
// 此时 "abc" 成为废弃常量，GC时可能被回收
```

**判断条件**：
- ✅ 常量池中存在该字符串常量
- ✅ **没有任何对象引用**该常量
- ✅ **没有其他地方引用**该常量（包括反射等）

### 2. 其他常量的判断

运行时常量池不仅包含字符串，还包括：

#### **类常量（Class对象）**
```java
// 判断废弃：
// 1. 该类的所有实例都被回收
// 2. 加载该类的ClassLoader已被回收
// 3. 该类的java.lang.Class对象没有被引用
```

#### **基本类型包装类常量**
```java
Integer i1 = 127;  // 缓存池中的常量
i1 = null;         // 但-128~127的Integer通常不会被回收（缓存池）
```

### 实际代码示例

```java
public class ConstantPoolTest {
    public static void main(String[] args) {
        // 情况1：有引用 - 不是废弃常量
        String s1 = "hello";
        String s2 = "hello";  // 指向同一个常量
        // "hello" 不会被回收
        
        // 情况2：失去引用 - 成为废弃常量
        String s3 = new String("world").intern();
        s3 = null;
        // 如果没有其他引用，"world" 可能被回收
        
        // 情况3：动态生成的常量
        String s4 = ("dy" + "namic").intern();
        s4 = null;
        // "dynamic" 成为废弃常量
        
        System.gc();  // 建议GC回收废弃常量
    }
}
```

### ⚠️ 注意事项

1. **必须满足条件**：
   - 常量池中有这个常量
   - 堆中没有任何对象引用它
   - 其他地方也没有引用（如其他常量池条目）

2. **回收时机**：
   - 只有在**Full GC**或**CMS GC**时才会清理常量池
   - Minor GC **不会**清理常量池

3. **字符串常量池特殊性**：
   ```java
   String s1 = "abc";           // 字面量，进入常量池
   String s2 = new String("abc"); // 不会直接进入常量池
   String s3 = s2.intern();     // 手动加入常量池
   ```

### 总结

**判断废弃常量 = 常量池中存在 + 无任何引用**

---

## 如何判断一个类是无用的类？

### 三个判定条件详解

**1. 该类所有的实例都已经被回收**
- Java堆中不存在该类及其子类的任何实例对象
- 这是最基本的条件

**2. 加载该类的ClassLoader已经被回收**
- 这个条件比较严格,因为ClassLoader通常不容易被回收
- 如果是`BootstrapClassLoader`、`ExtensionClassLoader`或`ApplicationClassLoader`加载的类,这些ClassLoader在JVM生命周期内一般不会被回收
- 只有自定义的ClassLoader才可能被回收

**3. 该类的Class对象没有被引用**
- 无法通过任何途径访问该类的方法(反射等)
- 没有地方持有该类的Class对象引用
- 常量池中也没有对该类的引用

### 为什么说"可以"而非"必然"回收?

这涉及到JVM的类卸载策略:

```java
// 虚拟机参数控制类卸载行为
-XX:+TraceClassUnloading  // 追踪类卸载信息
-Xnoclassgc              // 禁用类的垃圾回收
```

**原因包括:**
- 类卸载的成本较高,需要释放方法区(元空间)的内存
- JVM会权衡回收类的收益和成本
- 在某些场景下(如热部署、动态代理频繁使用),类卸载才有实际意义

### 实际应用场景

满足这三个条件的场景通常出现在:
- JSP页面频繁修改(每次修改会重新加载类)
- OSGi等模块化框架的热部署
- 使用大量动态代理或字节码生成的框架
- 自定义类加载器的应用场景

这就是为什么在日常开发中很少看到类被卸载的原因——条件实在太苛刻了!

---

##  JVM 调优的工具有哪些？

你提到的这两个工具确实是最常用的，让我给你做一个更全面的JVM调优工具总结：

### 一、命令行工具（JDK自带）

**1. jps (Java Process Status)**
```bash
jps -l  # 查看所有Java进程及完整类名
jps -v  # 查看JVM参数
```

**2. jstat (JVM Statistics Monitoring)**
```bash
jstat -gc pid 1000 10     # 每1秒输出GC情况，共10次
jstat -gcutil pid         # 查看堆内存各区域使用率
jstat -gccause pid        # 查看GC原因
```

**3. jinfo (Configuration Info)**
```bash
jinfo -flags pid          # 查看JVM参数
jinfo -flag +PrintGC pid  # 动态开启GC日志
```

**4. jmap (Memory Map)**
```bash
jmap -heap pid            # 查看堆内存详情
jmap -histo pid           # 查看对象统计信息
jmap -dump:format=b,file=heap.hprof pid  # 导出堆转储文件
```

**5. jstack (Stack Trace)**
```bash
jstack pid                # 查看线程堆栈信息
jstack -l pid             # 查看锁信息，排查死锁
```

**6. jhat (Heap Analysis Tool)**
```bash
jhat heap.hprof           # 分析堆转储文件（已过时，建议用MAT）
```

### 二、可视化工具

**1. jconsole**
- 监控内存、线程、类加载、MBean
- 实时监控GC活动
- 适合快速查看JVM运行状态

**2. jvisualvm (Visual VM)**
- 功能最全面的JDK自带工具
- 可以安装插件扩展功能（Visual GC、BTrace等）
- 支持本地和远程监控
- 可以生成和分析堆转储、线程转储

**3. Java Mission Control (JMC)**
```bash
# JDK 11+需要单独下载
# 配合Java Flight Recorder使用
-XX:+UnlockCommercialFeatures
-XX:+FlightRecorder
```
- Oracle官方推荐的性能分析工具
- 低开销的持续监控方案

### 三、第三方工具

**1. MAT (Memory Analyzer Tool)**
- Eclipse出品，专业分析堆转储文件
- 可以快速定位内存泄漏
- 支持大文件分析

**2. GCViewer / GCEasy**
- 分析GC日志的可视化工具
- GCEasy支持在线分析

**3. Arthas (阿里开源)**
```bash
# 功能强大的诊断工具
dashboard      # 实时数据面板
thread         # 查看线程信息
jvm            # 查看JVM信息
heapdump       # 导出堆转储
```

**4. Async-profiler**
- 低开销的性能分析工具
- 可以生成火焰图
- 适合生产环境使用

### 四、常用调优参数

```bash
# GC日志
-Xloggc:gc.log
-XX:+PrintGCDetails
-XX:+PrintGCDateStamps

# 内存溢出时自动导出堆
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/path/to/dump

# 远程监控
-Dcom.sun.management.jmxremote
-Dcom.sun.management.jmxremote.port=9999
-Dcom.sun.management.jmxremote.authenticate=false
-Dcom.sun.management.jmxremote.ssl=false
```

---

## 怎么判断对象是否可以被回收？（如何判断对象是否死亡?）

堆中几乎放着所有的对象实例，对堆垃圾回收前的第一步就是要判断哪些对象已经死亡（即不能再被任何途径使用的对象）。

### 引用计数法

给对象中添加一个引用计数器：

- 每当有一个地方引用它，计数器就加 1；
- 当引用失效，计数器就减 1；
- 任何时候计数器为 0 的对象就是不可能再被使用的。

**这个方法实现简单，效率高，但是目前主流的虚拟机中并没有选择这个算法来管理内存，其最主要的原因是它很难解决对象之间循环引用的问题。**

![对象之间循环引用](https://oss.javaguide.cn/github/javaguide/java/jvm/object-circular-reference.png)

所谓对象之间的相互引用问题，如下面代码所示：除了对象 `objA` 和 `objB` 相互引用着对方之外，这两个对象之间再无任何引用。但是他们因为互相引用对方，导致它们的引用计数器都不为 0，于是引用计数算法无法通知 GC 回收器回收他们。

```java
public class ReferenceCountingGc {
    Object instance = null;
    public static void main(String[] args) {
        ReferenceCountingGc objA = new ReferenceCountingGc();
        ReferenceCountingGc objB = new ReferenceCountingGc();
        objA.instance = objB;
        objB.instance = objA;
        objA = null;
        objB = null;
    }
}
```

### 可达性分析算法

这个算法的基本思想就是通过一系列的称为 **“GC Roots”** 的对象作为起点，从这些节点开始向下搜索，节点所走过的路径称为引用链，当一个对象到 GC Roots 没有任何引用链相连的话，则证明此对象是不可用的，需要被回收。

下图中的 `Object 6 ~ Object 10` 之间虽有引用关系，但它们到 GC Roots 不可达，因此为需要被回收的对象。

<img src="/assets/images/jvm/jvm-gc-roots-removebg-preview.png" style="width: 400px;"></img>

**哪些对象可以作为 GC Roots 呢？**

- 虚拟机栈(栈帧中的局部变量表)中引用的对象
- 本地方法栈(Native 方法)中引用的对象
- 方法区中类静态属性引用的对象
- 方法区中常量引用的对象
- 所有被同步锁持有的对象
- JNI（Java Native Interface）引用的对象

**对象可以被回收，就代表一定会被回收吗？**

即使在可达性分析法中不可达的对象，也并非是“非死不可”的，这时候它们暂时处于“缓刑阶段”，要真正宣告一个对象死亡，至少要经历两次标记过程；可达性分析法中不可达的对象被第一次标记并且进行一次筛选，筛选的条件是此对象是否有必要执行 `finalize` 方法。当对象没有覆盖 `finalize` 方法，或 `finalize` 方法已经被虚拟机调用过时，虚拟机将这两种情况视为没有必要执行。

被判定为需要执行的对象将会被放在一个队列中进行第二次标记，除非这个对象与引用链上的任何一个对象建立关联，否则就会被真的回收。

> `Object` 类中的 `finalize` 方法一直被认为是一个糟糕的设计，成为了 Java 语言的负担，影响了 Java 语言的安全和 GC 的性能。JDK9 版本及后续版本中各个类中的 `finalize` 方法会被逐渐弃用移除。忘掉它的存在吧！
>
> 参考：
>
> - [JEP 421: Deprecate Finalization for Removal](https://openjdk.java.net/jeps/421)
> - [是时候忘掉 finalize 方法了](https://mp.weixin.qq.com/s/LW-paZAMD08DP_3-XCUxmg)