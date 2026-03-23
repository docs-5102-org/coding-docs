---
title: JVM 内存区域（详解）
category:
  - 面试题
tag:
  - JVM
  - 内存区域
Date:
  - 2025-11-26
---

# JVM 运行时数据区（内存结构详解）

## 内存区域整体架构

<img :src="$withBase('/assets/images/interview/jvm/jvmstruct.png')" 
  alt=""
  width="800px" 
  height="auto">

## 架构分层介绍 

### 方法区/元空间（Method Area）

<img :src="$withBase('/assets/images/interview/jvm/methodstruct.png')" 
  alt="方法区内存区域"
  width="800px" 
  height="auto">

补充，运行时常量池，还包括 14中常量，

#### 1. **类元数据 (Class Metadata)**
- **Klass 结构**：JVM 内部表示类的 C++ 对象
- 类的基本信息：类名、访问修饰符、版本号
- 继承关系：父类、接口列表
- 字段信息：字段名、类型、修饰符、偏移量
- 方法信息：方法名、描述符、修饰符、字节码、异常表、行号表、局部变量表
- 虚方法表 (vtable) 和接口方法表 (itable)

#### 2. **运行时常量池 (Runtime Constant Pool)**
- 每个类独立的常量池
- 字面量：字符串、数值常量
- 符号引用：类引用、字段引用、方法引用
- 14 种常量类型（CONSTANT_Utf8、CONSTANT_Class、CONSTANT_Methodref 等）,详见[运行时常量池](./运行时常量池.md)

#### 3. **静态变量 (Class Variables)**
- 类的 static 字段的存储
- 注意：静态变量的引用在元空间，但如果是引用类型，对象实例本身在堆中

#### 4. **即时编译代码 (JIT Compiled Code)**
- 热点代码编译后的本地机器码
- 内联、优化后的代码
- Code Cache 区域

#### 5. **类加载器数据 (ClassLoader Data)**
- 类加载器的元数据
- 类加载器的命名空间信息
- 类之间的依赖关系

#### 6. **注解信息 (Annotations)**
- 类、方法、字段上的注解元数据
- 注解的属性值

#### 7. **其他元数据**
- 内部字符串 (Interned Strings) 的引用（注意：JDK 7+ 字符串对象本身在堆中）
- 方法计数器、分支计数器等性能数据
- 调试信息：源文件名、行号映射

**实现演变：**

| JDK版本 | 实现方式 | 存储位置 |
|---------|----------|----------|
| JDK 1.7及之前 | 永久代（PermGen） | JVM内存 |
| JDK 1.8及之后 | 元空间（Metaspace） | 本地内存 |

**为什么用元空间替代永久代？**
1. 永久代大小固定，难以调整，容易OOM
2. 元空间使用本地内存，大小可动态调整
3. 简化Full GC，提高性能

**常用JVM参数：**

JDK 1.7及之前：
```bash
-XX:PermSize=N          # 永久代初始大小
-XX:MaxPermSize=N       # 永久代最大大小
```

JDK 1.8及之后：
```bash
-XX:MetaspaceSize=N     # 元空间初始大小
-XX:MaxMetaspaceSize=N  # 元空间最大大小（默认无限制）
```

#### 运行时常量池（Runtime Constant Pool）

[详见](./运行时常量池.md)

**特点：**
- 方法区（元空间）的一部分
- 存储编译期生成的字面量和符号引用
- 具有动态性，运行期也可以将新常量放入池中

**重要变化：**
- JDK 1.7及之后，运行时常量池从方法区移到了元空间中

### 直接内存（Direct Memory）

**特点：**
- 不属于JVM运行时数据区
- 不受JVM GC管理
- JDK 1.4引入的NIO类使用
  - JDK1.4中新加入的 NIO（New Input/Output）类 ，引入了一种基于通道 （Channel）与缓存区 （Buffer）的I/O方式，它可以直接使用Native函数库直接分配堆外内存。

**使用场景：**
- 通过DirectByteBuffer对象引用堆外内存
- 避免Java堆和Native堆之间的数据复制，提高性能

**注意事项：**
- 受本机总内存和处理器寻址空间限制
- 可能导致OutOfMemoryError


### 程序计数器（Program Counter Register）

**特点：**
- 内存空间较小
- 存储当前线程执行的字节码行号指示器
- 线程私有，每个线程都有独立的程序计数器

**主要作用：**
1. 字节码解释器通过改变计数器值来选取下一条执行指令（实现分支、循环、跳转、异常处理等）
2. 多线程环境下记录线程执行位置，确保线程切换后能恢复到正确位置

**特殊性：** 这是唯一一个不会出现OutOfMemoryError的内存区域。

### Java虚拟机栈（Java Virtual Machine Stack）

<img :src="$withBase('/assets/images/interview/jvm/vmstack.png')" 
  alt="方法区内存区域"
  width="800px" 
  height="auto">

#### 特点：
- 线程私有，生命周期与线程相同
- 描述Java方法执行的内存模型
- 由多个栈帧（Stack Frame）组成

#### 栈帧结构：

- 局部变量表：存储基本数据类型、对象引用、returnAddress类型
- 操作数栈：用于在方法执行期间，临时存储计算过程的中间结果、操作数以及方法调用的返回值。 
- 动态链接：指向运行时常量池中该栈帧所属方法的引用。 [详见](./动态链接.md)
- 方法返回地址：方法退出后的返回位置

**可能抛出的异常：**
- **StackOverflowError**：栈深度超过虚拟机允许的深度
- **OutOfMemoryError**：栈动态扩展时无法申请到足够内存

**方法调用机制：**
- 方法调用时：栈帧入栈
- 方法返回时：栈帧出栈（正常return或抛出异常）

