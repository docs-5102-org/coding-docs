---
title: Daemon守护线程
category:
  - java线程
tag:
  - daemon
---

# Java Daemon线程详解

## 什么是Daemon线程

Daemon线程（守护线程）是一种特殊的支持型线程，它主要用于程序中的后台调度和支持性工作。Daemon线程具有以下核心特征：

- **后台执行**：主要在后台执行支持性任务
- **JVM退出条件**：当Java虚拟机中不存在非Daemon线程时，JVM将会自动退出
- **自动终止**：当所有用户线程结束时，Daemon线程会被强制终止

## 如何创建Daemon线程

要将一个线程设置为Daemon线程，需要调用`Thread.setDaemon(true)`方法：

```java
Thread thread = new Thread(new MyRunnable());
thread.setDaemon(true);  // 设置为守护线程
thread.start();
```

## 重要注意事项

### 1. 设置时机限制

**Daemon属性必须在启动线程之前设置**，不能在线程启动后修改：

```java
Thread thread = new Thread(new MyRunnable());
thread.start();           // 线程已启动
thread.setDaemon(true);   // ❌ 错误！会抛出IllegalThreadStateException
```

正确的做法：

```java
Thread thread = new Thread(new MyRunnable());
thread.setDaemon(true);   // ✅ 正确！在启动前设置
thread.start();
```

### 2. finally块执行问题

Daemon线程中的finally块在JVM退出时**不一定会执行**。这是因为当所有用户线程结束时，JVM会立即退出，强制终止所有Daemon线程。

## 代码示例

### 示例1：基本Daemon线程行为

```java
public class Daemon {
    public static void main(String[] args) {
        Thread thread = new Thread(new DaemonRunner(), "DaemonRunner");
        thread.setDaemon(true);
        thread.start();
        // main线程结束后，JVM退出，Daemon线程被强制终止
    }
    
    static class DaemonRunner implements Runnable {
        @Override
        public void run() {
            try {
                SleepUtils.second(10);
            } finally {
                // 这个finally块可能不会执行
                System.out.println("DaemonThread finally run.");
            }
        }
    }
}
```

**运行结果**：没有任何输出，因为main线程结束后JVM立即退出，finally块未执行。

### 示例2：Daemon线程的继承性

```java
import java.util.concurrent.TimeUnit;

public class Daemons {
    public static void main(String[] args) throws InterruptedException {
        Thread d = new Thread(new Daemon());
        d.setDaemon(true);
        d.start();
        System.out.println("d.isDaemon() = " + d.isDaemon() + ".");
        TimeUnit.SECONDS.sleep(1);
    }
}

class DaemonSpawn implements Runnable {
    public void run() {
        while (true) {
            Thread.yield();
        }
    }
}

class Daemon implements Runnable {
    private Thread[] t = new Thread[10];
    
    public void run() {
        for (int i = 0; i < t.length; i++) {
            t[i] = new Thread(new DaemonSpawn());
            t[i].start();
            System.out.println("DaemonSpawn " + i + " started.");
        }
        
        for (int i = 0; i < t.length; i++) {
            System.out.println("t[" + i + "].isDaemon() = " + 
                              t[i].isDaemon() + ".");
        }
        
        while (true) {
            Thread.yield();
        }
    }
}
```

**运行结果**：
```
d.isDaemon() = true.
DaemonSpawn 0 started.
DaemonSpawn 1 started.
...
DaemonSpawn 9 started.
t[0].isDaemon() = true.
t[1].isDaemon() = true.
...
t[9].isDaemon() = true.
```

### 示例3：finally块执行对比

```java
import java.util.concurrent.TimeUnit;

public class DaemonsDontRunFinally {
    public static void main(String[] args) {
        Thread t = new Thread(new ADaemon());
        t.setDaemon(true);  // 设置为守护线程
        t.start();
    }
}

class ADaemon implements Runnable {
    public void run() {
        try {
            System.out.println("start ADaemon...");
            TimeUnit.SECONDS.sleep(1);
        } catch (InterruptedException e) {
            System.out.println("Exiting via InterruptedException");
        } finally {
            System.out.println("This should be always run ?");
        }
    }
}
```

**运行结果**（设置为Daemon线程）：
```
start ADaemon...
```

**运行结果**（注释掉setDaemon(true)）：
```
start ADaemon...
This should be always run ?
```

## 使用Daemon线程的注意事项

### 1. 设置时机
- `setDaemon(true)`必须在`start()`之前调用
- 否则会抛出`IllegalThreadStateException`异常

### 2. 继承性
- 在Daemon线程中创建的新线程也是Daemon线程
- 这种特性会自动传播给子线程

### 3. 资源访问限制
- **永远不要在Daemon线程中访问固有资源**（如文件、数据库）
- Daemon线程可能在任何时候被中断，甚至在操作进行到一半时
- 这可能导致数据不一致或资源泄露

### 4. 不可靠的清理
- finally块在JVM退出时不保证执行
- 不要依赖Daemon线程进行重要的清理工作

## 适用场景

Daemon线程适合以下场景：

1. **后台监控任务**：如系统监控、日志记录
2. **垃圾回收**：JVM的垃圾收集器就是Daemon线程
3. **心跳检测**：定期发送心跳包
4. **缓存清理**：定期清理过期缓存数据

## 最佳实践

1. **明确职责**：只用于后台支持性工作
2. **避免重要任务**：不要在Daemon线程中执行关键业务逻辑
3. **合理设计**：确保程序不依赖Daemon线程的完整执行
4. **资源管理**：避免在Daemon线程中操作重要资源

## 总结

Daemon线程是Java多线程编程中的重要概念，它为程序提供了后台支持服务。理解其特性和限制对于编写健壮的多线程程序至关重要。记住关键原则：Daemon线程是"可有可无"的后台服务，不应承担关键任务。