### 本地方法栈（Native Method Stack）

**特点：**
- 为Native方法服务（非Java代码实现的方法）
- 在HotSpot虚拟机中与Java虚拟机栈合二为一

**与虚拟机栈的区别：**
- 虚拟机栈服务于Java方法（字节码）
- 本地方法栈服务于Native方法

> [详见](./本地方法.md)


### 堆（Heap）

<img :src="$withBase('/assets/images/interview/jvm/heap.png')" 
  alt=""
  width="800px" 
  height="auto">

**特点：**
- JVM管理的最大内存区域
- 所有线程共享
- 虚拟机启动时创建
- 几乎所有对象实例和数组都在此分配内存

**分代结构：**
```
堆
├── 新生代（Young Generation）
│   ├── Eden区
│   ├── Survivor From区（S0）
│   └── Survivor To区（S1）
└── 老年代（Old Generation / Tenured）
```

**对象晋升机制：**
1. 对象首次在Eden区分配
2. Minor GC后存活对象进入Survivor区，年龄+1
3. 年龄达到阈值（默认15）后晋升到老年代
4. 可通过`-XX:MaxTenuringThreshold`参数设置阈值

**可能抛出的异常：**
- **OutOfMemoryError: Java heap space**


---

## 对象的创建与访问

### 对象创建流程

```
new指令
  ↓
① 类加载检查
  ↓
② 分配内存
  ↓
③ 初始化零值
  ↓
④ 设置对象头
  ↓
⑤ 执行<init>方法
  ↓
对象创建完成
```

**详细步骤：**

**① 类加载检查**
- 检查类的符号引用是否在常量池中
- 检查类是否已被加载、解析和初始化
- 若未加载，先执行类加载过程

**② 分配内存**

两种分配方式：

| 方式 | 适用场景 | GC收集器 |
|------|----------|----------|
| 指针碰撞 | 内存规整 | Serial、ParNew（带压缩整理） |
| 空闲列表 | 内存不规整 | CMS（标记-清除） |

**并发安全保障：**
- **CAS + 失败重试**：乐观锁方式保证原子性
- **TLAB**（Thread Local Allocation Buffer）：每线程预分配一块Eden区内存

**③ 初始化零值**
- 将分配的内存空间初始化为零值（对象头除外）
- 保证实例字段不赋初值也能使用

**④ 设置对象头**

对象头包含信息：
- 对象所属类的元数据指针
- 对象哈希码
- GC分代年龄
- 锁状态标志
- 偏向线程ID等

**⑤ 执行`<init>`方法**
- 按程序员意愿初始化对象
- 调用构造函数
- 至此，一个真正可用的对象创建完成

### 对象访问定位

Java程序通过栈上的reference引用操作堆上的对象，主要有两种方式：

**① 句柄访问**

```
栈                  堆
[reference] -----> [句柄池]
                      ├─→ 实例数据
                      └─→ 类型数据
```

<img :src="$withBase('/assets/images/jvm/image2.png')" 
  alt=""
  width="800px" 
  height="auto">

**优点：** reference存储稳定的句柄地址，对象移动时只需修改句柄中的指针

**② 直接指针访问**

<img :src="$withBase('/assets/images/jvm/image1.png')" 
  alt=""
  width="800px" 
  height="auto">

```
栈                  堆
[reference] -----> [对象实例]
                      └─→ 类型数据指针
```

**优点：** 速度快，节省一次指针定位开销

**HotSpot使用：** 直接指针方式

---

## 常见内存溢出场景

### Java堆溢出

**异常信息：** `java.lang.OutOfMemoryError: Java heap space`

**示例参数：**
```bash
# 内存限制 + OOM 时导出堆快照
-Xms20M -Xmx20M -XX:+HeapDumpOnOutOfMemoryError
# 内存限制 + GC 日志打印 
-verbose:gc -Xms20M -Xmx20M -XX:+PrintGCDetails
```

**排查步骤：**
1. 使用内存分析工具（如Eclipse Memory Analyzer）分析堆转储文件
2. 区分是内存泄漏（Memory Leak）还是内存溢出（Memory Overflow）
3. 内存泄漏：找到泄漏对象，修复代码
4. 内存溢出：检查是否可以调大堆内存，或优化代码减少内存占用

### 栈溢出

**异常信息：** `java.lang.StackOverflowError`

**常见原因：**
- 递归调用层次过深
- 循环调用未正常退出

### 方法区/元空间溢出

**JDK 1.7异常：** `java.lang.OutOfMemoryError: PermGen space`

**JDK 1.8异常：** `java.lang.OutOfMemoryError: Metaspace`

**常见原因：**
- 运行期生成大量类（如使用CGLib）
- 大量使用反射
- JSP页面过多

---

## JVM调优参数速查

### 堆内存配置

```bash
-Xms<size>          # 堆初始大小
-Xmx<size>          # 堆最大大小
-Xmn<size>          # 新生代大小
-XX:SurvivorRatio=n # Eden与Survivor比例（默认8:1:1）
```

### 栈内存配置

```bash
-Xss<size>          # 每个线程的栈大小
```

### 方法区/元空间配置

```bash
# JDK 1.8+
-XX:MetaspaceSize=<size>
-XX:MaxMetaspaceSize=<size>

# JDK 1.7
-XX:PermSize=<size>
-XX:MaxPermSize=<size>
```

### GC日志配置

```bash
-XX:+PrintGCDetails          # 打印GC详细信息
-XX:+PrintGCDateStamps       # 打印GC时间戳
-Xloggc:<file>               # GC日志输出文件
-XX:+HeapDumpOnOutOfMemoryError  # OOM时生成堆转储
-verbose:gc	打印 GC 的概要日志
```
